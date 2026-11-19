import { beforeAll, describe, expect, it } from 'vitest';
import { CARDS, cardById } from '../src/content/history';
import { AGENDA } from '../src/sim/agenda';
import { CHAPTERS } from '../src/sim/chapters';
import { hasPact } from '../src/sim/diplomacy';
import { advance } from '../src/sim/game';
import { provinceByName } from '../src/sim/map';
import { combatEdges, WINTER_ATTACK } from '../src/sim/mods';
import { report, scores } from '../src/sim/report';
import { newGame, PRELUDE_DAYS } from '../src/sim/scenario';
import { ATROCITY_LINE, dayOf, effectsOn, PURGE, RHINELAND_DELAY } from '../src/sim/story';
import type { Order, Unit, World } from '../src/sim/types';
import { atWar } from '../src/sim/war';
import { applyOrders, dateLabel, newWorld } from '../src/sim/world';

const id = (name: string) => provinceByName(name).id;
const until = (w: World, date: string, each?: (w: World) => Order[]): World => {
  const end = dayOf(w.startDate, date);
  while (w.day < end) w = advance(w, each ? each(w) : []);
  return w;
};
const news = (w: World) => w.diplomacy.log.map((e) => e.text);
const answer = (w: World, pick: (labels: string[]) => number): World => {
  const d = w.diplomacy.decisions[0];
  return applyOrders(w, [{ type: 'decide', by: d.country, id: d.id, option: pick(d.options.map((o) => o.label)) }]);
};

describe('history cards', () => {
  it('are in date order, with one id each, and every one says why it mattered', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(CARDS.map((c) => c.date)).toEqual([...CARDS.map((c) => c.date)].sort());
    for (const c of CARDS) {
      expect(c.text.length, c.id).toBeGreaterThan(80);
      expect(c.why.length, c.id).toBeGreaterThan(30);
      expect(c.date >= '1936-01-01' && c.date <= '1945-05-08', c.id).toBe(true);
    }
    expect(CARDS.filter((c) => c.kind === 'economy').length).toBeGreaterThanOrEqual(5);
    expect(CARDS.filter((c) => c.kind === 'atrocity').length).toBeGreaterThanOrEqual(10);
  });

  it('never show a symbol of the regimes of the time', () => {
    for (const c of CARDS) expect(c.title + c.text + c.why + (c.note ?? ''), c.id).not.toMatch(/[卐卍]/);
  });
});

describe('chapters', () => {
  it('cover the whole story without a gap, with objectives for all six countries', () => {
    expect(CHAPTERS[0].from).toBe('1936-01-01');
    expect(CHAPTERS[CHAPTERS.length - 1].to).toBe('1945-05-08');
    for (let i = 1; i < CHAPTERS.length; i++) expect(dayOf('1936-01-01', CHAPTERS[i].from)).toBe(dayOf('1936-01-01', CHAPTERS[i - 1].to) + 1);
    const w = newWorld('story', 'chapters', '1936-01-01', 'France');
    for (const ch of CHAPTERS)
      for (const name of ['United Kingdom', 'France', 'Germany', 'Italy', 'Soviet Union', 'Poland']) {
        expect(ch.objectives[name].length, `${ch.id} ${name}`).toBeGreaterThanOrEqual(2);
        for (const o of ch.objectives[name]) expect(typeof o.test(w)).toBe('boolean');
      }
  });
});

describe('the army effects of the story', () => {
  const w = newWorld('story', 'effects');
  const unit = (owner: string, to?: string): Unit => ({ ...w.units.find((u) => u.owner === owner && u.type === 'infantry')!, path: to ? [id(to)] : [] });
  const purge = { id: 'purge', country: 'Soviet Union', until: 9999, attack: PURGE.attack, defence: PURGE.defence, why: '' };
  const july = dayOf(w.startDate, '1941-07-10');
  const january = dayOf(w.startDate, '1942-01-10');

  it('weaken a whole army for a while, in attack and in defence', () => {
    const plain = combatEdges(w.economies);
    const hit = combatEdges(w.economies, { effects: [purge], day: july, startDate: w.startDate });
    const red = unit('Soviet Union');
    expect(hit.attack(red)).toBeCloseTo(plain.attack(red) * PURGE.attack);
    expect(hit.defence(red, red.at)).toBeCloseTo(plain.defence(red, red.at) * PURGE.defence);
    const german = unit('Germany');
    expect(hit.attack(german)).toBeCloseTo(plain.attack(german));
    // An effect that has run out no longer counts.
    const old = combatEdges(w.economies, { effects: [{ ...purge, until: july - 1 }], day: july, startDate: w.startDate });
    expect(old.attack(red)).toBeCloseTo(plain.attack(red));
  });

  it('make winter hard on an outsider attacking into Russia or the north, and on nobody else', () => {
    const summer = combatEdges(w.economies, { effects: [], day: july, startDate: w.startDate });
    const winter = combatEdges(w.economies, { effects: [], day: january, startDate: w.startDate });
    const german = unit('Germany', 'Minsk');
    expect(winter.attack(german)).toBeCloseTo(summer.attack(german) * WINTER_ATTACK);
    expect(winter.attack(unit('Soviet Union', 'Minsk'))).toBeCloseTo(summer.attack(unit('Soviet Union', 'Minsk')));
    expect(winter.attack(unit('Germany', 'Burgundy'))).toBeCloseTo(summer.attack(unit('Germany', 'Burgundy')));
    expect(winter.attack(unit('Soviet Union', 'Lapland'))).toBeCloseTo(summer.attack(unit('Soviet Union', 'Lapland')));
  });
});

describe('story decisions', () => {
  it('France can march into the Rhineland: Germany backs down and its whole timetable slips', () => {
    let w = until(newWorld('story', 'rhineland', '1936-01-01', 'France'), '1936-03-08');
    const d = w.diplomacy.decisions.find((x) => x.event === 'rhineland-france')!;
    expect(d).toBeTruthy();
    expect(d.options[d.fallback].label).toMatch(/Protest/);
    const before = w.economies.Germany.stability;
    w = applyOrders(w, [{ type: 'decide', by: 'France', id: d.id, option: 1 }]);
    expect(w.economies.Germany.stability).toBe(before - 10);
    expect(w.story.drift.anschluss).toBe(RHINELAND_DELAY);
    expect(news(w).some((t) => /French troops enter the Rhineland/.test(t))).toBe(true);
    // Two years on, the real date of the Anschluss has passed and Austria is still there.
    w = until(w, '1938-04-01');
    expect(w.capitulated).not.toContain('Austria');
  });

  it('Spain is decided by who sends help: without Germany, the Republic survives', () => {
    const stayOut = (w: World): Order[] => w.diplomacy.decisions.map((d) => ({ type: 'decide', by: 'Germany', id: d.id, option: d.event === 'spain-aid' ? 1 : d.fallback }) as Order);
    let w = until(newWorld('story', 'spain', '1936-01-01', 'Germany'), '1936-08-10', stayOut);
    expect(w.story.spain).toEqual({ state: 'war', balance: 0 });
    expect(w.story.fired).toContain('spain-aid');
    w = until(w, '1939-04-03', stayOut);
    expect(w.story.spain.state).toBe('republic');
    expect(w.economies.Spain.government).toBe('democracy');
    expect(w.story.cards.find((c) => c.id === 'spain-end')!.inGame).toMatch(/Republic has survived/);
  });
});

describe('the story led by the AI (bot playtest, 1936 to the end of 1941)', () => {
  let mid: World;
  let end: World;
  beforeAll(() => {
    mid = until(newWorld('story', 'history-2'), '1941-07-05');
    end = until(mid, '1941-12-31');
  }, 120000);

  it('files each history card on its real day, with a line about this game', () => {
    const due = CARDS.filter((c) => c.date <= '1941-12-30');
    expect(end.story.cards.map((c) => c.id)).toEqual(due.map((c) => c.id));
    for (const c of end.story.cards) {
      expect(c.day).toBe(dayOf(end.startDate, cardById(c.id)!.date));
      expect(c.inGame.length).toBeGreaterThan(10);
      if (cardById(c.id)!.kind === 'atrocity') expect(c.inGame, c.id).toContain(ATROCITY_LINE);
    }
    expect(end.story.cards.find((c) => c.id === 'rhineland')!.inGame).toMatch(/same day/);
    expect(end.story.cards.find((c) => c.id === 'guarantee')!.inGame).toMatch(/too/);
    expect(end.story.cards.find((c) => c.id === 'poland')!.inGame).toMatch(/too/);
  });

  it('plays the events that used to be missing: Spain, the Vienna Awards, Norway, Greece', () => {
    expect(end.story.spain.state).toBe('nationalist');
    expect(end.economies.Spain.government).toBe('authoritarian');
    expect(end.owner[id('Ruthenia')]).toBe('Hungary');
    expect(end.owner[id('Crișana')]).toBe('Hungary');
    expect(end.capitulated).toContain('Norway');
    expect(news(end)).toContain('Italy declares war on Greece');
    expect(hasPact(end.diplomacy, 'guarantee', 'United Kingdom', 'Greece') || news(end).some((t) => /United Kingdom declares war on Italy|guarantees the independence of Greece/.test(t))).toBe(true);
  });

  it('ends the fall of France with an armistice: a neutral government keeps the south', () => {
    expect(end.story.armistice).toContain('France');
    expect(atWar(end, 'France', 'Germany')).toBe(false);
    expect(end.controller[id('Provence')]).toBe('France');
    expect(end.controller[id('Île-de-France')]).toBe('Germany');
    expect(end.economies.France.government).toBe('authoritarian');
    expect(end.units.filter((u) => u.owner === 'France').length).toBeGreaterThan(0);
  });

  it('catches the Soviet Union by surprise in 1941, with an army still weakened by the Terror', () => {
    expect(atWar(mid, 'Germany', 'Soviet Union')).toBe(true);
    expect(effectsOn(mid, 'Soviet Union').map((x) => x.id).sort()).toEqual(['purge', 'surprise']);
    expect(news(end).some((t) => /Lend-Lease: American equipment begins to reach the Soviet Union/.test(t))).toBe(true);
    expect(news(end).some((t) => /Lend-Lease: American equipment begins to reach the United Kingdom/.test(t))).toBe(true);
  });

  it('keeps a quarter of the Red Army in the Far East until the autumn of 1941, then brings some of it west', () => {
    const red = (w: World) => w.units.filter((u) => u.owner === 'Soviet Union').length;
    expect(mid.story.farEast ?? 0).toBeGreaterThan(0.2 * red(mid));
    expect(red(mid)).toBeLessThan(380);
    expect(news(end).some((t) => /Siberian divisions reach Moscow/.test(t))).toBe(true);
    expect(end.story.farEast ?? 0).toBeLessThan(mid.story.farEast ?? 0);
  });

  it('Norway holds out for weeks with British help, and the Soviet Union fights on through 1941', () => {
    const norway = end.diplomacy.log.find((e) => /Norway surrenders/.test(e.text));
    if (norway) expect(norway.day).toBeGreaterThan(dayOf(end.startDate, '1940-05-01'));
    expect(end.capitulated).not.toContain('Soviet Union');
    expect(atWar(end, 'Germany', 'Soviet Union')).toBe(true);
  });

  it('pays for the war without wrecking the Soviet economy, and keeps the German army near its real size', () => {
    const soviet = end.economies['Soviet Union'];
    expect(soviet.governmentsFallen).toBe(0);
    expect(soviet.government).toBe('communist');
    expect(soviet.priceLevel).toBeLessThan(200);
    expect(soviet.inflation).toBeLessThan(30);
    const german = end.units.filter((u) => u.owner === 'Germany').length;
    expect(german).toBeGreaterThan(200);
    expect(german).toBeLessThan(400);
  });

  it('keeps count for the end report', () => {
    expect(end.story.greatWar).toBe(dayOf(end.startDate, '1939-09-01'));
    expect(end.story.ended).toBeNull();
    const r = report(end);
    expect(r.rows[0]).toEqual({ what: 'War between the great powers began', real: '1 September 1939', game: '1 September 1939' });
    expect(r.rows.find((x) => x.what === 'France')!.game).toMatch(/armistice/);
    expect(r.losses[0].lost).toBeGreaterThan(5);
    expect(r.scores[0].points).toBeGreaterThanOrEqual(r.scores[1].points);
    expect(r.timeline.length).toBeGreaterThan(20);
    expect(JSON.parse(JSON.stringify(end))).toEqual(end);
  });
});

describe('the September 1939 start', () => {
  let uk: World;
  let germany: World;
  beforeAll(() => {
    uk = newGame({ mode: 'story', start: '1939', player: 'United Kingdom', seed: 'a' });
    germany = newGame({ mode: 'story', start: '1939', player: 'Germany', seed: 'b' });
  }, 120000);

  it('is the same world every time, whoever you lead: the one the AI built from 1936', () => {
    expect(dateLabel(uk)).toBe('1 September 1939');
    expect(uk.day).toBe(PRELUDE_DAYS);
    expect(uk.story.start).toBe('1939');
    expect(uk.units).toEqual(germany.units);
    expect(uk.economies).toEqual(germany.economies);
    expect(uk.diplomacy.pacts).toEqual(germany.diplomacy.pacts);
    expect(uk.seed).not.toBe(germany.seed);
    expect(uk.capitulated).toEqual(expect.arrayContaining(['Austria', 'Czechoslovakia', 'Albania']));
    expect(hasPact(uk.diplomacy, 'nonAggression', 'Germany', 'Soviet Union')).toBe(true);
    expect(uk.wars).toEqual([]);
    expect(uk.story.cards.length).toBe(CARDS.filter((c) => c.date < '1939-09-01').length);
  });

  it('Germany attacks Poland on the first morning, and Britain is asked to keep its word', () => {
    let w = advance(uk);
    expect(atWar(w, 'Germany', 'Poland')).toBe(true);
    const d = w.diplomacy.decisions.find((x) => x.kind === 'honour')!;
    expect(d.from).toBe('Germany');
    expect(d.excused).toBeFalsy();
    w = applyOrders(w, [{ type: 'decide', by: 'United Kingdom', id: d.id, option: 0 }]);
    expect(atWar(w, 'Germany', 'United Kingdom')).toBe(true);
    // When the Soviet Union joins in, Britain may stay out of a second great war at no cost.
    for (let i = 0; i < 30 && !w.diplomacy.decisions.length && !w.capitulated.includes('Poland'); i++) w = advance(w);
    const second = w.diplomacy.decisions.find((x) => x.kind === 'honour');
    if (second) {
      expect(second.from).toBe('Soviet Union');
      expect(second.excused).toBe(true);
      expect(second.fallback).toBe(1);
      const stability = w.economies['United Kingdom'].stability;
      w = applyOrders(w, [{ type: 'decide', by: 'United Kingdom', id: second.id, option: 1 }]);
      expect(atWar(w, 'United Kingdom', 'Soviet Union')).toBe(false);
      expect(w.economies['United Kingdom'].stability).toBe(stability);
    }
  });

  it('Poland holds out about four weeks, as it did: Warsaw fell on 28 September 1939', () => {
    let w = uk;
    let day = 0;
    for (; day < 60 && !w.capitulated.includes('Poland'); day++) w = advance(w);
    expect(w.capitulated).toContain('Poland');
    // Before version 1.4.1 it gave up on 20 to 22 September, the day Warsaw fell.
    expect(day).toBeGreaterThanOrEqual(25);
    expect(day).toBeLessThanOrEqual(42);
  });

  it('a player Germany gives the order itself, or calls the war off', () => {
    const w = advance(germany);
    expect(w.wars).toEqual([]);
    const d = w.diplomacy.decisions.find((x) => x.event === 'poland-germany')!;
    expect(d).toBeTruthy();
    const war = applyOrders(w, [{ type: 'decide', by: 'Germany', id: d.id, option: 0 }]);
    expect(atWar(war, 'Germany', 'Poland')).toBe(true);
    expect(atWar(war, 'Germany', 'France')).toBe(true);
    const peace = applyOrders(w, [{ type: 'decide', by: 'Germany', id: d.id, option: 1 }]);
    expect(peace.wars).toEqual([]);
    expect(peace.diplomacy.agenda.poland).toBe('dropped');
  });

  it('ends on 1 January 1942, or when you are beaten', () => {
    const late = advance({ ...uk, day: dayOf(uk.startDate, '1942-01-01') });
    expect(late.story.ended?.why).toMatch(/1 January 1942/);
    const beaten = advance({ ...uk, capitulated: [...uk.capitulated, 'United Kingdom'] });
    expect(beaten.story.ended?.why).toMatch(/surrendered/);
    expect(report(beaten).verdict).toBe('United Kingdom was defeated.');
  });
});

describe('free-for-all', () => {
  const start = () => newGame({ mode: 'freeForAll', start: '1936', player: 'France', seed: 'ffa-1' });

  it('tears up every treaty and the timetable of history', () => {
    const w = start();
    expect(w.mode).toBe('freeForAll');
    expect(w.diplomacy.pacts).toEqual([]);
    expect(AGENDA.every((a) => w.diplomacy.agenda[a.id] === 'dropped')).toBe(true);
    expect(w.story.opportunist).toBe(true);
    expect(dateLabel({ startDate: w.startDate, day: w.story.endDay })).toBe('1 January 1946');
  });

  it('AI countries attack weak neighbours and look for allies, the same way from the same seed (bot playtest)', () => {
    const play = () => until(start(), '1938-01-01');
    const w = play();
    expect(news(w).some((t) => /declares war on .* without a cause/.test(t))).toBe(true);
    expect(news(w).some((t) => /sign an alliance/.test(t))).toBe(true);
    expect(w.story.cards).toEqual([]);
    expect(w.story.ended).toBeNull();
    expect(play()).toEqual(w);
    const table = scores(w);
    expect(table.reduce((a, r) => a + r.change, 0)).toBe(0);
    expect(report(w).verdict).toMatch(/France is/);
  }, 120000);

  it('ends when the ten years are up, with a scoreboard', () => {
    const w0 = start();
    const w = advance({ ...w0, story: { ...w0.story, endDay: w0.day } });
    expect(w.story.ended?.why).toMatch(/clock has run out/);
    expect(report(w).rows).toEqual([]);
    expect(report(w).scores.length).toBeGreaterThan(25);
  });
});
