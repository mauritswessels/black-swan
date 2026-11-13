import { describe, expect, it } from 'vitest';
import { aiOrders } from '../src/sim/ai';
import { COUNTRIES } from '../src/sim/countries';
import { BUILD_COST, CONSCRIPTION, economyView, KIT_COST, LINE_START, MEN_PER_DIVISION, NEW_DIVISION_ORGANISATION, tallies, TRAINING_DAYS, WAR_UPKEEP } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { POLICIES, runFinance } from '../src/sim/testeconomy';
import type { Order, World } from '../src/sim/types';
import { applyOrders, newWorld, step } from '../src/sim/world';

const france = (seed = 'stage-d') => newWorld('freeForAll', seed, '1936-01-01', 'France');
const give = (w: World, ...orders: Order[]): World => applyOrders(w, orders);
const days = (w: World, n: number, orders: Order[] = []): World => {
  for (let d = 0; d < n; d++) w = step(w, d === 0 ? orders : []);
  return w;
};
/** France at war with a country it cannot reach, so the war costs money but nobody fights. */
const atWar = (w: World) => give(w, { type: 'declareWar', by: 'France', on: 'Ireland' });
const paris = provinceByName('Paris').id;

describe('the start of a game', () => {
  const w = france();

  it('gives every country the factories listed for it, spread over its home provinces', () => {
    for (const c of COUNTRIES) {
      const home = PROVINCES.filter((p) => p.owner === c.name);
      expect(home.reduce((a, p) => a + w.factories.civ[p.id], 0), c.name).toBe(c.industry.civ);
      expect(home.reduce((a, p) => a + w.factories.mil[p.id], 0), c.name).toBe(c.industry.mil);
    }
    // The capital and the industrial regions hold most of it.
    expect(w.factories.civ[paris]).toBeGreaterThan(w.factories.civ[provinceByName('Corsica').id]);
    expect(w.factories.civ[provinceByName('Rhineland').id]).toBeGreaterThan(w.factories.civ[provinceByName('Pomerania').id]);
  });

  it('starts every country with a budget close to balance and steady 2% inflation', () => {
    for (const c of COUNTRIES) {
      const v = economyView(w, c.name);
      const e = w.economies[c.name];
      expect(Math.abs(v.budget.balance) / v.nominalGDP, c.name).toBeLessThan(0.2);
      if (c.major) expect(Math.abs(v.budget.balance) / v.nominalGDP, c.name).toBeLessThan(0.02);
      expect(e.inflation).toBe(2);
      expect(e.taxRate).toBeGreaterThanOrEqual(0.15);
      expect(e.taxRate).toBeLessThanOrEqual(0.35);
      expect(e.manpower).toBeGreaterThanOrEqual(0);
    }
  });

  it('survives a save: the whole world, economies included, is plain JSON', () => {
    const later = days(atWar(w), 70);
    expect(JSON.parse(JSON.stringify(later))).toEqual(later);
    expect(later.economies.France.history.length).toBe(2);
  });

  it('plays the same economy twice from the same seed', () => {
    const play = () => {
      let x = give(france('twice'), { type: 'declareWar', by: 'France', on: 'Germany' });
      for (let d = 0; d < 200 && !x.capitulated.length; d++) x = advance(x, aiOrders(x, 'France'));
      return x;
    };
    expect(play()).toEqual(play());
  });
});

describe('the budget', () => {
  it('adds up: balance = taxes + exports - everything spent', () => {
    const v = economyView(france(), 'France');
    const b = v.budget;
    expect(b.balance).toBeCloseTo(b.taxes + b.exports - b.government - b.upkeep - b.military - b.construction - b.imports - b.interest, 9);
    expect(b.taxes).toBeCloseTo(0.25 * v.nominalGDP, 9);
  });

  it('makes war expensive: army upkeep triples the day war is declared', () => {
    const w = france();
    const peace = economyView(w, 'France').budget;
    const war = economyView(atWar(w), 'France').budget;
    expect(war.upkeep).toBeCloseTo(peace.upkeep * WAR_UPKEEP, 9);
    expect(war.balance).toBeLessThan(0);
  });

  it('pays a shortfall from the treasury first, then with bonds, and never lets the treasury go negative', () => {
    let w = atWar(france());
    const debt = w.economies.France.debt;
    w = days(w, 120);
    const e = w.economies.France;
    expect(e.treasury).toBe(0);
    expect(e.debt).toBeGreaterThan(debt);
    expect(e.history.every((m) => m.printed === 0)).toBe(true); // lenders took it all
    expect(e.inflation).toBeCloseTo(2, 5);
  });

  it('uses a surplus to pay off debt once the treasury holds a month of spending', () => {
    let w = give(france(), { type: 'setTax', country: 'France', rate: 0.4 });
    const debt = w.economies.France.debt;
    w = days(w, 90);
    expect(w.economies.France.debt).toBeLessThan(debt);
    expect(w.economies.France.treasury).toBeCloseTo(economyView(w, 'France').budget.spending, 0);
  });
});

describe('taxes, bonds and printed money each have a price', () => {
  it('taxes: more money now, but lower stability and, above 30%, slower factories', () => {
    const w = france();
    const low = economyView(w, 'France');
    const high = economyView(give(w, { type: 'setTax', country: 'France', rate: 0.45 }), 'France');
    expect(high.budget.taxes).toBeGreaterThan(low.budget.taxes * 1.5);
    expect(high.stabilityTarget).toBeCloseTo(low.stabilityTarget - 24, 5); // 1.2 for each point above 25%
    expect(high.outputFactor).toBeCloseTo(1 - 0.5 * 0.15, 9);
    expect(high.goodsNeed).toBeLessThan(low.goodsNeed); // people have less to spend
    // The rate is kept between 10% and 60%.
    expect(give(w, { type: 'setTax', country: 'France', rate: 0.99 }).economies.France.taxRate).toBe(0.6);
  });

  it('bonds: no inflation, but debt and interest grow, and lenders ask more as debt rises', () => {
    const w = days(atWar(france()), 365 * 3);
    const e = w.economies.France;
    const v = economyView(w, 'France');
    const start = economyView(france(), 'France');
    expect(e.inflation).toBeLessThan(3);
    expect(v.debtRatio).toBeGreaterThan(start.debtRatio + 0.15);
    expect(v.budget.interest).toBeGreaterThan(start.budget.interest * 1.5);
    expect(v.marketRate).toBeGreaterThan(start.marketRate);
    // The Fisher equation: i = r + expected inflation.
    expect(v.marketRate).toBeCloseTo(v.realRate + e.expected, 9);
  });

  it('printing: no debt, but inflation follows a few months later and eats stability', () => {
    let w = give(atWar(france()), { type: 'setBondShare', country: 'France', share: 0 });
    const debt = w.economies.France.debt;
    w = days(w, 150); // the treasury lasts about three months, then the presses start
    const early = w.economies.France.inflation;
    w = days(w, 365 * 2);
    const e = w.economies.France;
    expect(e.debt).toBeLessThanOrEqual(debt);
    expect(early).toBeGreaterThan(2);
    expect(early).toBeLessThan(8); // the delay
    expect(e.inflation).toBeGreaterThan(12);
    expect(e.priceLevel).toBeGreaterThan(120);
    expect(e.causes.printing).toBeGreaterThan(e.causes.credit);
    expect(economyView(w, 'France').stabilityTarget).toBeLessThan(75);
    // Lenders now want paying for the inflation they expect.
    expect(economyView(w, 'France').marketRate).toBeGreaterThan(12);
  });

  it('inflation is 0.8 x last month + 0.2 x (money growth - economy growth) + shortages', () => {
    let w = give(atWar(france()), { type: 'setBondShare', country: 'France', share: 0 });
    w = days(w, 100);
    const before = w.economies.France;
    while (w.economies.France.history.length === before.history.length) w = step(w);
    const e = w.economies.France;
    const c = e.causes;
    expect(c.carry).toBeCloseTo(0.8 * before.inflation, 9);
    expect(e.inflation).toBeCloseTo(c.carry + c.expectations + c.printing + c.credit + c.growth + c.shortage, 9);
    const month = e.history[e.history.length - 1];
    expect(c.printing).toBeCloseTo(0.2 * (month.printed / before.moneyAtMonthStart) * 1200, 6);
  });

  it('bonds that nobody will buy are printed instead', () => {
    let w = atWar(france());
    w = { ...w, economies: { ...w.economies, France: { ...w.economies.France, inflation: 40, expected: 40, treasury: 0 } } };
    expect(economyView(w, 'France').bondCapacity).toBe(0);
    w = step(w);
    expect(w.economies.France.printedThisMonth).toBeGreaterThan(0);
    expect(w.economies.France.borrowedThisMonth).toBe(0);
  });

  it('gives each finance policy its own price over four years of war (bot playtest)', () => {
    const [tax, borrow, print, mixed] = POLICIES.map((p) => runFinance('France', p, 4));
    // Taxing pays for the biggest army but costs the most stability.
    expect(tax.divisions).toBeGreaterThan(borrow.divisions);
    expect(tax.lowestStability).toBeLessThan(borrow.lowestStability);
    // Borrowing leaves the biggest debt.
    expect(borrow.debtRatio).toBeGreaterThan(tax.debtRatio);
    expect(borrow.debtRatio).toBeGreaterThan(1);
    // Printing wrecks prices, and inflation melts the debt.
    expect(print.peakInflation).toBeGreaterThan(40);
    expect(print.prices).toBeGreaterThan(borrow.prices * 2);
    expect(print.debtRatio).toBeLessThan(0.3);
    expect(print.lowestStability).toBeLessThan(borrow.lowestStability);
    // A mix avoids the worst of each.
    expect(mixed.peakInflation).toBeLessThan(15);
    expect(mixed.lowestStability).toBeGreaterThan(tax.lowestStability);
    expect(mixed.divisions).toBeGreaterThan(borrow.divisions);
  });
});

describe('guns or butter', () => {
  it('causes shortages when too many civilian factories stop making goods, and rationing eases them', () => {
    const w = france();
    const build = (n: number): Order[] => [{ type: 'setConstruction', country: 'France', factories: n }, ...Array.from({ length: 4 }, (): Order => ({ type: 'build', country: 'France', kind: 'mil', province: paris }))];
    expect(economyView(give(w, ...build(5)), 'France').shortage).toBe(0);
    const heavy = give(w, ...build(14));
    const v = economyView(heavy, 'France');
    expect(v.building).toBe(14);
    expect(v.shortage).toBeGreaterThan(0.3);
    expect(v.stabilityTarget).toBeLessThan(70);
    const rationed = economyView(give(heavy, { type: 'setRationing', country: 'France', on: true }), 'France');
    expect(rationed.shortage).toBeLessThan(v.shortage);
    expect(rationed.budget.taxes).toBeLessThan(v.budget.taxes); // the black market pays no tax
    // Shortages show up in prices.
    const later = days(heavy, 65);
    expect(later.economies.France.inflation).toBeGreaterThan(5);
    expect(later.economies.France.causes.shortage).toBeGreaterThan(0);
  });

  it('factories set aside for building only leave the shops while there is something to build', () => {
    const w = give(france(), { type: 'setConstruction', country: 'France', factories: 10 });
    expect(economyView(w, 'France').building).toBe(0);
    expect(economyView(w, 'France').budget.construction).toBe(0);
  });

  it('builds a military factory in 72 days with five builders', () => {
    let w = give(france(), { type: 'setConstruction', country: 'France', factories: 5 }, { type: 'build', country: 'France', kind: 'mil', province: paris });
    const before = w.factories.mil[paris];
    w = days(w, BUILD_COST.mil / 5 - 1);
    expect(w.factories.mil[paris]).toBe(before);
    w = step(w);
    expect(w.factories.mil[paris]).toBe(before + 1);
    expect(w.economies.France.construction).toEqual([]);
    expect(economyView(w, 'France').milFree).toBe(1); // it waits for a line
  });

  it('only lets you build in home provinces you hold, and lets you cancel', () => {
    const w = france();
    const berlin = provinceByName('Berlin').id;
    expect(give(w, { type: 'build', country: 'France', kind: 'civ', province: berlin }).economies.France.construction).toEqual([]);
    const queued = give(w, { type: 'build', country: 'France', kind: 'civ', province: paris });
    expect(queued.economies.France.construction.length).toBe(1);
    expect(give(queued, { type: 'cancelBuild', country: 'France', index: 0 }).economies.France.construction).toEqual([]);
  });
});

describe('production lines and new divisions', () => {
  it('turns factory-days into equipment at the line’s speed', () => {
    const w = france();
    const line = w.economies.France.lines.infantry;
    const rate = economyView(w, 'France').lineRate.infantry;
    expect(rate).toBeCloseTo((line.factories * line.efficiency) / KIT_COST.infantry, 9);
    const next = step(w);
    expect(next.economies.France.stock.infantry).toBeCloseTo(w.economies.France.stock.infantry + rate, 9);
    expect(next.economies.France.lines.infantry.efficiency).toBeGreaterThan(line.efficiency);
  });

  it('slows a line down when factories are added to it, and resets one that is emptied', () => {
    const w = france();
    const { infantry, armour } = w.economies.France.lines;
    const moved = give(w, { type: 'setLine', country: 'France', unit: 'infantry', factories: infantry.factories - 2 }, { type: 'setLine', country: 'France', unit: 'armour', factories: armour.factories + 2 });
    const line = moved.economies.France.lines.armour;
    expect(line.factories).toBe(armour.factories + 2);
    expect(line.efficiency).toBeCloseTo((armour.efficiency * armour.factories + LINE_START * 2) / (armour.factories + 2), 9);
    expect(moved.economies.France.lines.infantry.efficiency).toBe(infantry.efficiency); // taking factories away costs nothing
    // You cannot use more factories than you have.
    expect(give(w, { type: 'setLine', country: 'France', unit: 'armour', factories: 99 }).economies.France.lines.armour.factories).toBe(armour.factories);
    expect(give(w, { type: 'setLine', country: 'France', unit: 'armour', factories: 0 }).economies.France.lines.armour.efficiency).toBe(LINE_START);
  });

  it('raises a division from one set of equipment and 15,000 men, after training', () => {
    let w = france();
    expect(give(w, { type: 'raise', country: 'France', unit: 'infantry' }).economies.France.training).toEqual([]); // not enough equipment yet
    w = days(w, 10);
    const e = w.economies.France;
    expect(e.stock.infantry).toBeGreaterThanOrEqual(1);
    const army = w.units.filter((u) => u.owner === 'France').length;
    w = give(w, { type: 'raise', country: 'France', unit: 'infantry' });
    expect(w.economies.France.stock.infantry).toBeCloseTo(e.stock.infantry - 1, 9);
    expect(w.economies.France.manpower).toBeCloseTo(e.manpower - MEN_PER_DIVISION, 9);
    w = days(w, TRAINING_DAYS.infantry - 1);
    expect(w.units.filter((u) => u.owner === 'France').length).toBe(army);
    w = step(w);
    const mine = w.units.filter((u) => u.owner === 'France');
    expect(mine.length).toBe(army + 1);
    const fresh = mine[mine.length - 1];
    expect(fresh.type).toBe('infantry');
    expect(fresh.organisation).toBeGreaterThanOrEqual(NEW_DIVISION_ORGANISATION);
    expect(PROVINCES[fresh.at].owner).toBe('France');
    expect(new Set(w.units.map((u) => u.id)).size).toBe(w.units.length); // ids stay unique
    expect(w.economies.France.training).toEqual([]);
  });

  it('refills a damaged division from the equipment store and the manpower pool, and not without them', () => {
    const w = france();
    const hurt = (x: World): World => ({ ...x, units: x.units.map((u, i) => (i === x.units.findIndex((k) => k.owner === 'France' && k.type === 'infantry') ? { ...u, strength: 50 } : u)) });
    const id = hurt(w).units.find((u) => u.strength === 50)!.id;
    const a = step(hurt(w));
    expect(a.units.find((u) => u.id === id)!.strength).toBeCloseTo(50.5, 9);
    expect(a.economies.France.manpower).toBeCloseTo(w.economies.France.manpower - 0.005 * MEN_PER_DIVISION, 6);
    const empty = hurt(w);
    empty.economies = { ...empty.economies, France: { ...empty.economies.France, manpower: 0 } };
    expect(step(empty).units.find((u) => u.id === id)!.strength).toBe(50);
  });
});

describe('manpower', () => {
  it('a wider conscription law calls up more men, slows the factories and costs stability', () => {
    // Mass mobilisation needs the public behind it (Stage E), so this France has the war support for it.
    const calm = france();
    const w = { ...calm, economies: { ...calm.economies, France: { ...calm.economies.France, warSupport: 60 } } };
    const e = w.economies.France;
    const wide = give(w, { type: 'setConscription', country: 'France', level: 3 });
    const people = tallies(w).get('France')!.population;
    expect(wide.economies.France.manpower).toBeCloseTo(e.manpower + (CONSCRIPTION[3].share - CONSCRIPTION[1].share) * people * 1000, 6);
    expect(economyView(wide, 'France').outputFactor).toBeCloseTo(0.88, 9);
    expect(wide.economies.France.stability).toBe(e.stability - 4);
    expect(economyView(wide, 'France').realGDP).toBeLessThan(economyView(w, 'France').realGDP);
  });
});

describe('land and industry', () => {
  it('an occupier gets 30% of the factories, and the loser gets none', () => {
    const w = france();
    const rhineland = provinceByName('Rhineland').id;
    const before = tallies(w);
    const controller = [...w.controller];
    controller[rhineland] = 'France';
    const after = tallies({ ...w, controller });
    expect(after.get('France')!.civ).toBeCloseTo(before.get('France')!.civ + 0.3 * w.factories.civ[rhineland], 9);
    expect(after.get('Germany')!.civ).toBe(before.get('Germany')!.civ - w.factories.civ[rhineland]);
    expect(after.get('Germany')!.steel).toBeLessThan(before.get('Germany')!.steel * 0.5); // the Ruhr
    expect(after.get('Germany')!.homeLost).toBeGreaterThan(0);
  });

  it('holds back armour that has no oil when imports are switched off', () => {
    const w = give(france(), { type: 'setImports', country: 'France', on: false });
    const v = economyView(w, 'France');
    expect(v.oil.ratio).toBe(0);
    expect(v.budget.imports).toBe(0);
    const next = step(w);
    expect(next.units.filter((u) => u.owner === 'France' && u.type === 'armour').every((u) => u.supply === 0.4)).toBe(true);
    expect(next.units.filter((u) => u.owner === 'France' && u.type === 'infantry').every((u) => u.supply > 0.4)).toBe(true);
  });
});

describe('orders', () => {
  it('given while paused take effect at once and give the same game as orders given with the day', () => {
    const w = france();
    const orders: Order[] = [{ type: 'setTax', country: 'France', rate: 0.3 }, { type: 'setRationing', country: 'France', on: true }, { type: 'setConstruction', country: 'France', factories: 3 }, { type: 'build', country: 'France', kind: 'civ', province: paris }];
    const now = applyOrders(w, orders);
    expect(now.economies.France.taxRate).toBe(0.3);
    expect(w.economies.France.taxRate).toBe(0.25); // the old world is untouched
    expect(step(now)).toEqual(step(w, orders));
  });

  it('a player cannot give orders to another country’s economy', () => {
    const w = france();
    const next = advance(w, [{ type: 'setTax', country: 'Germany', rate: 0.6 }]);
    expect(next).toEqual(advance(w));
  });

  it('ignores orders that make no sense', () => {
    const w = france();
    const odd: Order[] = [{ type: 'setTax', country: 'Atlantis', rate: 0.3 }, { type: 'setTax', country: 'France', rate: NaN }, { type: 'cancelBuild', country: 'France', index: 7 }, { type: 'build', country: 'France', kind: 'civ', province: 9999 }, { type: 'setConscription', country: 'France', level: NaN }];
    expect(applyOrders(w, odd).economies).toEqual(w.economies);
  });
});

describe('AI countries at peace (bot playtest)', () => {
  it('four years of peace: nobody goes bankrupt, and the dictatorships rearm fastest', () => {
    let w = newWorld('freeForAll', 'peace');
    const size = (x: World, c: string) => x.units.filter((u) => u.owner === c).length;
    const start = w;
    for (let d = 0; d < 365 * 4; d++) w = advance(w);
    for (const c of COUNTRIES) {
      const e = w.economies[c.name];
      expect(e.inflation, c.name).toBeLessThan(10);
      expect(e.stability, c.name).toBeGreaterThan(60);
      expect(economyView(w, c.name).debtRatio, c.name).toBeLessThan(1);
    }
    const mil = (x: World, c: string) => tallies(x).get(c)!.mil;
    expect(mil(w, 'Germany') - mil(start, 'Germany')).toBeGreaterThan(mil(w, 'France') - mil(start, 'France'));
    expect(size(w, 'Germany')).toBeGreaterThan(size(w, 'France'));
    expect(size(w, 'France')).toBeGreaterThan(size(start, 'France'));
    // New divisions are spread out, not piled on the capital beyond what it can feed.
    const berlin = provinceByName('Berlin').id;
    expect(w.units.filter((u) => u.at === berlin).length).toBeLessThanOrEqual(19);
  });
});
