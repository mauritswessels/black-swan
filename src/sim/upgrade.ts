/**
 * Bringing a world saved by an older version of the game up to date.
 *
 * Saves from version 10 (games 1.0 and 1.1) have no front line in their battles and no war
 * replay. Each battle starts its line at the border (0), and the replay starts recording from
 * the day the game is loaded. Saves from version 11 (game 1.2) have no armies: they start with none.
 * Saves from version 12 (game 1.3) have no paratroopers and no joint attacks: every country
 * gets an empty paratrooper production line and store, and there are no joint attacks waiting.
 * Their air wings and fleets are not aimed at anything, which is how they were.
 * Saves from version 13 and before (games up to 1.4) were made on the map of 183 provinces. The
 * finer map of 1.5 keeps those provinces, with the same numbers, and adds the parts split off
 * them after them (map.ts SPLIT_FROM). Each new part is held by whoever held the province it was
 * part of, and has no factories (they stay in the part that kept the old number).
 */
import { LINE_START } from './economy';
import { PROVINCES, SPLIT_FROM } from './map';
import { startReplay } from './replay';
import type { Economy, World } from './types';

/** A list with one entry for each province of the old, coarser map, extended to the new one: each new part takes `fill(parent's entry)`. */
function finer<T>(old: T[], fill: (parent: T) => T): T[] {
  if (old.length >= PROVINCES.length) return old;
  const out = [...old];
  for (const [part, from] of SPLIT_FROM) if (part >= old.length) out[part] = fill(old[from]);
  return out;
}

export function upgradeWorld(w: World): World {
  if (w.controller.length < PROVINCES.length) {
    const same = <T>(x: T) => x;
    const replay = w.replay ? { ...w.replay, base: finer(w.replay.base, same), now: finer(w.replay.now, same) } : w.replay;
    w = { ...w, controller: finer(w.controller, same), owner: finer(w.owner, same), factories: { civ: finer(w.factories.civ, () => 0), mil: finer(w.factories.mil, () => 0) }, replay };
  }
  const battles = w.battles.map((b) => {
    if (typeof b.line === 'number') return b;
    return { ...b, line: 0, push: 0 };
  });
  const economies: Record<string, Economy> = {};
  for (const [name, e] of Object.entries(w.economies)) {
    economies[name] = e.stock.airborne === undefined || !e.lines.airborne ? { ...e, stock: { ...e.stock, airborne: e.stock.airborne ?? 0 }, lines: { ...e.lines, airborne: e.lines.airborne ?? { factories: 0, efficiency: LINE_START } } } : e;
  }
  return { ...w, battles, economies, replay: w.replay ?? startReplay(w.controller, w.day), armies: w.armies ?? [], nextArmyId: w.nextArmyId ?? 0, strikes: w.strikes ?? [], nextStrikeId: w.nextStrikeId ?? 0 };
}
