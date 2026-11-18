/**
 * Stage J: paying for a long war. Wear and tear at the front, the wounded coming back, a gradual
 * call-up, soldiers' pay that follows output per head, forced saving under rationing, a capped
 * interest rate in wartime and compulsory loans in a communist state.
 */
import { describe, expect, it } from 'vitest';
import { CALL_UP_RATE, COMPULSORY_LOANS, economyView, FORCED_SAVING, MEN_PER_DIVISION, payLevel, RESERVISTS, UPKEEP, WAR_RATE_CAP } from '../src/sim/economy';
import { PROVINCES } from '../src/sim/map';
import type { Order, World } from '../src/sim/types';
import { atWar } from '../src/sim/war';
import { applyOrders, FRONT_WASTAGE, newWorld, step, WOUNDED_RETURN } from '../src/sim/world';

const start = (player = 'France') => newWorld('freeForAll', 'stage-j', '1936-01-01', player);
const give = (w: World, ...orders: Order[]): World => applyOrders(w, orders);
const withEconomy = (w: World, country: string, change: Partial<World['economies'][string]>): World => ({ ...w, economies: { ...w.economies, [country]: { ...w.economies[country], ...change } } });

describe('soldiers cost what a worker earns', () => {
  it('pays a Soviet or Italian soldier less than a British or German one', () => {
    expect(payLevel('Soviet Union')).toBeLessThan(payLevel('Italy'));
    expect(payLevel('Italy')).toBeLessThan(payLevel('Germany'));
    expect(payLevel('Germany')).toBeLessThan(payLevel('United Kingdom'));
    for (const c of ['Soviet Union', 'Germany', 'United Kingdom', 'Luxembourg']) {
      expect(payLevel(c)).toBeGreaterThanOrEqual(0.5);
      expect(payLevel(c)).toBeLessThanOrEqual(1.2);
    }
  });

  it('scales the upkeep line of the budget by it', () => {
    const w = start();
    const v = economyView(w, 'Soviet Union');
    const units = w.units.filter((u) => u.owner === 'Soviet Union');
    const unscaled = units.reduce((a, u) => a + UPKEEP[u.type], 0);
    expect(v.budget.upkeep).toBeLessThan(unscaled);
  });
});

describe('a gradual call-up', () => {
  it('sends the reservists at once and the rest over the following months', () => {
    const w0 = withEconomy(start(), 'France', { warSupport: 60 });
    const before = w0.economies.France;
    const w = give(w0, { type: 'setConscription', country: 'France', level: 2 });
    const e = w.economies.France;
    const called = e.manpower - before.manpower + (e.callUp ?? 0) - (before.callUp ?? 0);
    expect(e.manpower - before.manpower).toBeCloseTo(RESERVISTS * called, 6);
    let x = w;
    for (let d = 0; d < 31; d++) x = step(x, []);
    // After the first month a sixth of those still to come have reported.
    expect(x.economies.France.callUp).toBeCloseTo((e.callUp ?? 0) * (1 - CALL_UP_RATE), 3);
  });
});

describe('war finance', () => {
  const war = () => give(start(), { type: 'declareWar', by: 'France', on: 'Germany' });

  it('adds forced saving to what the state can borrow once rationing is on', () => {
    const w = war();
    expect(economyView(w, 'France').forcedSaving).toBe(0);
    const rationed = give(w, { type: 'setRationing', country: 'France', on: true });
    const v = economyView(rationed, 'France');
    expect(v.forcedSaving).toBeCloseTo(FORCED_SAVING * v.nominalGDP, 6);
    expect(v.bondCapacity).toBeGreaterThan(economyView(w, 'France').bondCapacity);
    // Forced saving fades once prices run away: people spend before money loses its value.
    const runaway = withEconomy(rationed, 'France', { inflation: 80 });
    expect(economyView(runaway, 'France').forcedSaving).toBeLessThan(v.forcedSaving / 2);
  });

  it('caps the interest rate in wartime, so the real rate r = i - pi turns negative when prices rise', () => {
    const rationed = give(war(), { type: 'setRationing', country: 'France', on: true });
    const hot = withEconomy(rationed, 'France', { expected: 20, inflation: 20 });
    expect(economyView(hot, 'France').marketRate).toBeLessThanOrEqual(WAR_RATE_CAP);
    const free = withEconomy(war(), 'France', { expected: 20, inflation: 20 });
    expect(economyView(free, 'France').marketRate).toBeGreaterThan(WAR_RATE_CAP);
  });

  it('lets a communist state at war order its people to lend, even when trust is low', () => {
    const w = give(start('Soviet Union'), { type: 'declareWar', by: 'Soviet Union', on: 'Poland' });
    const shaky = withEconomy(w, 'Soviet Union', { inflation: 35 });
    expect(economyView(shaky, 'Soviet Union').confidence).toBeGreaterThanOrEqual(COMPULSORY_LOANS);
    const peace = withEconomy(start('Soviet Union'), 'Soviet Union', { inflation: 35 });
    expect(economyView(peace, 'Soviet Union').confidence).toBeLessThan(COMPULSORY_LOANS);
  });
});

describe('a war of attrition', () => {
  it('wears down divisions at the front a little every day, and some of the wounded come back', () => {
    const w = give(start(), { type: 'declareWar', by: 'France', on: 'Germany' });
    const front = w.units.filter((u) => u.owner === 'France' && PROVINCES[u.at].neighbours.some((n) => atWar(w, 'France', w.controller[n])));
    expect(front.length).toBeGreaterThan(0);
    const next = step(w, []);
    const expected = front.length * (FRONT_WASTAGE / 100) * MEN_PER_DIVISION * WOUNDED_RETURN;
    expect((next.economies.France.callUp ?? 0) - (w.economies.France.callUp ?? 0)).toBeCloseTo(expected, 6);
  });
});
