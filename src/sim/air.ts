/**
 * The air force, kept simple: a wing is about a hundred aircraft based in one province. It
 * flies its mission over everything within range of its base; nobody steers single planes.
 *
 *   range: fighters 400 km, bombers 800 km (research adds to both)
 *
 * Control of the sky. Over each province, each side adds up
 *
 *   air score = fighters on air superiority + 0.7 x bombers on ground support
 *
 * counting each wing as strength / 100. In a land battle, the side whose score is at least
 * half a wing and at least 1.5 times the other side's controls the sky: its divisions hit 15%
 * harder and the enemy's 15% less hard.
 *
 * Losses. A wing flying within reach of enemy fighters loses strength every day:
 *
 *   loss = 0.3 x enemy fighters in reach / (1 + enemy fighters in reach + friendly fighters covering its base) x luck
 *
 * At most 0.3 points a day, so a wing with no cover lasts under a year if it is never rested, and
 * one flying under strong cover of its own loses very little. Both sides lose about the same number
 * of aircraft in total, which means the smaller air force runs out first. Spare aircraft from the
 * factories replace losses: one point a day, half that while the wing is in the fight.
 *
 * Strategic bombing. Each bomber wing on that mission picks the enemy province in range with
 * the most working factories. Every day it puts out of action
 *
 *   0.3% x its strength / (1 + enemy fighters over the target)
 *
 * of that province's factories, up to half of them. Damage is repaired at 1.5% a day. Bombed
 * countries also lose some stability and war support (economy.ts).
 *
 * Naval strike. Bombers add 6 per wing to their side's fighting strength in every sea zone in
 * range (see sea.ts and navy.ts): enough to make a zone unsafe for a small fleet.
 */
import { COUNTRIES } from './countries';
import { distanceKm, PROVINCES } from './map';
import { modsOf, type Mods } from './mods';
import { logForce, type ForceDraft } from './navy';
import { Rng } from './rng';
import { SHORES, ZONES } from './sea';
import type { Economy, Order, PlaneKind, Wing, WingMission, World } from './types';
import { atWar } from './war';

export const RANGE_KM: Record<PlaneKind, number> = { fighter: 400, bomber: 800 };
export const SUPPORT_WEIGHT = 0.7;
/** The edge control of the sky gives in a land battle, and how clear the control has to be. */
export const AIR_EDGE = 0.15;
export const AIR_CONTROL_RATIO = 1.5;
export const AIR_CONTROL_MIN = 0.5;
export const AIR_LOSS = 0.3;
export const FLAK_LOSS = 0.1;
export const BOMB_DAMAGE = 0.003;
export const BOMB_MAX = 0.5;
export const BOMB_REPAIR = 0.985;
export const NAVAL_STRIKE = 6;
/** Strength a wing gets back each day when it is out of the fight, if there are spare aircraft. */
export const WING_REPAIR = 1;
export const WING_REST_REPAIR = 2.5;
/** Days a wing cannot fly after moving to a new base. */
export const REBASE_DAYS = 3;
/** Thousands of men a new wing needs. */
export const MEN_PER_WING = 2;

export const MISSIONS: Record<PlaneKind, WingMission[]> = { fighter: ['superiority', 'rest'], bomber: ['ground', 'strategic', 'naval', 'rest'] };
export const WING_MISSION_NAME: Record<WingMission, string> = { superiority: 'Air superiority', ground: 'Ground support', strategic: 'Strategic bombing', naval: 'Naval strike', rest: 'Rest and repair' };
export const WING_MISSION_NOTE: Record<WingMission, string> = {
  superiority: 'Fights for control of the sky over every province in range, and shoots down enemy aircraft that come within reach.',
  ground: 'Helps your divisions in battles in range. Counts 0.7 of a fighter wing towards control of the sky there.',
  strategic: 'Bombs the factories of the richest enemy province in range.',
  naval: 'Attacks enemy ships in every sea zone in range.',
  rest: 'Does not fly. Repairs faster.',
};

/** The air forces of 1936 in wings of about a hundred aircraft: [fighters, bombers]. */
const START_WINGS: Record<string, [number, number]> = {
  'United Kingdom': [4, 3], France: [4, 3], Germany: [3, 3], Italy: [3, 3], 'Soviet Union': [7, 5], Poland: [2, 1], Czechoslovakia: [2, 1],
  Spain: [1, 1], Belgium: [1, 0], Netherlands: [1, 0], Romania: [1, 0], Yugoslavia: [1, 0], Turkey: [1, 0], Sweden: [1, 0], Switzerland: [1, 0], Greece: [1, 0], Finland: [1, 0],
};

export function startWings(firstId: number): Wing[] {
  const wings: Wing[] = [];
  for (const c of COUNTRIES) {
    const [fighters, bombers] = START_WINGS[c.name] ?? [0, 0];
    const capital = PROVINCES.find((p) => p.owner === c.name && p.capital);
    if (!capital) continue;
    // Spread over the capital and the two biggest cities within 500 km of it.
    const bases = [capital, ...PROVINCES.filter((p) => p.owner === c.name && !p.capital && distanceKm(p.centre, capital.centre) < 500).sort((a, b) => b.victoryPoints - a.victoryPoints || a.id - b.id).slice(0, 2)];
    for (let i = 0; i < fighters + bombers; i++) {
      const type: PlaneKind = i < fighters ? 'fighter' : 'bomber';
      wings.push({ id: firstId + wings.length, owner: c.name, type, base: bases[i % bases.length].id, mission: type === 'fighter' ? 'superiority' : 'ground', strength: 100, ready: 0 });
    }
  }
  return wings;
}

let KM: Float32Array | null = null;
const N = PROVINCES.length;
/** Distance between the centres of two provinces, in km. Worked out once. */
export function km(a: number, b: number): number {
  if (!KM) {
    KM = new Float32Array(N * N);
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) KM[i * N + j] = KM[j * N + i] = distanceKm(PROVINCES[i].centre, PROVINCES[j].centre);
  }
  return KM[a * N + b];
}
let ZONE_KM: Float32Array[] | null = null;
/** Distance from a province to the nearest shore of a sea zone. */
function zoneKm(zone: number, province: number): number {
  ZONE_KM ??= ZONES.map((_, z) => Float32Array.from(PROVINCES, (p) => Math.min(...SHORES[z].map((s) => km(p.id, s)), Infinity)));
  return ZONE_KM[zone][province];
}

type AirView = Pick<World, 'wings' | 'controller' | 'wars' | 'economies' | 'day'> & { owner?: string[] };

const modCache = (economies: Record<string, Economy>) => {
  const cache = new Map<string, Mods>();
  return (owner: string): Mods => {
    let m = cache.get(owner);
    if (!m) cache.set(owner, (m = modsOf(economies[owner])));
    return m;
  };
};

export const wingRange = (w: Pick<Wing, 'type'>, m: Pick<Mods, 'airRange'>): number => RANGE_KM[w.type] * (1 + m.airRange);
/** Is the wing flying today? Not if it is resting, has just moved, or its base is not in friendly hands. */
export function flying(w: Pick<AirView, 'controller' | 'day'>, wing: Wing, friends?: Set<string>): boolean {
  if (wing.mission === 'rest' || wing.strength <= 0 || w.day < wing.ready) return false;
  const holder = w.controller[wing.base];
  return holder === wing.owner || !!friends?.has(holder);
}

/** Who has what in the air over every province today. */
export interface AirPicture {
  /** Each country's air score over each province (fighters, plus 0.7 x ground-support bombers). */
  score: Map<string, Float32Array>;
  /** Each country's fighters alone over each province. */
  fighters: Map<string, Float32Array>;
  /** The attackers' multiplier in a land battle here: 1.15 if they control the sky, 0.85 if the defenders do, else 1. */
  battle(attackers: string[], defenders: string[], province: number): number;
  /** One side's total score over a province: the countries named and their allies. */
  side(countries: string[], province: number): number;
}

export function airPicture(w: AirView, friends: Map<string, Set<string>>): AirPicture {
  const score = new Map<string, Float32Array>();
  const fighters = new Map<string, Float32Array>();
  const mods = modCache(w.economies);
  const get = (map: Map<string, Float32Array>, name: string): Float32Array => map.get(name) ?? map.set(name, new Float32Array(N)).get(name)!;
  if (w.wars.length) {
    for (const wing of w.wings) {
      if (wing.mission !== 'superiority' && wing.mission !== 'ground') continue;
      if (!flying(w, wing, friends.get(wing.owner))) continue;
      const m = mods(wing.owner);
      const range = wingRange(wing, m);
      const fighter = wing.type === 'fighter';
      const eff = (wing.strength / 100) * (1 + (fighter ? m.fighterPower : m.bomberPower));
      const s = get(score, wing.owner);
      const f = fighter ? get(fighters, wing.owner) : null;
      for (let p = 0; p < N; p++) {
        if (km(wing.base, p) > range) continue;
        const here = fighter ? eff * ((w.owner ? w.owner[p] : PROVINCES[p].owner) === wing.owner ? 1 + m.airDefence : 1) : eff * SUPPORT_WEIGHT;
        s[p] += here;
        if (f) f[p] += here;
      }
    }
  }
  const side = (countries: string[], province: number): number => {
    const all = new Set(countries);
    for (const c of countries) for (const f of friends.get(c) ?? []) all.add(f);
    let total = 0;
    for (const c of all) total += score.get(c)?.[province] ?? 0;
    return total;
  };
  return {
    score,
    fighters,
    side,
    battle: (attackers, defenders, province) => {
      if (!score.size) return 1;
      const a = side(attackers, province);
      const d = side(defenders, province);
      if (a >= AIR_CONTROL_MIN && a >= AIR_CONTROL_RATIO * d) return 1 + AIR_EDGE;
      if (d >= AIR_CONTROL_MIN && d >= AIR_CONTROL_RATIO * a) return 1 - AIR_EDGE;
      return 1;
    },
  };
}

/** Each country's naval-strike strength over each sea zone. */
export function navalAir(w: AirView, friends: Map<string, Set<string>>): Map<string, number>[] {
  const out = ZONES.map(() => new Map<string, number>());
  if (!w.wars.length) return out;
  const mods = modCache(w.economies);
  for (const wing of w.wings) {
    if (wing.mission !== 'naval' || !flying(w, wing, friends.get(wing.owner))) continue;
    const m = mods(wing.owner);
    const range = wingRange(wing, m);
    const x = NAVAL_STRIKE * (wing.strength / 100) * (1 + m.bomberPower);
    for (let z = 0; z < ZONES.length; z++) if (zoneKm(z, wing.base) <= range) out[z].set(wing.owner, (out[z].get(wing.owner) ?? 0) + x);
  }
  return out;
}

/** The province a strategic bomber wing would attack today: the enemy province in range with the most working factories. -1 if there is none. */
export function bombTarget(w: AirView & Pick<World, 'factories' | 'bombed'>, wing: Wing): number {
  const range = wingRange(wing, modsOf(w.economies[wing.owner]));
  let best = -1;
  let most = 0;
  for (let p = 0; p < N; p++) {
    if (!atWar(w, wing.owner, w.controller[p]) || km(wing.base, p) > range) continue;
    const working = (w.factories.civ[p] + w.factories.mil[p]) * (BOMB_MAX - (w.bombed[p] ?? 0));
    if (working > most + 1e-9) {
      most = working;
      best = p;
    }
  }
  return best;
}

/** One day of the war in the air. Call it before the land battles; `air` is today's picture. */
export function runAir(d: ForceDraft, rng: Rng, air: AirPicture, friends: Map<string, Set<string>>, sea: { power: Map<string, number>[] }): void {
  const mods = modCache(d.economies);
  // Repairs to bombed factories.
  for (const key of Object.keys(d.bombed)) {
    const p = Number(key);
    d.bombed[p] *= BOMB_REPAIR;
    if (d.bombed[p] < 0.01) delete d.bombed[p];
  }

  // A wing whose base has fallen flies out to the nearest province its country still holds.
  const gone = new Set<number>();
  for (const wing of d.wings) {
    const holder = d.controller[wing.base];
    if (holder === wing.owner || friends.get(wing.owner)?.has(holder)) continue;
    let best = -1;
    for (let p = 0; p < N; p++) if (d.controller[p] === wing.owner && (best < 0 || km(wing.base, p) < km(wing.base, best))) best = p;
    if (best < 0) gone.add(wing.id);
    else {
      wing.base = best;
      wing.strength = Math.max(1, wing.strength - 20);
      wing.ready = d.day + REBASE_DAYS;
    }
  }

  const inFight = new Set<number>();
  if (d.wars.length) {
    const up = d.wings.filter((w) => !gone.has(w.id) && flying(d, w, friends.get(w.owner)));
    const eff = (w: Wing) => (w.strength / 100) * (1 + mods(w.owner).fighterPower);
    const sweepers = up.filter((w) => w.type === 'fighter' && w.mission === 'superiority');
    const loss = new Map<Wing, number>();
    for (const wing of up) {
      const range = wingRange(wing, mods(wing.owner));
      let threat = 0;
      let cover = 0;
      for (const f of sweepers) {
        const reach = wingRange(f, mods(f.owner));
        const apart = km(wing.base, f.base);
        if (atWar(d, wing.owner, f.owner)) {
          if (apart <= range + reach) threat += eff(f);
        } else if ((f.owner === wing.owner || friends.get(wing.owner)?.has(f.owner)) && apart <= reach) cover += eff(f);
      }
      let lost = threat > 0 ? (AIR_LOSS * threat * (0.7 + 0.6 * rng.next())) / (1 + threat + cover) : 0;

      if (wing.mission === 'strategic') {
        const target = bombTarget(d, wing);
        if (target >= 0) {
          let intercept = 0;
          for (const [name, f] of air.fighters) if (atWar(d, wing.owner, name)) intercept += f[target];
          const hit = (BOMB_DAMAGE * (wing.strength / 100) * (1 + mods(wing.owner).bomberPower)) / (1 + intercept);
          d.bombed[target] = Math.min(BOMB_MAX, (d.bombed[target] ?? 0) + hit);
          lost += FLAK_LOSS + (0.3 * intercept) / (1 + intercept);
          inFight.add(wing.id);
        }
      } else if (wing.mission === 'naval') {
        // Ships shoot back.
        const m = mods(wing.owner);
        for (let z = 0; z < ZONES.length; z++) {
          if (zoneKm(z, wing.base) > wingRange(wing, m)) continue;
          for (const [name, x] of sea.power[z]) {
            if (x > 0 && atWar(d, wing.owner, name)) {
              lost += FLAK_LOSS;
              z = ZONES.length;
              break;
            }
          }
        }
      }
      if (lost > 0) {
        loss.set(wing, lost);
        inFight.add(wing.id);
      }
    }
    for (const [wing, lost] of loss) {
      wing.strength -= lost;
      if (wing.strength <= 0) {
        gone.add(wing.id);
        logForce(d, 'air', `${wing.owner} loses a ${wing.type} wing based in ${PROVINCES[wing.base].name}`, [wing.owner], { province: wing.base });
      }
    }
  }

  // Repairs: spare aircraft from the factories and new crews.
  for (const wing of d.wings) {
    if (gone.has(wing.id) || wing.strength >= 100) continue;
    const e = d.economies[wing.owner];
    if (!e) continue;
    const want = Math.min(100 - wing.strength, wing.mission === 'rest' ? WING_REST_REPAIR : inFight.has(wing.id) ? WING_REPAIR / 2 : WING_REPAIR);
    const gain = Math.max(0, Math.min(want, e.stock[wing.type] * 100));
    e.stock[wing.type] -= gain / 100;
    wing.strength += gain;
  }
  if (gone.size) d.wings = d.wings.filter((w) => !gone.has(w.id));
}

export type WingOrder = Extract<Order, { type: 'wing' }>;

/** Why a wing cannot be based in a province, or null if it can. */
export function cannotBase(w: Pick<World, 'controller'>, owner: string, province: number, friends?: Set<string>): string | null {
  const holder = w.controller[province];
  if (holder === undefined) return 'no such province';
  return holder === owner || friends?.has(holder) ? null : `${PROVINCES[province].name} is not in your hands or an ally's`;
}

export function giveWingOrder(d: Pick<ForceDraft, 'wings' | 'controller' | 'day'>, o: WingOrder, friends?: Set<string>): void {
  const wing = d.wings.find((x) => x.id === o.wing);
  if (!wing) return;
  if (o.mission && MISSIONS[wing.type].includes(o.mission)) wing.mission = o.mission;
  if (o.base !== undefined && o.base !== wing.base && !cannotBase(d, wing.owner, o.base, friends)) {
    wing.base = o.base;
    wing.ready = d.day + REBASE_DAYS;
  }
}

/** Why a wing of this kind cannot be formed right now, or null if it can. */
export function cannotRaiseWing(e: Economy, plane: PlaneKind): string | null {
  if (e.stock[plane] < 1) return 'no finished aircraft yet';
  if (e.manpower < MEN_PER_WING) return 'not enough manpower';
  return null;
}
