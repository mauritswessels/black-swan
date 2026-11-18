/** Stage K1: the front line inside a province, rivers, seasons, pockets and the war replay. */
import { describe, expect, it } from 'vitest';
import { BREAKTHROUGH_JUMP, linePush, PUSH_PER_DAY } from '../src/sim/combat';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { pocketsOf } from '../src/sim/pockets';
import { recordFront, replayFrames, startReplay, warFrames } from '../src/sim/replay';
import { BRIDGEHEAD, RIVER_BORDERS, riverBetween, RIVERS } from '../src/sim/rivers';
import { groundOn, seasonOf } from '../src/sim/seasons';
import { dayOf } from '../src/sim/agenda';
import type { Order, Unit, UnitType, World } from '../src/sim/types';
import { upgradeWorld } from '../src/sim/upgrade';
import { newWorld, step } from '../src/sim/world';
import { worldHash } from '../src/sim/hash';

const id = (name: string) => provinceByName(name).id;
let next = 0;
const div = (owner: string, where: string, type: UnitType = 'infantry', more: Partial<Unit> = {}): Unit => ({ id: next++, owner, type, at: id(where), strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1, ...more });
const many = (n: number, owner: string, where: string, type: UnitType = 'infantry', more: Partial<Unit> = {}) => Array.from({ length: n }, () => div(owner, where, type, more));
/** France holds Luxembourg, which borders the Palatinate across open country and no river. */
const world = (units: Unit[], startDate = '1936-06-01'): World => {
  const w = { ...newWorld('freeForAll', 'front', startDate), units, wars: ['France|Germany'] };
  w.controller = w.controller.map((c, i) => (i === id('Luxembourg') ? 'France' : c));
  return w;
};
const attack = (w: World, owner: string, target: string): Order[] => w.units.filter((u) => u.owner === owner).map((u) => ({ type: 'move', unit: u.id, to: id(target) }));

describe('the front line inside a province', () => {
  it('moves by how each day went: forward when the attackers deal more, back when they take more', () => {
    expect(linePush(200, 100, 0)).toBeCloseTo(PUSH_PER_DAY / 3);
    expect(linePush(100, 200, 50)).toBeCloseTo(-PUSH_PER_DAY / 3);
    expect(linePush(100, 100, 50)).toBe(0);
    expect(linePush(100, 0, 0)).toBe(PUSH_PER_DAY);
    // Mud halves it, snow takes a quarter off.
    expect(linePush(200, 100, 0, 'mud')).toBeCloseTo(PUSH_PER_DAY / 6);
    expect(linePush(200, 100, 0, 'snow')).toBeCloseTo((PUSH_PER_DAY / 3) * 0.75);
    // Across a river, half pace until a bridgehead is won.
    expect(linePush(200, 100, 0, 'dry', 1)).toBeCloseTo(PUSH_PER_DAY / 6);
    expect(linePush(200, 100, BRIDGEHEAD, 'dry', 1)).toBeCloseTo(PUSH_PER_DAY / 3);
    // A river never slows a retreat.
    expect(linePush(100, 200, 0, 'dry', 1)).toBeCloseTo(-PUSH_PER_DAY / 3);
  });

  it('creeps forward day by day, and the province changes hands only when it reaches the far side', () => {
    const w0 = world([...many(16, 'France', 'Luxembourg'), ...many(5, 'Germany', 'Palatinate')]);
    let w = step(w0, attack(w0, 'France', 'Palatinate'));
    const lines: number[] = [];
    let flipped = -1;
    for (let d = 0; d < 60 && flipped < 0; d++) {
      const b = w.battles[0];
      if (b) lines.push(b.line);
      if (w.controller[id('Palatinate')] === 'France') flipped = d;
      w = step(w);
    }
    expect(lines.length).toBeGreaterThan(3);
    expect(lines[lines.length - 1]).toBeGreaterThan(lines[0]);
    // While the battle went on, the Palatinate stayed German.
    expect(flipped).toBeGreaterThan(lines.length - 1);
    expect(w.reports[0].winner).toBe('attacker');
  });

  it('jumps forward when the defenders break, and the attackers march the rest of the way', () => {
    const w0 = world([...many(16, 'France', 'Luxembourg'), ...many(3, 'Germany', 'Palatinate', 'infantry', { organisation: 8 })]);
    const w1 = step(w0, attack(w0, 'France', 'Palatinate'));
    // The defenders broke on the first day: no battle left, the attackers are well into the province, and still walking.
    expect(w1.battles).toHaveLength(0);
    const french = w1.units.filter((u) => u.owner === 'France');
    expect(french.every((u) => u.progress >= BREAKTHROUGH_JUMP - 0.01 || u.at === id('Palatinate'))).toBe(true);
    expect(w1.controller[id('Palatinate')]).toBe('Germany');
    let w = w1;
    for (let d = 0; d < 10; d++) w = step(w);
    expect(w.controller[id('Palatinate')]).toBe('France');
  });

  it('pushes the defenders out once the line reaches the far side, even if they are still in good order', () => {
    const w0 = world([...many(8, 'France', 'Luxembourg', 'infantry', { progress: 0.97 }), ...many(2, 'Germany', 'Palatinate')]);
    const orders = attack(w0, 'France', 'Palatinate');
    // Keep the progress already made (the order is for the same first step).
    const w1 = step({ ...w0, units: w0.units.map((u) => (u.owner === 'France' ? { ...u, path: [id('Palatinate')] } : u)) }, orders);
    let w = w1;
    for (let d = 0; d < 3; d++) w = step(w);
    expect(w.controller[id('Palatinate')]).toBe('France');
    expect(w.units.filter((u) => u.owner === 'Germany').every((u) => u.at !== id('Palatinate'))).toBe(true);
  });
});

describe('rivers', () => {
  it('lie on borders between neighbouring provinces', () => {
    expect(RIVERS.length).toBeGreaterThanOrEqual(15);
    for (const r of RIVER_BORDERS) expect(PROVINCES[r.a].neighbours, `${r.river}: ${PROVINCES[r.a].name} and ${PROVINCES[r.b].name}`).toContain(r.b);
    expect(riverBetween(id('Lorraine'), id('Württemberg'))).toBe('Rhine');
    expect(riverBetween(id('Württemberg'), id('Lorraine'))).toBe('Rhine');
    expect(riverBetween(id('Lorraine'), id('Palatinate'))).toBeNull();
    expect(riverBetween(id('Kiev'), id('Poltava'))).toBe('Dnieper');
    expect(riverBetween(id('Luxembourg'), id('Palatinate'))).toBeNull();
  });

  it('slow an attack: the same attack across the Rhine gets less far in the same time', () => {
    // From Lorraine: into Württemberg across the Rhine, or into the Palatinate over land. Both are open country.
    const across = world([...many(12, 'France', 'Lorraine'), ...many(6, 'Germany', 'Württemberg')]);
    const open = world([...many(12, 'France', 'Lorraine'), ...many(6, 'Germany', 'Palatinate')]);
    const lineAfter = (w0: World, target: string, days: number) => {
      let w = step(w0, attack(w0, 'France', target));
      for (let d = 1; d < days; d++) w = step(w);
      return w.battles[0]?.line ?? 100;
    };
    expect(lineAfter(across, 'Württemberg', 4)).toBeLessThan(lineAfter(open, 'Palatinate', 4));
    const w = step(across, attack(across, 'France', 'Württemberg'));
    expect(w.battles[0].river).toBe('Rhine');
  });
});

describe('seasons', () => {
  it('turn the east to mud in the autumn rains and the spring thaw, and leave the west dry', () => {
    const at = (date: string) => dayOf('1936-01-01', date);
    expect(seasonOf('1936-01-01', at('1941-10-20'))).toBe('rains');
    expect(groundOn(id('Kiev'), '1936-01-01', at('1941-10-20'))).toBe('mud');
    expect(groundOn(id('Lorraine'), '1936-01-01', at('1941-10-20'))).toBe('dry');
    expect(groundOn(id('Minsk'), '1936-01-01', at('1942-04-01'))).toBe('mud');
    expect(groundOn(id('Moscow'), '1936-01-01', at('1941-12-15'))).toBe('snow');
    expect(groundOn(id('Cyrenaica'), '1936-01-01', at('1941-07-15'))).toBe('heat');
    expect(groundOn(id('Kiev'), '1936-01-01', at('1941-07-15'))).toBe('dry');
  });

  it('make marching in mud take twice as long', () => {
    // A Soviet division walking from Kiev to Poltava, in July and in the October rains.
    const walk = (startDate: string) => {
      let w: World = { ...newWorld('freeForAll', 'mud', startDate), units: [div('Soviet Union', 'Kiev')] };
      w = step(w, [{ type: 'move', unit: w.units[0].id, to: id('Poltava') }]);
      let days = 1;
      while (w.units[0].at !== id('Poltava') && days < 100) (w = step(w)), days++;
      return days;
    };
    const dry = walk('1941-07-01');
    const mud = walk('1941-10-12');
    expect(mud).toBeGreaterThanOrEqual(2 * dry - 1);
  });
});

describe('pockets', () => {
  it('group divisions cut off from supply by where they stand, and count them', () => {
    const units = [...many(5, 'Germany', 'Kiev', 'infantry', { supply: 0 }), ...many(3, 'Germany', 'Poltava', 'infantry', { supply: 0 }), ...many(2, 'Germany', 'Crimea', 'infantry', { supply: 0 }), ...many(4, 'Germany', 'Minsk')];
    const pockets = pocketsOf({ units });
    expect(pockets).toHaveLength(2);
    expect(pockets[0].divisions).toBe(8);
    expect(pockets[0].provinces).toEqual([id('Kiev'), id('Poltava')].sort((a, b) => a - b));
    expect(pockets[0].centre).toBe(id('Kiev'));
    expect(pockets[1].divisions).toBe(2);
  });

  it('appear when an army is surrounded in a real game', () => {
    // German divisions standing in the middle of Poland, with Poland at war and holding everything around them.
    let w: World = { ...newWorld('freeForAll', 'pocket'), units: [...many(4, 'Germany', 'Lublin'), ...many(2, 'Poland', 'Warsaw')], wars: ['Germany|Poland'] };
    w.controller = w.controller.map((c, i) => (i === id('Lublin') ? 'Germany' : c));
    w = step(w);
    const p = pocketsOf(w);
    expect(p.map((x) => [x.owner, x.divisions])).toEqual([['Germany', 4]]);
  });
});

describe('the war replay', () => {
  it('writes down the front once a week, keeping only the changes', () => {
    const base = ['A', 'A', 'B'];
    let r = startReplay(base, 0);
    r = recordFront(r, ['A', 'A', 'B'], 7);
    expect(r.weeks).toHaveLength(0);
    r = recordFront(r, ['A', 'B', 'B'], 10); // not a recording day
    expect(r.weeks).toHaveLength(0);
    r = recordFront(r, ['A', 'B', 'B'], 14);
    r = recordFront(r, ['B', 'B', 'B'], 21);
    expect(r.weeks).toEqual([
      { day: 14, changes: [[1, 'B']] },
      { day: 21, changes: [[0, 'B']] },
    ]);
    const frames = replayFrames(r, 28);
    expect(frames.map((f) => f.controller.join(''))).toEqual(['AAB', 'AAB', 'ABB', 'BBB', 'BBB']);
    expect(frames[2].changed).toEqual([1]);
    expect(warFrames(r, 28)[0].day).toBe(0);
  });

  it('records a real game as it is played, and the record survives a save', () => {
    let w = newWorld('story', 'replay');
    for (let d = 0; d < 800; d++) w = step(w);
    expect(w.replay!.startDay).toBe(0);
    const frames = replayFrames(w.replay!, w.day);
    expect(frames.length).toBe(Math.floor(w.day / 7) + 1);
    expect(frames[frames.length - 1].controller).toEqual(w.replay!.now);
    expect(JSON.parse(JSON.stringify(w))).toEqual(w);
  });
});

describe('saves from 1.1', () => {
  it('load: battles get a front line at the border and the replay starts recording', () => {
    const w0 = world([...many(16, 'France', 'Luxembourg'), ...many(5, 'Germany', 'Palatinate')]);
    let w = step(w0, attack(w0, 'France', 'Palatinate'));
    w = step(w);
    // As a 1.1 save would have it.
    const old = JSON.parse(JSON.stringify(w)) as World;
    delete old.replay;
    for (const b of old.battles) {
      delete (b as Partial<typeof b>).line;
      delete (b as Partial<typeof b>).push;
    }
    const up = upgradeWorld(old);
    expect(up.battles[0].line).toBe(0);
    expect(up.replay!.startDay).toBe(up.day);
    let x = up;
    for (let d = 0; d < 30; d++) x = step(x);
    expect(worldHash(x)).toMatch(/^[0-9a-f]{14}$/);
    expect(x.controller[id('Palatinate')]).toBe('France');
  });
});
