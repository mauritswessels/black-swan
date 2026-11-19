/**
 * Land battles.
 *
 * A battle starts when a division is ordered into a province where enemy divisions stand.
 * The attackers stay in their own province and fight from there; they walk in only once the
 * defenders have gone. A battle runs one round per day. Each side's damage for the day is:
 *
 *   damage = sum over its divisions in the fight of
 *              attack (or defence, for the defenders)
 *              x strength / 100
 *              x terrain          (attackers only)
 *              x dig-in           (defenders only)
 *              x supply           (0.5 when cut off, up to 1.0)
 *              x edge             (research, plans and forts: see mods.ts)
 *            x luck               (0.9 to 1.1, from the seeded generator)
 *
 * The damage is shared equally among the enemy divisions in the fight. It wears down
 * organisation, and a little strength. A defender at zero organisation retreats, or surrenders
 * if it has nowhere to go. A retreat costs a tenth of the division's strength, a fifth when the
 * attackers' tanks can chase it across open ground. An attacker below 10 organisation gives up
 * the attack.
 *
 * Two more multipliers apply to a whole side. Air: the side that controls the sky over the
 * province hits 15% harder and the other 15% less hard (air.ts). Landings: a division coming
 * ashore from the sea attacks at 60% (navy.ts; this one is part of `edge`).
 *
 * Rivers (rivers.ts) and the season (seasons.ts) weaken attacks too: a division attacking across
 * a great river hits at 75%, and one attacking into mud at 80%.
 *
 * Fire support (forces.ts): bombers aimed at the battle and ships shelling the coast add their
 * damage to their side's total each day, before luck. It counts in the front line's push like
 * any other damage.
 *
 * The front line. Every battle has a line from 0 (the attackers are still at the border) to
 * 100 (they have reached the far side). Each day it moves by
 *
 *   push = 10 x (attackers' damage - defenders' damage) / (attackers' damage + defenders' damage)
 *          x ground   (0.5 in mud, 0.75 in snow)
 *          x river    (until the line is 20 points in: half pace for the share of the attack
 *                      that comes across a river)
 *
 * so a day where you deal twice the damage you take moves it about 3 points forward, and a day
 * where you take more than you deal moves it back. When the defenders break and fall back, the
 * attackers rush after them: the line jumps 60% of the way that is left (85% when tanks can
 * chase them across open ground), and they march the rest. The province changes hands only when the line reaches 100. If it gets there while the
 * defenders still stand, they are pushed out. Walking into empty enemy land works the same
 * way, drawn from how far the division has walked.
 */
import { distanceKm, PROVINCES } from './map';
import { combatEdges, type Edges } from './mods';
import { Rng } from './rng';
import type { Battle, BattleReport, BattleTally, Cause, Economy, Terrain, Unit, UnitType, World } from './types';
import { atWar } from './war';
import { ln } from './dmath';
import { BRIDGEHEAD, RIVER_ATTACK, RIVER_PUSH, riverBetween } from './rivers';
import { GROUND_PUSH, groundOn, type Ground } from './seasons';
import { fortressAt, fortressAttack } from './fortresses';

export const STATS: Record<UnitType, { attack: number; defence: number }> = {
  infantry: { attack: 10, defence: 15 },
  armour: { attack: 22, defence: 10 },
  artillery: { attack: 16, defence: 8 },
  /** Paratroopers: picked volunteers with light weapons, a little better than infantry in attack, a little worse in defence. */
  airborne: { attack: 13, defence: 13 },
};

/** How much of their hitting power attackers keep when attacking INTO each terrain. */
export const TERRAIN_ATTACK: Record<Terrain, number> = { plains: 1, desert: 0.9, forest: 0.8, hills: 0.7, marsh: 0.7, mountains: 0.5 };
/** Tanks lose a further 30% in country they cannot drive across freely. */
export const ARMOUR_ROUGH: Terrain[] = ['forest', 'marsh', 'mountains'];
export const ARMOUR_ROUGH_FACTOR = 0.7;

/** Defenders gain 2% a day for standing still, up to 20%. */
export const DIG_IN_PER_DAY = 0.02;
export const DIG_IN_MAX_DAYS = 10;
/** Each attacking artillery division in the fight removes this share of the dig-in bonus. */
export const ARTILLERY_VS_DIG_IN = 0.25;

/** Divisions that can fight at once. The rest wait in reserve and take no damage. */
export const DEFENCE_WIDTH = 8;
export const ATTACK_WIDTH = 8;
/** Extra attackers that fit for each further direction the attack comes from. */
export const ATTACK_WIDTH_PER_EXTRA_DIRECTION = 4;

/** A beaten defender that falls back loses this share of its strength (guns and stragglers left behind). */
export const ROUT_LOSS = 0.1;
/** Twice as much when the attackers' tanks can chase it: open ground, and at least a fifth of the attackers in the fight are armour. */
export const ROUT_LOSS_PURSUED = 0.2;
export const OPEN_GROUND: Terrain[] = ['plains', 'desert'];
export const PURSUIT_ARMOUR_SHARE = 0.2;

/** Organisation and strength lost per point of damage a division takes. */
export const ORG_PER_DAMAGE = 0.5;
export const STRENGTH_PER_DAMAGE = 0.06;
/** An attacker whose organisation falls below this stops attacking. */
export const ATTACK_BREAK_OFF = 10;

/** The most the front line can move in a day, in points of 100. */
export const PUSH_PER_DAY = 10;
/** When the defenders break, the line jumps this share of the way that is left; more when tanks can chase them across open ground. */
export const BREAKTHROUGH_JUMP = 0.6;
export const BREAKTHROUGH_JUMP_PURSUED = 0.85;

/** Against an army that is reeling, the line can move this far in a day. */
export const REELING_PUSH_MAX = 15;

/**
 * How far the front line moves today, from each side's damage, the ground and any river.
 * Against an army caught by surprise or in shock (`reeling`) it gives way much faster: the push
 * is 10 x (A - D) / the smaller of A and D, so twice the damage moves it 10 points, up to 15.
 */
export function linePush(attack: number, defence: number, line: number, ground: Ground = 'dry', riverShare = 0, reeling = false): number {
  if (attack + defence <= 0) return 0;
  let push = reeling && attack > 0 && defence > 0 ? Math.max(-PUSH_PER_DAY, Math.min(REELING_PUSH_MAX, (PUSH_PER_DAY * (attack - defence)) / Math.min(attack, defence))) : (PUSH_PER_DAY * (attack - defence)) / (attack + defence);
  push *= GROUND_PUSH[ground];
  if (push > 0 && line < BRIDGEHEAD) push *= 1 - (1 - RIVER_PUSH) * riverShare;
  return push;
}

/** 1.0 when fully supplied, down to 0.5 when cut off. */
export const supplyFactor = (supply: number): number => 0.5 + 0.5 * supply;

export const digInFactor = (u: Pick<Unit, 'dugIn'>): number => 1 + DIG_IN_PER_DAY * Math.min(DIG_IN_MAX_DAYS, u.dugIn);

/** A division's hitting power when attacking into a province, before luck. `edge` is what its country's research adds (1 = nothing). */
export function attackPower(u: Unit, target: number, edge = 1): number {
  const terrain = PROVINCES[target].terrain;
  const rough = u.type === 'armour' && ARMOUR_ROUGH.includes(terrain) ? ARMOUR_ROUGH_FACTOR : 1;
  const river = riverBetween(u.at, target) ? RIVER_ATTACK : 1;
  return STATS[u.type].attack * (u.strength / 100) * terrainAttack(target) * rough * river * supplyFactor(u.supply) * edge;
}

/** What attackers keep of their power attacking into a province: its terrain, and its forts if it is a fortress city (fortresses.ts). */
export const terrainAttack = (province: number): number => TERRAIN_ATTACK[PROVINCES[province].terrain] * fortressAttack(province);

/** A division's hitting power when defending, before luck. `digInKept` is the share of dig-in left after enemy artillery. */
export function defencePower(u: Unit, digInKept = 1, edge = 1): number {
  return STATS[u.type].defence * (u.strength / 100) * (1 + (digInFactor(u) - 1) * digInKept) * supplyFactor(u.supply) * edge;
}

/** The world as step() is changing it. Battles edit this in place. */
export interface Draft {
  day: number;
  units: Unit[];
  controller: string[];
  wars: string[];
  battles: Battle[];
  nextBattleId: number;
  reports: BattleReport[];
  /** What research, plans and forts add to each division's hitting power. Missing means nothing. */
  edges?: Edges;
  /** Each country's allies: a beaten division may fall back onto allied land. */
  friends?: Map<string, Set<string>>;
  /** The attackers' multiplier from control of the sky over a province (air.ts). Missing means 1. */
  air?: (attackers: string[], defenders: string[], province: number) => number;
  /** Today's ground in each province, by id (seasons.ts). Missing means dry everywhere. */
  ground?: Ground[];
  /** Fire support from aimed bombers and shelling ships (forces.ts). Missing means none. */
  fire?: (province: number, attackers: string[], defenders: string[]) => { attack: number; defence: number; fleets: number[] };
  /** Fleets whose guns joined a battle today (filled in by fightBattles). */
  shelled?: Set<number>;
}

const emptyTally = (): BattleTally => ({ days: 0, attackerCount: 0, defenderCount: 0, terrain: 0, attackerSupply: 0, defenderSupply: 0, dugIn: 0, directions: 0, armourShare: 0, artilleryShare: 0, attackerEdge: 0, defenderEdge: 0, air: 0, landing: 0 });

/** The best-organised divisions go into the line first. */
const line = (units: Unit[], width: number): Unit[] => [...units].sort((a, b) => b.organisation - a.organisation || a.id - b.id).slice(0, width);

const byCount = (units: Unit[]): string[] => {
  const n = new Map<string, number>();
  for (const u of units) n.set(u.owner, (n.get(u.owner) ?? 0) + 1);
  return [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)! || (a < b ? -1 : 1));
};

const union = (a: number[], b: number[]): number[] => [...new Set([...a, ...b])];
const round1 = (x: number): number => Math.round(x * 10) / 10;

/**
 * Where a beaten division falls back to: a neighbouring province its own country controls,
 * the one nearest its capital. Returns -1 if there is none, which means surrender.
 */
export function retreatTarget(d: Pick<Draft, 'controller' | 'friends'>, u: Unit, capital: number | undefined): number {
  let best = -1;
  let bestKm = Infinity;
  for (const n of PROVINCES[u.at].neighbours) {
    if (d.controller[n] !== u.owner && !d.friends?.get(u.owner)?.has(d.controller[n])) continue;
    const km = capital === undefined ? 0 : distanceKm(PROVINCES[n].centre, PROVINCES[capital].centre);
    if (km < bestKm) {
      best = n;
      bestKm = km;
    }
  }
  return best;
}

const CAPITAL_OF = new Map(PROVINCES.filter((p) => p.capital).map((p) => [p.owner, p.id]));

/** Who actually fights today, and how hard each side hits before luck. `fire` is the fire support each side gets (forces.ts). */
function lineUp(attackers: Unit[], defenders: Unit[], province: number, edges?: Edges, air = 1, fire = { attack: 0, defence: 0 }) {
  const directions = new Set(attackers.map((u) => u.at)).size;
  const front = line(attackers, ATTACK_WIDTH + ATTACK_WIDTH_PER_EXTRA_DIRECTION * (directions - 1));
  const holding = line(defenders, DEFENCE_WIDTH);
  const guns = front.filter((u) => u.type === 'artillery').length;
  const digInKept = Math.max(0, 1 - ARTILLERY_VS_DIG_IN * guns);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1);
  // `air` is the attackers' multiplier (1.15, 1 or 0.85); the defenders get the opposite.
  const attackEach = front.map((u) => attackPower(u, province, edges?.attack(u)) * air);
  const attackSum = attackEach.reduce((a, b) => a + b, 0) + fire.attack;
  const defenceSum = holding.reduce((a, u) => a + defencePower(u, digInKept, edges?.defence(u, province)), 0) * (2 - air) + fire.defence;
  const attackerEdge = mean(front.map((u) => edges?.attack(u) ?? 1));
  const defenderEdge = mean(holding.map((u) => edges?.defence(u, province) ?? 1));
  // Share of the attack that comes across a river.
  const riverShare = attackSum > 0 ? front.reduce((a, u, i) => a + (riverBetween(u.at, province) ? attackEach[i] : 0), 0) / attackSum : 0;
  return { directions, front, holding, digInKept, attackEach, attackSum, defenceSum, attackerEdge, defenderEdge, riverShare };
}

/** How a fight for a province looks today, for the battle sidebar and for planning an attack. */
export interface Outlook {
  /** Divisions on each side, and how many of them fit into the fight at once. */
  attackers: number;
  defenders: number;
  attackersFighting: number;
  defendersFighting: number;
  directions: number;
  /** Damage each side deals per day, before luck. */
  attack: number;
  defence: number;
  /** Days until the side's fighting divisions run out of organisation at today's rate. */
  attackersLast: number;
  defendersLast: number;
  /** The multipliers at work (1 = no effect). Terrain includes the forts of a fortress city. */
  terrain: number;
  /** The province is a fortress city (fortresses.ts). */
  fortress: boolean;
  dugIn: number;
  attackerSupply: number;
  defenderSupply: number;
  /** What research, plans and forts add to each side's hitting power. */
  attackerEdge: number;
  defenderEdge: number;
  /** The attackers' multiplier from control of the sky: 1.15, 1 or 0.85. */
  air: number;
  /** Who breaks first at this rate. 'even' when it is within 15%. */
  favours: 'attacker' | 'defender' | 'even';
  /** Share of the attack that comes across a river, and the river's name (null if none). */
  riverShare: number;
  river: string | null;
  /** How far the front line would move a day at this rate (points of 100), on today's ground. */
  push: number;
  /** Today's ground in the province (seasons.ts). */
  ground: Ground;
  /** Fire support in the damage above: aimed bombers and shelling ships (forces.ts). */
  attackFire: number;
  defenceFire: number;
}

/**
 * The outlook if `attackers` attack `defenders` in `province` today. It uses the same line-up
 * as the real battle, without the luck, and it cannot know about reinforcements.
 */
export function outlook(attackers: Unit[], defenders: Unit[], province: number, edges?: Edges, air = 1, ground: Ground = 'dry', line = 0, fire = { attack: 0, defence: 0 }): Outlook | null {
  if (!attackers.length || !defenders.length) return null;
  const { directions, front, holding, digInKept, attackSum, defenceSum, attackerEdge, defenderEdge, riverShare } = lineUp(attackers, defenders, province, edges, air, fire);
  const river = front.map((u) => riverBetween(u.at, province)).find((r) => r) ?? null;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  // A division gives up when its organisation is gone (attackers a little earlier).
  const days = (units: Unit[], damage: number, floor: number) => (damage > 0 ? Math.max(0, avg(units.map((u) => u.organisation)) - floor) / ((damage / units.length) * ORG_PER_DAMAGE) : Infinity);
  const attackersLast = days(front, defenceSum, ATTACK_BREAK_OFF);
  const defendersLast = days(holding, attackSum, 0);
  const ratio = attackersLast / Math.max(0.01, defendersLast);
  return {
    attackers: attackers.length,
    defenders: defenders.length,
    attackersFighting: front.length,
    defendersFighting: holding.length,
    directions,
    attack: attackSum,
    defence: defenceSum,
    attackersLast,
    defendersLast,
    terrain: terrainAttack(province),
    fortress: !!fortressAt(province),
    dugIn: avg(holding.map((u) => 1 + (digInFactor(u) - 1) * digInKept)),
    attackerSupply: avg(front.map((u) => supplyFactor(u.supply))),
    defenderSupply: avg(holding.map((u) => supplyFactor(u.supply))),
    attackerEdge,
    defenderEdge,
    air,
    favours: ratio > 1.15 ? 'attacker' : ratio < 1 / 1.15 ? 'defender' : 'even',
    riverShare,
    river,
    push: linePush(attackSum, defenceSum, line, ground, riverShare, defenders.some((u) => edges?.reeling?.(u.owner))),
    ground,
    attackFire: fire.attack,
    defenceFire: fire.defence,
  };
}

/** The outlook for a battle being fought now, or for the units already ordered into a province. */
export function outlookAt(w: Pick<World, 'units' | 'wars'> & { economies?: Record<string, Economy>; story?: World['story']; day?: number; startDate?: string; battles?: Battle[]; armies?: World['armies'] }, province: number, air?: Draft['air'], fire?: Draft['fire']): Outlook | null {
  const here = w.units.filter((u) => u.at === province);
  const attackers = w.units.filter((u) => u.path[0] === province && here.some((e) => atWar(w, u.owner, e.owner)));
  const defenders = here.filter((u) => attackers.some((a) => atWar(w, a.owner, u.owner)));
  const sides = attackers.length && defenders.length ? [byCount(attackers), byCount(defenders)] : null;
  const sky = air && sides ? air(sides[0], sides[1], province) : 1;
  const support = fire && sides ? fire(province, sides[0], sides[1]) : undefined;
  const line = w.battles?.find((b) => b.province === province)?.line ?? 0;
  return outlook(attackers, defenders, province, w.economies && combatEdges(w.economies, w.story && { effects: w.story.effects, day: w.day ?? 0, startDate: w.startDate ?? '1936-01-01', armies: w.armies }), sky, groundOn(province, w.startDate ?? '1936-01-01', w.day ?? 0), line, support);
}

/** What an attack would probably cost and how long it would take, from its outlook: a rough guide for planning. */
export interface Forecast {
  /** 'win': the defenders break or are pushed out; 'stall': the attackers run out of organisation first. */
  ends: 'win' | 'stall';
  /** Days until it ends, at today's rate. */
  days: number;
  /** Strength each side would lose, in division-equivalents (100 points = 1 division). */
  attackerLoss: number;
  defenderLoss: number;
}

/** The longest a forecast looks ahead. */
export const FORECAST_DAYS = 60;

/**
 * A forecast from an outlook. The attack wins on the day the defenders run out of
 * organisation or the front line reaches the far side, whichever comes first, if that is before
 * the attackers run out themselves. Losses are the daily damage times the strength each point
 * of damage costs, over those days, plus what beaten defenders leave behind as they fall back.
 */
export function forecast(o: Outlook, line = 0): Forecast {
  const lineDays = o.push > 0 ? (100 - line) / o.push : Infinity;
  const winIn = Math.min(o.defendersLast, lineDays);
  const win = winIn <= o.attackersLast;
  const days = Math.min(FORECAST_DAYS, Math.max(1, Math.ceil(win ? winIn : o.attackersLast)));
  const perDay = (damage: number) => (damage * STRENGTH_PER_DAMAGE) / 100;
  return {
    ends: win && winIn <= FORECAST_DAYS ? 'win' : 'stall',
    days,
    attackerLoss: perDay(o.defence) * days,
    defenderLoss: perDay(o.attack) * days + (win ? o.defendersFighting * ROUT_LOSS * 0.8 : 0),
  };
}

/** Fight one day of every battle. Returns the ids of the units that took part today. */
export function fightBattles(d: Draft, rng: Rng): Set<number> {
  const busy = new Set<number>();
  const at = new Map<number, Unit[]>();
  for (const u of d.units) {
    const here = at.get(u.at);
    if (here) here.push(u);
    else at.set(u.at, [u]);
  }

  // Who is attacking which province today?
  const attacks = new Map<number, Unit[]>();
  for (const u of d.units) {
    if (!u.path.length) continue;
    const target = u.path[0];
    if (!(at.get(target) ?? []).some((e) => atWar(d, u.owner, e.owner))) continue;
    const list = attacks.get(target);
    if (list) list.push(u);
    else attacks.set(target, [u]);
  }

  // Battles whose attackers have stopped or whose defenders have left are over.
  for (const b of [...d.battles]) {
    if (!attacks.has(b.province)) {
      const defendersLeft = (at.get(b.province) ?? []).some((u) => b.defenders.includes(u.owner));
      closeBattle(d, b, defendersLeft ? 'defender' : 'attacker');
    }
  }

  const removed = new Set<number>();
  for (const province of [...attacks.keys()].sort((a, b) => a - b)) {
    const attackers = attacks.get(province)!.filter((u) => !removed.has(u.id));
    const defenders = (at.get(province) ?? []).filter((u) => !removed.has(u.id) && u.at === province && attackers.some((a) => atWar(d, a.owner, u.owner)));
    if (!attackers.length || !defenders.length) continue;

    let battle = d.battles.find((b) => b.province === province);
    if (!battle) {
      // Attackers who had already walked part of the way in start the line from there.
      const line = Math.min(100, 100 * Math.max(0, ...attackers.map((u) => u.progress)));
      battle = { id: d.nextBattleId++, province, startDay: d.day, attackers: [], defenders: [], attackerUnits: [], defenderUnits: [], attackerLosses: 0, defenderLosses: 0, surrendered: 0, tally: emptyTally(), line, push: 0 };
      d.battles.push(battle);
    }
    battle.attackerUnits = union(battle.attackerUnits, attackers.map((u) => u.id));
    battle.defenderUnits = union(battle.defenderUnits, defenders.map((u) => u.id));
    battle.attackers = union2(battle.attackers, byCount(attackers));
    battle.defenders = union2(battle.defenders, byCount(defenders));

    const sky = d.air ? d.air(battle.attackers, battle.defenders, province) : 1;
    const fire = d.fire?.(province, battle.attackers, battle.defenders);
    if (fire) for (const f of fire.fleets) d.shelled?.add(f);
    const { directions, front, holding, digInKept, attackEach, attackSum, defenceSum, attackerEdge, defenderEdge, riverShare } = lineUp(attackers, defenders, province, d.edges, sky, fire);
    const attackDamage = attackSum * (0.9 + 0.2 * rng.next());
    const defenceDamage = defenceSum * (0.9 + 0.2 * rng.next());

    const hit = (units: Unit[], damage: number): number => {
      let lost = 0;
      for (const u of units) {
        const share = damage / units.length;
        const loss = Math.min(u.strength, share * STRENGTH_PER_DAMAGE);
        u.strength -= loss;
        u.organisation = Math.max(0, u.organisation - share * ORG_PER_DAMAGE);
        lost += loss / 100;
        busy.add(u.id);
      }
      return lost;
    };
    battle.defenderLosses += hit(holding, attackDamage);
    battle.attackerLosses += hit(front, defenceDamage);
    // The front line moves by how the day went.
    const ground = d.ground?.[province] ?? 'dry';
    const reeling = !!d.edges?.reeling && battle.defenders.some((c) => d.edges!.reeling!(c));
    battle.push = linePush(attackDamage, defenceDamage, battle.line ?? 0, ground, riverShare, reeling);
    battle.line = Math.max(0, Math.min(100, (battle.line ?? 0) + battle.push));
    for (const u of attackers) busy.add(u.id);
    for (const u of defenders) busy.add(u.id);

    // Remember today's conditions, to explain the result when the battle ends.
    const t = battle.tally;
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    t.days++;
    t.attackerCount += attackers.length;
    t.defenderCount += defenders.length;
    t.terrain += terrainAttack(province);
    t.attackerSupply += avg(front.map((u) => supplyFactor(u.supply)));
    t.defenderSupply += avg(holding.map((u) => supplyFactor(u.supply)));
    t.dugIn += avg(holding.map((u) => 1 + (digInFactor(u) - 1) * digInKept));
    t.directions += directions;
    t.attackerEdge += attackerEdge;
    t.defenderEdge += defenderEdge;
    t.air += sky;
    t.landing += front.filter((u) => u.landing).length / front.length;
    t.river = (t.river ?? 0) + riverShare;
    if (riverShare > 0) battle.river ??= front.map((u) => riverBetween(u.at, province)).find((r) => r) ?? undefined;
    t.badGround = (t.badGround ?? 0) + (ground === 'mud' || ground === 'snow' ? 1 : 0);
    t.attackerFire = (t.attackerFire ?? 0) + (fire && attackSum > 0 ? fire.attack / attackSum : 0);
    t.defenderFire = (t.defenderFire ?? 0) + (fire && defenceSum > 0 ? fire.defence / defenceSum : 0);
    const share = (type: UnitType) => (attackSum > 0 ? front.reduce((a, u, i) => a + (u.type === type ? attackEach[i] : 0), 0) / attackSum : 0);
    t.armourShare += share('armour');
    t.artilleryShare += share('artillery');

    // Beaten defenders fall back, or surrender if they are surrounded. Once the line reaches
    // the far side, every defender still in the province is pushed out.
    const pursuit = OPEN_GROUND.includes(PROVINCES[province].terrain) && front.filter((u) => u.type === 'armour').length >= PURSUIT_ARMOUR_SHARE * front.length;
    const pushedOut = battle.line >= 100;
    for (const u of pushedOut ? defenders : holding) {
      if (!pushedOut && u.organisation > 0 && u.strength > 0) continue;
      const to = u.strength > 0 ? retreatTarget(d, u, CAPITAL_OF.get(u.owner)) : -1;
      if (to < 0) {
        if (u.strength > 0) {
          battle.surrendered++;
          battle.defenderLosses += u.strength / 100;
        }
        removed.add(u.id);
      } else {
        // A beaten division leaves guns and stragglers behind, more of them when tanks chase it across open country.
        const loss = Math.min(u.strength - 1, u.strength * (pursuit ? ROUT_LOSS_PURSUED : ROUT_LOSS));
        u.strength -= loss;
        battle.defenderLosses += loss / 100;
        u.at = to;
        u.path = [];
        u.progress = 0;
        u.dugIn = 0;
      }
    }
    // Worn-out attackers give up. The rest stand where the line is. Paratroopers who came down
    // into the fight have nowhere to go back to: they are taken prisoner.
    for (const u of front) {
      if (u.strength <= 0) removed.add(u.id);
      else if (u.organisation < ATTACK_BREAK_OFF && u.dropped) {
        battle.attackerLosses += u.strength / 100;
        removed.add(u.id);
      } else if (u.organisation < ATTACK_BREAK_OFF) {
        u.path = [];
        u.progress = 0;
      }
    }
    for (const u of attackers) if (!removed.has(u.id) && u.path[0] === province) u.progress = battle.line / 100;

    const defendersLeft = defenders.some((u) => !removed.has(u.id) && u.at === province);
    const attackersLeft = attackers.some((u) => !removed.has(u.id) && u.path[0] === province);
    if (!defendersLeft) closeBattle(d, battle, 'attacker');
    else if (!attackersLeft) closeBattle(d, battle, 'defender');
  }

  if (removed.size) d.units = d.units.filter((u) => !removed.has(u.id));
  return busy;
}

/** Add names to a list, keeping the order of those already there. */
const union2 = (a: string[], b: string[]): string[] => [...a, ...b.filter((x) => !a.includes(x))];

function closeBattle(d: Draft, b: Battle, winner: 'attacker' | 'defender'): void {
  d.battles = d.battles.filter((x) => x.id !== b.id);
  if (winner === 'attacker') {
    // The defenders have gone: the attackers rush after them, and march the rest of the way.
    // Tanks on open ground chase them further.
    const after = d.units.filter((u) => u.path[0] === b.province && b.attackers.includes(u.owner));
    const chase = OPEN_GROUND.includes(PROVINCES[b.province].terrain) && after.filter((u) => u.type === 'armour').length >= PURSUIT_ARMOUR_SHARE * after.length;
    const line = (b.line ?? 0) + (100 - (b.line ?? 0)) * (chase ? BREAKTHROUGH_JUMP_PURSUED : BREAKTHROUGH_JUMP);
    for (const u of after) u.progress = Math.max(u.progress, line / 100);
  }
  if (!b.tally.days) return; // it never came to a fight
  d.reports.push({
    id: b.id,
    province: b.province,
    startDay: b.startDay,
    endDay: d.day,
    attackers: b.attackers,
    defenders: b.defenders,
    winner,
    attackerDivisions: b.attackerUnits.length,
    defenderDivisions: b.defenderUnits.length,
    attackerLosses: round1(b.attackerLosses),
    defenderLosses: round1(b.defenderLosses),
    surrendered: b.surrendered,
    causes: explain(b, winner),
  });
  if (d.reports.length > 60) d.reports = d.reports.slice(-60);
}

const pct = (x: number): string => `${Math.round(Math.abs(x) * 100)}%`;


/**
 * Why a battle ended as it did, biggest cause first. Each cause is weighted by roughly how
 * much it multiplied one side's damage (as a logarithm, so that x 0.5 and x 2 count the same).
 */
export function explain(b: Battle, winner: 'attacker' | 'defender'): Cause[] {
  const t = b.tally;
  const n = Math.max(1, t.days);
  const terrain = t.terrain / n;
  const dugIn = t.dugIn / n;
  const aSupply = t.attackerSupply / n;
  const dSupply = t.defenderSupply / n;
  const directions = t.directions / n;
  const armour = t.armourShare / n;
  const artillery = t.artilleryShare / n;
  // How much better armed and fortified the defenders were than the attackers (1 = the same).
  const edge = (t.defenderEdge || n) / (t.attackerEdge || n);
  const air = (t.air || n) / n;
  const landing = (t.landing || 0) / n;
  const river = (t.river || 0) / n;
  const badGround = (t.badGround || 0) / n;
  const aFire = (t.attackerFire || 0) / n;
  const dFire = (t.defenderFire || 0) / n;
  const ratio = b.attackerUnits.length / Math.max(1, b.defenderUnits.length);
  const fort = fortressAt(b.province);
  const place = fort ? `the fortress city of ${fort.city}` : PROVINCES[b.province].terrain;
  const versus = `${b.attackerUnits.length} divisions against ${b.defenderUnits.length}`;
  const causes: Cause[] = [];
  const add = (weight: number, text: string) => {
    if (weight > 0.04) causes.push({ text, weight: Math.round(weight * 100) / 100 });
  };

  if (winner === 'defender') {
    add(-ln(terrain), `attacking ${fort ? '' : 'into '}${place} (attackers hit ${pct(1 - terrain)} less hard)`);
    add(ln(dugIn), `the defenders were dug in (+${pct(dugIn - 1)} defence)`);
    add(ln(edge), `the defenders had better weapons or fortifications (${pct(edge - 1)} stronger)`);
    add(2 * ln(Math.max(1, 2 - air)), 'the defenders controlled the sky (they hit 15% harder, the attackers 15% less hard)');
    add(landing * 0.5, 'the attackers were coming ashore from the sea or down from the air (they hit 30 to 40% less hard)');
    add(river * -ln(RIVER_ATTACK) * 1.5, `the attackers had to cross ${b.river ? `the ${b.river}` : 'a river'} under fire (they hit 15% less hard, and the line moved at half pace until a bridgehead was won)`);
    add(badGround * 0.25, 'mud or snow slowed the attack (the line moves at half pace in mud, three quarters in snow)');
    add(-ln(aSupply), `the attackers were short of supply (${pct(1 - aSupply)} weaker)`);
    add(-ln(1 - Math.min(0.9, dFire)), `bombers and ships supported the defence (${pct(dFire)} of the defenders' fire)`);
    add(ln(2 / Math.max(0.2, ratio)), ratio < 1 ? `the attackers were outnumbered (${versus})` : `too few attackers for an assault (${versus}; plan for about 2 to 1)`);
    add(0.05, 'defending is easier than attacking (infantry defends at 15 but attacks at 10)');
  } else {
    add(ln(Math.max(1, ratio)), `the attackers had the numbers (${versus})`);
    add(ln(1 + (ATTACK_WIDTH_PER_EXTRA_DIRECTION / ATTACK_WIDTH) * (directions - 1)) * (ratio > 1 ? 1 : 0.5), `the attack came from ${Math.round(directions)} directions, so more divisions could join in`);
    add(armour * ln(STATS.armour.attack / STATS.infantry.attack) * (terrain === 1 ? 1.5 : 1), terrain === 1 ? 'armour broke through on open ground' : 'armour led the attack');
    add(artillery * ln(STATS.artillery.attack / STATS.infantry.attack) + (artillery > 0 ? 0.1 : 0), 'artillery broke up the dug-in positions');
    add(2 * ln(Math.max(1, air)), 'the attackers controlled the sky (they hit 15% harder, the defenders 15% less hard)');
    add(-ln(1 - Math.min(0.9, aFire)), `bombers and ships supported the attack (${pct(aFire)} of the attackers' fire)`);
    add(-ln(dSupply), `the defenders were short of supply (${pct(1 - dSupply)} weaker)`);
    add(-ln(edge), `the attackers had better weapons (${pct(1 / edge - 1)} stronger)`);
    add(b.surrendered, `${b.surrendered} surrounded ${b.surrendered === 1 ? 'division' : 'divisions'} had nowhere to retreat and surrendered`);
    add(0.05, 'the attackers wore the defenders down');
  }
  return causes.sort((x, y) => y.weight - x.weight).slice(0, 3);
}
