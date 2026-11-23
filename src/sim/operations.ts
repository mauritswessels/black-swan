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
import { partsOf, PROVINCES } from './map';
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
/** These provinces and every part cut from them for the finer map. */
const named = (...names: string[]): number[] => names.map(P).flatMap(partsOf);
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
  // ----- East Asia (1.8) -----
  {
    id: 'op-shanghai', by: 'Japan', kind: 'landing', date: '1937-08-13', until: '1939-12-31',
    targets: [P('Shanghai'), P('Northern Chekiang'), P('Northern Kiangsu')], area: named('Shanghai', 'Kiangsu', 'Northern Chekiang', 'Chekiang', 'Northern Kiangsu', 'Southern Anhwei', 'Anhwei', 'Hupeh', 'Northern Kiangsi'), size: 5, follow: 14,
    needs: (w) => first(!atWar(w, 'Japan', 'China') && 'it is not at war with China'),
    history: 'Chiang Kai-shek opened a second front at Shanghai on 13 August 1937 with his best German-trained divisions, to draw Japan away from the north and show the world that China would fight. Japan landed army after army; Shanghai fell in November after three months, and Nanking on 13 December.',
  },
  {
    id: 'op-canton', by: 'Japan', kind: 'landing', date: '1938-10-12', until: '1941-12-31',
    targets: [P('Eastern Kwangtung'), P('Kwangtung')], area: named('Kwangtung', 'Eastern Kwangtung', 'Eastern Kwangsi', 'Kwangsi', 'Southern Hunan'), size: 4, follow: 8,
    needs: (w) => first(!atWar(w, 'Japan', 'China') && 'it is not at war with China'),
    history: 'On 12 October 1938 Japanese troops landed at Bias Bay and took Canton nine days later, closing China\'s last big port. Wuhan fell the same week, and the government moved to Chungking.',
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

/**
 * Coasts kept for a landing whose date has not come yet: the commander makes no landing of his
 * own there before it. Without this the British AI landed in France in 1942 and 1943 whenever a
 * stretch of coast looked thinly held, two years before the real one.
 */
export function laterLandings(w: World, country: string): Set<number> {
  const out = new Set<number>();
  if (w.mode !== 'story' || country === w.player || w.story.lesson) return out;
  for (const o of OPERATIONS) if (o.by === country && o.kind === 'landing' && w.day < dayOf(w.startDate, o.date)) for (const p of [...o.targets, ...o.area]) out.add(p);
  // Nor on Germany's own coast, or in Denmark next door, before Normandy: the real Allies never tried
  // it, and a lucky landing that walked into an empty Berlin in 1941 (or from Jutland in 1943) ended the war in weeks.
  const overlord = OPERATIONS.find((o) => o.id === 'op-overlord')!;
  if (country === overlord.by && w.day < dayOf(w.startDate, overlord.date)) for (const p of PROVINCES) if (p.owner === 'Germany' || p.owner === 'Denmark') out.add(p.id);
  return out;
}

/**
 * How far Japan's armies go into China, by date (1.8). In 1937 and 1938 Japan took the north China
 * plain, the lower Yangtze, Wuhan and Canton, the cities, railways and ports, and then stopped: its
 * generals knew they could not hold the empty west, and China fought on from Chungking. Ichi-Go, in
 * 1944, was the one great push after that, to open a railway to Indochina. The mountains of Shansi
 * and the far north-west are left out: Japan held a few towns and railways there, never the land.
 *
 * An army commander (ai.ts) of Japan or Manchukuo attacks China and the Communists only in the provinces
 * whose date has come. In Story mode only, and not for a player, who goes where they like.
 */
export const JAPAN_REACH: [string, string[]][] = [
  ['1937-07-07', ['Peiping', 'Hopeh', 'Northern Hopeh', 'Chahar', 'Shantung', 'Shanghai', 'Kiangsu', 'Northern Chekiang', 'Northern Kiangsu', 'Southern Anhwei']],
  ['1938-01-01', ['Western Shantung', 'Anhwei', 'Eastern Honan']],
  ['1938-06-01', ['Hupeh', 'Northern Kiangsi', 'Northern Shansi']],
  ['1938-10-12', ['Kwangtung', 'Eastern Kwangtung']],
  ['1939-02-10', ['Hainan']],
  ['1944-04-17', ['Honan', 'Hunan', 'Southern Hunan', 'Eastern Kwangsi', 'Kwangsi']],
];
const REACH_SIDE = ['Japan', 'Manchukuo'];
const REACH_FOES = ['China', 'Chinese Communists'];
const REACH_IDS: [string, number[]][] = JAPAN_REACH.map(([date, names]) => [date, named(...names)]);

/** The provinces this country's armies may attack in a war on `foe` today, or null when nothing limits them. */
export function reachOf(w: World, country: string, foe: string): Set<number> | null {
  if (w.mode !== 'story' || country === w.player || w.story.lesson || !REACH_SIDE.includes(country) || !REACH_FOES.includes(foe)) return null;
  const out = new Set<number>();
  for (const [date, ids] of REACH_IDS) if (w.day >= dayOf(w.startDate, date)) for (const p of ids) out.add(p);
  return out;
}

/**
 * Borders an AI country keeps watch on without a war (1.8): Japan's Kwantung Army stood guard in
 * Manchuria against the Red Army throughout the war in China, with about a dozen divisions in the
 * late 1930s and many more in 1941. The army commander (ai.ts) deploys up to `divisions` there, as
 * for a war it is planning, but plans no attack.
 */
export const WATCH: { by: string; foe: string; divisions: number }[] = [
  { by: 'Japan', foe: 'Soviet Union', divisions: 15 },
  { by: 'Japan', foe: 'Mongolia', divisions: 3 },
];

/** The borders this country watches today, with the most divisions it puts on each. */
export function watchOf(w: World, country: string): Map<string, number> {
  const out = new Map<string, number>();
  if (w.mode !== 'story' || country === w.player || w.story.lesson) return out;
  for (const x of WATCH) if (x.by === country) out.set(x.foe, x.divisions);
  return out;
}
