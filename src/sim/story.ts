/**
 * Story mode: history cards, story events with choices, chapters and the end of the game.
 *
 *   History cards   On its real date each card (content/history.ts) is filed in the world with a
 *                   line comparing real history with your game on that day.
 *   Story events    Real dilemmas put to the player as decisions: the Rhineland, the war in
 *                   Spain, the guarantee to Poland, Norway, the armistice with France. When the
 *                   AI leads the country it does what was really done.
 *   Spain           The civil war is fought off the map. Who wins depends on who sends help.
 *   Army effects    Passing conditions on a whole army: the Red Army after the Terror, a great
 *                   power caught by surprise (diplomacy.ts adds that one).
 *   Lend-Lease      American equipment for Britain from March 1941 and for the Soviet Union
 *                   from October 1941, while they fight Germany.
 *   Chapters        Three stretches of the story with objectives for your country (chapters.ts).
 *   The end         8 May 1945, or the day the war between the great powers is over. The player
 *                   may keep playing after it.
 *
 * Free-for-all uses none of the history. It gets a few random events a year, and its clock
 * runs out on `story.endDay`.
 *
 * Atrocities are history cards only. Nothing here lets a player order one, and nothing rewards one.
 *
 * Pure TypeScript with no UI. runStory changes the draft of the world that step() made.
 */
import { CARDS, type HistoryCard } from '../content/history';
import { AGENDA, aimDay, dayOf, surpriseLanding } from './agenda';
import { CHAPTERS } from './chapters';
import { COUNTRIES } from './countries';
import { addPact, alive, allied, ask, between, dropPacts, endWar, governmentOf, hasPact, isMajor, note, raiseTension, relation, restore, setEventHook, shift, startWar, type DipDraft } from './diplomacy';
import { partsOf, PROVINCES } from './map';
import { Rng, seedFrom } from './rng';
import type { ArmyEffect, Decision, LineKind, StartId, StoryState } from './types';
import { warKey } from './war';
import { dateWords } from './dmath';

export { dayOf } from './agenda';

/** Story mode ends on the day the real war in Europe ended. */
export const VE_DAY = '1945-05-08';
/** The short scenario's finish line. */
export const SCENARIO_END = '1942-01-01';
/** Free-for-all runs for ten years. */
export const FREE_FOR_ALL_DAYS = 3653;
/** With loose history each AI aim moves by between this many days early and this many days late. */
export const DRIFT_DAYS: [number, number] = [-45, 150];
/** Marching into the Rhineland in 1936 sets every later German move back by this long. */
export const RHINELAND_DELAY = 300;
/** The Red Army after the Terror, from June 1937 to the middle of 1942. */
export const PURGE = { from: '1937-06-11', to: '1942-06-30', attack: 0.85, defence: 0.9 };
/** France in the weeks after Germany attacks through the Low Countries. */
export const SHOCK = { days: 120, power: 0.65 };
/** The countries of the western front in 1939-40: a German attack on any of them ends the phoney war. */
const WEST = ['France', 'United Kingdom', 'Belgium', 'Netherlands', 'Luxembourg'];
/** Greece and Yugoslavia when Germany attacks them in April 1941. */
export const BALKAN_SHOCK = { days: 60, power: 0.6 };
export const LEND_LEASE = { britain: '1941-03-11', soviet: '1941-10-01' };
/**
 * The Soviet Far East. From the border war with Japan in 1938 the Soviet Union kept about a
 * quarter of its army in Siberia and Mongolia, which are not on this map. In the autumn of 1941
 * its spy in Tokyo, Richard Sorge, reported that Japan would strike south instead, and the
 * "Siberian divisions" came west in time for the battle of Moscow. In the game those divisions
 * leave the map (they are still paid for), and two fifths of them come back to Moscow in two
 * halves from November 1941 if the Soviet Union is at war with a great power in Europe by then.
 */
export const FAR_EAST = { from: '1938-07-29', share: 0.25, until: '1941-10-15', back: 0.4 };
/**
 * Short of fuel oil, the Italian fleet hardly left harbour after the autumn of 1942: its last
 * big sortie was in June 1942. From this date an AI Italy in Story mode keeps its fleets in port.
 */
export const ITALIAN_FUEL = { country: 'Italy', from: '1942-11-01' };
/** Sets of equipment, wings of aircraft and ships that arrive each month under Lend-Lease. */
export const LEND_LEASE_GOODS: Record<string, Partial<Record<LineKind, number>>> = {
  'United Kingdom': { infantry: 0.6, artillery: 0.2, armour: 0.2, fighter: 0.3, bomber: 0.15, escort: 0.3 },
  'Soviet Union': { infantry: 0.6, armour: 0.3, fighter: 0.3 },
};
/**
 * Italy changes sides. From 25 July 1943, once the Allies stand on Italian soil in Europe (or
 * Italy has lost Libya and its people have had enough), the King dismisses Mussolini. Six weeks
 * later Italy signs an armistice, makes peace with its enemies, and joins the Allies; Germany,
 * if it is still ruled as before, invades its former ally. This happens only to an AI Italy.
 */
export const ITALY_FALL = { from: '1943-07-25', days: 45, warSupport: 35 };
/** Italy's provinces in Europe, as opposed to its colonies in Africa. */
const ITALY_EUROPE = ['Sicily', 'Calabria', 'Campania', 'Apulia', 'Lazio', 'Umbria', 'Emilia', 'Lombardy', 'Piedmont', 'Veneto', 'Sardinia'];
/** A list of province names, with every part cut from them for the finer map (map.ts). */
const withParts = (names: string[]): number[] => names.flatMap((n) => partsOf(P(n)));
/** The line every atrocity card carries. */
export const ATROCITY_LINE = 'This card records real history. The game does not model these crimes, and nothing you do in it causes or rewards them.';

/** The parts of France a French government at Vichy kept in 1940: the south and the colonies. */
const VICHY = ['Provence', 'Burgundy', 'Languedoc', 'Roussillon', 'Limousin', 'Guyenne', 'Corsica', 'Oran', 'Constantine', 'Tunisia', 'Fez', 'Marrakech', 'Damascus', 'Syrian Desert'];

const P = (name: string): number => PROVINCES.find((p) => p.name === name)!.id;
const capitalOf = (name: string): number => PROVINCES.find((p) => p.capital && p.owner === name)!.id;
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));
const fighting = (d: Pick<DipDraft, 'wars'>, a: string, b: string): boolean => d.wars.includes(warKey(a, b));
const beaten = (d: Pick<DipDraft, 'capitulated' | 'story'>, name: string): boolean => d.capitulated.includes(name) || d.story.armistice.includes(name);
const did = (d: Pick<DipDraft, 'diplomacy'>, aim: string): boolean => d.diplomacy.agenda[aim] === 'done';
const dateOf = dateWords;
/** A month's output of a country in money, counted from its factories. */
const monthOutput = (d: DipDraft, name: string): number => {
  let factories = 0;
  for (const p of PROVINCES) if (d.controller[p.id] === name) factories += d.factories.civ[p.id] + d.factories.mil[p.id];
  return factories * 10 * ((d.economies[name]?.priceLevel ?? 100) / 100);
};
/** Share of a country's own victory points in other hands. */
const lostShare = (d: Pick<DipDraft, 'owner' | 'controller'>, name: string): number => {
  let total = 0;
  let away = 0;
  for (const p of PROVINCES) {
    if (p.owner !== name) continue;
    total += p.victoryPoints;
    if (d.controller[p.id] !== name) away += p.victoryPoints;
  }
  return total ? away / total : 0;
};
const pct = (x: number): string => `${Math.round(100 * x)}%`;

// ---------- the start ----------

export function startStory(start: StartId = '1936', history: 'close' | 'loose' = 'close', seed = 0): StoryState {
  const drift: Record<string, number> = {};
  if (history === 'loose') {
    const rng = new Rng(seedFrom(`${seed}:drift`));
    for (const aim of AGENDA) drift[aim.id] = Math.round(DRIFT_DAYS[0] + rng.next() * (DRIFT_DAYS[1] - DRIFT_DAYS[0]));
  }
  return {
    start, history, drift, cards: [], fired: [], choices: {}, spain: { state: 'peace', balance: 0 }, effects: [], armistice: [], chapters: [], losses: {},
    playerWar: { first: null, last: null, days: 0 }, greatWar: null, ended: null, endDay: FREE_FOR_ALL_DAYS, opportunist: false,
  };
}

export const cloneStory = (s: StoryState): StoryState => ({
  ...s, drift: { ...s.drift }, cards: [...s.cards], fired: [...s.fired], choices: { ...s.choices }, spain: { ...s.spain }, effects: [...s.effects], armistice: [...s.armistice],
  chapters: [...s.chapters], losses: { ...s.losses }, playerWar: { ...s.playerWar },
});

/** The army effects in force today for one country, for the sidebar. */
export const effectsOn = (w: { story: StoryState; day: number }, country: string): ArmyEffect[] => w.story.effects.filter((x) => x.country === country && x.until >= w.day);

// ---------- history cards ----------

type Compare = (d: DipDraft) => string;
const also = (yes: boolean, same: string, different: string): string => (yes ? same : different);
const holder = (d: DipDraft, province: number): string => d.controller[province];
const status = (d: DipDraft, name: string): string => (d.capitulated.includes(name) ? `${name} has been conquered` : d.story.armistice.includes(name) ? `${name} has signed an armistice` : `${name} is still independent`);
const eastFront = (d: DipDraft): string =>
  fighting(d, 'Germany', 'Soviet Union')
    ? `Germany and the Soviet Union are at war. Germany and its allies hold ${pct(lostShare(d, 'Soviet Union'))} of the Soviet Union's victory points; Moscow is in ${holder(d, capitalOf('Soviet Union')) === 'Soviet Union' ? 'Soviet' : 'enemy'} hands.`
    : d.capitulated.includes('Germany')
      ? 'Germany has already surrendered.'
      : d.capitulated.includes('Soviet Union')
        ? 'The Soviet Union has already been beaten.'
        : 'Germany and the Soviet Union are not at war.';
const spainLine = (d: DipDraft): string =>
  ({ peace: 'There is no civil war in Spain.', war: `The war in Spain is being fought, and ${d.story.spain.balance > 0 ? 'the Nationalists are' : 'the Republic is'} ahead.`, nationalist: 'Franco has won the war in Spain.', republic: 'The Spanish Republic has survived.' })[d.story.spain.state];
const finance = (d: DipDraft, name: string): string => {
  const e = d.economies[name];
  return e ? `${name} takes ${pct(e.taxRate)} of output in tax, covers ${pct(e.bondShare)} of any shortfall with bonds and prints the rest. Its prices are rising ${e.inflation.toFixed(1)}% a year${e.rationing ? ', with rationing' : ''}.` : '';
};

/** "In your game ..." for each card. Cards not listed here are atrocity cards and carry ATROCITY_LINE. */
const COMPARE: Record<string, Compare> = {
  rhineland: (d) => (did(d, 'rhineland') ? 'German troops marched in on the same day.' : d.player === 'Germany' ? 'The decision is on your desk.' : 'Germany has not moved.'),
  matignon: (d) => `France's stability is ${Math.round(d.economies.France?.stability ?? 0)} and its prices are rising ${(d.economies.France?.inflation ?? 0).toFixed(1)}% a year.`,
  spain: spainLine,
  'four-year-plan': (d) => finance(d, 'Germany'),
  axis: (d) => `Relations between Germany and Italy stand at ${Math.round(relation(d.diplomacy, 'Germany', 'Italy'))} on a scale from -100 to 100${allied(d.diplomacy, 'Germany', 'Italy') ? ', and they are allies' : ''}.`,
  guernica: (d) => `${spainLine(d)} ${ATROCITY_LINE}`,
  terror: () => `The Red Army fights at ${pct(PURGE.attack)} in attack and ${pct(PURGE.defence)} in defence until the middle of 1942, whoever leads the Soviet Union. ${ATROCITY_LINE}`,
  anschluss: (d) => (d.owner[capitalOf('Austria')] === 'Germany' ? 'Austria was annexed by Germany too.' : `${status(d, 'Austria')}.`),
  munich: (d) => (did(d, 'munich') ? 'Czechoslovakia gave up its border districts too.' : d.capitulated.includes('Czechoslovakia') ? 'Czechoslovakia is already gone.' : `Czechoslovakia has kept its border districts${fighting(d, 'Germany', 'Czechoslovakia') ? ' and is at war with Germany' : ''}.`),
  'vienna-1': (d) => also(d.owner[P('Ruthenia')] === 'Hungary', 'Hungary was given Ruthenia too.', 'Ruthenia has not gone to Hungary.'),
  prague: (d) => (d.owner[capitalOf('Czechoslovakia')] === 'Germany' ? 'Prague is in German hands too.' : `${status(d, 'Czechoslovakia')}.`),
  guarantee: (d) => also(hasPact(d.diplomacy, 'guarantee', 'United Kingdom', 'Poland') || allied(d.diplomacy, 'United Kingdom', 'Poland'), 'Britain has promised to defend Poland too.', d.player === 'United Kingdom' ? 'The decision is on your desk.' : 'Britain has made Poland no promise.'),
  'spain-end': spainLine,
  albania: (d) => also(d.owner[P('Albania')] === 'Italy', 'Italy has taken Albania too.', `${status(d, 'Albania')}.`),
  steel: (d) => also(allied(d.diplomacy, 'Germany', 'Italy'), 'Germany and Italy are allies too.', 'Germany and Italy are not allies.'),
  pact: (d) => also(hasPact(d.diplomacy, 'nonAggression', 'Germany', 'Soviet Union'), 'Germany and the Soviet Union have signed their pact too.', fighting(d, 'Germany', 'Soviet Union') ? 'Germany and the Soviet Union are at war.' : 'There is no pact between Germany and the Soviet Union.'),
  poland: (d) => (fighting(d, 'Germany', 'Poland') ? 'Germany and Poland are at war too.' : d.capitulated.includes('Poland') ? 'Poland has already fallen.' : 'Germany and Poland are at peace.'),
  declare: (d) => {
    const who = ['United Kingdom', 'France'].filter((x) => fighting(d, x, 'Germany'));
    return who.length === 2 ? 'Britain and France are at war with Germany too.' : who.length ? `Only ${who[0] === 'France' ? 'France' : 'Britain'} is at war with Germany.` : 'Neither Britain nor France is at war with Germany.';
  },
  'soviet-poland': (d) => (fighting(d, 'Soviet Union', 'Poland') || d.owner[P('Volhynia')] === 'Soviet Union' ? 'The Red Army has entered eastern Poland too.' : 'The Soviet Union has not moved against Poland.'),
  'winter-war': (d) => also(fighting(d, 'Soviet Union', 'Finland'), 'The Soviet Union and Finland are at war too.', 'The Soviet Union and Finland are at peace.'),
  rationing: (d) => `${d.economies['United Kingdom']?.rationing ? 'Britain is rationing too.' : 'Britain has not brought in rationing.'} Its prices are rising ${(d.economies['United Kingdom']?.inflation ?? 0).toFixed(1)}% a year.`,
  keynes: (d) => finance(d, d.player ?? 'United Kingdom'),
  norway: (d) => (fighting(d, 'Germany', 'Norway') ? 'Germany has attacked Norway too.' : d.capitulated.includes('Norway') ? 'Norway has already fallen.' : 'Norway is at peace.'),
  west: (d) => (['Belgium', 'Netherlands'].some((x) => fighting(d, 'Germany', x) || d.diplomacy.conquered[x] === 'Germany') ? 'Germany has attacked through the Low Countries too.' : fighting(d, 'Germany', 'France') ? 'Germany and France are at war, but the Low Countries are untouched.' : 'There is no war in the west.'),
  dunkirk: (d) => (fighting(d, 'Germany', 'France') ? `Germany holds ${pct(lostShare(d, 'France'))} of France's victory points.` : beaten(d, 'France') ? 'France has already been beaten.' : 'France and Germany are not at war.'),
  italy: (d) => also(fighting(d, 'Italy', 'France') || fighting(d, 'Italy', 'United Kingdom'), 'Italy has entered the war too.', d.capitulated.includes('Italy') ? 'Italy has been beaten.' : 'Italy is staying out.'),
  armistice: (d) => (d.story.armistice.includes('France') ? 'France has signed an armistice too.' : d.capitulated.includes('France') ? 'France has surrendered and is occupied.' : fighting(d, 'Germany', 'France') ? `France is still fighting. Germany holds ${pct(lostShare(d, 'France'))} of its victory points.` : 'France is not at war with Germany.'),
  baltic: (d) => {
    const taken = ['Estonia', 'Latvia', 'Lithuania'].filter((x) => d.owner[capitalOf(x)] === 'Soviet Union');
    return taken.length === 3 ? 'The Soviet Union has taken all three Baltic states too.' : taken.length ? `The Soviet Union has taken ${taken.join(' and ')}.` : 'The Baltic states are still independent of the Soviet Union.';
  },
  'vienna-2': (d) => also(d.owner[P('Crișana')] === 'Hungary', 'Hungary was given northern Transylvania too.', 'Northern Transylvania has not gone to Hungary.'),
  britain: (d) => (fighting(d, 'Germany', 'United Kingdom') ? 'Britain and Germany are at war. Open the Air and sea map to see who holds the sky over the Channel.' : d.capitulated.includes('United Kingdom') ? 'Britain has been beaten.' : 'Britain and Germany are not at war.'),
  tripartite: (d) => {
    const allies = COUNTRIES.map((c) => c.name).filter((x) => allied(d.diplomacy, 'Germany', x));
    return allies.length ? `Germany's allies are ${allies.join(', ')}.` : 'Germany has no allies.';
  },
  greece: (d) => (fighting(d, 'Italy', 'Greece') ? 'Italy has attacked Greece too.' : d.capitulated.includes('Greece') ? 'Greece has already fallen.' : 'Greece is at peace with Italy.'),
  compass: (d) => (fighting(d, 'Italy', 'United Kingdom') ? `Italy and Britain are at war. Tripoli is held by ${holder(d, P('Tripolitania'))} and Cairo by ${holder(d, capitalOf('Egypt'))}.` : 'Italy and Britain are not at war.'),
  'lend-lease': (d) => (fighting(d, 'Germany', 'United Kingdom') ? 'American equipment now reaches Britain every month.' : 'Britain is not at war with Germany, so no American aid is flowing.'),
  balkans: (d) => `${status(d, 'Yugoslavia')}${fighting(d, 'Germany', 'Yugoslavia') ? ' and at war with Germany' : ''}; ${status(d, 'Greece').replace(/^Greece/, 'Greece')}${fighting(d, 'Germany', 'Greece') ? ' and at war with Germany' : ''}.`,
  barbarossa: eastFront,
  'atlantic-charter': () => 'The United States is not on this game\'s map. Its help reaches Britain and the Soviet Union as Lend-Lease while they fight Germany.',
  moscow: eastFront,
  usa: (d) => (d.capitulated.includes('Germany') ? 'Germany has already surrendered.' : 'The United States is not on this game\'s map, so no American army will arrive. Lend-Lease continues.'),
  stalingrad: eastFront,
  'italy-armistice': (d) => (d.capitulated.includes('Italy') ? 'Italy has been beaten too.' : fighting(d, 'Italy', 'United Kingdom') ? `Italy is still in the war. Enemies hold ${pct(lostShare(d, 'Italy'))} of its victory points.` : 'Italy is not at war with Britain.'),
  'd-day': (d) => `Paris is held by ${holder(d, capitalOf('France'))} and Normandy by ${holder(d, P('Normandy'))}.`,
  've-day': (d) => (d.capitulated.includes('Germany') ? 'Germany has already surrendered.' : d.wars.some((k) => k.split('|').every(isMajor)) ? 'The war between the great powers goes on.' : 'The great powers are at peace.'),
};

/** The comparison line for a card on this day. */
export function compare(d: DipDraft, card: HistoryCard): string {
  const f = COMPARE[card.id];
  return f ? f(d) : ATROCITY_LINE;
}

const CARD_DAYS = (() => {
  const cache = new Map<string, Map<number, HistoryCard[]>>();
  return (startDate: string): Map<number, HistoryCard[]> => {
    let m = cache.get(startDate);
    if (!m) {
      m = new Map();
      for (const c of CARDS) {
        const day = dayOf(startDate, c.date);
        m.set(day, [...(m.get(day) ?? []), c]);
      }
      cache.set(startDate, m);
    }
    return m;
  };
})();

// ---------- story events ----------

interface StoryEvent {
  id: string;
  date: string;
  /** The countries whose player is asked. */
  for: string[];
  /** Is there still something to decide? */
  when: (d: DipDraft, me: string) => boolean;
  title: (me: string) => string;
  text: (me: string) => string;
  options: (me: string) => { label: string; effect: string }[];
  /** What was really done, which is also the answer if the player lets the deadline pass. */
  historical: (me: string) => number;
  apply: (d: DipDraft, me: string, option: number) => void;
}

const stab = (d: DipDraft, name: string, by: number): void => {
  const e = d.economies[name];
  if (e) e.stability = clamp(e.stability + by, 0, 100);
};
const support = (d: DipDraft, name: string, by: number): void => {
  const e = d.economies[name];
  if (e) e.warSupport = clamp(e.warSupport + by, 0, 100);
};
const effect = (d: DipDraft, x: ArmyEffect): void => {
  d.story.effects = [...d.story.effects.filter((y) => !(y.id === x.id && y.country === x.country)), x];
};

/** What the Rhineland move does when Germany makes it (the same as the AI's agenda entry). */
function enterRhineland(d: DipDraft): void {
  d.diplomacy.agenda.rhineland = 'done';
  raiseTension(d, 5);
  shift(d.diplomacy, 'Germany', 'France', -10);
  shift(d.diplomacy, 'Germany', 'United Kingdom', -5);
  d.diplomacy.causes.push({ by: 'France', on: 'Germany', until: d.day + 120, why: 'Germany broke the Locarno treaty by sending troops into the Rhineland' });
  note(d, 'crisis', 'German troops march into the demilitarised Rhineland, breaking the Locarno treaty', ['Germany']);
}

/** A French government keeps the south and the colonies; Germany keeps what it occupies in the north. */
export function signArmistice(d: DipDraft): void {
  if (!d.capitulated.includes('France') || d.story.armistice.includes('France')) return;
  const zone = new Set(withParts(VICHY));
  let any = false;
  for (const p of PROVINCES) {
    // Italy signed its own armistice two days later and kept only a few villages on the coast.
    if (!zone.has(p.id) || d.owner[p.id] !== 'France' || (d.controller[p.id] !== 'Germany' && d.controller[p.id] !== 'Italy')) continue;
    d.controller[p.id] = 'France';
    any = true;
  }
  if (!any) return;
  // Divisions standing in the zone go home, as after any peace (restore calls nothing of the kind, so do it here).
  const home = capitalOf('Germany');
  for (const u of d.units) {
    if (!zone.has(u.at) || u.owner === 'France' || d.controller[u.at] !== 'France') continue;
    const back = PROVINCES.find((p) => p.capital && p.owner === u.owner && d.controller[p.id] === u.owner)?.id ?? home;
    u.at = back;
    u.path = [];
    u.progress = 0;
    u.dugIn = 0;
    u.sea = undefined;
    u.landing = undefined;
  }
  const e = d.economies.France;
  if (e) e.government = 'authoritarian';
  d.story.armistice = [...d.story.armistice, 'France'];
  restore(d, 'France', null);
  // The small army the armistice allows gathers at Lyon, not on an island.
  const lyon = PROVINCES.find((p) => p.city === 'Lyon')!.id;
  if (d.controller[lyon] === 'France') for (const u of d.units) if (u.owner === 'France') u.at = lyon;
  for (const other of ['Germany', 'Italy']) d.diplomacy.truces[warKey('France', other)] = d.day + 5 * 365;
  note(d, 'peace', 'France signs an armistice. Germany occupies the north and the Atlantic coast; a French government at Vichy keeps the south and the colonies, and leaves the war', ['France', 'Germany']);
}

const SPAIN_SIDES: Record<string, { side: number; send: string; sendEffect: string; stay: string; stayEffect: string; text: string }> = {
  Germany: { side: 1, send: 'Send aircraft and "volunteers" to Franco', sendEffect: 'Helps the Nationalists. Costs a tenth of a month\'s output. Your army learns from the fighting: +3% attack until 1942. Relations with Britain and France fall by 5.', stay: 'Stay out', stayEffect: 'Nothing changes for you. Without German help the Nationalists are weaker.', text: 'General Franco asks for transport aircraft to carry his army from Morocco to Spain, and for more after that.' },
  Italy: { side: 1, send: 'Send troops and aircraft to Franco', sendEffect: 'Helps the Nationalists. Costs a tenth of a month\'s output. Your army learns from the fighting: +3% attack until 1942. Relations with Britain and France fall by 5.', stay: 'Stay out', stayEffect: 'Nothing changes for you. Without Italian help the Nationalists are weaker.', text: 'General Franco asks Italy for aircraft and men.' },
  'Soviet Union': { side: -1, send: 'Sell arms to the Republic and send advisers', sendEffect: 'Helps the Republic. Costs a tenth of a month\'s output. Relations with Germany and Italy fall by 5.', stay: 'Stay out', stayEffect: 'Nothing changes for you. Without Soviet arms the Republic is weaker.', text: 'The Spanish Republic asks to buy tanks and aircraft, and offers its gold reserve in payment.' },
  'United Kingdom': { side: -2, send: 'Sell arms to the Republic', sendEffect: 'Helps the Republic a great deal. Stability -4 (the country is divided over Spain), world tension +3, relations with Germany and Italy fall by 10.', stay: 'Non-intervention', stayEffect: 'Nothing changes for you. Germany and Italy will ignore the agreement.', text: 'The elected government of Spain asks to buy arms. Your cabinet fears that taking sides could turn a civil war into a European one.' },
  France: { side: -2, send: 'Sell arms to the Republic', sendEffect: 'Helps the Republic a great deal. Stability -6 (France itself is bitterly divided over Spain), world tension +3, relations with Germany and Italy fall by 10.', stay: 'Non-intervention', stayEffect: 'Nothing changes for you. Germany and Italy will ignore the agreement.', text: 'The elected government of Spain, a Popular Front like your own, asks to buy arms. Half of France would cheer and the other half would be in the streets.' },
};

const EVENTS: StoryEvent[] = [
  {
    id: 'rhineland-france', date: '1936-03-07', for: ['France'],
    when: (d) => did(d, 'rhineland') && alive(d, 'Germany') && !fighting(d, 'France', 'Germany'),
    title: () => 'German troops are in the Rhineland',
    text: () => 'Germany has broken the Locarno treaty. Your generals say the army cannot move without a costly mobilisation, Britain advises calm, and an election is six weeks away. What you do not know for certain: the German commanders have orders to withdraw if you march.',
    options: () => [
      { label: 'Protest, and do nothing more', effect: 'What France really did. You keep a cause for war against Germany for 120 days.' },
      { label: 'Mobilise and send the army in', effect: `Germany pulls back. Its government loses 10 stability and every later German move is set back by about ${Math.round(RHINELAND_DELAY / 30)} months. You lose 6 stability, relations with Britain fall by 10 and world tension rises by 5.` },
    ],
    historical: () => 0,
    apply: (d, _me, option) => {
      if (option !== 1) return;
      stab(d, 'Germany', -10);
      support(d, 'Germany', -5);
      stab(d, 'France', -6);
      support(d, 'France', 5);
      shift(d.diplomacy, 'France', 'United Kingdom', -10);
      shift(d.diplomacy, 'France', 'Germany', -15);
      raiseTension(d, 5);
      for (const aim of AGENDA) if (aim.country === 'Germany' && !did(d, aim.id)) d.story.drift[aim.id] = (d.story.drift[aim.id] ?? 0) + RHINELAND_DELAY;
      d.story.fired.push('rhineland-reversed');
      note(d, 'crisis', 'French troops enter the Rhineland. The German battalions withdraw across the Rhine without a shot', ['France', 'Germany']);
    },
  },
  {
    id: 'rhineland-germany', date: '1936-03-07', for: ['Germany'],
    when: (d) => !did(d, 'rhineland'),
    title: () => 'The Rhineland',
    text: () => 'The treaties of 1919 and 1925 forbid German troops on German soil west of the Rhine. Your generals warn that the army is far too weak to fight France if it reacts. Your diplomats think it will not.',
    options: () => [
      { label: 'Send the troops in', effect: 'What Germany really did. World tension +5, relations with France -10 and with Britain -5, and France gains a cause for war for 120 days. At home: stability +4, war support +4.' },
      { label: 'Wait', effect: 'Nothing changes. The zone stays empty of troops.' },
    ],
    historical: () => 0,
    apply: (d, _me, option) => {
      if (option !== 0) return void (d.diplomacy.agenda.rhineland = 'dropped');
      enterRhineland(d);
      stab(d, 'Germany', 4);
      support(d, 'Germany', 4);
    },
  },
  {
    id: 'spain-aid', date: '1936-07-24', for: Object.keys(SPAIN_SIDES),
    when: (d) => d.story.spain.state === 'war',
    title: () => 'The war in Spain',
    text: (me) => `Spain's army has risen against its elected government, and the country is splitting in two. ${SPAIN_SIDES[me].text} The war is fought off your map: who wins depends on which great powers send help.`,
    options: (me) => [
      { label: SPAIN_SIDES[me].send, effect: SPAIN_SIDES[me].sendEffect },
      { label: SPAIN_SIDES[me].stay, effect: SPAIN_SIDES[me].stayEffect },
    ],
    historical: (me) => (SPAIN_SIDES[me].side > 0 || me === 'Soviet Union' ? 0 : 1),
    apply: (d, me, option) => {
      if (option !== 0) return;
      const s = SPAIN_SIDES[me];
      d.story.spain = { ...d.story.spain, balance: d.story.spain.balance + s.side };
      const e = d.economies[me];
      if (me === 'United Kingdom' || me === 'France') {
        stab(d, me, me === 'France' ? -6 : -4);
        raiseTension(d, 3);
        for (const x of ['Germany', 'Italy']) shift(d.diplomacy, me, x, -10);
        note(d, 'info', `${me} sells arms to the Spanish Republic`, [me, 'Spain']);
      } else {
        if (e) e.treasury -= 0.1 * monthOutput(d, me);
        for (const x of me === 'Soviet Union' ? ['Germany', 'Italy'] : ['United Kingdom', 'France']) shift(d.diplomacy, me, x, -5);
        if (s.side > 0) effect(d, { id: 'spain', country: me, until: dayOf(d.startDate, '1941-12-31'), attack: 1.03, defence: 1, why: 'lessons learned in the war in Spain' });
        note(d, 'info', s.side > 0 ? `${me} sends men and aircraft to the Nationalists in Spain` : `${me} sends arms and advisers to the Spanish Republic`, [me, 'Spain']);
      }
    },
  },
  {
    id: 'guarantee-poland', date: '1939-03-31', for: ['United Kingdom'],
    when: (d) => alive(d, 'Poland') && alive(d, 'Germany') && !fighting(d, 'United Kingdom', 'Poland') && !fighting(d, 'Germany', 'Poland') && !allied(d.diplomacy, 'United Kingdom', 'Poland') && !hasPact(d.diplomacy, 'guarantee', 'United Kingdom', 'Poland') && (d.diplomacy.aggression.Germany ?? 0) >= 2,
    title: () => 'A guarantee for Poland?',
    text: () => 'Germany has broken its word again, and Poland looks like the next demand. The cabinet proposes a public promise: if Poland is attacked, Britain will fight. You have no way to send Poland an army, so the promise only works if Germany believes it.',
    options: () => [
      { label: 'Guarantee Poland', effect: 'What Britain really did. If Germany attacks Poland you will be asked to declare war. Relations with Poland rise.' },
      { label: 'Make no promise', effect: 'You keep your hands free. Poland stands with France alone.' },
    ],
    historical: () => 0,
    apply: (d, me, option) => {
      if (option !== 0) return;
      addPact(d, 'guarantee', me, 'Poland');
      note(d, 'pact', `${me} guarantees the independence of Poland`, [me, 'Poland']);
    },
  },
  {
    id: 'poland-germany', date: '1939-09-01', for: ['Germany'],
    when: (d) => d.story.start === '1939' && alive(d, 'Poland') && !fighting(d, 'Germany', 'Poland'),
    title: () => 'Poland: the order to attack',
    text: () => 'It is before dawn on 1 September 1939. The army is in position along the Polish border, and nine days ago the Soviet Union agreed in secret to take the eastern half of Poland. Britain and France have promised to defend Poland. Your generals expect them to declare war and then do very little.',
    options: () => [
      { label: 'Attack Poland', effect: 'What Germany really did. You are at war with Poland this morning, with a cause your own people accept. Britain and France will be asked to keep their promises.' },
      { label: 'Call it off', effect: 'The army stands down. There is no war today, and what happens next is up to you.' },
    ],
    historical: () => 0,
    apply: (d, me, option) => {
      if (option !== 0) return void (d.diplomacy.agenda.poland = 'dropped');
      d.diplomacy.causes.push({ by: me, on: 'Poland', until: d.day + 30, why: 'Danzig and the corridor' });
      startWar(d, me, 'Poland', 'attack');
      d.diplomacy.agenda.poland = 'done';
    },
  },
  {
    id: 'norway-germany', date: '1940-04-09', for: ['Germany'],
    when: (d) => alive(d, 'Norway') && !fighting(d, 'Germany', 'Norway') && !allied(d.diplomacy, 'Germany', 'Norway') && (fighting(d, 'Germany', 'United Kingdom') || fighting(d, 'Germany', 'France')),
    title: () => 'Norway',
    text: () => 'Swedish iron ore reaches Germany in winter through the Norwegian port of Narvik, and the British navy is getting ready to cut that route. The admirals propose to take Norway\'s ports in one morning, by surprise, before Britain can. It would risk most of the fleet.',
    options: () => [
      { label: 'Land in Norway', effect: 'What Germany really did. You declare war on Norway, and up to 8 rested infantry divisions from Germany land at Oslo the same day, fighting at the usual disadvantage of a landing against defenders caught by surprise.' },
      { label: 'Leave Norway alone', effect: 'Norway stays neutral.' },
    ],
    historical: () => 0,
    apply: (d, me, option) => {
      if (option !== 0) return;
      d.diplomacy.causes.push({ by: me, on: 'Norway', until: d.day + 30, why: 'the iron ore route from Sweden and bases against Britain' });
      startWar(d, me, 'Norway', 'attack');
      if (fighting(d, me, 'Norway')) surpriseLanding(d, me, P('Oslo'), 8);
    },
  },
  {
    id: 'armistice-germany', date: '1936-01-01', for: ['Germany'],
    when: (d) => d.capitulated.includes('France') && d.diplomacy.conquered.France === 'Germany' && !d.story.armistice.includes('France'),
    title: () => 'France asks for an armistice',
    text: () => 'The French army is beaten and Marshal Pétain asks for terms. You can occupy the whole country and its colonies, which takes many divisions. Or you can leave a French government in the south: it keeps the colonies quiet and out of British hands, and its fleet stays in port.',
    options: () => [
      { label: 'Sign an armistice', effect: 'What Germany really did. You keep the north and the Atlantic coast. A French government at Vichy keeps the south and the colonies, neutral, with a truce of five years.' },
      { label: 'Occupy all of France', effect: 'You hold every French province and colony, and must garrison them. You can annex France or set up a government from the Diplomacy panel.' },
    ],
    historical: () => 0,
    apply: (d, _me, option) => {
      if (option === 0) signArmistice(d);
    },
  },
];
const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

setEventHook((d: DipDraft, x: Decision, option: number) => {
  const e = x.event ? EVENT_BY_ID.get(x.event) : undefined;
  if (!e) return;
  d.story.choices = { ...d.story.choices, [e.id]: option };
  e.apply(d, x.country, option);
});

function askEvent(d: DipDraft, e: StoryEvent, me: string): void {
  ask(d, { country: me, kind: 'event', event: e.id, from: e.id.startsWith('spain') ? 'Spain' : e.id.includes('norway') ? 'Norway' : e.id.includes('poland') ? 'Poland' : e.id.includes('armistice') ? 'France' : e.id === 'rhineland-germany' ? 'France' : 'Germany', title: e.title(me), text: e.text(me), options: e.options(me), fallback: e.historical(me) });
}

// ---------- one day ----------

/** Free-for-all: a few things that happen to countries out of the blue. Uses its own seeded numbers, so nothing else in the game shifts. */
function randomEvents(d: DipDraft, seed: number): void {
  const rng = new Rng(seedFrom(`${seed}:events:${d.day}`));
  for (const c of COUNTRIES) {
    const e = d.economies[c.name];
    if (!e || !alive(d, c.name)) continue;
    const roll = rng.next();
    if (roll >= (c.major ? 0.05 : 0.02)) continue;
    const kind = Math.floor(rng.next() * 4);
    if (kind === 0) {
      e.stability = clamp(e.stability + 4, 0, 100);
      note(d, 'info', `A record harvest in ${c.name}: stability +4`, [c.name]);
    } else if (kind === 1) {
      e.stability = clamp(e.stability - 4, 0, 100);
      note(d, 'info', `A wave of strikes in ${c.name}: stability -4`, [c.name]);
    } else if (kind === 2) {
      const tech = e.research.slots.find((x) => x);
      if (!tech) continue;
      e.research.progress[tech] = (e.research.progress[tech] ?? 0) + 40;
      note(d, 'info', `A breakthrough in the laboratories of ${c.name}: 40 days of research gained`, [c.name]);
    } else {
      e.treasury -= 0.15 * monthOutput(d, c.name);
      note(d, 'info', `A bank fails in ${c.name}: the treasury pays out to stop a panic`, [c.name]);
    }
  }
}

/** The day's story. `monthEnd` is true on the last day of a month. `seed` is the world's seed. */
export function runStory(d: DipDraft, monthEnd: boolean, seed: number): void {
  const s = d.story;
  const me = d.player;

  // The record every game keeps: when the great powers went to war, and the player's own wars.
  if (s.greatWar === null && d.wars.some((k) => k.split('|').every(isMajor))) s.greatWar = d.day;
  if (me && d.wars.some((k) => k.split('|').includes(me))) s.playerWar = { first: s.playerWar.first ?? d.day, last: d.day, days: s.playerWar.days + 1 };
  if (s.effects.some((x) => x.until < d.day)) s.effects = s.effects.filter((x) => x.until >= d.day);

  // A tutorial lesson is a prepared situation: nothing happens in it but what the lesson set up.
  if (s.lesson) return;
  if (d.mode !== 'story') {
    if (monthEnd) randomEvents(d, seed);
    if (!s.ended && d.day >= s.endDay) s.ended = { day: d.day, why: 'The clock has run out.' };
    return;
  }
  const on = (date: string): boolean => d.day === dayOf(d.startDate, date);

  // Spain: the rising, and who has won by the day the real war ended.
  if (on('1936-07-17') && s.spain.state === 'peace' && alive(d, 'Spain') && !d.wars.some((k) => k.split('|').includes('Spain'))) {
    let balance = 0;
    for (const [name, side] of [['Germany', 1], ['Italy', 1], ['Soviet Union', -1]] as const) if (name !== me && alive(d, name) && governmentOf(d, name) === COUNTRIES.find((c) => c.name === name)!.government) balance += side;
    s.spain = { state: 'war', balance };
    note(d, 'crisis', 'Civil war in Spain: the army rises against the Republic', ['Spain']);
  }
  if (on('1939-04-01') && s.spain.state === 'war') {
    const e = d.economies.Spain;
    if (s.spain.balance > 0) {
      s.spain = { ...s.spain, state: 'nationalist' };
      if (e) e.government = 'authoritarian';
      note(d, 'government', 'General Franco wins the civil war in Spain and rules as a dictator', ['Spain']);
    } else {
      s.spain = { ...s.spain, state: 'republic' };
      raiseTension(d, -2);
      note(d, 'government', 'The Spanish Republic survives: the Nationalist rising is beaten', ['Spain']);
    }
    if (e) e.stability = clamp(e.stability - 10, 0, 100);
  }

  // April 1939: after Prague and Albania, Britain also promises to defend Greece. (An AI Britain only; a player decides for themselves.)
  if (on('1939-04-13') && me !== 'United Kingdom' && alive(d, 'United Kingdom') && alive(d, 'Greece') && governmentOf(d, 'United Kingdom') === 'democracy' && hasPact(d.diplomacy, 'guarantee', 'United Kingdom', 'Poland') && !fighting(d, 'United Kingdom', 'Greece') && !allied(d.diplomacy, 'United Kingdom', 'Greece')) {
    addPact(d, 'guarantee', 'United Kingdom', 'Greece');
    note(d, 'pact', 'The United Kingdom guarantees the independence of Greece', ['United Kingdom', 'Greece']);
  }
  // 31 March 1939: after Prague, an AI Britain promises to defend Poland on the real day. (A player gets a decision.)
  if (on('1939-03-31') && me !== 'United Kingdom' && did(d, 'prague') && alive(d, 'United Kingdom') && alive(d, 'Poland') && governmentOf(d, 'United Kingdom') === 'democracy' && !hasPact(d.diplomacy, 'guarantee', 'United Kingdom', 'Poland') && !allied(d.diplomacy, 'United Kingdom', 'Poland') && !fighting(d, 'United Kingdom', 'Poland')) {
    addPact(d, 'guarantee', 'United Kingdom', 'Poland');
    note(d, 'pact', 'The United Kingdom guarantees the independence of Poland', ['United Kingdom', 'Poland']);
  }
  // 28 April 1939: Germany tears up its 1934 pact with Poland. (An AI Germany that has taken Prague; a player decides for themselves.)
  if (on('1939-04-28') && me !== 'Germany' && did(d, 'prague') && hasPact(d.diplomacy, 'nonAggression', 'Germany', 'Poland')) {
    d.diplomacy.pacts = d.diplomacy.pacts.filter((p) => !(p.kind === 'nonAggression' && ((p.a === 'Germany' && p.b === 'Poland') || (p.a === 'Poland' && p.b === 'Germany'))));
    note(d, 'pact', 'Germany renounces its non-aggression pact with Poland', ['Germany', 'Poland']);
  }
  // September 1939 to May 1940, the "phoney war": an AI France and Britain sit behind the Maginot
  // line and wait, as the real ones did, and an AI Germany waits for its planned attack in the West.
  // It ends early if German divisions attack in the West some other way (a player Germany, say).
  if (!s.fired.includes('sickle-cut') && !s.fired.includes('west-struck') && d.units.some((u) => u.owner === 'Germany' && u.path.length > 0 && WEST.includes(d.controller[u.path[0]]))) {
    s.fired = [...s.fired, 'west-struck'];
    s.effects = s.effects.filter((x) => x.id !== 'phoney');
  }
  if (!s.fired.includes('sickle-cut') && !s.fired.includes('west-struck') && alive(d, 'Germany')) {
    const west = AGENDA.find((a) => a.id === 'west-belgium');
    const until = west ? aimDay(d, west) + 30 : dayOf(d.startDate, '1940-06-10');
    for (const name of ['France', 'United Kingdom', 'Germany']) {
      if (name === me || !alive(d, name) || d.day > until) continue;
      if (!(name === 'Germany' ? ['France', 'United Kingdom'].some((x) => fighting(d, 'Germany', x)) : fighting(d, name, 'Germany'))) continue;
      const why = name === 'Germany' ? 'its generals want the army back from Poland, and the winter past, before they attack in the West' : 'its generals plan to wait behind the Maginot line, as in 1939, until the blockade has worn Germany down';
      if (!s.effects.some((x) => x.id === 'phoney' && x.country === name)) effect(d, { id: 'phoney', country: name, until, attack: 1, defence: 1, why });
    }
  }
  // May 1940: the attack through the Low Countries finds the French command expecting 1914 again.
  if (!s.fired.includes('sickle-cut') && fighting(d, 'Germany', 'France') && alive(d, 'France') && ['Belgium', 'Netherlands'].some((x) => fighting(d, 'Germany', x))) {
    s.fired = [...s.fired, 'sickle-cut'];
    s.effects = s.effects.filter((x) => x.id !== 'phoney');
    for (const name of ['France', 'Belgium']) if (alive(d, name)) effect(d, { id: 'shock', country: name, until: d.day + SHOCK.days, attack: SHOCK.power, defence: SHOCK.power, why: 'its generals expected the war of 1914 again, and the armour came through the Ardennes' });
  }
  // April 1941: the Greek army is in Albania facing Italy, and the German armour comes through Yugoslavia behind it.
  if (!s.fired.includes('balkan-blitz') && fighting(d, 'Germany', 'Greece') && fighting(d, 'Italy', 'Greece')) {
    s.fired = [...s.fired, 'balkan-blitz'];
    for (const name of ['Greece', 'Yugoslavia']) if (alive(d, name) && fighting(d, 'Germany', name)) effect(d, { id: 'shock', country: name, until: d.day + BALKAN_SHOCK.days, attack: BALKAN_SHOCK.power, defence: BALKAN_SHOCK.power, why: name === 'Greece' ? 'most of its army was in Albania facing Italy, and the German armour came round through Yugoslavia' : 'its army was spread along every border, and was cut to pieces in days' });
  }
  // The Red Army after the Terror.
  if (on(PURGE.from) && alive(d, 'Soviet Union') && governmentOf(d, 'Soviet Union') === 'communist')
    effect(d, { id: 'purge', country: 'Soviet Union', until: dayOf(d.startDate, PURGE.to), attack: PURGE.attack, defence: PURGE.defence, why: 'most senior commanders were shot or dismissed in 1937 and 1938' });

  // France has fallen to Germany: an armistice. A German player chooses; an AI Germany does what was done.
  if (d.capitulated.includes('France') && d.diplomacy.conquered.France === 'Germany' && !s.fired.includes('armistice')) {
    s.fired = [...s.fired, 'armistice'];
    if (me === 'Germany') askEvent(d, EVENT_BY_ID.get('armistice-germany')!, me);
    else signArmistice(d);
  }
  // Liberation: a country under an armistice that has its capital back is itself again.
  for (const name of s.armistice) {
    if (d.controller[capitalOf(name)] !== name || d.capitulated.includes(name)) continue;
    s.armistice = s.armistice.filter((x) => x !== name);
    const e = d.economies[name];
    if (e) e.government = COUNTRIES.find((c) => c.name === name)!.government;
    note(d, 'government', `${name} is liberated: its old government returns to the capital`, [name]);
  }

  // Decisions for the player on their real dates.
  if (me && alive(d, me)) {
    for (const e of EVENTS) {
      if (e.id === 'armistice-germany' || !on(e.date) || !e.for.includes(me) || s.fired.includes(e.id) || !e.when(d, me)) continue;
      s.fired = [...s.fired, e.id];
      askEvent(d, e, me);
    }
  }

  if (monthEnd) farEast(d);
  allies(d);
  italyChangesSides(d);

  // Lend-Lease, once a month.
  if (monthEnd) {
    for (const [name, from] of [['United Kingdom', LEND_LEASE.britain], ['Soviet Union', LEND_LEASE.soviet]] as const) {
      const e = d.economies[name];
      if (!e || d.day < dayOf(d.startDate, from) || !alive(d, name) || !fighting(d, name, 'Germany')) continue;
      for (const [k, n] of Object.entries(LEND_LEASE_GOODS[name]) as [LineKind, number][]) e.stock[k] += n;
      if (!s.fired.includes(`lend-lease:${name}`)) {
        s.fired = [...s.fired, `lend-lease:${name}`];
        note(d, 'info', `Lend-Lease: American equipment begins to reach ${name} every month`, [name]);
      }
    }
  }

  // History cards.
  for (const card of CARD_DAYS(d.startDate).get(d.day) ?? []) s.cards = [...s.cards, { id: card.id, day: d.day, inGame: compare(d, card) }];

  // Chapters: on the last day of each, how did the player's objectives go?
  if (me) {
    for (const ch of CHAPTERS) {
      if (!on(ch.to) || s.chapters.some((x) => x.id === ch.id)) continue;
      const objectives = ch.objectives[me] ?? [];
      s.chapters = [...s.chapters, { id: ch.id, day: d.day, met: objectives.map((o) => !d.capitulated.includes(me) && o.test(d as never)) }];
    }
  }

  // The end.
  if (!s.ended) {
    const majorsFighting = d.wars.some((k) => k.split('|').every(isMajor));
    if (me && d.capitulated.includes(me)) s.ended = { day: d.day, why: `${me} has surrendered.` };
    else if (d.day >= dayOf(d.startDate, VE_DAY)) s.ended = { day: d.day, why: 'It is 8 May 1945, the day the real war in Europe ended.' };
    else if (s.greatWar !== null && !majorsFighting && d.day > s.greatWar + 90 && (!me || s.playerWar.last === null || d.day > s.playerWar.last + 30)) s.ended = { day: d.day, why: 'The great powers are at peace again.' };
    else if (s.start === '1939' && d.day >= dayOf(d.startDate, SCENARIO_END)) s.ended = { day: d.day, why: 'It is 1 January 1942: the September 1939 scenario ends here.' };
  }
}

/**
 * Small countries invaded by the Axis join the Allies when Britain is already at war with the
 * invader: Norway in April 1940, Greece in October 1940. Allied land is friendly ground, so
 * British troops can come to help (operations.ts). Not for a British player, who decides alone.
 */
function allies(d: DipDraft): void {
  const uk = 'United Kingdom';
  if (d.player === uk || !alive(d, uk) || governmentOf(d, uk) !== 'democracy') return;
  for (const [name, by] of [['Norway', ['Germany']], ['Greece', ['Italy', 'Germany']]] as const) {
    const key = `allies-${name.toLowerCase()}`;
    if (d.story.fired.includes(key) || !alive(d, name) || d.player === name) continue;
    const invader = by.find((x) => fighting(d, name, x) && fighting(d, uk, x));
    if (!invader) continue;
    d.story.fired = [...d.story.fired, key];
    if (allied(d.diplomacy, uk, name)) continue;
    addPact(d, 'alliance', uk, name);
    if (alive(d, 'France') && fighting(d, 'France', invader) && !allied(d.diplomacy, 'France', name) && d.player !== 'France') addPact(d, 'alliance', 'France', name);
    note(d, 'pact', `${name} joins the Allies: Britain promises to send troops`, [uk, name]);
  }
}

/** Italy dismisses Mussolini, and six weeks later changes sides (see ITALY_FALL). */
function italyChangesSides(d: DipDraft): void {
  const s = d.story;
  const it = 'Italy';
  if (d.player === it || !alive(d, it) || d.day < dayOf(d.startDate, ITALY_FALL.from) || s.fired.includes('italy-armistice')) return;
  if (!s.fired.includes('italy-fall')) {
    if (governmentOf(d, it) !== 'fascist' || !fighting(d, it, 'United Kingdom')) return;
    const invaded = withParts(ITALY_EUROPE).some((p) => d.controller[p] !== it && fighting(d, it, d.controller[p]));
    const libya = [P('Tripolitania'), P('Cyrenaica')].every((p) => d.controller[p] !== it) && (d.economies[it]?.warSupport ?? 50) < ITALY_FALL.warSupport;
    if (!invaded && !libya) return;
    s.fired = [...s.fired, 'italy-fall'];
    const e = d.economies[it];
    if (e) {
      e.government = 'authoritarian';
      e.warSupport = Math.min(e.warSupport, 20);
    }
    effect(d, { id: 'italy-fall', country: it, until: d.day + ITALY_FALL.days, attack: 0.8, defence: 0.8, why: 'Mussolini has fallen and the new government is looking for a way out of the war' });
    note(d, 'government', 'The King of Italy dismisses Mussolini and has him arrested. Marshal Badoglio forms a government and says the war goes on', [it]);
    return;
  }
  if (s.effects.some((x) => x.id === 'italy-fall' && x.country === it && x.until >= d.day)) return;
  // The armistice: peace with every enemy, the end of the alliance with Germany, and a new side.
  s.fired = [...s.fired, 'italy-armistice'];
  const uk = 'United Kingdom';
  const de = 'Germany';
  // Britain first, so that its troops already in Italy stay as allies.
  if (alive(d, uk) && governmentOf(d, uk) === 'democracy' && d.player !== uk) {
    addPact(d, 'alliance', uk, it);
    if (fighting(d, it, uk)) endWar(d, it, uk, 'white');
  }
  note(d, 'peace', 'Italy signs an armistice with the Allies and changes sides', [it, uk]);
  if (alive(d, de) && governmentOf(d, de) === 'fascist' && d.player !== de) {
    // Germany seizes every Italian-held province where its divisions stand, and disarms the Italian divisions in its reach.
    const reach = new Set<string>([de, ...d.diplomacy.pacts.filter((p) => p.kind === 'alliance' && (p.a === de || p.b === de) && p.a !== it && p.b !== it).map((p) => (p.a === de ? p.b : p.a))]);
    for (const p of PROVINCES) if (d.controller[p.id] === it && d.units.some((u) => u.at === p.id && u.owner === de)) d.controller[p.id] = de;
    const disarmed = d.units.filter((u) => u.owner === it && reach.has(d.controller[u.at])).length;
    d.units = d.units.filter((u) => !(u.owner === it && reach.has(d.controller[u.at])));
    dropPacts(d, (p) => p.kind === 'alliance' && (p.a === it || p.b === it) && (p.a !== uk && p.b !== uk));
    startWar(d, de, it, 'attack');
    note(d, 'war', `German troops occupy the Italian provinces they stand in and disarm ${disarmed} Italian divisions`, [de, it]);
  } else dropPacts(d, (p) => p.kind === 'alliance' && (p.a === it || p.b === it) && (p.a !== uk && p.b !== uk));
  for (const key of [...d.wars]) {
    const [a, b] = key.split('|');
    if ((a === it || b === it) && !key.split('|').includes(de)) endWar(d, a, b, 'white');
  }
}

/** Once a month: Soviet divisions go east to face Japan, or come back west (see FAR_EAST). */
function farEast(d: DipDraft): void {
  const s = d.story;
  const name = 'Soviet Union';
  if (!alive(d, name) || governmentOf(d, name) !== 'communist' || d.day < dayOf(d.startDate, FAR_EAST.from)) return;
  const away = s.farEast ?? 0;
  const mine = d.units.filter((u) => u.owner === name);
  const fightingMajor = d.wars.some((k) => k.split('|').includes(name) && k.split('|').some((x) => x !== name && isMajor(x)));
  if (d.day < dayOf(d.startDate, FAR_EAST.until)) {
    const want = Math.floor(FAR_EAST.share * (mine.length + away)) - away;
    if (want <= 0) return;
    // Infantry from the interior goes, the newest first: never a division at a border, marching or fighting.
    const border = (p: number) => PROVINCES[p].neighbours.some((n) => d.controller[n] !== name);
    const going = mine
      .filter((u) => u.type === 'infantry' && !u.path.length && !u.sea && !u.landing && d.controller[u.at] === name && !border(u.at))
      .sort((a, b) => b.id - a.id)
      .slice(0, want);
    if (!going.length) return;
    const ids = new Set(going.map((u) => u.id));
    d.units = d.units.filter((u) => !ids.has(u.id));
    s.farEast = away + going.length;
    if (!s.fired.includes('far-east')) {
      s.fired = [...s.fired, 'far-east'];
      note(d, 'info', `After the fighting with Japan at Lake Khasan, the Soviet Union keeps a quarter of its army in the Far East, off this map (${s.farEast} divisions so far)`, [name]);
    }
    return;
  }
  // From the autumn of 1941: the Siberian divisions come west in two halves, if there is a great war to fight. The rest stay.
  if (!away || !fightingMajor || s.fired.includes('siberians-2')) return;
  const at = musterOf(d, name);
  if (at === null) return;
  // Each half is a fifth of the Far East army as it stood before the first left.
  const half = FAR_EAST.back / 2;
  const first = !s.fired.includes('siberians-1');
  const n = Math.min(away, Math.round(first ? half * away : (half / (1 - half)) * away));
  s.fired = [...s.fired, first ? 'siberians-1' : 'siberians-2'];
  if (!n) return;
  for (let i = 0; i < n; i++) d.units.push({ id: d.nextUnitId++, owner: name, type: 'infantry', at, strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1 });
  s.farEast = away - n;
  note(d, 'info', `Siberian divisions reach ${PROVINCES[at].name}: Japan will not attack, so ${n} divisions of the Far East army come west`, [name]);
}

/** Where new divisions of a country gather: its capital, or failing that its biggest city still in its hands. */
function musterOf(d: DipDraft, name: string): number | null {
  const cap = PROVINCES.find((p) => p.capital && p.owner === name && d.controller[p.id] === name);
  if (cap) return cap.id;
  return PROVINCES.filter((p) => p.owner === name && d.controller[p.id] === name).sort((a, b) => b.victoryPoints - a.victoryPoints || a.id - b.id)[0]?.id ?? null;
}

/** What the story says to the player about a date, for labels in the screen. */
export const storyDate = dateOf;
