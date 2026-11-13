/**
 * A simple army commander for AI countries.
 *
 * It only looks at what a player in the same seat could see: its own divisions and the enemy
 * divisions in provinces next to its own. Each day it:
 *
 *   1. walks into undefended enemy provinces next to its land, richest first;
 *   2. attacks a defended province when its ready divisions around it have enough hitting
 *      power and staying power to outlast the defenders (by the `boldness` margin, 1.3 by
 *      default);
 *   3. calls off attacks by divisions that are worn out;
 *   4. moves divisions out of provinces too crowded to supply (back into the rear if the
 *      front is full), keeps a guard on each front province in proportion to the enemy next
 *      to it, and sends everything else towards the weakest valuable point of the enemy line.
 *
 * It has no memory: the orders depend only on the world as it is today. When and against whom
 * a country goes to war is decided elsewhere (agenda.ts); this only fights the war. Allied land
 * counts as friendly ground.
 */
import { ATTACK_WIDTH, ATTACK_WIDTH_PER_EXTRA_DIRECTION, attackPower, defencePower, DEFENCE_WIDTH } from './combat';
import { daysToEnter, findRoute, PROVINCES } from './map';
import { combatEdges } from './mods';
import { supplyCapacity } from './supply';
import type { Order, Unit, World } from './types';
import { allianceMap } from './diplomacy';
import { canEnter, enemiesOf } from './war';

export interface AiOptions {
  /** Attack when the estimated odds of outlasting the defenders are at least this. */
  boldness?: number;
}

/** A division is ready to attack when it is rested and fed. */
const READY_ORG = 60;
/** An attacking division is pulled out below this organisation. */
const PULL_OUT_ORG = 25;

export function aiOrders(w: World, country: string, opts: AiOptions = {}): Order[] {
  const boldness = opts.boldness ?? 1.3;
  const enemies = new Set(enemiesOf(w, country));
  if (!enemies.size) return [];
  const orders: Order[] = [];
  const mine = w.units.filter((u) => u.owner === country);
  if (!mine.length) return [];
  const edges = combatEdges(w.economies);

  const at = new Map<number, Unit[]>();
  for (const u of w.units) {
    const here = at.get(u.at);
    if (here) here.push(u);
    else at.set(u.at, [u]);
  }
  const unitsAt = (p: number) => at.get(p) ?? [];
  const enemyAt = (p: number) => unitsAt(p).filter((u) => enemies.has(u.owner));
  const mineAt = (p: number) => unitsAt(p).filter((u) => u.owner === country);
  const isEnemyLand = (p: number) => enemies.has(w.controller[p]);
  // Allied land is friendly ground: the army may stand on it, march through it and attack from it.
  const allies = allianceMap(w.diplomacy).get(country);
  const friendly = (p: number) => w.controller[p] === country || !!allies?.has(w.controller[p]);

  // Enemy provinces next to mine, and my provinces next to the enemy (the front).
  const targets = new Set<number>();
  const front = new Set<number>();
  for (const p of PROVINCES) {
    if (!friendly(p.id)) continue;
    for (const n of p.neighbours) {
      if (isEnemyLand(n)) {
        targets.add(n);
        front.add(p.id);
      }
    }
  }
  if (!targets.size) return [];

  const used = new Set<number>();
  const ready = (u: Unit) => !used.has(u.id) && u.organisation >= READY_ORG && u.supply >= 0.7;
  const attacking = (u: Unit) => u.path.length > 0 && enemyAt(u.path[0]).length > 0;

  // 3. Pull worn-out divisions out of attacks.
  for (const u of mine) {
    if (attacking(u)) {
      used.add(u.id);
      if (u.organisation < PULL_OUT_ORG) orders.push({ type: 'halt', unit: u.id });
    } else if (u.path.length) used.add(u.id); // already marching somewhere: leave it be
  }

  /** The defenders of a target that fit in the line, strongest first. */
  const lineOf = (t: number) => enemyAt(t).map((u) => defencePower(u, 1, edges.defence(u, t))).sort((a, b) => b - a).slice(0, DEFENCE_WIDTH);
  const defenceOf = (t: number) => lineOf(t).reduce((a, b) => a + b, 0);
  const value = (t: number) => PROVINCES[t].victoryPoints;

  // The guard a front province keeps back when the rest attack: one division, plus a third of
  // the enemy divisions next to it that are NOT in the province being attacked.
  const guardFor = (f: number, target: number) =>
    1 + Math.ceil(PROVINCES[f].neighbours.reduce((a, n) => a + (n === target ? 0 : enemyAt(n).length), 0) / 3);
  // The guard it keeps when divisions are sent elsewhere along the front.
  const guard = new Map<number, number>();
  for (const f of front) guard.set(f, Math.max(1, Math.ceil(PROVINCES[f].neighbours.reduce((a, n) => a + enemyAt(n).length, 0) / 2)));

  // 1 and 2. Go through the targets, the easiest and richest first.
  const scored = [...targets]
    .map((t) => ({ t, defence: defenceOf(t), ongoing: w.battles.some((b) => b.province === t) }))
    .sort((a, b) => a.defence / value(a.t) - b.defence / value(b.t) || a.t - b.t);
  for (const { t, defence, ongoing } of scored) {
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
    // Defended: who could join, keeping the weakest divisions back as each province's guard?
    const force: Unit[] = [];
    for (const n of around) {
      const here = mineAt(n);
      const free = here.filter((u) => !attacking(u) && ready(u)).sort((a, b) => b.organisation - a.organisation || a.id - b.id);
      const stayers = here.filter((u) => !attacking(u)).length - free.length;
      force.push(...free.slice(0, Math.max(0, free.length - Math.max(0, guardFor(n, t) - stayers))));
    }
    const already = mine.filter((u) => u.path[0] === t && attacking(u));
    const all = [...force, ...already];
    if (!all.length) continue;
    // Will the defenders run out of organisation before we do? Each side's line wears the other
    // down at a rate set by its hitting power, and reserves take over from tired divisions.
    const directions = new Set(all.map((u) => u.at)).size;
    const width = ATTACK_WIDTH + ATTACK_WIDTH_PER_EXTRA_DIRECTION * (directions - 1);
    const power = all.map((u) => attackPower(u, t, edges.attack(u))).sort((a, b) => b - a).slice(0, width).reduce((a, b) => a + b, 0);
    const ourStamina = all.reduce((a, u) => a + Math.max(0, u.organisation - 10), 0);
    const theirStamina = enemyAt(t).reduce((a, u) => a + u.organisation, 0) + 1;
    const odds = (power * ourStamina) / (defence * theirStamina);
    // Joining a battle already under way needs less of an edge than starting one.
    if (odds < (ongoing ? boldness * 0.8 : boldness)) {
      // Not enough to win. If even the divisions already attacking plus these have little hope, call it off.
      if (odds < boldness * 0.5) for (const u of already) orders.push({ type: 'halt', unit: u.id });
      continue;
    }
    for (const u of force) {
      used.add(u.id);
      orders.push({ type: 'move', unit: u.id, to: t });
    }
  }

  // 4. Everything else heads for the main effort: the front province next to the best target.
  const crowd = new Map<number, number>();
  for (const u of mine) {
    const dest = u.path.length ? u.path[u.path.length - 1] : u.at;
    crowd.set(dest, (crowd.get(dest) ?? 0) + 1);
  }
  const staging = scored
    .filter((s) => s.defence > 0)
    .flatMap((s) => PROVINCES[s.t].neighbours.filter(friendly))
    .filter((n, i, a) => a.indexOf(n) === i);
  const frontList = [...front].sort((a, b) => a - b);
  for (const u of mine) {
    if (used.has(u.id) || u.path.length) continue;
    const here = u.at;
    const isFront = front.has(here);
    // A guard stays put: the first divisions by id in each front province.
    const crowded = (crowd.get(here) ?? 0) > supplyCapacity(here);
    if (isFront && !crowded) {
      const rank = mineAt(here).filter((x) => !x.path.length).sort((a, b) => a.id - b.id).indexOf(u);
      if (rank < (guard.get(here) ?? 1)) continue;
      if (staging.slice(0, 3).includes(here)) continue; // already where the next attack will start
    }
    // Choose where to go: a staging province with room, else any front province with room.
    // A division in an overcrowded province may also step back to any neighbour with room.
    const choices = [...staging.slice(0, 3), ...frontList, ...(crowded ? PROVINCES[here].neighbours.filter(friendly) : [])];
    let best = -1;
    let bestCost = Infinity;
    choices.forEach((p, i) => {
      if (p === here) return;
      const room = supplyCapacity(p) - (crowd.get(p) ?? 0);
      if (room <= 0) return;
      const mainEffort = i < 3;
      if (isFront && !mainEffort && !crowded) return; // do not shuffle sideways along the front for nothing
      const route = findRoute(here, p, u.type, (q) => canEnter(w, country, q, allies) && !isEnemyLand(q));
      if (!route) return;
      let days = 0;
      let from = here;
      for (const q of route) {
        days += daysToEnter(from, q, u.type);
        from = q;
      }
      const cost = days + (mainEffort ? 0 : 20) + (crowd.get(p) ?? 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = p;
      }
    });
    if (best < 0 && crowded) {
      // Nowhere near has room: fall back through friendly land to the nearest province that does.
      // A big army keeps its reserves in depth instead of starving in one overcrowded province.
      const seen = new Set([here]);
      let ring = [here];
      while (best < 0 && ring.length) {
        const next: number[] = [];
        for (const q of ring) {
          for (const n of PROVINCES[q].neighbours) {
            if (seen.has(n) || !friendly(n)) continue;
            seen.add(n);
            next.push(n);
            if (best < 0 && supplyCapacity(n) - (crowd.get(n) ?? 0) > 0) best = n;
          }
        }
        ring = next;
      }
    }
    if (best >= 0) {
      crowd.set(best, (crowd.get(best) ?? 0) + 1);
      crowd.set(here, (crowd.get(here) ?? 1) - 1);
      orders.push({ type: 'move', unit: u.id, to: best });
    }
  }
  return orders;
}
