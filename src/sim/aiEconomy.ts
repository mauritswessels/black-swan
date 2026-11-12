/**
 * A simple finance minister for AI countries.
 *
 * Every day it forms new divisions from finished equipment. On the first of each month it
 * also reviews taxes, rationing, conscription, the production lines and construction. It
 * follows a few plain rules and looks only at its own country's books. Stage F replaces it
 * with a fuller AI.
 *
 * How hard a country arms in peacetime depends on its government: the dictatorships of the
 * 1930s accepted large deficits to rearm, the democracies did not until war was close.
 */
import { countryByName } from './countries';
import { cannotRaise, CONSCRIPTION, economyView, MEN_PER_DIVISION, monthEnds, musterPoint, tallies, TAX_MIN, UNIT_TYPES, UPKEEP, WAR_UPKEEP, type Tally } from './economy';
import type { Government, Order, UnitType, World } from './types';

/** The deficit a government accepts in peacetime, as a share of output. */
const PEACE_DEFICIT: Record<Government, number> = { democracy: 0.02, authoritarian: 0.03, fascist: 0.1, communist: 0.08 };
const WAR_DEFICIT = 0.1;
/** At war it keeps forming divisions until the deficit reaches this share of output. */
const WAR_ARMY_DEFICIT = 0.2;
const PEACE_TAX_MAX = 0.35;
const WAR_TAX_MAX = 0.45;
/** The mix of military factories it aims for: mostly infantry, some guns, some tanks. */
const LINE_MIX: Record<UnitType, number> = { infantry: 0.6, armour: 0.2, artillery: 0.2 };

export function aiEconomyOrders(w: World, country: string, tally?: Tally): Order[] {
  const e = w.economies[country];
  if (!e || w.capitulated.includes(country)) return [];
  const t = tally ?? tallies(w).get(country);
  if (!t) return [];
  const v = economyView(w, country, t);
  const government = countryByName(country).government;
  const orders: Order[] = [];
  const limit = (v.atWar ? WAR_DEFICIT : PEACE_DEFICIT[government]) * v.nominalGDP;

  // New divisions, as long as there are men for them and money to keep them.
  const armyLimit = (v.atWar ? WAR_ARMY_DEFICIT : PEACE_DEFICIT[government]) * v.nominalGDP;
  let manpower = e.manpower;
  let balance = v.budget.balance;
  for (const k of UNIT_TYPES) {
    for (let stock = e.stock[k]; stock >= 1 && manpower >= MEN_PER_DIVISION && !cannotRaise(e, k); stock--) {
      const upkeep = UPKEEP[k] * (v.atWar ? WAR_UPKEEP : 1) * (e.priceLevel / 100);
      if (balance - upkeep < -armyLimit) break;
      orders.push({ type: 'raise', country, unit: k });
      manpower -= MEN_PER_DIVISION;
      balance -= upkeep;
    }
  }

  if (!monthEnds(w.startDate, w.day - 1)) return orders; // the rest only on the first of the month

  // Taxes: up when the deficit is over the limit, down when there is a surplus.
  const max = v.atWar ? WAR_TAX_MAX : PEACE_TAX_MAX;
  if (v.budget.balance < -limit && e.taxRate < max) orders.push({ type: 'setTax', country, rate: Math.min(max, e.taxRate + 0.02) });
  else if (v.budget.balance > 0.01 * v.nominalGDP && e.taxRate > Math.max(TAX_MIN, 0.15)) orders.push({ type: 'setTax', country, rate: e.taxRate - 0.01 });

  // Rationing when the shops are emptying or prices are running away; lifted once things are calm.
  if (!e.rationing && (v.shortage > 0.1 || (v.atWar && e.inflation > 15))) orders.push({ type: 'setRationing', country, on: true });
  else if (e.rationing && !v.atWar && v.shortage === 0 && e.inflation < 5) orders.push({ type: 'setRationing', country, on: false });

  // Call up more men when the pool runs dry in wartime.
  if (v.atWar && e.manpower < 3 * MEN_PER_DIVISION && e.conscription < CONSCRIPTION.length - 2) orders.push({ type: 'setConscription', country, level: e.conscription + 1 });

  // Put idle military factories to work on whichever line is furthest below the mix.
  if (v.milFree > 0) {
    const total = v.milUsed + v.milFree;
    const lines = { infantry: e.lines.infantry.factories, armour: e.lines.armour.factories, artillery: e.lines.artillery.factories };
    for (let n = v.milFree; n > 0; n--) {
      const k = UNIT_TYPES.reduce((a, b) => (lines[b] - LINE_MIX[b] * total < lines[a] - LINE_MIX[a] * total ? b : a));
      lines[k]++;
    }
    for (const k of UNIT_TYPES) if (lines[k] !== e.lines[k].factories) orders.push({ type: 'setLine', country, unit: k, factories: lines[k] });
  }

  // Construction: arms factories for countries arming or fighting, civilian ones otherwise.
  const arming = v.atWar || government === 'fascist' || government === 'communist';
  const builders = Math.max(v.civ >= 2 ? 1 : 0, Math.round((arming ? 0.25 : 0.15) * v.civ));
  if (builders !== e.constructionFactories) orders.push({ type: 'setConstruction', country, factories: builders });
  if (!e.construction.length && builders > 0 && v.budget.balance > -limit) {
    const at = musterPoint(w.controller, country);
    if (at !== null) orders.push({ type: 'build', country, kind: arming ? 'mil' : 'civ', province: at });
  }
  return orders;
}

/** The economic orders of every country the AI leads today. */
export function allAiEconomyOrders(w: World): Order[] {
  const all = tallies(w);
  const out: Order[] = [];
  for (const name in w.economies) if (name !== w.player) out.push(...aiEconomyOrders(w, name, all.get(name)));
  return out;
}
