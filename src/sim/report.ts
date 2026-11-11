/**
 * The end-of-term report card.
 */
import { BOTS } from './bots';
import { eventById } from './events';
import { initialState, isFinished, playedQuarters, step } from './model';
import { Rng } from './rng';
import { grade, quarterPoints, termScore } from './scoring';
import { distanceOutside, targetFor } from './targets';
import type { EconomyState, GameOverReason } from './types';

export interface TimelineItem {
  t: number;
  kind: 'rate' | 'guidance' | 'event' | 'fx';
  text: string;
}

export interface Report {
  score: number;
  grade: string;
  taylorScore: number;
  quartersPlayed: number;
  gameOver: GameOverReason | null;
  grades: { label: string; grade: string; detail: string }[];
  timeline: TimelineItem[];
  wentWell: string[];
  wentBadly: string[];
  points: number[];
}

const GUIDANCE_TEXT = {
  dataDependent: 'data-dependent',
  extended: '"rates on hold for an extended period"',
  readyToAct: '"ready to act against inflation"',
  fxReady: '"prepared to intervene in the currency market"',
} as const;

/** Play the same seed with the Taylor rule, for comparison. Same starting point and luck. */
export function taylorShadowScore(state: EconomyState): number {
  const bot = BOTS.find((b) => b.name === 'Taylor rule')!;
  let s = initialState(state.settings);
  const rng = new Rng(1);
  while (!isFinished(s)) s = step(s, bot.decide(s, rng));
  return termScore(s);
}

function letter(fraction: number): string {
  return grade(fraction * 100);
}

export function buildReport(state: EconomyState): Report {
  const qs = playedQuarters(state);
  const tgt = targetFor(state.settings.targetMode);
  const score = termScore(state);
  const n = Math.max(1, qs.length);

  const inBand = qs.filter((q) => distanceOutside(q.headline, tgt) === 0).length / n;
  const avgGap = qs.reduce((a, q) => a + Math.abs(q.outputGap), 0) / n;
  const maxRisk = Math.max(0, ...qs.map((q) => q.risk));
  const endCred = qs.length ? qs[qs.length - 1].credibility : 70;
  const brokenPromises = qs.filter((q, k) => k > 0 && q.credibility < qs[k - 1].credibility - 5).length;

  const grades = [
    { label: 'Price stability', grade: letter(inBand), detail: `Inflation was inside the ${tgt.low} to ${tgt.high}% band in ${Math.round(inBand * 100)}% of quarters.` },
    { label: 'Jobs and growth', grade: letter(Math.max(0, 1 - avgGap / 2.5)), detail: `The output gap averaged ${avgGap.toFixed(1)} points away from zero.` },
    { label: 'Financial stability', grade: letter(Math.max(0, 1 - maxRisk / 12)), detail: `Financial risk peaked at ${maxRisk.toFixed(1)} (crisis at 15).` },
    { label: 'Credibility', grade: letter(endCred / 100), detail: `You ended the term with credibility ${endCred.toFixed(0)}${brokenPromises ? ` after ${brokenPromises} sharp drop${brokenPromises > 1 ? 's' : ''}` : ''}.` },
  ];

  const timeline: TimelineItem[] = [];
  qs.forEach((q, k) => {
    const prevRate = k === 0 ? state.history[state.history.length - qs.length - 1].policyRate : qs[k - 1].policyRate;
    for (const id of q.events) timeline.push({ t: q.t, kind: 'event', text: eventById(id)?.title ?? id });
    if (q.policyRate !== prevRate) timeline.push({ t: q.t, kind: 'rate', text: `${q.policyRate > prevRate ? 'Raised' : 'Cut'} rates to ${q.policyRate.toFixed(2)}%` });
    if (k > 0 && q.guidance !== qs[k - 1].guidance) timeline.push({ t: q.t, kind: 'guidance', text: `Changed guidance to ${GUIDANCE_TEXT[q.guidance]}` });
    if (q.fxPurchases > 0) timeline.push({ t: q.t, kind: 'fx', text: `Bought foreign currency worth ${q.fxPurchases}% of GDP` });
  });

  const taylorScore = taylorShadowScore(state);
  const wentWell: string[] = [];
  const wentBadly: string[] = [];
  if (score > taylorScore + 2) wentWell.push(`You beat the Taylor rule by ${(score - taylorScore).toFixed(1)} points on the same luck. Judgment paid off.`);
  else if (score < taylorScore - 2) wentBadly.push(`A simple Taylor rule would have scored ${(taylorScore - score).toFixed(1)} points more on the same luck.`);
  if (inBand >= 0.8) wentWell.push('Inflation stayed in the target band almost all the time.');
  if (inBand < 0.5) wentBadly.push('Inflation was outside the target band more often than not.');
  if (avgGap < 0.8) wentWell.push('You kept the economy close to its normal level.');
  if (avgGap > 1.5) wentBadly.push('The economy spent long stretches far from its normal level.');
  if (brokenPromises > 0) wentBadly.push('Credibility took sharp hits. Breaking guidance or caving to politicians is remembered.');
  if (maxRisk > 8) wentBadly.push('A credit boom built up dangerous financial risk.');
  if (state.gameOver) wentBadly.unshift(GAME_OVER_TEXT[state.gameOver]);

  return {
    score,
    grade: grade(score),
    taylorScore,
    quartersPlayed: qs.length,
    gameOver: state.gameOver,
    grades,
    timeline,
    wentWell,
    wentBadly,
    points: qs.map((q) => quarterPoints(q.loss)),
  };
}

export const GAME_OVER_TEXT: Record<GameOverReason, string> = {
  fired: 'Credibility collapsed below 15 and the government dismissed you.',
  independenceRemoved: 'Public approval stayed below 25% and parliament removed the bank’s independence.',
  hyperinflation: 'Inflation ran above 10% for two quarters: the currency lost the public’s trust.',
  financialCrisis: 'The banking system collapsed in a financial crisis.',
};
