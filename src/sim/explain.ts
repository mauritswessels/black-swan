/**
 * "Why did that happen?"
 *
 * After each quarter, turn the model's drivers (the separate terms of equations 2 and 3
 * in MODEL.md) into short cause-and-effect chains, biggest effects first.
 */
import { eventById } from './events';
import { PARAMS } from './params';
import { targetFor } from './targets';
import type { EconomyState, Quarter } from './types';

export interface Chain {
  /** The steps, read left to right, e.g. ["Rate rise 4 quarters ago", "borrowing costs more", ...]. */
  steps: string[];
  /** Effect in percentage points (+ or -). */
  effect: number;
  /** Which number it moved. */
  on: 'output' | 'inflation';
}

const pts = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}`;
const MIN = 0.1;

/** The biggest rate change between 2 and 6 quarters before quarter q (that's when it bites). */
function rateChangeBehind(history: Quarter[], q: Quarter): { ago: number; from: number; to: number } | null {
  let best: { ago: number; from: number; to: number } | null = null;
  for (let ago = 2; ago <= 6; ago++) {
    const k = history.findIndex((h) => h.t === q.t - ago);
    if (k < 1) continue;
    const from = history[k - 1].policyRate;
    const to = history[k].policyRate;
    if (from !== to && (!best || Math.abs(to - from) > Math.abs(best.to - best.from))) best = { ago, from, to };
  }
  return best;
}

function eventNames(q: Quarter, kinds: string[]): string {
  const names = q.activeEvents.filter((id) => kinds.includes(id)).map((id) => eventById(id)?.title ?? id);
  return names[0] ?? '';
}

export function explainQuarter(state: EconomyState): Chain[] {
  const h = state.history;
  const q = h[h.length - 1];
  const prev = h[h.length - 2];
  const d = q.drivers;
  const tgt = targetFor(state.settings.targetMode);
  const chains: Chain[] = [];

  // ---- Output ----
  if (Math.abs(d.gapRates) >= MIN) {
    const move = rateChangeBehind(h, q);
    const first = move
      ? `Rate ${move.to > move.from ? 'rise' : 'cut'} ${move.ago} quarters ago (${move.from.toFixed(2)}% → ${move.to.toFixed(2)}%)`
      : d.gapRates < 0
        ? 'Real interest rates above neutral'
        : 'Real interest rates below neutral';
    const mid = d.gapRates < 0 ? ['borrowing costs more', 'firms and households spend less'] : ['borrowing is cheap', 'firms and households spend more'];
    chains.push({ steps: [first, ...mid, `output gap ${pts(d.gapRates)}`], effect: d.gapRates, on: 'output' });
  }
  if (Math.abs(d.gapThaler) >= MIN) {
    chains.push({
      steps: [
        `Thaler ${prev.thaler >= 0 ? `${prev.thaler.toFixed(1)}% above` : `${(-prev.thaler).toFixed(1)}% below`} normal`,
        d.gapThaler < 0 ? 'our exports look expensive abroad' : 'our exports look cheap abroad',
        `output gap ${pts(d.gapThaler)}`,
      ],
      effect: d.gapThaler,
      on: 'output',
    });
  }
  if (Math.abs(d.gapForeign) >= MIN) {
    chains.push({
      steps: [q.foreignGap < 0 ? 'Continental Union economy weak' : 'Continental Union economy strong', q.foreignGap < 0 ? 'fewer orders for our exporters' : 'more orders for our exporters', `output gap ${pts(d.gapForeign)}`],
      effect: d.gapForeign,
      on: 'output',
    });
  }
  if (Math.abs(d.gapEnergy) >= MIN) {
    chains.push({ steps: [d.gapEnergy < 0 ? 'Expensive energy' : 'Cheap energy', d.gapEnergy < 0 ? 'households have less left to spend' : 'households have more left to spend', `output gap ${pts(d.gapEnergy)}`], effect: d.gapEnergy, on: 'output' });
  }
  if (Math.abs(d.gapCredit) >= MIN) {
    chains.push({ steps: [`Credit growing ${q.creditGrowth.toFixed(1)}% a year`, d.gapCredit > 0 ? 'easy loans fuel spending' : 'tight loans hold spending back', `output gap ${pts(d.gapCredit)}`], effect: d.gapCredit, on: 'output' });
  }
  if (Math.abs(d.gapShocks) >= MIN) {
    const name = eventNames(q, ['confidenceBoom', 'electionSpree', 'pandemic', 'bankTrouble']) || 'A shock to demand';
    chains.push({ steps: [name, d.gapShocks > 0 ? 'more spending' : 'less spending', `output gap ${pts(d.gapShocks)}`], effect: d.gapShocks, on: 'output' });
  }

  // ---- Inflation ----
  if (Math.abs(d.inflEnergy) >= MIN) {
    chains.push({ steps: [`Energy prices ${d.inflEnergy > 0 ? 'up' : 'down'} on a year ago`, d.inflEnergy > 0 ? 'fuel and heating cost more' : 'fuel and heating cost less', `headline inflation ${pts(d.inflEnergy)}`], effect: d.inflEnergy, on: 'inflation' });
  }
  if (Math.abs(d.inflDemand) >= MIN) {
    const gap2 = h[h.length - 3]?.outputGap ?? 0;
    chains.push({
      steps: [`Economy running ${gap2 > 0 ? 'hot' : 'cold'} two quarters ago (gap ${pts(gap2)})`, gap2 > 0 ? 'firms can raise prices' : 'firms struggle to raise prices', `core inflation ${pts(d.inflDemand)}`],
      effect: d.inflDemand,
      on: 'inflation',
    });
  }
  if (Math.abs(d.inflThaler) >= MIN) {
    chains.push({ steps: [d.inflThaler < 0 ? 'Thaler stronger than a year ago' : 'Thaler weaker than a year ago', d.inflThaler < 0 ? 'imports get cheaper' : 'imports get dearer', `core inflation ${pts(d.inflThaler)}`], effect: d.inflThaler, on: 'inflation' });
  }
  const expDeviation = d.inflExpectations - (1 - PARAMS.inflationInertia) * tgt.centre;
  if (Math.abs(expDeviation) >= MIN) {
    chains.push({
      steps: [`People expected ${prev.expectedInflation.toFixed(1)}% inflation (target ${tgt.centre}%)`, 'they set wages and prices to match', `core inflation ${pts(expDeviation)}`],
      effect: expDeviation,
      on: 'inflation',
    });
  }
  if (Math.abs(d.inflShocks) >= MIN) {
    const name = eventNames(q, ['wageDeal', 'pandemic', 'techBoom', 'globalInflation']) || 'Cost pressures';
    chains.push({ steps: [name, d.inflShocks > 0 ? 'costs rise' : 'costs fall', `core inflation ${pts(d.inflShocks)}`], effect: d.inflShocks, on: 'inflation' });
  }

  return chains.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)).slice(0, 4);
}
