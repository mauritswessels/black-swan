/**
 * Pockets: divisions cut off from supply (supply.ts), grouped by where they stand.
 *
 * A pocket is a group of provinces next to each other, each holding divisions of one country
 * that get no supply at all. Divisions in a pocket lose organisation every day and then start
 * to starve, so the map rings each pocket with a count, and the trapped side is warned.
 */
import { PROVINCES } from './map';
import type { World } from './types';

export interface Pocket {
  owner: string;
  provinces: number[];
  divisions: number;
  /** The province with the most trapped divisions, where the count is shown. */
  centre: number;
}

/** Every pocket on the map today, the biggest first. Uses the supply worked out at the start of the day. */
export function pocketsOf(w: Pick<World, 'units'>): Pocket[] {
  // Trapped divisions by country and province. A division at sea or storming a beach is not in a pocket.
  const trapped = new Map<string, Map<number, number>>();
  for (const u of w.units) {
    if (u.supply > 0 || u.sea || u.landing || u.drop) continue;
    let m = trapped.get(u.owner);
    if (!m) trapped.set(u.owner, (m = new Map()));
    m.set(u.at, (m.get(u.at) ?? 0) + 1);
  }
  const pockets: Pocket[] = [];
  for (const owner of [...trapped.keys()].sort()) {
    const here = trapped.get(owner)!;
    const seen = new Set<number>();
    for (const start of [...here.keys()].sort((a, b) => a - b)) {
      if (seen.has(start)) continue;
      const group = [start];
      seen.add(start);
      for (let i = 0; i < group.length; i++) for (const n of PROVINCES[group[i]].neighbours) if (here.has(n) && !seen.has(n)) (seen.add(n), group.push(n));
      group.sort((a, b) => a - b);
      const divisions = group.reduce((a, p) => a + here.get(p)!, 0);
      const centre = group.reduce((a, p) => (here.get(p)! > here.get(a)! ? p : a), group[0]);
      pockets.push({ owner, provinces: group, divisions, centre });
    }
  }
  return pockets.sort((a, b) => b.divisions - a.divisions || a.centre - b.centre);
}

/** "12 divisions trapped", for the map and the warning. */
export const pocketWords = (n: number): string => `${n} ${n === 1 ? 'division' : 'divisions'} trapped`;
