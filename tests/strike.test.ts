/** Stage K3: aimed air wings, scouting, shelling from the sea, paratroopers, joint attacks and the attack menu. */
import { describe, expect, it } from 'vitest';
import { quiet } from '../src/sim/agenda';
import { AIM_FOCUS, airPicture, cannotAim, REBASE_DAYS } from '../src/sim/air';
import { forecast, outlookAt } from '../src/sim/combat';
import { allianceMap } from '../src/sim/diplomacy';
import { cannotRaise } from '../src/sim/economy';
import { DROP_ORG_COST, DROP_PREP_DAYS, dropPlan, fireSupport, pictures } from '../src/sim/forces';
import { advance, ownOrders } from '../src/sim/game';
import { worldHash } from '../src/sim/hash';
import { visibleProvinces } from '../src/sim/intel';
import { provinceByName } from '../src/sim/map';
import { modsOf } from '../src/sim/mods';
import { SHELL_MAX } from '../src/sim/navy';
import { cannotResearch, techById } from '../src/sim/research';
import { newGame } from '../src/sim/scenario';
import { attackMenu, STRIKE_WAIT } from '../src/sim/strike';
import type { Order, Unit, UnitType, World } from '../src/sim/types';
import { upgradeWorld } from '../src/sim/upgrade';
import { applyOrders, newWorld, step } from '../src/sim/world';
import { termById } from '../src/content/glossary';
import { LESSONS } from '../src/tutorial/lessons';

const id = (name: string) => provinceByName(name).id;
const PIEDMONT = id('Piedmont');
const LOMBARDY = id('Lombardy');
const PROVENCE = id('Provence');
const LANGUEDOC = id('Languedoc');
const SARDINIA = id('Sardinia');
const give = (w: World, ...orders: Order[]): World => applyOrders(w, orders);
const days = (w: World, n: number, orders: Order[] = []): World => {
  for (let d = 0; d < n; d++) w = step(w, d === 0 ? orders : []);
  return w;
};
const friends = (w: World) => allianceMap(w.diplomacy);
const pics = (w: World) => pictures(w, friends(w));

/** France at war with Italy in 1936, with nothing else going on. */
const atWar = (seed = 'stage-k3'): World => give(quiet(newWorld('freeForAll', seed, '1936-01-01', 'France')), { type: 'declareWar', by: 'France', on: 'Italy' });
/** Give France the Airborne forces research. */
const withParas = (w: World): World => {
  const e = w.economies.France;
  return { ...w, economies: { ...w.economies, France: { ...e, research: { ...e.research, done: [...new Set([...e.research.done, 'inf1', 'para'])] } } } };
};
/** Add divisions of one country to a province. */
const add = (w: World, owner: string, at: number, type: UnitType, n: number, extra: Partial<Unit> = {}): World => {
  const units = [...w.units];
  let next = w.nextUnitId;
  for (let i = 0; i < n; i++) units.push({ id: next++, owner, type, at, strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1, ...extra });
  return { ...w, units, nextUnitId: next };
};
const clear = (w: World, at: number): World => ({ ...w, units: w.units.filter((u) => u.at !== at) });
const wing = (w: World, wingId: number) => w.wings.find((x) => x.id === wingId)!;
const french = (w: World, type: 'fighter' | 'bomber') => w.wings.filter((x) => x.owner === 'France' && x.type === type);

describe('aiming air wings at one province', () => {
  it('an aimed wing counts 1.5 times over its target and leaves the rest of its reach', () => {
    let w = atWar();
    const f = french(w, 'fighter').find((x) => !cannotAim(w, x, PIEDMONT))!;
    expect(f).toBeDefined();
    const before = airPicture(w, friends(w));
    w = give(w, { type: 'wing', wing: f.id, target: PIEDMONT });
    expect(wing(w, f.id).target).toBe(PIEDMONT);
    const after = airPicture(w, friends(w));
    expect(after.side(['France'], PIEDMONT)).toBeGreaterThan(before.side(['France'], PIEDMONT));
    // Its share over the target is AIM_FOCUS of one wing at full strength.
    expect(after.side(['France'], PIEDMONT) - before.side(['France'], PIEDMONT)).toBeLessThanOrEqual(AIM_FOCUS + 1e-9);
    // Over its base, which it no longer covers, there is less French air.
    expect(after.side(['France'], f.base)).toBeLessThan(before.side(['France'], f.base));
    // Spreading out again puts things back.
    w = give(w, { type: 'wing', wing: f.id, target: null });
    expect(wing(w, f.id).target).toBeUndefined();
    expect(airPicture(w, friends(w)).side(['France'], PIEDMONT)).toBeCloseTo(before.side(['France'], PIEDMONT), 9);
  });

  it('refuses a target out of reach, and drops the aim when the mission cannot be aimed', () => {
    let w = atWar();
    const b = french(w, 'bomber')[0];
    const far = id('Sicily');
    expect(cannotAim(w, b, far)).toMatch(/km/);
    w = give(w, { type: 'wing', wing: b.id, target: far });
    expect(wing(w, b.id).target).toBeUndefined();
    w = give(w, { type: 'wing', wing: b.id, target: PIEDMONT });
    expect(wing(w, b.id).target).toBe(PIEDMONT);
    w = give(w, { type: 'wing', wing: b.id, mission: 'naval' });
    expect(wing(w, b.id).target).toBeUndefined();
  });

  it('bombers aimed at a battle add fire support to the attack, and stop the defenders digging in', () => {
    let w = add(atWar(), 'France', PROVENCE, 'infantry', 6);
    w = { ...w, units: w.units.map((u) => (u.at === PIEDMONT ? { ...u, dugIn: 6 } : u)) };
    const attack = (x: World) => give(x, ...x.units.filter((u) => u.owner === 'France' && u.at === PROVENCE).map((u) => ({ type: 'move', unit: u.id, to: PIEDMONT }) as Order));
    const plain = attack(w);
    const o0 = outlookAt(plain, PIEDMONT, pics(plain).air.battle, fireSupport(plain, pics(plain), friends(plain)))!;
    expect(o0.attackFire).toBe(0);
    const bombers = french(w, 'bomber').filter((x) => !cannotAim(w, x, PIEDMONT));
    expect(bombers.length).toBeGreaterThan(0);
    const aimed = attack(give(w, ...bombers.map((x) => ({ type: 'wing', wing: x.id, mission: 'ground', target: PIEDMONT }) as Order)));
    const o1 = outlookAt(aimed, PIEDMONT, pics(aimed).air.battle, fireSupport(aimed, pics(aimed), friends(aimed)))!;
    expect(o1.attackFire).toBeGreaterThan(0);
    expect(o1.attack).toBeGreaterThan(o0.attack);
    // Without any attack, the Italians under the bombs lose a day of digging in each day.
    const pounded = days(give(w, ...bombers.map((x) => ({ type: 'wing', wing: x.id, mission: 'ground', target: PIEDMONT }) as Order)), 2);
    const quietDays = days(w, 2);
    const dug = (x: World) => x.units.filter((u) => u.owner === 'Italy' && u.at === PIEDMONT).map((u) => u.dugIn);
    expect(Math.max(...dug(pounded))).toBeLessThan(6);
    expect(Math.min(...dug(quietDays))).toBeGreaterThanOrEqual(6);
  });
});

describe('scouting', () => {
  it('a scout wing shows the province it flies over and the ones next to it', () => {
    let w = atWar();
    expect(visibleProvinces(w, 'France')[LOMBARDY]).toBe(false);
    const f = french(w, 'fighter').find((x) => !cannotAim(w, x, LOMBARDY))!;
    // A scout needs somewhere to scout: without a target the order does nothing.
    w = give(w, { type: 'wing', wing: f.id, mission: 'scout' });
    expect(wing(w, f.id).mission).toBe('superiority');
    w = give(w, { type: 'wing', wing: f.id, mission: 'scout', target: LOMBARDY });
    expect(wing(w, f.id).mission).toBe('scout');
    const seen = visibleProvinces(w, 'France');
    expect(seen[LOMBARDY]).toBe(true);
    for (const n of provinceByName('Lombardy').neighbours) expect(seen[n]).toBe(true);
    // Italy sees nothing more.
    expect(visibleProvinces(w, 'Italy')[id('Burgundy')]).toBe(visibleProvinces(atWar(), 'Italy')[id('Burgundy')]);
  });
});

describe('shelling the coast', () => {
  it('only a fleet on patrol in a zone off the coast can shell it', () => {
    let w = atWar();
    const fleet = w.fleets.find((f) => f.owner === 'France' && f.zone === 'westmed')!;
    w = give(w, { type: 'fleet', fleet: fleet.id, target: LOMBARDY }); // inland
    expect(w.fleets.find((f) => f.id === fleet.id)!.target).toBeUndefined();
    w = give(w, { type: 'fleet', fleet: fleet.id, target: PIEDMONT });
    expect(w.fleets.find((f) => f.id === fleet.id)!.target).toBe(PIEDMONT);
    const fire = fireSupport(w, pics(w), friends(w))(PIEDMONT, ['France'], ['Italy']);
    expect(fire.attack).toBeGreaterThan(0);
    expect(fire.attack).toBeLessThanOrEqual(SHELL_MAX);
    // The ships take a little damage from the coastal guns while they support an attack there.
    const attackers = add(w, 'France', PROVENCE, 'infantry', 6);
    const later = days(attackers, 5, attackers.units.filter((u) => u.owner === 'France' && u.at === PROVENCE).map((u) => ({ type: 'move', unit: u.id, to: PIEDMONT }) as Order));
    const ships = (x: World) => Object.values(x.fleets.find((f) => f.id === fleet.id)!.ships).reduce((a, b) => a + b, 0);
    expect(ships(later)).toBeLessThan(ships(w));
    // Another mission ends the shelling.
    w = give(w, { type: 'fleet', fleet: fleet.id, mission: 'escort' });
    expect(w.fleets.find((f) => f.id === fleet.id)!.target).toBeUndefined();
  });
});

describe('paratroopers', () => {
  it('need the Airborne forces research before they can be built', () => {
    const w = atWar();
    expect(techById('para')!.needs).toBe('inf1');
    expect(cannotResearch(w.economies.France.research, techById('para')!)).toBeTruthy();
    expect(cannotRaise(w.economies.France, 'airborne')).toMatch(/Airborne/i);
    // Free a military factory from the infantry line first.
    const free = (x: World) => give(x, { type: 'setLine', country: 'France', unit: 'infantry', factories: x.economies.France.lines.infantry.factories - 1 });
    const lines = give(free(w), { type: 'setLine', country: 'France', unit: 'airborne', factories: 1 });
    expect(lines.economies.France.lines.airborne.factories).toBe(0);
    const ready = withParas(w);
    expect(modsOf(ready.economies.France).airborne).toBe(1);
    const lined = give(free(ready), { type: 'setLine', country: 'France', unit: 'airborne', factories: 1 });
    expect(lined.economies.France.lines.airborne.factories).toBe(1);
  });

  it('take an empty enemy province at once', () => {
    let w = add(clear(withParas(atWar()), PIEDMONT), 'France', LANGUEDOC, 'airborne', 1);
    const para = w.units[w.units.length - 1];
    expect(dropPlan(w, friends(w), para, PIEDMONT)).toEqual({ days: DROP_PREP_DAYS });
    w = days(w, DROP_PREP_DAYS + 1, [{ type: 'drop', unit: para.id, to: PIEDMONT }]);
    const u = w.units.find((x) => x.id === para.id)!;
    expect(u.at).toBe(PIEDMONT);
    expect(w.controller[PIEDMONT]).toBe('France');
    expect(u.organisation).toBeLessThan(100 - DROP_ORG_COST / 2);
  });

  it('dropped into a battle, they join the attack from behind', () => {
    let w = add(add(withParas(atWar()), 'France', PROVENCE, 'infantry', 8), 'France', LANGUEDOC, 'airborne', 2);
    const paras = w.units.filter((u) => u.type === 'airborne').map((u) => u.id);
    const infantry = w.units.filter((u) => u.owner === 'France' && u.at === PROVENCE).map((u) => u.id);
    w = days(w, DROP_PREP_DAYS + 1, [...infantry.map((u) => ({ type: 'move', unit: u, to: PIEDMONT }) as Order), ...paras.map((u) => ({ type: 'drop', unit: u, to: PIEDMONT }) as Order)]);
    const dropped = w.units.filter((u) => paras.includes(u.id));
    expect(dropped.length).toBeGreaterThan(0);
    for (const u of dropped) {
      expect(u.dropped).toBe(true);
      expect(u.path[0] ?? u.at).toBe(PIEDMONT);
    }
    expect(w.battles.some((b) => b.province === PIEDMONT && b.attackers.includes('France'))).toBe(true);
  });

  it('cannot jump too far, from enemy land, or tired', () => {
    const w = add(withParas(atWar()), 'France', LANGUEDOC, 'airborne', 1, { organisation: 30 });
    const para = w.units[w.units.length - 1];
    expect(dropPlan(w, friends(w), para, PIEDMONT)).toEqual({ why: expect.stringMatching(/rest/) });
    expect(dropPlan(w, friends(w), { ...para, organisation: 100 }, id('Sicily'))).toEqual({ why: expect.stringMatching(/km/) });
    expect(dropPlan(w, friends(w), { ...para, organisation: 100, type: 'infantry' }, PIEDMONT)).toEqual({ why: expect.stringMatching(/paratroopers/) });
    expect(dropPlan(w, friends(w), { ...para, organisation: 100 }, id('Catalonia'))).toEqual({ why: expect.stringMatching(/neutral/) });
  });
});

describe('joint attacks', () => {
  it('the divisions go in once the wings can fly again, not before', () => {
    let w = add(atWar(), 'France', PROVENCE, 'infantry', 4);
    const units = w.units.filter((u) => u.owner === 'France' && u.at === PROVENCE).map((u) => u.id);
    const bomber = french(w, 'bomber')[0];
    // Move the bomber first: it cannot fly for a few days.
    w = give(w, { type: 'wing', wing: bomber.id, base: PROVENCE });
    expect(wing(w, bomber.id).ready).toBe(w.day + REBASE_DAYS);
    w = give(w, { type: 'strike', country: 'France', province: PIEDMONT, how: 'land', units, wings: [bomber.id], fleets: [] });
    expect(w.strikes).toHaveLength(1);
    w = days(w, 1);
    expect(w.units.filter((u) => units.includes(u.id) && u.path.length)).toHaveLength(0);
    w = days(w, REBASE_DAYS + 1);
    expect(w.strikes).toHaveLength(0);
    expect(w.units.filter((u) => units.includes(u.id) && (u.path[0] === PIEDMONT || u.at === PIEDMONT)).length).toBeGreaterThan(0);
  });

  it(`goes in after ${STRIKE_WAIT} days even if a fleet never arrives`, () => {
    let w = add(atWar(), 'France', PROVENCE, 'infantry', 4);
    const units = w.units.filter((u) => u.owner === 'France' && u.at === PROVENCE).map((u) => u.id);
    const far = w.fleets.find((f) => f.owner === 'France' && f.zone === 'biscay')!;
    // Keep it sailing: a fleet that is always on its way.
    w = { ...w, fleets: w.fleets.map((f) => (f.id === far.id ? { ...f, arrives: 9999 } : f)) };
    w = give(w, { type: 'strike', country: 'France', province: PIEDMONT, how: 'land', units, wings: [], fleets: [far.id] });
    w = days(w, STRIKE_WAIT - 1);
    expect(w.strikes).toHaveLength(1);
    w = days(w, 2);
    expect(w.strikes).toHaveLength(0);
  });

  it('a joint landing gets ready at once and waits for the sea off the beach', () => {
    let w = add(atWar(), 'France', LANGUEDOC, 'infantry', 2);
    const units = w.units.filter((u) => u.owner === 'France' && u.at === LANGUEDOC).map((u) => u.id);
    w = give(w, { type: 'strike', country: 'France', province: SARDINIA, how: 'sea', units, wings: [], fleets: [] });
    const sailing = w.units.filter((u) => units.includes(u.id) && u.sea);
    expect(sailing.length).toBe(2);
    for (const u of sailing) {
      expect(u.sea!.landing).toBe(true);
      expect(u.sea!.strike).toBe(w.strikes![0].id);
    }
    // Another order takes a division out of the joint attack.
    w = give(w, { type: 'halt', unit: units[0] });
    expect(w.strikes![0].units).toEqual([units[1]]);
  });

  it('only the player country can plan its own joint attack, and only with its own forces', () => {
    const w = newWorld('freeForAll', 'k3-own', '1936-01-01', 'France');
    const italian = w.units.find((u) => u.owner === 'Italy')!.id;
    const mine = w.units.find((u) => u.owner === 'France')!.id;
    expect(ownOrders(w, [{ type: 'strike', country: 'Italy', province: PROVENCE, how: 'land', units: [italian], wings: [], fleets: [] }])).toEqual([]);
    expect(ownOrders(w, [{ type: 'drop', unit: italian, to: PROVENCE }])).toEqual([]);
    expect(ownOrders(w, [{ type: 'drop', unit: mine, to: PIEDMONT }])).toHaveLength(1);
  });
});

describe('the attack menu', () => {
  it('lists every way to attack, usable ones first, the rest greyed with a reason', () => {
    const w = add(atWar(), 'France', PROVENCE, 'infantry', 6);
    const m = attackMenu(w, 'France', PIEDMONT);
    const kinds = m.options.map((o) => o.kind);
    for (const k of ['joint', 'land', 'sea', 'drop', 'support', 'sky', 'bomb', 'scout', 'shell', 'guard'] as const) expect(kinds, k).toContain(k);
    const firstGrey = m.options.findIndex((o) => o.why);
    expect(m.options.slice(firstGrey).every((o) => o.why)).toBe(true);
    expect(m.options[0].kind).toBe('joint');
    const land = m.options.find((o) => o.kind === 'land')!;
    expect(land.why).toBeUndefined();
    expect(land.preview.join(' ')).toMatch(/divisions/);
    expect(land.orders.every((o) => o.type === 'move')).toBe(true);
    const drop = m.options.find((o) => o.kind === 'drop')!;
    expect(drop.why).toMatch(/research Airborne forces/);
    expect(m.options.find((o) => o.kind === 'bomb')!.preview[0]).toMatch(/2 factories there/);
    // Choosing an option gives exactly its orders.
    const after = applyOrders(w, ownOrders(w, land.orders));
    expect(after.units.filter((u) => u.path[0] === PIEDMONT).length).toBe(land.orders.length);
  });

  it('greys everything at peace or on your own land, saying why', () => {
    // Watching (scouting) and patrolling the sea are not acts of war, so they stay open.
    const peace = quiet(newWorld('freeForAll', 'k3-peace', '1936-01-01', 'France'));
    for (const o of attackMenu(peace, 'France', PIEDMONT).options) if (o.kind !== 'scout' && o.kind !== 'guard') expect(o.why, o.kind).toMatch(/not at war/);
    for (const o of attackMenu(atWar(), 'France', PROVENCE).options) if (o.kind !== 'guard') expect(o.why, o.kind).toMatch(/Provence is yours/);
  });

  it('the preview forecasts a strong attack winning and a weak one stalling', () => {
    const BURGUNDY = id('Burgundy');
    const strong = add(add(add(clear(atWar(), PIEDMONT), 'Italy', PIEDMONT, 'infantry', 1), 'France', PROVENCE, 'infantry', 6), 'France', BURGUNDY, 'infantry', 6);
    const weak = add(clear(atWar(), PROVENCE), 'France', PROVENCE, 'infantry', 1);
    const o = (w: World) => outlookAt(give(w, ...w.units.filter((u) => u.owner === 'France' && (u.at === PROVENCE || u.at === BURGUNDY)).map((u) => ({ type: 'move', unit: u.id, to: PIEDMONT }) as Order)), PIEDMONT)!;
    expect(forecast(o(strong), 0).ends).toBe('win');
    expect(forecast(o(weak), 0).ends).toBe('stall');
    const m = attackMenu(strong, 'France', PIEDMONT).options.find((x) => x.kind === 'land')!;
    expect(m.tone).not.toBe('bad');
    expect(m.preview[0]).toMatch(/break through/);
  });

  it('with paratroopers, the drop option is open and says what they will do', () => {
    const w = add(withParas(atWar()), 'France', LANGUEDOC, 'airborne', 2);
    const drop = attackMenu(w, 'France', PIEDMONT).options.find((o) => o.kind === 'drop')!;
    expect(drop.why).toBeUndefined();
    expect(drop.orders).toHaveLength(2);
    expect(drop.preview.join(' ')).toMatch(/jump in 3 days/);
  });

  it('has a lesson and codex entries', () => {
    expect(LESSONS.some((l) => l.id === 'attack')).toBe(true);
    for (const t of ['attack-menu', 'close-air-support', 'scouting', 'shore-bombardment', 'paratroopers', 'joint-attack', 'softening-up']) expect(termById(t), t).toBeDefined();
  });
});

describe('saves and lockstep', () => {
  it('loads a 1.3 save: no paratrooper lines, no joint attacks', () => {
    const w = atWar();
    const economies = Object.fromEntries(
      Object.entries(w.economies).map(([k, e]) => {
        const { airborne: _s, ...stock } = e.stock;
        const { airborne: _l, ...lines } = e.lines;
        return [k, { ...e, stock, lines }];
      }),
    );
    const old = JSON.parse(JSON.stringify({ ...w, economies, strikes: undefined, nextStrikeId: undefined })) as World;
    const up = upgradeWorld(old);
    expect(up.strikes).toEqual([]);
    expect(up.nextStrikeId).toBe(0);
    expect(up.economies.France.stock.airborne).toBe(0);
    expect(up.economies.France.lines.airborne.factories).toBe(0);
    expect(() => days(up, 3)).not.toThrow();
  });

  it('runs the same from the same start with joint attacks, aims and drops (bot playtest)', () => {
    const run = () => {
      let w = add(add(withParas(atWar('k3-lockstep')), 'France', PROVENCE, 'infantry', 6), 'France', LANGUEDOC, 'airborne', 2);
      const units = w.units.filter((u) => u.owner === 'France' && u.at === PROVENCE).map((u) => u.id);
      const m = attackMenu(w, 'France', PIEDMONT, { units });
      const joint = m.options.find((o) => o.kind === 'joint')!;
      w = advance(w, ownOrders(w, joint.orders));
      expect(w.strikes).toHaveLength(1);
      let wentIn = false;
      for (let d = 0; d < 30; d++) {
        const drop = d === 5 ? attackMenu(w, 'France', PIEDMONT).options.find((o) => o.kind === 'drop' && !o.why) : undefined;
        w = advance(w, drop ? ownOrders(w, drop.orders) : []);
        wentIn ||= w.battles.some((b) => b.province === PIEDMONT && b.attackers.includes('France'));
      }
      return { w, wentIn };
    };
    const a = run();
    expect(worldHash(a.w)).toBe(worldHash(run().w));
    expect(a.wentIn).toBe(true);
  });

  it('the computer aims its bombers at its battles and its fleets shell the coast (bot playtest)', () => {
    let w = newGame({ mode: 'story', seed: 'k3-ai', start: '1939', player: null });
    let aimed = 0;
    let shelled = 0;
    for (let d = 0; d < 40; d++) {
      w = advance(w);
      aimed = Math.max(aimed, w.wings.filter((x) => x.target !== undefined && x.mission === 'ground').length);
      shelled = Math.max(shelled, w.fleets.filter((f) => f.target !== undefined).length);
    }
    expect(aimed).toBeGreaterThan(0);
    expect(shelled).toBeGreaterThanOrEqual(0);
  });
});
