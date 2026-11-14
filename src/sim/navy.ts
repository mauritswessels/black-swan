/**
 * The navy, kept simple: fleets are assigned to a sea zone and a mission, and the game works
 * out the fighting. Nobody steers single ships.
 *
 * Every day, in every sea zone:
 *
 *   1. Battle. A country's surface fleets (on patrol or escort) are hit by every enemy fleet
 *      and naval bomber in the zone:
 *
 *        strength lost = 1.5% x enemy fighting strength x luck (0.7 to 1.3)
 *
 *      where fighting strength = 10 per capital ship + 3 per escort + 1 per submarine. The
 *      loss is spread over the fleet's ships. A fleet in port takes no part; a weaker fleet
 *      that stays at sea is ground down in a few weeks, so it should leave.
 *   2. The convoy war. Raiders (submarines above all) do not fight fleets; they sink merchant
 *      ships. Enemy escorts hunt them:
 *
 *        submarines lost a day = 0.4% x enemy escorts in the zone x luck
 *
 *   3. Blockade. For each zone on a country's trade route (sea.ts):
 *
 *        share sunk = raiders / (raiders + 2 x escorts + 6), at most 70%
 *                     or 90% if the enemy controls the zone outright
 *
 *      The shares multiply along the route. What is sunk never arrives: imported steel and
 *      oil, and (for a country that lives by the sea) food for the shops. See economy.ts.
 *
 * Troops go by sea too: a transport to friendly shores takes a few days, a landing on an
 * enemy shore needs two weeks of preparation, control of the sea off the beach, and the
 * attackers fight at 60% as they come ashore.
 */
import { COUNTRIES } from './countries';
import { PROVINCES } from './map';
import { modsOf, type Mods } from './mods';
import { Rng } from './rng';
import { COAST, DAYS_PER_ZONE, fleetPower, HOME_ZONES, seaPicture, seaRoute, shipCount, SHIP_KINDS, TRADE_ROUTE, ZONE_INDEX, zonePath, ZONES, type SeaPicture } from './sea';
import type { Economy, Fleet, FleetMission, ForceEvent, Order, ShipKind, Unit, World } from './types';
import { atWar, enemiesOf } from './war';

/** Share of the enemy's fighting strength a fleet loses each day of battle. */
export const NAVAL_DAMAGE = 0.015;
/** Submarines sunk per day by each enemy escort hunting in the zone. */
export const SUB_HUNT = 0.004;
/** How much of its strength a fleet brings to the fight for a zone, by mission. */
export const MISSION_POWER: Record<FleetMission, number> = { patrol: 1, escort: 0.7, raid: 0, port: 0 };
export const MAX_SUNK = 0.7;
export const BLOCKADE_SUNK = 0.9;
/** Days to get a division onto ships for a friendly shore, and to prepare a landing on an enemy one. */
export const TRANSPORT_DAYS = 3;
export const LANDING_PREP_DAYS = 14;
/** Divisions that can prepare a landing through one zone at once: this many, plus one for each friendly surface ship there. */
export const LANDING_BASE = 2;

export const MISSION_NAME: Record<FleetMission, string> = { patrol: 'Patrol', escort: 'Escort convoys', raid: 'Raid convoys', port: 'Stay in port' };
export const MISSION_NOTE: Record<FleetMission, string> = {
  patrol: 'Fights any enemy fleet, holds the zone and covers landings.',
  escort: 'Guards merchant ships and hunts submarines. Fights at 70% if an enemy fleet comes.',
  raid: 'Avoids battle and sinks enemy merchant ships. Best for submarines.',
  port: 'Safe in harbour, but it controls nothing.',
};

/** The navies of 1936 in rough numbers: [name, zone, capital ships, escorts, submarines]. Escorts and submarines are counted in flotillas. */
const START_FLEETS: Record<string, [string, string, number, number, number][]> = {
  'United Kingdom': [['Home Fleet', 'north', 7, 10, 3], ['Channel Force', 'channel', 1, 5, 0], ['Western Approaches Command', 'approaches', 1, 8, 0], ['Gibraltar Squadron', 'westmed', 2, 3, 0], ['Mediterranean Fleet', 'eastmed', 4, 6, 2]],
  France: [['Atlantic Fleet', 'biscay', 3, 6, 3], ['Mediterranean Fleet', 'westmed', 4, 8, 5]],
  Italy: [['1st Squadron', 'centralmed', 3, 6, 6], ['2nd Squadron', 'tyrrhenian', 1, 6, 4]],
  Germany: [['Fleet', 'north', 3, 4, 0], ['Baltic Station', 'baltic', 0, 2, 0], ['U-boat Arm', 'north', 0, 0, 3]],
  'Soviet Union': [['Baltic Fleet', 'bothnia', 2, 5, 7], ['Black Sea Fleet', 'black', 1, 4, 5], ['Northern Flotilla', 'barents', 0, 1, 2]],
  Spain: [['Fleet', 'westmed', 2, 5, 2]],
  Netherlands: [['Fleet', 'north', 0, 4, 2]],
  Sweden: [['Coastal Fleet', 'baltic', 1, 4, 3]],
  Norway: [['Fleet', 'north', 0, 2, 1]],
  Denmark: [['Fleet', 'kattegat', 0, 2, 1]],
  Poland: [['Fleet', 'baltic', 0, 2, 1]],
  Finland: [['Coastal Fleet', 'bothnia', 0, 1, 1]],
  Greece: [['Fleet', 'aegean', 0, 3, 1]],
  Turkey: [['Fleet', 'aegean', 1, 2, 1]],
  Yugoslavia: [['Fleet', 'adriatic', 0, 2, 0]],
  Romania: [['Fleet', 'black', 0, 2, 0]],
  Portugal: [['Fleet', 'iberian', 0, 2, 0]],
};

export function startFleets(): Fleet[] {
  const fleets: Fleet[] = [];
  for (const c of COUNTRIES) {
    for (const [name, zone, capital, escort, submarine] of START_FLEETS[c.name] ?? []) {
      fleets.push({ id: fleets.length, owner: c.name, name, zone, mission: capital + escort === 0 ? 'raid' : 'patrol', ships: { capital, escort, submarine }, arrives: 0 });
    }
  }
  return fleets;
}

/** The parts of the world the navy and the air force read and change during a day. */
export interface ForceDraft {
  day: number;
  units: Unit[];
  controller: string[];
  owner: string[];
  wars: string[];
  capitulated: string[];
  economies: Record<string, Economy>;
  factories: World['factories'];
  fleets: Fleet[];
  wings: World['wings'];
  nextForceId: number;
  bombed: Record<number, number>;
  clashes: string[];
  forceLog: ForceEvent[];
  nextForceEventId: number;
}

export function logForce(d: Pick<ForceDraft, 'day' | 'forceLog' | 'nextForceEventId'>, kind: ForceEvent['kind'], text: string, countries: string[], where: { zone?: string; province?: number } = {}): void {
  d.forceLog.push({ id: d.nextForceEventId++, day: d.day, kind, text, countries, ...where });
  if (d.forceLog.length > 60) d.forceLog = d.forceLog.slice(-60);
}

type NavalView = Pick<World, 'fleets' | 'wars' | 'day' | 'economies'>;

/** Is the fleet in its zone (not still sailing there)? */
export const arrived = (f: Fleet, day: number): boolean => day >= f.arrives;

const modCache = (economies: Record<string, Economy>) => {
  const cache = new Map<string, Mods>();
  return (owner: string): Mods => {
    let m = cache.get(owner);
    if (!m) cache.set(owner, (m = modsOf(economies[owner])));
    return m;
  };
};

/**
 * Who controls each sea zone today. `navalAir` is the strength of each country's naval bombers
 * over each zone (air.ts), if any.
 */
export function navalPicture(w: NavalView, friends: Map<string, Set<string>>, navalAir?: Map<string, number>[]): SeaPicture {
  const power = ZONES.map((_, z) => new Map(navalAir?.[z] ?? []));
  const ships = ZONES.map(() => new Map<string, number>());
  const mods = modCache(w.economies);
  for (const f of w.fleets) {
    const share = MISSION_POWER[f.mission];
    if (!share || !arrived(f, w.day)) continue;
    const z = ZONE_INDEX[f.zone];
    power[z].set(f.owner, (power[z].get(f.owner) ?? 0) + fleetPower(f) * share * (1 + mods(f.owner).navalPower));
    ships[z].set(f.owner, (ships[z].get(f.owner) ?? 0) + f.ships.capital + f.ships.escort);
  }
  return seaPicture(w, power, ships, friends);
}

/** How many merchant ships a fleet on a raid can sink. */
const raidPower = (f: Fleet, m: Mods): number => f.ships.submarine * (1 + m.subRaiding) + 2 * f.ships.capital + 0.5 * f.ships.escort;
/** How well a fleet guards convoys and hunts submarines. */
const escortPower = (f: Fleet, m: Mods): number => (f.mission === 'escort' ? 1 : f.mission === 'patrol' ? 0.3 : 0) * f.ships.escort * (1 + m.antiSub);

/** What is happening to one country's trade in one zone of its route. */
export interface RouteLeg {
  zone: number;
  raiders: number;
  escorts: number;
  blockaded: boolean;
  /** Share of the cargo sunk in this zone, 0 to 0.9. */
  sunk: number;
}

/** The state of a country's sea trade today, zone by zone, and the share of cargo lost in all. */
export function tradeRoute(w: NavalView, sea: SeaPicture, friends: Map<string, Set<string>>, country: string): { legs: RouteLeg[]; lost: number } {
  const mods = modCache(w.economies);
  const mates = friends.get(country);
  let kept = 1;
  const legs = (TRADE_ROUTE[country] ?? []).map((zone) => {
    let raiders = 0;
    let escorts = 0;
    for (const f of w.fleets) {
      if (ZONE_INDEX[f.zone] !== zone || !arrived(f, w.day)) continue;
      if (f.mission === 'raid' && atWar(w, country, f.owner)) raiders += raidPower(f, mods(f.owner));
      else if (f.owner === country || mates?.has(f.owner)) escorts += escortPower(f, mods(f.owner));
    }
    const blockaded = sea.status(country, zone) === 'enemy';
    const sunk = blockaded ? BLOCKADE_SUNK : raiders > 0 ? Math.min(MAX_SUNK, raiders / (raiders + 2 * escorts + 6)) : 0;
    kept *= 1 - sunk;
    return { zone, raiders, escorts, blockaded, sunk };
  });
  return { legs, lost: 1 - kept };
}

/** Where a country's new ships join the fleet: its home zone nearest the capital that it still has a coast on. */
export function homeZone(controller: string[], country: string): number | null {
  for (const z of HOME_ZONES[country] ?? []) if (PROVINCES.some((p) => controller[p.id] === country && p.owner === country && COAST[p.id].includes(z))) return z;
  return null;
}

const shipWord = (n: number, kind: ShipKind): string => `${n} ${kind === 'capital' ? (n === 1 ? 'capital ship' : 'capital ships') : kind === 'escort' ? (n === 1 ? 'escort flotilla' : 'escort flotillas') : n === 1 ? 'submarine flotilla' : 'submarine flotillas'}`;
/** A fleet's ships in words, e.g. "3 capital ships, 6 escort flotillas". */
export const describeFleet = (f: Pick<Fleet, 'ships'>): string => SHIP_KINDS.filter((k) => Math.round(f.ships[k]) > 0).map((k) => shipWord(Math.round(f.ships[k]), k)).join(', ') || 'no ships fit for sea';

/** One day of the war at sea. */
export function runNavy(d: ForceDraft, rng: Rng, sea: SeaPicture, friends: Map<string, Set<string>>): void {
  const mods = modCache(d.economies);
  const clashes: string[] = [];
  if (d.wars.length) {
    const lossShare = new Map<Fleet, number>();
    for (let z = 0; z < ZONES.length; z++) {
      const here = d.fleets.filter((f) => ZONE_INDEX[f.zone] === z && arrived(f, d.day) && f.mission !== 'port');
      if (!here.length) continue;
      const owners = [...new Set(here.map((f) => f.owner))].sort();
      const fighting = new Set<string>();
      for (const c of owners) {
        // 1. Battle between surface fleets (and naval bombers).
        const surface = here.filter((f) => f.owner === c && MISSION_POWER[f.mission] > 0);
        let enemyPower = 0;
        for (const [name, x] of sea.power[z]) if (atWar(d, c, name)) enemyPower += x;
        const total = surface.reduce((a, f) => a + fleetPower(f), 0);
        if (surface.length && enemyPower > 0 && total > 0) {
          const share = Math.min(1, (NAVAL_DAMAGE * enemyPower * (0.7 + 0.6 * rng.next())) / total);
          for (const f of surface) lossShare.set(f, share);
          fighting.add(c);
        }
        // 2. Raiders are hunted by the enemy's escorts.
        const raiders = here.filter((f) => f.owner === c && f.mission === 'raid');
        const hulls = raiders.reduce((a, f) => a + shipCount(f), 0);
        if (hulls > 0) {
          let hunters = 0;
          for (const f of here) if (atWar(d, c, f.owner)) hunters += escortPower(f, mods(f.owner));
          if (hunters > 0) {
            const share = Math.min(1, (SUB_HUNT * hunters * (0.7 + 0.6 * rng.next())) / hulls);
            for (const f of raiders) lossShare.set(f, share);
          }
        }
      }
      if (fighting.size) {
        clashes.push(ZONES[z].id);
        if (!d.clashes.includes(ZONES[z].id)) {
          const sides = [...fighting];
          const foes = sides.filter((c) => atWar(d, sides[0], c));
          const text = foes.length ? `Naval battle in the ${ZONES[z].name}: ${sides.filter((c) => !foes.includes(c)).join(' and ')} against ${foes.join(' and ')}` : `${sides.join(' and ')} under air attack in the ${ZONES[z].name}`;
          logForce(d, 'sea', text, sides, { zone: ZONES[z].id });
        }
      }
    }
    for (const [f, share] of lossShare) for (const k of SHIP_KINDS) f.ships[k] *= 1 - share;
    const sunk = d.fleets.filter((f) => shipCount(f) < 0.5);
    for (const f of sunk) logForce(d, 'sea', `${f.owner}'s ${f.name} is destroyed in the ${ZONES[ZONE_INDEX[f.zone]].name}`, [f.owner], { zone: f.zone });
    if (sunk.length) d.fleets = d.fleets.filter((f) => !sunk.includes(f));
  }
  d.clashes = clashes;

  // 3. Blockade, and new ships from the yards.
  for (const name of Object.keys(d.economies).sort()) {
    const e = d.economies[name];
    if (d.capitulated.includes(name)) continue;
    const target = enemiesOf(d, name).length ? tradeRoute(d, sea, friends, name).lost : 0;
    e.blockade = Math.abs(target - e.blockade) < 0.005 ? target : e.blockade + 0.1 * (target - e.blockade);
    for (const k of SHIP_KINDS) {
      while (e.stock[k] >= 1) {
        const zone = homeZone(d.controller, name);
        if (zone === null) break;
        const mine = d.fleets.filter((f) => f.owner === name);
        // Submarines join the raiders if there are any; surface ships join a fleet at home.
        let fleet = k === 'submarine' ? mine.find((f) => f.mission === 'raid') ?? mine.find((f) => f.ships.submarine > 0) : mine.find((f) => f.mission !== 'raid' && ZONE_INDEX[f.zone] === zone) ?? mine.find((f) => f.mission !== 'raid');
        if (!fleet) {
          fleet = { id: d.nextForceId++, owner: name, name: k === 'submarine' ? 'Submarine Flotilla' : 'Reserve Fleet', zone: ZONES[zone].id, mission: k === 'submarine' ? 'raid' : 'port', ships: { capital: 0, escort: 0, submarine: 0 }, arrives: d.day };
          d.fleets.push(fleet);
        }
        fleet.ships[k] += 1;
        e.stock[k] -= 1;
      }
    }
  }
}

export type FleetOrder = Extract<Order, { type: 'fleet' | 'transfer' }>;

/** Carry out an order to a fleet. Orders that make no sense are ignored. */
export function giveFleetOrder(d: Pick<ForceDraft, 'fleets' | 'day' | 'nextForceId'>, o: FleetOrder): void {
  const f = d.fleets.find((x) => x.id === o.fleet);
  if (!f) return;
  if (o.type === 'fleet') {
    if (o.mission && o.mission in MISSION_POWER) f.mission = o.mission;
    if (o.zone !== undefined && o.zone !== f.zone && o.zone in ZONE_INDEX) {
      const path = zonePath(ZONE_INDEX[f.zone], ZONE_INDEX[o.zone]);
      if (!path) return;
      f.zone = o.zone;
      f.arrives = Math.max(d.day, f.arrives) + DAYS_PER_ZONE * (path.length - 1);
    }
    return;
  }
  if (!SHIP_KINDS.includes(o.kind) || !(o.count > 0)) return;
  const n = Math.min(f.ships[o.kind], o.count);
  if (n <= 0) return;
  let to = o.to === null ? undefined : d.fleets.find((x) => x.id === o.to);
  if (o.to !== null && (!to || to.owner !== f.owner || to.zone !== f.zone || to === f)) return;
  if (!to) {
    const count = d.fleets.filter((x) => x.owner === f.owner).length + 1;
    to = { id: d.nextForceId++, owner: f.owner, name: `Squadron ${count}`, zone: f.zone, mission: f.mission, ships: { capital: 0, escort: 0, submarine: 0 }, arrives: f.arrives };
    d.fleets.push(to);
  }
  f.ships[o.kind] -= n;
  to.ships[o.kind] += n;
  if (shipCount(f) < 0.01) d.fleets = d.fleets.filter((x) => x !== f);
}

// ---------- troops by sea ----------

type ShipView = Pick<World, 'units' | 'controller' | 'wars' | 'economies'>;

/** How a division would go by sea to a province: how long it takes and whether it is a landing. Or why it cannot. */
export function shipPlan(w: ShipView, sea: SeaPicture, friends: Map<string, Set<string>>, u: Unit, to: number): { days: number; landing: boolean; zones: number[] } | { why: string } {
  const p = PROVINCES[to];
  if (!p) return { why: 'no such province' };
  if (u.at === to) return { why: `already in ${p.name}` };
  const holder = w.controller[to];
  const landing = atWar(w, u.owner, holder);
  if (!landing && holder !== u.owner && !friends.get(u.owner)?.has(holder)) return { why: `${p.name} belongs to ${holder}, which is neutral` };
  const route = seaRoute(sea, u.owner, u.at, to, landing);
  if ('why' in route) return route;
  if (landing) {
    const zone = route.zones[route.zones.length - 1];
    let afloat = 0;
    for (const [name, n] of sea.ships[zone]) if (name === u.owner || friends.get(u.owner)?.has(name)) afloat += n;
    const room = LANDING_BASE + Math.floor(afloat);
    const waiting = w.units.filter((x) => x.id !== u.id && x.owner === u.owner && ((x.sea?.landing && COAST[x.sea.to].includes(zone)) || (x.landing && x.path.length && COAST[x.path[0]].includes(zone)))).length;
    if (waiting >= room) return { why: `your ships in the ${ZONES[zone].name} can land only ${room} divisions at a time` };
  }
  const prep = landing ? Math.ceil(LANDING_PREP_DAYS * Math.max(0.3, 1 + modsOf(w.economies[u.owner]).landingPrep)) : TRANSPORT_DAYS;
  return { days: prep + DAYS_PER_ZONE * (route.zones.length - 1), landing, zones: route.zones };
}

/** Order a division to go by sea. Ignored if there is no way. */
export function giveShipOrder(d: ShipView, sea: SeaPicture, friends: Map<string, Set<string>>, u: Unit, to: number): void {
  const plan = shipPlan(d, sea, friends, u, to);
  if ('why' in plan) return;
  u.path = [];
  u.progress = 0;
  u.landing = undefined;
  u.sea = { to, daysLeft: plan.days, landing: plan.landing };
}

/** One day for the divisions waiting to sail: when the time is up they cross, if the sea is still open. */
export function runShipping(d: ForceDraft, sea: SeaPicture, friends: Map<string, Set<string>>): void {
  const landed = new Map<string, number>();
  for (const u of d.units) {
    if (!u.sea) continue;
    if (u.path.length) {
      u.sea = undefined; // it was ordered to march instead
      continue;
    }
    const left = u.sea.daysLeft - 1;
    if (left > 0) {
      u.sea = { ...u.sea, daysLeft: left };
      continue;
    }
    const { to, landing } = u.sea;
    let plan = shipPlan(d, sea, friends, { ...u, sea: undefined }, to);
    // Troops sent as reinforcements do not storm a beach if the port has fallen in the meantime.
    if (!('why' in plan) && plan.landing && !landing) plan = { why: `${PROVINCES[to].name} has fallen to the enemy` };
    u.sea = undefined;
    if ('why' in plan) {
      if (!d.forceLog.some((e) => e.day === d.day && e.kind === 'landing' && e.province === to && e.countries[0] === u.owner))
        logForce(d, 'landing', `${u.owner}: the crossing to ${PROVINCES[to].name} is called off, because ${plan.why}`, [u.owner], { province: to });
      continue;
    }
    if (plan.landing) {
      u.path = [to];
      u.progress = 0;
      u.landing = true;
      landed.set(`${u.owner}|${to}`, (landed.get(`${u.owner}|${to}`) ?? 0) + 1);
    } else {
      u.at = to;
      u.dugIn = 0;
      u.organisation = Math.max(0, u.organisation - 10);
    }
  }
  for (const [key, n] of landed) {
    const [owner, to] = [key.slice(0, key.indexOf('|')), Number(key.slice(key.indexOf('|') + 1))];
    logForce(d, 'landing', `${owner} lands ${n} ${n === 1 ? 'division' : 'divisions'} at ${PROVINCES[to].name}`, [owner, d.controller[to]], { province: to });
  }
}
