/**
 * What research and national plans change.
 *
 * Every technology and every finished plan carries a short list of effects, such as
 * "infantry attack +10%". A country's effects are simply added together into its `Mods`, and
 * the rest of the engine (economy.ts, combat.ts, world.ts) reads the totals from there. Nothing
 * else in the game needs to know which technology or plan an effect came from.
 */
import { PLANS } from './plans';
import { TECHS } from './research';
import { PROVINCES } from './map';
import { GROUND_ATTACK, groundIn, isWinter, seasonOf, WINTER_ATTACK, WINTER_LANDS } from './seasons';
import type { Army, ArmyEffect, Economy, Unit } from './types';
import { commanderById, TRAIT_ATTACK, TRAIT_DEFENCE, type Trait } from './commanders';

/** Every number research and plans can move. All start at 0; see EFFECT_TEXT for what each one means. */
export interface Mods {
  attackInfantry: number;
  attackArmour: number;
  attackArtillery: number;
  defenceInfantry: number;
  defenceArmour: number;
  defenceArtillery: number;
  /** Extra defence for divisions fighting in their own country's home provinces. */
  homeDefence: number;
  orgRecovery: number;
  /** Points of organisation added to a newly trained division. */
  newDivisionOrg: number;
  lineOutput: number;
  /** How fast a production line gains speed. */
  lineGain: number;
  buildSpeed: number;
  /** Steel and oil the factories and tanks need. */
  resourceNeed: number;
  taxRevenue: number;
  bondAppetite: number;
  /** The stability cost and black-market loss of rationing. */
  rationingCost: number;
  /** The output lost to wide conscription laws. */
  conscriptionDrag: number;
  /** Added to the share of the world price that exports earn. */
  exportShare: number;
  manpower: number;
  /** Consumer goods people expect. */
  goodsNeed: number;
  /** Points added to the real interest rate lenders ask for. */
  realRate: number;
  /** Added to the tax rate above which stability falls (0.03 = three points). */
  taxThreshold: number;
  /** Points added to where stability and war support settle. */
  stability: number;
  warSupport: number;
  /** How hard surface warships hit. */
  navalPower: number;
  /** How many merchant ships submarines sink. */
  subRaiding: number;
  /** How well escorts protect convoys and hunt submarines. */
  antiSub: number;
  /** Taken off the 40% penalty for attacking from the sea (0.15 = fifteen points). */
  amphibious: number;
  /** Days of preparation a landing needs. */
  landingPrep: number;
  fighterPower: number;
  bomberPower: number;
  airRange: number;
  /** Extra fighter strength over your own home provinces (radar and ground control). */
  airDefence: number;
  /** 1 once the country can train paratroopers (the Airborne forces technology). */
  airborne: number;
}

export type ModKey = keyof Mods;
export type Effects = Partial<Mods>;

const pct = (x: number): string => `${x > 0 ? '+' : '-'}${Math.round(Math.abs(x) * 100)}%`;
const pts = (x: number): string => `${x > 0 ? '+' : '-'}${Math.abs(x)}`;

/** How each effect reads in the game, e.g. "Infantry attack +10%". */
const EFFECT_TEXT: Record<ModKey, (x: number) => string> = {
  attackInfantry: (x) => `Infantry attack ${pct(x)}`,
  attackArmour: (x) => `Armour attack ${pct(x)}`,
  attackArtillery: (x) => `Artillery attack ${pct(x)}`,
  defenceInfantry: (x) => `Infantry defence ${pct(x)}`,
  defenceArmour: (x) => `Armour defence ${pct(x)}`,
  defenceArtillery: (x) => `Artillery defence ${pct(x)}`,
  homeDefence: (x) => `Defence in your home provinces ${pct(x)}`,
  orgRecovery: (x) => `Divisions regain organisation ${pct(x)} faster`,
  newDivisionOrg: (x) => `New divisions arrive with ${pts(x)} organisation`,
  lineOutput: (x) => `Production lines make ${pct(x)} equipment`,
  lineGain: (x) => `Production lines gain speed ${pct(x)} faster`,
  buildSpeed: (x) => `Construction ${pct(x)} faster`,
  resourceNeed: (x) => `Steel and oil needed ${pct(x)}`,
  taxRevenue: (x) => `Tax income ${pct(x)}`,
  bondAppetite: (x) => `Lenders buy ${pct(x)} bonds a month`,
  rationingCost: (x) => `Stability cost and black market of rationing ${pct(x)}`,
  conscriptionDrag: (x) => `Output lost to conscription ${pct(x)}`,
  exportShare: (x) => `Exports earn ${Math.round(x * 100)} points more of the world price`,
  manpower: (x) => `Manpower ${pct(x)}`,
  goodsNeed: (x) => `Consumer goods people expect ${pct(x)}`,
  realRate: (x) => `Interest lenders ask for ${pts(x)} ${Math.abs(x) === 1 ? 'point' : 'points'}`,
  taxThreshold: (x) => `Taxes can be ${Math.round(x * 100)} points higher before stability falls`,
  stability: (x) => `Stability ${pts(x)}`,
  warSupport: (x) => `War support ${pts(x)}`,
  navalPower: (x) => `Warships hit ${pct(x)} harder`,
  subRaiding: (x) => `Submarines sink ${pct(x)} merchant ships`,
  antiSub: (x) => `Escorts protect convoys and hunt submarines ${pct(x)} better`,
  amphibious: (x) => `Penalty for attacking from the sea ${Math.round(x * 100)} points smaller`,
  landingPrep: (x) => `Landings take ${pct(x)} time to prepare`,
  fighterPower: (x) => `Fighters ${pct(x)} stronger`,
  bomberPower: (x) => `Bombers ${pct(x)} stronger`,
  airRange: (x) => `Aircraft range ${pct(x)}`,
  airDefence: (x) => `Fighters ${pct(x)} stronger over your home provinces`,
  airborne: () => 'Paratroopers can be trained (Production), and dropped behind the enemy line',
};

export const KEYS = Object.keys(EFFECT_TEXT) as ModKey[];

/** The effects as lines of plain text, in a fixed order. */
export const describeEffects = (effects: Effects | undefined): string[] => (effects ? KEYS.filter((k) => effects[k]).map((k) => EFFECT_TEXT[k](effects[k]!)) : []);

export const noMods = (): Mods => {
  const out = {} as Mods;
  for (const k of KEYS) out[k] = 0;
  return out;
};

const TECH_EFFECTS = new Map(TECHS.map((t) => [t.id, t.effects]));
const PLAN_EFFECTS = new Map(PLANS.map((p) => [p.id, p.effects]));

/** modsOf's answers, kept while the country finishes no new technology or plan. */
const MODS_CACHE = new WeakMap<object, { done: string[]; n: number; plans: string[]; m: number; mods: Mods }>();
const NO_MODS: Mods = Object.freeze(noMods());

/**
 * A country's totals: every finished technology and plan added together. Asked for many times a
 * day, so the answer is kept until the lists of finished technologies and plans change. The
 * answer is shared: never change it.
 */
export function modsOf(e: Pick<Economy, 'research' | 'plan'> | undefined): Mods {
  if (!e) return NO_MODS;
  const hit = MODS_CACHE.get(e);
  if (hit && hit.done === e.research.done && hit.n === e.research.done.length && hit.plans === e.plan.done && hit.m === e.plan.done.length) return hit.mods;
  const mods = Object.freeze(sumMods(e));
  MODS_CACHE.set(e, { done: e.research.done, n: e.research.done.length, plans: e.plan.done, m: e.plan.done.length, mods });
  return mods;
}

function sumMods(e: Pick<Economy, 'research' | 'plan'>): Mods {
  const out = noMods();
  const add = (effects: Effects | undefined) => {
    if (effects) for (const k of KEYS) out[k] += effects[k] ?? 0;
  };
  for (const id of e.research.done) add(TECH_EFFECTS.get(id));
  for (const id of e.plan.done) add(PLAN_EFFECTS.get(id));
  return out;
}

/** A division attacking from the sea keeps this share of its hitting power. */
export const AMPHIBIOUS = 0.6;
/** Paratroopers who drop into a fight keep this share: they come down scattered, with light weapons. */
export const DROP_ATTACK = 0.7;

/** How much harder a division hits, or holds, than the basic figures in combat.ts (1 = no change). */
export interface Edges {
  attack(u: Unit): number;
  defence(u: Unit, province: number): number;
  /** The country's army was caught by surprise or is in shock (story.ts, diplomacy.ts): it cannot hold a line. */
  reeling?(country: string): boolean;
}

/** Which research a kind of division takes its attack and defence from. Paratroopers are infantry. */
const CAP = { infantry: 'Infantry', armour: 'Armour', artillery: 'Artillery', airborne: 'Infantry' } as const;

/** Army effects that leave an army reeling: caught by surprise (a broken pact) or in shock (France in May 1940, the Balkans in 1941). */
export const REELING = ['surprise', 'shock'];

/** What story.ts adds to a battle: passing conditions on whole armies, and the season. */
export interface EdgeContext {
  effects: ArmyEffect[];
  day: number;
  startDate: string;
  /** Armies, for their commanders' traits (commanders.ts). */
  armies?: Army[];
}

/** The trait of the commander leading each division's army, by unit id. */
export function commanderTraits(armies: Army[] | undefined): Map<number, Trait> {
  const out = new Map<number, Trait>();
  for (const a of armies ?? []) {
    const c = commanderById(a.commander);
    if (c) for (const id of a.units) out.set(id, c.trait);
  }
  return out;
}

export { isWinter, WINTER_ATTACK, WINTER_LANDS } from './seasons';

/** The edges every country's divisions have today, from its research and plans, and (with `ctx`) from surprise, lost officers and winter. */
export function combatEdges(economies: Record<string, Economy>, ctx?: EdgeContext): Edges {
  const attackOf = new Map<string, number>();
  const defenceOf = new Map<string, number>();
  for (const x of ctx?.effects ?? []) {
    if (x.until < ctx!.day) continue;
    attackOf.set(x.country, (attackOf.get(x.country) ?? 1) * x.attack);
    defenceOf.set(x.country, (defenceOf.get(x.country) ?? 1) * x.defence);
  }
  const reeling = new Set((ctx?.effects ?? []).filter((x) => x.until >= ctx!.day && REELING.includes(x.id)).map((x) => x.country));
  const winter = !!ctx && isWinter(ctx.startDate, ctx.day);
  const season = ctx && seasonOf(ctx.startDate, ctx.day);
  // The cold hits invaders of the winter lands; mud slows every attack (seasons.ts).
  const cold = (u: Unit): number => {
    if (!season || !u.path.length) return 1;
    const land = PROVINCES[u.path[0]].owner;
    return (winter && WINTER_LANDS.has(land) && !WINTER_LANDS.has(u.owner) ? WINTER_ATTACK : 1) * GROUND_ATTACK[groundIn(u.path[0], season)];
  };
  const traits = commanderTraits(ctx?.armies);
  const led = (u: Unit, table: Record<Trait, number>): number => {
    const t = traits.get(u.id);
    return t ? table[t] : 1;
  };
  const cache = new Map<string, Mods>();
  const of = (owner: string): Mods => {
    let m = cache.get(owner);
    if (!m) cache.set(owner, (m = modsOf(economies[owner])));
    return m;
  };
  return {
    // A division storming a beach fights at 60% (see AMPHIBIOUS), a little better with landing craft.
    attack: (u) => (1 + of(u.owner)[`attack${CAP[u.type]}`]) * (u.landing ? (u.dropped ? DROP_ATTACK : Math.min(1, AMPHIBIOUS + of(u.owner).amphibious)) : 1) * (attackOf.get(u.owner) ?? 1) * cold(u) * led(u, TRAIT_ATTACK),
    defence: (u, province) => (1 + of(u.owner)[`defence${CAP[u.type]}`]) * (PROVINCES[province].owner === u.owner ? 1 + of(u.owner).homeDefence : 1) * (defenceOf.get(u.owner) ?? 1) * led(u, TRAIT_DEFENCE),
    reeling: (country) => reeling.has(country),
  };
}
