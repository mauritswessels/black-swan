/**
 * Operations overseas: the expeditions and landings an AI country makes on its real dates.
 *
 * The army commander (ai.ts) sends divisions by sea on its own when it has nothing better to do,
 * but the great landings of the war were planned months ahead, for a place and a season. This
 * is the timetable of those plans. Like the historical agenda (agenda.ts), each operation has a
 * real date and conditions: if the situation has changed (the enemy holds the sea, the coast is
 * strongly held, the war has taken another course), the operation waits, and after its last
 * day it is given up.
 *
 *   help     Divisions go by sea to an ally's ports while it fights, up to `follow` of them.
 *            When `ends` says so they are taken home again (Norway, June 1940).
 *   landing  Up to `size` rested divisions land on the first of `targets` that the enemy holds
 *            and whose coast the country's navy controls. Once ashore, the front there gets
 *            up to `follow` divisions by sea.
 *
 * In Story mode only, and only for a country the AI leads: a player plans their own landings.
 */
import { PROVINCES } from './map';
import type { World } from './types';
import { SHOCK } from './story';
import { atWar } from './war';

export interface Operation {
  id: string;
  /** The country that carries it out. */
  by: string;
  kind: 'help' | 'landing';
  /** The real date: nothing happens before it. */
  date: string;
  /** The last day it may begin. */
  until: string;
  /** Where it lands, in order of preference (a landing), or the country it helps. */
  targets: number[];
  /** The land the expedition fights in: a front that touches it may take up to `follow` divisions. */
  area: number[];
  /** Divisions in the first wave (a landing). */
  size: number;
  follow: number;
  /** Why it is waiting, or null when it can go ahead. */
  needs: (w: World) => string | null;
  /** For a help: the expedition is called home. */
  ends?: (w: World) => boolean;
  /** One line on what really happened, for the reports. */
  history: string;
}

const P = (name: string): number => PROVINCES.find((q) => q.name === name)!.id;
const landOf = (...countries: string[]): number[] => PROVINCES.filter((p) => countries.includes(p.owner)).map((p) => p.id);
const named = (...names: string[]): number[] => names.map(P);
/** Mainland France: not Corsica, North Africa or the Levant. */
const FRANCE = named('Île-de-France', 'Lorraine', 'Provence', 'Burgundy', 'Gascony', 'Guyenne', 'Roussillon', 'Languedoc', 'Poitou', 'Brittany', 'Normandy', 'Limousin', 'Orléanais');
/** Italy itself, without Libya: holding Libya is not a landing in Italy. */
const ITALY = named('Sicily', 'Sardinia', 'Calabria', 'Campania', 'Apulia', 'Lazio', 'Umbria', 'Emilia', 'Lombardy', 'Piedmont', 'Veneto');
const first = (...checks: (string | null | false)[]): string | null => (checks.find((c) => !!c) as string | undefined) ?? null;
const gone = (w: World, name: string): boolean => w.capitulated.includes(name) || w.story.armistice.includes(name);
/** Days since Germany attacked through the Low Countries (when the shock of May 1940 began, story.ts), or -1. */
const westDays = (w: World): number => {
  const shock = w.story.effects.find((x) => x.id === 'shock' && x.country === 'France');
  return shock ? w.day - (shock.until - SHOCK.days) : -1;
};

export const OPERATIONS: Operation[] = [
  {
    id: 'op-norway', by: 'United Kingdom', kind: 'help', date: '1940-04-12', until: '1940-06-30',
    targets: [P('Nordland'), P('Hedmark')], area: landOf('Norway'), size: 0, follow: 4,
    needs: (w) => first(!atWar(w, 'United Kingdom', 'Germany') && 'it is not at war with Germany', !atWar(w, 'Germany', 'Norway') && 'Germany has not attacked Norway', gone(w, 'Norway') && 'Norway has fallen'),
    // Called home when the battle for France goes wrong.
    ends: (w) => westDays(w) >= 25 || gone(w, 'France'),
    history: 'British and French troops sailed for Norway within days of the German attack and landed at Narvik, Namsos and Åndalsnes from 14 April 1940. They were taken off in early June, when France was collapsing, and Norway surrendered on 10 June.',
  },
  {
    id: 'op-greece', by: 'United Kingdom', kind: 'help', date: '1941-03-07', until: '1941-12-31',
    targets: [P('Attica'), P('Salonika')], area: landOf('Greece'), size: 0, follow: 5,
    needs: (w) => first(!atWar(w, 'United Kingdom', 'Italy') && !atWar(w, 'United Kingdom', 'Germany') && 'it is not at war with the Axis', !w.wars.some((k) => k.split('|').includes('Greece')) && 'Greece is not at war', gone(w, 'Greece') && 'Greece has fallen'),
    history: 'From March 1941 about 60,000 British, Australian and New Zealand troops went to Greece. When Germany attacked in April they were driven back and taken off by sea at the end of the month.',
  },
  {
    id: 'op-husky', by: 'United Kingdom', kind: 'landing', date: '1943-07-10', until: '1945-05-08',
    targets: [P('Sicily'), P('Calabria'), P('Sardinia')], area: ITALY, size: 8, follow: 20,
    needs: (w) => first(!atWar(w, 'United Kingdom', 'Italy') && 'it is not at war with Italy'),
    history: 'On 10 July 1943 British, Canadian and American troops landed in Sicily. The island was taken in five weeks, and within a fortnight of the landing Mussolini had fallen.',
  },
  {
    id: 'op-avalanche', by: 'United Kingdom', kind: 'landing', date: '1943-09-03', until: '1945-05-08',
    targets: [P('Calabria'), P('Campania'), P('Apulia')], area: ITALY, size: 8, follow: 24,
    needs: (w) => first(!atWar(w, 'United Kingdom', 'Germany') && !atWar(w, 'United Kingdom', 'Italy') && 'it is not at war in Italy', ![P('Sicily'), P('Calabria')].some((p) => friendlyTo(w, 'United Kingdom', p)) && 'Sicily has not been taken'),
    history: 'British troops crossed to Calabria on 3 September 1943 and landed at Salerno on the 9th. The campaign up the length of Italy lasted until May 1945.',
  },
  {
    id: 'op-overlord', by: 'United Kingdom', kind: 'landing', date: '1944-06-06', until: '1945-05-08',
    targets: [P('Normandy'), P('Brittany'), P('Holland')], area: [...FRANCE, ...landOf('Belgium', 'Netherlands', 'Luxembourg')], size: 10, follow: 50,
    needs: (w) => first(!atWar(w, 'United Kingdom', 'Germany') && 'it is not at war with Germany'),
    history: 'On 6 June 1944 the Allies landed in Normandy. Paris was freed on 25 August and the German army in France was destroyed in the Falaise pocket.',
  },
  {
    id: 'op-dragoon', by: 'United Kingdom', kind: 'landing', date: '1944-08-15', until: '1945-05-08',
    targets: [P('Provence'), P('Languedoc')], area: FRANCE, size: 6, follow: 12,
    needs: (w) => first(!atWar(w, 'United Kingdom', 'Germany') && 'it is not at war with Germany'),
    history: 'On 15 August 1944 American and French troops landed in Provence and advanced up the Rhône valley.',
  },
];

/** Friendly ground for this country: its own, or an ally's. */
function friendlyTo(w: World, country: string, p: number): boolean {
  const holder = w.controller[p];
  return holder === country || w.diplomacy.pacts.some((x) => x.kind === 'alliance' && ((x.a === country && x.b === holder) || (x.b === country && x.a === holder)));
}

const dayOf = (startDate: string, date: string): number => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000);

/** The operations this country is carrying out today: their date has come, their last day has not passed, and nothing stands in the way. */
export function activeOperations(w: World, country: string): Operation[] {
  if (w.mode !== 'story' || country === w.player || w.story.lesson) return [];
  return OPERATIONS.filter((o) => o.by === country && w.day >= dayOf(w.startDate, o.date) && w.day <= dayOf(w.startDate, o.until) && !o.needs(w) && !o.ends?.(w));
}

/** Operations whose troops are ashore and still fighting: the landing has been made and the front there is alive. */
export function landedOperations(w: World, country: string): Operation[] {
  if (w.mode !== 'story' || country === w.player) return [];
  return OPERATIONS.filter((o) => o.by === country && o.kind === 'landing' && w.day >= dayOf(w.startDate, o.date) && o.area.some((p) => friendlyTo(w, country, p) && PROVINCES[p].owner !== country));
}

/** Expeditions that have been called home. */
export function endedOperations(w: World, country: string): Operation[] {
  if (w.mode !== 'story' || country === w.player) return [];
  return OPERATIONS.filter((o) => o.by === country && o.ends && w.day >= dayOf(w.startDate, o.date) && o.ends(w));
}
