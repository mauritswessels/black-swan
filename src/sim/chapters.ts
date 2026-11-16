/**
 * Story mode's chapters: three stretches of the story, each with a few objectives for the
 * country you lead. Objectives are checked on the last day of the chapter. They are a guide to
 * what that country's leaders were trying to do, not a score you must chase: the game goes on
 * whether you meet them or not, and the end report lists how each one went.
 */
import { PROVINCES } from './map';
import type { World } from './types';

export type ChapterView = Pick<World, 'units' | 'wings' | 'fleets' | 'controller' | 'owner' | 'wars' | 'capitulated' | 'economies' | 'diplomacy' | 'story' | 'factories'>;

export interface Objective {
  text: string;
  /** Harder than what really happened. */
  hard?: boolean;
  test: (w: ChapterView) => boolean;
}

export interface Chapter {
  id: string;
  title: string;
  /** First and last day, YYYY-MM-DD. */
  from: string;
  to: string;
  /** One line on the period. */
  about: string;
  objectives: Record<string, Objective[]>;
}

const capital = (name: string): number => PROVINCES.find((p) => p.capital && p.owner === name)!.id;
const P = (name: string): number => PROVINCES.find((p) => p.name === name)!.id;
const holds = (w: ChapterView, who: string, province: number): boolean => w.controller[province] === who;
const standing = (w: ChapterView, who: string): boolean => !w.capitulated.includes(who) && !w.story.armistice.includes(who) && holds(w, who, capital(who));
const beaten = (w: ChapterView, who: string): boolean => w.capitulated.includes(who) || w.story.armistice.includes(who);
const divisions = (w: ChapterView, who: string): number => w.units.filter((u) => u.owner === who).length;
const fighters = (w: ChapterView, who: string): number => w.wings.filter((x) => x.owner === who && x.type === 'fighter').length;
const fighting = (w: ChapterView, a: string, b: string): boolean => w.wars.includes(a < b ? `${a}|${b}` : `${b}|${a}`);
const stability = (w: ChapterView, who: string): number => w.economies[who]?.stability ?? 0;
const inflation = (w: ChapterView, who: string): number => w.economies[who]?.inflation ?? 0;
const milFactories = (w: ChapterView, who: string): number => PROVINCES.reduce((a, p) => a + (w.controller[p.id] === who ? w.factories.mil[p.id] : 0), 0);
const promised = (w: ChapterView, by: string, to: string): boolean => w.diplomacy.pacts.some((p) => (p.kind === 'guarantee' && p.a === by && p.b === to) || (p.kind === 'alliance' && ((p.a === by && p.b === to) || (p.a === to && p.b === by))));
const homeFree = (w: ChapterView, who: string): boolean => PROVINCES.every((p) => p.owner !== who || w.owner[p.id] !== who || w.controller[p.id] === who);

const stable = (who: string, at = 50): Objective => ({ text: `Stability of ${at} or more`, test: (w) => stability(w, who) >= at });
const army = (who: string, n: number): Objective => ({ text: `An army of at least ${n} divisions`, test: (w) => divisions(w, who) >= n });
const prices = (who: string, max: number): Objective => ({ text: `Inflation under ${max}% a year`, test: (w) => inflation(w, who) < max });
const alive = (who: string, city: string): Objective => ({ text: `${city} is still yours and you have not surrendered`, test: (w) => standing(w, who) });
const germanyBeaten: Objective = { text: 'Germany has surrendered', test: (w) => w.capitulated.includes('Germany') };

export const CHAPTERS: Chapter[] = [
  {
    id: 'road', title: 'The road to war', from: '1936-01-01', to: '1939-08-31',
    about: 'Europe rearms. The dictators test how far they can go, and the democracies decide how much to give.',
    objectives: {
      'United Kingdom': [army('United Kingdom', 14), { text: 'At least 6 fighter wings', test: (w) => fighters(w, 'United Kingdom') >= 6 }, { text: 'A promise to defend Poland', test: (w) => promised(w, 'United Kingdom', 'Poland') }, stable('United Kingdom')],
      France: [army('France', 40), stable('France'), prices('France', 10), { text: 'Czechoslovakia is still independent', hard: true, test: (w) => !w.capitulated.includes('Czechoslovakia') }],
      Germany: [
        { text: 'Vienna and Prague are yours', test: (w) => holds(w, 'Germany', capital('Austria')) && holds(w, 'Germany', capital('Czechoslovakia')) },
        { text: 'No war with Britain or France yet', test: (w) => !fighting(w, 'Germany', 'United Kingdom') && !fighting(w, 'Germany', 'France') },
        army('Germany', 45),
        prices('Germany', 10),
      ],
      Italy: [{ text: 'Albania is yours', test: (w) => holds(w, 'Italy', P('Albania')) }, army('Italy', 32), stable('Italy'), prices('Italy', 10)],
      'Soviet Union': [army('Soviet Union', 85), { text: 'At least 20 military factories', test: (w) => milFactories(w, 'Soviet Union') >= 20 }, { text: 'At peace with Germany', test: (w) => !fighting(w, 'Soviet Union', 'Germany') }, stable('Soviet Union')],
      Poland: [army('Poland', 34), { text: 'A great power besides France has promised to defend you', test: (w) => promised(w, 'United Kingdom', 'Poland') || promised(w, 'Soviet Union', 'Poland') || promised(w, 'Italy', 'Poland') || promised(w, 'Germany', 'Poland') }, stable('Poland')],
    },
  },
  {
    id: 'storm', title: 'The storm breaks', from: '1939-09-01', to: '1941-06-21',
    about: 'Poland, Norway, France: in the real war Germany overran most of Europe in these 22 months, and Britain fought on alone.',
    objectives: {
      'United Kingdom': [alive('United Kingdom', 'London'), { text: 'Less than a quarter of your imports are being sunk', test: (w) => (w.economies['United Kingdom']?.blockade ?? 1) < 0.25 }, { text: 'France is still in the war', hard: true, test: (w) => standing(w, 'France') }],
      France: [alive('France', 'Paris'), { text: 'No enemy soldier stands on French soil', hard: true, test: (w) => standing(w, 'France') && homeFree(w, 'France') }, stable('France', 40)],
      Germany: [
        { text: 'Poland is beaten', test: (w) => beaten(w, 'Poland') },
        { text: 'France is beaten', test: (w) => beaten(w, 'France') },
        { text: 'No war on two fronts: at peace with the Soviet Union, or Britain out of the war', test: (w) => !fighting(w, 'Germany', 'Soviet Union') || !fighting(w, 'Germany', 'United Kingdom') },
        prices('Germany', 15),
      ],
      Italy: [alive('Italy', 'Rome'), { text: 'Tripoli is still yours', test: (w) => holds(w, 'Italy', P('Tripolitania')) }, prices('Italy', 15)],
      'Soviet Union': [
        { text: 'The Baltic coast is yours: Estonia, Latvia and Lithuania', test: (w) => ['Estonia', 'Latvia', 'Lithuania'].every((c) => holds(w, 'Soviet Union', capital(c))) },
        army('Soviet Union', 130),
        { text: 'No enemy soldier stands on Soviet soil', test: (w) => homeFree(w, 'Soviet Union') },
      ],
      Poland: [alive('Poland', 'Warsaw'), { text: 'No enemy soldier stands on Polish soil', hard: true, test: (w) => standing(w, 'Poland') && homeFree(w, 'Poland') }],
    },
  },
  {
    id: 'world', title: 'World war', from: '1941-06-22', to: '1945-05-08',
    about: 'From the invasion of the Soviet Union to the end. In the real war this is where it was decided, at a cost of tens of millions of lives.',
    objectives: {
      'United Kingdom': [alive('United Kingdom', 'London'), germanyBeaten, prices('United Kingdom', 15)],
      France: [alive('France', 'Paris'), germanyBeaten, prices('France', 20)],
      Germany: [alive('Germany', 'Berlin'), { text: 'No enemy soldier stands on German soil', test: (w) => standing(w, 'Germany') && homeFree(w, 'Germany') }, stable('Germany', 40)],
      Italy: [alive('Italy', 'Rome'), { text: 'No enemy soldier stands on Italian soil', test: (w) => standing(w, 'Italy') && homeFree(w, 'Italy') }, stable('Italy', 40)],
      'Soviet Union': [alive('Soviet Union', 'Moscow'), { text: 'Leningrad and Stalingrad are yours', test: (w) => holds(w, 'Soviet Union', P('Novgorod')) && holds(w, 'Soviet Union', P('Stalingrad')) }, germanyBeaten],
      Poland: [alive('Poland', 'Warsaw'), germanyBeaten, { text: 'Poland has all its land of 1936', hard: true, test: (w) => standing(w, 'Poland') && PROVINCES.every((p) => p.owner !== 'Poland' || (w.owner[p.id] === 'Poland' && w.controller[p.id] === 'Poland')) }],
    },
  },
];

export const chapterById = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.id === id);
