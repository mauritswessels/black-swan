/**
 * The map of Europe on 1 January 1936, plus route finding.
 *
 * The data file is built by scripts/build-map.mjs from public-domain Natural Earth data.
 */
import data from '../content/map/europe1936.json';
import type { Province, Terrain, UnitType } from './types';

export const PROVINCES = data.provinces as unknown as Province[];
export const KNOWN_GAPS: string[] = data.knownGaps;

/** Kilometres a division covers in a day on a good road across open country. */
export const SPEED_KM_PER_DAY: Record<UnitType, number> = { infantry: 25, armour: 60, artillery: 20 };

/** How much slower each terrain is than open plains. */
export const TERRAIN_SLOWDOWN: Record<Terrain, number> = { plains: 1, forest: 1.4, hills: 1.5, marsh: 1.8, mountains: 2.2, desert: 1.5 };

/** Distance between two points on the Earth in kilometres (the "haversine" formula). */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Days for a unit to walk from one province to a neighbour. The terrain you walk INTO sets the pace. */
export function daysToEnter(from: number, to: number, type: UnitType): number {
  const km = distanceKm(PROVINCES[from].centre, PROVINCES[to].centre);
  return (km * TERRAIN_SLOWDOWN[PROVINCES[to].terrain]) / SPEED_KM_PER_DAY[type];
}

/**
 * The quickest route between two provinces for this kind of unit, as a list of provinces to
 * walk through (not including the start). Returns null if there is no way by land.
 * This is Dijkstra's algorithm: always extend the cheapest route found so far.
 */
export function findRoute(from: number, to: number, type: UnitType): number[] | null {
  if (from === to) return [];
  const days = new Array<number>(PROVINCES.length).fill(Infinity);
  const prev = new Array<number>(PROVINCES.length).fill(-1);
  const done = new Array<boolean>(PROVINCES.length).fill(false);
  days[from] = 0;
  for (;;) {
    let here = -1;
    for (let i = 0; i < days.length; i++) if (!done[i] && days[i] < Infinity && (here < 0 || days[i] < days[here])) here = i;
    if (here < 0) return null;
    if (here === to) break;
    done[here] = true;
    for (const next of PROVINCES[here].neighbours) {
      const d = days[here] + daysToEnter(here, next, type);
      if (d < days[next]) {
        days[next] = d;
        prev[next] = here;
      }
    }
  }
  const route: number[] = [];
  for (let p = to; p !== from; p = prev[p]) route.unshift(p);
  return route;
}

/** Total walking time for a route, in days. */
export function routeDays(from: number, route: number[], type: UnitType): number {
  let total = 0;
  let here = from;
  for (const next of route) {
    total += daysToEnter(here, next, type);
    here = next;
  }
  return total;
}

export function provinceByName(name: string): Province {
  const p = PROVINCES.find((q) => q.name === name || q.city === name);
  if (!p) throw new Error(`No province called ${name}`);
  return p;
}
