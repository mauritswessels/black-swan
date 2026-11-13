/**
 * Supply: the food, fuel and ammunition a division needs every day.
 *
 * Two things decide how much of it arrives:
 *
 *   1. A link home. The province must connect, through land you control, to one of your
 *      depots. A depot is your capital, or the biggest city of each separate piece of your
 *      home territory (it stands for a port; real ports and sea routes come with the navy
 *      in Stage G). No link means no supply at all: the division is cut off.
 *   2. Room. A province can feed only so many divisions, depending on its roads and
 *      railways. Above that number everyone there goes short.
 *
 *   supply = 0                                  if cut off
 *   supply = min(1, capacity / divisions there) otherwise
 */
import { PROVINCES } from './map';
import type { Province, Terrain, World } from './types';

/** Roads and railways by terrain, on the design document's scale of 0 to 5. */
const TERRAIN_INFRASTRUCTURE: Record<Terrain, number> = { plains: 3, forest: 2, hills: 2, marsh: 1, mountains: 1, desert: 1 };

/**
 * Infrastructure of a province, 0 to 5. The map data has no road network yet, so this is an
 * estimate: better in open country, and better again around big cities and capitals.
 */
export function infrastructure(p: Province): number {
  return Math.min(5, TERRAIN_INFRASTRUCTURE[p.terrain] + (p.victoryPoints >= 5 ? 1 : 0) + (p.capital ? 1 : 0));
}

/** How many divisions a province can keep fully supplied. */
export const supplyCapacity = (province: number): number => 4 + 3 * infrastructure(PROVINCES[province]);

/** Each country's depots: the capital, or the biggest city, of every separate piece of its home territory. */
export const DEPOTS: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  const seen = new Set<number>();
  for (const start of PROVINCES) {
    if (seen.has(start.id)) continue;
    // Collect the connected group of provinces with the same 1936 owner.
    const group: Province[] = [];
    const queue = [start.id];
    seen.add(start.id);
    while (queue.length) {
      const p = PROVINCES[queue.pop()!];
      group.push(p);
      for (const n of p.neighbours) {
        if (!seen.has(n) && PROVINCES[n].owner === start.owner) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    const best = group.reduce((a, b) => (Number(b.capital) * 1000 + b.victoryPoints > Number(a.capital) * 1000 + a.victoryPoints ? b : a));
    (out[start.owner] ??= []).push(best.id);
  }
  return out;
})();

/**
 * For one country: which provinces have a link back to a depot. With allies (`friends`), the
 * link may run through allied land and end at an ally's depot: allies feed each other's armies.
 */
export function linkedProvinces(controller: string[], country: string, friends?: Set<string>): boolean[] {
  const linked = new Array<boolean>(PROVINCES.length).fill(false);
  const ours = (c: string) => c === country || !!friends?.has(c);
  const queue = (DEPOTS[country] ?? []).filter((d) => controller[d] === country);
  for (const f of friends ?? []) for (const d of DEPOTS[f] ?? []) if (controller[d] === f) queue.push(d);
  for (const d of queue) linked[d] = true;
  while (queue.length) {
    for (const n of PROVINCES[queue.pop()!].neighbours) {
      if (!linked[n] && ours(controller[n])) {
        linked[n] = true;
        queue.push(n);
      }
    }
  }
  return linked;
}

/** The supply level, 0 to 1, of every unit in the world, in the same order as world.units. */
export function supplyLevels(w: Pick<World, 'units' | 'controller'>, friends?: Map<string, Set<string>>): number[] {
  const count = new Array<number>(PROVINCES.length).fill(0);
  for (const u of w.units) count[u.at]++;
  const links = new Map<string, boolean[]>();
  return w.units.map((u) => {
    let linked = links.get(u.owner);
    if (!linked) links.set(u.owner, (linked = linkedProvinces(w.controller, u.owner, friends?.get(u.owner))));
    return linked[u.at] ? Math.min(1, supplyCapacity(u.at) / count[u.at]) : 0;
  });
}
