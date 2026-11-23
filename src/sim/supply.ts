/**
 * Supply: the food, fuel and ammunition a division needs every day.
 *
 * Two things decide how much of it arrives:
 *
 *   1. A link home. The province must connect, through land you control, to one of your
 *      depots. A depot is your capital, or the biggest city of each separate piece of your
 *      home territory. Supply also comes by sea: any coastal province you or an ally hold is
 *      a port, as long as the enemy does not control every sea zone off it (sea.ts). A depot
 *      overseas works only while ships can reach it. No link means no supply at all: the
 *      division is cut off.
 *   2. Room. A province can feed only so many divisions, depending on its roads and
 *      railways. Above that number everyone there goes short.
 *
 *   supply = 0                                  if cut off
 *   supply = min(1, capacity / divisions there) otherwise
 */
import { EUROPEAN, OUTPOST, PROVINCES } from './map';
import { goingWell } from './combat';
import { COAST, type SeaPicture } from './sea';
import type { Battle, Province, Terrain, World } from './types';

/** Roads and railways by terrain, on the design document's scale of 0 to 5. */
const TERRAIN_INFRASTRUCTURE: Record<Terrain, number> = { plains: 3, forest: 2, hills: 2, marsh: 1, mountains: 1, desert: 1 };

/**
 * Infrastructure of a province, 0 to 5. The map data has no road network yet, so this is an
 * estimate: better in open country, and better again around big cities and capitals.
 */
export function infrastructure(p: Province): number {
  return Math.min(5, TERRAIN_INFRASTRUCTURE[p.terrain] + (p.victoryPoints >= 5 ? 1 : 0) + (p.capital ? 1 : 0));
}

/** How many divisions a province can keep fully supplied (raised from 4 + 3 per level in version 1.3, so that a great front can feed the armies it had). */
export const supplyCapacity = (province: number): number => 5 + 4 * infrastructure(PROVINCES[province]);

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
        // An outpost (map.ts) and its owner's older lands are separate pieces, so the depots of the Europe-only map stay as they were.
        if (!seen.has(n) && PROVINCES[n].owner === start.owner && OUTPOST[n] === OUTPOST[start.id]) {
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

let COASTAL: number[] | null = null;
/** The provinces with a coast, in id order. Worked out once. */
const coastal = (): number[] => (COASTAL ??= PROVINCES.filter((p) => COAST[p.id].length).map((p) => p.id));

/**
 * For one country: which provinces have a link back to a depot. With allies (`friends`), the
 * link may run through allied land and end at an ally's depot: allies feed each other's armies.
 */
export function linkedProvinces(controller: string[], country: string, friends?: Set<string>, sea?: SeaPicture): boolean[] {
  const linked = new Array<boolean>(PROVINCES.length).fill(false);
  const ours = (c: string) => c === country || !!friends?.has(c);
  // The capital's depot always works. One overseas needs ships to reach it.
  const works = (d: number, of: string) => controller[d] === of && (!sea || PROVINCES[d].capital || !COAST[d].length || sea.port(country, d));
  const depots = (DEPOTS[country] ?? []).filter((d) => works(d, country));
  for (const f of friends ?? []) for (const d of DEPOTS[f] ?? []) if (works(d, f)) depots.push(d);
  // For a country of the Europe-only map, its outposts (map.ts) are a supply network of their own:
  // a depot in Siberia or Indochina feeds only the outposts, and the depots of the old map feed only
  // the old map, so supply in Europe runs as it did before 1.7.
  const split = EUROPEAN.has(country);
  for (const far of split ? [false, true] : [null]) {
    const inside = (p: number) => far === null || OUTPOST[p] === far;
    const queue = depots.filter(inside);
    for (const d of queue) linked[d] = true;
    // Ports: with somewhere to ship from, every friendly coast the enemy has not sealed off.
    if (sea && (queue.length || (far === true && depots.length))) {
      for (const p of coastal()) {
        if (!linked[p] && inside(p) && ours(controller[p]) && sea.port(country, p)) {
          linked[p] = true;
          queue.push(p);
        }
      }
    }
    while (queue.length) {
      for (const n of PROVINCES[queue.pop()!].neighbours) {
        if (!linked[n] && inside(n) && ours(controller[n])) {
          linked[n] = true;
          queue.push(n);
        }
      }
    }
  }
  return linked;
}

/** The supply level, 0 to 1, of every unit in the world, in the same order as world.units. */
export function supplyLevels(w: Pick<World, 'units' | 'controller'> & { battles?: Battle[]; asleep?: string[] }, friends?: Map<string, Set<string>>, sea?: SeaPicture): number[] {
  const count = new Array<number>(PROVINCES.length).fill(0);
  for (const u of w.units) count[u.at]++;
  const links = new Map<string, boolean[]>();
  // Supply follows a deep attack (combat.ts) through a province where its side's attack is going well.
  const pushed = (w.battles ?? []).filter(goingWell);
  const asleep = new Set(w.asleep ?? []);
  return w.units.map((u) => {
    // A country sitting out the war (World.asleep) stands on its own land with nobody to cut it off.
    if (asleep.has(u.owner)) return w.controller[u.at] === u.owner ? Math.min(1, supplyCapacity(u.at) / count[u.at]) : 0;
    let linked = links.get(u.owner);
    if (!linked) {
      const mine = pushed.filter((b) => b.attackers.includes(u.owner));
      let controller = w.controller;
      if (mine.length) {
        controller = [...w.controller];
        for (const b of mine) controller[b.province] = u.owner;
      }
      links.set(u.owner, (linked = linkedProvinces(controller, u.owner, friends?.get(u.owner), sea)));
    }
    return linked[u.at] ? Math.min(1, supplyCapacity(u.at) / count[u.at]) : 0;
  });
}
