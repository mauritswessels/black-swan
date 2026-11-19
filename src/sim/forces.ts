/**
 * The navy and the air force together: what the rest of the engine needs from them.
 *
 * Each day world.ts calls `pictures` once (who controls each sea zone and the sky over each
 * province), then `runForces` (sea battles, the convoy war, air losses, bombing, troops
 * sailing), and uses the same pictures for supply and for the land battles.
 */
import { AIR_CONTROL_MIN, AIR_CONTROL_RATIO, airPicture, cannotRaiseWing, giveWingOrder, km, MEN_PER_WING, navalAir, runAir, startWings, type AirPicture } from './air';
import { musterPoint } from './economy';
import { PROVINCES } from './map';
import { modsOf } from './mods';
import { arrived, giveFleetOrder, giveShipOrder, logForce, navalPicture, runNavy, runShipping, SHELL_MAX, SHELL_POWER, startFleets, type ForceDraft } from './navy';
import { Rng } from './rng';
import { COAST, SHIP_KINDS, ZONE_INDEX, type SeaPicture } from './sea';
import type { Order, Unit, World } from './types';
import { atWar, enemiesOf } from './war';

export type ForceOrder = Extract<Order, { type: 'ship' | 'fleet' | 'transfer' | 'wing' | 'raiseWing' | 'drop' }>;
export const isForceOrder = (o: Order): o is ForceOrder => o.type === 'ship' || o.type === 'fleet' || o.type === 'transfer' || o.type === 'wing' || o.type === 'raiseWing' || o.type === 'drop';

export interface Pictures {
  sea: SeaPicture;
  air: AirPicture;
}

type View = Pick<World, 'fleets' | 'wings' | 'controller' | 'wars' | 'economies' | 'day'> & { owner?: string[] };

/** Control of the sea and of the sky as things stand. `friends` is each country's allies (allianceMap). */
export function pictures(w: View, friends: Map<string, Set<string>>): Pictures {
  return { sea: navalPicture(w, friends, navalAir(w, friends)), air: airPicture(w, friends) };
}

/** The navies and air forces of 1 January 1936. */
export function startForces(): Pick<World, 'fleets' | 'wings' | 'nextForceId' | 'bombed' | 'clashes' | 'forceLog' | 'nextForceEventId'> {
  const fleets = startFleets();
  const wings = startWings(fleets.length);
  return { fleets, wings, nextForceId: fleets.length + wings.length, bombed: {}, clashes: [], forceLog: [], nextForceEventId: 0 };
}

/** Carry out an order to a fleet, a wing or a division going by sea. Orders that make no sense are ignored. */
export function giveForceOrder(d: ForceDraft, o: ForceOrder, friends: Map<string, Set<string>>, sea: () => SeaPicture): void {
  switch (o.type) {
    case 'fleet':
    case 'transfer':
      giveFleetOrder(d, o);
      break;
    case 'wing':
      giveWingOrder(d, o, friends.get(d.wings.find((x) => x.id === o.wing)?.owner ?? ''));
      break;
    case 'ship': {
      const u = d.units.find((x) => x.id === o.unit);
      if (u) giveShipOrder(d, sea(), friends, u, o.to);
      break;
    }
    case 'drop': {
      const u = d.units.find((x) => x.id === o.unit);
      if (u && !('why' in dropPlan(d, friends, u, o.to))) {
        u.path = [];
        u.progress = 0;
        u.landing = undefined;
        u.sea = undefined;
        u.drop = { to: o.to, daysLeft: DROP_PREP_DAYS };
      }
      break;
    }
    case 'raiseWing': {
      const e = d.economies[o.country];
      if (!e || d.capitulated.includes(o.country) || (o.plane !== 'fighter' && o.plane !== 'bomber') || cannotRaiseWing(e, o.plane)) break;
      const base = musterPoint(d.controller, o.country, d.owner);
      if (base === null) break;
      e.stock[o.plane] -= 1;
      e.manpower -= MEN_PER_WING;
      d.wings.push({ id: d.nextForceId++, owner: o.country, type: o.plane, base, mission: o.plane === 'fighter' ? 'superiority' : 'ground', strength: 100, ready: d.day });
      break;
    }
  }
}

/** One day of the war at sea and in the air. */
export function runForces(d: ForceDraft, rng: Rng, p: Pictures, friends: Map<string, Set<string>>): void {
  runNavy(d, rng, p.sea, friends);
  runAir(d, rng, p.air, friends, p.sea);
  runShipping(d, p.sea, friends);
  runDrops(d, p.air, friends);
}

// ---------- fire support: aimed bombers and ships shelling the coast ----------

/** What aimed bombers and shelling ships add to each side of a battle today (damage a day, before luck). */
export interface Fire {
  attack: number;
  defence: number;
  /** The same, split into bombers and ships, for the battle sidebar. */
  attackBombers: number;
  attackShips: number;
  defenceBombers: number;
  defenceShips: number;
  /** The fleets whose guns took part. */
  fleets: number[];
}
export type FireFn = (province: number, attackers: string[], defenders: string[]) => Fire;

type FireView = Pick<World, 'fleets' | 'wars' | 'economies' | 'day'>;

/**
 * Fire support for a battle. A bomber wing aimed at the province on ground support adds
 * 3 x strength / 100 x (1 + bomber research) / (1 + enemy fighters over the province); a fleet
 * on patrol aimed at it adds its shelling (navy.ts), half while its zone is contested. Each
 * country helps the side it is on: the side of a country it is, or is allied to, and that is at
 * war with the other side.
 */
export function fireSupport(w: FireView, p: Pictures, friends: Map<string, Set<string>>): FireFn {
  const shelling = new Map<number, { owner: string; power: number; fleet: number }[]>();
  for (const f of w.fleets) {
    if (f.target === undefined || f.mission !== 'patrol' || !arrived(f, w.day)) continue;
    const z = ZONE_INDEX[f.zone];
    if (!COAST[f.target]?.includes(z)) continue;
    const status = p.sea.status(f.owner, z);
    if (status === 'enemy') continue;
    const power = SHIP_KINDS.reduce((a, k) => a + f.ships[k] * SHELL_POWER[k], 0) * (1 + modsOf(w.economies[f.owner]).navalPower) * (status === 'contested' ? 0.5 : 1);
    if (power > 0) (shelling.get(f.target) ?? shelling.set(f.target, []).get(f.target)!).push({ owner: f.owner, power, fleet: f.id });
  }
  const onSide = (c: string, side: string[], other: string[]) => (side.includes(c) || side.some((s) => friends.get(s)?.has(c))) && other.some((o) => atWar(w, c, o));
  return (province, attackers, defenders) => {
    const out: Fire = { attack: 0, defence: 0, attackBombers: 0, attackShips: 0, defenceBombers: 0, defenceShips: 0, fleets: [] };
    for (const a of p.air.aimed.get(province) ?? []) {
      let foes = 0;
      for (const [name, f] of p.air.fighters) if (atWar(w, a.owner, name)) foes += f[province];
      const x = a.power / (1 + foes);
      if (onSide(a.owner, attackers, defenders)) out.attackBombers += x;
      else if (onSide(a.owner, defenders, attackers)) out.defenceBombers += x;
    }
    for (const s of shelling.get(province) ?? []) {
      if (onSide(s.owner, attackers, defenders)) out.attackShips += s.power;
      else if (onSide(s.owner, defenders, attackers)) out.defenceShips += s.power;
      else continue;
      out.fleets.push(s.fleet);
    }
    out.attackShips = Math.min(SHELL_MAX, out.attackShips);
    out.defenceShips = Math.min(SHELL_MAX, out.defenceShips);
    out.attack = out.attackBombers + out.attackShips;
    out.defence = out.defenceBombers + out.defenceShips;
    return out;
  };
}

/** For each province: the countries whose bombers or ships are aimed at it today. Their enemies there cannot dig in. */
export function pounding(w: FireView, p: Pictures): Map<number, string[]> {
  const out = new Map<number, string[]>();
  const add = (province: number, owner: string) => {
    const list = out.get(province) ?? out.set(province, []).get(province)!;
    if (!list.includes(owner)) list.push(owner);
  };
  for (const [province, list] of p.air.aimed) for (const a of list) add(province, a.owner);
  for (const f of w.fleets) if (f.target !== undefined && f.mission === 'patrol' && arrived(f, w.day) && COAST[f.target]?.includes(ZONE_INDEX[f.zone]) && p.sea.status(f.owner, ZONE_INDEX[f.zone]) !== 'enemy') add(f.target, f.owner);
  return out;
}

// ---------- paratroopers ----------

/** How far paratroopers can be flown, in km (research on aircraft range adds to it). */
export const DROP_RANGE_KM = 400;
/** Days to get a drop ready: aircraft, parachutes, the plan. */
export const DROP_PREP_DAYS = 3;
/** Paratroopers must be this well organised to be sent. */
export const DROP_MIN_ORG = 60;
/** Organisation lost by jumping: the men land scattered and must gather. */
export const DROP_ORG_COST = 20;
/** Strength lost in the drop when the enemy controls the sky over the target, and when the sky is contested. */
export const DROP_LOSS_ENEMY_SKY = 30;
export const DROP_LOSS_CONTESTED = 10;

export const dropRange = (w: Pick<World, 'economies'>, owner: string): number => DROP_RANGE_KM * (1 + modsOf(w.economies[owner]).airRange);

/**
 * Can these paratroopers drop on this province? They take off from an airfield in friendly
 * hands and fly up to 400 km. On land with no enemy divisions in it they take it at once (or
 * reinforce it, if it is friendly). Where enemy divisions stand they come down into the fight:
 * they attack it from the air, a new direction, at 70% (mods.ts), and if the attack fails they
 * are lost (combat.ts).
 */
export function dropPlan(w: Pick<World, 'units' | 'controller' | 'wars' | 'economies'>, friends: Map<string, Set<string>>, u: Unit, to: number): { days: number } | { why: string } {
  const p = PROVINCES[to];
  if (!p) return { why: 'no such province' };
  if (u.type !== 'airborne') return { why: 'only paratroopers can drop from the air' };
  if (u.at === to) return { why: `already in ${p.name}` };
  const mates = friends.get(u.owner);
  const friendly = (c: string) => c === u.owner || !!mates?.has(c);
  if (!friendly(w.controller[u.at])) return { why: `${PROVINCES[u.at].name} is not in friendly hands: no airfield to take off from` };
  const holder = w.controller[to];
  if (!friendly(holder) && !atWar(w, u.owner, holder)) return { why: `${p.name} belongs to ${holder}, which is neutral` };
  const range = dropRange(w, u.owner);
  const d = km(u.at, to);
  if (d > range) return { why: `${p.name} is ${Math.round(d)} km away; the transport aircraft reach ${Math.round(range)} km` };
  if (u.organisation < DROP_MIN_ORG) return { why: `the paratroopers need rest first (organisation ${Math.round(u.organisation)}, at least ${DROP_MIN_ORG})` };
  return { days: DROP_PREP_DAYS };
}

/** One day for paratroopers getting ready: when the time is up they jump, if there is still nobody to fight on the ground. */
export function runDrops(d: ForceDraft, air: AirPicture, friends: Map<string, Set<string>>): void {
  const landed = new Map<string, number>();
  const fought = new Map<string, number>();
  for (const u of d.units) {
    if (!u.drop) continue;
    if (u.path.length || u.sea) {
      u.drop = undefined; // it was given another order
      continue;
    }
    if (u.drop.daysLeft > 1) {
      u.drop = { ...u.drop, daysLeft: u.drop.daysLeft - 1 };
      continue;
    }
    const to = u.drop.to;
    u.drop = undefined;
    const plan = dropPlan(d, friends, { ...u, organisation: Math.max(u.organisation, DROP_MIN_ORG) }, to);
    const why = 'why' in plan ? plan.why : null;
    if (why) {
      logForce(d, 'air', `${u.owner}: the drop on ${PROVINCES[to].name} is called off, because ${why}`, [u.owner], { province: to });
      continue;
    }
    // The sky decides how scattered the drop is.
    const foes = enemiesOf(d, u.owner);
    const mine = air.side([u.owner], to);
    const theirs = foes.length ? air.side(foes, to) : 0;
    const loss = theirs >= AIR_CONTROL_MIN && theirs >= AIR_CONTROL_RATIO * mine ? DROP_LOSS_ENEMY_SKY : theirs > 0.05 && !(mine >= AIR_CONTROL_MIN && mine >= AIR_CONTROL_RATIO * theirs) ? DROP_LOSS_CONTESTED : 0;
    u.strength = Math.max(1, u.strength - loss);
    u.organisation = Math.max(0, u.organisation - DROP_ORG_COST);
    u.dugIn = 0;
    u.progress = 0;
    if (d.units.some((e) => e.at === to && atWar(d, u.owner, e.owner))) {
      // Enemy divisions there: the paratroopers come down into the fight, from a new direction.
      u.path = [to];
      u.landing = true;
      u.dropped = true;
      fought.set(`${u.owner}|${to}`, (fought.get(`${u.owner}|${to}`) ?? 0) + 1);
      continue;
    }
    u.at = to;
    const holder = d.controller[to];
    if (atWar(d, u.owner, holder)) {
      // Taken. Land that belongs to an ally still in the fight is handed back to it.
      const owner = d.owner[to];
      d.controller[to] = owner !== u.owner && friends.get(u.owner)?.has(owner) && !d.capitulated.includes(owner) && atWar(d, owner, holder) ? owner : u.owner;
    }
    landed.set(`${u.owner}|${to}`, (landed.get(`${u.owner}|${to}`) ?? 0) + 1);
  }
  for (const [key, n] of [...landed].sort()) {
    const owner = key.slice(0, key.indexOf('|'));
    const to = Number(key.slice(key.indexOf('|') + 1));
    logForce(d, 'air', `${owner} drops ${n} ${n === 1 ? 'division' : 'divisions'} of paratroopers on ${PROVINCES[to].name}`, [owner], { province: to });
  }
  for (const [key, n] of [...fought].sort()) {
    const owner = key.slice(0, key.indexOf('|'));
    const to = Number(key.slice(key.indexOf('|') + 1));
    logForce(d, 'air', `${owner} drops ${n} ${n === 1 ? 'division' : 'divisions'} of paratroopers into the battle for ${PROVINCES[to].name}`, [owner, d.controller[to]], { province: to });
  }
}

/** After a surrender or an annexation: the loser's ships and aircraft are gone. */
export function disband(d: Pick<ForceDraft, 'fleets' | 'wings'>, gone: (country: string) => boolean): void {
  if (d.fleets.some((f) => gone(f.owner))) d.fleets = d.fleets.filter((f) => !gone(f.owner));
  if (d.wings.some((w) => gone(w.owner))) d.wings = d.wings.filter((w) => !gone(w.owner));
}
