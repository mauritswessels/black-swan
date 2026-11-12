import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/content/glossary';
import { COUNTRIES } from '../src/sim/countries';
import { findRoute, PROVINCES, provinceByName, routeDays } from '../src/sim/map';
import type { Order, World } from '../src/sim/types';
import { dateLabel, newWorld, step } from '../src/sim/world';

const run = (w: World, days: number): World => {
  for (let d = 0; d < days; d++) w = step(w);
  return w;
};

describe('the world', () => {
  it('starts on 1 January 1936', () => {
    expect(dateLabel(newWorld('story', 'test'))).toBe('1 January 1936');
  });

  it('counts days across months and leap years', () => {
    const w = newWorld('story', 'test');
    expect(dateLabel({ ...w, day: 66 })).toBe('7 March 1936'); // 1936 was a leap year
    expect(dateLabel({ ...w, day: 366 })).toBe('1 January 1937');
    expect(dateLabel(run(w, 31))).toBe('1 February 1936');
  });

  it('is exactly the same for the same seed, and different for another', () => {
    expect(newWorld('freeForAll', 'abc')).toEqual(newWorld('freeForAll', 'abc'));
    expect(newWorld('story', 'abc').units).not.toEqual(newWorld('story', 'abd').units);
  });

  it('survives being saved as JSON', () => {
    const w = run(newWorld('story', 'save-me'), 5);
    expect(JSON.parse(JSON.stringify(w))).toEqual(w);
  });

  it('gives each country its divisions, standing on its own land', () => {
    const w = newWorld('story', 'test');
    for (const c of COUNTRIES) {
      const mine = w.units.filter((u) => u.owner === c.name);
      expect(mine.length, c.name).toBe(c.startArmy[0] + c.startArmy[1] + c.startArmy[2]);
      for (const u of mine) expect(PROVINCES[u.at].owner).toBe(c.name);
    }
    expect(w.controller).toEqual(PROVINCES.map((p) => p.owner));
  });
});

describe('movement', () => {
  const setup = () => {
    const w = newWorld('story', 'march');
    const paris = provinceByName('Paris').id;
    const berlin = provinceByName('Berlin').id;
    const unit = w.units.find((u) => u.owner === 'France' && u.type === 'infantry')!;
    // Put the division in Paris so the test does not depend on the shuffle.
    const start: World = { ...w, units: w.units.map((u) => (u.id === unit.id ? { ...u, at: paris } : u)) };
    return { start, paris, berlin, id: unit.id };
  };

  it('marches a French division from Paris to Berlin in the expected number of days', () => {
    const { start, paris, berlin, id } = setup();
    const expected = routeDays(paris, findRoute(paris, berlin, 'infantry')!, 'infantry');
    let w = step(start, [{ type: 'move', unit: id, to: berlin }]);
    let days = 1;
    while (w.units[id].at !== berlin && days < 200) {
      w = step(w);
      days++;
    }
    expect(w.units[id].at).toBe(berlin);
    expect(days).toBe(Math.ceil(expected - 1e-9));
    expect(w.units[id].path).toEqual([]);
  });

  it('leaves every other unit where it was', () => {
    const { start, berlin, id } = setup();
    const w = run(step(start, [{ type: 'move', unit: id, to: berlin }]), 30);
    for (const u of w.units) if (u.id !== id) expect(u.at).toBe(start.units[u.id].at);
  });

  it('stops when told to halt, and ignores impossible orders', () => {
    const { start, paris, berlin, id } = setup();
    let w = step(start, [{ type: 'move', unit: id, to: berlin }]);
    w = step(w, [{ type: 'halt', unit: id }]);
    const where = w.units[id].at;
    w = run(w, 10);
    expect(w.units[id].at).toBe(where);
    const orders: Order[] = [{ type: 'move', unit: id, to: provinceByName('London').id }, { type: 'move', unit: 99999, to: paris }];
    expect(step(w, orders).units[id].path).toEqual([]);
  });

  it('does not change the world it was given', () => {
    const { start, berlin, id } = setup();
    const before = JSON.stringify(start);
    step(start, [{ type: 'move', unit: id, to: berlin }]);
    expect(JSON.stringify(start)).toBe(before);
  });

  it('gives the same result for the same orders', () => {
    const { start, berlin, id } = setup();
    const play = () => run(step(start, [{ type: 'move', unit: id, to: berlin }]), 20);
    expect(play()).toEqual(play());
  });

  it('simulates a year of the whole map quickly', () => {
    const t0 = performance.now();
    run(newWorld('story', 'speed'), 366);
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe('the codex', () => {
  it('has no duplicate ids', () => {
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
  });
});
