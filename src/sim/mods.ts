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
import type { Economy, Unit } from './types';

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

/** A country's totals: every finished technology and plan added together. */
export function modsOf(e: Pick<Economy, 'research' | 'plan'> | undefined): Mods {
  const out = noMods();
  if (!e) return out;
  const add = (effects: Effects | undefined) => {
    if (effects) for (const k of KEYS) out[k] += effects[k] ?? 0;
  };
  for (const id of e.research.done) add(TECH_EFFECTS.get(id));
  for (const id of e.plan.done) add(PLAN_EFFECTS.get(id));
  return out;
}

/** How much harder a division hits, or holds, than the basic figures in combat.ts (1 = no change). */
export interface Edges {
  attack(u: Unit): number;
  defence(u: Unit, province: number): number;
}

const CAP = { infantry: 'Infantry', armour: 'Armour', artillery: 'Artillery' } as const;

/** The edges every country's divisions have today, from its research and plans. */
export function combatEdges(economies: Record<string, Economy>): Edges {
  const cache = new Map<string, Mods>();
  const of = (owner: string): Mods => {
    let m = cache.get(owner);
    if (!m) cache.set(owner, (m = modsOf(economies[owner])));
    return m;
  };
  return {
    attack: (u) => 1 + of(u.owner)[`attack${CAP[u.type]}`],
    defence: (u, province) => (1 + of(u.owner)[`defence${CAP[u.type]}`]) * (PROVINCES[province].owner === u.owner ? 1 + of(u.owner).homeDefence : 1),
  };
}
