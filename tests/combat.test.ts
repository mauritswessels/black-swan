import { describe, expect, it } from 'vitest';
import { aiOrders } from '../src/sim/ai';
import { attackPower, defencePower, STATS } from '../src/sim/combat';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { DEPOTS, linkedProvinces, supplyCapacity, supplyLevels } from '../src/sim/supply';
import { runWar, SCENARIOS } from '../src/sim/testwar';
import type { Order, Unit, UnitType, World } from '../src/sim/types';
import { atWar, enemiesOf } from '../src/sim/war';
import { newWorld, step } from '../src/sim/world';

const id = (name: string) => provinceByName(name).id;
let next = 0;
const div = (owner: string, where: string, type: UnitType = 'infantry', more: Partial<Unit> = {}): Unit => ({ id: next++, owner, type, at: id(where), strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1, ...more });
const many = (n: number, owner: string, where: string, type: UnitType = 'infantry', more: Partial<Unit> = {}) => Array.from({ length: n }, () => div(owner, where, type, more));

/** A world with only the given divisions on the map, and France at war with Germany. */
const world = (units: Unit[], wars = ['France|Germany']): World => ({ ...newWorld('freeForAll', 'combat'), units, wars });
const attack = (w: World, owner: string, target: string): Order[] => w.units.filter((u) => u.owner === owner).map((u) => ({ type: 'move', unit: u.id, to: id(target) }));
const run = (w: World, days: number, orders: Order[] = []): World => {
  w = step(w, orders);
  for (let d = 1; d < days; d++) w = step(w);
  return w;
};
const of = (w: World, owner: string) => w.units.filter((u) => u.owner === owner);

// Lorraine (France) and the Palatinate (Germany) share a border; both are plains.
describe('the battlefield used in these tests', () => {
  it('is two neighbouring provinces of open country', () => {
    expect(PROVINCES[id('Lorraine')].neighbours).toContain(id('Palatinate'));
    expect(PROVINCES[id('Palatinate')].terrain).toBe('plains');
  });
});

describe('war and peace', () => {
  it('starts and ends wars by order', () => {
    let w = step(newWorld('story', 'war'), [{ type: 'declareWar', by: 'Germany', on: 'Poland' }]);
    expect(atWar(w, 'Poland', 'Germany')).toBe(true);
    expect(enemiesOf(w, 'Germany')).toEqual(['Poland']);
    w = step(w, [{ type: 'declareWar', by: 'Poland', on: 'Germany' }, { type: 'declareWar', by: 'Germany', on: 'Atlantis' }, { type: 'declareWar', by: 'Germany', on: 'Germany' }]);
    expect(w.wars).toEqual(['Germany|Poland']);
    expect(step(w, [{ type: 'makePeace', a: 'Poland', b: 'Germany' }]).wars).toEqual([]);
  });
});

describe('battles', () => {
  it('equal infantry forces: the attack fails, because defending is easier', () => {
    const w0 = world([...many(6, 'France', 'Lorraine'), ...many(6, 'Germany', 'Palatinate')]);
    const w = run(w0, 40, attack(w0, 'France', 'Palatinate'));
    expect(w.controller[id('Palatinate')]).toBe('Germany');
    expect(w.reports).toHaveLength(1);
    expect(w.reports[0].winner).toBe('defender');
    expect(w.reports[0].attackerLosses).toBeGreaterThan(w.reports[0].defenderLosses);
    expect(of(w, 'France').every((u) => u.at === id('Lorraine') && u.path.length === 0)).toBe(true);
  });

  it('three to one on open ground: the attack succeeds and the province changes hands', () => {
    const w0 = world([...many(18, 'France', 'Lorraine'), ...many(6, 'Germany', 'Palatinate')]);
    const w = run(w0, 40, attack(w0, 'France', 'Palatinate'));
    expect(w.reports[0].winner).toBe('attacker');
    expect(w.controller[id('Palatinate')]).toBe('France');
    expect(w.reports[0].causes[0].text).toContain('had the numbers');
    // The beaten divisions fell back into Germany rather than vanishing.
    expect(of(w, 'Germany')).toHaveLength(6);
    expect(of(w, 'Germany').every((u) => w.controller[u.at] === 'Germany')).toBe(true);
  });

  it('the same attack into mountains fails', () => {
    // Savoy (France) borders Piedmont; make the target mountains by attacking Veneto from Lombardy instead.
    const target = PROVINCES.find((p) => p.terrain === 'mountains' && p.owner === 'Italy')!;
    const from = PROVINCES[target.neighbours.find((n) => PROVINCES[n].owner === 'Italy')!];
    const w0 = { ...world([...many(12, 'France', from.name), ...many(6, 'Italy', target.name)], ['France|Italy']) };
    w0.controller = w0.controller.map((c, i) => (i === from.id ? 'France' : c));
    const w = run(w0, 60, w0.units.filter((u) => u.owner === 'France').map((u) => ({ type: 'move', unit: u.id, to: target.id })));
    expect(w.controller[target.id]).toBe('Italy');
    expect(w.reports[0].winner).toBe('defender');
    expect(w.reports[0].causes.map((c) => c.text).join()).toContain('attacking into mountains');
  });

  it('armour hits hardest on open ground and artillery wears down dug-in defenders', () => {
    const tank = div('France', 'Lorraine', 'armour');
    const foot = div('France', 'Lorraine');
    expect(attackPower(tank, id('Palatinate'))).toBe(STATS.armour.attack);
    const mountain = PROVINCES.find((p) => p.terrain === 'mountains')!.id;
    expect(attackPower(tank, mountain) / attackPower(foot, mountain)).toBeCloseTo((22 * 0.7) / 10);
    const dug = div('Germany', 'Palatinate', 'infantry', { dugIn: 10 });
    expect(defencePower(dug)).toBeCloseTo(15 * 1.2);
    expect(defencePower(dug, 0.5)).toBeCloseTo(15 * 1.1);
    expect(defencePower({ ...dug, supply: 0 })).toBeCloseTo(15 * 1.2 * 0.5);
  });

  it('digging in builds up while standing still and is lost on the move', () => {
    const w0 = world([div('France', 'Lorraine')]);
    let w = run(w0, 4);
    expect(w.units[0].dugIn).toBe(4);
    w = run(w, 30);
    expect(w.units[0].dugIn).toBe(10);
    w = step(w, [{ type: 'move', unit: w.units[0].id, to: id('Paris') }]);
    expect(w.units[0].dugIn).toBe(0);
  });

  it('surrounded divisions that lose a battle surrender', () => {
    // Germans alone in the Palatinate, with every neighbouring German province in French hands.
    const w0 = world([...many(16, 'France', 'Lorraine'), ...many(3, 'Germany', 'Palatinate')]);
    w0.controller = w0.controller.map((c, i) => (PROVINCES[id('Palatinate')].neighbours.includes(i) ? 'France' : c));
    const w = run(w0, 30, attack(w0, 'France', 'Palatinate'));
    expect(of(w, 'Germany')).toHaveLength(0);
    expect(w.reports[0].surrendered).toBe(3);
    expect(w.reports[0].causes[0].text).toContain('nowhere to retreat');
  });

  it('gives the same battle for the same seed, and never changes the world it was given', () => {
    const w0 = world([...many(10, 'France', 'Lorraine'), ...many(6, 'Germany', 'Palatinate')]);
    const before = JSON.stringify(w0);
    const a = run(w0, 25, attack(w0, 'France', 'Palatinate'));
    const b = run(w0, 25, attack(w0, 'France', 'Palatinate'));
    expect(a).toEqual(b);
    expect(JSON.stringify(w0)).toBe(before);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it('explains a failed attack with the biggest cause first', () => {
    const w0 = world([...many(3, 'France', 'Lorraine'), ...many(6, 'Germany', 'Palatinate', 'infantry', { dugIn: 10 })]);
    const w = run(w0, 30, attack(w0, 'France', 'Palatinate'));
    const causes = w.reports[0].causes;
    expect(causes[0].text).toContain('outnumbered');
    expect(causes.map((c) => c.weight)).toEqual([...causes.map((c) => c.weight)].sort((x, y) => y - x));
  });
});

describe('supply', () => {
  it('gives every country a depot in its capital and in each separate territory', () => {
    expect(DEPOTS['France']).toContain(id('Paris'));
    expect(DEPOTS['France']).toContain(id('Corsica'));
    expect(DEPOTS['Germany']).toContain(id('East Prussia'));
    for (const depots of Object.values(DEPOTS)) expect(depots.length).toBeGreaterThan(0);
  });

  it('starts every division fully supplied', () => {
    const w = newWorld('story', 'supply');
    expect(Math.min(...supplyLevels(w))).toBe(1);
  });

  it('feeds fewer divisions in mountains than around a capital', () => {
    const mountain = PROVINCES.find((p) => p.terrain === 'mountains' && !p.capital && p.victoryPoints < 5)!.id;
    expect(supplyCapacity(mountain)).toBeLessThan(supplyCapacity(id('Paris')));
  });

  it('shares supply out when a province is overcrowded, which caps organisation', () => {
    const cap = supplyCapacity(id('Lorraine'));
    const w = run(world(many(cap * 2, 'France', 'Lorraine')), 40);
    expect(w.units[0].supply).toBeCloseTo(0.5);
    expect(w.units[0].organisation).toBeCloseTo(50);
    expect(w.units[0].strength).toBe(100);
  });

  it('cuts off a division with no link home: organisation drains, then strength', () => {
    const w0 = world([div('Germany', 'Palatinate')]);
    // France holds everything around the Palatinate.
    w0.controller = w0.controller.map((c, i) => (PROVINCES[id('Palatinate')].neighbours.includes(i) ? 'France' : c));
    expect(linkedProvinces(w0.controller, 'Germany')[id('Palatinate')]).toBe(false);
    let w = run(w0, 10);
    expect(w.units[0].supply).toBe(0);
    expect(w.units[0].organisation).toBeCloseTo(70);
    w = run(w, 40);
    expect(w.units[0].organisation).toBe(0);
    expect(w.units[0].strength).toBeLessThan(100);
    w = run(w, 60);
    expect(w.units).toHaveLength(0); // starved
  });
});

describe('surrender', () => {
  it('a country gives up when enemies hold 60% of its victory points', () => {
    const w0 = world([...many(8, 'Germany', 'Rhineland'), div('Belgium', 'Wallonia')], ['Belgium|Germany']);
    const w = run(w0, 60, attack(w0, 'Germany', 'Brussels'));
    expect(w.capitulated).toEqual(['Belgium']);
    expect(w.wars).toEqual([]);
    expect(of(w, 'Belgium')).toHaveLength(0);
    expect(w.controller[id('Wallonia')]).toBe('Germany');
  });
});

describe('the AI commander', () => {
  it('gives no orders in peace, and only orders its own divisions in war', () => {
    const peace = newWorld('story', 'ai');
    expect(aiOrders(peace, 'Germany')).toEqual([]);
    const war = step(peace, [{ type: 'declareWar', by: 'Germany', on: 'Poland' }]);
    const orders = aiOrders(war, 'Germany');
    expect(orders.length).toBeGreaterThan(0);
    for (const o of orders) if (o.type === 'move' || o.type === 'halt') expect(war.units.find((u) => u.id === o.unit)!.owner).toBe('Germany');
  });

  it('a big country beats a small neighbour, and the same seed gives the same war', () => {
    const a = runWar('Germany', 'Belgium', 'test');
    expect(a.winner).toBe('Germany');
    expect(a.days).toBeLessThan(120);
    const b = runWar('Germany', 'Belgium', 'test');
    expect(b.days).toBe(a.days);
    expect(b.world).toEqual(a.world);
  });

  it('never leaves hostile divisions standing in the same province', () => {
    const { world: w } = runWar('Germany', 'Poland', 'mix', 200);
    for (const p of PROVINCES) {
      const owners = new Set(w.units.filter((u) => u.at === p.id).map((u) => u.owner));
      expect(owners.has('Germany') && owners.has('Poland')).toBe(false);
    }
  });

  it('has a border to fight over in every test war', () => {
    for (const s of SCENARIOS) {
      const borders = PROVINCES.some((p) => p.owner === s.attacker && p.neighbours.some((n) => PROVINCES[n].owner === s.defender));
      expect(borders, `${s.attacker} v ${s.defender}`).toBe(true);
    }
  });
});
