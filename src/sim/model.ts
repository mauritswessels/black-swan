/**
 * The economy of Kestria, one quarter at a time.
 *
 *   step(state, decision) -> next state
 *
 * This file is pure TypeScript with no UI. It never changes the state it is given:
 * it returns a new one. Given the same state and decision it always returns the
 * same result, because all randomness comes from the seeded generator stored in the state.
 *
 * Every equation is explained in plain words in MODEL.md (same numbering as here).
 */
import { drawErrors, latestRelease } from './data';
import { pruneEvents, rollEvent, sumShocks } from './events';
import { PARAMS as P } from './params';
import { Rng, seedFrom } from './rng';
import { taylorRate, toPolicyStep } from './rules';
import { distanceOutside, targetFor } from './targets';
import type { Decision, EconomyState, GameOverReason, Guidance, Quarter, Settings } from './types';

/** The thaler/aurel rate when the thaler is at its long-run value. */
const BASE_KST_PER_AUREL = 0.95;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Value of a series `k` quarters before the newest entry (k = 1 is the newest). */
function lag(history: Quarter[], k: number, pick: (q: Quarter) => number): number {
  const q = history[Math.max(0, history.length - k)];
  return pick(q);
}

export const DEFAULT_SETTINGS: Settings = { seed: 1, targetMode: 'range', quarters: 20 };

/** A calm economy sitting at its long-run resting point, with 8 quarters of history. */
export function initialState(partial: Partial<Settings> = {}): EconomyState {
  const settings: Settings = { ...DEFAULT_SETTINGS, ...partial };
  const target = targetFor(settings.targetMode);
  const pi = target.centre;
  const rate = toPolicyStep(P.rStar + pi);
  const zeroErrors = { gdp: 0, cpi: 0, core: 0, unemployment: 0, outputGap: 0 };
  const history: Quarter[] = [];
  for (let t = -8; t < 0; t++) {
    history.push({
      t,
      outputGap: 0,
      gdpGrowth: P.potentialGrowth,
      core: pi,
      headline: pi,
      unemployment: P.uStar,
      expectedInflation: pi,
      perceivedTarget: pi,
      policyRate: rate,
      realRate: rate - pi,
      thaler: 0,
      kstPerAurel: BASE_KST_PER_AUREL,
      energy: 0,
      foreignGap: 0,
      foreignRate: 2.5,
      yield2: rate + 0.2,
      yield5: rate + 0.35,
      yield10: rate + 0.5,
      mortgageRate: rate + 0.35 + P.mortgageSpread,
      houseGrowth: 4,
      creditGrowth: P.normalCreditGrowth,
      risk: 0,
      fxReserves: P.startingFxReserves,
      paperGain: 0,
      credibility: 70,
      approval: 60,
      guidance: 'dataDependent',
      fxPurchases: 0,
      loss: 0,
      errors: zeroErrors,
      events: [],
    });
  }
  return {
    settings,
    t: 0,
    rng: seedFrom(settings.seed),
    history,
    activeEvents: [],
    lastEventAt: -10,
    promise: null,
    marketExpectedRate: rate,
    lowApprovalQuarters: 0,
    highInflationQuarters: 0,
    gameOver: null,
  };
}

/** Markets' expected policy rate for each of the next `n` quarters. */
export function expectedRatePath(i: number, neutral: number, guidance: Guidance, credibility: number, n: number): number[] {
  const w = credibility / 100; // how much markets believe what we say
  const path: number[] = [];
  for (let k = 1; k <= n; k++) {
    const drift = neutral + (i - neutral) * P.rateReversion ** k;
    let said = drift;
    if (guidance === 'extended') said = k <= 4 ? i : neutral + (i - neutral) * P.rateReversion ** (k - 4);
    if (guidance === 'readyToAct') said = drift + (k <= 4 ? 0.125 * k : 0.5 * P.rateReversion ** (k - 4));
    path.push(w * said + (1 - w) * drift);
  }
  return path;
}

/** Bond yield for a maturity in years = average expected policy rate + term premium. (Equation 7) */
function bondYield(path: number[], years: number, uncertainty: number): number {
  const avg = mean(path.slice(0, years * 4));
  return avg + P.termPremiumBase * Math.sqrt(years) + uncertainty;
}

/** Apply one quarter: the player's decision, the economy's response, and the reaction. */
export function step(state: EconomyState, decision: Decision): EconomyState {
  if (state.gameOver) return state;
  const rng = new Rng(state.rng);
  const t = state.t;
  const h = state.history;
  const prev = h[h.length - 1];
  const target = targetFor(state.settings.targetMode);

  // ---- Events -----------------------------------------------------------------
  const newEvent = rollEvent(state, rng);
  let active = pruneEvents(state.activeEvents, t);
  if (newEvent) active = [...active, { id: newEvent, startedAt: t }];
  const shock = sumShocks(active, t);

  // ---- The decision ---------------------------------------------------------------
  const i = toPolicyStep(decision.rate);
  const fx = decision.fxPurchases;
  const pie = prev.expectedInflation; // formed at the end of last quarter

  // ---- Rest of the world -------------------------------------------------------------
  const foreignGap = 0.8 * prev.foreignGap + shock.foreign + rng.normal(P.noise.foreign);
  const foreignRate = 0.85 * prev.foreignRate + 0.15 * (2.5 + 0.5 * foreignGap) + shock.foreignRate;
  const energy = 0.75 * prev.energy + shock.energy + rng.normal(P.noise.energy);
  const energyYoY = energy - lag(h, 4, (q) => q.energy); // vs the same quarter last year

  // ---- Credibility affects how markets read our words ---------------------------------------
  const credibilityNow = prev.credibility;

  // (7) Bond yields: expected path of rates + term premium
  const neutral = P.rStar + pie;
  const path = expectedRatePath(i, neutral, decision.guidance, credibilityNow, 40);
  const uncertainty = 0.05 * Math.abs(prev.headline - target.centre);
  const yield2 = bondYield(path, 2, uncertainty);
  const yield5 = bondYield(path, 5, uncertainty);
  const yield10 = bondYield(path, 10, uncertainty);

  // (6) Exchange rate: reacts at once to rates, surprises, panic and intervention
  const surprise = i - state.marketExpectedRate;
  const relRateChange = i - foreignRate - (prev.policyRate - prev.foreignRate);
  const fxCalming = decision.guidance === 'fxReady' ? (-1.0 * credibilityNow) / 100 : 0;
  const thaler =
    P.fxPersistence * prev.thaler +
    P.fxRateEffect * relRateChange +
    P.fxSurpriseEffect * surprise +
    shock.haven -
    P.fxInterventionEffect * fx +
    fxCalming +
    rng.normal(P.noise.fx);

  // (1) Real interest rate
  const realRate = i - pie;
  // Effective real rate: past short rates (2 to 6 quarters ago) plus today's 5-year real yield
  const pastReal = P.rateLagWeights.reduce((acc, w, k) => acc + w * lag(h, k + 2, (q) => q.realRate), 0);
  // The current quarter's real rate enters the lag window from next quarter on.
  // (The normal term premium is taken out, so only unusual premiums, e.g. from QE or fear, matter.)
  const rEff = P.shortRateWeight * pastReal + (1 - P.shortRateWeight) * (yield5 - P.termPremiumBase * Math.sqrt(5) - pie);

  // (9) Housing and credit (driven by last quarter's conditions)
  const mortgageRate = yield5 + P.mortgageSpread;
  // The real mortgage rate in a calm economy; house prices grow 4% a year when mortgages cost this.
  const restingRealMortgage = P.rStar + P.termPremiumBase * Math.sqrt(5) + P.mortgageSpread;
  const houseGrowth =
    P.housePersistence * prev.houseGrowth +
    (1 - P.housePersistence) * (4 + P.houseGapEffect * prev.outputGap - P.houseRateEffect * (mortgageRate - pie - restingRealMortgage)) +
    shock.housing +
    rng.normal(P.noise.house);
  const creditGrowth = P.creditPersistence * prev.creditGrowth + (1 - P.creditPersistence) * (2 + 0.5 * houseGrowth);
  const risk = P.riskPersistence * prev.risk + Math.max(0, creditGrowth - P.normalCreditGrowth);

  // (2) Demand: the IS curve
  const outputGap =
    P.demandPersistence * prev.outputGap -
    P.demandRateEffect * (rEff - P.rStar) -
    P.demandFxEffect * prev.thaler +
    P.foreignSpillover * foreignGap +
    P.fiscalMultiplier * shock.fiscal +
    P.creditEffect * (creditGrowth - P.normalCreditGrowth) -
    (P.energyDrag * energyYoY) / 10 +
    shock.demand +
    rng.normal(P.noise.output);

  // (3) Inflation: the Phillips curve
  const fxChangeYear = prev.thaler - lag(h, 5, (q) => q.thaler); // change over the year to last quarter
  const core =
    P.inflationInertia * prev.core +
    (1 - P.inflationInertia) * pie +
    P.phillipsSlope * lag(h, 2, (q) => q.outputGap) -
    P.fxPassThrough * fxChangeYear +
    shock.supply +
    shock.wage +
    rng.normal(P.noise.core);
  const headline = core + P.energyWeight * energyYoY + rng.normal(P.noise.headline);

  // (5) Unemployment: Okun's law
  const unemployment = P.unemploymentSpeed * prev.unemployment + (1 - P.unemploymentSpeed) * (P.uStar - P.okunCoefficient * outputGap);

  // GDP growth (year on year) = normal growth + change in the output gap over the year
  const gdpGrowth = P.potentialGrowth + shock.productivity + (outputGap - lag(h, 4, (q) => q.outputGap));

  // (10) Balance sheet: valuation gains and losses on reserves
  const fxReserves = prev.fxReserves + fx;
  const paperGain = (-prev.fxReserves * (thaler - prev.thaler)) / 100;

  // Data the public will see (first estimates with errors)
  const errors = drawErrors(rng, shock.dataNoise);
  const publishedHeadline = headline + errors.cpi;

  // (11) Credibility
  let credibility = prev.credibility;
  credibility += P.credibilityDrift * (P.credibilityHome - credibility);
  const miss = distanceOutside(publishedHeadline, target);
  credibility += miss === 0 ? P.credibilityGainInBand : -P.credibilityLossPerPoint * miss;
  let promise = state.promise;
  if (promise && t - promise.madeAt >= 4) promise = null; // promise fulfilled
  if (promise && i !== promise.rate) {
    credibility -= P.credibilityBrokenGuidance; // broke "extended period" guidance
    promise = null;
  }
  if (prev.guidance === 'readyToAct' && i < prev.policyRate) credibility -= P.credibilityBrokenGuidance / 2;
  if (decision.guidance === 'extended' && !promise) promise = { rate: i, madeAt: t };
  if (decision.guidance !== 'extended' && promise && promise.madeAt === t) promise = null;
  credibility = clamp(credibility, 0, 100);

  // (12) Approval
  const approvalTarget =
    65 -
    8 * (unemployment - P.uStar) -
    5 * Math.max(0, headline - target.high) -
    3 * Math.max(0, target.low - headline) -
    2 * Math.max(0, mortgageRate - 3.5) +
    1.5 * Math.min(0, paperGain);
  const approval = clamp(prev.approval + P.approvalSpeed * (approvalTarget - prev.approval), 0, 100);

  // (4) Expectations for next quarter: anchored by credibility, otherwise backward-looking
  const anchor = P.anchorBase + P.anchorRange * (credibility / 100) ** 2;
  const recentInflation = mean([headline, ...[1, 2, 3].map((k) => lag(h, k, (q) => q.headline))]);
  // If inflation stays away from the target for long, people stop believing the target.
  // This drift is slow with high credibility and fast with low credibility.
  const driftSpeed = P.perceivedTargetDrift * (1.5 - credibility / 100);
  const perceivedTarget = prev.perceivedTarget + driftSpeed * (recentInflation - prev.perceivedTarget);
  const expectedInflation = anchor * perceivedTarget + (1 - anchor) * recentInflation;

  // (15) Loss for this quarter
  const inflGap =
    state.settings.targetMode === 'range'
      ? distanceOutside(headline, target) + 0.25 * Math.abs(headline - target.centre)
      : headline - target.centre;
  const riskPenalty = Math.max(0, risk - 3) / 2;
  const loss = inflGap ** 2 + 0.5 * outputGap ** 2 + 0.25 * (i - prev.policyRate) ** 2 + 0.5 * riskPenalty ** 2;

  const quarter: Quarter = {
    t,
    outputGap,
    gdpGrowth,
    core,
    headline,
    unemployment,
    expectedInflation,
    perceivedTarget,
    policyRate: i,
    realRate,
    thaler,
    kstPerAurel: BASE_KST_PER_AUREL / (1 + thaler / 100),
    energy,
    foreignGap,
    foreignRate,
    yield2,
    yield5,
    yield10,
    mortgageRate,
    houseGrowth,
    creditGrowth,
    risk,
    fxReserves,
    paperGain,
    credibility,
    approval,
    guidance: decision.guidance,
    fxPurchases: fx,
    loss,
    errors,
    events: newEvent ? [newEvent] : [],
  };

  // Game-over checks
  const highInflationQuarters = headline > 10 ? state.highInflationQuarters + 1 : 0;
  const lowApprovalQuarters = approval < 25 ? state.lowApprovalQuarters + 1 : 0;
  let gameOver: GameOverReason | null = null;
  if (highInflationQuarters >= 2) gameOver = 'hyperinflation';
  else if (risk > 15 || outputGap < -7) gameOver = 'financialCrisis';
  else if (lowApprovalQuarters >= 2) gameOver = 'independenceRemoved';
  else if (credibility < 15) gameOver = 'fired';

  const next: EconomyState = {
    ...state,
    t: t + 1,
    rng: rng.state,
    history: [...h, quarter],
    activeEvents: active,
    lastEventAt: newEvent ? t : state.lastEventAt,
    promise,
    marketExpectedRate: 0,
    lowApprovalQuarters,
    highInflationQuarters,
    gameOver,
  };

  // What markets expect next quarter's rate to be (used to measure surprises).
  const seen = latestRelease(next);
  // Markets expect the bank to move partway towards the Taylor rule, at most 0.5 points a quarter.
  const mechanical = i + clamp(0.3 * (taylorRate(seen.headline, seen.outputGap, target.centre) - i), -0.5, 0.5);
  const said = decision.guidance === 'extended' ? i : decision.guidance === 'readyToAct' ? i + 0.25 : mechanical;
  const w = credibility / 100;
  next.marketExpectedRate = w * said + (1 - w) * mechanical;
  return next;
}

/** True when the term is over (all quarters played or the game ended early). */
export function isFinished(state: EconomyState): boolean {
  return state.gameOver !== null || state.t >= state.settings.quarters;
}

/** The quarters played so far in this term (excludes the pre-term history). */
export function playedQuarters(state: EconomyState): Quarter[] {
  return state.history.filter((q) => q.t >= 0);
}
