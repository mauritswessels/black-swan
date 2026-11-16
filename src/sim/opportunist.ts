/**
 * Free-for-all: AI governments that look after themselves.
 *
 * With the historical timetable switched off, each AI country at peace looks around once a
 * month. A dictatorship is far more likely to act than a democracy.
 *
 *   Attack    it picks the neighbour it has the best odds against (its army against the
 *             target's and the target's protectors'), and declares war at 1.8 to 1 or better.
 *   Alliance  a country with a much stronger unfriendly neighbour proposes an alliance to
 *             another country that borders the same danger. The usual rules decide whether
 *             the other accepts (diplomacy.ts).
 *
 * The dice are seeded from the world's seed, the day and the country, so the same game always
 * goes the same way.
 */
import { COUNTRIES } from './countries';
import { alive, allied, alliesOf, governmentOf, hasPact, oddsAgainst, relation, strengths } from './diplomacy';
import { monthEnds } from './economy';
import { PROVINCES } from './map';
import { Rng, seedFrom } from './rng';
import type { Government, Order, World } from './types';
import { warKey } from './war';

/** Chance each month that a government at peace looks for a war. */
export const APPETITE: Record<Government, number> = { fascist: 0.25, communist: 0.2, authoritarian: 0.1, democracy: 0.02 };
export const ATTACK_ODDS = 1.8;
/** A neighbour this many times stronger, and on bad terms, is a danger. */
export const DANGER = 1.5;

/** Countries whose land touches this one's today. */
function neighbours(w: World, name: string): string[] {
  const out = new Set<string>();
  for (const p of PROVINCES) if (w.controller[p.id] === name) for (const n of p.neighbours) if (w.controller[n] !== name) out.add(w.controller[n]);
  return [...out].sort();
}

export function opportunistOrders(w: World): Order[] {
  if (!w.story.opportunist || !monthEnds(w.startDate, w.day - 1)) return [];
  const orders: Order[] = [];
  const s = strengths(w.units);
  const dip = w.diplomacy;
  for (const c of COUNTRIES) {
    const me = c.name;
    if (me === w.player || !alive(w, me) || !(s.get(me) ?? 0)) continue;
    const rng = new Rng(seedFrom(`${w.seed}:opportunist:${w.day}:${me}`));
    const roll = rng.next();
    const next = neighbours(w, me).filter((x) => alive(w, x));
    const atWar = w.wars.some((k) => k.split('|').includes(me));
    // A danger next door: look for a friend who shares it.
    const danger = next.filter((x) => (s.get(x) ?? 0) > DANGER * (s.get(me) ?? 0) && relation(dip, me, x) < 0 && !allied(dip, me, x)).sort((a, b) => (s.get(b) ?? 0) - (s.get(a) ?? 0))[0];
    if (danger && alliesOf(dip, me).length < 2) {
      const friend = neighbours(w, danger).filter((x) => x !== me && alive(w, x) && !allied(dip, x, me) && !allied(dip, x, danger) && !w.wars.includes(warKey(x, me)) && !((dip.rebuffs[`${me}>${x}:alliance`] ?? 0) > w.day)).sort((a, b) => relation(dip, me, b) - relation(dip, me, a) || (a < b ? -1 : 1))[0];
      if (friend) orders.push({ type: 'propose', by: me, to: friend, pact: 'alliance' });
    }
    if (atWar || roll >= APPETITE[governmentOf(w, me)]) continue;
    const target = next
      .filter((x) => !allied(dip, me, x) && !hasPact(dip, 'nonAggression', me, x) && !((dip.truces[warKey(me, x)] ?? 0) > w.day))
      .map((x) => ({ x, odds: oddsAgainst(w, me, x, 1) }))
      .filter((t) => t.odds >= ATTACK_ODDS)
      .sort((a, b) => b.odds - a.odds || (a.x < b.x ? -1 : 1))[0];
    if (target) orders.push({ type: 'declareWar', by: me, on: target.x });
  }
  return orders;
}
