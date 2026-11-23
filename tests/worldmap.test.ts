import { describe, expect, it } from 'vitest';
import { COUNTRIES, EUROPE_COUNTRIES, STORY_ASLEEP, WORLD_COUNTRIES } from '../src/sim/countries';
import { cannotDeclare, capitulate, wake } from '../src/sim/diplomacy';
import { daysToEnter, EUROPE_SIZE, findRoute, OUTPOST, PROVINCES, provinceByName } from '../src/sim/map';
import { newGame } from '../src/sim/scenario';
import { COAST, EUROPE_ZONES, sailDays, ZONE_INDEX, zonePath, ZONES } from '../src/sim/sea';
import type { UnitType, World } from '../src/sim/types';
import { upgradeWorld } from '../src/sim/upgrade';
import { linkedProvinces } from '../src/sim/supply';
import { pictures } from '../src/sim/forces';
import { allianceMap } from '../src/sim/diplomacy';
import { europeanSeas } from '../src/sim/sea';
import { newWorld, step } from '../src/sim/world';

const id = (name: string) => provinceByName(name).id;
const z = (zone: string) => ZONE_INDEX[zone];

describe('the world map (1.7)', () => {
  it('adds the rest of the world after the 280 provinces of the Europe-only map', () => {
    expect(EUROPE_SIZE).toBe(280);
    expect(COUNTRIES).toHaveLength(EUROPE_COUNTRIES + WORLD_COUNTRIES.length);
    expect(COUNTRIES.length).toBe(71);
    expect(provinceByName('Tokyo').owner).toBe('Japan');
    expect(provinceByName('Tokyo').capital).toBe(true);
    expect(provinceByName('Washington').owner).toBe('United States');
    expect(provinceByName('Nanking').owner).toBe('China');
    expect(provinceByName('Manila').owner).toBe('United States'); // the Philippines were American in 1936
    expect(provinceByName('Seoul').owner).toBe('Japan'); // Korea was Japanese from 1910
    expect(provinceByName('Hsinking').owner).toBe('Manchukuo');
    expect(provinceByName('Singapore').owner).toBe('United Kingdom');
    expect(provinceByName('Batavia').owner).toBe('Netherlands');
    expect(provinceByName('Hanoi').owner).toBe('France');
    expect(provinceByName('Pearl Harbor').id).toBeGreaterThanOrEqual(EUROPE_SIZE);
    for (const p of PROVINCES.slice(EUROPE_SIZE)) expect(p.id).toBeGreaterThanOrEqual(EUROPE_SIZE);
  });

  it('gives the outposts of the old countries (India, Siberia, Indochina) no victory points, industry or starting divisions', () => {
    const w = newWorld('story', 'outposts');
    const outposts = PROVINCES.filter((p) => OUTPOST[p.id]);
    expect(outposts.length).toBeGreaterThan(100);
    for (const p of outposts) {
      expect(p.victoryPoints, p.name).toBe(0);
      expect(w.factories.civ[p.id] + w.factories.mil[p.id], p.name).toBe(0);
    }
    for (const u of w.units) if (COUNTRIES.findIndex((c) => c.name === u.owner) < EUROPE_COUNTRIES) expect(u.at, u.owner).toBeLessThan(EUROPE_SIZE);
    expect(OUTPOST[id('Vladivostok')]).toBe(true);
    expect(OUTPOST[id('Tokyo')]).toBe(false);
  });

  it('places the new countries with their 1936 armies, and in Story mode keeps all but East Asia out of the war', () => {
    const w = newWorld('story', 'asleep');
    expect(w.asleep).toEqual(STORY_ASLEEP);
    expect(w.asleep).not.toContain('Japan');
    expect(w.asleep).toContain('United States');
    expect(w.units.filter((u) => u.owner === 'Japan')).toHaveLength(24);
    expect(w.units.filter((u) => u.owner === 'China')).toHaveLength(83);
    expect(w.fleets.some((f) => f.owner === 'Japan' && f.zone === 'japanwaters')).toBe(true);
    expect(cannotDeclare(w, 'Soviet Union', 'United States')).toMatch(/stays out of the war/);
    // Asleep countries do not run their economies.
    let later = w;
    for (let d = 0; d < 40; d++) later = step(later);
    expect(later.economies['United States'].treasury).toBe(w.economies['United States'].treasury);
    expect(later.economies.Japan.treasury).not.toBe(w.economies.Japan.treasury);
    expect(later.economies.Germany.treasury).not.toBe(w.economies.Germany.treasury);
  });

  it('wakes the whole world in Free-for-all, and Japan can go to war with China', () => {
    const w = newWorld('freeForAll', 'awake');
    expect(w.asleep).toEqual([]);
    expect(cannotDeclare(w, 'Japan', 'China')).toBeNull();
    const ffa = newGame({ mode: 'freeForAll', start: '1936', player: 'Japan', seed: 'ffa' });
    expect(ffa.asleep).toEqual([]);
    const woken = wake(newWorld('story', 'wake'), ['Japan', 'China']);
    expect(woken.asleep).not.toContain('Japan');
    expect(woken.asleep).toContain('United States');
    expect(woken.diplomacy.relations['China|Japan']).toBeDefined();
  });

  it('keeps colonies with their owner when the homeland surrenders', () => {
    const w = newWorld('story', 'colonies');
    const d = { ...w, units: [...w.units], controller: [...w.controller], owner: [...w.owner], wars: ['France|Germany'], capitulated: [...w.capitulated], declaredBy: {}, economies: w.economies, diplomacy: { ...w.diplomacy, conquered: {}, owed: {}, aims: {}, warStart: {}, pacts: [...w.diplomacy.pacts], log: [] } };
    capitulate(d as never, 'France', 'Germany');
    expect(d.controller[id('Paris')]).toBe('Germany');
    expect(d.controller[id('Algiers')]).toBe('Germany'); // on the Europe-only map, as before
    expect(d.controller[id('Hanoi')]).toBe('France');
    expect(d.controller[id('Dakar')]).toBe('France');
  });
});

describe('colonies and Siberia are supplied on their own', () => {
  it('a depot in Siberia does not feed European Russia, and one in Batavia does not feed Dutch ports in Europe', () => {
    const w = newWorld('story', 'depots');
    const controller = [...w.controller];
    controller[id('Moscow')] = 'Germany';
    const soviet = linkedProvinces(controller, 'Soviet Union');
    expect(soviet[id('Molotov')]).toBe(true); // Siberia has its own depot
    expect(soviet[id('Arkhangelsk')]).toBe(false); // next to it, but on the old map: cut off with Moscow gone
    controller[id('Holland')] = 'Germany';
    const sea = pictures(w, allianceMap(w.diplomacy)).sea;
    const dutch = linkedProvinces(controller, 'Netherlands', undefined, sea);
    expect(dutch[id('Batavia')]).toBe(true);
    for (const p of PROVINCES.slice(0, EUROPE_SIZE)) if (p.owner === 'Netherlands' && controller[p.id] === 'Netherlands') expect(dutch[p.id], p.name).toBe(false);
  });

  it("the AI of the old map sees the oceans as closed in its wars, so it ships over Europe's seas only", () => {
    const w = newWorld('story', 'seas');
    const sea = europeanSeas(pictures(w, allianceMap(w.diplomacy)).sea);
    expect(sea.status('United Kingdom', z('north'))).not.toBe('enemy');
    expect(sea.status('United Kingdom', z('hawaii'))).toBe('enemy');
  });
});

describe('route finding', () => {
  /** The old way: scan every province for the cheapest one not yet done. */
  function scan(from: number, to: number, type: UnitType): number[] | null {
    if (from === to) return [];
    const days = new Array<number>(PROVINCES.length).fill(Infinity);
    const prev = new Array<number>(PROVINCES.length).fill(-1);
    const done = new Array<boolean>(PROVINCES.length).fill(false);
    days[from] = 0;
    for (;;) {
      let here = -1;
      for (let i = 0; i < days.length; i++) if (!done[i] && days[i] < Infinity && (here < 0 || days[i] < days[here])) here = i;
      if (here < 0) return null;
      if (here === to) break;
      done[here] = true;
      for (const next of PROVINCES[here].neighbours) {
        const d = days[here] + daysToEnter(here, next, type);
        if (d < days[next]) (days[next] = d), (prev[next] = here);
      }
    }
    const route: number[] = [];
    for (let p = to; p !== from; p = prev[p]) route.unshift(p);
    return route;
  }

  it('finds exactly the routes the old scan found, faster', () => {
    const pairs: [string, string][] = [['Paris', 'Moscow'], ['Madrid', 'Baghdad'], ['Berlin', 'Rome'], ['Tokyo', 'Kyūshū'], ['Nanking', 'Moscow'], ['Washington', 'Mexico City'], ['London', 'Paris'], ['Lisbon', 'Vladivostok']];
    for (const [a, b] of pairs) for (const type of ['infantry', 'armour'] as UnitType[]) expect(findRoute(id(a), id(b), type), `${a} to ${b}`).toEqual(scan(id(a), id(b), type));
  });
});

describe('the oceans', () => {
  it('keeps 2 days a zone around Europe and takes longer across the oceans', () => {
    expect(EUROPE_ZONES).toBe(17);
    expect(sailDays(zonePath(z('north'), z('westmed'))!)).toBe(2 * (zonePath(z('north'), z('westmed'))!.length - 1));
    const toHawaii = sailDays([z('westcoast'), z('hawaii')]);
    expect(toHawaii).toBeGreaterThanOrEqual(6);
    expect(toHawaii).toBeLessThanOrEqual(10);
    // Through Suez to India is far quicker than round Africa.
    const suez = zonePath(z('eastmed'), z('arabian'))!;
    expect(suez.map((i) => ZONES[i].id)).toContain('redsea');
    expect(COAST[id('Pearl Harbor')]).toContain(z('hawaii'));
    expect(COAST[id('Tokyo')].length).toBeGreaterThan(0);
  });
});

describe('saves from 1.7, before the war in China', () => {
  it('keep East Asia out of their war for good, as it was when they were saved', () => {
    const saved: World = { ...newWorld('story', 'save-1.7'), asleep: [...WORLD_COUNTRIES] };
    let w = upgradeWorld(saved);
    for (let d = 0; d < 40; d++) w = step(w);
    expect(w.asleep).toContain('Japan');
    expect(w.economies.Japan.treasury).toBe(saved.economies.Japan.treasury);
    expect(w.wars.some((k) => k.includes('Japan'))).toBe(false);
  });
});

describe('saves from before the world map (1.6 and earlier)', () => {
  it('load as Europe-only games: the rest of the world is added asleep', () => {
    const now = newWorld('story', 'europe-save');
    const old: World = {
      ...now,
      controller: now.controller.slice(0, EUROPE_SIZE),
      owner: now.owner.slice(0, EUROPE_SIZE),
      factories: { civ: now.factories.civ.slice(0, EUROPE_SIZE), mil: now.factories.mil.slice(0, EUROPE_SIZE) },
      replay: { ...now.replay!, base: now.controller.slice(0, EUROPE_SIZE), now: now.controller.slice(0, EUROPE_SIZE) },
      units: now.units.filter((u) => u.at < EUROPE_SIZE && COUNTRIES.findIndex((c) => c.name === u.owner) < EUROPE_COUNTRIES),
      fleets: now.fleets.filter((f) => ZONE_INDEX[f.zone] < EUROPE_ZONES),
      wings: now.wings.filter((x) => x.base < EUROPE_SIZE),
      economies: Object.fromEntries(Object.entries(now.economies).filter(([name]) => !WORLD_COUNTRIES.includes(name))),
      asleep: undefined,
    };
    const up = upgradeWorld(old);
    expect(up.europeOnly).toBe(true);
    expect(up.asleep).toEqual(WORLD_COUNTRIES);
    for (const xs of [up.controller, up.owner, up.factories.civ, up.factories.mil, up.replay!.base, up.replay!.now]) expect(xs).toHaveLength(PROVINCES.length);
    expect(up.controller[id('Tokyo')]).toBe('Japan');
    expect(up.economies.Japan).toBeDefined();
    expect(up.units.some((u) => u.owner === 'Japan')).toBe(true);
    expect(new Set(up.units.map((u) => u.id)).size).toBe(up.units.length);
    expect(new Set([...up.fleets, ...up.wings].map((x) => x.id)).size).toBe(up.fleets.length + up.wings.length);
    expect(Math.max(...up.units.map((u) => u.id))).toBeLessThan(up.nextUnitId);
    let w = up;
    for (let d = 0; d < 5; d++) w = step(w);
    expect(w.controller).toHaveLength(PROVINCES.length);
  });
});
