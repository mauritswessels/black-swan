/**
 * Headlines: how newspapers, markets, politicians and the public react to each quarter.
 * Generated from the model state, so the news always matches what actually happened.
 */
import { eventById } from './events';
import { PARAMS } from './params';
import type { EconomyState } from './types';

export type Source = 'Valden Ledger' | 'Markets' | 'Finance Ministry' | 'Unions' | 'Exporters' | 'Breaking';

export interface Headline {
  source: Source;
  text: string;
  /** Urgent items get a red label and can become a front-page card. */
  urgent: boolean;
}

const f2 = (x: number) => x.toFixed(2);
const abs1 = (x: number) => Math.abs(x).toFixed(1);

/** Headlines for the quarter that was just played (`after`), compared with the one before. */
export function headlinesFor(before: EconomyState, after: EconomyState): Headline[] {
  const prev = before.history[before.history.length - 1];
  const q = after.history[after.history.length - 1];
  const out: Headline[] = [];
  const change = q.policyRate - prev.policyRate;

  // Events that started this quarter come first.
  for (const id of q.events) {
    const ev = eventById(id);
    if (ev) out.push({ source: 'Breaking', text: ev.title, urgent: true });
  }

  // The decision itself, judged against expectations.
  const verb = change > 0 ? `raises rates by ${f2(change)} to ${f2(q.policyRate)}%` : change < 0 ? `cuts rates by ${f2(-change)} to ${f2(q.policyRate)}%` : `holds rates at ${f2(q.policyRate)}%`;
  if (Math.abs(q.surprise) >= 0.2) out.push({ source: 'Valden Ledger', text: `KNB surprises markets: bank ${verb}`, urgent: false });
  else out.push({ source: 'Valden Ledger', text: `KNB ${verb}, as markets expected`, urgent: false });

  // Market reaction: currency and bonds react at once.
  const fxMove = q.thaler - prev.thaler;
  if (Math.abs(fxMove) >= 0.8) out.push({ source: 'Markets', text: `Thaler ${fxMove > 0 ? 'jumps' : 'slides'} ${abs1(fxMove)}% against the aurel`, urgent: false });
  const yMove = q.yield2 - prev.yield2;
  if (Math.abs(yMove) >= 0.15) out.push({ source: 'Markets', text: `Two-year bond yield ${yMove > 0 ? 'rises' : 'falls'} to ${f2(q.yield2)}%`, urgent: false });
  if (q.fxPurchases > 0) out.push({ source: 'Markets', text: `KNB buys foreign currency worth ${q.fxPurchases}% of GDP to weaken the thaler`, urgent: false });
  if (q.paperGain < -2) out.push({ source: 'Valden Ledger', text: `Strong thaler costs the KNB a paper loss of ${abs1(q.paperGain)}% of GDP on its reserves`, urgent: false });

  // Words matter.
  if (q.guidance === 'extended' && prev.guidance !== 'extended') out.push({ source: 'Valden Ledger', text: 'Governor promises rates will stay put "for an extended period"', urgent: false });
  if (q.credibility < prev.credibility - 5) out.push({ source: 'Valden Ledger', text: 'Analysts: "The bank has broken its word. Why should we believe it next time?"', urgent: true });

  // Politics and the public.
  const pressured = before.activeEvents.some((e) => e.id === 'ministerPressure' && e.startedAt === before.t - 1);
  if (pressured && change < 0) out.push({ source: 'Valden Ledger', text: 'Critics ask whether the bank bowed to the Finance Minister', urgent: false });
  else if (pressured) out.push({ source: 'Finance Ministry', text: 'Minister Halder "deeply disappointed" that the bank ignored the government', urgent: false });
  else if (change > 0 && q.unemployment > PARAMS.uStar + 0.2) out.push({ source: 'Finance Ministry', text: `Minister Halder: rate rise "makes life harder for ${q.unemployment.toFixed(1)}% of workers without a job"`, urgent: false });
  if (q.headline > 3) out.push({ source: 'Unions', text: 'Unions: "Wages must catch up with prices"', urgent: false });
  if (q.thaler > 4) out.push({ source: 'Exporters', text: 'Exporters warn of job cuts as the strong thaler bites', urgent: false });

  return out;
}
