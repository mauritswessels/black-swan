import { describe, expect, it } from 'vitest';
import { dayOf, toTheEnd } from '../src/sim/agenda';
import { aiOrders, frontsOf, HOME_SHARE } from '../src/sim/ai';
import { addPact, allied, fightsOn, LAST_STAND_SHARE, surrenders, type DipDraft } from '../src/sim/diplomacy';
import { advance } from '../src/sim/game';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { activeOperations, endedOperations, landedOperations, OPERATIONS } from '../src/sim/operations';
import { effectsOn, SHOCK } from '../src/sim/story';
import { supplyCapacity } from '../src/sim/supply';
import type { Unit, World } from '../src/sim/types';
import { atWar } from '../src/sim/war';
import { newWorld } from '../src/sim/world';

const id = (name: string) => provinceByName(name).id;
let next = 100000;
const div = (owner: string, where: string, more: Partial<Unit> = {}): Unit => ({ id: next++, owner, type: 'infantry', at: id(where), strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1, ...more });
/** A Story world on a given date, with these wars and nothing else changed. */
const storyOn = (date: string, wars: string[], player: string | null = null): World => {
  const w = newWorld('story', 'army-ai', '1936-01-01', player);
  return { ...w, day: dayOf(w.startDate, date), wars };
};
const news = (w: World) => w.diplomacy.log.map((e) => e.text);

describe('sharing the army between fronts', () => {
  const w = { ...newWorld('story', 'fronts'), wars: ['Germany|Poland'] };
  const army = w.units.filter((u) => u.owner === 'Germany').length;

  it('gives every front its guard, a war being planned too, and keeps a tenth of a big army at home', () => {
    const fronts = frontsOf(w, 'Germany', ['France']);
    const poland = fronts.find((f) => f.foe === 'Poland')!;
    const france = fronts.find((f) => f.foe === 'France')!;
    expect(poland.planned).toBe(false);
    expect(france.planned).toBe(true);
    for (const f of fronts) {
      expect(f.share, f.foe).toBeGreaterThanOrEqual(Math.min(f.guard, f.want));
      expect(f.guard, f.foe).toBeLessThanOrEqual(f.room);
    }
    // The planned front is only watched: a guard along its line, no more.
    expect(france.guard).toBe(france.provinces.length);
    const shared = fronts.reduce((a, f) => a + f.share, 0);
    expect(shared).toBeLessThanOrEqual(Math.floor(army * (1 - HOME_SHARE)));
  });

  it('sends the rest of the army to the war it is fighting, up to what that front can feed', () => {
    const poland = frontsOf(w, 'Germany', ['France']).find((f) => f.foe === 'Poland')!;
    expect(poland.share).toBeGreaterThan(poland.guard);
    expect(poland.room).toBe([...poland.provinces, ...poland.depth].reduce((a, p) => a + supplyCapacity(p), 0));
  });

  it('gives no orders to a country at peace with no war planned', () => {
    expect(aiOrders(newWorld('story', 'quiet'), 'Sweden')).toEqual([]);
  });
});

describe('operations overseas', () => {
  const husky = OPERATIONS.find((o) => o.id === 'op-husky')!;

  it('start on their real date, in Story mode, for a country the AI leads', () => {
    const w = storyOn('1943-07-10', ['Italy|United Kingdom', 'Germany|United Kingdom']);
    expect(activeOperations(w, 'United Kingdom').map((o) => o.id)).toContain('op-husky');
    expect(activeOperations({ ...w, day: w.day - 1 }, 'United Kingdom').map((o) => o.id)).not.toContain('op-husky');
    expect(activeOperations({ ...w, mode: 'freeForAll' }, 'United Kingdom')).toEqual([]);
    expect(activeOperations(storyOn('1943-07-10', w.wars, 'United Kingdom'), 'United Kingdom')).toEqual([]);
    // Not at war with Italy: Sicily waits.
    expect(husky.needs(storyOn('1943-07-10', ['Germany|United Kingdom']))).toMatch(/not at war with Italy/);
  });

  it('count as ashore only on the land they were meant for: holding Libya is not a landing in Italy', () => {
    const w = storyOn('1943-07-20', ['Italy|United Kingdom']);
    w.controller = [...w.controller];
    w.controller[id('Tripolitania')] = 'United Kingdom';
    expect(landedOperations(w, 'United Kingdom').map((o) => o.id)).not.toContain('op-husky');
    w.controller[id('Sicily')] = 'United Kingdom';
    expect(landedOperations(w, 'United Kingdom').map((o) => o.id)).toContain('op-husky');
  });

  it('call the Norway expedition home once the battle for France has gone on for a few weeks', () => {
    const w = storyOn('1940-05-20', ['Germany|Norway', 'Germany|United Kingdom', 'France|Germany']);
    const shock = (start: number) => ({ ...w, story: { ...w.story, effects: [{ id: 'shock', country: 'France', until: start + SHOCK.days, attack: SHOCK.power, defence: SHOCK.power, why: '' }] } });
    expect(endedOperations(shock(w.day - 10), 'United Kingdom').map((o) => o.id)).not.toContain('op-norway');
    expect(endedOperations(shock(w.day - 30), 'United Kingdom').map((o) => o.id)).toContain('op-norway');
    expect(activeOperations(shock(w.day - 30), 'United Kingdom').map((o) => o.id)).not.toContain('op-norway');
  });
});

describe('fighting to the end', () => {
  it('no negotiated peace with a fascist Germany in Story mode, except over a border war', () => {
    const w = storyOn('1941-07-01', ['Germany|Soviet Union']);
    expect(toTheEnd(w, 'Soviet Union', 'Germany')).toBe(true);
    expect(toTheEnd({ ...w, mode: 'freeForAll' }, 'Soviet Union', 'Germany')).toBe(false);
    expect(toTheEnd(w, 'Sweden', 'Norway')).toBe(false);
    const limited = { ...w, diplomacy: { ...w.diplomacy, aims: { 'Germany|Soviet Union': { by: 'Germany', provinces: [id('Minsk')] } } } };
    expect(toTheEnd(limited, 'Soviet Union', 'Germany')).toBe(false);
  });

  it('a small country fights on while a great ally has troops on its soil', () => {
    const w = storyOn('1940-04-20', ['Germany|Norway', 'Germany|United Kingdom']);
    const d = { ...w, controller: [...w.controller], diplomacy: { ...w.diplomacy, pacts: [...w.diplomacy.pacts] } } as unknown as DipDraft;
    addPact(d, 'alliance', 'United Kingdom', 'Norway');
    d.controller[id('Oslo')] = 'Germany';
    d.units = [div('Germany', 'Oslo'), div('Norway', 'Nordland')];
    expect(fightsOn(d, 'Norway')).toBe(false);
    d.units.push(div('United Kingdom', 'Nordland'));
    expect(fightsOn(d, 'Norway')).toBe(true);
    // Not a great power, which stands or falls on its own.
    expect(fightsOn(d, 'United Kingdom')).toBe(false);
  });

  it('the Soviet Union does not give up when Moscow falls to a fascist Germany', () => {
    const w = storyOn('1941-11-01', ['Germany|Soviet Union']);
    const d = { ...w, controller: [...w.controller], units: [], capitulated: [...w.capitulated] } as unknown as DipDraft;
    const taken = ['Moscow', 'Kiev', 'Novgorod', 'Minsk'];
    for (const n of taken) d.controller[id(n)] = 'Germany';
    const share = taken.reduce((a, n) => a + provinceByName(n).victoryPoints, 0) / PROVINCES.filter((p) => p.owner === 'Soviet Union').reduce((a, p) => a + p.victoryPoints, 0);
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(LAST_STAND_SHARE);
    surrenders(d);
    expect(d.capitulated).not.toContain('Soviet Union');
    const ffa = { ...d, mode: 'freeForAll', capitulated: [...w.capitulated], wars: [...d.wars] } as DipDraft;
    surrenders(ffa);
    expect(ffa.capitulated).toContain('Soviet Union');
  });
});

describe('Italy changes sides (Story mode)', () => {
  it('Mussolini falls once the Allies stand in Italy, and six weeks later Italy signs an armistice and Germany turns on it', () => {
    let w = storyOn('1943-07-26', ['Italy|United Kingdom', 'Germany|United Kingdom']);
    w.diplomacy = { ...w.diplomacy, agenda: Object.fromEntries(Object.keys(w.diplomacy.agenda).map((k) => [k, 'dropped'])), pacts: [...w.diplomacy.pacts] };
    addPact(w as unknown as DipDraft, 'alliance', 'Germany', 'Italy');
    w.controller = [...w.controller];
    w.controller[id('Sicily')] = 'United Kingdom';
    w.units = [...w.units.filter((u) => u.at !== id('Sicily')), div('United Kingdom', 'Sicily')];
    w = advance(w);
    expect(news(w).some((t) => /dismisses Mussolini/.test(t))).toBe(true);
    expect(effectsOn(w, 'Italy').map((x) => x.id)).toContain('italy-fall');
    expect(w.economies.Italy.government).toBe('authoritarian');
    // While the new government talks, Italy does not simply surrender.
    for (let i = 0; i < 50 && !w.story.fired.includes('italy-armistice'); i++) w = advance(w);
    expect(w.story.fired).toContain('italy-armistice');
    expect(news(w).some((t) => /Italy signs an armistice with the Allies and changes sides/.test(t))).toBe(true);
    expect(atWar(w, 'Italy', 'United Kingdom')).toBe(false);
    expect(allied(w.diplomacy, 'Italy', 'United Kingdom')).toBe(true);
    expect(allied(w.diplomacy, 'Italy', 'Germany')).toBe(false);
    expect(atWar(w, 'Germany', 'Italy')).toBe(true);
    expect(w.capitulated).not.toContain('Italy');
  });

  it('never happens to an Italy a player leads', () => {
    let w = storyOn('1943-07-26', ['Italy|United Kingdom'], 'Italy');
    w.controller = [...w.controller];
    w.controller[id('Sicily')] = 'United Kingdom';
    w = advance(w);
    expect(w.story.fired).not.toContain('italy-fall');
  });
});
