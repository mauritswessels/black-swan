/** Armies (Stage K2): forming them, their orders, commanders, pincers, saving and lockstep. */
import { describe, expect, it } from 'vitest';
import { armiesOf, armyCentre, describeOrder, keepArmies, orderFor, pincersOf, pushAxis, type ArmyDraft } from '../src/sim/armies';
import { commanderById, COMMANDERS } from '../src/sim/commanders';
import { advance, ownOrders } from '../src/sim/game';
import { worldHash } from '../src/sim/hash';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { combatEdges } from '../src/sim/mods';
import { newGame } from '../src/sim/scenario';
import type { Army, ArmyOrder, Order, World } from '../src/sim/types';
import { upgradeWorld } from '../src/sim/upgrade';
import { applyOrders, newWorld } from '../src/sim/world';
import { termById } from '../src/content/glossary';

const id = (name: string) => provinceByName(name).id;
/** Germany's divisions, leaving out East Prussia, which is cut off from the rest of Germany by land. */
const germans = (w: World) => w.units.filter((u) => u.owner === 'Germany' && u.at !== provinceByName('East Prussia').id).map((u) => u.id);
const only = (w: World): Army => armiesOf(w, 'Germany')[0];
const order = (w: World, army: Army, o: ArmyOrder): World => applyOrders(w, [{ type: 'armyOrder', country: 'Germany', army: army.id, order: o }]);
const days = (w: World, n: number, orders: Order[] = []): World => {
  for (let d = 0; d < n; d++) w = advance(w, d === 0 ? orders : []);
  return w;
};
const start = () => newWorld('freeForAll', 'armies', '1936-01-01', 'Germany');

describe('forming armies', () => {
  it('a new army takes the lowest free number key and is named after it', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 10) }, { type: 'formArmy', country: 'Germany', units: ids.slice(10, 20) }]);
    expect(armiesOf(w, 'Germany').map((a) => [a.name, a.slot, a.units.length])).toEqual([['1st Army', 1, 10], ['2nd Army', 2, 10]]);
    // Disband the first: the next army formed gets key 1 again.
    w = applyOrders(w, [{ type: 'disbandArmy', country: 'Germany', army: only(w).id }, { type: 'formArmy', country: 'Germany', units: ids.slice(20, 25), name: 'Army Group South' }]);
    expect(armiesOf(w, 'Germany').map((a) => [a.name, a.slot])).toEqual([['Army Group South', 1], ['2nd Army', 2]]);
  });

  it('a division belongs to one army at most, and only your own divisions can join', () => {
    let w = start();
    const ids = germans(w);
    const french = w.units.find((u) => u.owner === 'France')!.id;
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: [...ids.slice(0, 6), french] }]);
    expect(only(w).units).toEqual(ids.slice(0, 6));
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(3, 9) }]);
    const [a, b] = armiesOf(w, 'Germany');
    expect(a.units).toEqual(ids.slice(0, 3));
    expect(b.units).toEqual(ids.slice(3, 9));
    w = applyOrders(w, [{ type: 'armyUnits', country: 'Germany', army: a.id, add: ids.slice(8, 9), remove: ids.slice(0, 1) }]);
    expect(armiesOf(w, 'Germany')[0].units).toEqual([...ids.slice(1, 3), ids[8]]);
    expect(armiesOf(w, 'Germany')[1].units).toEqual(ids.slice(3, 8));
  });

  it('another country cannot form or command the player’s armies', () => {
    const w = start();
    const ids = germans(w);
    const tried = ownOrders(w, [{ type: 'formArmy', country: 'France', units: ids }, { type: 'formArmy', country: 'Germany', units: ids }]);
    expect(tried.map((o) => o.type === 'formArmy' && o.country)).toEqual(['Germany']);
  });

  it('only one army takes new divisions, and a commander leads one army of his own country', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 5) }, { type: 'formArmy', country: 'Germany', units: ids.slice(5, 10) }]);
    const [a, b] = armiesOf(w, 'Germany');
    w = applyOrders(w, [
      { type: 'armySettings', country: 'Germany', army: a.id, reinforce: true, commander: 'guderian' },
      { type: 'armySettings', country: 'Germany', army: b.id, reinforce: true, commander: 'guderian' },
      { type: 'armySettings', country: 'Germany', army: a.id, commander: 'zhukov' },
    ]);
    const [x, y] = armiesOf(w, 'Germany');
    expect([x.reinforce, y.reinforce]).toEqual([false, true]);
    expect([x.commander, y.commander]).toEqual([undefined, 'guderian']);
  });

  it('new divisions join the army that takes them, and dead ones leave', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 4) }]);
    w = applyOrders(w, [{ type: 'armySettings', country: 'Germany', army: only(w).id, reinforce: true }]);
    const d: ArmyDraft & { diplomacy: World['diplomacy'] } = { day: w.day, units: w.units.filter((u) => u.id !== ids[0]), controller: [...w.controller], capitulated: [], armies: structuredClone(w.armies!), nextArmyId: w.nextArmyId!, diplomacy: w.diplomacy };
    const fresh = { ...w.units[0], id: w.nextUnitId, owner: 'Germany' };
    d.units.push(fresh, { ...fresh, id: w.nextUnitId + 1, owner: 'France' });
    keepArmies(d, w.nextUnitId);
    expect(d.armies[0].units).toEqual([...ids.slice(1, 4), w.nextUnitId]);
  });
});

describe('army orders', () => {
  it('orders that make no sense are ignored', () => {
    let w = start();
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: germans(w).slice(0, 5) }]);
    const a = only(w);
    w = order(w, a, { kind: 'push', target: 9999, foe: 'Poland', pace: 'steady' });
    w = order(w, a, { kind: 'hold', foe: 'Germany' });
    w = order(w, a, { kind: 'push', target: id('Warsaw'), foe: 'Poland', pace: 'reckless' as never });
    expect(only(w).order).toEqual({ kind: 'none' });
  });

  it('Hold spreads the army along the border with that country, most where the enemy stands', () => {
    let w = start();
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: germans(w).slice(0, 30) }]);
    w = order(w, only(w), { kind: 'hold', foe: 'France' });
    w = days(w, 40);
    const border = new Set(PROVINCES.filter((p) => w.controller[p.id] === 'Germany' && p.neighbours.some((n) => w.controller[n] === 'France')).map((p) => p.id));
    const near = new Set([...border, ...[...border].flatMap((p) => PROVINCES[p].neighbours.filter((n) => w.controller[n] === 'Germany'))]);
    const units = w.units.filter((u) => only(w).units.includes(u.id));
    // Everyone has arrived on the border or just behind it, and the line itself is held.
    expect(units.filter((u) => near.has(u.at)).length).toBe(units.length);
    expect([...border].every((p) => units.some((u) => u.at === p))).toBe(true);
    expect(describeOrder(only(w).order)).toBe('Hold the border with France');
  });

  it('Push takes its target, then holds the ground around it', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 40) }]);
    w = order(w, only(w), { kind: 'push', target: id('Poznań'), foe: 'Poland', pace: 'allOut' });
    w = days(w, 30);
    // At peace it gathers on the stretch of border nearest the target.
    const centre = armyCentre(w, only(w))!;
    expect(PROVINCES[centre].neighbours.some((n) => w.controller[n] === 'Poland')).toBe(true);
    w = applyOrders(w, [{ type: 'declareWar', by: 'Germany', on: 'Poland' }]);
    let taken = -1;
    for (let d = 0; d < 120 && taken < 0; d++) {
      w = advance(w);
      if (w.controller[id('Poznań')] === 'Germany') taken = d;
    }
    expect(taken).toBeGreaterThanOrEqual(0);
    w = advance(w);
    expect(only(w).order).toEqual({ kind: 'hold', foe: 'Poland', at: id('Poznań') });
  });

  it('a push sends divisions one province beyond the one they attack, so they can push on (deep attacks)', () => {
    let w = start();
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: germans(w).slice(0, 60) }]);
    w = order(w, only(w), { kind: 'push', target: id('Warsaw'), foe: 'Poland', pace: 'allOut' });
    w = days(w, 30);
    w = applyOrders(w, [{ type: 'declareWar', by: 'Germany', on: 'Poland' }]);
    let deep = false;
    let pushed = false;
    for (let d = 0; d < 60 && !pushed; d++) {
      w = advance(w);
      const army = new Set(only(w).units);
      for (const u of w.units) {
        if (!army.has(u.id)) continue;
        if (u.path.length >= 2 && w.units.some((e) => e.owner === 'Poland' && e.at === u.path[0])) deep = true;
        if (u.via !== undefined) pushed = true;
      }
    }
    expect(deep).toBe(true);
    expect(pushed).toBe(true);
  });

  it('a push attacks the target itself once it is on the front, and before that the provinces on the way from the army', () => {
    expect(pushAxis([1, 2, 3], 2, 7)).toEqual([2]);
    expect(pushAxis([1, 2, 3], 2, 7, true)[0]).toBe(2);
    const warsaw = id('Warsaw');
    const ring = PROVINCES[warsaw].neighbours;
    const axis = pushAxis(ring, warsaw, id('Silesia'));
    expect(axis.length).toBeGreaterThan(0);
    expect(axis.length).toBeLessThanOrEqual(3);
  });

  it('Fall back gives up attacks and digs in twice as fast', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 6) }]);
    const post = id('Berlin');
    w = order(w, only(w), { kind: 'fallBack', to: post });
    w = days(w, 30);
    const units = w.units.filter((u) => only(w).units.includes(u.id));
    const line = new Set([post, ...PROVINCES[post].neighbours]);
    expect(units.every((u) => line.has(u.at) && !u.path.length)).toBe(true);
    // From nothing, three days later: twice as deep as divisions outside the army.
    w = days({ ...w, units: w.units.map((u) => ({ ...u, dugIn: 0 })) }, 3);
    const dug = (inArmy: boolean) => Math.max(...w.units.filter((u) => u.owner === 'Germany' && only(w).units.includes(u.id) === inArmy && !u.path.length).map((u) => u.dugIn));
    expect(dug(true)).toBeCloseTo(2 * dug(false));
  });

  it('a reserve stays near its post', () => {
    let w = start();
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: germans(w).slice(0, 8) }]);
    const post = id('Saxony');
    w = order(w, only(w), { kind: 'reserve', at: post });
    w = days(w, 30);
    const units = w.units.filter((u) => only(w).units.includes(u.id));
    const near = new Set([post, ...PROVINCES[post].neighbours]);
    expect(units.every((u) => near.has(u.at))).toBe(true);
  });

  it('pointing an army at a province picks the order that fits the place', () => {
    let w = start();
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: germans(w).slice(0, 5) }, { type: 'declareWar', by: 'Germany', on: 'Poland' }]);
    const a = only(w);
    const got = (p: number, kind?: Parameters<typeof orderFor>[4]) => {
      const r = orderFor(w, 'Germany', a, p, kind);
      return 'why' in r ? 'why' : r.order;
    };
    expect(got(id('Warsaw'))).toEqual({ kind: 'push', target: id('Warsaw'), foe: 'Poland', pace: 'steady' });
    expect(got(id('Bern'))).toEqual({ kind: 'hold', foe: 'Switzerland' });
    expect(got(id('Bern'), 'push')).toEqual({ kind: 'push', target: id('Bern'), foe: 'Switzerland', pace: 'steady' });
    // Your own border province: hold against the neighbour, the enemy first.
    const silesia = got(id('Silesia'));
    expect(silesia).toEqual({ kind: 'hold', foe: 'Poland' });
    expect(got(id('Brandenburg'))).toEqual({ kind: 'reserve', at: id('Brandenburg') });
    expect(got(id('Warsaw'), 'fallBack')).toBe('why');
  });
});

describe('pincers', () => {
  it('two armies pushing at one place from different sides make a pincer that counts what it would cut off', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 10) }, { type: 'formArmy', country: 'Germany', units: ids.slice(10, 20) }]);
    // Put the two armies north and south of Poland.
    const north = id('East Prussia');
    const south = id('Slovakia');
    const [a, b] = armiesOf(w, 'Germany');
    w = { ...w, units: w.units.map((u) => (a.units.includes(u.id) ? { ...u, at: north, path: [] } : b.units.includes(u.id) ? { ...u, at: south, path: [] } : u)) };
    const target = id('Warsaw');
    w = applyOrders(w, [
      { type: 'armyOrder', country: 'Germany', army: a.id, order: { kind: 'push', target, foe: 'Poland', pace: 'steady' } },
      { type: 'armyOrder', country: 'Germany', army: b.id, order: { kind: 'push', target, foe: 'Poland', pace: 'steady' } },
    ]);
    const [p] = pincersOf(w, 'Germany');
    expect(p.armies).toEqual([a.id, b.id]);
    expect(p.foe).toBe('Poland');
    expect(p.cutOff).toBeGreaterThanOrEqual(0);
    // Both coming from the same side is no pincer.
    w = { ...w, units: w.units.map((u) => (b.units.includes(u.id) ? { ...u, at: north } : u)) };
    expect(pincersOf(w, 'Germany')).toEqual([]);
  });
});

describe('commanders', () => {
  it('every commander is real, belongs to a playable country, and has a codex entry', () => {
    expect(COMMANDERS.length).toBe(24);
    expect(new Set(COMMANDERS.map((c) => c.id)).size).toBe(24);
    for (const c of COMMANDERS) {
      expect(['Germany', 'Soviet Union', 'United Kingdom', 'France', 'Italy', 'Poland']).toContain(c.country);
      expect(termById(`commander-${c.id}`)?.why).toBe(c.story);
    }
  });

  it('a bold commander’s divisions attack 10% harder; a careful one’s defend 10% harder', () => {
    let w = start();
    const ids = germans(w);
    w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 3) }, { type: 'formArmy', country: 'Germany', units: ids.slice(3, 6) }]);
    const [a, b] = armiesOf(w, 'Germany');
    w = applyOrders(w, [{ type: 'armySettings', country: 'Germany', army: a.id, commander: 'guderian' }, { type: 'armySettings', country: 'Germany', army: b.id, commander: 'rundstedt' }]);
    expect(commanderById('guderian')!.trait).toBe('bold');
    const plain = combatEdges(w.economies, { effects: w.story.effects, day: w.day, startDate: w.startDate });
    const led = combatEdges(w.economies, { effects: w.story.effects, day: w.day, startDate: w.startDate, armies: w.armies });
    const unit = (n: number) => w.units.find((u) => u.id === ids[n])!;
    expect(led.attack(unit(0)) / plain.attack(unit(0))).toBeCloseTo(1.1);
    expect(led.defence(unit(0), unit(0).at) / plain.defence(unit(0), unit(0).at)).toBeCloseTo(1);
    expect(led.defence(unit(3), unit(3).at) / plain.defence(unit(3), unit(3).at)).toBeCloseTo(1.1);
    expect(led.attack(unit(10)) / plain.attack(unit(10))).toBeCloseTo(1);
  });
});

describe('armies are saved and repeatable', () => {
  it('a save from 1.2 (no armies) loads with none', () => {
    const w = start();
    const old = { ...w } as Partial<World>;
    delete old.armies;
    delete old.nextArmyId;
    const up = upgradeWorld(old as World);
    expect(up.armies).toEqual([]);
    expect(up.nextArmyId).toBe(0);
  });

  it('the same army orders give the same war, and a saved game carries on the same', () => {
    const run = (n: number, from?: World): World => {
      let w = from ?? newGame({ mode: 'story', start: '1939', player: 'Germany', seed: 'armies-lockstep' });
      if (!from) {
        const ids = germans(w);
        w = applyOrders(w, [{ type: 'formArmy', country: 'Germany', units: ids.slice(0, 30) }, { type: 'formArmy', country: 'Germany', units: ids.slice(30, 50) }]);
        const [a, b] = armiesOf(w, 'Germany');
        w = applyOrders(w, [
          { type: 'armyOrder', country: 'Germany', army: a.id, order: { kind: 'push', target: id('Warsaw'), foe: 'Poland', pace: 'steady' } },
          { type: 'armyOrder', country: 'Germany', army: b.id, order: { kind: 'hold', foe: 'France' } },
          { type: 'armySettings', country: 'Germany', army: a.id, commander: 'manstein', reinforce: true },
        ]);
      }
      for (let d = 0; d < n; d++) w = advance(w);
      return w;
    };
    const a = run(50);
    const b = run(50);
    expect(worldHash(a)).toBe(worldHash(b));
    const half = JSON.parse(JSON.stringify(run(25))) as World;
    expect(worldHash(run(25, half))).toBe(worldHash(a));
    // And the army really did something: it is in Poland.
    const pushing = armiesOf(a, 'Germany')[0];
    expect(a.units.filter((u) => pushing.units.includes(u.id) && PROVINCES[u.at].owner === 'Poland').length).toBeGreaterThan(0);
  });
});
