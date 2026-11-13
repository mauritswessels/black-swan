/**
 * What AI countries want, and when: the historical agenda.
 *
 * By default every AI government tries to do what it really did, on the day it really did it:
 * the union with Austria in March 1938, the attack on Poland on 1 September 1939, and so on.
 * But each entry has conditions (`needs`) and most have a test of strength (`odds`). If your
 * actions have changed the situation, for example France is far stronger than it was or
 * Austria has a protector who will fight, the government waits and looks again a month later.
 * After three years it gives the idea up. One change therefore ripples forward: an entry that
 * never happens blocks the entries that depended on it.
 *
 * On top of the agenda there are three standing rules for every AI country, looked at once a
 * month: the big democracies guarantee the countries an aggressor claims (containment), AI
 * countries offer and accept peace by the war score, and a protector keeps its promises
 * (diplomacy.ts).
 *
 * Simplified for now: the war in Spain, the Vienna Awards, Vichy France, Norway and Greece
 * (which need ships, Stage G) are not in the agenda.
 */
import { COUNTRIES } from './countries';
import {
  addPact, alive, isolated, allied, alliesOf, ask, cannotGuarantee, claimOf, CLAIMS, CONTAIN_AGGRESSION, CONTAIN_TENSION, governmentOf, hasPact, isMajor, note, oddsAgainst, peaceAnswer, raiseTension, sendUltimatum, shift,
  owedBy, startWar, strengths, warScore, type DipDraft,
} from './diplomacy';
import { monthEnds } from './economy';
import { PROVINCES } from './map';
import type { Demand, Government, Order, World } from './types';
import { warKey } from './war';

type Act =
  | { do: 'event'; tension: number; relations?: [string, string, number][]; cause?: { by: string; on: string; days: number; why: string } }
  | { do: 'ultimatum'; on: string; demand?: Demand; warOdds: number }
  | { do: 'war'; on: string; limited?: number[]; cause?: string }
  | { do: 'pact'; kind: 'alliance' | 'nonAggression'; with: string };

export interface Aim {
  id: string;
  country: string;
  /** The day it really happened: the AI does not try it earlier. */
  date: string;
  /** It is only pursued while this kind of government rules the country. */
  regime: Government;
  act: Act;
  /** The news line when it happens. */
  news: string;
  /** Why the government is waiting, or null when it is ready to act. */
  needs?: (w: World) => string | null;
  /** The odds it wants before acting (its army against the target's), and how much of the protectors' armies it counts. */
  odds?: number;
  protectorShare?: number;
  /** One line on what really happened, for the player. */
  history: string;
}

const P = (name: string): number => PROVINCES.find((q) => q.name === name)!.id;
const fighting = (w: World, a: string, b: string): boolean => w.wars.includes(warKey(a, b));
const gone = (w: World, name: string): boolean => w.capitulated.includes(name);
const did = (w: World, id: string): boolean => w.diplomacy.agenda[id] === 'done';
/** Share of a country's own victory points in enemy hands. */
const lost = (w: World, name: string): number => {
  let total = 0;
  let away = 0;
  for (const p of PROVINCES) {
    if (w.owner[p.id] !== name) continue;
    total += p.victoryPoints;
    if (w.controller[p.id] !== name) away += p.victoryPoints;
  }
  return total ? away / total : 1;
};
const warDays = (w: World, a: string, b: string): number => (fighting(w, a, b) ? w.day - (w.diplomacy.warStart[warKey(a, b)] ?? w.day) : -1);
const first = (...checks: (string | null | false)[]): string | null => (checks.find((c) => !!c) as string | undefined) ?? null;
/** The west is settled when France is beaten or was never fought. */
const westQuiet = (w: World): string | null => (fighting(w, 'Germany', 'France') ? 'it is still fighting France' : null);

export const AGENDA: Aim[] = [
  // ----- Germany -----
  {
    id: 'rhineland', country: 'Germany', date: '1936-03-07', regime: 'fascist', news: 'German troops march into the demilitarised Rhineland, breaking the Locarno treaty',
    act: { do: 'event', tension: 5, relations: [['Germany', 'France', -10], ['Germany', 'United Kingdom', -5]], cause: { by: 'France', on: 'Germany', days: 120, why: 'Germany broke the Locarno treaty by sending troops into the Rhineland' } },
    history: 'France and Britain protested and did nothing. German officers had orders to withdraw if the French army moved.',
  },
  {
    id: 'axis', country: 'Germany', date: '1936-10-25', regime: 'fascist', news: 'Germany and Italy announce an understanding: the "Rome-Berlin Axis"',
    act: { do: 'event', tension: 2, relations: [['Germany', 'Italy', 45]] },
    needs: (w) => first(!alive(w, 'Italy') && 'Italy is gone', governmentOf(w, 'Italy') !== 'fascist' && 'Italy has a new government'),
    history: 'Italy, isolated after its war in Ethiopia, moved towards Germany and dropped its protection of Austria.',
  },
  {
    id: 'anschluss', country: 'Germany', date: '1938-03-12', regime: 'fascist', news: 'Germany demands union with Austria',
    act: { do: 'ultimatum', on: 'Austria', warOdds: 1.5 }, odds: 1.5,
    history: 'German troops crossed the border unopposed on 12 March 1938 and Austria was annexed the next day.',
  },
  {
    id: 'munich', country: 'Germany', date: '1938-09-29', regime: 'fascist', news: 'Germany demands the Sudetenland from Czechoslovakia',
    act: { do: 'ultimatum', on: 'Czechoslovakia', warOdds: 1 }, odds: 1.3, protectorShare: 0,
    needs: (w) => first(!did(w, 'anschluss') && 'Austria comes first'),
    history: 'At Munich, Britain and France agreed that Czechoslovakia must give up its border districts. It was not asked.',
  },
  {
    id: 'prague', country: 'Germany', date: '1939-03-15', regime: 'fascist', news: 'Germany demands that what is left of Czechoslovakia accept its "protection"',
    act: { do: 'ultimatum', on: 'Czechoslovakia', demand: { kind: 'annex' }, warOdds: 1 }, odds: 1.5,
    needs: (w) => first(!did(w, 'munich') && 'the Sudetenland comes first'),
    history: 'German troops occupied Prague on 15 March 1939. It ended the policy of appeasement: Britain and France guaranteed Poland two weeks later.',
  },
  {
    id: 'steel', country: 'Germany', date: '1939-05-22', regime: 'fascist', news: 'Germany and Italy sign a military alliance, the "Pact of Steel"',
    act: { do: 'pact', kind: 'alliance', with: 'Italy' },
    needs: (w) => first(!did(w, 'axis') && 'there is no understanding with Italy', governmentOf(w, 'Italy') !== 'fascist' && 'Italy has a new government'),
    history: 'Signed on 22 May 1939. Italy stayed out of the war all the same until France was nearly beaten.',
  },
  {
    id: 'nazi-soviet', country: 'Germany', date: '1939-08-23', regime: 'fascist', news: 'Germany and the Soviet Union sign a non-aggression pact',
    act: { do: 'pact', kind: 'nonAggression', with: 'Soviet Union' },
    needs: (w) => first(governmentOf(w, 'Soviet Union') !== 'communist' && 'the Soviet Union has a new government', fighting(w, 'Germany', 'Soviet Union') && 'they are at war'),
    history: 'The Molotov-Ribbentrop Pact of 23 August 1939. A secret protocol divided Poland and the Baltic states between them.',
  },
  {
    id: 'poland', country: 'Germany', date: '1939-09-01', regime: 'fascist', news: 'Germany invades Poland',
    act: { do: 'war', on: 'Poland' }, odds: 1.2, protectorShare: 0.2,
    needs: (w) => first(!did(w, 'prague') && 'Czechoslovakia comes first', !hasPact(w.diplomacy, 'nonAggression', 'Germany', 'Soviet Union') && !gone(w, 'Soviet Union') && (strengths(w.units).get('Germany') ?? 0) < 0.6 * (strengths(w.units).get('Soviet Union') ?? 0) && 'it fears the Soviet Union at its back'),
    history: 'Germany invaded on 1 September 1939. Britain and France declared war two days later. Poland was overrun in five weeks.',
  },
  {
    id: 'denmark', country: 'Germany', date: '1940-04-09', regime: 'fascist', news: 'Germany demands that Denmark accept occupation',
    act: { do: 'ultimatum', on: 'Denmark', demand: { kind: 'submit' }, warOdds: 1 },
    needs: (w) => first(!fighting(w, 'Germany', 'United Kingdom') && !fighting(w, 'Germany', 'France') && 'it is not at war in the west', fighting(w, 'Germany', 'Poland') && 'Poland is not beaten yet'),
    history: 'Denmark was occupied in six hours on 9 April 1940. Norway was invaded by sea the same day.',
  },
  ...(['Netherlands', 'Belgium', 'Luxembourg'] as const).map(
    (on): Aim => ({
      id: `west-${on.toLowerCase()}`, country: 'Germany', date: '1940-05-10', regime: 'fascist', news: `Germany invades ${on === 'Netherlands' ? 'the Netherlands' : on}`,
      act: { do: 'war', on, cause: 'the way to France leads through the Low Countries' },
      needs: (w) => first(!fighting(w, 'Germany', 'France') && 'it is not at war with France', fighting(w, 'Germany', 'Poland') && 'Poland is not beaten yet', (strengths(w.units).get('Germany') ?? 0) < 0.8 * (strengths(w.units).get('France') ?? 0) && 'the French army is too strong'),
      history: 'On 10 May 1940 Germany attacked through the Netherlands, Belgium and Luxembourg, around the Maginot Line. France asked for an armistice six weeks later.',
    }),
  ),
  {
    id: 'yugoslavia', country: 'Germany', date: '1941-04-06', regime: 'fascist', news: 'Germany invades Yugoslavia',
    act: { do: 'war', on: 'Yugoslavia', cause: 'a coup in Belgrade against the pact with Germany' }, odds: 1.5,
    needs: (w) => first(westQuiet(w), !did(w, 'poland') && 'the war has not gone its way'),
    history: 'After a coup in Belgrade overthrew the government that had joined the Axis, Germany and its allies overran Yugoslavia in eleven days.',
  },
  {
    id: 'barbarossa', country: 'Germany', date: '1941-06-22', regime: 'fascist', news: 'Germany invades the Soviet Union',
    act: { do: 'war', on: 'Soviet Union', cause: 'the conquest of "living space" in the east, the aim of the regime from the start' }, odds: 0.45, protectorShare: 0,
    needs: (w) => westQuiet(w),
    history: 'Operation Barbarossa began on 22 June 1941 with three million men: the largest invasion in history, and a war of extermination from its first day.',
  },
  // ----- Italy -----
  {
    id: 'albania', country: 'Italy', date: '1939-04-07', regime: 'fascist', news: 'Italy demands that Albania accept union with it',
    act: { do: 'ultimatum', on: 'Albania', warOdds: 99 },
    history: 'Italy invaded Albania on 7 April 1939 and annexed it within a week.',
  },
  {
    id: 'italy-war', country: 'Italy', date: '1940-06-10', regime: 'fascist', news: 'Italy enters the war against France',
    act: { do: 'war', on: 'France' },
    needs: (w) => first(!allied(w.diplomacy, 'Italy', 'Germany') && 'it has no alliance with Germany', !fighting(w, 'Germany', 'France') && 'Germany is not at war with France', lost(w, 'France') < 0.15 && 'France is not beaten yet'),
    history: 'Italy declared war on 10 June 1940, when France was already falling. Its attack across the Alps barely advanced.',
  },
  {
    id: 'italy-war-uk', country: 'Italy', date: '1940-06-10', regime: 'fascist', news: 'Italy enters the war against Britain',
    act: { do: 'war', on: 'United Kingdom', cause: 'its alliance with Germany' },
    needs: (w) => first(!allied(w.diplomacy, 'Italy', 'Germany') && 'it has no alliance with Germany', !fighting(w, 'Germany', 'United Kingdom') && 'Germany is not at war with Britain', !gone(w, 'France') && 'France is not beaten yet'),
    history: 'With France beaten, Italy fought Britain in the Mediterranean and in Africa.',
  },
  {
    id: 'egypt', country: 'Italy', date: '1940-09-13', regime: 'fascist', news: 'Italian troops cross from Libya into Egypt',
    act: { do: 'war', on: 'Egypt', cause: 'the British army in Egypt' },
    needs: (w) => first(!fighting(w, 'Italy', 'United Kingdom') && 'it is not at war with Britain'),
    history: 'Italy invaded Egypt from Libya in September 1940. A much smaller British force threw it back that winter.',
  },
  // ----- The Soviet Union -----
  {
    id: 'east-poland', country: 'Soviet Union', date: '1939-09-17', regime: 'communist', news: 'The Red Army crosses into eastern Poland',
    act: { do: 'war', on: 'Poland', limited: CLAIMS['Soviet Union'].Poland.demand!.kind === 'cede' ? (CLAIMS['Soviet Union'].Poland.demand as { provinces: number[] }).provinces : [] },
    needs: (w) => first(!hasPact(w.diplomacy, 'nonAggression', 'Germany', 'Soviet Union') && 'it has no understanding with Germany', warDays(w, 'Germany', 'Poland') < 14 && 'Germany is not beating Poland'),
    history: 'The Soviet Union invaded on 17 September 1939, as agreed in secret with Germany, and annexed the eastern half of Poland.',
  },
  {
    id: 'winter-war', country: 'Soviet Union', date: '1939-11-30', regime: 'communist', news: 'The Soviet Union attacks Finland',
    act: { do: 'war', on: 'Finland', limited: [P('Savonia')] },
    needs: (w) => first(fighting(w, 'Soviet Union', 'Poland') && 'Poland comes first', !hasPact(w.diplomacy, 'nonAggression', 'Germany', 'Soviet Union') && !fighting(w, 'Germany', 'France') && 'it fears Germany'),
    history: 'The Winter War, 30 November 1939 to 13 March 1940. Finland held out for 105 days against a far larger army, then gave up a tenth of its land.',
  },
  ...(['Estonia', 'Latvia', 'Lithuania'] as const).map(
    (on): Aim => ({
      id: `baltic-${on.toLowerCase()}`, country: 'Soviet Union', date: '1940-06-15', regime: 'communist', news: `The Soviet Union demands that ${on} accept a new government and Soviet troops`,
      act: { do: 'ultimatum', on, warOdds: 1 },
      needs: (w) => first(fighting(w, 'Soviet Union', 'Finland') && 'Finland comes first', !hasPact(w.diplomacy, 'nonAggression', 'Germany', 'Soviet Union') && !fighting(w, 'Germany', 'France') && 'it fears Germany'),
      history: 'In June 1940, while the world watched France fall, the Soviet Union occupied and annexed Estonia, Latvia and Lithuania.',
    }),
  ),
  {
    id: 'bessarabia', country: 'Soviet Union', date: '1940-06-28', regime: 'communist', news: 'The Soviet Union demands Bessarabia from Romania',
    act: { do: 'ultimatum', on: 'Romania', warOdds: 1 },
    needs: (w) => first(fighting(w, 'Soviet Union', 'Finland') && 'Finland comes first', !hasPact(w.diplomacy, 'nonAggression', 'Germany', 'Soviet Union') && !fighting(w, 'Germany', 'France') && 'it fears Germany'),
    history: 'Romania gave up Bessarabia to a Soviet ultimatum on 28 June 1940, and turned to Germany for protection.',
  },
  // ----- The smaller Axis countries -----
  ...([['Hungary', '1940-11-20'], ['Romania', '1940-11-23'], ['Bulgaria', '1941-03-01']] as const).map(
    ([country, date]): Aim => ({
      id: `axis-${country.toLowerCase()}`, country, date, regime: 'authoritarian', news: `${country} joins the Axis`,
      act: { do: 'pact', kind: 'alliance', with: 'Germany' },
      needs: (w) => first(governmentOf(w, 'Germany') !== 'fascist' && 'Germany has a new government', westQuiet(w), !did(w, 'poland') && 'Germany has not shown its strength', lost(w, 'Germany') > 0.1 && 'Germany is losing'),
      history: 'Hungary, Romania and Bulgaria signed the Tripartite Pact between November 1940 and March 1941, when Germany looked unbeatable.',
    }),
  ),
  ...([['Romania', 'to win back Bessarabia'], ['Hungary', 'its alliance with Germany'], ['Finland', 'to win back what it lost in the Winter War']] as const).map(
    ([country, cause]): Aim => ({
      id: `east-${country.toLowerCase()}`, country, date: '1941-06-25', regime: country === 'Finland' ? 'democracy' : 'authoritarian', news: `${country} joins the war against the Soviet Union`,
      act: { do: 'war', on: 'Soviet Union', cause },
      needs: (w) => first(!fighting(w, 'Germany', 'Soviet Union') && 'Germany is not at war with the Soviet Union', country === 'Finland' ? w.owner[P('Savonia')] === 'Finland' && 'it has lost nothing to win back' : !allied(w.diplomacy, country, 'Germany') && 'it is not allied to Germany'),
      history: 'Romania, Hungary and Finland fought beside Germany on the eastern front from the summer of 1941.',
    }),
  ),
];

const AIM_BY_ID = new Map(AGENDA.map((a) => [a.id, a]));

/** A world in which nothing diplomatic happens by itself: no pacts, no agenda. For test duels and peace runs. */
export const quiet = <W extends Pick<World, 'diplomacy'>>(w: W): W => isolated(w, AGENDA.map((a) => a.id));
/** A government that is waiting looks again after this many days. */
const RETRY_DAYS = 7;
/** An aim is given up this long after its historical date. */
const GIVE_UP_DAYS = 3 * 365;
const dayOf = (startDate: string, date: string): number => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000);

/** Where an aim stands today: what the AI is waiting for, or that it is ready. Used by the AI and shown in tests and reports. */
export function aimStatus(w: World, aim: Aim): { state: 'done' | 'dropped' | 'early' | 'waiting' | 'ready'; why?: string } {
  const mark = w.diplomacy.agenda[aim.id];
  if (mark === 'done' || mark === 'dropped') return { state: mark };
  if (w.day < dayOf(w.startDate, aim.date)) return { state: 'early' };
  if (typeof mark === 'number' && mark > w.day) return { state: 'waiting', why: 'it looked recently and will look again' };
  if (aim.country === w.player) return { state: 'waiting', why: 'this is your country: the choice is yours' };
  if (!alive(w, aim.country)) return { state: 'dropped' };
  if (governmentOf(w, aim.country) !== aim.regime) return { state: 'dropped' };
  const target = aim.act.do === 'event' ? null : aim.act.do === 'pact' ? aim.act.with : aim.act.on;
  if (target && !alive(w, target)) return { state: 'dropped' };
  if (target && aim.act.do !== 'pact' && (fighting(w, aim.country, target) || allied(w.diplomacy, aim.country, target))) return { state: 'dropped' };
  if (target && aim.act.do !== 'pact' && (w.diplomacy.truces[warKey(aim.country, target)] ?? 0) > w.day) return { state: 'waiting', why: 'a truce holds' };
  const why = aim.needs?.(w);
  if (why) return { state: 'waiting', why };
  if (target && aim.odds !== undefined && oddsAgainst(w, aim.country, target, aim.protectorShare ?? 1) < aim.odds) return { state: 'waiting', why: `it does not like its odds against ${target}` };
  return { state: 'ready' };
}

/** Is this aim pointless now (the country or its target is gone, or the government has changed)? */
function aimStatusDropped(d: DipDraft, aim: Aim): boolean {
  const target = aim.act.do === 'event' ? null : aim.act.do === 'pact' ? aim.act.with : aim.act.on;
  return !alive(d, aim.country) || governmentOf(d, aim.country) !== aim.regime || (!!target && !alive(d, target)) || (!!target && aim.act.do !== 'pact' && (d.wars.includes(warKey(aim.country, target)) || allied(d.diplomacy, aim.country, target)));
}

/** Carry out an entry of the agenda (go), or put it off for a week. Called from step() for the AI's `aim` orders. */
export function carryOutAim(d: DipDraft, id: string, go: boolean): void {
  const aim = AIM_BY_ID.get(id);
  const dip = d.diplomacy;
  if (!aim || dip.agenda[id] === 'done' || dip.agenda[id] === 'dropped' || aim.country === d.player) return;
  if (!go) {
    dip.agenda[id] = d.day - dayOf(d.startDate, aim.date) > GIVE_UP_DAYS || aimStatusDropped(d, aim) ? 'dropped' : d.day + RETRY_DAYS;
    return;
  }
  const act = aim.act;
  dip.agenda[id] = 'done';
  switch (act.do) {
    case 'event':
      raiseTension(d, act.tension);
      for (const [a, b, n] of act.relations ?? []) shift(dip, a, b, n);
      if (act.cause && alive(d, act.cause.by) && alive(d, act.cause.on)) dip.causes.push({ by: act.cause.by, on: act.cause.on, until: d.day + act.cause.days, why: act.cause.why });
      note(d, 'crisis', aim.news, [aim.country]);
      break;
    case 'ultimatum': {
      const demand = act.demand ?? claimOf(aim.country, act.on)?.demand;
      if (!demand) break;
      // The ultimatum marks the aim itself when it is settled; until then it stays open.
      delete dip.agenda[id];
      dip.agenda[id] = d.day + 30;
      sendUltimatum(d, aim.country, act.on, demand, act.warOdds, id);
      break;
    }
    case 'war':
      if (act.cause) dip.causes.push({ by: aim.country, on: act.on, until: d.day + 30, why: act.cause });
      startWar(d, aim.country, act.on, 'attack');
      if (act.limited?.length) dip.aims[warKey(aim.country, act.on)] = { by: aim.country, provinces: act.limited };
      break;
    case 'pact': {
      const words = act.kind === 'alliance' ? 'an alliance' : 'a non-aggression pact';
      if (act.with === d.player) {
        dip.agenda[id] = d.day + 30;
        ask(d, {
          country: act.with, kind: 'proposal', from: aim.country, pact: act.kind, aim: id, title: `${aim.country} proposes ${words}`,
          text: `${aim.country} proposes ${words}. ${aim.history}`,
          options: [
            { label: 'Sign', effect: act.kind === 'alliance' ? `You are allies. If ${aim.country} is attacked you will be asked to declare war.` : 'Relations improve. Either of you can still break it later, at a price.' },
            { label: 'Decline', effect: `Relations with ${aim.country} fall by 5.` },
          ],
          fallback: 1,
        });
      } else {
        addPact(d, act.kind, aim.country, act.with);
        note(d, 'pact', aim.news, [aim.country, act.with]);
      }
      break;
    }
  }
}

/** Today's diplomatic orders for every country the AI leads. */
export function aiDiplomacyOrders(w: World): Order[] {
  const orders: Order[] = [];
  // 1. The historical agenda, looked at every day.
  for (const aim of AGENDA) {
    const s = aimStatus(w, aim);
    if (s.state === 'ready') orders.push({ type: 'aim', id: aim.id, go: true });
    else if (s.state === 'dropped' && w.diplomacy.agenda[aim.id] !== 'dropped') orders.push({ type: 'aim', id: aim.id, go: false });
    else if (s.state === 'waiting' && aim.country !== w.player && !(typeof w.diplomacy.agenda[aim.id] === 'number' && (w.diplomacy.agenda[aim.id] as number) > w.day)) orders.push({ type: 'aim', id: aim.id, go: false });
  }
  if (!monthEnds(w.startDate, w.day - 1)) return orders;
  const dip = w.diplomacy;

  // 2. Containment: the big democracies promise to defend what an aggressor claims.
  const aggressors = COUNTRIES.map((c) => c.name).filter((a) => alive(w, a) && (dip.aggression[a] ?? 0) >= (dip.tension >= CONTAIN_TENSION ? 1 : CONTAIN_AGGRESSION));
  for (const c of COUNTRIES) {
    if (!c.major || c.name === w.player || !alive(w, c.name) || governmentOf(w, c.name) !== 'democracy') continue;
    const busy = w.wars.some((k) => k.split('|').includes(c.name) && k.split('|').some((x) => x !== c.name && isMajor(x)));
    if (busy) continue;
    for (const a of aggressors) {
      if (a === c.name || allied(dip, a, c.name)) continue;
      for (const target of Object.keys(CLAIMS[a] ?? {})) {
        if (target === c.name || !alive(w, target) || cannotGuarantee(w, c.name, target) || fighting(w, a, target)) continue;
        orders.push({ type: 'guarantee', by: c.name, on: target });
      }
    }
  }

  // 3. Peace.
  for (const c of COUNTRIES) {
    const me = c.name;
    if (me === w.player || !alive(w, me)) continue;
    for (const key of w.wars) {
      const [a, b] = key.split('|');
      if (a !== me && b !== me) continue;
      const other = a === me ? b : a;
      if ((dip.rebuffs[`${me}>${other}:peace`] ?? 0) > w.day) continue;
      const aim = dip.aims[key];
      const { score } = warScore(w, me, other);
      const months = (w.day - (dip.warStart[key] ?? w.day)) / 30;
      const promised = dip.honour.includes(key);
      // Keeping a promise: no peace while the friend still fights, unless things are desperate.
      const friend = promised && [...alliesOf(dip, me)].some((f) => alive(w, f) && fighting(w, f, other));
      let terms: 'white' | 'asHeld' | null = null;
      if (aim && aim.by === me && aim.provinces.every((p) => w.controller[p] === me)) terms = 'asHeld';
      else if (aim && aim.by === me && months >= 9 && score < 15) terms = 'white';
      else if (score <= -25 && !(friend && score > -40)) terms = other === w.player || peaceAnswer(w, me, other, 'white').yes ? 'white' : 'asHeld';
      else if (owedBy(dip, me, other)) terms = null; // not while a country it promised to defend is occupied
      else if (months >= 12 && (w.economies[me]?.warSupport ?? 50) < 25) terms = 'white'; // the people have had enough
      else if (!promised && months >= 18 && Math.abs(score) <= 10 && !(isMajor(me) && isMajor(other))) terms = 'white';
      if (terms) orders.push({ type: 'offerPeace', by: me, to: other, terms });
    }
  }
  return orders;
}
