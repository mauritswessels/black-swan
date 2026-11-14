import { describe, expect, it } from 'vitest';
import { quiet } from '../src/sim/agenda';
import { AIR_EDGE, bombTarget, cannotRaiseWing, REBASE_DAYS } from '../src/sim/air';
import { outlookAt } from '../src/sim/combat';
import { allianceMap, SURRENDER_SHARE_NO_CAPITAL } from '../src/sim/diplomacy';
import { economyView } from '../src/sim/economy';
import { pictures } from '../src/sim/forces';
import { advance, ownOrders } from '../src/sim/game';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { AMPHIBIOUS, combatEdges } from '../src/sim/mods';
import { LANDING_PREP_DAYS, shipPlan, tradeRoute, TRANSPORT_DAYS } from '../src/sim/navy';
import { BRANCHES, TECHS } from '../src/sim/research';
import { COAST, DAYS_PER_ZONE, fleetPower, HOME_ZONES, isCoastal, seaDependence, SHORES, TRADE_ROUTE, ZONE_INDEX, zonePath, ZONES } from '../src/sim/sea';
import { linkedProvinces } from '../src/sim/supply';
import type { Order, Unit, World } from '../src/sim/types';
import { atWar } from '../src/sim/war';
import { applyOrders, newWorld, step } from '../src/sim/world';

// A quiet world: no pacts and no historical agenda, so these tests see only the navy and the air force.
const as = (country: string | null, seed = 'stage-g') => quiet(newWorld('freeForAll', seed, '1936-01-01', country));
const give = (w: World, ...orders: Order[]): World => applyOrders(w, orders);
const id = (name: string) => provinceByName(name).id;
const z = (zone: string) => ZONE_INDEX[zone];
const war = (w: World, a: string, b: string) => give(w, { type: 'declareWar', by: a, on: b });
const seen = (w: World) => pictures(w, allianceMap(w.diplomacy));
const friends = (w: World) => allianceMap(w.diplomacy);
const days = (w: World, n: number, orders: Order[] = []) => {
  for (let d = 0; d < n; d++) w = step(w, d === 0 ? orders : []);
  return w;
};
const fleetOf = (w: World, owner: string, zone: string) => w.fleets.find((f) => f.owner === owner && f.zone === zone)!;
const unit = (owner: string, at: number, n = 0, type: Unit['type'] = 'infantry'): Unit => ({ id: 9000 + n, owner, type, at, strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1 });

describe('the sea', () => {
  it('has 17 zones that all connect, and every coast lies on a zone', () => {
    expect(ZONES).toHaveLength(17);
    for (const a of ZONES) {
      for (const n of a.neighbours) expect(ZONES[n].neighbours, `${a.name} and ${ZONES[n].name}`).toContain(ZONE_INDEX[a.id]);
      expect(zonePath(0, ZONE_INDEX[a.id]), a.name).not.toBeNull();
      expect(SHORES[ZONE_INDEX[a.id]].length, a.name).toBeGreaterThan(0);
    }
    expect(isCoastal(id('London'))).toBe(true);
    expect(COAST[id('Normandy')]).toContain(z('channel'));
    expect(isCoastal(id('Bavaria'))).toBe(false);
    expect(isCoastal(id('Moscow'))).toBe(false);
    expect(PROVINCES.filter((p) => isCoastal(p.id)).length).toBeGreaterThan(90);
  });

  it('gives each country home waters and a trade route to the ocean', () => {
    expect(HOME_ZONES['United Kingdom']).toContain(z('channel'));
    expect(TRADE_ROUTE['United Kingdom'].map((i) => ZONES[i].id)).toEqual(['approaches']);
    expect(TRADE_ROUTE.Italy.length).toBeGreaterThan(1);
    expect(TRADE_ROUTE.Switzerland).toEqual([]);
    expect(seaDependence('Switzerland')).toBe(0);
    expect(seaDependence('United Kingdom')).toBe(1);
    expect(seaDependence('Germany')).toBeLessThan(seaDependence('France'));
  });

  it('starts with the navies and air forces of 1936', () => {
    const w = as(null);
    const power = (c: string) => w.fleets.filter((f) => f.owner === c).reduce((a, f) => a + fleetPower(f), 0);
    expect(power('United Kingdom')).toBeGreaterThan(power('France'));
    expect(power('France')).toBeGreaterThan(power('Germany'));
    expect(w.fleets.some((f) => f.owner === 'Switzerland')).toBe(false);
    for (const c of ['United Kingdom', 'France', 'Germany', 'Italy', 'Soviet Union', 'Poland']) expect(w.wings.filter((x) => x.owner === c).length, c).toBeGreaterThanOrEqual(3);
    for (const x of w.wings) expect(w.controller[x.base]).toBe(x.owner);
  });
});

describe('control of the sea', () => {
  it('is undisputed in peace, and goes to the side with twice the strength in war', () => {
    let w = as('United Kingdom');
    expect(seen(w).sea.status('United Kingdom', z('north'))).toBe('own');
    expect(seen(w).sea.status('Germany', z('north'))).toBe('own'); // at peace nobody disputes it
    w = war(w, 'United Kingdom', 'Germany');
    expect(seen(w).sea.status('United Kingdom', z('north'))).toBe('own');
    expect(seen(w).sea.status('Germany', z('north'))).toBe('enemy');
    expect(seen(w).sea.status('Germany', z('baltic'))).toBe('own');
    expect(seen(w).sea.status('United Kingdom', z('black'))).toBe('open');
  });

  it('a fleet in port or on a raid holds nothing', () => {
    let w = war(as('United Kingdom'), 'United Kingdom', 'Germany');
    for (const f of w.fleets.filter((x) => x.owner === 'United Kingdom' && x.zone === 'north')) w = give(w, { type: 'fleet', fleet: f.id, mission: 'port' });
    expect(seen(w).sea.status('United Kingdom', z('north'))).not.toBe('own');
  });

  it('fleets take days to sail, and a naval battle wears the weaker fleet down', () => {
    let w = war(as('United Kingdom'), 'United Kingdom', 'Germany');
    const german = fleetOf(w, 'Germany', 'north');
    const before = fleetPower(german);
    const home = fleetPower(fleetOf(w, 'United Kingdom', 'north'));
    w = days(w, 10);
    const after = w.fleets.find((f) => f.id === german.id);
    expect(after ? fleetPower(after) : 0).toBeLessThan(before * 0.8);
    expect(fleetPower(fleetOf(w, 'United Kingdom', 'north'))).toBeLessThan(home);
    expect(fleetPower(fleetOf(w, 'United Kingdom', 'north'))).toBeGreaterThan(home * 0.8);
    expect(w.forceLog.some((e) => e.kind === 'sea' && e.zone === 'north')).toBe(true);

    const med = fleetOf(w, 'United Kingdom', 'eastmed');
    w = give(w, { type: 'fleet', fleet: med.id, zone: 'centralmed' });
    const moved = w.fleets.find((f) => f.id === med.id)!;
    expect(moved.zone).toBe('centralmed');
    expect(moved.arrives - w.day).toBe(DAYS_PER_ZONE * (zonePath(z('eastmed'), z('centralmed'))!.length - 1));
  });

  it('lets a player order only their own fleets and wings', () => {
    const w = as('United Kingdom');
    const mine = fleetOf(w, 'United Kingdom', 'north');
    const theirs = fleetOf(w, 'Germany', 'north');
    const wing = w.wings.find((x) => x.owner === 'Germany')!;
    expect(ownOrders(w, [{ type: 'fleet', fleet: mine.id, mission: 'escort' }, { type: 'fleet', fleet: theirs.id, mission: 'port' }, { type: 'wing', wing: wing.id, mission: 'rest' }])).toHaveLength(1);
  });

  it('splits and joins fleets', () => {
    let w = as('United Kingdom');
    const home = fleetOf(w, 'United Kingdom', 'north');
    const n = w.fleets.length;
    w = give(w, { type: 'transfer', fleet: home.id, to: null, kind: 'submarine', count: home.ships.submarine });
    expect(w.fleets).toHaveLength(n + 1);
    const subs = w.fleets[w.fleets.length - 1];
    expect(subs.ships).toEqual({ capital: 0, escort: 0, submarine: home.ships.submarine });
    w = give(w, { type: 'transfer', fleet: subs.id, to: home.id, kind: 'submarine', count: subs.ships.submarine });
    expect(w.fleets).toHaveLength(n);
    expect(w.fleets.find((f) => f.id === home.id)!.ships).toEqual(home.ships);
  });
});

describe('the convoy war', () => {
  it('raiders sink imports, escorts cut the losses, and the shortage reaches the economy', () => {
    let w = war(as('United Kingdom'), 'United Kingdom', 'Germany');
    const before = economyView(w, 'United Kingdom');
    // Germany's whole fleet goes raiding in the Western Approaches.
    for (const f of w.fleets.filter((x) => x.owner === 'Germany')) w = give(w, { type: 'fleet', fleet: f.id, zone: 'approaches', mission: 'raid' });
    w = days(w, 30);
    const patrol = tradeRoute(w, seen(w).sea, friends(w), 'United Kingdom');
    expect(patrol.lost).toBeGreaterThan(0.15);
    expect(w.economies['United Kingdom'].blockade).toBeGreaterThan(0.1);
    const hit = economyView(w, 'United Kingdom');
    expect(hit.blockade).toBeGreaterThan(0.1);
    expect(hit.oil.ratio).toBeLessThan(before.oil.ratio);

    w = give(w, { type: 'fleet', fleet: fleetOf(w, 'United Kingdom', 'approaches').id, mission: 'escort' });
    const escorted = tradeRoute(w, seen(w).sea, friends(w), 'United Kingdom');
    expect(escorted.lost).toBeLessThan(patrol.lost);
    // Escorts hunt the raiders down.
    const subs = () => w.fleets.filter((f) => f.owner === 'Germany').reduce((a, f) => a + f.ships.submarine, 0);
    const had = subs();
    w = days(w, 30);
    expect(subs()).toBeLessThan(had);
  });

  it('a country at peace loses nothing, and a landlocked one never does', () => {
    const w = days(as('United Kingdom'), 5);
    expect(w.economies['United Kingdom'].blockade).toBe(0);
    expect(economyView(w, 'Switzerland').blockade).toBe(0);
  });
});

describe('troops by sea', () => {
  it('ships a division to a friendly shore in a few days', () => {
    let w = as('France');
    const u = w.units.find((x) => x.owner === 'France' && isCoastal(x.at) && PROVINCES[x.at].name !== 'Corsica')!;
    const plan = shipPlan(w, seen(w).sea, friends(w), u, id('Corsica'));
    expect('days' in plan && plan.landing).toBe(false);
    expect('days' in plan && plan.days).toBeGreaterThanOrEqual(TRANSPORT_DAYS);
    w = give(w, { type: 'ship', unit: u.id, to: id('Corsica') });
    expect(w.units.find((x) => x.id === u.id)!.sea?.to).toBe(id('Corsica'));
    w = days(w, ('days' in plan ? plan.days : 0) + 1);
    expect(w.units.find((x) => x.id === u.id)!.at).toBe(id('Corsica'));
  });

  it('refuses neutral shores, inland provinces and seas the enemy controls', () => {
    let w = as('Germany');
    const u = w.units.find((x) => x.owner === 'Germany' && COAST[x.at].includes(z('north')))!;
    const why = (to: string) => {
      const p = shipPlan(w, seen(w).sea, friends(w), u, id(to));
      return 'why' in p ? p.why : '';
    };
    expect(why('Normandy')).toMatch(/neutral/);
    expect(why('Bavaria')).toMatch(/no coast/);
    w = war(w, 'Germany', 'United Kingdom');
    expect(why('London')).toMatch(/control the sea|enemy controls/);
  });

  it('a landing needs control of the sea, two weeks, and comes ashore fighting at 60%', () => {
    let w = war(as('United Kingdom'), 'United Kingdom', 'Germany');
    w = days(w, 20); // the Home Fleet clears the North Sea
    const u = w.units.find((x) => x.owner === 'United Kingdom' && COAST[x.at].includes(z('north')))!;
    const target = SHORES[z('north')].find((p) => w.controller[p] === 'Germany')!;
    const plan = shipPlan(w, seen(w).sea, friends(w), u, target);
    expect('days' in plan && plan.landing).toBe(true);
    expect('days' in plan && plan.days).toBeGreaterThanOrEqual(LANDING_PREP_DAYS);
    w = give(w, { type: 'ship', unit: u.id, to: target });
    // Halt cancels it.
    expect(give(w, { type: 'halt', unit: u.id }).units.find((x) => x.id === u.id)!.sea).toBeUndefined();
    expect(AMPHIBIOUS).toBe(0.6);
    const edges = combatEdges(w.economies);
    const ashore = edges.attack({ ...u, landing: true });
    expect(ashore / edges.attack(u)).toBeCloseTo(AMPHIBIOUS, 9);
  });

  it('a port on an open sea keeps overseas troops in supply; a blockaded one does not', () => {
    let w = war(as('Italy'), 'Italy', 'United Kingdom');
    const tripoli = PROVINCES.find((p) => w.controller[p.id] === 'Italy' && p.centre[1] < 34 && isCoastal(p.id))!.id;
    const open = linkedProvinces(w.controller, 'Italy', friends(w).get('Italy'), seen(w).sea);
    expect(open[tripoli]).toBe(true);
    // Sink the Italian navy and give Britain every sea.
    w = { ...w, fleets: w.fleets.filter((f) => f.owner !== 'Italy').map((f) => (f.owner === 'United Kingdom' && f.zone === 'eastmed' ? { ...f, zone: 'centralmed' } : f)) };
    const shut = linkedProvinces(w.controller, 'Italy', friends(w).get('Italy'), seen(w).sea);
    const coasts = COAST[tripoli].map((i) => seen(w).sea.status('Italy', i));
    if (coasts.every((s) => s === 'enemy')) expect(shut[tripoli]).toBe(false);
    expect(seen(w).sea.status('Italy', z('centralmed'))).toBe('enemy');
  });
});

describe('the air force', () => {
  it('gives the side that controls the sky a 15% edge in a land battle', () => {
    let w = war(as('Germany'), 'Germany', 'Poland');
    const at = id('Poznań');
    const from = PROVINCES[at].neighbours.find((n) => w.controller[n] === 'Germany')!;
    w = { ...w, units: [unit('Germany', from, 1), unit('Poland', at, 2)].map((u) => (u.owner === 'Germany' ? { ...u, path: [at] } : u)) };
    const air = seen(w).air;
    const sky = air.battle(['Germany'], ['Poland'], at);
    expect([1 - AIR_EDGE, 1, 1 + AIR_EDGE]).toContain(sky);
    // Ground every Polish wing: the sky is Germany's.
    w = { ...w, wings: w.wings.map((x) => (x.owner === 'Poland' ? { ...x, mission: 'rest' as const } : x.owner === 'Germany' ? { ...x, base: from } : x)) };
    expect(seen(w).air.battle(['Germany'], ['Poland'], at)).toBe(1 + AIR_EDGE);
    expect(seen(w).air.battle(['Poland'], ['Germany'], at)).toBe(1 - AIR_EDGE);
    const plain = outlookAt(w, at)!;
    const withAir = outlookAt(w, at, seen(w).air.battle)!;
    expect(withAir.attack / plain.attack).toBeCloseTo(1 + AIR_EDGE, 6);
    expect(withAir.defence / plain.defence).toBeCloseTo(1 - AIR_EDGE, 6);
  });

  it('moves a wing to a friendly base only, and it cannot fly for a few days', () => {
    let w = as('France');
    const wing = w.wings.find((x) => x.owner === 'France')!;
    w = give(w, { type: 'wing', wing: wing.id, base: id('Berlin') });
    expect(w.wings.find((x) => x.id === wing.id)!.base).toBe(wing.base);
    w = give(w, { type: 'wing', wing: wing.id, base: id('Lorraine'), mission: 'rest' });
    const moved = w.wings.find((x) => x.id === wing.id)!;
    expect(moved.base).toBe(id('Lorraine'));
    expect(moved.ready).toBe(w.day + REBASE_DAYS);
    expect(moved.mission).toBe(wing.type === 'fighter' ? 'rest' : 'rest');
    // A fighter cannot be told to bomb.
    const fighter = w.wings.find((x) => x.owner === 'France' && x.type === 'fighter')!;
    expect(give(w, { type: 'wing', wing: fighter.id, mission: 'strategic' }).wings.find((x) => x.id === fighter.id)!.mission).toBe(fighter.mission);
  });

  it('strategic bombing puts factories out of action and they come back when it stops', () => {
    let w = war(as('United Kingdom'), 'United Kingdom', 'Germany');
    const bombers = w.wings.filter((x) => x.owner === 'United Kingdom' && x.type === 'bomber');
    w = give(w, ...bombers.map((x) => ({ type: 'wing', wing: x.id, base: id('London'), mission: 'strategic' }) as Order));
    w = days(w, REBASE_DAYS + 1);
    const target = bombTarget(w, w.wings.find((x) => x.id === bombers[0].id)!);
    expect(target).toBeGreaterThanOrEqual(0);
    expect(atWar(w, 'United Kingdom', w.controller[target])).toBe(true);
    w = days(w, 30);
    const damage = Object.values(w.bombed).reduce((a, b) => a + b, 0);
    expect(damage).toBeGreaterThan(0);
    expect(Math.max(...Object.values(w.bombed))).toBeLessThanOrEqual(0.5);
    w = give(w, ...bombers.map((x) => ({ type: 'wing', wing: x.id, mission: 'rest' }) as Order));
    w = days(w, 60);
    expect(Object.values(w.bombed).reduce((a, b) => a + b, 0)).toBeLessThan(damage);
  });

  it('builds aircraft on a production line and forms them into a new wing', () => {
    let w = as('France');
    expect(cannotRaiseWing(w.economies.France, 'fighter')).toMatch(/aircraft/);
    w = give(w, { type: 'setLine', country: 'France', unit: 'infantry', factories: 0 }, { type: 'setLine', country: 'France', unit: 'fighter', factories: 4 });
    expect(w.economies.France.lines.fighter.factories).toBe(4);
    const had = w.wings.filter((x) => x.owner === 'France').length;
    for (let d = 0; d < 120 && w.economies.France.stock.fighter < 1; d++) w = step(w);
    expect(w.economies.France.stock.fighter).toBeGreaterThanOrEqual(1);
    w = give(w, { type: 'raiseWing', country: 'France', plane: 'fighter' });
    expect(w.wings.filter((x) => x.owner === 'France')).toHaveLength(had + 1);
    expect(w.economies.France.stock.fighter).toBeLessThan(1);
  });

  it('a finished warship joins a fleet off the home coast', () => {
    let w = as('United Kingdom');
    const escorts = () => w.fleets.filter((f) => f.owner === 'United Kingdom').reduce((a, f) => a + f.ships.escort, 0);
    const had = escorts();
    w = { ...w, economies: { ...w.economies, 'United Kingdom': { ...w.economies['United Kingdom'], stock: { ...w.economies['United Kingdom'].stock, escort: 1.2 } } } };
    w = step(w);
    expect(escorts()).toBeCloseTo(had + 1, 6);
  });
});

describe('research and surrender', () => {
  it('has a navy branch and an air branch', () => {
    expect(BRANCHES.map((b) => b.id)).toEqual(expect.arrayContaining(['navy', 'air']));
    expect(TECHS.filter((t) => t.branch === 'navy')).toHaveLength(4);
    expect(TECHS.filter((t) => t.branch === 'air')).toHaveLength(4);
  });

  it('a country whose capital has fallen gives up sooner', () => {
    expect(SURRENDER_SHARE_NO_CAPITAL).toBeLessThan(0.6);
  });
});

describe('the war at sea and in the air (bot playtest, every country led by the AI)', () => {
  it('plays the same war twice from the same seed, and survives being saved and loaded', () => {
    const run = (seed: string) => {
      let w = war(quiet(newWorld('freeForAll', seed)), 'Germany', 'United Kingdom');
      w = war(w, 'Italy', 'United Kingdom');
      for (let d = 0; d < 150; d++) w = advance(w);
      return w;
    };
    const a = run('stage-g-war');
    expect(run('stage-g-war')).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(advance(JSON.parse(JSON.stringify(a)))).toEqual(advance(a));
    // Something happened at sea and in the air, and nobody's numbers went wrong.
    expect(a.forceLog.length).toBeGreaterThan(0);
    for (const f of a.fleets) for (const n of Object.values(f.ships)) expect(n).toBeGreaterThanOrEqual(0);
    for (const x of a.wings) {
      expect(x.strength).toBeGreaterThan(0);
      expect(x.strength).toBeLessThanOrEqual(100);
    }
    expect(a.economies['United Kingdom'].blockade).toBeGreaterThanOrEqual(0);
    expect(a.economies['United Kingdom'].blockade).toBeLessThanOrEqual(1);
  });
});
