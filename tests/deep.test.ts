import { describe, expect, it } from 'vitest';
import { PUSH_ON_LINE } from '../src/sim/combat';
import { partsOf, PROVINCES, provinceByName, SPLIT_FROM } from '../src/sim/map';
import { upgradeWorld } from '../src/sim/upgrade';
import { supplyLevels } from '../src/sim/supply';
import type { Unit, UnitType, World } from '../src/sim/types';
import { allianceMap } from '../src/sim/diplomacy';
import { newWorld, step } from '../src/sim/world';

// Deep attacks (Stage K4): divisions ordered further than the next province push on once the
// front line there is past halfway, while the rest finish the fight behind them.
const id = (name: string) => provinceByName(name).id;
let next = 0;
const div = (owner: string, where: string, type: UnitType = 'infantry', more: Partial<Unit> = {}): Unit => ({ id: next++, owner, type, at: id(where), strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1, ...more });
const many = (n: number, owner: string, where: string, type: UnitType = 'infantry', more: Partial<Unit> = {}) => Array.from({ length: n }, () => div(owner, where, type, more));
const world = (units: Unit[]): World => ({ ...newWorld('freeForAll', 'deep'), units, wars: ['France|Germany'] });

describe('deep attacks', () => {
  it('tanks push on into the next province while the infantry finish the fight behind them', () => {
    // Lorraine (France), then the Palatinate and Hesse beyond it (Germany).
    const w0 = world([...many(3, 'France', 'Lorraine', 'armour'), ...many(8, 'France', 'Lorraine'), ...many(6, 'Germany', 'Palatinate', 'infantry', { dugIn: 10 }), div('Germany', 'Hesse', 'infantry', { organisation: 30 })]);
    let w = step(w0, w0.units.filter((u) => u.owner === 'France').map((u) => ({ type: 'move' as const, unit: u.id, to: id('Hesse') })));
    let first: Unit[] = [];
    for (let day = 0; day < 60 && w.controller[id('Hesse')] !== 'France'; day++) {
      if (!first.length) first = w.units.filter((u) => u.via === id('Palatinate'));
      w = step(w);
    }
    expect(first.length).toBeGreaterThan(0);
    expect(first[0].type).toBe('armour'); // tanks go first
    expect(w.controller[id('Hesse')]).toBe('France');
  });

  it('fights for two provinces at once: the one it pushed through, and the next', () => {
    const tank = div('France', 'Lorraine', 'armour', { via: id('Palatinate'), path: [id('Hesse')] });
    const foot = many(8, 'France', 'Lorraine', 'infantry', { path: [id('Palatinate')], progress: 0.3 });
    const w0 = world([tank, ...foot, ...many(3, 'Germany', 'Palatinate'), ...many(2, 'Germany', 'Hesse')]);
    const battle = { id: 1, province: id('Palatinate'), startDay: 0, attackers: ['France'], defenders: ['Germany'], attackerUnits: foot.map((u) => u.id), defenderUnits: [], attackerLosses: 0, defenderLosses: 0, surrendered: 0, tally: { days: 0, attackerCount: 0, defenderCount: 0, terrain: 0, attackerSupply: 0, defenderSupply: 0, dugIn: 0, directions: 0, attackerEdge: 0, defenderEdge: 0, air: 0, landing: 0, armourShare: 0, artilleryShare: 0 }, line: 30, push: 2 };
    const w = step({ ...w0, battles: [battle], nextBattleId: 2 });
    expect(w.battles.map((b) => b.province).sort()).toEqual([id('Palatinate'), id('Hesse')].sort());
    const hesse = w.battles.find((b) => b.province === id('Hesse'))!;
    expect(hesse.attackerUnits).toEqual([tank.id]);
  });

  it('a division that pushed on falls back to where it set out from when the fight behind it is lost', () => {
    const tank = div('France', 'Lorraine', 'armour', { via: id('Palatinate'), path: [id('Hesse')] });
    const w = step(world([tank, ...many(4, 'Germany', 'Palatinate')]));
    const u = w.units.find((x) => x.id === tank.id)!;
    expect(u.via).toBeUndefined();
    expect(u.at).toBe(id('Lorraine'));
    expect(u.path).toEqual([]);
  });

  it('once the province behind it is clear, the division is standing in it', () => {
    const tank = div('France', 'Lorraine', 'armour', { via: id('Palatinate'), path: [id('Hesse')], progress: 0 });
    const w = step(world([tank, ...many(4, 'Germany', 'Hesse')]));
    const u = w.units.find((x) => x.id === tank.id)!;
    expect(u.via).toBeUndefined();
    expect(u.at).toBe(id('Palatinate'));
    expect(w.controller[id('Palatinate')]).toBe('France');
  });

  it('supply follows the attack through a province whose front line is past halfway', () => {
    // A French division in Hesse, behind the German-held Palatinate.
    const base = world([div('France', 'Hesse'), ...many(2, 'Germany', 'Palatinate')]);
    const controller = [...base.controller];
    controller[id('Hesse')] = 'France';
    const cut = supplyLevels({ ...base, controller }, allianceMap(base.diplomacy));
    expect(cut[0]).toBe(0);
    const battle = { id: 1, province: id('Palatinate'), startDay: 0, attackers: ['France'], defenders: ['Germany'], attackerUnits: [], defenderUnits: [], attackerLosses: 0, defenderLosses: 0, surrendered: 0, tally: { days: 0, attackerCount: 0, defenderCount: 0, terrain: 0, attackerSupply: 0, defenderSupply: 0, dugIn: 0, directions: 0, attackerEdge: 0, defenderEdge: 0, air: 0, landing: 0, armourShare: 0, artilleryShare: 0 }, line: PUSH_ON_LINE, push: 1 };
    const fed = supplyLevels({ ...base, controller, battles: [battle] }, allianceMap(base.diplomacy));
    expect(fed[0]).toBeGreaterThan(0);
  });
});

describe('saves from before the finer map (1.4 and earlier)', () => {
  it('load: each new part is held by whoever held the province it was cut from, and has no factories', () => {
    const now = newWorld('story', 'old-save');
    const OLD = 183;
    // A world as 1.4 saved it: one entry per province of the old map. Germany holds Novgorod (Leningrad was split off it).
    const controller = now.controller.slice(0, OLD).map((c, i) => (i === id('Novgorod') ? 'Germany' : c));
    const old: World = { ...now, controller, owner: now.owner.slice(0, OLD), factories: { civ: now.factories.civ.slice(0, OLD), mil: now.factories.mil.slice(0, OLD) }, replay: { ...now.replay!, base: now.controller.slice(0, OLD), now: controller } };
    const up = upgradeWorld(old);
    for (const xs of [up.controller, up.owner, up.factories.civ, up.factories.mil, up.replay!.base, up.replay!.now]) expect(xs).toHaveLength(PROVINCES.length);
    for (const [part, from] of SPLIT_FROM) {
      expect(up.owner[part]).toBe(now.owner[from]);
      expect(up.factories.civ[part]).toBe(0);
    }
    // Novgorod's parts went to Germany with it.
    expect(partsOf(id('Novgorod'))).toContain(id('Leningrad'));
    for (const p of partsOf(id('Novgorod'))) expect(up.controller[p]).toBe('Germany');
    let w = up;
    for (let d = 0; d < 5; d++) w = step(w);
    expect(w.controller).toHaveLength(PROVINCES.length);
  });
});
