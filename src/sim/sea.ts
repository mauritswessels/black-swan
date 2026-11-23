/**
 * The sea: the sea zones of the world (17 around Europe, the oceans beyond them since version
 * 1.7), which provinces have a coast on each, and who controls each zone today.
 *
 * The zone outlines are drawn by hand in scripts/build-sea.mjs, which also works out the coasts
 * and the days a fleet takes to sail from one zone to the next: 2 around Europe, and out on the
 * oceans the distance between the two zones' centres at 450 km a day (San Diego to Hawaii, about
 * 4,000 km, is 7 days; it is never less than 2).
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
import { distanceKm, EUROPEAN, OUTPOST, PROVINCES } from './map';
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
  /** Days to sail to each neighbour, in the same order. */
  days: number[];
}

export const ZONES = data.zones as unknown as SeaZone[];
export const ZONE_INDEX: Record<string, number> = Object.fromEntries(ZONES.map((z, i) => [z.id, i]));
export const zoneById = (id: string): SeaZone | undefined => ZONES[ZONE_INDEX[id]];
/** How many of the zones are the seas around Europe of versions 1.0 to 1.6. Their indexes come first. */
export const EUROPE_ZONES: number = data.europe;

/** For each province: the indexes of the sea zones it has a coast on. Empty for inland provinces. */
export const COAST: number[][] = PROVINCES.map((p) => (data.coast as Record<string, number[]>)[p.id] ?? []);
// A correction by hand: the Oslofjord opens onto the Skagerrak, which belongs to the Danish Straits zone here.
{
  const oslo = PROVINCES.find((p) => p.name === 'Oslo');
  const straits = ZONE_INDEX.kattegat;
  if (oslo && straits !== undefined && !COAST[oslo.id].includes(straits)) COAST[oslo.id] = [...COAST[oslo.id], straits].sort((a, b) => a - b);
}
/** For each zone: the provinces with a coast on it. */
export const SHORES: number[][] = ZONES.map((_, z) => PROVINCES.filter((p) => COAST[p.id].includes(z)).map((p) => p.id));
export const isCoastal = (province: number): boolean => COAST[province].length > 0;

/** How much each kind of ship counts in a fight for a zone. */
export const SHIP_POWER: Record<ShipKind, number> = { capital: 10, escort: 3, submarine: 1 };
export const SHIP_KINDS: ShipKind[] = ['capital', 'escort', 'submarine'];
export const shipCount = (f: Pick<Fleet, 'ships'>): number => f.ships.capital + f.ships.escort + f.ships.submarine;
export const fleetPower = (f: Pick<Fleet, 'ships'>): number => SHIP_KINDS.reduce((a, k) => a + f.ships[k] * SHIP_POWER[k], 0);

/**
 * The zones a ship passes going from one zone to another by the quickest way, both ends included.
 * `open` says which zones may be entered. Dijkstra's algorithm on the days between zones; when
 * two ways take as long, the one found first wins, so around Europe (2 days a zone) it picks the
 * same way the old count of zones did.
 */
export function zonePath(from: number, to: number, open?: (zone: number) => boolean): number[] | null {
  if (from === to) return [from];
  const days = new Array<number>(ZONES.length).fill(Infinity);
  const prev = new Array<number>(ZONES.length).fill(-1);
  const done = new Array<boolean>(ZONES.length).fill(false);
  // Found order: ties go to the zone found first.
  const found = new Array<number>(ZONES.length).fill(Infinity);
  let count = 0;
  days[from] = 0;
  found[from] = count++;
  for (;;) {
    let here = -1;
    for (let z = 0; z < ZONES.length; z++) if (!done[z] && days[z] < Infinity && (here < 0 || days[z] < days[here] || (days[z] === days[here] && found[z] < found[here]))) here = z;
    if (here < 0) return null;
    if (here === to) break;
    done[here] = true;
    const zone = ZONES[here];
    for (let i = 0; i < zone.neighbours.length; i++) {
      const n = zone.neighbours[i];
      if (done[n] || (open && !open(n))) continue;
      const d = days[here] + zone.days[i];
      if (d < days[n]) {
        days[n] = d;
        prev[n] = here;
        if (found[n] === Infinity) found[n] = count++;
      }
    }
  }
  const path = [to];
  for (let z = to; z !== from; z = prev[z]) path.unshift(prev[z]);
  return path;
}

/** Days to sail from a zone to a neighbouring one. */
export function legDays(from: number, to: number): number {
  const i = ZONES[from].neighbours.indexOf(to);
  return i < 0 ? 2 : ZONES[from].days[i];
}

/** Days a fleet takes to sail a path of zones (as zonePath gives it). */
export function sailDays(path: number[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += legDays(path[i - 1], path[i]);
  return total;
}

/** The zones off a country's home coast, the one nearest its capital first. Fixed from the 1936 map. */
export const HOME_ZONES: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  for (const cap of PROVINCES.filter((p) => p.capital)) {
    const best = new Map<number, number>();
    for (const p of PROVINCES) {
      // A European country's outposts (India, Indochina...) are too far to count, and leaving them out keeps its home waters as before 1.7.
      if (p.owner !== cap.owner || OUTPOST[p.id]) continue;
      const km = distanceKm(p.centre, cap.centre);
      for (const z of COAST[p.id]) best.set(z, Math.min(best.get(z) ?? Infinity, km));
    }
    // Only the coasts within reach of the capital: colonies do not make a sea a home water.
    out[cap.owner] = [...best.entries()].filter(([, km]) => km < 1500).sort((a, b) => a[1] - b[1] || a[0] - b[0]).map(([z]) => z);
  }
  return out;
})();

/** The zones that open onto the ocean, where trade with the rest of the world comes into Europe. */
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
    // Outside Europe (1.7) a country's trade comes straight to its own coast, through the zone off its capital.
    if (!EUROPEAN.has(name)) {
      out[name] = home.slice(0, 1);
      continue;
    }
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

/**
 * The sea as the AI of a country of the Europe-only map sees it in a war of that map: the oceans
 * added in 1.7 count as closed, so it ships its divisions where it did before (not round Africa).
 * Ports are unchanged.
 */
export const europeanSeas = (pic: SeaPicture): SeaPicture => ({ ...pic, status: (country, zone) => (zone >= EUROPE_ZONES ? 'enemy' : pic.status(country, zone)) });

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
 * would it cross? Returns the reason if it cannot. A landing needs the last zone to be its own,
 * unless it is `planned` as part of a joint attack, which waits for the fleet to clear it.
 */
export function seaRoute(sea: SeaPicture, country: string, from: number, to: number, landing: boolean, planned = false): { zones: number[] } | { why: string } {
  if (!COAST[from].length) return { why: `${PROVINCES[from].name} has no coast` };
  if (!COAST[to].length) return { why: `${PROVINCES[to].name} has no coast` };
  const open = (z: number) => sea.status(country, z) !== 'enemy';
  let best: number[] | null = null;
  let controlled = false;
  for (const end of COAST[to]) {
    // A joint attack (strike.ts) is planned before the fleet has cleared the sea: it only needs a way there.
    if (landing && !planned && sea.status(country, end) !== 'own') continue;
    controlled = true;
    if (!open(end) && !planned) continue;
    for (const start of COAST[from]) {
      if (!open(start)) continue;
      const path = zonePath(start, end, planned ? (z) => z === end || open(z) : open);
      if (path && (!best || sailDays(path) < sailDays(best))) best = path;
    }
  }
  if (best) return { zones: best };
  if (landing && !controlled) return { why: `you do not control the sea off ${PROVINCES[to].name} (${COAST[to].map((z) => ZONES[z].name).join(' or ')})` };
  return { why: 'the enemy controls the sea on the way' };
}
