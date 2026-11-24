import { describe, expect, it } from 'vitest';
import { AID_ROUTES, aiLendLeaseOrder, AMERICA, americaAwake, dayOf, pearlHarbor, recipients, shipAid, torch, US } from '../src/sim/america';
import { ATLANTIC, DOMINIONS, STORY_ASLEEP } from '../src/sim/countries';
import { allianceMap, allied, cannotDeclare, cannotGuarantee, type DipDraft } from '../src/sim/diplomacy';
import { economyView, giveEconomyOrder, LEND_LEASE_MAX } from '../src/sim/economy';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { navalPicture } from '../src/sim/navy';
import { OPERATIONS, onlyOperations } from '../src/sim/operations';
import { ZONES } from '../src/sim/sea';
import type { World } from '../src/sim/types';
import { atWar, warKey } from '../src/sim/war';
import { newWorld, step } from '../src/sim/world';

const id = (name: string) => provinceByName(name).id;
/** A copy of a world that the functions of america.ts may change, as step() would. */
const draft = (w: World): World & DipDraft => JSON.parse(JSON.stringify(w));
const at = (w: World, date: string): World => ({ ...w, day: dayOf(w.startDate, date) });
const war = (w: World, ...pairs: [string, string][]): World => ({ ...w, wars: [...w.wars, ...pairs.map(([a, b]) => warKey(a, b))] });

describe('America and the Dominions in Story mode (1.9)', () => {
  const w = newWorld('story', 'atlantic');

  it('wakes America and the Dominions, and makes America a great power held back by its neutrality', () => {
    for (const c of ATLANTIC) expect(STORY_ASLEEP).not.toContain(c);
    expect(americaAwake(w)).toBe(true);
    expect(cannotDeclare(w, US, 'Germany')).toMatch(/Congress will not vote for war/);
    expect(cannotGuarantee(w, US, 'Poland')).toMatch(/Neutrality Acts/);
    expect(economyView(w, US).warSupportReasons.some((r) => /stay out/.test(r.text) && r.points < 0)).toBe(true);
    for (const d of DOMINIONS) expect(allied(w.diplomacy, 'United Kingdom', d)).toBe(true);
    // In Free-for-all America is a country like any other.
    expect(cannotDeclare(newWorld('freeForAll', 'atlantic-ffa'), US, 'Mexico')).toBeNull();
  });

  it('sends troops overseas only for its planned operations', () => {
    expect(onlyOperations(w, US)).toBe(true);
    expect(onlyOperations(w, 'United Kingdom')).toBe(false);
    expect(onlyOperations({ ...w, player: US }, US)).toBe(false);
    for (const o of OPERATIONS.filter((x) => ATLANTIC.includes(x.by))) expect(o.targets.length, o.id).toBeGreaterThan(0);
  });

  it('ships arms only to countries fighting the Axis, from the real dates, by routes across the sea', () => {
    expect(recipients(w)).toEqual([]);
    let x = war(at(w, '1940-01-10'), ['United Kingdom', 'Germany'], ['France', 'Germany']);
    x = { ...x, story: { ...x.story, fired: [...x.story.fired, 'cash-and-carry'] } };
    expect(recipients(x)).toEqual([{ to: 'United Kingdom', pays: true }, { to: 'France', pays: true }]);
    const later = war(at({ ...x, story: { ...x.story, fired: [...x.story.fired, 'lend-lease-act'] } }, '1941-11-01'), ['Soviet Union', 'Germany'], ['Japan', 'China']);
    expect(recipients(later).map((r) => r.to)).toEqual(['United Kingdom', 'France', 'Soviet Union', 'China']);
    expect(recipients(later).every((r) => !r.pays)).toBe(true);
    // Every route is a chain of neighbouring sea zones, and the Arctic one ends off Murmansk.
    for (const r of AID_ROUTES) for (let i = 1; i < r.zones.length; i++) expect(ZONES[r.zones[i - 1]].neighbours, r.id).toContain(r.zones[i]);
    expect(ZONES[AID_ROUTES.find((r) => r.id === 'arctic')!.zones.at(-1)!].id).toBe('barents');
  });

  it('sets aside a share of what the arms factories make, and the convoys deliver it, less what raiders sink', () => {
    const e = w.economies[US];
    const d = draft(war(at(w, '1941-06-30'), ['United Kingdom', 'Germany']));
    d.story.fired = [...d.story.fired, 'lend-lease-act'];
    const v = economyView(d, US);
    const order = aiLendLeaseOrder(d, v.lineRate);
    expect(order?.type).toBe('setLendLease');
    giveEconomyOrder(d, [], { type: 'setLendLease', country: US, share: 0.9 });
    expect(d.economies[US].lendLease).toBe(LEND_LEASE_MAX);
    // A month's aid waiting, and German submarines raiding the Western Approaches.
    d.economies[US].aid = { infantry: 2, fighter: 1, capital: 0.5 };
    d.fleets.push({ id: 999, owner: 'Germany', name: 'U-boats', zone: 'approaches', mission: 'raid', ships: { capital: 0, escort: 0, submarine: 20 }, arrives: 0 });
    const friends = allianceMap(d.diplomacy);
    const before = { inf: d.economies['United Kingdom'].stock.infantry, cap: d.economies[US].stock.capital };
    shipAid(d, navalPicture(d, friends), friends);
    const s = d.story.lendLease!;
    expect(s.shipments.map((x) => x.route)).toEqual(['atlantic']);
    expect(s.shipments[0].sunk).toBeGreaterThan(0);
    expect(s.shipments[0].sunk).toBeLessThan(s.shipments[0].sent);
    const got = d.economies['United Kingdom'].stock.infantry - before.inf;
    expect(got).toBeGreaterThan(0);
    expect(got).toBeLessThan(2);
    // Nobody asked for capital ships: they go back to America's own stock.
    expect(d.economies[US].stock.capital - before.cap).toBeCloseTo(0.5);
    expect(d.economies[US].aid).toEqual({});
    expect(e.aid).toBeUndefined();
  });

  it('makes Britain and France pay under Cash and Carry', () => {
    const d = draft(war(at(w, '1940-01-31'), ['United Kingdom', 'Germany'], ['France', 'Germany']));
    d.story.fired = [...d.story.fired, 'cash-and-carry'];
    d.economies[US].aid = { fighter: 2 };
    const treasury = { uk: d.economies['United Kingdom'].treasury, us: d.economies[US].treasury };
    const friends = allianceMap(d.diplomacy);
    shipAid(d, navalPicture(d, friends), friends);
    const paid = d.story.lendLease!.shipments.reduce((a, x) => a + (x.paid ?? 0), 0);
    expect(paid).toBeGreaterThan(0);
    expect(d.economies['United Kingdom'].treasury).toBeLessThan(treasury.uk);
    expect(d.economies[US].treasury).toBeGreaterThan(treasury.us);
  });

  it('after Pearl Harbor, Germany and Italy declare war on America, which joins the Allies', () => {
    const d = draft(war(at(w, '1941-12-11'), ['United Kingdom', 'Germany'], ['United Kingdom', 'Italy'], ['Soviet Union', 'Germany']));
    d.diplomacy.pacts.push({ kind: 'alliance', a: 'Germany', b: 'Italy', since: 0 });
    pearlHarbor(d);
    expect(d.story.fired).toEqual(expect.arrayContaining(['pearl-harbor', 'axis-declares']));
    expect(atWar(d, 'Germany', US)).toBe(true);
    expect(atWar(d, 'Italy', US)).toBe(true);
    expect(allied(d.diplomacy, US, 'United Kingdom')).toBe(true);
    expect(allied(d.diplomacy, US, 'Soviet Union')).toBe(true);
    expect(economyView(d, US).warSupportReasons.some((r) => /Pearl Harbor/.test(r.text))).toBe(true);
  });

  it('Torch hands French North Africa to the Allies; Germany takes Tunisia and the rest of France', () => {
    const d = draft(war(at(w, AMERICA.torch), ['United States', 'Germany'], ['United Kingdom', 'Germany']));
    d.story.armistice = ['France'];
    d.economies.Germany.government = 'fascist';
    torch(d);
    expect(d.story.fired).toContain('torch');
    for (const n of ['Oran', 'Constantine', 'Fez', 'Rabat', 'Marrakech']) expect(d.controller[id(n)], n).toBe(US);
    expect(d.controller[id('Tunisia')]).toBe('Germany');
    expect(d.controller[id('Provence')]).toBe('Germany');
    expect(d.units.filter((u) => u.owner === US && PROVINCES[u.at].owner === 'France').length).toBeGreaterThan(0);
    expect(d.units.some((u) => u.owner === 'Germany' && u.at === id('Tunisia'))).toBe(true);
    expect(d.fleets.filter((f) => f.owner === 'France').every((f) => f.ships.capital + f.ships.escort + f.ships.submarine === 0)).toBe(true);
  });

  it('asks an American player about Cash and Carry on its real date', () => {
    let x = war(at(newWorld('story', 'atlantic-player', '1936-01-01', US), AMERICA.cashAndCarry), ['United Kingdom', 'Germany']);
    x = step(x);
    expect(x.diplomacy.decisions.some((q) => q.country === US && q.event === 'cash-and-carry')).toBe(true);
    // An American player decides; the AI does not do it for them.
    expect(x.story.fired).not.toContain('cash-and-carry-done');
    expect(x.economies[US].lendLease ?? 0).toBe(0);
  });
});
