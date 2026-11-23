/**
 * The map of the world on 1 January 1936, plus route finding.
 *
 * The data file is built by scripts/build-map.mjs from public-domain Natural Earth data. The
 * first 280 provinces are the map of Europe, North Africa and the Near East that versions 1.5
 * and 1.6 played on, with the same ids; the rest of the world (version 1.7) comes after them.
 */
import data from '../content/map/world1936.json';
import type { Province, Terrain, UnitType } from './types';
import { asin, cos, PI, sin } from './dmath';

export const PROVINCES = data.provinces as unknown as Province[];

/** How many provinces the Europe-only map of versions 1.5 and 1.6 had. Their ids are 0 to EUROPE_SIZE - 1. */
export const EUROPE_SIZE: number = data.europe;
/** The countries of the Europe-only map. */
export const EUROPEAN = new Set(PROVINCES.slice(0, EUROPE_SIZE).map((p) => p.owner));
/**
 * Outposts: the new provinces (1.7) of a country that was already on the Europe-only map, such
 * as British India, French Indochina or Soviet Siberia. For now they hold none of their owner's
 * industry or people and start without its divisions, so that the war in Europe plays as it did.
 */
export const OUTPOST: boolean[] = PROVINCES.map((p) => p.id >= EUROPE_SIZE && EUROPEAN.has(p.owner));
/**
 * A division of a country of the Europe-only map standing beyond that map: the Soviet Far East
 * army in Siberia (1.8), say. It plays no part in the quarrels of Europe, which count only the
 * divisions that stand there (diplomacy.ts `strengths`, the army commander's theatres in ai.ts).
 */
export const afar = (owner: string, at: number): boolean => at >= EUROPE_SIZE && EUROPEAN.has(owner);
/**
 * True when province `p`, held by `b`, lies off the Europe-only map as far as country `a` of that
 * map is concerned: an outpost of another country of that map, or the land of a country sitting
 * out the war (World.asleep). A war or a border between them does not reach it there, so their
 * quarrels play out where they did before 1.7.
 */
export const beyond = (p: number, a: string, b: string, asleep?: readonly string[]): boolean =>
  p >= EUROPE_SIZE && EUROPEAN.has(a) && (EUROPEAN.has(b) || !!asleep?.includes(b));

/**
 * The finer map (version 1.5) cut the biggest of the first 183 provinces into parts. Each cut
 * province kept its id and name for the part around its main place; the other parts were added
 * at the end. `partsOf` gives a province and every part cut from it, so a list of places
 * written for the old map ("mainland France", "the land Poland won in 1920") still covers it all.
 */
export const SPLIT_FROM: [number, number][] = data.splitFrom as [number, number][];
export const partsOf = (id: number): number[] => [id, ...SPLIT_FROM.filter(([, from]) => from === id).map(([part]) => part)];
export const KNOWN_GAPS: string[] = data.knownGaps;

/** Kilometres a division covers in a day on a good road across open country. */
export const SPEED_KM_PER_DAY: Record<UnitType, number> = { infantry: 25, armour: 60, artillery: 20, airborne: 25 };

/** How much slower each terrain is than open plains. */
export const TERRAIN_SLOWDOWN: Record<Terrain, number> = { plains: 1, forest: 1.4, hills: 1.5, marsh: 1.8, mountains: 2.2, desert: 1.5 };

/** Distance between two points on the Earth in kilometres (the "haversine" formula). */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const sLat = sin(dLat / 2);
  const sLon = sin(dLon / 2);
  const h = sLat * sLat + cos(a[1] * rad) * cos(b[1] * rad) * sLon * sLon;
  return 2 * 6371 * asin(Math.sqrt(h));
}

/** Days for a unit to walk from one province to a neighbour. The terrain you walk INTO sets the pace. */
export function daysToEnter(from: number, to: number, type: UnitType): number {
  const km = distanceKm(PROVINCES[from].centre, PROVINCES[to].centre);
  return (km * TERRAIN_SLOWDOWN[PROVINCES[to].terrain]) / SPEED_KM_PER_DAY[type];
}

/**
 * The quickest route between two provinces for this kind of unit, as a list of provinces to
 * walk through (not including the start). Returns null if there is no way by land.
 * `canEnter` says which provinces the unit is allowed into (its own land and its enemies').
 * This is Dijkstra's algorithm: always extend the cheapest route found so far.
 */
export function findRoute(from: number, to: number, type: UnitType, canEnter?: (province: number) => boolean): number[] | null {
  if (from === to) return [];
  const days = new Float64Array(PROVINCES.length).fill(Infinity);
  const prev = new Int32Array(PROVINCES.length).fill(-1);
  const done = new Uint8Array(PROVINCES.length);
  days[from] = 0;
  // A binary heap of [days, province], cheapest first; equal days go to the lower id, as the old scan did.
  const heap: number[] = [];
  const keys: number[] = [];
  const push = (p: number) => {
    heap.push(p);
    keys.push(days[p]);
    for (let i = heap.length - 1; i > 0; ) {
      const up = (i - 1) >> 1;
      if (!(keys[i] < keys[up] || (keys[i] === keys[up] && heap[i] < heap[up]))) break;
      [heap[i], heap[up]] = [heap[up], heap[i]];
      [keys[i], keys[up]] = [keys[up], keys[i]];
      i = up;
    }
  };
  const pop = (): number => {
    const top = heap[0];
    const lastP = heap.pop()!;
    const lastK = keys.pop()!;
    if (heap.length) {
      heap[0] = lastP;
      keys[0] = lastK;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && (keys[l] < keys[m] || (keys[l] === keys[m] && heap[l] < heap[m]))) m = l;
        if (r < heap.length && (keys[r] < keys[m] || (keys[r] === keys[m] && heap[r] < heap[m]))) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        [keys[i], keys[m]] = [keys[m], keys[i]];
        i = m;
      }
    }
    return top;
  };
  push(from);
  for (;;) {
    let here = -1;
    while (heap.length) {
      const key = keys[0];
      const p = pop();
      // An entry left behind by a later, cheaper find of the same province is skipped.
      if (!done[p] && key === days[p]) {
        here = p;
        break;
      }
    }
    if (here < 0) return null;
    if (here === to) break;
    done[here] = 1;
    for (const next of PROVINCES[here].neighbours) {
      if (canEnter && !canEnter(next)) continue;
      const d = days[here] + daysToEnter(here, next, type);
      if (d < days[next]) {
        days[next] = d;
        prev[next] = here;
        push(next);
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
