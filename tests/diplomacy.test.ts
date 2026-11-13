import { describe, expect, it } from 'vitest';
import { AGENDA, aimStatus, quiet } from '../src/sim/agenda';
import { allied, alliesOf, cannotDeclare, cannotGuarantee, cannotJustify, causeFor, hasPact, pactAnswer, peaceAnswer, protectorsOf, relation, relationReasons, restingRelation, warScore } from '../src/sim/diplomacy';
import { advance, ownOrders } from '../src/sim/game';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { linkedProvinces } from '../src/sim/supply';
import type { Order, World } from '../src/sim/types';
import { atWar, enemiesOf } from '../src/sim/war';
import { applyOrders, dateLabel, newWorld, step } from '../src/sim/world';

const as = (country: string | null, mode: 'story' | 'freeForAll' = 'story', seed = 'stage-f') => newWorld(mode, seed, '1936-01-01', country);
const give = (w: World, ...orders: Order[]): World => applyOrders(w, orders);
const id = (name: string) => provinceByName(name).id;
/** Play until the date, answering nothing: decisions run out and take their fallback. */
const until = (w: World, date: string, each?: (w: World) => Order[]): World => {
  const end = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${w.startDate}T00:00:00Z`)) / 86400000);
  while (w.day < end) w = advance(w, each ? each(w) : []);
  return w;
};
const news = (w: World) => w.diplomacy.log.map((e) => e.text);

describe('relations', () => {
  it('start where governments, history, pacts and claims put them', () => {
    const w = as('France');
    expect(relation(w.diplomacy, 'France', 'United Kingdom')).toBe(100); // democracies 25 + history 35 + alliance 40
    expect(relation(w.diplomacy, 'France', 'Germany')).toBe(-60); // democracy and fascist -30, claim -30
    expect(relation(w.diplomacy, 'Germany', 'Soviet Union')).toBe(-45);
    for (const [a, b] of [['France', 'Germany'], ['Poland', 'Romania'], ['Italy', 'Albania']]) {
      expect(relationReasons(w, a, b).reduce((x, r) => x + r.points, 0)).toBe(restingRelation(w, a, b));
      expect(relation(w.diplomacy, a, b)).toBe(relation(w.diplomacy, b, a));
    }
  });

  it('a diplomatic mission raises them by two points a month, and costs money', () => {
    let w = give(as('France'), { type: 'mission', by: 'France', to: 'Belgium', on: true });
    const before = relation(w.diplomacy, 'France', 'Belgium');
    expect(restingRelation(w, 'France', 'Belgium')).toBe(before + 30);
    for (let d = 0; d < 62; d++) w = step(w);
    expect(relation(w.diplomacy, 'France', 'Belgium')).toBe(before + 4);
    expect(give(w, { type: 'mission', by: 'France', to: 'Belgium', on: false }).diplomacy.missions).toEqual([]);
  });
});

describe('causes for war', () => {
  it('Story mode needs one; Free-for-all allows a war without, at twice the price', () => {
    const story = as('France');
    expect(causeFor(story, 'France', 'Spain')).toBeNull();
    expect(cannotDeclare(story, 'France', 'Spain')).toMatch(/no cause/);
    expect(give(story, { type: 'declareWar', by: 'France', on: 'Spain' }).wars).toEqual([]);
    expect(causeFor(story, 'Germany', 'Austria')).toMatch(/claim/);
    const free = give(as('France', 'freeForAll'), { type: 'declareWar', by: 'France', on: 'Spain' });
    expect(free.wars).toEqual(['France|Spain']);
    expect(free.diplomacy.tension).toBe(20); // 10 for a small country, 10 more for no cause
    expect(relation(free.diplomacy, 'France', 'United Kingdom')).toBe(100); // allies forgive
    expect(relation(free.diplomacy, 'France', 'Netherlands')).toBe(25 - 30); // a democracy minds one and a half times as much
    expect(news(free)).toContain('France declares war on Spain without a cause');
  });

  it('a democracy can build a case only against a peace-breaker or in a tense world; a dictatorship always, and faster', () => {
    const w = as('France');
    expect(cannotJustify(w, 'France', 'Italy')).toMatch(/democracy/);
    expect(cannotJustify(w, 'Italy', 'Switzerland')).toBeNull();
    let it = give(as('Italy'), { type: 'justify', by: 'Italy', on: 'Switzerland' });
    expect(it.diplomacy.justifying).toEqual([{ by: 'Italy', on: 'Switzerland', daysLeft: 45 }]);
    for (let d = 0; d < 45; d++) it = step(quiet(it));
    expect(causeFor(it, 'Italy', 'Switzerland')).toMatch(/case/);
    expect(cannotDeclare(it, 'Italy', 'Switzerland')).toBeNull();
    const tense = { ...w, diplomacy: { ...w.diplomacy, tension: 50 } };
    expect(cannotJustify(tense, 'France', 'Italy')).toBeNull();
  });

  it('guarantees wait for tension in a democracy', () => {
    const w = as('United Kingdom');
    expect(cannotGuarantee(w, 'United Kingdom', 'Poland')).toMatch(/tension/);
    const tense = give({ ...w, diplomacy: { ...w.diplomacy, tension: 25 } }, { type: 'guarantee', by: 'United Kingdom', on: 'Poland' });
    expect(hasPact(tense.diplomacy, 'guarantee', 'United Kingdom', 'Poland')).toBe(true);
    expect(protectorsOf(tense.diplomacy, 'Poland').sort()).toEqual(['France', 'United Kingdom']);
  });
});

describe('promises', () => {
  it('allies and guarantors of a country that is attacked go to war for it', () => {
    const w = give(as(null, 'freeForAll'), { type: 'declareWar', by: 'Germany', on: 'Belgium' });
    expect(enemiesOf(w, 'Germany').sort()).toEqual(['Belgium', 'France', 'United Kingdom']);
    // A guarantee that is called in becomes an alliance; and the honourable side counts as attacked.
    expect(allied(w.diplomacy, 'France', 'Belgium')).toBe(true);
    expect(w.declaredBy['France|Germany']).toBe('Germany');
    // Germany's own friends are not dragged in by a war Germany started.
    expect(enemiesOf(w, 'Italy')).toEqual([]);
  });

  it('asks the player, and breaking your word has a price', () => {
    const w = give(as('France'), { type: 'declareWar', by: 'Germany', on: 'Poland' });
    expect(atWar(w, 'France', 'Germany')).toBe(false);
    const d = w.diplomacy.decisions[0];
    expect(d).toMatchObject({ country: 'France', kind: 'honour', from: 'Germany', about: 'Poland', fallback: 0 });
    const kept = give(w, { type: 'decide', by: 'France', id: d.id, option: 0 });
    expect(atWar(kept, 'France', 'Germany')).toBe(true);
    expect(kept.diplomacy.decisions).toEqual([]);
    const broken = give(w, { type: 'decide', by: 'France', id: d.id, option: 1 });
    expect(atWar(broken, 'France', 'Germany')).toBe(false);
    expect(allied(broken.diplomacy, 'France', 'Poland')).toBe(false);
    expect(broken.economies.France.stability).toBe(w.economies.France.stability - 10);
    expect(relation(broken.diplomacy, 'France', 'Netherlands')).toBe(relation(w.diplomacy, 'France', 'Netherlands') - 15);
    // Left unanswered, the promise is kept when the deadline passes.
    let late = quiet(w);
    late = { ...late, diplomacy: { ...late.diplomacy, pacts: w.diplomacy.pacts } };
    for (let i = 0; i < 8; i++) late = step(late);
    expect(atWar(late, 'France', 'Germany')).toBe(true);
  });

  it('allied armies may use each other’s land and depots; neutral land stays closed', () => {
    const w = as('France');
    const french = w.units.find((u) => u.owner === 'France' && PROVINCES[u.at].name === 'Île-de-France')!;
    expect(give(w, { type: 'move', unit: french.id, to: id('Brussels') }).units.find((u) => u.id === french.id)!.path).toEqual([]);
    const allies = give(w, { type: 'propose', by: 'France', to: 'Belgium', pact: 'alliance', agreed: true }, { type: 'move', unit: french.id, to: id('Brussels') });
    // Belgium is not obliged to say yes just because the order says "agreed": that flag is for the AI's own treaties.
    expect(allied(allies.diplomacy, 'France', 'Belgium')).toBe(pactAnswer(w, 'France', 'Belgium', 'alliance').yes);
    const forced = { ...w, diplomacy: { ...w.diplomacy, pacts: [...w.diplomacy.pacts, { kind: 'alliance' as const, a: 'France', b: 'Belgium', since: 0 }] } };
    expect(give(forced, { type: 'move', unit: french.id, to: id('Brussels') }).units.find((u) => u.id === french.id)!.path.length).toBeGreaterThan(0);
    expect(linkedProvinces(forced.controller, 'France', new Set(alliesOf(forced.diplomacy, 'France')))[id('Brussels')]).toBe(true);
    expect(linkedProvinces(forced.controller, 'France')[id('Brussels')]).toBe(false);
  });

  it('only the player’s own diplomatic orders count', () => {
    const w = as('France');
    const orders: Order[] = [{ type: 'declareWar', by: 'Germany', on: 'Poland' }, { type: 'makePeace', a: 'France', b: 'Germany' }, { type: 'aim', id: 'poland', go: true }, { type: 'mission', by: 'France', to: 'Spain', on: true }];
    expect(ownOrders(w, orders)).toEqual([orders[3]]);
  });
});

describe('ultimatums', () => {
  it('a country that stands alone against a far stronger one gives in, and is annexed', () => {
    const w = give(as('Germany'), { type: 'ultimatum', by: 'Germany', on: 'Austria' });
    expect(w.capitulated).toEqual(['Austria']);
    expect(w.diplomacy.conquered.Austria).toBe('Germany');
    expect(w.owner[id('Vienna')]).toBe('Germany');
    expect(w.controller[id('Vienna')]).toBe('Germany');
    expect(w.units.some((u) => u.owner === 'Austria')).toBe(false);
    expect(w.diplomacy.tension).toBe(15);
    expect(w.diplomacy.aggression.Germany).toBe(1);
    expect(w.wars).toEqual([]);
  });

  it('a protector that will fight makes the target refuse, which leaves a cause for war', () => {
    // Raise French war support to 50: France stands by Czechoslovakia.
    const w0 = as('Germany');
    const firm = { ...w0, economies: { ...w0.economies, France: { ...w0.economies.France, warSupport: 50 } } };
    const w = give(firm, { type: 'ultimatum', by: 'Germany', on: 'Czechoslovakia' });
    expect(w.capitulated).toEqual([]);
    expect(news(w).some((t) => /Czechoslovakia refuses the ultimatum from Germany, backed by France/.test(t))).toBe(true);
    expect(w.diplomacy.causes).toMatchObject([{ by: 'Germany', on: 'Czechoslovakia' }]);
    // With France unwilling (war support 35), Czechoslovakia gives in and France's promise ends.
    const soft = give(w0, { type: 'ultimatum', by: 'Germany', on: 'Czechoslovakia' });
    expect(allied(soft.diplomacy, 'France', 'Czechoslovakia')).toBe(false);
    expect(soft.units.filter((u) => u.owner === 'Czechoslovakia').length).toBe(w0.units.filter((u) => u.owner === 'Czechoslovakia').length - 5);
    expect(soft.economies.Czechoslovakia.stability).toBe(w0.economies.Czechoslovakia.stability - 15);
  });
});

describe('peace', () => {
  const beaten = (): World => {
    // Germany holds Warsaw and Kraków; Poland still fights.
    const w = give(quiet(as('Germany')), { type: 'declareWar', by: 'Germany', on: 'Poland' });
    const controller = [...w.controller];
    controller[id('Poznań')] = 'Germany';
    controller[id('Upper Silesia')] = 'Germany';
    return { ...w, controller };
  };

  it('scores a war by land, armies and the home front, and the reasons add up', () => {
    const w = beaten();
    const { score, reasons } = warScore(w, 'Germany', 'Poland');
    expect(reasons.reduce((a, r) => a + r.points, 0)).toBe(score);
    expect(score).toBe(-warScore(w, 'Poland', 'Germany').score);
  });

  it('white peace hands land back; peace "as held" changes the owner; both start a truce', () => {
    const w = beaten();
    const white = give(w, { type: 'makePeace', a: 'Germany', b: 'Poland' });
    expect(white.controller[id('Poznań')]).toBe('Poland');
    expect(white.wars).toEqual([]);
    expect(cannotDeclare(white, 'Germany', 'Poland')).toMatch(/truce/);
    expect(relation(white.diplomacy, 'Germany', 'Poland')).toBe(-40);
    // Poland will not sign land away while it can still fight...
    expect(peaceAnswer(w, 'Germany', 'Poland', 'asHeld').yes).toBe(false);
    expect(give(w, { type: 'offerPeace', by: 'Germany', to: 'Poland', terms: 'asHeld' }).wars).toEqual(['Germany|Poland']);
    // ...but it does once it is badly beaten.
    const controller = [...w.controller];
    controller[id('Kraków')] = 'Germany';
    controller[id('Lublin')] = 'Germany';
    const worse = { ...w, controller, units: w.units.filter((u) => u.owner !== 'Poland' || u.id % 3 === 0) };
    expect(peaceAnswer(worse, 'Germany', 'Poland', 'asHeld').yes).toBe(true);
    const held = give(worse, { type: 'offerPeace', by: 'Germany', to: 'Poland', terms: 'asHeld' });
    expect(held.wars).toEqual([]);
    expect(held.owner[id('Kraków')]).toBe('Germany');
    expect(held.owner[id('Warsaw')]).toBe('Poland');
  });

  it('a conquered country is occupied, can be annexed or given a friendly government, and is restored when its conqueror falls', () => {
    let w = give(quiet(as('Germany', 'freeForAll')), { type: 'declareWar', by: 'Germany', on: 'Poland' }, { type: 'declareWar', by: 'Soviet Union', on: 'Germany' });
    w = step({ ...w, controller: w.controller.map((c) => (c === 'Poland' ? 'Germany' : c)) });
    expect(w.capitulated).toEqual(['Poland']);
    expect(w.owner[id('Warsaw')]).toBe('Poland'); // occupied, not annexed
    const friendly = give(w, { type: 'settle', by: 'Germany', target: 'Poland', how: 'friendly' });
    expect(friendly.capitulated).toEqual([]);
    expect(friendly.economies.Poland.government).toBe('fascist');
    expect(allied(friendly.diplomacy, 'Germany', 'Poland')).toBe(true);
    expect(friendly.units.filter((u) => u.owner === 'Poland').length).toBeGreaterThan(0);
    const annexed = give(w, { type: 'settle', by: 'Germany', target: 'Poland', how: 'annex' });
    expect(annexed.owner[id('Warsaw')]).toBe('Germany');
    // Germany falls to the Soviet Union: Poland comes back, even from annexation.
    for (const world of [w, annexed]) {
      const fallen = step({ ...world, controller: world.controller.map((c, p) => (PROVINCES[p].owner === 'Germany' ? 'Soviet Union' : c)) });
      expect(fallen.capitulated).toEqual(['Germany']);
      expect(fallen.controller[id('Warsaw')]).toBe('Poland');
      expect(fallen.owner[id('Warsaw')]).toBe('Poland');
      expect(fallen.controller[id('Berlin')]).toBe('Soviet Union');
    }
  });

  it('a government that falls changes its kind', () => {
    let w = quiet(as('France'));
    w = { ...w, economies: { ...w.economies, France: { ...w.economies.France, stability: 0, taxRate: 0.6, crisisMonths: 2 } } };
    for (let d = 0; d < 32 && w.economies.France.governmentsFallen === 0; d++) w = step(w);
    expect(w.economies.France.governmentsFallen).toBe(1);
    expect(w.economies.France.government).toBe('authoritarian');
    expect(news(w).some((t) => /The government of France falls/.test(t))).toBe(true);
  });
});

describe('the AI follows history (bot playtest, every country led by the AI)', () => {
  const w = until(as(null, 'story', 'history'), '1939-10-15');
  const on = (text: RegExp) => {
    const e = w.diplomacy.log.find((x) => text.test(x.text));
    return e ? dateLabel({ startDate: w.startDate, day: e.day }) : null;
  };

  it('Austria, Munich, Prague, Albania, the pacts and the attack on Poland happen on their real dates', () => {
    expect(w.diplomacy.agenda).toMatchObject({ rhineland: 'done', axis: 'done', anschluss: 'done', munich: 'done', prague: 'done', albania: 'done', steel: 'done', 'nazi-soviet': 'done', poland: 'done', 'east-poland': 'done' });
    expect(w.capitulated).toEqual(expect.arrayContaining(['Austria', 'Czechoslovakia', 'Albania']));
    expect(w.owner[id('Vienna')]).toBe('Germany');
    expect(w.owner[id('Bohemia')]).toBe('Germany');
    expect(allied(w.diplomacy, 'Germany', 'Italy')).toBe(true);
    expect(enemiesOf(w, 'Germany')).toEqual(expect.arrayContaining(['France', 'United Kingdom']));
    expect(on(/Germany declares war on Poland/)).toBe('1 September 1939');
    expect(on(/France declares war on Germany to keep its promise to Poland/)).toBe('1 September 1939');
    expect(on(/Soviet Union declares war on Poland/)).toBe('17 September 1939');
    // Appeasement ended with Prague: Britain guaranteed Poland within weeks.
    expect(on(/United Kingdom guarantees the independence of Poland/)).toMatch(/1939$/);
    // Italy, though allied, stays out for now; Britain and France do not take on the Soviet Union as well.
    expect(enemiesOf(w, 'Italy')).toEqual([]);
    expect(atWar(w, 'France', 'Soviet Union')).toBe(false);
  });

  it('gives the same history from the same seed, and survives being saved and loaded', () => {
    const again = until(as(null, 'story', 'history'), '1938-04-01');
    expect(until(as(null, 'story', 'history'), '1938-04-01')).toEqual(again);
    expect(JSON.parse(JSON.stringify(again))).toEqual(again);
  });
});

describe('the butterfly effect (bot playtests)', () => {
  it('a player who leads Germany and does nothing: no Anschluss, no Munich, no war in 1939', () => {
    const w = until(as('Germany', 'story', 'butterfly'), '1939-10-01');
    expect(w.capitulated).toEqual(['Albania']); // Italy still follows its own plans
    expect(w.owner[id('Vienna')]).toBe('Austria');
    expect(w.wars).toEqual([]);
    expect(w.diplomacy.tension).toBeLessThan(25);
    expect(hasPact(w.diplomacy, 'guarantee', 'United Kingdom', 'Poland')).toBe(false);
  });

  it('France stands firm at Munich: Czechoslovakia refuses, and the road to Prague and Poland is blocked', () => {
    const firm = (w: World): Order[] => w.diplomacy.decisions.filter((d) => d.kind === 'backing' || d.kind === 'honour').map((d) => ({ type: 'decide', by: 'France', id: d.id, option: 0 }));
    const w = until(as('France', 'story', 'munich'), '1939-10-01', firm);
    expect(news(w).some((t) => /Czechoslovakia refuses the ultimatum from Germany, backed by France/.test(t))).toBe(true);
    expect(w.owner[id('Bohemia')]).toBe('Czechoslovakia');
    // Germany chose war over backing down, a year early, and France kept its word.
    const day = (text: RegExp) => w.diplomacy.log.find((e) => text.test(e.text))?.day ?? Infinity;
    expect(day(/Germany declares war on Czechoslovakia/)).toBeLessThan(1010);
    expect(day(/France declares war on Germany to keep its promise to Czechoslovakia/)).toBeLessThan(1010);
    // Poland is not attacked on 1 September 1939: history has changed.
    expect(aimStatus(w, AGENDA.find((a) => a.id === 'poland')!).state).not.toBe('done');
    expect(day(/Germany declares war on Poland/)).toBe(Infinity);
  });
});
