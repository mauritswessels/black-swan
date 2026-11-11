/**
 * The Monetary Policy Committee: five members with different instincts.
 *
 * Each member looks at the same published data (with all its errors) and forms a view
 * through their own lens. They are not always right: they see noisy first estimates,
 * and each one leans a particular way. Learning whom to trust, and when, is part of the game.
 */
import { releases } from './data';
import { PARAMS } from './params';
import { taylorRate, toPolicyStep } from './rules';
import { targetFor } from './targets';
import type { EconomyState } from './types';

export type MemberId = 'brandt' | 'rehm' | 'peyer' | 'sollberger' | 'arnaud';
export type Vote = 'hike' | 'hold' | 'cut';

export interface Member {
  id: MemberId;
  name: string;
  short: string;
  role: string;
  bio: string;
}

export const MEMBERS: Member[] = [
  { id: 'brandt', name: 'Konrad Brandt', short: 'K. Brandt', role: 'The hawk', bio: 'Thirty years at the bank. Remembers the inflation of his youth and never wants to see it again.' },
  { id: 'rehm', name: 'Tobias Rehm', short: 'T. Rehm', role: 'Financial stability', bio: 'Ran bank supervision through the last crisis. Watches mortgages and credit, not just prices.' },
  { id: 'peyer', name: 'Dr. Anouk Peyer', short: 'Dr. A. Peyer', role: 'Chief economist', bio: 'Leads the research staff. Data-driven, careful, and willing to say "it depends".' },
  { id: 'sollberger', name: 'Mira Sollberger', short: 'M. Sollberger', role: 'The dove', bio: 'A labour economist. Thinks unemployment is a cost that too many central bankers forget.' },
  { id: 'arnaud', name: 'Lisette Arnaud', short: 'L. Arnaud', role: "Exporters' voice", bio: 'Former head of a watchmaking firm. Feels every move in the thaler in her bones.' },
];

export interface Advice {
  member: Member;
  rate: number;
  vote: Vote;
  /** Their argument, in their own voice. */
  text: string;
  /** Suggested FX purchases (percent of GDP), if any. */
  fxPurchases: number;
}

const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const signed = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(2);

export function committeeAdvice(state: EconomyState): Advice[] {
  const tgt = targetFor(state.settings.targetMode);
  const rel = releases(state);
  const now = rel[rel.length - 1];
  const before = rel[rel.length - 2];
  const last = state.history[state.history.length - 1];
  const rate = last.policyRate;
  const energyActive = last.activeEvents.includes('energySpike') || last.activeEvents.includes('globalInflation');
  const pressure = last.events.includes('ministerPressure');
  const band = `${tgt.low} to ${tgt.high}%`;

  const vote = (r: number): Vote => (r > rate ? 'hike' : r < rate ? 'cut' : 'hold');
  const make = (id: MemberId, r: number, text: string, fxPurchases = 0): Advice => {
    const member = MEMBERS.find((m) => m.id === id)!;
    const stepRate = toPolicyStep(r);
    return { member, rate: stepRate, vote: vote(stepRate), text, fxPurchases };
  };
  // Members move at most 0.5 points in one meeting.
  const limited = (desired: number) => rate + Math.max(-0.5, Math.min(0.5, desired - rate));

  const advice: Advice[] = [];

  // --- Brandt, the hawk: headline inflation, extra weight on inflation, fears unanchoring.
  {
    const desired = limited(PARAMS.rStar + now.headline + 1.0 * (now.headline - tgt.centre) + 0.3 * now.outputGap + 0.25);
    const r = toPolicyStep(desired);
    let text: string;
    if (now.headline > tgt.high) text = `Inflation is ${f1(now.headline)}%, outside our ${band} band. Every quarter we wait, people get more used to it. I want ${f2(r)}% today, and I'd rather be early than sorry.`;
    else if (last.credibility < 55) text = `Our credibility is ${last.credibility.toFixed(0)}. Markets are starting to doubt us. A firm hand now is cheaper than a crisis later: ${f2(r)}%.`;
    else if (r < rate) text = `I'll accept ${f2(r)}%, reluctantly. Inflation is ${f1(now.headline)}%, so I can't argue for more. But don't let it become a habit.`;
    else text = `Inflation is ${f1(now.headline)}%. That's fine for now, but price stability is our job, not jobs. ${f2(r)}% keeps us honest.`;
    advice.push(make('brandt', r, text));
  }

  // --- Rehm, financial stability: like the chief economist, plus a housing and credit worry.
  const peyerDesired = (() => {
    const core = 0.6 * now.core + 0.4 * before.core;
    const gap = 0.6 * now.outputGap + 0.4 * before.outputGap;
    return { core, gap, rate: PARAMS.rStar + tgt.centre + 1.5 * (core + 0.25 * gap - tgt.centre) + 0.6 * gap };
  })();
  {
    const hot = last.houseGrowth > 6 || last.creditGrowth > 5.5 || last.risk > 3;
    const desired = limited(peyerDesired.rate + (hot ? 0.5 : 0));
    const r = toPolicyStep(desired);
    const text = hot
      ? `House prices are up ${f1(last.houseGrowth)}% on the year and credit is growing ${f1(last.creditGrowth)}%. That's how bubbles start. I want ${f2(r)}%, a little higher than the inflation numbers alone suggest.`
      : `Mortgage lending looks healthy, with house prices up ${f1(last.houseGrowth)}%. No reason for alarm on my side. I'd go with ${f2(r)}%.`;
    advice.push(make('rehm', r, text));
  }

  // --- Peyer, the chief economist: core inflation, blended data, gradual moves (the "smart" view).
  {
    const r = toPolicyStep(rate + 0.5 * (peyerDesired.rate - rate));
    const look = energyActive && now.headline - now.core > 0.4;
    let text: string;
    if (look) text = `Headline inflation is ${f1(now.headline)}%, but core, which strips out energy, is ${f1(now.core)}%. A rate rise can't make energy cheaper. I'd set ${f2(r)}% and watch for wages picking up.`;
    else if (Math.abs(now.outputGap - before.outputGap) > 0.6) text = `The first estimate says the output gap moved from ${f1(before.outputGap)} to ${f1(now.outputGap)}. First estimates are often revised, so I'd move gradually: ${f2(r)}%.`;
    else if (r === rate) text = `Core inflation is ${f1(now.core)}% and the output gap is about ${f1(peyerDesired.gap)}. Nothing here calls for a move. Hold at ${f2(r)}%.`;
    else text = `Core inflation is ${f1(now.core)}% and the output gap about ${f1(peyerDesired.gap)}. Remember our moves take a year or more to bite. A step to ${f2(r)}% (${signed(r - rate)}) is about right.`;
    advice.push(make('peyer', r, text));
  }

  // --- Sollberger, the dove: unemployment first, core inflation, slow to hike.
  {
    const desired = limited(PARAMS.rStar + now.core + 0.3 * (now.core - tgt.centre) + 0.9 * now.outputGap - 0.25);
    const r = toPolicyStep(desired);
    let text: string;
    if (now.unemployment > PARAMS.uStar + 0.3) text = `Unemployment is ${f1(now.unemployment)}% and rising. Behind that number are real families. I want ${f2(r)}%: let's not choke the economy to fix inflation that isn't there.`;
    else if (now.headline > tgt.high) text = `Yes, inflation is ${f1(now.headline)}%. But our moves take a year to work, and by then this may have passed. ${f2(r)}% is enough.`;
    else text = `Jobs are holding up at ${f1(now.unemployment)}% unemployment. Let's keep it that way. ${f2(r)}%.`;
    advice.push(make('sollberger', r, text));
  }

  // --- Arnaud, exporters' voice: the thaler.
  {
    const strong = last.thaler > 3;
    const desired = limited(peyerDesired.rate - (strong ? 0.5 : 0));
    const r = toPolicyStep(desired);
    const fx = strong && now.core < tgt.centre + 0.5 ? Math.min(5, Math.round(last.thaler - 2)) : 0;
    const text = strong
      ? `The thaler is ${f1(last.thaler)}% above its normal value, at ${last.kstPerAurel.toFixed(3)} per aurel. Our factories are losing orders. ${f2(r)}%${fx > 0 ? `, and I'd buy foreign currency worth ${fx}% of GDP to weaken it` : ''}.`
      : `The thaler is behaving, at ${last.kstPerAurel.toFixed(3)} per aurel. Exporters can live with it. I'd go with ${f2(r)}%.`;
    advice.push(make('arnaud', r, text, fx));
  }

  if (pressure) {
    const s = advice.find((a) => a.member.id === 'brandt')!;
    s.text += ' And let me say it plainly: we do not take orders from the Finance Ministry.';
  }
  return advice;
}

/** What the committee as a whole leans towards (the median member's rate). */
export function committeeMedian(advice: Advice[]): number {
  const rates = advice.map((a) => a.rate).sort((a, b) => a - b);
  return rates[Math.floor(rates.length / 2)];
}

/** For the end-of-term comparison. */
export function taylorFor(state: EconomyState): number {
  const rel = releases(state);
  const now = rel[rel.length - 1];
  return toPolicyStep(taylorRate(now.headline, now.outputGap, targetFor(state.settings.targetMode).centre));
}
