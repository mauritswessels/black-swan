/**
 * The economy: factories, manpower, production and paying for the war.
 *
 * Every country has civilian factories (they make consumer goods, or build more factories) and
 * military factories (they make the equipment divisions need). Factories stand in provinces, so
 * losing land loses industry. Every day each country collects taxes and pays its bills; any
 * shortfall is covered by selling bonds or by printing money. Once a month the game works out
 * inflation and stability from what happened.
 *
 * The rules are written out in plain words in MODEL.md. All the numbers are constants at the
 * top of this file. Nothing here is random.
 */
import { COUNTRIES, countryByName } from './countries';
import { PROVINCES } from './map';
import type { Economy, FactoryKind, Government, InflationCauses, MonthRecord, Order, Unit, UnitType, World } from './types';
import { linkedProvinces, supplyCapacity } from './supply';
import { enemiesOf } from './war';

export const UNIT_TYPES: UnitType[] = ['infantry', 'armour', 'artillery'];

// ---------- the numbers ----------

/** Output of one working factory a month, in millions at 1936 prices. */
export const OUTPUT_PER_FACTORY = 10;
/** Share of output the state spends on everything that is not the war: schools, pensions, officials. */
export const GOVERNMENT_SHARE = 0.12;
/** Monthly cost of running one military factory, or one civilian factory on construction. */
export const FACTORY_COST = 2;
/** Monthly cost of a division at peace. At war it costs WAR_UPKEEP times as much (ammunition, fuel, losses). */
export const UPKEEP: Record<UnitType, number> = { infantry: 0.3, armour: 0.6, artillery: 0.45 };
export const WAR_UPKEEP = 3;

/** Factory-days of work to equip one division. */
export const KIT_COST: Record<UnitType, number> = { infantry: 120, armour: 300, artillery: 180 };
/** Days to train a new division once its equipment and men are ready. */
export const TRAINING_DAYS: Record<UnitType, number> = { infantry: 30, armour: 60, artillery: 40 };
/** A new division arrives with this much organisation: it needs a few weeks to shake down. */
export const NEW_DIVISION_ORGANISATION = 40;
/** Thousands of men in a division. */
export const MEN_PER_DIVISION = 15;
/** Strength a resting, supplied division can regain a day, if there is equipment and manpower for it. */
export const REINFORCE_PER_DAY = 0.5;

/** A new production line works at half speed and gains 0.25 points a day, reaching full speed after 200 days. */
export const LINE_START = 0.5;
export const LINE_GAIN = 0.0025;

/** Factory-days of work to build a factory, and how many civilian factories can work on one at once. */
export const BUILD_COST: Record<FactoryKind, number> = { civ: 540, mil: 360 };
export const BUILDERS_PER_PROJECT = 5;

/** Share of a foreign province's factories, and of its steel and oil, that an occupier gets. */
export const OCCUPIED_FACTORIES = 0.3;
export const OCCUPIED_RESOURCES = 0.5;

/** Share of civilian factories that must make consumer goods to keep the shops full. */
export const GOODS_NEED = 0.7;
/** Rationing cuts what people may buy by a quarter. */
export const RATIONING_NEED = 0.75;
/** Rationing and price controls feed a black market that pays no tax. */
export const BLACK_MARKET_TAX_LOSS = 0.05;

/** World prices of steel and oil, per unit a month. Exports earn half the price. */
export const PRICE = { steel: 1.5, oil: 2.5 };
export const EXPORT_SHARE = 0.5;
/** Oil a month for each armoured division in the field (an armour line needs one per factory). */
export const OIL_PER_ARMOUR_DIVISION = 0.5;

/** Stability lost for each point of tax above 25%, and output lost for each point above 30%. */
export const TAX_STABILITY = 1.2;
export const TAX_DRAG = 0.5;
export const TAX_MIN = 0.1;
export const TAX_MAX = 0.6;

/** Conscription laws: the share of the population that can serve, and what it does to factory output. */
export const CONSCRIPTION: { name: string; share: number; output: number }[] = [
  { name: 'Volunteers only', share: 0.015, output: 1 },
  { name: 'Limited conscription', share: 0.025, output: 1 },
  { name: 'Extensive conscription', share: 0.05, output: 0.95 },
  { name: 'Mass mobilisation', share: 0.1, output: 0.88 },
  { name: 'Every adult serves', share: 0.15, output: 0.78 },
];

/** The real interest rate lenders want from a safe borrower, per cent a year. */
export const BASE_REAL_RATE = 3;
/** Debt at the start, as a share of a year's output. */
export const START_DEBT = 0.5;
/** Money in circulation at the start, as a share of a year's output. */
export const START_MONEY = 0.5;
/** Bonds the public will buy in a month, as a share of a month's output, when confidence is full. */
export const BOND_APPETITE = 0.25;
/** Money the banks create anyway each year, in per cent. With no printing this gives 2% inflation. */
export const BANK_CREDIT = 2;
/** Where stability settles when nothing is wrong. */
export const STABILITY_BASE = 75;
/** Points of inflation added each month by empty shops (at a 100% shortage). */
export const SHORTAGE_PUSH = 8;

// ---------- where the factories, people and raw materials are ----------

/** Provinces joined by their owner's land to its capital: the homeland, as opposed to colonies and islands. */
const HOMELAND: boolean[] = (() => {
  const out = new Array<boolean>(PROVINCES.length).fill(false);
  for (const capital of PROVINCES.filter((p) => p.capital)) {
    const queue = [capital.id];
    out[capital.id] = true;
    while (queue.length) for (const n of PROVINCES[queue.pop()!].neighbours) if (!out[n] && PROVINCES[n].owner === capital.owner) (out[n] = true), queue.push(n);
  }
  return out;
})();

/** Extra weight for the great industrial regions of the 1930s. */
const INDUSTRIAL: Record<string, number> = {
  Rhineland: 12, Saxony: 4, Silesia: 3, Lorraine: 5, Yorkshire: 8, 'Scottish Lowlands': 2, Wales: 3, Lombardy: 8, Piedmont: 4, Donbass: 9, Dnepropetrovsk: 4, Gorky: 3,
  'Upper Silesia': 5, Wallonia: 8, Moravia: 5, Catalonia: 4,
};

/** How much of its country's industry and people a province holds, before scaling. */
const WEIGHT: number[] = PROVINCES.map((p) => (HOMELAND[p.id] ? p.victoryPoints + 1 + (INDUSTRIAL[p.name] ?? 0) : 0.3));

/** Where the steel and oil come from, as shares of the country's total. Anything not listed is at the capital. */
const SITES: Record<string, { steel?: Record<string, number>; oil?: Record<string, number> }> = {
  Germany: { steel: { Rhineland: 0.7, Silesia: 0.3 } },
  France: { steel: { Lorraine: 0.8 } },
  'United Kingdom': { steel: { Yorkshire: 0.5, Wales: 0.3, 'Scottish Lowlands': 0.2 } },
  'Soviet Union': { steel: { Donbass: 0.5, Dnepropetrovsk: 0.2 }, oil: { Azerbaijan: 0.85, Kuban: 0.15 } },
  Poland: { steel: { 'Upper Silesia': 1 }, oil: { Stanisławów: 1 } },
  Sweden: { steel: { Norrbotten: 0.8 } },
  Belgium: { steel: { Wallonia: 1 } },
  Czechoslovakia: { steel: { Moravia: 0.6 } },
  Italy: { steel: { Lombardy: 0.6, Piedmont: 0.4 } },
  Spain: { steel: { 'Basque Country': 1 } },
};

/** Share a whole number out by weights (the "largest remainder" method), so the parts add up exactly. */
function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) out[order[k].i]++;
  return out;
}

const START = (() => {
  const n = PROVINCES.length;
  const civ = new Array<number>(n).fill(0);
  const mil = new Array<number>(n).fill(0);
  const population = new Array<number>(n).fill(0);
  const steel = new Array<number>(n).fill(0);
  const oil = new Array<number>(n).fill(0);
  for (const c of COUNTRIES) {
    const home = PROVINCES.filter((p) => p.owner === c.name);
    if (!home.length) continue;
    const weights = home.map((p) => WEIGHT[p.id]);
    const total = weights.reduce((a, b) => a + b, 0);
    apportion(c.industry.civ, weights).forEach((x, i) => (civ[home[i].id] = x));
    apportion(c.industry.mil, weights).forEach((x, i) => (mil[home[i].id] = x));
    home.forEach((p, i) => (population[p.id] = (c.industry.population * weights[i]) / total));
    const capital = (home.find((p) => p.capital) ?? home[0]).id;
    for (const [kind, into] of [['steel', steel], ['oil', oil]] as const) {
      let left = 1;
      for (const [name, share] of Object.entries(SITES[c.name]?.[kind] ?? {})) {
        const p = home.find((q) => q.name === name);
        if (!p) throw new Error(`No province called ${name} in ${c.name}`);
        into[p.id] += c.industry[kind] * share;
        left -= share;
      }
      into[capital] += c.industry[kind] * Math.max(0, left);
    }
  }
  return { civ, mil, population, steel, oil };
})();

/** Millions of people, steel and oil in each province. These never change during a game. */
export const POPULATION: readonly number[] = START.population;
export const STEEL: readonly number[] = START.steel;
export const OIL: readonly number[] = START.oil;

// ---------- what a country has to work with today ----------

/** What a country controls today. Factories can be fractions because occupied ones only partly work. */
export interface Tally {
  civ: number;
  mil: number;
  steel: number;
  oil: number;
  /** Millions of its own people living in home provinces it still controls. */
  population: number;
  /** Share of its home victory points held by countries it is at war with. */
  homeLost: number;
  divisions: Record<UnitType, number>;
}

type Holdings = Pick<World, 'controller' | 'factories' | 'units' | 'wars'>;

export function tallies(w: Holdings): Map<string, Tally> {
  const out = new Map<string, Tally>();
  const get = (name: string): Tally => {
    let t = out.get(name);
    if (!t) out.set(name, (t = { civ: 0, mil: 0, steel: 0, oil: 0, population: 0, homeLost: 0, divisions: { infantry: 0, armour: 0, artillery: 0 } }));
    return t;
  };
  const vpHome = new Map<string, number>();
  const vpLost = new Map<string, number>();
  for (const p of PROVINCES) {
    const holder = w.controller[p.id];
    const t = get(holder);
    const own = p.owner === holder;
    t.civ += w.factories.civ[p.id] * (own ? 1 : OCCUPIED_FACTORIES);
    t.mil += w.factories.mil[p.id] * (own ? 1 : OCCUPIED_FACTORIES);
    t.steel += STEEL[p.id] * (own ? 1 : OCCUPIED_RESOURCES);
    t.oil += OIL[p.id] * (own ? 1 : OCCUPIED_RESOURCES);
    if (own) t.population += POPULATION[p.id];
    vpHome.set(p.owner, (vpHome.get(p.owner) ?? 0) + p.victoryPoints);
    if (!own) vpLost.set(p.owner, (vpLost.get(p.owner) ?? 0) + p.victoryPoints);
  }
  for (const [name, total] of vpHome) get(name).homeLost = total ? (vpLost.get(name) ?? 0) / total : 0;
  for (const u of w.units) get(u.owner).divisions[u.type]++;
  return out;
}

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** One reason for a number, e.g. "taxes above 25%: -8". */
export interface Reason {
  text: string;
  points: number;
}

/** Everything about a country's economy that follows from its state today. Money is per month. */
export interface EconomyView {
  atWar: boolean;
  civ: number;
  mil: number;
  /** Military factories working on a line, and those standing idle. */
  milUsed: number;
  milFree: number;
  /** Civilian factories building something, and those making consumer goods. */
  building: number;
  consumer: number;
  /** Consumer-goods factories people need, and the share of that need not met (0 to 1). */
  goodsNeed: number;
  shortage: number;
  /** Everything that speeds up or slows down the factories, multiplied together. */
  outputFactor: number;
  factors: { conscription: number; stability: number; inflation: number; tax: number };
  realGDP: number;
  nominalGDP: number;
  steel: { have: number; need: number; ratio: number };
  oil: { have: number; need: number; ratio: number };
  budget: { taxes: number; exports: number; government: number; upkeep: number; military: number; construction: number; imports: number; interest: number; revenue: number; spending: number; balance: number };
  /** Debt as a share of a year's output. */
  debtRatio: number;
  /** What lenders want on new bonds: marketRate = realRate + expected inflation. */
  marketRate: number;
  realRate: number;
  rateReasons: Reason[];
  /** Bonds the public will buy this month, and how willing they are (0 to 1). */
  bondCapacity: number;
  confidence: number;
  /** Thousands of men the conscription law allows in total. */
  manpowerCap: number;
  /** Division-sets of equipment each line makes a day. */
  lineRate: Record<UnitType, number>;
  stabilityTarget: number;
  stabilityReasons: Reason[];
}

const stabilityFactor = (s: number): number => 1 - (Math.max(0, 50 - s) / 100) * 0.8;
const inflationFactor = (pi: number): number => (pi > 100 ? 0.75 : pi > 30 ? 0.9 : 1);
const taxFactor = (rate: number): number => 1 - TAX_DRAG * Math.max(0, rate - 0.3);

export function economyView(w: Holdings & Pick<World, 'economies'>, country: string, tally?: Tally): EconomyView {
  const e = w.economies[country];
  const t = tally ?? tallies(w).get(country)!;
  const atWar = enemiesOf(w, country).length > 0;
  const p = e.priceLevel / 100;

  const milUsed = Math.min(Math.floor(t.mil + 1e-9), UNIT_TYPES.reduce((a, k) => a + e.lines[k].factories, 0));
  const building = e.construction.length ? Math.min(e.constructionFactories, Math.floor(t.civ + 1e-9), e.construction.length * BUILDERS_PER_PROJECT) : 0;
  const consumer = t.civ - building;
  const law = CONSCRIPTION[e.conscription];
  // Taxes take spending money away, so people ask for fewer goods; rationing cuts what they may buy.
  const goodsNeed = GOODS_NEED * t.civ * (e.rationing ? RATIONING_NEED : 1) * clamp(1 - 0.6 * (e.taxRate - 0.2), 0.7, 1.1);
  const shortage = goodsNeed > 0 ? clamp(1 - (consumer * law.output) / goodsNeed, 0, 1) : 0;

  const factors = { conscription: law.output, stability: stabilityFactor(e.stability), inflation: inflationFactor(e.inflation), tax: taxFactor(e.taxRate) };
  const outputFactor = factors.conscription * factors.stability * factors.inflation * factors.tax;
  const realGDP = OUTPUT_PER_FACTORY * (t.civ + milUsed) * outputFactor;
  const nominalGDP = realGDP * p;

  const steelNeed = milUsed;
  const oilNeed = e.lines.armour.factories + OIL_PER_ARMOUR_DIVISION * t.divisions.armour;
  const ratio = (have: number, need: number) => (need <= 0 || e.imports ? 1 : clamp(have / need, 0, 1));
  const steel = { have: t.steel, need: steelNeed, ratio: ratio(t.steel, steelNeed) };
  const oil = { have: t.oil, need: oilNeed, ratio: ratio(t.oil, oilNeed) };
  const gap = (have: number, need: number) => Math.max(0, need - have);
  const imports = e.imports ? (gap(t.steel, steelNeed) * PRICE.steel + gap(t.oil, oilNeed) * PRICE.oil) * p : 0;
  const exports = (gap(steelNeed, t.steel) * PRICE.steel + gap(oilNeed, t.oil) * PRICE.oil) * EXPORT_SHARE * p;

  const taxes = e.taxRate * nominalGDP * (e.rationing ? 1 - BLACK_MARKET_TAX_LOSS : 1);
  const government = GOVERNMENT_SHARE * nominalGDP;
  const upkeep = UNIT_TYPES.reduce((a, k) => a + t.divisions[k] * UPKEEP[k], 0) * (atWar ? WAR_UPKEEP : 1) * p;
  const military = FACTORY_COST * milUsed * p;
  const construction = FACTORY_COST * building * p;
  const interest = (e.debt * e.debtRate) / 100 / 12;
  const revenue = taxes + exports;
  const spending = government + upkeep + military + construction + imports + interest;

  const debtRatio = nominalGDP > 0 ? e.debt / (12 * nominalGDP) : 0;
  const rateReasons: Reason[] = [{ text: 'what lenders want from a safe borrower', points: BASE_REAL_RATE }];
  if (debtRatio > 0.6) rateReasons.push({ text: `debt above 60% of a year's output`, points: 5 * (debtRatio - 0.6) });
  if (atWar) rateReasons.push({ text: 'the country is at war', points: 2 });
  if (t.homeLost > 0) rateReasons.push({ text: 'the war is going badly: home provinces lost', points: 8 * t.homeLost });
  const realRate = rateReasons.reduce((a, r) => a + r.points, 0);
  const marketRate = realRate + Math.max(0, e.expected);
  const confidence = clamp(1 - Math.max(0, debtRatio - 1.5) / 1.5, 0, 1) * clamp(1 - Math.max(0, e.inflation - 10) / 20, 0, 1) * clamp(1 - 1.5 * t.homeLost, 0, 1);
  const bondCapacity = BOND_APPETITE * nominalGDP * confidence;

  const manpowerCap = t.population * 1000 * law.share;
  const lineRate = { infantry: 0, armour: 0, artillery: 0 };
  for (const k of UNIT_TYPES) lineRate[k] = (e.lines[k].factories * e.lines[k].efficiency * outputFactor * steel.ratio * (k === 'armour' ? oil.ratio : 1)) / KIT_COST[k];

  const stabilityReasons: Reason[] = [];
  const minus = (text: string, points: number) => points > 0.05 && stabilityReasons.push({ text, points: -points });
  minus('taxes above 25% of output', TAX_STABILITY * 100 * Math.max(0, e.taxRate - 0.25));
  minus('inflation above 10% a year', Math.min(30, 0.5 * Math.max(0, e.inflation - 10)));
  minus('hyperinflation: money is losing its meaning', e.inflation > 100 ? 15 : 0);
  minus('prices are falling fast (deflation)', e.inflation < -5 ? 5 : 0);
  minus('shortages in the shops', 40 * shortage);
  minus('rationing and price controls', e.rationing ? 5 : 0);
  minus('heavy conscription', 3 * Math.max(0, e.conscription - 2));
  stabilityReasons.sort((a, b) => a.points - b.points);
  const stabilityTarget = clamp(STABILITY_BASE + stabilityReasons.reduce((a, r) => a + r.points, 0), 0, 100);

  return {
    atWar, civ: t.civ, mil: t.mil, milUsed, milFree: Math.floor(t.mil + 1e-9) - milUsed, building, consumer, goodsNeed, shortage, outputFactor, factors, realGDP, nominalGDP, steel, oil,
    budget: { taxes, exports, government, upkeep, military, construction, imports, interest, revenue, spending, balance: revenue - spending },
    debtRatio, marketRate, realRate, rateReasons, bondCapacity, confidence, manpowerCap, lineRate, stabilityTarget, stabilityReasons,
  };
}

// ---------- the start of a game ----------

const START_TAX: Record<Government, number> = { democracy: 0.22, authoritarian: 0.22, fascist: 0.22, communist: 0.25 };

const emptyEconomy = (): Economy => ({
  treasury: 0, debt: 0, debtRate: BASE_REAL_RATE + BANK_CREDIT, money: 0, priceLevel: 100, inflation: BANK_CREDIT, expected: BANK_CREDIT, taxRate: 0.22, bondShare: 1, rationing: false, imports: true,
  conscription: 1, stability: 70, manpower: 0, stock: { infantry: 0, armour: 0, artillery: 0 },
  lines: { infantry: { factories: 0, efficiency: LINE_START }, armour: { factories: 0, efficiency: LINE_START }, artillery: { factories: 0, efficiency: LINE_START } },
  constructionFactories: 0, construction: [], training: [], printedThisMonth: 0, borrowedThisMonth: 0, balanceThisMonth: 0, moneyAtMonthStart: 0,
  causes: { carry: 0.8 * BANK_CREDIT, expectations: 0, printing: 0, credit: 0.2 * BANK_CREDIT, growth: 0, shortage: 0 }, history: [],
});

/** The factories standing in each province on 1 January 1936. */
export const startFactories = (): World['factories'] => ({ civ: [...START.civ], mil: [...START.mil] });

/**
 * Every country's economy on day one. Each starts with its budget roughly balanced (the tax
 * rate is set to do that, between 15% and 35%), debt worth half a year's output, a month of
 * spending in the treasury, and its military factories split the way its army is made up.
 */
export function startEconomies(w: Holdings): Record<string, Economy> {
  const out: Record<string, Economy> = {};
  const all = tallies(w);
  for (const c of COUNTRIES) {
    const t = all.get(c.name);
    if (!t) continue;
    const e = emptyEconomy();
    e.conscription = c.name === 'United Kingdom' ? 0 : 1;
    e.taxRate = START_TAX[c.government];
    const total = c.startArmy[0] + c.startArmy[1] + c.startArmy[2];
    const mil = Math.floor(t.mil);
    const split = total ? apportion(mil, c.startArmy.map((n, i) => n * KIT_COST[UNIT_TYPES[i]])) : [mil, 0, 0];
    UNIT_TYPES.forEach((k, i) => (e.lines[k] = { factories: split[i], efficiency: 0.75 }));
    out[c.name] = e;
    const probe = { ...w, economies: out };
    let v = economyView(probe, c.name, t);
    e.debt = START_DEBT * 12 * v.nominalGDP;
    e.money = e.moneyAtMonthStart = START_MONEY * 12 * v.nominalGDP;
    // The tax rate that balances the budget, within sensible limits.
    v = economyView(probe, c.name, t);
    const needed = v.nominalGDP > 0 ? (v.budget.spending - v.budget.exports) / v.nominalGDP : e.taxRate;
    e.taxRate = clamp(Math.ceil(needed * 100) / 100, 0.15, 0.35);
    v = economyView(probe, c.name, t);
    e.treasury = v.budget.spending;
    e.manpower = Math.max(0, v.manpowerCap - total * MEN_PER_DIVISION);
    // A month of production is already in the depots.
    for (const k of UNIT_TYPES) e.stock[k] = v.lineRate[k] * 30;
    e.stability = v.stabilityTarget;
  }
  return out;
}

// ---------- orders ----------

const cloneEconomy = (e: Economy): Economy => ({
  ...e,
  stock: { ...e.stock },
  lines: { infantry: { ...e.lines.infantry }, armour: { ...e.lines.armour }, artillery: { ...e.lines.artillery } },
  construction: e.construction.map((c) => ({ ...c })),
  training: e.training.map((t) => ({ ...t })),
});

/** A copy of every economy that is safe to change. Histories are shared: they are replaced, never edited. */
export function cloneEconomies(es: Record<string, Economy>): Record<string, Economy> {
  const out: Record<string, Economy> = {};
  for (const name in es) out[name] = cloneEconomy(es[name]);
  return out;
}

export type EconomyOrder = Exclude<Order, { type: 'move' | 'halt' | 'declareWar' | 'makePeace' }>;
export const isEconomyOrder = (o: Order): o is EconomyOrder => 'country' in o;

/** Where a new division forms: the capital, or failing that the biggest home city the country still holds. */
export function musterPoint(controller: string[], country: string): number | null {
  let best: number | null = null;
  for (const p of PROVINCES) {
    if (p.owner !== country || controller[p.id] !== country) continue;
    if (p.capital) return p.id;
    if (best === null || p.victoryPoints > PROVINCES[best].victoryPoints) best = p.id;
  }
  return best;
}

/**
 * Where a newly trained division joins the army: the capital while it has room (fewer divisions
 * than half of what it can supply), otherwise the least crowded home province that has a supply
 * link. This keeps a growing army from piling up in one place.
 */
export function formUpPoint(d: Pick<World, 'controller' | 'units'>, country: string): number | null {
  const capital = musterPoint(d.controller, country);
  if (capital === null) return null;
  const count = new Map<number, number>();
  for (const u of d.units) count.set(u.at, (count.get(u.at) ?? 0) + 1);
  const crowding = (p: number) => (count.get(p) ?? 0) / supplyCapacity(p);
  if (crowding(capital) < 0.5) return capital;
  const linked = linkedProvinces(d.controller, country);
  let best = capital;
  for (const p of PROVINCES) {
    if (p.owner !== country || d.controller[p.id] !== country || !linked[p.id]) continue;
    const better = crowding(p.id) - crowding(best);
    if (better < -1e-9 || (Math.abs(better) <= 1e-9 && p.victoryPoints > PROVINCES[best].victoryPoints)) best = p.id;
  }
  return best;
}

/** Why a division of this type cannot be raised right now, or null if it can. */
export function cannotRaise(e: Economy, type: UnitType): string | null {
  if (e.stock[type] < 1) return 'no finished equipment yet';
  if (e.manpower < MEN_PER_DIVISION) return 'not enough manpower';
  return null;
}

/** Carry out one economic order on an economy that is being changed. Orders that make no sense are ignored. */
export function giveEconomyOrder(d: Pick<World, 'economies' | 'controller' | 'factories' | 'units' | 'wars'>, capitulated: string[], o: EconomyOrder): void {
  const e = d.economies[o.country];
  if (!e || capitulated.includes(o.country)) return;
  switch (o.type) {
    case 'setTax':
      if (Number.isFinite(o.rate)) e.taxRate = clamp(Math.round(o.rate * 100) / 100, TAX_MIN, TAX_MAX);
      break;
    case 'setBondShare':
      if (Number.isFinite(o.share)) e.bondShare = clamp(o.share, 0, 1);
      break;
    case 'setRationing':
      e.rationing = !!o.on;
      break;
    case 'setImports':
      e.imports = !!o.on;
      break;
    case 'setConscription': {
      const level = clamp(Math.round(o.level), 0, CONSCRIPTION.length - 1);
      if (level === e.conscription || !Number.isFinite(o.level)) break;
      const people = tallies(d).get(o.country)?.population ?? 0;
      // A wider law calls up more men at once; a narrower one sends home those not yet in a division.
      e.manpower = Math.max(0, e.manpower + (CONSCRIPTION[level].share - CONSCRIPTION[e.conscription].share) * people * 1000);
      if (level > e.conscription) e.stability = Math.max(0, e.stability - 2 * (level - e.conscription));
      e.conscription = level;
      break;
    }
    case 'setLine': {
      if (!UNIT_TYPES.includes(o.unit) || !Number.isFinite(o.factories)) break;
      const line = e.lines[o.unit];
      const mil = Math.floor((tallies(d).get(o.country)?.mil ?? 0) + 1e-9);
      const others = UNIT_TYPES.reduce((a, k) => a + (k === o.unit ? 0 : e.lines[k].factories), 0);
      const n = clamp(Math.round(o.factories), 0, Math.max(0, mil - others));
      // Factories added to a line start at half speed, which pulls the line's average down.
      if (n > line.factories) line.efficiency = (line.efficiency * line.factories + LINE_START * (n - line.factories)) / n;
      if (n === 0) line.efficiency = LINE_START;
      line.factories = n;
      break;
    }
    case 'setConstruction':
      if (Number.isFinite(o.factories)) e.constructionFactories = clamp(Math.round(o.factories), 0, Math.floor((tallies(d).get(o.country)?.civ ?? 0) + 1e-9));
      break;
    case 'build': {
      const p = PROVINCES[o.province];
      if (!p || (o.kind !== 'civ' && o.kind !== 'mil') || e.construction.length >= 12) break;
      // Only in your own home provinces that you still hold.
      if (p.owner !== o.country || d.controller[p.id] !== o.country) break;
      e.construction.push({ kind: o.kind, province: p.id, done: 0 });
      break;
    }
    case 'cancelBuild':
      if (Number.isInteger(o.index) && o.index >= 0 && o.index < e.construction.length) e.construction.splice(o.index, 1);
      break;
    case 'raise':
      if (!UNIT_TYPES.includes(o.unit) || cannotRaise(e, o.unit)) break;
      e.stock[o.unit] -= 1;
      e.manpower -= MEN_PER_DIVISION;
      e.training.push({ type: o.unit, daysLeft: TRAINING_DAYS[o.unit] });
      break;
  }
}

// ---------- one day ----------

/** The parts of the world the economy changes during a day. */
export interface EconomyDraft {
  day: number;
  startDate: string;
  units: Unit[];
  nextUnitId: number;
  controller: string[];
  wars: string[];
  economies: Record<string, Economy>;
  factories: World['factories'];
}

/** Is the day after `day` the first of a month? */
export function monthEnds(startDate: string, day: number): boolean {
  const d = new Date(`${startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day + 1);
  return d.getUTCDate() === 1;
}

/**
 * One day of every economy: collect taxes, pay the bills and cover any shortfall; run the
 * production lines; build; train. New divisions join `d.units`. Returns each country's oil
 * ratio, which step() uses to hold back armoured divisions that have no fuel.
 */
export function runEconomies(d: EconomyDraft, capitulated: string[]): Map<string, number> {
  const all = tallies(d);
  const oil = new Map<string, number>();
  for (const name in d.economies) {
    if (capitulated.includes(name)) continue;
    const e = d.economies[name];
    const t = all.get(name);
    if (!t) continue;

    // Lost factories: lines shrink to what is left, the biggest line first.
    const mil = Math.floor(t.mil + 1e-9);
    for (let used = UNIT_TYPES.reduce((a, k) => a + e.lines[k].factories, 0); used > mil; used--) {
      const big = UNIT_TYPES.reduce((a, k) => (e.lines[k].factories > e.lines[a].factories ? k : a));
      e.lines[big].factories--;
    }
    e.constructionFactories = Math.min(e.constructionFactories, Math.floor(t.civ + 1e-9));

    const v = economyView(d, name, t);
    oil.set(name, v.oil.ratio);

    // Money. A shortfall is covered first from the treasury, then by bonds, then by the printing press.
    const net = v.budget.balance / 30;
    e.balanceThisMonth += net;
    e.treasury += net;
    if (e.treasury < 0) {
      const short = -e.treasury;
      e.treasury = 0;
      // Bonds nobody wants to buy end up at the central bank, which pays for them with new money.
      const borrowed = Math.min(short * e.bondShare, Math.max(0, v.bondCapacity - e.borrowedThisMonth));
      const printed = short - borrowed;
      if (borrowed > 0) {
        e.debtRate = (e.debt * e.debtRate + borrowed * v.marketRate) / (e.debt + borrowed);
        e.debt += borrowed;
        e.borrowedThisMonth += borrowed;
      }
      e.money += printed;
      e.printedThisMonth += printed;
    } else if (e.debt > 0 && e.treasury > v.budget.spending) {
      // More than a month of spending in hand: pay off debt with the rest.
      const repay = Math.min(e.debt, e.treasury - v.budget.spending);
      e.debt -= repay;
      e.treasury -= repay;
    }

    // Production lines.
    for (const k of UNIT_TYPES) {
      const line = e.lines[k];
      if (!line.factories) continue;
      e.stock[k] += v.lineRate[k];
      line.efficiency = Math.min(1, line.efficiency + LINE_GAIN);
    }

    // Construction, first project first. A project in a province you have lost waits.
    let builders = v.building;
    for (let i = 0; i < e.construction.length && builders > 0; i++) {
      const job = e.construction[i];
      if (d.controller[job.province] !== name) continue;
      const crew = Math.min(BUILDERS_PER_PROJECT, builders);
      builders -= crew;
      job.done += crew * v.outputFactor;
      if (job.done >= BUILD_COST[job.kind]) {
        d.factories[job.kind][job.province]++;
        e.construction.splice(i--, 1);
      }
    }

    // Training. A finished division forms up at the capital, or nearby if the capital is full.
    for (let i = 0; i < e.training.length; i++) {
      const job = e.training[i];
      if (job.daysLeft > 0) job.daysLeft--;
      if (job.daysLeft > 0) continue;
      const at = formUpPoint(d, name);
      if (at === null) continue; // nowhere to form up: it waits
      d.units.push({ id: d.nextUnitId++, owner: name, type: job.type, at, strength: 100, organisation: NEW_DIVISION_ORGANISATION, path: [], progress: 0, dugIn: 0, supply: 1 });
      e.training.splice(i--, 1);
    }

    if (monthEnds(d.startDate, d.day)) closeMonth(d, name, e, economyView(d, name, tallies(d).get(name)));
  }
  return oil;
}

/**
 * The end of a month: work out inflation, move stability, and write the month into the history.
 *
 *   inflation = 0.8 x last month's inflation
 *             + 0.1 x (expected inflation - last month's), if people expect more
 *             + 0.2 x (money growth - economy growth)
 *             + shortages
 */
function closeMonth(d: EconomyDraft, name: string, e: Economy, v: EconomyView): void {
  const last = e.inflation;
  // Growth of real output over the past twelve months (or since the start of the game), in per cent.
  const then = e.history.length >= 12 ? e.history[e.history.length - 12] : e.history[0];
  const growth = then && then.realGDP > 0 ? clamp((v.realGDP / then.realGDP - 1) * 100, -20, 20) : 0;
  // Once people expect fast inflation they spend money as soon as they get it, which makes it worse.
  const velocity = 1 + Math.max(0, e.expected - 20) / 100;
  const controls = e.rationing ? 0.75 : 1;
  const printedPct = e.moneyAtMonthStart > 0 ? (e.printedThisMonth / e.moneyAtMonthStart) * 1200 : 0;
  const causes: InflationCauses = {
    carry: 0.8 * last,
    expectations: 0.1 * Math.max(0, e.expected - last),
    printing: 0.2 * printedPct * velocity * controls,
    credit: 0.2 * BANK_CREDIT,
    // In a growing economy the banks lend enough to match, so only a shrinking one moves prices.
    growth: 0 - 0.2 * Math.min(0, growth),
    shortage: SHORTAGE_PUSH * v.shortage * (e.rationing ? 0.5 : 1),
  };
  let inflation = causes.carry + causes.expectations + causes.printing + causes.credit + causes.growth + causes.shortage;
  inflation = clamp(inflation, -20, 5000);
  e.causes = causes;
  e.inflation = inflation;
  e.expected = 0.85 * e.expected + 0.15 * inflation;
  e.priceLevel *= 1 + inflation / 1200;
  // The banks lend a little more each year as well.
  e.money *= 1 + (BANK_CREDIT + Math.max(0, growth)) / 1200;
  // Old bonds are repaid and replaced at today's rate, about one sixtieth of the debt a month.
  e.debtRate += (v.marketRate - e.debtRate) / 60;
  e.stability = clamp(e.stability + 0.2 * (v.stabilityTarget - e.stability), 0, 100);
  // Young men come of age: 2% of the law's total a year.
  e.manpower += (v.manpowerCap * 0.02) / 12;

  const record: MonthRecord = {
    day: d.day + 1, inflation, priceLevel: e.priceLevel, debtRatio: v.debtRatio, treasury: e.treasury, balance: e.balanceThisMonth, stability: e.stability,
    printed: e.printedThisMonth, borrowed: e.borrowedThisMonth, realGDP: v.realGDP, shortage: v.shortage,
  };
  e.history = [...e.history, record].slice(-120);
  e.printedThisMonth = 0;
  e.borrowedThisMonth = 0;
  e.balanceThisMonth = 0;
  e.moneyAtMonthStart = e.money;
}

/**
 * Bring a resting division back up to strength. Each point of strength needs equipment from
 * the stock for its type and men from the manpower pool. Returns the strength gained.
 */
export function reinforce(e: Economy | undefined, u: Unit, share: number): number {
  if (!e || u.strength >= 100 || share <= 0) return 0;
  const want = Math.min(100 - u.strength, REINFORCE_PER_DAY * share);
  const gain = Math.max(0, Math.min(want, e.stock[u.type] * 100, (e.manpower / MEN_PER_DIVISION) * 100));
  e.stock[u.type] -= gain / 100;
  e.manpower -= (gain / 100) * MEN_PER_DIVISION;
  return gain;
}

/** The real interest rate on new bonds once inflation is taken off: r = i - pi. */
export const realReturn = (v: EconomyView, e: Economy): number => v.marketRate - e.inflation;

export const governmentOf = (country: string): Government => countryByName(country).government;
