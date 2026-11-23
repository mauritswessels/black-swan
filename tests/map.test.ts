import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../src/sim/countries';
import { distanceKm, EUROPE_SIZE, findRoute, PROVINCES, provinceByName, routeDays } from '../src/sim/map';

describe('the 1936 map', () => {
  it('has about 600 provinces with unique names: the 280 of the Europe-only map first (183 before the finer map of version 1.5)', () => {
    expect(EUROPE_SIZE).toBe(280);
    expect(PROVINCES.length).toBeGreaterThanOrEqual(500);
    expect(PROVINCES.length).toBeLessThanOrEqual(650);
    expect(new Set(PROVINCES.map((p) => p.name)).size).toBe(PROVINCES.length);
    PROVINCES.forEach((p, i) => expect(p.id).toBe(i));
  });

  it('gives every province to a known country, and every country a capital', () => {
    const names = new Set(COUNTRIES.map((c) => c.name));
    for (const p of PROVINCES) expect(names.has(p.owner), `${p.name} belongs to ${p.owner}`).toBe(true);
    for (const c of COUNTRIES) expect(PROVINCES.filter((p) => p.owner === c.name && p.capital).length, `${c.name} capital`).toBe(1);
  });

  it('has neighbours that agree with each other', () => {
    for (const p of PROVINCES) {
      for (const n of p.neighbours) {
        expect(n).not.toBe(p.id);
        expect(PROVINCES[n].neighbours, `${PROVINCES[n].name} should list ${p.name}`).toContain(p.id);
      }
    }
  });

  it('shows the 1936 borders that differ from today', () => {
    expect(provinceByName('Silesia').owner).toBe('Germany');
    expect(provinceByName('Pomerania').owner).toBe('Germany');
    expect(provinceByName('East Prussia').owner).toBe('Germany');
    expect(provinceByName('Lwów').owner).toBe('Poland');
    expect(provinceByName('Kiev').owner).toBe('Soviet Union');
    expect(provinceByName('Bessarabia').owner).toBe('Romania');
    expect(provinceByName('Ruthenia').owner).toBe('Czechoslovakia');
    expect(provinceByName('Vienna').owner).toBe('Austria'); // Austria was independent until March 1938
    expect(provinceByName('Algiers').owner).toBe('France');
    expect(provinceByName('Tripolitania').owner).toBe('Italy');
  });

  it('keeps East Prussia cut off from the rest of Germany by Poland', () => {
    // East Prussia is two provinces now: Königsberg's, and Masuria.
    const eastPrussia = [provinceByName('East Prussia').id, provinceByName('Masuria').id];
    expect(provinceByName('Königsberg').id).toBe(eastPrussia[0]);
    const around = eastPrussia.flatMap((p) => PROVINCES[p].neighbours).filter((n) => !eastPrussia.includes(n));
    expect(around.some((n) => PROVINCES[n].owner === 'Germany')).toBe(false);
    expect(around.some((n) => PROVINCES[n].owner === 'Poland')).toBe(true);
  });

  it('cuts the big provinces into parts that together cover the old province, each named after a place in it', async () => {
    const data = (await import('../src/content/map/world1936.json')).default as unknown as { splitFrom: [number, number][] };
    expect(data.splitFrom.length).toBe(EUROPE_SIZE - 183);
    for (const [part, from] of data.splitFrom) {
      expect(part).toBeGreaterThanOrEqual(183);
      expect(from).toBeLessThan(183);
      expect(PROVINCES[part].owner).toBe(PROVINCES[from].owner);
      // A part touches the rest of the old province (or another part of it).
      const family = [from, ...data.splitFrom.filter(([, f]) => f === from).map(([p]) => p)];
      expect(PROVINCES[part].neighbours.some((n) => family.includes(n)), PROVINCES[part].name).toBe(true);
    }
    expect(provinceByName('Smolensk').owner).toBe('Soviet Union');
    expect(provinceByName('Alsace').owner).toBe('France');
    expect(provinceByName('Leningrad').city).toBe('Leningrad');
    expect(provinceByName('Kharkov').neighbours).toContain(provinceByName('Dnepropetrovsk').id);
  });

  it('joins the mainland into one piece, with islands apart', () => {
    const seen = new Set<number>([provinceByName('Paris').id]);
    const queue = [...seen];
    while (queue.length) for (const n of PROVINCES[queue.pop()!].neighbours) if (!seen.has(n)) (seen.add(n), queue.push(n));
    for (const name of ['Berlin', 'Moscow', 'Madrid', 'Rome', 'Istanbul', 'Oslo', 'Baghdad', 'Sicily', 'Cairo', 'Algiers']) expect(seen.has(provinceByName(name).id), name).toBe(true);
    for (const name of ['London', 'Sardinia', 'Crete', 'Malta']) expect(seen.has(provinceByName(name).id), name).toBe(false);
  });

  it('measures real distances', () => {
    const km = distanceKm(provinceByName('Paris').centre, provinceByName('Berlin').centre);
    expect(km).toBeGreaterThan(700);
    expect(km).toBeLessThan(1050);
  });
});

describe('route finding', () => {
  it('finds a land route from Paris to Berlin', () => {
    const paris = provinceByName('Paris').id;
    const berlin = provinceByName('Berlin').id;
    const route = findRoute(paris, berlin, 'infantry')!;
    expect(route[route.length - 1]).toBe(berlin);
    let here = paris;
    for (const next of route) {
      expect(PROVINCES[here].neighbours).toContain(next);
      here = next;
    }
    const days = routeDays(paris, route, 'infantry');
    expect(days).toBeGreaterThan(25);
    expect(days).toBeLessThan(80);
    expect(routeDays(paris, findRoute(paris, berlin, 'armour')!, 'armour')).toBeLessThan(days / 2);
  });

  it('finds no land route to an island', () => {
    expect(findRoute(provinceByName('Paris').id, provinceByName('London').id, 'infantry')).toBeNull();
  });
});
