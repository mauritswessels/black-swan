import { describe, expect, it } from 'vitest';
import { aiOrders } from '../src/sim/ai';
import { advance, aiCountries } from '../src/sim/game';
import { visibleProvinces, visibleStacks } from '../src/sim/intel';
import { PROVINCES, provinceByName } from '../src/sim/map';
import type { Order, World } from '../src/sim/types';
import { applyOrders, newWorld, step } from '../src/sim/world';

const france = (seed = 'stage-c') => newWorld('freeForAll', seed, '1936-01-01', 'France');
const war = (w: World, on: string): World => applyOrders(w, [{ type: 'declareWar', by: w.player!, on }]);

describe('orders given while paused', () => {
  it('show up at once and give the same game as orders given with the day', () => {
    const w = war(france(), 'Germany');
    const mine = w.units.filter((u) => u.owner === 'France').slice(0, 6);
    const target = PROVINCES.find((p) => p.owner === 'Germany' && p.neighbours.some((n) => PROVINCES[n].owner === 'France'))!;
    const orders: Order[] = mine.map((u) => ({ type: 'move', unit: u.id, to: target.id }));
    const now = applyOrders(w, orders);
    expect(now.day).toBe(w.day);
    expect(now.units.filter((u) => u.path.length).length).toBe(6);
    expect(w.units.every((u) => !u.path.length)).toBe(true); // the old world is untouched
    expect(step(now)).toEqual(step(w, orders));
  });

  it('declares war and makes peace without a day passing', () => {
    const w = war(france(), 'Italy');
    expect(w.wars).toEqual(['France|Italy']);
    expect(applyOrders(w, [{ type: 'makePeace', a: 'Italy', b: 'France' }]).wars).toEqual([]);
  });
});

describe('a day with a player', () => {
  it('lets the AI lead every other country at war, but never the player', () => {
    let w = war(war(france(), 'Germany'), 'Italy');
    expect(aiCountries(w)).toEqual(['Germany', 'Italy']);
    for (let d = 0; d < 20; d++) w = advance(w);
    expect(w.units.some((u) => u.owner === 'Germany' && u.path.length)).toBe(true);
    // No French division is ever given a marching order by the AI.
    const before = war(france(), 'Germany');
    const next = advance(before);
    expect(next.units.filter((u) => u.owner === 'France').every((u) => !u.path.length)).toBe(true);
  });

  it('does nothing at all while everyone is at peace', () => {
    const w = france();
    const next = advance(w);
    expect(next.units.map((u) => u.at)).toEqual(w.units.map((u) => u.at));
    expect(next.day).toBe(1);
  });

  it('ignores orders for divisions that are not the player’s', () => {
    const w = war(france(), 'Germany');
    const german = w.units.find((u) => u.owner === 'Germany')!;
    const paris = provinceByName('Paris').id;
    expect(advance(w, [{ type: 'move', unit: german.id, to: paris }])).toEqual(advance(w));
  });

  it('plays the same war twice from the same seed (a bot plays France)', () => {
    const play = (): World => {
      let w = war(france('bot'), 'Germany');
      for (let d = 0; d < 120 && !w.capitulated.length; d++) w = advance(w, aiOrders(w, 'France'));
      return w;
    };
    const a = play();
    expect(a).toEqual(play());
    expect(a.reports.length).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });
});

describe('what you can see', () => {
  it('shows foreign divisions only on and next to your own land and divisions', () => {
    const w = france();
    const seen = visibleProvinces(w, 'France');
    expect(seen[provinceByName('Paris').id]).toBe(true);
    expect(seen[provinceByName('Berlin').id]).toBe(false);
    expect(seen[provinceByName('Moscow').id]).toBe(false);
    const stacks = visibleStacks(w, 'France');
    expect(stacks.filter((s) => s.owner === 'France').reduce((a, s) => a + s.units.length, 0)).toBe(32);
    for (const s of stacks) if (s.owner !== 'France') expect(seen[s.province], PROVINCES[s.province].name).toBe(true);
    expect(stacks.some((s) => s.owner === 'Soviet Union')).toBe(false);
  });

  it('shows everything when nobody is the player', () => {
    const w = newWorld('freeForAll', 'x');
    expect(visibleStacks(w, null).reduce((a, s) => a + s.units.length, 0)).toBe(w.units.length);
  });
});

describe('the outlook for a battle', () => {
  it('matches the worked example in MODEL.md: 8 infantry against 8 on plains', async () => {
    const { outlook } = await import('../src/sim/combat');
    const plains = PROVINCES.find((p) => p.terrain === 'plains')!;
    const from = plains.neighbours[0];
    const unit = (id: number, at: number, path: number[]) => ({ id, owner: path.length ? 'A' : 'B', type: 'infantry' as const, at, strength: 100, organisation: 100, path, progress: 0, dugIn: 0, supply: 1 });
    const o = outlook(Array.from({ length: 8 }, (_, i) => unit(i, from, [plains.id])), Array.from({ length: 8 }, (_, i) => unit(10 + i, plains.id, [])), plains.id)!;
    expect(o.attack).toBe(80);
    expect(o.defence).toBe(120);
    expect(o.attackersLast).toBe(12); // (100 - 10) / 7.5
    expect(o.defendersLast).toBe(20);
    expect(o.favours).toBe('defender');
    expect(outlook([], [], plains.id)).toBeNull();
  });
});
