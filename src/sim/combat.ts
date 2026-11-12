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
 *            x luck               (0.9 to 1.1, from the seeded generator)
 *
 * The damage is shared equally among the enemy divisions in the fight. It wears down
 * organisation, and a little strength. A defender at zero organisation retreats, or surrenders
 * if it has nowhere to go. An attacker below 10 organisation gives up the attack.
 *
 * Air power (x 1.15 or x 0.85 in the design document) arrives with Stage G, and rivers need
 * map data we do not have yet, so neither is in this formula for now.
 */
import { distanceKm, PROVINCES } from './map';
import { Rng } from './rng';
import type { Battle, BattleReport, BattleTally, Cause, Terrain, Unit, UnitType, World } from './types';
import { atWar } from './war';

export const STATS: Record<UnitType, { attack: number; defence: number }> = {
  infantry: { attack: 10, defence: 15 },
  armour: { attack: 22, defence: 10 },
  artillery: { attack: 16, defence: 8 },
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

/** Organisation and strength lost per point of damage a division takes. */
export const ORG_PER_DAMAGE = 0.5;
export const STRENGTH_PER_DAMAGE = 0.06;
/** An attacker whose organisation falls below this stops attacking. */
export const ATTACK_BREAK_OFF = 10;

/** 1.0 when fully supplied, down to 0.5 when cut off. */
export const supplyFactor = (supply: number): number => 0.5 + 0.5 * supply;

export const digInFactor = (u: Pick<Unit, 'dugIn'>): number => 1 + DIG_IN_PER_DAY * Math.min(DIG_IN_MAX_DAYS, u.dugIn);

/** A division's hitting power when attacking into a province, before luck. */
export function attackPower(u: Unit, target: number): number {
  const terrain = PROVINCES[target].terrain;
  const rough = u.type === 'armour' && ARMOUR_ROUGH.includes(terrain) ? ARMOUR_ROUGH_FACTOR : 1;
  return STATS[u.type].attack * (u.strength / 100) * TERRAIN_ATTACK[terrain] * rough * supplyFactor(u.supply);
}

/** A division's hitting power when defending, before luck. `digInKept` is the share of dig-in left after enemy artillery. */
export function defencePower(u: Unit, digInKept = 1): number {
  return STATS[u.type].defence * (u.strength / 100) * (1 + (digInFactor(u) - 1) * digInKept) * supplyFactor(u.supply);
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
}

const emptyTally = (): BattleTally => ({ days: 0, attackerCount: 0, defenderCount: 0, terrain: 0, attackerSupply: 0, defenderSupply: 0, dugIn: 0, directions: 0, armourShare: 0, artilleryShare: 0 });

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
export function retreatTarget(d: Pick<Draft, 'controller'>, u: Unit, capital: number | undefined): number {
  let best = -1;
  let bestKm = Infinity;
  for (const n of PROVINCES[u.at].neighbours) {
    if (d.controller[n] !== u.owner) continue;
    const km = capital === undefined ? 0 : distanceKm(PROVINCES[n].centre, PROVINCES[capital].centre);
    if (km < bestKm) {
      best = n;
      bestKm = km;
    }
  }
  return best;
}

const CAPITAL_OF = new Map(PROVINCES.filter((p) => p.capital).map((p) => [p.owner, p.id]));

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
      battle = { id: d.nextBattleId++, province, startDay: d.day, attackers: [], defenders: [], attackerUnits: [], defenderUnits: [], attackerLosses: 0, defenderLosses: 0, surrendered: 0, tally: emptyTally() };
      d.battles.push(battle);
    }
    battle.attackerUnits = union(battle.attackerUnits, attackers.map((u) => u.id));
    battle.defenderUnits = union(battle.defenderUnits, defenders.map((u) => u.id));
    battle.attackers = union2(battle.attackers, byCount(attackers));
    battle.defenders = union2(battle.defenders, byCount(defenders));

    const directions = new Set(attackers.map((u) => u.at)).size;
    const front = line(attackers, ATTACK_WIDTH + ATTACK_WIDTH_PER_EXTRA_DIRECTION * (directions - 1));
    const holding = line(defenders, DEFENCE_WIDTH);
    const guns = front.filter((u) => u.type === 'artillery').length;
    const digInKept = Math.max(0, 1 - ARTILLERY_VS_DIG_IN * guns);

    const attackEach = front.map((u) => attackPower(u, province));
    const attackSum = attackEach.reduce((a, b) => a + b, 0);
    const defenceSum = holding.reduce((a, u) => a + defencePower(u, digInKept), 0);
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
    for (const u of attackers) busy.add(u.id);
    for (const u of defenders) busy.add(u.id);

    // Remember today's conditions, to explain the result when the battle ends.
    const t = battle.tally;
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    t.days++;
    t.attackerCount += attackers.length;
    t.defenderCount += defenders.length;
    t.terrain += TERRAIN_ATTACK[PROVINCES[province].terrain];
    t.attackerSupply += avg(front.map((u) => supplyFactor(u.supply)));
    t.defenderSupply += avg(holding.map((u) => supplyFactor(u.supply)));
    t.dugIn += avg(holding.map((u) => 1 + (digInFactor(u) - 1) * digInKept));
    t.directions += directions;
    const share = (type: UnitType) => (attackSum > 0 ? front.reduce((a, u, i) => a + (u.type === type ? attackEach[i] : 0), 0) / attackSum : 0);
    t.armourShare += share('armour');
    t.artilleryShare += share('artillery');

    // Beaten defenders fall back, or surrender if they are surrounded.
    for (const u of holding) {
      if (u.organisation > 0 && u.strength > 0) continue;
      const to = u.strength > 0 ? retreatTarget(d, u, CAPITAL_OF.get(u.owner)) : -1;
      if (to < 0) {
        if (u.strength > 0) {
          battle.surrendered++;
          battle.defenderLosses += u.strength / 100;
        }
        removed.add(u.id);
      } else {
        u.at = to;
        u.path = [];
        u.progress = 0;
        u.dugIn = 0;
      }
    }
    // Worn-out attackers give up.
    for (const u of front) {
      if (u.strength <= 0) removed.add(u.id);
      else if (u.organisation < ATTACK_BREAK_OFF) {
        u.path = [];
        u.progress = 0;
      }
    }

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
  const ratio = b.attackerUnits.length / Math.max(1, b.defenderUnits.length);
  const place = PROVINCES[b.province].terrain;
  const versus = `${b.attackerUnits.length} divisions against ${b.defenderUnits.length}`;
  const causes: Cause[] = [];
  const add = (weight: number, text: string) => {
    if (weight > 0.04) causes.push({ text, weight: Math.round(weight * 100) / 100 });
  };

  if (winner === 'defender') {
    add(-Math.log(terrain), `attacking into ${place} (attackers hit ${pct(1 - terrain)} less hard)`);
    add(Math.log(dugIn), `the defenders were dug in (+${pct(dugIn - 1)} defence)`);
    add(-Math.log(aSupply), `the attackers were short of supply (${pct(1 - aSupply)} weaker)`);
    add(Math.log(2 / Math.max(0.2, ratio)), ratio < 1 ? `the attackers were outnumbered (${versus})` : `too few attackers for an assault (${versus}; plan for about 2 to 1)`);
    add(0.05, 'defending is easier than attacking (infantry defends at 15 but attacks at 10)');
  } else {
    add(Math.log(Math.max(1, ratio)), `the attackers had the numbers (${versus})`);
    add(Math.log(1 + (ATTACK_WIDTH_PER_EXTRA_DIRECTION / ATTACK_WIDTH) * (directions - 1)) * (ratio > 1 ? 1 : 0.5), `the attack came from ${Math.round(directions)} directions, so more divisions could join in`);
    add(armour * Math.log(STATS.armour.attack / STATS.infantry.attack) * (terrain === 1 ? 1.5 : 1), terrain === 1 ? 'armour broke through on open ground' : 'armour led the attack');
    add(artillery * Math.log(STATS.artillery.attack / STATS.infantry.attack) + (artillery > 0 ? 0.1 : 0), 'artillery broke up the dug-in positions');
    add(-Math.log(dSupply), `the defenders were short of supply (${pct(1 - dSupply)} weaker)`);
    add(b.surrendered, `${b.surrendered} surrounded ${b.surrendered === 1 ? 'division' : 'divisions'} had nowhere to retreat and surrendered`);
    add(0.05, 'the attackers wore the defenders down');
  }
  return causes.sort((x, y) => y.weight - x.weight).slice(0, 3);
}
