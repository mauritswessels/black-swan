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
 * Since Stage H the agenda also holds Norway (a surprise landing from the sea), Italy's attack
 * on Greece and Germany's rescue of it, and the Vienna Awards (land handed from one small
 * country to another by Germany's order). The war in Spain and the armistice with France are
 * story events (story.ts). In a game with loose history each date is shifted by a few weeks or
 * months (`world.story.drift`).
 */
import { COUNTRIES } from './countries';
import {
  addPact, alive, isolated, allied, alliesOf, ask, cannotGuarantee, claimOf, CLAIMS, CONTAIN_AGGRESSION, CONTAIN_TENSION, governmentOf, hasPact, isMajor, note, oddsAgainst, peaceAnswer, raiseTension, sendUltimatum, shift,
  owedBy, sendHome, startIncident, startWar, strengths, warScore, type DipDraft,
} from './diplomacy';
import { monthEnds } from './economy';
import { beyond, PROVINCES } from './map';
import type { Demand, Government, Order, World } from './types';
import { warKey } from './war';

type Act =
  | { do: 'event'; tension: number; relations?: [string, string, number][]; cause?: { by: string; on: string; days: number; why: string } }
  | { do: 'ultimatum'; on: string; demand?: Demand; warOdds: number }
  | { do: 'war'; on: string; limited?: number[]; cause?: string; surprise?: { province: number; divisions: number } }
  /** Germany, as the strongest power on the continent, makes `from` hand these provinces to the country of the aim. */
  | { do: 'award'; from: string; provinces: number[] }
  | { do: 'pact'; kind: 'alliance' | 'nonAggression'; with: string }
  /** A border incident (diplomacy.ts startIncident): `with` against `against`, for these provinces, ending after `days`. */
  | { do: 'incident'; with: string[]; against: string[]; provinces: number[]; days: number };

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
/** Beaten: surrendered and occupied, or living on under an armistice (Vichy France). */
const gone = (w: World, name: string): boolean => w.capitulated.includes(name) || w.story.armistice.includes(name);
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
  {
    id: 'norway', country: 'Germany', date: '1940-04-09', regime: 'fascist', news: 'German troops land at Oslo: Germany invades Norway',
    act: { do: 'war', on: 'Norway', cause: 'the iron ore route from Sweden and bases against Britain', surprise: { province: P('Oslo'), divisions: 8 } },
    needs: (w) => first(!fighting(w, 'Germany', 'United Kingdom') && !fighting(w, 'Germany', 'France') && 'it is not at war in the west', fighting(w, 'Germany', 'Poland') && 'Poland is not beaten yet'),
    history: 'On 9 April 1940 German ships and aircraft landed troops at Oslo and several other Norwegian ports at once. Norway fought for two months with British and French help.',
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
    id: 'greece-germany', country: 'Germany', date: '1941-04-06', regime: 'fascist', news: 'Germany invades Greece',
    act: { do: 'war', on: 'Greece', cause: 'to rescue its ally Italy and close the Balkans to Britain' },
    needs: (w) => first(!did(w, 'greece') && 'Italy has not attacked Greece', !allied(w.diplomacy, 'Germany', 'Italy') && 'it has no alliance with Italy', westQuiet(w)),
    history: 'Germany attacked Greece on 6 April 1941, the same day as Yugoslavia, to rescue the Italian army stuck in Albania. Athens fell three weeks later.',
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
  {
    id: 'greece', country: 'Italy', date: '1940-10-28', regime: 'fascist', news: 'Italy invades Greece from Albania',
    act: { do: 'war', on: 'Greece' },
    needs: (w) => first(w.controller[P('Albania')] !== 'Italy' && 'it does not hold Albania', !fighting(w, 'Italy', 'United Kingdom') && 'it is not at war with Britain'),
    history: 'Italy attacked Greece from Albania on 28 October 1940. The Greek army threw the Italians back within weeks.',
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
  // ----- East Asia (1.8) -----
  {
    id: 'xian', country: 'China', date: '1936-12-24', regime: 'authoritarian', news: 'After the Xi\'an Incident, China\'s Nationalists and Communists stop their civil war and agree to stand together against Japan',
    act: { do: 'pact', kind: 'alliance', with: 'Chinese Communists' },
    needs: (w) => first(fighting(w, 'China', 'Chinese Communists') && 'they are at war'),
    history: 'On 12 December 1936 two of his own generals arrested Chiang Kai-shek at Xi\'an and held him until he agreed to end the civil war and resist Japan beside the Communists. He was freed on 25 December; the "Second United Front" was made formal in September 1937.',
  },
  {
    id: 'marco-polo', country: 'Japan', date: '1937-07-07', regime: 'authoritarian', news: 'Shots at the Marco Polo Bridge outside Peiping: Japan goes to war with China',
    act: { do: 'war', on: 'China', cause: 'a clash between Japanese and Chinese troops at the Marco Polo Bridge' },
    history: 'On the night of 7 July 1937 Japanese troops on manoeuvres and Chinese troops exchanged fire at the Marco Polo Bridge near Peiping. Neither side backed down. Japan took Peiping and Tientsin within a month and the war spread to Shanghai in August. Japan called it the "China Incident"; neither side declared war until 1941.',
  },
  {
    id: 'khasan', country: 'Japan', date: '1938-07-29', regime: 'authoritarian', news: 'Japanese and Soviet troops fight at Lake Khasan, where Korea, Manchukuo and the Soviet Union meet',
    act: { do: 'incident', with: ['Japan'], against: ['Soviet Union'], provinces: [P('Primorye')], days: 14 },
    needs: (w) => first(governmentOf(w, 'Soviet Union') !== 'communist' && 'the Soviet Union has a new government'),
    history: 'From 29 July to 11 August 1938 Japan tested the Soviet border at Lake Khasan, near Vladivostok. The Red Army threw the Japanese off the hills they had taken, and a ceasefire restored the old border.',
  },
  {
    id: 'khalkhin-gol', country: 'Manchukuo', date: '1939-05-11', regime: 'authoritarian', news: 'Manchurian and Japanese troops clash with the Mongolian army on the Khalkhin Gol river, and the Red Army comes to Mongolia\'s aid',
    act: { do: 'incident', with: ['Manchukuo', 'Japan'], against: ['Mongolia', 'Soviet Union'], provinces: [P('Eastern Mongolia')], days: 128 },
    needs: (w) => first(governmentOf(w, 'Soviet Union') !== 'communist' && 'the Soviet Union has a new government', !allied(w.diplomacy, 'Soviet Union', 'Mongolia') && 'Mongolia has no Soviet protector'),
    history: 'From May to September 1939 Japan\'s Kwantung Army fought the Soviet and Mongolian armies over a strip of grassland on the Khalkhin Gol river. In August General Zhukov encircled the Japanese with tanks and aircraft. The defeat turned Japan away from the Soviet Union and towards the south.',
  },
  {
    id: 'neutrality-pact', country: 'Japan', date: '1941-04-13', regime: 'authoritarian', news: 'Japan and the Soviet Union sign a neutrality pact',
    act: { do: 'pact', kind: 'nonAggression', with: 'Soviet Union' },
    needs: (w) => first(fighting(w, 'Japan', 'Soviet Union') && 'they are at war'),
    history: 'Signed in Moscow on 13 April 1941. Each side could now face the other way: Japan towards Southeast Asia, the Soviet Union towards Germany. It held until August 1945.',
  },
  // ----- The smaller Axis countries -----
  {
    id: 'vienna-1', country: 'Hungary', date: '1938-11-02', regime: 'authoritarian', news: 'The First Vienna Award: Germany and Italy give Hungary the south of Slovakia and Ruthenia',
    act: { do: 'award', from: 'Czechoslovakia', provinces: [P('Ruthenia')] },
    needs: (w) => first(!did(w, 'munich') && 'Czechoslovakia has not given way to Germany'),
    history: 'On 2 November 1938 Germany and Italy awarded Hungary the southern edge of Slovakia and Ruthenia. Hungary took the rest of Ruthenia in March 1939.',
  },
  {
    id: 'vienna-2', country: 'Hungary', date: '1940-08-30', regime: 'authoritarian', news: 'The Second Vienna Award: Germany and Italy give Hungary northern Transylvania',
    act: { do: 'award', from: 'Romania', provinces: [P('Crișana'), P('Transylvania')] },
    needs: (w) => first(!gone(w, 'France') && 'France is not beaten', fighting(w, 'Germany', 'Soviet Union') && 'Germany is busy in the east'),
    history: 'On 30 August 1940 Germany and Italy ordered Romania to give northern Transylvania to Hungary.',
  },
  {
    id: 'craiova', country: 'Bulgaria', date: '1940-09-07', regime: 'authoritarian', news: 'Romania returns southern Dobruja to Bulgaria, on Germany\'s advice',
    act: { do: 'award', from: 'Romania', provinces: [P('Dobruja')] },
    needs: (w) => first(!gone(w, 'France') && 'France is not beaten', fighting(w, 'Germany', 'Soviet Union') && 'Germany is busy in the east'),
    history: 'By the Treaty of Craiova of 7 September 1940 Romania gave southern Dobruja back to Bulgaria.',
  },
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
export const dayOf = (startDate: string, date: string): number => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000);
/** The day the AI first looks at an aim in this game: its real date, shifted when history is loose or an earlier event pushed it back. */
export const aimDay = (w: Pick<World, 'startDate' | 'story'>, aim: Aim): number => dayOf(w.startDate, aim.date) + (w.story.drift[aim.id] ?? 0);

/** May Germany's order hand this land over? Not if Germany is gone or changed, or the loser has a great power fighting Germany at its side. */
const awardBlocked = (w: Pick<World, 'capitulated' | 'economies' | 'wars' | 'diplomacy' | 'owner' | 'controller'>, aim: Aim, act: Extract<Act, { do: 'award' }>): string | null =>
  first(
    (!alive(w, 'Germany') || governmentOf(w, 'Germany') !== 'fascist') && 'Germany no longer gives the orders',
    w.wars.includes(warKey(act.from, 'Germany')) && `${act.from} is at war with Germany`,
    w.wars.includes(warKey(act.from, aim.country)) && 'they are at war',
    alliesOf(w.diplomacy, act.from).some((x) => isMajor(x) && alive(w, x) && w.wars.includes(warKey(x, 'Germany'))) && `${act.from} has an ally at war with Germany`,
    !act.provinces.some((p) => w.owner[p] === act.from && w.controller[p] === act.from) && 'the land has already changed hands',
  );

/**
 * A surprise landing on the first morning of a war: rested infantry from the attacker's home
 * provinces comes ashore at one port before the defenders are ready. They fight at the usual
 * disadvantage of a landing. This is how Germany took Oslo on 9 April 1940.
 */
/** After a surprise landing the defenders fight at this share of their power for this many days. */
export const SURPRISE_LANDING_DAYS = 30;
export const SURPRISE_LANDING_POWER = 0.6;
export function surpriseLanding(d: DipDraft, by: string, province: number, divisions: number): number {
  const front = new Set<number>();
  for (const p of PROVINCES) if (d.controller[p.id] === by && p.neighbours.some((n) => d.wars.includes(warKey(by, d.controller[n])) && !beyond(n, by, d.controller[n]))) front.add(p.id);
  const picked = d.units
    .filter((u) => u.owner === by && u.type === 'infantry' && !u.path.length && !u.sea && !u.landing && u.organisation >= 60 && PROVINCES[u.at].owner === by && d.controller[u.at] === by && !front.has(u.at))
    .sort((a, b) => b.organisation - a.organisation || a.id - b.id)
    .slice(0, divisions);
  // The defenders are caught half asleep for the first weeks.
  const victim = d.controller[province];
  if (picked.length) d.story.effects = [...d.story.effects.filter((x) => !(x.id === 'surprise' && x.country === victim)), { id: 'surprise', country: victim, until: d.day + SURPRISE_LANDING_DAYS, attack: SURPRISE_LANDING_POWER, defence: SURPRISE_LANDING_POWER, why: `caught by surprise by ${by}'s landing` }];
  for (const u of picked) {
    u.path = [province];
    u.progress = 0;
    u.landing = true;
  }
  return picked.length;
}

/** Where an aim stands today: what the AI is waiting for, or that it is ready. Used by the AI and shown in tests and reports. */
export function aimStatus(w: World, aim: Aim): { state: 'done' | 'dropped' | 'early' | 'waiting' | 'ready'; why?: string } {
  const mark = w.diplomacy.agenda[aim.id];
  if (mark === 'done' || mark === 'dropped') return { state: mark };
  if (w.day < aimDay(w, aim)) return { state: 'early' };
  if (typeof mark === 'number' && mark > w.day) return { state: 'waiting', why: 'it looked recently and will look again' };
  if (aim.country === w.player) return { state: 'waiting', why: 'this is your country: the choice is yours' };
  if (!alive(w, aim.country)) return { state: 'dropped' };
  if (governmentOf(w, aim.country) !== aim.regime) return { state: 'dropped' };
  if (aim.act.do === 'award') {
    const no = awardBlocked(w, aim, aim.act);
    if (no) return w.day - aimDay(w, aim) > 365 ? { state: 'dropped' } : { state: 'waiting', why: no };
    const more = aim.needs?.(w);
    return more ? { state: 'waiting', why: more } : { state: 'ready' };
  }
  const target = aim.act.do === 'event' ? null : aim.act.do === 'pact' ? aim.act.with : aim.act.do === 'incident' ? aim.act.against[0] : aim.act.on;
  if (target && !alive(w, target)) return { state: 'dropped' };
  // A country that has signed an armistice is left alone by those it signed with.
  if (target && aim.act.do !== 'pact' && w.story.armistice.includes(target)) return { state: 'dropped' };
  if (target && aim.act.do !== 'pact' && (fighting(w, aim.country, target) || allied(w.diplomacy, aim.country, target))) return { state: 'dropped' };
  if (target && aim.act.do !== 'pact' && (w.diplomacy.truces[warKey(aim.country, target)] ?? 0) > w.day) return { state: 'waiting', why: 'a truce holds' };
  const why = aim.needs?.(w);
  if (why) return { state: 'waiting', why };
  if (target && aim.odds !== undefined && oddsAgainst(w, aim.country, target, aim.protectorShare ?? 1) < aim.odds) return { state: 'waiting', why: `it does not like its odds against ${target}` };
  return { state: 'ready' };
}

/** Is this aim pointless now (the country or its target is gone, or the government has changed)? */
function aimStatusDropped(d: DipDraft, aim: Aim): boolean {
  if (aim.act.do === 'award') return !alive(d, aim.country) || governmentOf(d, aim.country) !== aim.regime || !alive(d, aim.act.from) || d.day - aimDay(d, aim) > 365;
  const target = aim.act.do === 'event' ? null : aim.act.do === 'pact' ? aim.act.with : aim.act.do === 'incident' ? aim.act.against[0] : aim.act.on;
  return !alive(d, aim.country) || governmentOf(d, aim.country) !== aim.regime || (!!target && !alive(d, target)) || (!!target && aim.act.do !== 'pact' && (d.wars.includes(warKey(aim.country, target)) || allied(d.diplomacy, aim.country, target)));
}

/** Carry out an entry of the agenda (go), or put it off for a week. Called from step() for the AI's `aim` orders. */
export function carryOutAim(d: DipDraft, id: string, go: boolean): void {
  const aim = AIM_BY_ID.get(id);
  const dip = d.diplomacy;
  if (!aim || dip.agenda[id] === 'done' || dip.agenda[id] === 'dropped' || aim.country === d.player) return;
  if (!go) {
    dip.agenda[id] = d.day - aimDay(d, aim) > GIVE_UP_DAYS || aimStatusDropped(d, aim) ? 'dropped' : d.day + RETRY_DAYS;
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
      if (act.surprise && d.wars.includes(warKey(aim.country, act.on))) surpriseLanding(d, aim.country, act.surprise.province, act.surprise.divisions);
      break;
    case 'incident':
      startIncident(d, act.with, act.against, act.provinces, act.days, aim.news);
      break;
    case 'award': {
      for (const p of act.provinces) {
        if (d.owner[p] !== act.from || d.controller[p] !== act.from) continue;
        d.owner[p] = aim.country;
        d.controller[p] = aim.country;
      }
      const e = d.economies[act.from];
      if (e) e.stability = Math.max(0, e.stability - 8);
      shift(dip, act.from, aim.country, -20);
      shift(dip, aim.country, 'Germany', 15);
      raiseTension(d, 2);
      note(d, 'crisis', aim.news, [aim.country, act.from, 'Germany']);
      sendHome(d);
      break;
    }
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

/** An AI army starts moving to the border this many days before a war its government has planned: longer for a great power, whose army has further to come. */
export const MASS_DAYS = 45;
export const MASS_DAYS_MAJOR = 100;
/** The wars AI governments are about to start: [attacker, target]. Their armies deploy to the border first (ai.ts). */
export function plannedWars(w: World): [string, string][] {
  const out: [string, string][] = [];
  for (const aim of AGENDA) {
    // Not the border wars for a few provinces: those are fought with whatever stands near.
    if (aim.act.do !== 'war' || aim.country === w.player || aim.act.limited) continue;
    const mark = w.diplomacy.agenda[aim.id];
    if (mark === 'done' || mark === 'dropped') continue;
    const left = aimDay(w, aim) - w.day;
    if (left > (isMajor(aim.act.on) ? MASS_DAYS_MAJOR : MASS_DAYS) || left < -GIVE_UP_DAYS) continue;
    if (!alive(w, aim.country) || !alive(w, aim.act.on) || governmentOf(w, aim.country) !== aim.regime || fighting(w, aim.country, aim.act.on) || allied(w.diplomacy, aim.country, aim.act.on)) continue;
    // Before the date it deploys in any case; after it, only while it is still weighing its odds.
    if (left <= 0 && aim.needs?.(w)) continue;
    out.push([aim.country, aim.act.on]);
  }
  return out;
}

/**
 * In Story mode no AI country makes a negotiated peace with Germany or Italy while they are
 * ruled by their fascist governments, or with an ally of theirs at war beside them: the real
 * war in Europe ended only in surrender, an armistice or a change of sides. (A player may still
 * offer peace, and the AI answers it in the usual way.) Border wars for a few provinces are not
 * affected.
 */
export function toTheEnd(w: Pick<World, 'mode' | 'economies' | 'capitulated' | 'diplomacy'>, a: string, b: string): boolean {
  if (w.mode !== 'story' || w.diplomacy.aims[warKey(a, b)]) return false;
  // Nor between Japan's side and China's while Japan's army rules in Tokyo (1.8): Japan's terms meant the end of China, and Chiang refused them for eight years.
  if ([a, b].some((x) => JAPAN_SIDE.includes(x)) && [a, b].some((x) => CHINA_SIDE.includes(x)) && alive(w, 'Japan') && governmentOf(w, 'Japan') === 'authoritarian') return true;
  return [a, b].some((x) => (x === 'Germany' || x === 'Italy') && alive(w, x) && governmentOf(w, x) === 'fascist');
}
const JAPAN_SIDE = ['Japan', 'Manchukuo'];
const CHINA_SIDE = ['China', 'Chinese Communists'];

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
      if (other !== w.player && toTheEnd(w, me, other)) continue;
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
