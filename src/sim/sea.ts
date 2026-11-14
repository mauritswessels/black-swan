/**
 * The sea: 17 sea zones around Europe, which provinces have a coast on each, and who controls
 * each zone today.
 *
 * The zone outlines are drawn by hand in scripts/build-sea.mjs, which also works out the coasts.
 *
 * Control of a zone is worked out afresh every day from the fleets in it (navy.ts) and the
 * bombers flying over it (air.ts). For one country looking at one zone:
 *
 *   mine  = fighting strength of its own and its allies' fleets and naval bombers there
 *   enemy = the same for every country it is at war with
 *
 *   'own'        mine is at least twice the enemy's, and there is at least one friendly ship
 *   'enemy'      the enemy's is at least twice mine
 *   'contested'  both are there and neither has twice the other
 *   'open'       nobody is there
 *
 * You may ship troops through any zone that is not the enemy's. A landing on an enemy shore
 * needs the zone off that shore to be your own.
 */
import data from '../content/map/sea.json';
import { distanceKm, PROVINCES } from './map';
import type { Fleet, ShipKind, World } from './types';
import { atWar } from './war';

export interface SeaZone {
  id: string;
  name: string;
  /** Where its name and counters are drawn: [longitude, latitude]. */
  label: [number, number];
  /** A rough outline, [longitude, latitude] points. It may run over land. */
  outline: [number, number][];
  /** Indexes of the zones a ship can sail to from here. */
  neighbours: number[];
}

export const ZONES = data.zones as unknown as SeaZone[];
export const ZONE_INDEX: Record<string, number> = Object.fromEntries(ZONES.map((z, i) => [z.id, i]));
export const zoneById = (id: string): SeaZone | undefined => ZONES[ZONE_INDEX[id]];

/** For each province: the indexes of the sea zones it has a coast on. Empty for inland provinces. */
export const COAST: number[][] = PROVINCES.map((p) => (data.coast as Record<string, number[]>)[p.id] ?? []);
/** For each zone: the provinces with a coast on it. */
export const SHORES: number[][] = ZONES.map((_, z) => PROVINCES.filter((p) => COAST[p.id].includes(z)).map((p) => p.id));
export const isCoastal = (province: number): boolean => COAST[province].length > 0;

/** How much each kind of ship counts in a fight for a zone. */
export const SHIP_POWER: Record<ShipKind, number> = { capital: 10, escort: 3, submarine: 1 };
export const SHIP_KINDS: ShipKind[] = ['capital', 'escort', 'submarine'];
export const shipCount = (f: Pick<Fleet, 'ships'>): number => f.ships.capital + f.ships.escort + f.ships.submarine;
export const fleetPower = (f: Pick<Fleet, 'ships'>): number => SHIP_KINDS.reduce((a, k) => a + f.ships[k] * SHIP_POWER[k], 0);

/** The zones a ship passes going from one zone to another by the shortest way, both ends included. `open` says which zones may be entered. */
export function zonePath(from: number, to: number, open?: (zone: number) => boolean): number[] | null {
  if (from === to) return [from];
  const prev = new Array<number>(ZONES.length).fill(-1);
  const seen = new Array<boolean>(ZONES.length).fill(false);
  seen[from] = true;
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    for (const n of ZONES[queue[i]].neighbours) {
      if (seen[n] || (open && !open(n))) continue;
      seen[n] = true;
      prev[n] = queue[i];
      if (n === to) {
        const path = [to];
        for (let z = to; z !== from; z = prev[z]) path.unshift(prev[z]);
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

/** Days a fleet takes to sail from one zone to a neighbouring one. */
export const DAYS_PER_ZONE = 2;

/** The zones off a country's home coast, the one nearest its capital first. Fixed from the 1936 map. */
export const HOME_ZONES: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  for (const cap of PROVINCES.filter((p) => p.capital)) {
    const best = new Map<number, number>();
    for (const p of PROVINCES) {
      if (p.owner !== cap.owner) continue;
      const km = distanceKm(p.centre, cap.centre);
      for (const z of COAST[p.id]) best.set(z, Math.min(best.get(z) ?? Infinity, km));
    }
    // Only the coasts within reach of the capital: colonies do not make a sea a home water.
    out[cap.owner] = [...best.entries()].filter(([, km]) => km < 1500).sort((a, b) => a[1] - b[1] || a[0] - b[0]).map(([z]) => z);
  }
  return out;
})();

/** The zones that open onto the ocean, where trade with the rest of the world comes in. */
const OCEAN = ['approaches', 'biscay', 'iberian'].map((id) => ZONE_INDEX[id]);

/**
 * Share of a country's imports that has to come by sea. Britain is an island; Germany (iron ore
 * from Sweden, oil from Romania and the Soviet Union) and the Soviet Union can buy much of what
 * they need overland. Countries not listed: 0.5 if they have
 * a coast, 0 if they have none.
 */
const BY_SEA: Record<string, number> = { 'United Kingdom': 1, Ireland: 1, Italy: 0.8, Spain: 0.7, Portugal: 0.8, Greece: 0.8, France: 0.6, Germany: 0.1, Poland: 0.4, 'Soviet Union': 0.15, Norway: 0.8, Egypt: 0.8 };
export const seaDependence = (country: string): number => (TRADE_ROUTE[country]?.length ? BY_SEA[country] ?? 0.5 : 0);

/** The sea zones each country's imports cross, from the ocean to its home waters. Empty for countries without a coast. */
export const TRADE_ROUTE: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  for (const [name, home] of Object.entries(HOME_ZONES)) {
    let best: number[] | null = null;
    for (const h of home.slice(0, 3)) {
      for (const o of OCEAN) {
        const path = zonePath(o, h);
        if (path && (!best || path.length < best.length)) best = path;
      }
    }
    out[name] = best ?? [];
  }
  return out;
})();

export type SeaStatus = 'own' | 'enemy' | 'contested' | 'open';

/** Who has what in every zone today. Built once a day by navy.ts. */
export interface SeaPicture {
  /** For each zone: each country's fighting strength there (surface fleets on patrol or escort, plus naval bombers). */
  power: Map<string, number>[];
  /** For each zone: how many ships each country has there that can hold the zone. */
  ships: Map<string, number>[];
  status(country: string, zone: number): SeaStatus;
  /** For a country: is this coastal province open to its shipping (some zone off it is not the enemy's)? */
  port(country: string, province: number): boolean;
}

/** Work out control of the sea from each country's strength in each zone. */
export function seaPicture(w: Pick<World, 'wars'>, power: Map<string, number>[], ships: Map<string, number>[], friends: Map<string, Set<string>>): SeaPicture {
  const cache = new Map<string, SeaStatus[]>();
  const statuses = (country: string): SeaStatus[] => {
    let all = cache.get(country);
    if (all) return all;
    const mates = friends.get(country);
    all = ZONES.map((_, z) => {
      let mine = 0;
      let afloat = 0;
      let enemy = 0;
      for (const [name, x] of power[z]) {
        if (name === country || mates?.has(name)) mine += x;
        else if (atWar(w, country, name)) enemy += x;
      }
      for (const [name, n] of ships[z]) if (name === country || mates?.has(name)) afloat += n;
      if (mine <= 0 && enemy <= 0) return 'open';
      if (enemy >= 2 * mine) return 'enemy';
      if (mine >= 2 * enemy && afloat > 0) return 'own';
      return enemy > 0 ? 'contested' : 'open';
    });
    cache.set(country, all);
    return all;
  };
  return {
    power,
    ships,
    status: (country, zone) => statuses(country)[zone],
    port: (country, province) => {
      const s = statuses(country);
      return COAST[province].some((z) => s[z] !== 'enemy');
    },
  };
}

/** An empty sea: nobody controls anything. Used before the first day and in tests. */
export const calmSea = (): SeaPicture => seaPicture({ wars: [] }, ZONES.map(() => new Map()), ZONES.map(() => new Map()), new Map());

/**
 * Can this country ship a division from one coastal province to another, and how many zones
 * would it cross? Returns the reason if it cannot. A landing needs the last zone to be its own.
 */
export function seaRoute(sea: SeaPicture, country: string, from: number, to: number, landing: boolean): { zones: number[] } | { why: string } {
  if (!COAST[from].length) return { why: `${PROVINCES[from].name} has no coast` };
  if (!COAST[to].length) return { why: `${PROVINCES[to].name} has no coast` };
  const open = (z: number) => sea.status(country, z) !== 'enemy';
  let best: number[] | null = null;
  let controlled = false;
  for (const end of COAST[to]) {
    if (landing && sea.status(country, end) !== 'own') continue;
    controlled = true;
    if (!open(end)) continue;
    for (const start of COAST[from]) {
      if (!open(start)) continue;
      const path = zonePath(start, end, open);
      if (path && (!best || path.length < best.length)) best = path;
    }
  }
  if (best) return { zones: best };
  if (landing && !controlled) return { why: `you do not control the sea off ${PROVINCES[to].name} (${COAST[to].map((z) => ZONES[z].name).join(' or ')})` };
  return { why: 'the enemy controls the sea on the way' };
}
