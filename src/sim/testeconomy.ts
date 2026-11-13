/**
 * Finance playtests: one country on a war footing for several years, its army and factories
 * run by the AI finance minister but its money run by a fixed policy. Used by `npm run balance`
 * and by the tests to check that each way of paying for a war has its own price.
 *
 * A far-away country declares war on it and nobody marches, so the only thing that differs
 * between runs is the finance policy.
 */
import { aiEconomyOrders } from './aiEconomy';
import { economyView } from './economy';
import type { Order, World } from './types';
import { applyOrders, newWorld, step } from './world';

export interface Policy {
  name: string;
  /** One line on what the policy is. */
  what: string;
  taxRate: number;
  bondShare: number;
  rationing: boolean;
}

export const POLICIES: Policy[] = [
  { name: 'Tax', what: 'Taxes at 45%, bonds for the rest', taxRate: 0.45, bondShare: 1, rationing: false },
  { name: 'Borrow', what: 'Taxes left at 25%, bonds for the rest', taxRate: 0.25, bondShare: 1, rationing: false },
  { name: 'Print', what: 'Taxes left at 25%, everything else printed', taxRate: 0.25, bondShare: 0, rationing: false },
  { name: 'Mixed', what: 'Taxes at 35%, bonds for the rest, rationing', taxRate: 0.35, bondShare: 1, rationing: true },
];

export interface FinanceResult {
  divisions: number;
  militaryFactories: number;
  peakInflation: number;
  /** Prices at the end, January 1936 = 100. */
  prices: number;
  /** Debt at the end as a share of a year's output. */
  debtRatio: number;
  lowestStability: number;
  /** Factory speed at the end, 1 = full. */
  output: number;
  /** Share of all shortfalls that ended up printed. */
  printedShare: number;
  world: World;
}

const FAR_AWAY = (country: string) => (country === 'Ireland' || country === 'United Kingdom' ? 'Bulgaria' : 'Ireland');

export function runFinance(country: string, policy: Policy, years = 4, seed = 'finance'): FinanceResult {
  let w = applyOrders(newWorld('freeForAll', seed), [
    // The far-away country declares, so this is a war the public supports: the runs compare
    // ways of paying for a war, not what an unpopular war does to the home front.
    { type: 'declareWar', by: FAR_AWAY(country), on: country },
    { type: 'setTax', country, rate: policy.taxRate },
    { type: 'setBondShare', country, share: policy.bondShare },
    { type: 'setRationing', country, on: policy.rationing },
    { type: 'setConscription', country, level: 2 },
  ]);
  let peak = -Infinity;
  let low = Infinity;
  for (let d = 0; d < 365 * years; d++) {
    // The AI raises divisions and builds factories; the money policy stays as set.
    const orders: Order[] = aiEconomyOrders(w, country).filter((o) => o.type !== 'setTax' && o.type !== 'setRationing' && o.type !== 'setConscription');
    w = step(w, orders);
    peak = Math.max(peak, w.economies[country].inflation);
    low = Math.min(low, w.economies[country].stability);
  }
  const e = w.economies[country];
  const v = economyView(w, country);
  const printed = e.history.reduce((a, r) => a + r.printed, 0);
  const borrowed = e.history.reduce((a, r) => a + r.borrowed, 0);
  return {
    divisions: w.units.filter((u) => u.owner === country).length,
    militaryFactories: Math.floor(v.mil + 1e-9),
    peakInflation: peak,
    prices: e.priceLevel,
    debtRatio: v.debtRatio,
    lowestStability: low,
    output: v.outputFactor,
    printedShare: printed + borrowed > 0 ? printed / (printed + borrowed) : 0,
    world: w,
  };
}
