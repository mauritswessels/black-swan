/**
 * The army commander for AI countries.
 *
 * It only looks at what a player in the same seat could see: its own divisions, its allies',
 * and the enemy divisions near its fronts. It has no memory: the orders depend only on the
 * world as it is today. When and against whom a country goes to war is decided elsewhere
 * (agenda.ts); this only fights the war, and deploys the army before one.
 *
 * Each day it:
 *
 *   1. Draws its fronts. A front is the line of friendly provinces facing one enemy country on
 *      land, or facing a country it is about to attack (a planned war). Allied land counts as
 *      friendly ground.
 *   2. Shares the army out between the fronts. Every front gets a guard of about one division
 *      per province. A small enemy gets about twice the divisions it has near the front. The
 *      great fronts share the rest in proportion to the enemy divisions facing them, but none
 *      gets more than its roads and railways can feed. A tenth of a big army stays at home.
 *      Divisions already on or behind a front belong to it; the ones a front does not need are
 *      sent to the front that is short, the nearest first.
 *   3. Fights each front:
 *        - it walks into undefended enemy provinces, the fastest division first;
 *        - it attacks a defended province when the divisions around it can outlast the
 *          defenders by the `boldness` margin (1.3). A front where it is clearly the stronger
 *          side attacks everywhere at once at a smaller margin (a front-wide offensive), so the
 *          enemy cannot move his reserves to the one point under attack;
 *        - it puts first the provinces whose capture would cut enemy divisions off from their
 *          supply (an encirclement), and accepts a smaller margin for them;
 *        - it keeps pushing a battle whose front line is moving forward, feeding it at a smaller
 *          margin, and never calls it off while the line advances;
 *        - it calls off attacks by worn-out divisions, keeps a guard in each front province in
 *          proportion to the enemy next to it, and sends the rest to where the next attacks
 *          will start.
 *   4. Divisions that cannot reach a front on foot may go by sea: to a front overseas through a
 *      friendly port, or in a landing on a weakly held enemy coast (aiForces.ts). A worn-out
 *      division about to be overrun on a foreign shore is taken off by sea.
 */
import { ATTACK_WIDTH, ATTACK_WIDTH_PER_EXTRA_DIRECTION, attackPower, defencePower, DEFENCE_WIDTH, STATS } from './combat';
import { daysToEnter, distanceKm, PROVINCES } from './map';
import { combatEdges } from './mods';
import { linkedProvinces, supplyCapacity } from './supply';
import type { Order, Unit, World } from './types';
import { EXPEDITION_SHARE, seaOrders } from './aiForces';
import { allianceMap, isMajor } from './diplomacy';
import { musterPoint } from './economy';
import { navalPicture } from './navy';
import { COAST, seaRoute, type SeaPicture } from './sea';
import { enemiesOf } from './war';
import { activeOperations, endedOperations, landedOperations, type Operation } from './operations';

export interface AiOptions {
  /** Attack when the estimated odds of outlasting the defenders are at least this. */
  boldness?: number;
  /** Today's control of the sea, if the caller has already worked it out. */
  sea?: SeaPicture;
  /** Today's control of the sky: the attackers' multiplier in a battle for a province (air.ts). */
  air?: (attackers: string[], defenders: string[], province: number) => number;
  /** Countries this one is about to attack (agenda.ts `plannedWars`): its army deploys to their borders. */
  planned?: string[];
  /** Command one army (armies.ts) instead of the whole country: only its divisions, on its one front. */
  army?: ArmyCommand;
}

/** What an army pushing toward a target (armies.ts) asks of the commander. */
export interface ArmyCommand {
  /** The army's divisions. Every other division is left alone, though it still takes up room. */
  units: Set<number>;
  /** The one country it fights. At peace it deploys on the border with it. */
  foe: string;
  /** The enemy provinces it may attack today: the ones on the way to its target. */
  targets: Set<number>;
}

/** A division is ready to attack when it is rested and fed. */
const READY_ORG = 60;
/** An attacking division is pulled out below this organisation. */
const PULL_OUT_ORG = 25;
/** A small enemy gets this many divisions for each of its own near the front. */
export const MINOR_FRONT_RATIO = 2;
/** A front against a great power may take this many times what its line and the provinces behind it can feed. */
export const MAJOR_FRONT_ROOM = 1.5;
/** Share of a big army (30 divisions or more) kept at home, away from every front. */
export const HOME_SHARE = 0.1;
/** Strength on a front, ours against theirs, at which the whole front attacks (a front-wide offensive). */
export const OFFENSIVE_RATIO = 1.2;
/** In an offensive, an attack goes in at this share of the usual margin. */
export const OFFENSIVE_MARGIN = 0.7;
/** Below this strength ratio a front stands on the defensive and only joins attacks already under way. */
export const DEFENSIVE_RATIO = 0.6;
/** An attack that would cut off at least this many enemy divisions goes in at a smaller margin. */
export const ENCIRCLE_DIVISIONS = 2;
export const ENCIRCLE_MARGIN = 0.85;
/** A city of its own with this many victory points, on the front line, is held in full strength. */
export const KEY_CITY_VP = 10;
/** A battle whose line moved forward yesterday, or that is this far in, is being won: the AI keeps at it and feeds it at this share of the usual margin. */
export const WINNING_LINE = 50;
export const WINNING_MARGIN = 0.6;
/** Against an enemy that is reeling (caught by surprise, or in shock), attacks go in at this share of the usual margin. */
export const REELING_MARGIN = 0.75;
/** An attack takes divisions until its odds are this many times what it needs. */
const ENOUGH = 1.6;
/** A province this many times over what its roads can carry sends divisions away. */
const CROWDED = 1.25;

/** One front: the friendly provinces facing one enemy country on land. */
export interface Front {
  foe: string;
  /** Not at war yet: the army is deploying for a war its government has planned. */
  planned: boolean;
  /** Friendly provinces next to the foe's land, in id order. */
  provinces: number[];
  /** The foe's provinces next to them. Empty for a planned war. */
  targets: number[];
  /** Friendly provinces one step behind the line. */
  depth: number[];
  /** Hostile divisions facing it: in the foe's border provinces and one province further in. */
  near: number;
  /** Hostile divisions in the border provinces themselves. */
  touching: number;
  /** Allied divisions standing on it. */
  helpers: number;
  /** Divisions its roads and railways can feed: the line and the provinces just behind it. */
  room: number;
  /** The guard it always gets, and how many it would like. */
  guard: number;
  want: number;
  /** How many it gets today. */
  share: number;
}

/** The fronts a country has today, and how its army is shared between them. Exported for tests and the reports. */
export function frontsOf(w: World, country: string, planned: string[] = []): Front[] {
  const enemies = new Set(enemiesOf(w, country));
  const allies = allianceMap(w.diplomacy).get(country);
  const friendly = (p: number) => w.controller[p] === country || !!allies?.has(w.controller[p]);
  const hostile = (owner: string) => enemies.has(owner);
  const at = unitsByProvince(w);
  const foes = [...new Set([...enemies, ...planned.filter((x) => !enemies.has(x) && x !== country && !allies?.has(x))])].sort();
  const waiting = country === 'Germany' && w.story.effects.some((x) => x.id === 'phoney' && x.country === country && x.until >= w.day);
  const fronts: Front[] = [];
  for (const foe of foes) {
    const isPlanned = !enemies.has(foe);
    const line: number[] = [];
    const targets = new Set<number>();
    for (const p of PROVINCES) {
      if (!friendly(p.id)) continue;
      let touches = false;
      for (const n of p.neighbours) {
        if (w.controller[n] !== foe) continue;
        touches = true;
        if (!isPlanned) targets.add(n);
      }
      if (touches) line.push(p.id);
    }
    if (!line.length) continue;
    const inLine = new Set(line);
    const depth = [...new Set(line.flatMap((p) => PROVINCES[p].neighbours.filter((n) => friendly(n) && !inLine.has(n))))].sort((a, b) => a - b);
    // The enemy's border provinces, and one step further into its land.
    const border = new Set<number>();
    for (const p of line) for (const n of PROVINCES[p].neighbours) if (w.controller[n] === foe) border.add(n);
    const ring = new Set(border);
    for (const b of border) for (const n of PROVINCES[b].neighbours) if (w.controller[n] === foe) ring.add(n);
    const counts = (ps: Iterable<number>) => {
      let n = 0;
      for (const p of ps) for (const u of at.get(p) ?? []) if (isPlanned ? u.owner === foe : hostile(u.owner)) n++;
      return n;
    };
    let helpers = 0;
    for (const p of line) for (const u of at.get(p) ?? []) if (u.owner !== country && allies?.has(u.owner)) helpers++;
    const room = line.reduce((a, p) => a + supplyCapacity(p), 0) + depth.reduce((a, p) => a + supplyCapacity(p), 0);
    const touching = counts(border);
    const near = counts(ring);
    const guard = Math.min(room, isPlanned ? line.length : line.length + Math.ceil(touching / 2));
    // A great power's front takes as many as the line and the provinces behind it can feed, and half as many again in reserve further back.
    // In the phoney war (story.ts) Germany keeps only a screen in the West while it beats Poland, as it did: about 30 divisions.
    const screen = waiting && (foe === 'France' || foe === 'United Kingdom');
    const want = screen ? guard : Math.max(guard, isMajor(foe) ? Math.round(MAJOR_FRONT_ROOM * room) - helpers : Math.min(room - helpers, Math.ceil(MINOR_FRONT_RATIO * near) + 2 - helpers));
    fronts.push({ foe, planned: isPlanned, provinces: line, targets: [...targets].sort((a, b) => a - b), depth, near, touching, helpers, room, guard, want, share: 0 });
  }
  share(fronts, w.units.filter((u) => u.owner === country && !u.sea && !u.landing && !u.drop).length);
  return fronts;
}

/** Share `army` divisions between the fronts: guards first, then the small enemies, then the great fronts by the enemy facing them. */
function share(fronts: Front[], army: number): void {
  if (!fronts.length) return;
  let left = army >= 30 ? Math.floor(army * (1 - HOME_SHARE)) : army;
  const guards = fronts.reduce((a, f) => a + f.guard, 0);
  const scale = guards > left ? left / guards : 1;
  for (const f of fronts) {
    f.share = Math.floor(f.guard * scale);
    left -= f.share;
  }
  for (const f of fronts.filter((x) => !isMajor(x.foe))) {
    const extra = Math.max(0, Math.min(left, f.want - f.share));
    f.share += extra;
    left -= extra;
  }
  // The great fronts share what is left by the enemy facing them. A front that is full passes its share on.
  let open = fronts.filter((x) => isMajor(x.foe) && x.share < x.want);
  while (left > 0 && open.length) {
    const weight = open.reduce((a, f) => a + f.near + 1, 0);
    let given = 0;
    for (const f of open) {
      const n = Math.min(f.want - f.share, Math.max(1, Math.floor((left * (f.near + 1)) / weight)));
      f.share += n;
      given += n;
      if (given >= left) break;
    }
    left -= given;
    open = open.filter((x) => x.share < x.want);
  }
}

function unitsByProvince(w: World): Map<number, Unit[]> {
  const at = new Map<number, Unit[]>();
  for (const u of w.units) {
    const here = at.get(u.at);
    if (here) here.push(u);
    else at.set(u.at, [u]);
  }
  return at;
}

export function aiOrders(w: World, country: string, opts: AiOptions = {}): Order[] {
  const boldness = opts.boldness ?? 1.3;
  const enemies = new Set(enemiesOf(w, country));
  const army = opts.army;
  const planned = army ? (enemies.has(army.foe) ? [] : [army.foe]) : opts.planned ?? [];
  if (!enemies.size && !planned.length) return [];
  const orders: Order[] = [];
  const everyone = w.units.filter((u) => u.owner === country && (!army || army.units.has(u.id)));
  if (!everyone.length) return [];
  // Divisions getting ready to sail, or coming ashore, already have their orders.
  const mine = everyone.filter((u) => !u.sea && !u.landing && !u.drop);
  const edges = combatEdges(w.economies, { effects: w.story.effects, day: w.day, startDate: w.startDate, armies: w.armies });
  const friends = allianceMap(w.diplomacy);
  const allies = friends.get(country);

  const at = unitsByProvince(w);
  const unitsAt = (p: number) => at.get(p) ?? [];
  const enemyAt = (p: number) => unitsAt(p).filter((u) => enemies.has(u.owner));
  const mineAt = (p: number) => unitsAt(p).filter((u) => u.owner === country && (!army || army.units.has(u.id)));
  const friendly = (p: number) => w.controller[p] === country || !!allies?.has(w.controller[p]);
  const phoney = w.story.effects.some((x) => x.id === 'phoney' && x.country === country && x.until >= w.day);

  let seaToday = opts.sea;
  const sea = () => (seaToday ??= navalPicture(w, friends));

  // 1. The fronts.
  const fronts = frontsOf(w, country, planned).filter((f) => !army || f.foe === army.foe);
  // An army has one front, and all of it goes there.
  if (army) for (const f of fronts) f.share = f.want = mine.length;
  const fighting = fronts.filter((f) => !f.planned);

  // Divisions in, or on their way to, each province. Other friendly armies there eat from the same roads.
  const crowd = new Map<number, number>();
  for (const u of mine) {
    const dest = u.path.length ? u.path[u.path.length - 1] : u.at;
    crowd.set(dest, (crowd.get(dest) ?? 0) + 1);
  }
  for (const u of w.units) if ((u.owner !== country || (army && !army.units.has(u.id))) && !enemies.has(u.owner)) crowd.set(u.at, (crowd.get(u.at) ?? 0) + 1);
  const roomAt = (p: number) => supplyCapacity(p) - (crowd.get(p) ?? 0);
  // A division leaves a crowded province only when it is badly overcrowded: a quarter over still feeds it at 80%.
  const overcrowded = (p: number) => (crowd.get(p) ?? 0) > CROWDED * supplyCapacity(p);

  // Operations overseas (operations.ts): the planned landings and expeditions under way today.
  const ops = army ? [] : activeOperations(w, country);
  const ashore = army ? [] : landedOperations(w, country);
  const ended = army ? [] : endedOperations(w, country);
  const landings = ops.filter((o) => o.kind === 'landing' && !ashore.includes(o));
  const helps = ops.filter((o) => o.kind === 'help');
  // Divisions allowed overseas: an eighth of the army, plus what the operations under way call for.
  // Each operation may have up to its `follow` in its own area (or on the way there), whatever is overseas elsewhere.
  const opsUnderWay = [...ops, ...ashore].filter((o, i, a) => a.indexOf(o) === i);
  const isAbroad = (u: Unit) => !!u.sea || !!u.landing || w.owner[u.at] !== country;
  const inArea = (o: Operation) => mine.filter((u) => o.area.includes(u.sea ? u.sea.to : u.at)).length;
  const abroadNow = mine.filter(isAbroad).length;
  const elsewhere = mine.filter((u) => isAbroad(u) && !opsUnderWay.some((o) => o.area.includes(u.sea ? u.sea.to : u.at))).length;
  const abroadCap = abroadNow + Math.max(0, Math.floor(EXPEDITION_SHARE * mine.length) - elsewhere) + opsUnderWay.reduce((a, o) => a + Math.max(0, o.follow - inArea(o)), 0);

  if (army && !fronts.length) return [];
  if (!fighting.length && enemies.size && !fronts.length) {
    // No front on land anywhere: the only way at the enemy is by sea.
    return seaOrders({ w, country, sea: sea(), enemies, allies, edges, boldness, stranded: mine.filter((u) => !u.path.length), front: [], crowd, abroadCap, landings, helps });
  }

  const used = new Set<number>();
  const ready = (u: Unit) => !used.has(u.id) && u.organisation >= READY_ORG && u.supply >= 0.7;
  const attacking = (u: Unit) => u.path.length > 0 && enemyAt(u.path[0]).length > 0;

  // Pull worn-out divisions out of attacks.
  let port: number | null | undefined;
  const homePort = () => {
    if (port === undefined) {
      const capital = musterPoint(w.controller, country, w.owner);
      port = capital === null ? null : COAST[capital].length ? capital : PROVINCES.filter((p) => w.controller[p.id] === country && p.owner === country && COAST[p.id].length).sort((a, b) => b.victoryPoints - a.victoryPoints || a.id - b.id)[0]?.id ?? null;
    }
    return port;
  };
  for (const u of mine) {
    // Dunkirk: a worn-out division on a foreign shore, heavily outnumbered, is taken off by sea.
    if (!army && u.organisation < 30 && COAST[u.at].length && w.owner[u.at] !== country && !PROVINCES[u.at].neighbours.some((n) => w.controller[n] === country)) {
      const around = PROVINCES[u.at].neighbours.reduce((a, n) => a + enemyAt(n).length, 0);
      if (around >= 2 * mineAt(u.at).length && around >= 3) {
        const to = homePort();
        if (to !== null && to !== u.at && !('why' in seaRoute(sea(), country, u.at, to, false))) {
          used.add(u.id);
          orders.push({ type: 'ship', unit: u.id, to });
          continue;
        }
      }
    }
    if (attacking(u)) {
      used.add(u.id);
      if (u.organisation < PULL_OUT_ORG) orders.push({ type: 'halt', unit: u.id });
    } else if (u.path.length) used.add(u.id); // already marching somewhere: leave it be
  }

  // 2. Which front each division belongs to today, and the ones that move between fronts.
  // Friendly land in pieces: a division can walk only within its own piece.
  const piece = new Array<number>(PROVINCES.length).fill(-1);
  {
    let n = 0;
    for (const p of PROVINCES) {
      if (piece[p.id] >= 0 || !friendly(p.id)) continue;
      const queue = [p.id];
      piece[p.id] = n;
      for (let i = 0; i < queue.length; i++) for (const q of PROVINCES[queue[i]].neighbours) if (piece[q] < 0 && friendly(q)) (piece[q] = n, queue.push(q));
      n++;
    }
  }
  // A front overseas (not on the same land as the capital) gets what its operation calls for, or
  // nothing once the expedition has been called home. Without an operation it shares the eighth of
  // the army that may go overseas.
  const capital = musterPoint(w.controller, country, w.owner);
  const homePiece = capital === null ? -1 : piece[capital];
  const touches = (f: Front, o: Operation) => [...f.provinces, ...f.targets].some((p) => o.area.includes(p));
  for (const f of fighting) {
    if (army || homePiece < 0 || f.provinces.some((p) => piece[p] === homePiece)) continue;
    if (ended.some((o) => touches(f, o))) f.share = 0;
    else {
      const o = [...ops, ...ashore].filter((x) => touches(f, x));
      f.share = Math.min(f.share, o.length ? Math.max(...o.map((x) => x.follow)) : Math.floor(EXPEDITION_SHARE * mine.length));
    }
  }
  // An expedition called home sails for home.
  if (ended.length) {
    const port = homePort();
    for (const u of mine) {
      if (used.has(u.id) || port === null || !ended.some((o) => o.area.includes(u.at)) || w.owner[u.at] === country) continue;
      if ('why' in seaRoute(sea(), country, u.at, port, false)) continue;
      used.add(u.id);
      orders.push({ type: 'ship', unit: u.id, to: port });
    }
  }
  // Each province of a line belongs to the front with most enemy divisions next to it (a war before a planned one).
  const lineOf = new Map<number, Front>();
  const pressure = (f: Front, p: number) => PROVINCES[p].neighbours.reduce((a, n) => a + (w.controller[n] === f.foe ? enemyAt(n).length + 0.5 : 0), 0) + (f.planned ? 0 : 1000);
  for (const f of fronts) for (const p of f.provinces) {
    const was = lineOf.get(p);
    if (!was || pressure(f, p) > pressure(was, p) || (pressure(f, p) === pressure(was, p) && f.foe < was.foe)) lineOf.set(p, f);
  }
  const depthOf = new Map<number, Front>();
  for (const f of fronts) for (const p of f.depth) if (!lineOf.has(p) && !depthOf.has(p)) depthOf.set(p, f);
  const station = (u: Unit) => (u.path.length && !attacking(u) ? u.path[u.path.length - 1] : u.at);
  const members = new Map<Front, Unit[]>(fronts.map((f) => [f, []]));
  const pool: Unit[] = [];
  for (const u of mine) {
    const s = station(u);
    const f = lineOf.get(s) ?? depthOf.get(s);
    if (f) members.get(f)!.push(u);
    else pool.push(u);
  }
  // Fronts with more than their share give up divisions from the rear, never their guard or those fighting.
  for (const f of fronts) {
    const list = members.get(f)!;
    const spare = list.length - f.share;
    if (spare <= Math.max(2, Math.ceil(0.15 * f.share))) continue;
    const behind = (u: Unit) => (lineOf.get(station(u)) === f ? 1 : 0);
    const movable = list
      .filter((u) => !used.has(u.id) && !attacking(u) && !w.battles.some((b) => b.province === u.at))
      .sort((a, b) => behind(a) - behind(b) || b.id - a.id);
    const keepInLine = Math.max(f.guard, f.provinces.length);
    let inLine = list.filter((u) => lineOf.get(station(u)) === f).length;
    const released = new Set<number>();
    for (const u of movable) {
      if (released.size >= spare) break;
      if (behind(u)) {
        if (inLine <= keepInLine) continue;
        inLine--;
      }
      released.add(u.id);
      pool.push(u);
    }
    members.set(f, list.filter((u) => !released.has(u.id)));
  }
  // Fronts that are short take divisions from the pool, the nearest first.
  const assigned = new Map<number, Front>();
  for (const [f, list] of members) for (const u of list) assigned.set(u.id, f);
  const short = fronts.filter((f) => members.get(f)!.length < f.share).sort((a, b) => b.share - members.get(b)!.length - (a.share - members.get(a)!.length) || (a.foe < b.foe ? -1 : 1));
  const free = pool.filter((u) => !used.has(u.id)).sort((a, b) => a.id - b.id);
  const centre = (f: Front): [number, number] => {
    const xs = f.provinces.map((p) => PROVINCES[p].centre);
    return [xs.reduce((a, c) => a + c[0], 0) / xs.length, xs.reduce((a, c) => a + c[1], 0) / xs.length];
  };
  const stranded: Unit[] = [];
  const taken = new Set<number>();
  for (const f of short) {
    const pieces = new Set(f.provinces.map((p) => piece[p]));
    const c = centre(f);
    const need = f.share - members.get(f)!.length;
    const byLand = free.filter((u) => !taken.has(u.id) && pieces.has(piece[u.at])).sort((a, b) => distanceKm(PROVINCES[a.at].centre, c) - distanceKm(PROVINCES[b.at].centre, c) || a.id - b.id);
    for (const u of byLand.slice(0, need)) {
      taken.add(u.id);
      assigned.set(u.id, f);
      members.get(f)!.push(u);
    }
  }
  // Divisions in the pool that no front can use by land wait at home, or go by sea to a front that is short.
  const shortByLand = short.filter((f) => members.get(f)!.length < f.share && !f.planned);
  for (const u of free) {
    if (taken.has(u.id) || u.path.length) continue;
    const reachable = fighting.some((f) => f.provinces.some((p) => piece[p] === piece[u.at]));
    if (!reachable && (shortByLand.length || !fighting.length)) stranded.push(u);
  }

  // 3. Fighting each front.
  const defenders = (t: number) => enemyAt(t).map((u) => defencePower(u, 1, edges.defence(u, t))).sort((a, b) => b - a).slice(0, DEFENCE_WIDTH);
  const defenceOf = (t: number) => defenders(t).reduce((a, b) => a + b, 0);
  const value = (t: number) => PROVINCES[t].victoryPoints;
  // The guard a front province keeps back when the rest attack: one division, plus a third of
  // the enemy divisions next to it that are NOT in the province being attacked.
  // Never more than a quarter of what the province can feed in an offensive, or half otherwise:
  // divisions attacking from a province still stand in it and defend it.
  const guardFor = (p: number, target: number, offensive: boolean) =>
    Math.min(1 + Math.ceil(PROVINCES[p].neighbours.reduce((a, n) => a + (n === target ? 0 : enemyAt(n).length), 0) / 3), Math.ceil(supplyCapacity(p) / (offensive ? 4 : 2)));
  // The guard it keeps when divisions are sent elsewhere along the front.
  const guardAt = (p: number) => Math.min(Math.max(1, Math.ceil(PROVINCES[p].neighbours.reduce((a, n) => a + enemyAt(n).length, 0) / 2)), Math.ceil(supplyCapacity(p) / 2));
  const keyCity = (p: number) => w.owner[p] === country && PROVINCES[p].owner === country && PROVINCES[p].victoryPoints >= KEY_CITY_VP;
  const staging = new Map<Front, number[]>();
  const holding = new Map<Front, Set<number>>();
  const foeLinks = new Map<string, boolean[]>();

  for (const f of fighting) {
    const list = members.get(f)!;
    // How strong is this front, ours against theirs?
    let ours = 0;
    for (const u of list) ours += STATS[u.type].attack * (u.strength / 100) * edges.attack(u);
    // Allies standing on the line fight the same enemy.
    for (const p of f.provinces) for (const u of unitsAt(p)) if (u.owner !== country && allies?.has(u.owner)) ours += STATS[u.type].attack * (u.strength / 100) * edges.attack(u);
    let theirs = 0;
    const seen = new Set<number>();
    // An army pushing at a target weighs the enemy on its own axis, not the whole front.
    for (const t of f.targets) {
      if (army && !army.targets.has(t)) continue;
      for (const p of [t, ...PROVINCES[t].neighbours]) {
        if (seen.has(p) || w.controller[p] !== f.foe) continue;
        seen.add(p);
        for (const u of enemyAt(p)) theirs += STATS[u.type].defence * (u.strength / 100) * edges.defence(u, p);
      }
    }
    const ratio = theirs > 0 ? ours / theirs : 99;
    // An enemy caught by surprise, or in shock, is attacked all-out before it can recover.
    const margin = (ratio >= OFFENSIVE_RATIO ? OFFENSIVE_MARGIN : 1) * (edges.reeling?.(f.foe) ? REELING_MARGIN : 1);
    // An army ordered to push attacks wherever its pace finds the odds; only the AI waits for the whole front to be strong enough.
    const defensive = !army && ratio < DEFENSIVE_RATIO;

    // Encirclement: how many of the foe's divisions would lose their supply if we took each target?
    let links = foeLinks.get(f.foe);
    if (!links) foeLinks.set(f.foe, (links = linkedProvinces(w.controller, f.foe, friends.get(f.foe), sea())));
    const cutOff = (t: number): number => {
      const controller = [...w.controller];
      controller[t] = country;
      const after = linkedProvinces(controller, f.foe, friends.get(f.foe), sea());
      let n = 0;
      for (const p of PROVINCES) {
        if (p.id === t || !links![p.id] || after[p.id]) continue;
        for (const u of unitsAt(p.id)) if (enemies.has(u.owner)) n++;
      }
      return n;
    };

    const scored = f.targets
      .filter((t) => !army || army.targets.has(t))
      .map((t) => {
        const defence = defenceOf(t);
        const cut = defence > 0 ? cutOff(t) : 0;
        const battle = w.battles.find((b) => b.province === t && b.attackers.includes(country));
        // A battle whose front line is moving our way is one to keep pushing.
        const winning = !!battle && (battle.push > 0 || battle.line >= WINNING_LINE);
        return { t, defence, cut, ongoing: w.battles.some((b) => b.province === t), winning, priority: (value(t) + 2 * cut + 1) / (defence + 1) + (winning ? 1 : 0) };
      })
      .sort((a, b) => b.priority - a.priority || a.t - b.t);
    // In the phoney war (story.ts) France and Britain wait for Germany to attack in the West, and Germany waits for its plan.
    const waiting = phoney && (country === 'Germany' ? f.foe === 'France' || f.foe === 'United Kingdom' : f.foe === 'Germany');
    // Divisions sent in before the waiting began (on the day war was declared) are called back.
    if (waiting) for (const u of list) if (u.path.length && w.controller[u.path[0]] === f.foe && !used.has(u.id)) (used.add(u.id), orders.push({ type: 'halt', unit: u.id }));
    for (const { t, defence, cut, ongoing, winning } of scored) {
      if (waiting) break;
      const around = PROVINCES[t].neighbours.filter(friendly);
      if (defence === 0) {
        // Undefended: one fast division is enough, unless someone is already on the way.
        if (mine.some((u) => u.path[u.path.length - 1] === t)) continue;
        const pick = around
          .flatMap((n) => mineAt(n).filter((u) => !used.has(u.id) && u.organisation >= 30).map((u) => ({ u, days: daysToEnter(n, t, u.type) })))
          .sort((a, b) => a.days - b.days || a.u.id - b.u.id)[0];
        if (pick) {
          used.add(pick.u.id);
          orders.push({ type: 'move', unit: pick.u.id, to: t });
        }
        continue;
      }
      if (defensive && !ongoing) continue;
      // Defended: who could join, keeping the weakest divisions back as each province's guard?
      const force: Unit[] = [];
      for (const n of around) {
        const here = mineAt(n);
        const ok = here.filter((u) => !attacking(u) && ready(u)).sort((a, b) => b.organisation - a.organisation || a.id - b.id);
        const stayers = here.filter((u) => !attacking(u)).length - ok.length;
        force.push(...ok.slice(0, Math.max(0, ok.length - Math.max(0, guardFor(n, t, margin < 1) - stayers))));
      }
      const already = mine.filter((u) => u.path[0] === t && attacking(u));
      // Allied divisions already attacking the same province fight beside ours.
      const beside = w.units.filter((u) => u.owner !== country && u.path[0] === t && u.at !== t && !enemies.has(u.owner) && enemyAt(t).some((e) => w.wars.includes(e.owner < u.owner ? `${e.owner}|${u.owner}` : `${u.owner}|${e.owner}`)));
      if (!force.length && !already.length) continue;
      // Will the defenders run out of organisation before we do? Each side's line wears the other
      // down at a rate set by its hitting power, and reserves take over from tired divisions.
      const theirStamina = enemyAt(t).reduce((a, u) => a + u.organisation, 0) + 1;
      // Whoever controls the sky hits 15% harder, and the other side 15% less hard.
      const sky = opts.air ? opts.air([country], [w.controller[t]], t) : 1;
      const oddsOf = (all: Unit[]): number => {
        const directions = new Set(all.map((u) => u.at)).size;
        const width = ATTACK_WIDTH + ATTACK_WIDTH_PER_EXTRA_DIRECTION * (directions - 1);
        const power = all.map((u) => attackPower(u, t, edges.attack(u))).sort((a, b) => b - a).slice(0, width).reduce((a, b) => a + b, 0);
        const ourStamina = all.reduce((a, u) => a + Math.max(0, u.organisation - 10), 0);
        return (power * sky * ourStamina) / (defence * (2 - sky) * theirStamina);
      };
      const odds = oddsOf([...force, ...already, ...beside]);
      // Joining a battle already under way needs less of an edge than starting one; so does an offensive or an encirclement.
      const need = boldness * margin * (ongoing ? 0.8 : 1) * (winning ? WINNING_MARGIN : 1) * (cut >= ENCIRCLE_DIVISIONS ? ENCIRCLE_MARGIN : 1);
      if (odds < need) {
        // Not enough to win. If even the divisions already attacking plus these have little hope, call it off,
        // unless the front line is still moving forward.
        if (odds < boldness * 0.5 && !winning) for (const u of already) orders.push({ type: 'halt', unit: u.id });
        continue;
      }
      // Send no more than it takes to win comfortably, taking turns from each direction, so that the
      // rest can attack elsewhere and the province is not overcrowded once it is taken.
      const queues = around.map((n) => force.filter((u) => u.at === n));
      const going: Unit[] = [];
      for (let i = 0; going.length < force.length; i++) {
        for (const q of queues) if (i < q.length) going.push(q[i]);
        if (i > force.length) break;
      }
      const sent: Unit[] = [];
      for (const u of going) {
        if (sent.length && oddsOf([...sent, ...already, ...beside]) >= ENOUGH * need && sent.length + already.length >= Math.min(supplyCapacity(t), going.length) / 2) break;
        sent.push(u);
      }
      for (const u of sent) {
        used.add(u.id);
        orders.push({ type: 'move', unit: u.id, to: t });
      }
    }
    // Where the next attacks will start: the friendly provinces next to the best defended targets.
    // Divisions already next to one of the six best stay there, so the line does not shuffle every day.
    const next = scored.filter((s) => s.defence > 0).map((s) => s.t);
    const around = (ts: number[]) => ts.flatMap((t) => PROVINCES[t].neighbours.filter(friendly)).filter((n, i, a) => a.indexOf(n) === i);
    staging.set(f, around(next.slice(0, 3)).slice(0, 3));
    holding.set(f, new Set(around(next.slice(0, 6))));
  }

  // 4. Moving up: each division goes where its front wants it.
  const speed = (u: Unit, from: number, to: number) => distanceKm(PROVINCES[from].centre, PROVINCES[to].centre) / (u.type === 'infantry' ? 25 : 35);
  for (const u of mine) {
    if (used.has(u.id) || u.path.length) continue;
    const f = assigned.get(u.id);
    const here = u.at;
    const crowded = overcrowded(here);
    if (!f) {
      // Not needed at any front: it stays where it is, unless the province cannot feed it.
      if (crowded) moveTo(u, nearestRoom(here));
      continue;
    }
    const zone = new Set([...f.provinces, ...f.depth]);
    const inLine = lineOf.get(here) === f;
    // A great city of its own in the line (the capital, or any of 10 victory points or more) is held in full strength.
    const key = f.provinces.filter((p) => lineOf.get(p) === f && keyCity(p));
    const main = [...key, ...(staging.get(f) ?? [])];
    if (inLine && !crowded) {
      // A guard stays put: the first divisions by id in each front province.
      const rank = mineAt(here).filter((x) => !x.path.length).sort((a, b) => a.id - b.id).indexOf(u);
      if (rank < (keyCity(here) ? supplyCapacity(here) : guardAt(here))) continue;
      if (main.includes(here) || holding.get(f)?.has(here)) continue; // already where the next attacks will start
      if (f.planned) continue;
    }
    // Choose where to go: a staging province with room, else any province of the line with room,
    // else behind it. A division in an overcrowded province may also step back to any neighbour with room.
    const choices: [number, number][] = [
      ...main.map((p): [number, number] => [p, 0]),
      ...f.provinces.filter((p) => lineOf.get(p) === f).map((p): [number, number] => [p, 20]),
      ...(inLine ? [] : f.depth.map((p): [number, number] => [p, 30])),
      ...(crowded ? PROVINCES[here].neighbours.filter(friendly).map((p): [number, number] => [p, 40]) : []),
    ];
    let best = -1;
    // Staying put is a choice too: a division already on its front moves only for something better.
    let bestCost = !crowded && zone.has(here) ? (main.includes(here) ? 0 : inLine ? 20 : 30) : Infinity;
    for (const [p, penalty] of choices) {
      if (p === here || piece[p] !== piece[here] || roomAt(p) <= 0) continue;
      if (inLine && !crowded && penalty > 0) continue; // do not shuffle sideways along the front for nothing
      const cost = speed(u, here, p) + penalty + (crowd.get(p) ?? 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = p;
      }
    }
    // Nowhere near has room: fall back to the nearest province of the front, or just behind it, that does.
    // And if the whole front is full, to the nearest province with room anywhere behind it, rather than starve in a crowd.
    if (best < 0 && crowded) best = nearestRoom(here, (p) => zone.has(p) || PROVINCES[p].neighbours.some((n) => zone.has(n)));
    if (best < 0 && crowded) best = nearestRoom(here);
    moveTo(u, best);
  }

  // 5. Divisions with no way to the front on foot go by sea, if the sea allows.
  // Allies of convenience do not mix their armies: a communist state and the others fight the same enemy on separate fronts.
  const red = (name: string) => w.economies[name]?.government === 'communist';
  const welcome = (p: number) => red(w.owner[p]) === red(country) || opsUnderWay.some((o) => o.area.includes(p));
  const frontList = fighting.flatMap((f) => f.provinces).filter((p, i, a) => a.indexOf(p) === i && welcome(p)).sort((a, b) => a - b);
  // Reinforcements by sea go to the fronts overseas that are short.
  const overseas = fighting.filter((f) => members.get(f)!.length < f.share && !f.provinces.some((p) => piece[p] === homePiece)).flatMap((f) => f.provinces).filter(welcome);
  if (!army && enemies.size && (stranded.length || landings.length || helps.length)) {
    const atHome = landings.length || helps.length ? mine.filter((u) => !used.has(u.id) && !u.path.length && piece[u.at] === homePiece && !lineOf.has(u.at) && !assigned.has(u.id)) : [];
    const sailing = [...stranded, ...atHome.filter((u) => !stranded.includes(u))];
    orders.push(...seaOrders({ w, country, sea: sea(), enemies, allies, edges, boldness, stranded: sailing, front: overseas.length ? overseas : frontList, crowd, abroadCap, landings, helps, onLand: fighting.length > 0 && stranded.length < 0.3 * mine.length }));
  }
  return orders;

  function moveTo(u: Unit, p: number): void {
    if (p < 0 || p === u.at) return;
    crowd.set(p, (crowd.get(p) ?? 0) + 1);
    crowd.set(u.at, (crowd.get(u.at) ?? 1) - 1);
    // In the phoney war a division changing places keeps to friendly land, so as not to start the
    // fighting on its way (one walked from Italy to Baden through France).
    orders.push(phoney ? { type: 'move', unit: u.id, to: p, friendly: true } : { type: 'move', unit: u.id, to: p });
  }

  /** The nearest friendly province, through friendly land, that can feed one more division. A big army keeps its reserves in depth. */
  function nearestRoom(from: number, within: (p: number) => boolean = () => true): number {
    const seen = new Set([from]);
    let ring = [from];
    while (ring.length) {
      const next: number[] = [];
      for (const q of ring) {
        for (const n of PROVINCES[q].neighbours) {
          if (seen.has(n) || !friendly(n)) continue;
          seen.add(n);
          next.push(n);
          if (roomAt(n) > 0 && within(n)) return n;
        }
      }
      ring = next;
    }
    return -1;
  }
}
