/**
 * Armies: groups of divisions that carry out one order between them.
 *
 * Without armies every division is moved by hand. An army takes a whole front off your hands:
 *
 *   Hold       the army spreads along the border with one country, more divisions where more
 *              enemies stand, and keeps the line filled as divisions come and go.
 *   Push       it attacks toward a target province, on the enemy provinces in the way, at a pace:
 *              careful, steady or all-out (the odds it wants before it attacks). It runs on the
 *              same front code as the AI's army commander (ai.ts). At peace it deploys on the
 *              border, closest to the target, ready for the war.
 *   Fall back  it gives up attacks, goes back to a province and the land next to it, and digs in
 *              there twice as fast as usual: engineers went ahead to prepare the positions.
 *   Reserve    it waits at a province behind the front. When the enemy breaks in within two
 *              provinces it goes to help: it reinforces a province under attack that is being
 *              lost, or counter-attacks a province the enemy has taken from you.
 *
 * Armies live in the world, not on the screen, so they are saved with the game and give the
 * same orders on every computer (lockstep multiplayer). Each day `armyOrders` turns every
 * army's order into ordinary orders for its divisions. On the day an order is given the army
 * takes back all its divisions; on later days it leaves alone any you have marched by hand.
 */
import { aiOrders, frontsOf } from './ai';
import { attackPower, defencePower, DEFENCE_WIDTH, ATTACK_WIDTH } from './combat';
import { COMMANDERS, commanderById } from './commanders';
import { allianceMap } from './diplomacy';
import { distanceKm, PROVINCES } from './map';
import { combatEdges } from './mods';
import type { SeaPicture } from './sea';
import { linkedProvinces, supplyCapacity } from './supply';
import type { Army, ArmyOrder, Order, Pace, Unit, World } from './types';
import { enemiesOf } from './war';

export type ArmyCommandOrder = Extract<Order, { type: 'formArmy' | 'armyOrder' | 'armyUnits' | 'armySettings' | 'disbandArmy' }>;
export const isArmyOrder = (o: Order): o is ArmyCommandOrder => o.type === 'formArmy' || o.type === 'armyOrder' || o.type === 'armyUnits' || o.type === 'armySettings' || o.type === 'disbandArmy';

/** Number keys 1 to 9 select an army. */
export const ARMY_SLOTS = 9;
/** The odds an attack must promise at each pace (the AI commander's `boldness`; it uses 1.3). */
export const PACE_BOLDNESS: Record<Pace, number> = { careful: 1.6, steady: 1.3, allOut: 1.0 };
export const PACE_NAME: Record<Pace, string> = { careful: 'careful', steady: 'steady', allOut: 'all-out' };
/** A reserve helps against breakthroughs this many provinces away. */
export const RESERVE_REACH = 2;
/** A province under attack is being lost once its front line is this far in: the reserve goes to help. */
export const RESERVE_ALARM_LINE = 30;
/** A reserve counter-attacks only at these odds or better. */
export const COUNTER_ODDS = 1.2;
/** Divisions of an army falling back dig in this many times as fast once they stand in their new line. */
export const FALL_BACK_DIG = 2;

/** "1st", "2nd", "3rd", "4th" ... */
export function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

/** A country's armies, by number key. */
export function armiesOf(w: Pick<World, 'armies'>, country: string): Army[] {
  return (w.armies ?? []).filter((a) => a.owner === country).sort((a, b) => (a.slot || 99) - (b.slot || 99) || a.id - b.id);
}

/** The army a division belongs to, if any. */
export function armyOfUnit(w: Pick<World, 'armies'>, unit: number): Army | undefined {
  return (w.armies ?? []).find((a) => a.units.includes(unit));
}

/** The world as step() is changing it, as far as armies need it. */
export interface ArmyDraft {
  day: number;
  units: Unit[];
  controller: string[];
  capitulated: string[];
  armies: Army[];
  nextArmyId: number;
}

const validOrder = (o: ArmyOrder, country: string): boolean => {
  const province = (p: number) => Number.isInteger(p) && p >= 0 && p < PROVINCES.length;
  switch (o.kind) {
    case 'none':
      return true;
    case 'hold':
      return typeof o.foe === 'string' && o.foe !== country && (o.at === undefined || province(o.at));
    case 'push':
      return province(o.target) && typeof o.foe === 'string' && o.foe !== country && o.pace in PACE_BOLDNESS;
    case 'fallBack':
      return province(o.to);
    case 'reserve':
      return province(o.at);
    default:
      return false;
  }
};

/** Carry out an order about armies. Orders that make no sense are ignored. */
export function giveArmyOrder(d: ArmyDraft, o: ArmyCommandOrder): void {
  if (d.capitulated.includes(o.country)) return;
  const own = new Set(d.units.filter((u) => u.owner === o.country).map((u) => u.id));
  const leave = (ids: number[]) => {
    const gone = new Set(ids);
    for (const a of d.armies) if (a.units.some((id) => gone.has(id))) a.units = a.units.filter((id) => !gone.has(id));
  };
  if (o.type === 'formArmy') {
    const ids = [...new Set(o.units)].filter((id) => own.has(id)).sort((a, b) => a - b);
    if (!ids.length) return;
    leave(ids);
    const taken = new Set(d.armies.filter((a) => a.owner === o.country).map((a) => a.slot));
    let slot = 0;
    for (let n = 1; n <= ARMY_SLOTS; n++) if (!taken.has(n)) {
      slot = n;
      break;
    }
    // Armies are numbered in the order they are formed: 1st Army, 2nd Army ...
    const formed = d.armies.filter((a) => a.owner === o.country).length;
    const name = (o.name ?? '').trim().slice(0, 40) || `${ordinal(slot || formed + 1)} Army`;
    d.armies.push({ id: d.nextArmyId++, owner: o.country, name, slot, units: ids, order: { kind: 'none' }, orderDay: d.day, reinforce: false });
    return;
  }
  const a = d.armies.find((x) => x.id === o.army && x.owner === o.country);
  if (!a) return;
  switch (o.type) {
    case 'armyOrder':
      if (!validOrder(o.order, o.country)) return;
      a.order = { ...o.order };
      a.orderDay = d.day;
      break;
    case 'armyUnits': {
      const add = [...new Set(o.add ?? [])].filter((id) => own.has(id));
      if (add.length) {
        leave(add);
        a.units = [...a.units, ...add].sort((x, y) => x - y);
      }
      if (o.remove?.length) {
        const out = new Set(o.remove);
        a.units = a.units.filter((id) => !out.has(id));
      }
      break;
    }
    case 'armySettings':
      if (typeof o.name === 'string' && o.name.trim()) a.name = o.name.trim().slice(0, 40);
      if (typeof o.reinforce === 'boolean') {
        // Only one army at a time takes the new divisions.
        if (o.reinforce) for (const x of d.armies) if (x.owner === o.country) x.reinforce = false;
        a.reinforce = o.reinforce;
      }
      if (o.commander === null) a.commander = undefined;
      else if (typeof o.commander === 'string') {
        const c = commanderById(o.commander);
        // A commander leads one army at a time, and only for his own country.
        if (c && c.country === o.country) {
          for (const x of d.armies) if (x.commander === c.id) x.commander = undefined;
          a.commander = c.id;
        }
      }
      break;
    case 'disbandArmy':
      d.armies = d.armies.filter((x) => x !== a);
      break;
  }
}

/**
 * The end of each day: divisions that are gone leave their armies, new divisions join the
 * army that takes them, and an army that has reached the target of its push holds there.
 * `firstNew` is the first unit id raised today.
 */
export function keepArmies(d: ArmyDraft & { diplomacy: World['diplomacy'] }, firstNew: number): void {
  if (!d.armies.length) return;
  d.armies = d.armies.filter((a) => !d.capitulated.includes(a.owner));
  const alive = new Set(d.units.map((u) => u.id));
  for (const a of d.armies) if (a.units.some((id) => !alive.has(id))) a.units = a.units.filter((id) => alive.has(id));
  for (const u of d.units) {
    if (u.id < firstNew) continue;
    const a = d.armies.find((x) => x.owner === u.owner && x.reinforce);
    if (a) a.units.push(u.id);
  }
  const friends = allianceMap(d.diplomacy);
  for (const a of d.armies) {
    if (a.order.kind !== 'push') continue;
    const holder = d.controller[a.order.target];
    if (holder === a.owner || friends.get(a.owner)?.has(holder)) a.order = { kind: 'hold', foe: a.order.foe, at: a.order.target };
  }
}

/** Where an army's marker stands: the province holding most of its divisions (the lowest id on a tie). */
export function armyCentre(w: Pick<World, 'units'>, a: Army): number | null {
  const count = new Map<number, number>();
  const ids = new Set(a.units);
  for (const u of w.units) if (ids.has(u.id)) count.set(u.at, (count.get(u.at) ?? 0) + 1);
  let best: number | null = null;
  for (const [p, n] of count) if (best === null || n > count.get(best)! || (n === count.get(best)! && p < best)) best = p;
  return best;
}

/** Steps between every province and `target`, across the whole map. */
function stepsTo(target: number): number[] {
  const steps = new Array<number>(PROVINCES.length).fill(Infinity);
  steps[target] = 0;
  const queue = [target];
  for (let i = 0; i < queue.length; i++) for (const n of PROVINCES[queue[i]].neighbours) if (steps[n] === Infinity) (steps[n] = steps[queue[i]] + 1, queue.push(n));
  return steps;
}

/**
 * The enemy provinces a push attacks today, at most three: the target itself once it is on the
 * front, and before that the provinces of the front on the way from
 * where the army stands (`from`) to its target. Each counts its steps to the target plus half its
 * steps from the army, so an army coming from the south does not wander off to attack the target
 * from the north.
 */
export function pushAxis(targets: number[], target: number, from: number | null = null): number[] {
  if (!targets.length) return [];
  // The target is on the front: everything goes at it.
  if (targets.includes(target)) return [target];
  const steps = stepsTo(target);
  const back = from === null ? null : stepsTo(from);
  const score = (t: number) => steps[t] + (back ? back[t] / 2 : 0);
  const best = Math.min(...targets.map(score));
  const km = (t: number) => distanceKm(PROVINCES[t].centre, PROVINCES[target].centre);
  return targets.filter((t) => score(t) <= best + 1).sort((a, b) => score(a) - score(b) || km(a) - km(b) || a - b).slice(0, 3);
}

export interface ArmyOrderOptions {
  sea?: SeaPicture;
  air?: (attackers: string[], defenders: string[], province: number) => number;
}

/** Today's orders for the divisions of every army a country has. */
export function armyOrders(w: World, country: string, opts: ArmyOrderOptions = {}): Order[] {
  const list = armiesOf(w, country).filter((a) => a.order.kind !== 'none' && a.units.length);
  if (!list.length || w.capitulated.includes(country)) return [];
  const friends = allianceMap(w.diplomacy);
  const allies = friends.get(country);
  const friendly = (p: number) => w.controller[p] === country || !!allies?.has(w.controller[p]);
  const enemies = new Set(enemiesOf(w, country));
  const byId = new Map(w.units.map((u) => [u.id, u]));
  const enemyAt = new Map<number, Unit[]>();
  for (const u of w.units) if (enemies.has(u.owner)) (enemyAt.get(u.at) ?? enemyAt.set(u.at, []).get(u.at)!).push(u);
  const hostile = (p: number) => enemyAt.get(p)?.length ?? 0;
  const attacking = (u: Unit) => u.path.length > 0 && hostile(u.path[0]) > 0;
  const orders: Order[] = [];

  for (const a of list) {
    const units = a.units.map((id) => byId.get(id)).filter((u): u is Unit => !!u && !u.sea && !u.landing);
    if (!units.length) continue;
    const fresh = a.orderDay >= w.day;
    const mine = new Set(units.map((u) => u.id));
    // Room in a province: what it can feed, less every division there that is not this army's.
    const others = new Map<number, number>();
    for (const u of w.units) if (!mine.has(u.id) && !enemies.has(u.owner)) others.set(u.at, (others.get(u.at) ?? 0) + 1);
    const room = (p: number) => Math.max(0, supplyCapacity(p) - (others.get(p) ?? 0));
    const o = a.order;

    if (o.kind === 'push' && enemies.has(o.foe)) {
      // At war: the AI's front code, on the provinces in the way, at the army's pace.
      const front = frontsOf(w, country).find((f) => f.foe === o.foe);
      const axis = new Set(pushAxis(front?.targets ?? [], o.target, armyCentre(w, a)));
      // On the day of the order every division is taken back, except those already attacking.
      const view = fresh ? { ...w, units: w.units.map((u) => (mine.has(u.id) && u.path.length && !attacking(u) ? { ...u, path: [], progress: 0 } : u)) } : w;
      if (fresh) for (const u of units) if (u.path.length && !attacking(u)) orders.push({ type: 'halt', unit: u.id });
      orders.push(...aiOrders(view, country, { army: { units: mine, foe: o.foe, targets: axis }, boldness: PACE_BOLDNESS[o.pace], sea: opts.sea, air: opts.air }));
      continue;
    }

    // Everything else spreads the army over a line of friendly provinces, by weight.
    let line: number[] = [];
    let depth: number[] = [];
    let weight = (_p: number) => 1;
    const pressure = (p: number) => PROVINCES[p].neighbours.reduce((s, n) => s + (enemies.has(w.controller[n]) ? hostile(n) + 0.5 : 0), 0);
    if (o.kind === 'hold' && o.at !== undefined) {
      // Holding the ground a push has taken: the province, and the land next to it that faces the enemy.
      if (!friendly(o.at)) continue;
      const around = PROVINCES[o.at].neighbours.filter(friendly);
      line = [o.at, ...around.filter((p) => pressure(p) > 0)];
      depth = around.filter((p) => !line.includes(p));
      weight = (p) => 1 + pressure(p) + (p === o.at ? 1 : 0);
    } else if (o.kind === 'hold' || o.kind === 'push') {
      const foe = o.foe;
      const front = frontsOf(w, country, enemies.has(foe) ? [] : [foe]).find((f) => f.foe === foe);
      if (!front) continue;
      line = front.provinces;
      depth = front.depth;
      if (o.kind === 'hold') {
        // Facing: the foe's divisions next door (all of them, at war or not), and a little for each border crossed.
        const facing = (p: number) => PROVINCES[p].neighbours.reduce((s, n) => s + (w.controller[n] === foe ? w.units.filter((u) => u.at === n && u.owner === foe).length + 0.5 : 0), 0);
        weight = (p) => 1 + facing(p) + (PROVINCES[p].victoryPoints >= 10 && w.owner[p] === country ? 2 : 0);
      } else {
        // A push at peace: deploy on the stretch of border closest to the target, most of the army closest of all.
        const steps = stepsTo(o.target);
        const nearest = Math.min(...line.map((p) => steps[p]));
        line = line.filter((p) => steps[p] <= nearest);
        depth = [...new Set(line.flatMap((p) => PROVINCES[p].neighbours.filter((n) => friendly(n) && !line.includes(n))))].sort((x, y) => x - y);
        weight = (p) => 1 / ((1 + steps[p]) * (1 + steps[p]));
      }
    } else if (o.kind === 'fallBack' || o.kind === 'reserve') {
      const at = o.kind === 'fallBack' ? o.to : o.at;
      if (!friendly(at)) continue;
      const around = PROVINCES[at].neighbours.filter(friendly);
      if (o.kind === 'fallBack') {
        // The new line: the province, and the land next to it that faces the enemy.
        line = [at, ...around.filter((p) => pressure(p) > 0)];
        depth = around.filter((p) => !line.includes(p));
        weight = (p) => 1 + pressure(p) + (p === at ? 1 : 0);
      } else {
        line = [at];
        depth = around;
      }
    }
    if (!line.length) continue;

    const busy = new Set<number>();
    if (o.kind === 'reserve') orders.push(...reserveOrders(w, country, units, o.at, { friendly, ours: (name) => name === country || !!allies?.has(name), enemies, hostile, enemyAt, room, busy }));
    // Hold, fall back and reserve give up attacks on the day of the order (fall back: every day).
    for (const u of units) {
      if (busy.has(u.id)) continue;
      if (attacking(u) && (fresh || o.kind === 'fallBack')) {
        orders.push({ type: 'halt', unit: u.id });
        continue;
      }
      if (attacking(u)) busy.add(u.id);
    }
    const free = units.filter((u) => !busy.has(u.id) && !(attacking(u) && !fresh && o.kind !== 'fallBack'));
    orders.push(...spread(free, line, depth, weight, room, fresh, friendly));
  }
  return orders;
}

interface ReserveContext {
  friendly: (p: number) => boolean;
  /** The country itself or one of its allies. */
  ours: (country: string) => boolean;
  enemies: Set<string>;
  hostile: (p: number) => number;
  enemyAt: Map<number, Unit[]>;
  room: (p: number) => number;
  /** Divisions given an order here: the rest are spread at the reserve's post. */
  busy: Set<number>;
}

/** A reserve's answer to breakthroughs near its post: help a province being lost, or take back one that was. */
function reserveOrders(w: World, country: string, units: Unit[], post: number, c: ReserveContext): Order[] {
  const orders: Order[] = [];
  // Friendly land within reach of the post.
  const reach = new Map<number, number>([[post, 0]]);
  const queue = [post];
  for (let i = 0; i < queue.length; i++) {
    const q = queue[i];
    if (reach.get(q)! >= RESERVE_REACH) continue;
    for (const n of PROVINCES[q].neighbours) if (!reach.has(n) && c.friendly(n)) (reach.set(n, reach.get(q)! + 1), queue.push(n));
  }
  // Divisions already fighting stay where they are.
  for (const u of units) if (u.path.length || w.battles.some((b) => b.province === u.at)) c.busy.add(u.id);
  const ready = () => units.filter((u) => !c.busy.has(u.id) && u.organisation >= 50 && !u.path.length);
  const nearest = (to: number, n: number) => ready().sort((a, b) => distanceKm(PROVINCES[a.at].centre, PROVINCES[to].centre) - distanceKm(PROVINCES[b.at].centre, PROVINCES[to].centre) || a.id - b.id).slice(0, n);
  const half = Math.max(1, Math.ceil(units.length / 2));

  // 1. A province within reach that is being lost: its front line is well in, or it is outnumbered.
  const losing = w.battles
    .filter((b) => reach.has(b.province) && !b.attackers.includes(country) && (b.line >= RESERVE_ALARM_LINE || w.units.filter((u) => u.path[0] === b.province && u.at !== b.province && b.attackers.includes(u.owner)).length > w.units.filter((u) => u.at === b.province && !b.attackers.includes(u.owner)).length))
    .sort((a, b) => b.line - a.line || a.province - b.province);
  for (const b of losing) {
    const send = nearest(b.province, Math.min(half, c.room(b.province) || 1));
    for (const u of send) {
      c.busy.add(u.id);
      if (u.at !== b.province) orders.push({ type: 'move', unit: u.id, to: b.province, friendly: true });
    }
  }
  // 2. A province of yours (or an ally's) the enemy has broken into, next to land within reach: counter-attack, if the odds are good.
  const edges = combatEdges(w.economies, { effects: w.story.effects, day: w.day, startDate: w.startDate, armies: w.armies });
  const lost = PROVINCES.filter((p) => c.enemies.has(w.controller[p.id]) && c.ours(w.owner[p.id]) && p.neighbours.some((n) => reach.has(n)));
  for (const p of lost.sort((a, b) => b.victoryPoints - a.victoryPoints || a.id - b.id)) {
    const force = nearest(p.id, half);
    if (!force.length) break;
    const holders = c.enemyAt.get(p.id) ?? [];
    if (holders.length) {
      const defence = holders.map((u) => defencePower(u, 1, edges.defence(u, p.id))).sort((x, y) => y - x).slice(0, DEFENCE_WIDTH).reduce((s, x) => s + x, 0);
      const power = force.map((u) => attackPower(u, p.id, edges.attack(u))).sort((x, y) => y - x).slice(0, ATTACK_WIDTH).reduce((s, x) => s + x, 0);
      if (power < COUNTER_ODDS * defence) continue;
    }
    for (const u of force) {
      c.busy.add(u.id);
      orders.push({ type: 'move', unit: u.id, to: p.id });
    }
  }
  return orders;
}

/**
 * Share `units` out over `line` by weight, as far as each province has room; what does not fit
 * waits in `depth`. Divisions already in place stay, so the line does not shuffle every day.
 * On days after the order, divisions marching somewhere are left alone.
 */
function spread(units: Unit[], line: number[], depth: number[], weight: (p: number) => number, room: (p: number) => number, fresh: boolean, friendly: (p: number) => boolean): Order[] {
  const orders: Order[] = [];
  const station = (u: Unit) => (u.path.length ? u.path[u.path.length - 1] : u.at);
  const moving = units.filter((u) => u.path.length && !fresh);
  const pool = units.filter((u) => !moving.includes(u));
  const n = pool.length + moving.filter((u) => line.includes(station(u)) || depth.includes(station(u))).length;
  // How many each province of the line should get: by weight, never more than it can feed.
  const want = new Map<number, number>();
  const total = line.reduce((s, p) => s + weight(p), 0);
  let left = n;
  for (const p of line) {
    const k = Math.min(room(p), Math.floor((n * weight(p)) / total));
    want.set(p, k);
    left -= k;
  }
  // The rest one at a time to where they matter most, while there is room.
  while (left > 0) {
    let best = -1;
    for (const p of line) if (want.get(p)! < room(p) && (best < 0 || weight(p) / (want.get(p)! + 1) > weight(best) / (want.get(best)! + 1))) best = p;
    if (best < 0) break;
    want.set(best, want.get(best)! + 1);
    left--;
  }
  // Then behind the line.
  for (const p of depth) {
    if (left <= 0) break;
    const k = Math.min(room(p), left);
    if (k > 0) want.set(p, (want.get(p) ?? 0) + k), (left -= k);
  }
  // Divisions already there (or on the way) keep their places, the first by id.
  const have = new Map<number, number>();
  for (const u of moving) have.set(station(u), (have.get(station(u)) ?? 0) + 1);
  const free: Unit[] = [];
  for (const u of [...pool].sort((a, b) => Number(!!a.path.length) - Number(!!b.path.length) || a.id - b.id)) {
    const s = station(u);
    const k = have.get(s) ?? 0;
    // One over is fine: it saves shuffling a division back and forth for nothing.
    if (want.has(s) && k < want.get(s)! + (fresh ? 0 : 1) && friendly(s)) have.set(s, k + 1);
    else free.push(u);
  }
  // The places still open, the most important first.
  const open: number[] = [];
  for (const p of [...line, ...depth.filter((x) => !line.includes(x))]) for (let i = have.get(p) ?? 0; i < (want.get(p) ?? 0); i++) open.push(p);
  open.sort((a, b) => weight(b) - weight(a) || a - b);
  for (const p of open) {
    if (!free.length) break;
    let best = 0;
    for (let i = 1; i < free.length; i++) if (distanceKm(PROVINCES[free[i].at].centre, PROVINCES[p].centre) < distanceKm(PROVINCES[free[best].at].centre, PROVINCES[p].centre)) best = i;
    const u = free.splice(best, 1)[0];
    if (station(u) !== p) orders.push({ type: 'move', unit: u.id, to: p, friendly: true });
  }
  return orders;
}

/** The orders the screen can aim at a province. */
export type AimKind = 'push' | 'hold' | 'fallBack' | 'reserve';

/**
 * The order an army gets when the player points it at a province: with `kind` the order they
 * chose, without it the one that fits the place (dragging the army's marker):
 *
 *   an enemy province, at war          Push toward it;
 *   another country's province         Hold the border with that country (Push with `kind`);
 *   your own province on a border      Hold the border with the neighbour, an enemy first;
 *   your own province inside           Reserve there.
 */
export function orderFor(w: World, country: string, army: Army, province: number, kind?: AimKind): { order: ArmyOrder } | { why: string } {
  const p = PROVINCES[province];
  if (!p) return { why: 'no such province' };
  const allies = allianceMap(w.diplomacy).get(country);
  const ours = (name: string) => name === country || !!allies?.has(name);
  const enemies = new Set(enemiesOf(w, country));
  const holder = w.controller[province];
  const pace: Pace = army.order.kind === 'push' ? army.order.pace : 'steady';
  // The foreign neighbour of a friendly province: an enemy before a neutral, then the one with most divisions next door.
  const neighbourFoe = (): string | undefined => {
    const count = new Map<string, number>();
    for (const n of p.neighbours) {
      const c = w.controller[n];
      if (ours(c)) continue;
      count.set(c, (count.get(c) ?? 0) + 1 + w.units.filter((u) => u.at === n && u.owner === c).length);
    }
    return [...count.keys()].sort((a, b) => Number(enemies.has(b)) - Number(enemies.has(a)) || count.get(b)! - count.get(a)! || (a < b ? -1 : 1))[0];
  };
  if (!kind) kind = !ours(holder) ? (enemies.has(holder) ? 'push' : 'hold') : neighbourFoe() ? 'hold' : 'reserve';
  switch (kind) {
    case 'push':
      if (ours(holder)) return { why: `${p.name} is already held by ${holder === country ? 'you' : holder}: push toward a province of another country` };
      return { order: { kind: 'push', target: province, foe: holder, pace } };
    case 'hold': {
      const foe = ours(holder) ? neighbourFoe() : holder;
      if (!foe) return { why: `${p.name} is not on a border: pick a border, or a province of the country to hold against` };
      return { order: { kind: 'hold', foe } };
    }
    case 'fallBack':
    case 'reserve':
      if (!ours(holder)) return { why: `${p.name} is not yours: an army can only ${kind === 'fallBack' ? 'fall back' : 'wait in reserve'} on your own or an ally's land` };
      return { order: kind === 'fallBack' ? { kind: 'fallBack', to: province } : { kind: 'reserve', at: province } };
  }
}

/** Two armies pushing at the same place from different sides, and what closing the jaws would cut off. */
export interface Pincer {
  armies: [number, number];
  /** The targets of the two pushes. */
  targets: [number, number];
  foe: string;
  /** Enemy divisions that would lose their supply if both targets fell today. */
  cutOff: number;
  /** Both armies are within two provinces of their targets: the gap is closing. */
  closing: boolean;
}

/** The angle between two directions on the map, in degrees, 0 to 180 (no sines or cosines: they differ between computers). */
function apart(ax: number, ay: number, bx: number, by: number): number {
  const dot = ax * bx + ay * by;
  const len = Math.sqrt((ax * ax + ay * ay) * (bx * bx + by * by));
  if (!len) return 0;
  // cos 60° = 0.5, cos 90° = 0, cos 120° = -0.5: enough to tell "from different sides".
  const c = dot / len;
  return c >= 0.5 ? 0 : c >= 0 ? 60 : c >= -0.5 ? 90 : 120;
}

/**
 * Pincers of one country: pairs of its armies pushing at the same or neighbouring targets
 * against the same enemy, from directions at least 60 degrees apart.
 */
export function pincersOf(w: World, country: string): Pincer[] {
  const pushes = armiesOf(w, country).filter((a) => a.order.kind === 'push' && a.units.length);
  const out: Pincer[] = [];
  const centres = new Map(pushes.map((a) => [a.id, armyCentre(w, a)]));
  for (let i = 0; i < pushes.length; i++)
    for (let j = i + 1; j < pushes.length; j++) {
      const a = pushes[i];
      const b = pushes[j];
      const oa = a.order as Extract<ArmyOrder, { kind: 'push' }>;
      const ob = b.order as Extract<ArmyOrder, { kind: 'push' }>;
      if (oa.foe !== ob.foe) continue;
      if (oa.target !== ob.target && !PROVINCES[oa.target].neighbours.includes(ob.target)) continue;
      const ca = centres.get(a.id);
      const cb = centres.get(b.id);
      if (ca == null || cb == null || ca === cb) continue;
      // Directions from the meeting point to each army.
      const [mx, my] = PROVINCES[oa.target].centre;
      const [ax, ay] = PROVINCES[ca].centre;
      const [bx, by] = PROVINCES[cb].centre;
      if (apart(ax - mx, ay - my, bx - mx, by - my) < 60) continue;
      // What the foe would lose if the jaws met: its divisions no longer linked to a depot.
      const friends = allianceMap(w.diplomacy).get(oa.foe);
      const before = linkedProvinces(w.controller, oa.foe, friends);
      const after = [...w.controller];
      after[oa.target] = country;
      after[ob.target] = country;
      const cut = linkedProvinces(after, oa.foe, friends);
      const cutOff = w.units.filter((u) => (u.owner === oa.foe || !!friends?.has(u.owner)) && before[u.at] && !cut[u.at] && !u.sea).length;
      const near = (c: number, t: number) => c === t || PROVINCES[c].neighbours.includes(t) || PROVINCES[c].neighbours.some((n) => PROVINCES[n].neighbours.includes(t));
      out.push({ armies: [a.id, b.id], targets: [oa.target, ob.target], foe: oa.foe, cutOff, closing: near(ca, oa.target) && near(cb, ob.target) });
    }
  return out;
}

/** A short description of an army's order, for the map and the sidebar. */
export function describeOrder(o: ArmyOrder): string {
  switch (o.kind) {
    case 'none':
      return 'No order: you move its divisions by hand';
    case 'hold':
      return o.at === undefined ? `Hold the border with ${o.foe}` : `Hold the ground around ${PROVINCES[o.at].name}`;
    case 'push':
      return `Push toward ${PROVINCES[o.target].name} (${PACE_NAME[o.pace]})`;
    case 'fallBack':
      return `Fall back to ${PROVINCES[o.to].name} and dig in`;
    case 'reserve':
      return `In reserve at ${PROVINCES[o.at].name}`;
  }
}

export { COMMANDERS };
