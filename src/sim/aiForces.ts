/**
 * Simple admirals and air marshals for AI countries, and the part of the army commander that
 * thinks about the sea: reinforcements to a front overseas, and landings.
 *
 * Like the army commander (ai.ts) they have no memory: every decision follows from the world as
 * it is today.
 *
 * Fleets. Submarines go raiding on the trade route of the enemy that depends most on the sea.
 * A surface fleet that is badly outmatched where it is moves to a quieter home zone, or stays
 * in port if there is none ("a fleet in being"). Otherwise it holds its zone: it escorts convoys
 * if the zone is on its own trade route and no enemy fleet is about, and patrols if not. A fleet with
 * nothing to do goes after an enemy it can beat in waters its country cares about.
 *
 * Wings. Fighters and ground-support bombers move up behind the busiest part of the front.
 * With no front on land, fighters defend the capital and bombers go for the enemy's factories
 * if they can reach them. A wing below 35% strength rests until it is back to 70%.
 */
import { ATTACK_WIDTH, attackPower, defencePower, DEFENCE_WIDTH } from './combat';
import { bombTarget, km, RANGE_KM, wingRange } from './air';
import { musterPoint } from './economy';
import { PROVINCES } from './map';
import { AMPHIBIOUS, modsOf, type Edges } from './mods';
import { arrived, LANDING_BASE } from './navy';
import { COAST, fleetPower, HOME_ZONES, seaDependence, seaRoute, TRADE_ROUTE, ZONE_INDEX, zonePath, ZONES, type SeaPicture } from './sea';
import { supplyCapacity } from './supply';
import type { Fleet, Order, Unit, World } from './types';
import { atWar, enemiesOf } from './war';

/** Orders for a country's fleets and wings today. */
export function aiForceOrders(w: World, country: string, sea: SeaPicture, friends: Map<string, Set<string>>): Order[] {
  const enemies = enemiesOf(w, country);
  if (!enemies.length) return [];
  return [...fleetOrders(w, country, enemies, sea, friends.get(country)), ...wingOrders(w, country, enemies, friends.get(country))];
}

function fleetOrders(w: World, country: string, enemies: string[], sea: SeaPicture, mates?: Set<string>): Order[] {
  const orders: Order[] = [];
  const fleets = w.fleets.filter((f) => f.owner === country && arrived(f, w.day));
  if (!fleets.length) return orders;
  const power = (z: number, who: (name: string) => boolean) => {
    let x = 0;
    for (const [name, p] of sea.power[z]) if (who(name)) x += p;
    return x;
  };
  const foe = (name: string) => enemies.includes(name);
  const mine = (name: string) => name === country || !!mates?.has(name);
  // Waters this country cares about: off any coast it holds, and along its trade route.
  const interest = new Set<number>(TRADE_ROUTE[country] ?? []);
  for (const p of PROVINCES) if (w.controller[p.id] === country) for (const z of COAST[p.id]) interest.add(z);
  const home = (HOME_ZONES[country] ?? []).filter((z) => PROVINCES.some((p) => w.controller[p.id] === country && COAST[p.id].includes(z)));
  // Where raiders hurt most: the route of the enemy that lives most by the sea.
  const prey = [...enemies].sort((a, b) => seaDependence(b) - seaDependence(a) || (a < b ? -1 : 1))[0];
  const hunting = prey && seaDependence(prey) >= 0.4 ? TRADE_ROUTE[prey] : [];

  const send = (f: Fleet, zone: number, mission: Fleet['mission']) => {
    if (ZONES[zone].id !== f.zone || mission !== f.mission) orders.push({ type: 'fleet', fleet: f.id, zone: ZONES[zone].id === f.zone ? undefined : ZONES[zone].id, mission });
  };
  for (const f of fleets) {
    const here = ZONE_INDEX[f.zone];
    const steps = (z: number) => zonePath(here, z)?.length ?? 99;
    if (f.ships.capital + f.ships.escort < 0.5) {
      // Submarines.
      if (!hunting.length) send(f, here, 'port');
      else send(f, [...hunting].sort((a, b) => steps(a) - steps(b) || a - b)[0], 'raid');
      continue;
    }
    const own = fleetPower(f);
    const enemyHere = power(here, foe);
    // Its side's strength here, counting this fleet even if it is in port.
    const sideHere = power(here, mine) + (f.mission === 'port' || f.mission === 'raid' ? own : 0);
    // On its own trade route, with no enemy fleet about, it guards the convoys (and still holds the zone at 70%).
    const task: Fleet['mission'] = enemyHere === 0 && f.ships.escort >= 1 && (TRADE_ROUTE[country] ?? []).includes(here) ? 'escort' : 'patrol';
    if (enemyHere > 1.5 * sideHere) {
      // Outmatched: find home waters where it is not, or stay in harbour.
      const refuge = home.filter((z) => z !== here && power(z, foe) <= power(z, mine) + own).sort((a, b) => steps(a) - steps(b) || a - b)[0];
      if (refuge !== undefined && steps(refuge) <= 3) send(f, refuge, task);
      else send(f, here, 'port');
      continue;
    }
    if (enemyHere > 0 || f.mission === 'port') {
      send(f, here, task);
      continue;
    }
    // Nothing to fight here. Is there an enemy it can beat in waters that matter, within reach?
    const target = [...interest].filter((z) => z !== here && power(z, foe) > 0 && power(z, foe) < 0.8 * (own + power(z, mine)) && steps(z) <= 3).sort((a, b) => steps(a) - steps(b) || a - b)[0];
    // The senior fleet in a zone stays, so home waters are not stripped bare.
    if (target !== undefined && fleets.filter((x) => x.zone === f.zone && x.id < f.id && x.ships.capital + x.ships.escort >= 0.5).length > 0) send(f, target, 'patrol');
    else send(f, here, task);
  }
  return orders;
}

function wingOrders(w: World, country: string, enemies: string[], mates?: Set<string>): Order[] {
  const orders: Order[] = [];
  const wings = w.wings.filter((x) => x.owner === country);
  if (!wings.length || w.day % 2) return orders;
  const friendly = (p: number) => w.controller[p] === country || !!mates?.has(w.controller[p]);
  const foe = (p: number) => enemies.includes(w.controller[p]);
  // The busiest part of the front: the friendly province next to the enemy with most of our divisions.
  const count = new Map<number, number>();
  for (const u of w.units) if (u.owner === country) count.set(u.at, (count.get(u.at) ?? 0) + 1);
  let front = -1;
  let most = 0;
  for (const [p, n] of [...count].sort((a, b) => a[0] - b[0])) {
    if (!friendly(p) || !PROVINCES[p].neighbours.some(foe)) continue;
    const fighting = w.battles.some((b) => b.province === p || PROVINCES[p].neighbours.includes(b.province)) ? 3 : 0;
    if (n + fighting > most) {
      most = n + fighting;
      front = p;
    }
  }
  const capital = musterPoint(w.controller, country, w.owner);
  if (capital === null) return orders;
  const m = modsOf(w.economies[country]);
  // A base one step behind the front, so that it is not overrun at once.
  const behind = front < 0 ? -1 : PROVINCES[front].neighbours.filter((n) => friendly(n) && !PROVINCES[n].neighbours.some(foe)).sort((a, b) => km(a, front) - km(b, front) || a - b)[0] ?? front;
  const enemyBombers = w.wings.some((x) => x.type === 'bomber' && enemies.includes(x.owner));

  // With no front: where could bombers reach enemy factories from?
  let bombBase = -1;
  if (front < 0) {
    const range = RANGE_KM.bomber * (1 + m.airRange);
    let best = Infinity;
    const rich = PROVINCES.filter((p) => foe(p.id) && w.factories.civ[p.id] + w.factories.mil[p.id] >= 2);
    for (const p of PROVINCES) {
      if (w.controller[p.id] !== country) continue;
      for (const t of rich) {
        const d = km(p.id, t.id);
        if (d <= range * 0.9 && d < best) {
          best = d;
          bombBase = p.id;
        }
      }
    }
  }

  let fighterNo = 0;
  for (const x of wings) {
    const tired = x.strength < 35 || (x.mission === 'rest' && x.strength < 70);
    let base = x.base;
    let mission = x.mission;
    const range = wingRange(x, m);
    if (x.type === 'fighter') {
      // One fighter wing in three stays over the capital while the enemy has bombers.
      const guard = front < 0 || (enemyBombers && fighterNo % 3 === 2);
      fighterNo++;
      const want = guard ? capital : behind;
      if (!friendly(x.base) || km(x.base, guard ? capital : front) > range * 0.6) base = want;
      mission = 'superiority';
    } else if (front >= 0) {
      if (!friendly(x.base) || km(x.base, front) > range * 0.5) base = behind;
      mission = 'ground';
    } else if (bombBase >= 0) {
      if (bombTarget(w, x) < 0) base = bombBase;
      mission = 'strategic';
    } else {
      base = capital;
      mission = 'naval';
    }
    if (tired) mission = 'rest';
    if (base !== x.base || mission !== x.mission) orders.push({ type: 'wing', wing: x.id, base: base === x.base ? undefined : base, mission });
  }
  return orders;
}

/** What the army commander knows when it turns to the sea. */
export interface SeaPlan {
  w: World;
  country: string;
  sea: SeaPicture;
  enemies: Set<string>;
  allies?: Set<string>;
  edges: Edges;
  boldness: number;
  /** Divisions with nothing to do and no way to the front by land. */
  stranded: Unit[];
  /** Friendly provinces next to the enemy. Empty if there is no front on land anywhere. */
  front: number[];
  /** Divisions in, or on their way to, each province. */
  crowd: Map<number, number>;
}

/** Share of its army a country will send overseas. */
export const EXPEDITION_SHARE = 0.12;
/** Divisions sent by sea in one day, at most. */
const SHIPPED_PER_DAY = 3;

/**
 * Orders by sea for divisions that cannot reach the war on foot. First choice: join a front
 * overseas through the nearest friendly port that has room. Otherwise, if the country controls
 * the sea off an enemy coast and the coast is weakly held, a landing. At most an eighth of the army
 * goes overseas.
 */
export function seaOrders(plan: SeaPlan): Order[] {
  const { w, country, sea, enemies, allies, stranded, crowd } = plan;
  const orders: Order[] = [];
  const mine = w.units.filter((u) => u.owner === country);
  // At most an eighth of the army goes overseas, and never the last division in a province.
  const abroad = mine.filter((u) => u.sea || u.landing || w.owner[u.at] !== country).length;
  const room = Math.floor(EXPEDITION_SHARE * mine.length) - abroad;
  if (room <= 0) return orders;
  const here = new Map<number, number>();
  for (const u of mine) if (!u.sea && !u.landing) here.set(u.at, (here.get(u.at) ?? 0) + 1);
  const free: Unit[] = [];
  for (const u of [...stranded].sort((a, b) => b.id - a.id)) {
    if (free.length >= room) break;
    if (u.sea || u.landing || !COAST[u.at].length || (here.get(u.at) ?? 0) <= 1) continue;
    here.set(u.at, here.get(u.at)! - 1);
    free.push(u);
  }
  if (!free.length) return orders;
  const friendly = (p: number) => w.controller[p] === country || !!allies?.has(w.controller[p]);
  const used = new Set<number>();

  // A. Reinforce a front overseas: friendly ports linked by land to the front, the nearest to it first.
  if (plan.front.length) {
    const steps = new Map<number, number>(plan.front.map((p) => [p, 0]));
    const queue = [...plan.front];
    for (let i = 0; i < queue.length; i++) for (const n of PROVINCES[queue[i]].neighbours) if (friendly(n) && !steps.has(n)) (steps.set(n, steps.get(queue[i])! + 1), queue.push(n));
    const ports = queue.filter((p) => COAST[p].length).sort((a, b) => steps.get(a)! - steps.get(b)! || a - b).slice(0, 12);
    for (const u of free) {
      if (used.size >= SHIPPED_PER_DAY) break;
      const port = ports.find((p) => (crowd.get(p) ?? 0) < supplyCapacity(p) && !('why' in seaRoute(sea, country, u.at, p, false)));
      if (port === undefined) continue;
      crowd.set(port, (crowd.get(port) ?? 0) + 1);
      used.add(u.id);
      orders.push({ type: 'ship', unit: u.id, to: port });
    }
  }

  // B. A landing. One at a time, with rested divisions, where the sea is ours and the coast is thinly held.
  const ready = free.filter((u) => !used.has(u.id) && u.organisation >= 60);
  // Not as a sideshow: a country that can reach the enemy on foot with most of its army fights there.
  if (ready.length < 4 || mine.some((u) => u.sea?.landing || u.landing) || (plan.front.length > 0 && stranded.length < 0.3 * mine.length)) return orders;
  const enemyUnits = w.units.filter((u) => enemies.has(u.owner));
  let best: { force: Unit[]; score: number; to: number } | null = null;
  for (const p of PROVINCES) {
    if (!enemies.has(w.controller[p.id])) continue;
    const zone = COAST[p.id].find((z) => sea.status(country, z) === 'own');
    if (zone === undefined) continue;
    // Enemy divisions close enough to counter-attack within days.
    const nearby = enemyUnits.filter((u) => km(u.at, p.id) < 500).length;
    if (ready.length < 0.5 * nearby) continue;
    let afloat = 0;
    for (const [name, n] of sea.ships[zone]) if (name === country || allies?.has(name)) afloat += n;
    const force = ready.filter((u) => !('why' in seaRoute(sea, country, u.at, p.id, true))).slice(0, Math.min(8, LANDING_BASE + Math.floor(afloat)));
    if (force.length < 4) continue;
    const holders = enemyUnits.filter((u) => u.at === p.id);
    const defence = holders.map((u) => defencePower(u, 1, plan.edges.defence(u, p.id))).sort((a, b) => b - a).slice(0, DEFENCE_WIDTH).reduce((a, b) => a + b, 0);
    if (defence > 0) {
      const power = force.map((u) => attackPower(u, p.id, plan.edges.attack(u) * AMPHIBIOUS)).sort((a, b) => b - a).slice(0, ATTACK_WIDTH).reduce((a, b) => a + b, 0);
      const odds = (power * force.reduce((a, u) => a + Math.max(0, u.organisation - 10), 0)) / (defence * (holders.reduce((a, u) => a + u.organisation, 0) + 1));
      if (odds < plan.boldness * 1.3) continue;
    }
    const score = p.victoryPoints / (1 + defence / 15) / (1 + 0.1 * nearby);
    if (!best || score > best.score) best = { force, score, to: p.id };
  }
  if (best) for (const u of best.force) orders.push({ type: 'ship', unit: u.id, to: best.to });
  return orders;
}
