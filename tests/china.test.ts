import { describe, expect, it } from 'vitest';
import { allied, isIncident, startIncident, surrenders } from '../src/sim/diplomacy';
import { economyView, tallies } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { provinceByName } from '../src/sim/map';
import { reachOf } from '../src/sim/operations';
import type { World } from '../src/sim/types';
import { atWar, realEnemiesOf } from '../src/sim/war';
import { newWorld, step } from '../src/sim/world';

const id = (name: string) => provinceByName(name).id;
const day = (w: World, date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${w.startDate}T00:00:00Z`)) / 86400000);
const draft = (w: World) => ({ ...w, units: [...w.units], controller: [...w.controller], owner: [...w.owner], wars: [...w.wars], capitulated: [...w.capitulated], declaredBy: { ...w.declaredBy }, diplomacy: { ...w.diplomacy, aims: { ...w.diplomacy.aims }, warStart: { ...w.diplomacy.warStart }, pacts: [...w.diplomacy.pacts], log: [...w.diplomacy.log], conquered: { ...w.diplomacy.conquered } } });

describe('East Asia in Story mode (1.8)', () => {
  it('is awake from the start, with the Kwantung Army in Manchukuo and the old alliances', () => {
    const w = newWorld('story', 'asia');
    for (const c of ['Japan', 'China', 'Manchukuo', 'Chinese Communists', 'Mongolia']) expect(w.asleep).not.toContain(c);
    expect(w.units.filter((u) => u.owner === 'Japan' && w.owner[u.at] === 'Manchukuo').length).toBeGreaterThanOrEqual(5);
    expect(allied(w.diplomacy, 'Japan', 'Manchukuo')).toBe(true);
    expect(allied(w.diplomacy, 'Soviet Union', 'Mongolia')).toBe(true);
    expect(allied(w.diplomacy, 'China', 'Chinese Communists')).toBe(false);
  });

  it('fights border incidents for a few provinces, with no world crisis, and ends them on their day', () => {
    const w = newWorld('story', 'incident');
    const d = draft(w);
    const tension = d.diplomacy.tension;
    startIncident(d as never, ['Japan'], ['Soviet Union'], [id('Primorye')], 14, 'test');
    expect(atWar(d as never, 'Japan', 'Soviet Union')).toBe(true);
    expect(isIncident(d.diplomacy, 'Japan|Soviet Union')).toBe(true);
    expect(d.diplomacy.tension).toBe(tension);
    // No home front goes to war for an incident.
    expect(realEnemiesOf(d as never, 'Japan')).toEqual([]);
    let x = d as unknown as World;
    for (let i = 0; i < 16; i++) x = step(x);
    expect(atWar(x, 'Japan', 'Soviet Union')).toBe(false);
    expect(x.controller[id('Primorye')]).toBe('Soviet Union');
  });

  it("limits Japan's AI to the provinces it really took, by date, but not a player", () => {
    const w = newWorld('story', 'reach');
    const in1937 = { ...w, day: day(w, '1937-08-01') };
    const r = reachOf(in1937, 'Japan', 'China')!;
    expect(r.has(id('Shanghai'))).toBe(true);
    expect(r.has(id('Hupeh'))).toBe(false);
    expect(r.has(id('Chungking'))).toBe(false);
    expect(reachOf({ ...w, day: day(w, '1938-11-01') }, 'Japan', 'China')!.has(id('Hupeh'))).toBe(true);
    expect(reachOf({ ...in1937, player: 'Japan' }, 'Japan', 'China')).toBeNull();
    expect(reachOf(newWorld('freeForAll', 'reach'), 'Japan', 'China')).toBeNull();
  });

  it('loses its customs and its bond buyers with the ports, so it prints money', () => {
    const w = newWorld('story', 'customs');
    const before = economyView(w, 'China', tallies(w).get('China')!);
    const controller = [...w.controller];
    for (const p of ['Shanghai', 'Kiangsu', 'Peiping', 'Hopeh', 'Shantung', 'Kwangtung', 'Northern Chekiang', 'Fukien', 'Chekiang']) controller[id(p)] = 'Japan';
    const lost = { ...w, controller };
    const t = tallies(lost).get('China')!;
    expect(t.portsLost).toBeGreaterThan(0.7);
    const after = economyView(lost, 'China', t);
    expect(after.budget.taxes / after.nominalGDP).toBeLessThan(0.6 * (before.budget.taxes / before.nominalGDP));
    expect(after.bondCapacity / after.nominalGDP).toBeLessThan(0.4 * (before.bondCapacity / before.nominalGDP));
  });

  it('China fights on with most of its land lost, and the Communists while China does', () => {
    const w = newWorld('story', 'stand');
    const d = draft(w);
    d.wars.push('China|Japan', 'Chinese Communists|Japan');
    for (const p of ['Shanghai', 'Kiangsu', 'Peiping', 'Hupeh', 'Kwangtung', 'Shantung', 'Yenan']) d.controller[id(p)] = 'Japan';
    surrenders(d as never);
    expect(d.capitulated).not.toContain('China');
    expect(d.capitulated).not.toContain('Chinese Communists');
  });

  it('runs the same way twice from the same seed', () => {
    let a = newWorld('story', 'asia-same');
    let b = newWorld('story', 'asia-same');
    const to = day(a, '1937-09-15');
    while (a.day < to) (a = advance(a)), (b = advance(b));
    expect(atWar(a, 'Japan', 'China')).toBe(true);
    expect(JSON.stringify(a.units)).toBe(JSON.stringify(b.units));
    expect(a.controller).toEqual(b.controller);
  }, 60000);
});
