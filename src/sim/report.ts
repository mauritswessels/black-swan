/**
 * The end report: how this game went, set beside what really happened.
 *
 * Nothing here changes the game. It reads the finished (or unfinished) world and the record that
 * story.ts kept along the way, and turns them into plain rows for a screen to show.
 */
import { CARDS, cardById } from '../content/history';
import { CHAPTERS } from './chapters';
import { COUNTRIES } from './countries';
import { isMajor } from './diplomacy';
import { PROVINCES } from './map';
import { ATROCITY_LINE } from './story';
import type { World } from './types';
import { dateLabel } from './world';

export interface CompareRow {
  what: string;
  real: string;
  game: string;
}

export interface ScoreRow {
  country: string;
  /** Victory points of the land it holds. */
  points: number;
  /** Change since the game began. */
  change: number;
  divisions: number;
  out: boolean;
}

export interface Report {
  mode: World['mode'];
  player: string | null;
  ended: { date: string; why: string } | null;
  /** One line that sums the game up. */
  verdict: string;
  rows: CompareRow[];
  chapters: { title: string; done: boolean; objectives: { text: string; hard: boolean; met: boolean | null }[] }[];
  /** History cards filed so far, out of all of them. */
  cards: { filed: number; total: number };
  /** Every card filed so far, oldest first; `same` when this game did what history did. */
  timeline: { id: string; title: string; date: string; inGame: string; same: boolean }[];
  losses: { country: string; lost: number }[];
  scores: ScoreRow[];
  economy: { debt: number; inflation: number; stability: number; support: number } | null;
}

/** What became of each great power in the real war, for the comparison. */
const REAL_FATE: Record<string, string> = {
  'United Kingdom': 'Never invaded; among the victors',
  France: 'Defeated in June 1940, liberated in 1944',
  Germany: 'Surrendered on 8 May 1945 and was occupied',
  Italy: 'Changed sides in September 1943',
  'Soviet Union': 'Invaded in 1941; took Berlin in 1945',
  Poland: 'Occupied from 1939; under Soviet control after 1945',
};

const MAJORS = COUNTRIES.filter((c) => c.major).map((c) => c.name);
const capitalOf = (name: string): number => PROVINCES.find((p) => p.capital && p.owner === name)!.id;
const date = (w: World, day: number): string => dateLabel({ startDate: w.startDate, day });

function fate(w: World, name: string): string {
  if (w.story.armistice.includes(name)) return 'Signed an armistice and left the war';
  if (w.capitulated.includes(name)) return 'Surrendered';
  const holder = w.controller[capitalOf(name)];
  if (holder !== name) return `Fighting on, with its capital held by ${holder}`;
  const lost = PROVINCES.filter((p) => p.owner === name && w.controller[p.id] !== name).length;
  const atWar = w.wars.some((k) => k.split('|').includes(name));
  if (lost > 0) return `${atWar ? 'At war' : 'At peace'}, with ${lost} of its 1936 provinces in other hands`;
  return atWar ? 'At war, its own land untouched' : 'At peace, its own land untouched';
}

/** Victory points each country holds, and how that compares with the map of 1936. */
export function scores(w: World): ScoreRow[] {
  const now = new Map<string, number>();
  const then = new Map<string, number>();
  for (const p of PROVINCES) {
    now.set(w.controller[p.id], (now.get(w.controller[p.id]) ?? 0) + p.victoryPoints);
    then.set(p.owner, (then.get(p.owner) ?? 0) + p.victoryPoints);
  }
  return COUNTRIES.map((c) => ({
    country: c.name,
    points: now.get(c.name) ?? 0,
    change: (now.get(c.name) ?? 0) - (then.get(c.name) ?? 0),
    divisions: w.units.filter((u) => u.owner === c.name).length,
    out: w.capitulated.includes(c.name),
  })).sort((a, b) => b.points - a.points || a.country.localeCompare(b.country));
}

function verdict(w: World, table: ScoreRow[]): string {
  const me = w.player;
  if (w.mode !== 'story') {
    const top = table[0];
    if (!me) return `${top.country} holds the most, with ${top.points} victory points.`;
    const place = table.findIndex((r) => r.country === me) + 1;
    const mine = table[place - 1];
    if (mine.out) return `${me} surrendered. ${top.country} holds the most, with ${top.points} victory points.`;
    return place === 1 ? `${me} is the strongest country on the map, with ${mine.points} victory points.` : `${me} is number ${place} of ${table.length}, with ${mine.points} victory points. ${top.country} leads with ${top.points}.`;
  }
  const s = w.story;
  if (me && w.capitulated.includes(me)) return `${me} was defeated.`;
  if (s.greatWar === null) return 'There was no war between the great powers. In the real world it began on 1 September 1939 and killed tens of millions of people.';
  const fighting = w.wars.some((k) => k.split('|').every(isMajor));
  const germany = w.capitulated.includes('Germany');
  if (fighting) return 'The great powers are still at war.';
  return germany ? 'Germany has been defeated and the great powers are at peace.' : 'The great powers are at peace, and Germany was not defeated.';
}

export function report(w: World): Report {
  const s = w.story;
  const me = w.player;
  const table = scores(w);
  const rows: CompareRow[] = [];
  if (w.mode === 'story') {
    const fighting = w.wars.some((k) => k.split('|').every(isMajor));
    rows.push({ what: 'War between the great powers began', real: '1 September 1939', game: s.greatWar === null ? 'It has not begun' : date(w, s.greatWar) });
    rows.push({ what: 'The war in Europe ended', real: '8 May 1945', game: s.greatWar === null ? 'No war' : fighting ? 'Still being fought' : s.ended ? date(w, s.ended.day) : 'The great powers are at peace' });
    rows.push({ what: 'Spain', real: 'Franco won the civil war in 1939', game: s.spain.state === 'nationalist' ? 'Franco won the civil war' : s.spain.state === 'republic' ? 'The Republic survived' : s.spain.state === 'war' ? 'The civil war is still being fought' : 'No civil war' });
    for (const name of MAJORS) rows.push({ what: name, real: REAL_FATE[name], game: fate(w, name) });
  }
  const chapters = w.mode === 'story' && me
    ? CHAPTERS.map((ch) => {
        const rec = s.chapters.find((x) => x.id === ch.id);
        return { title: ch.title, done: !!rec, objectives: (ch.objectives[me] ?? []).map((o, i) => ({ text: o.text, hard: !!o.hard, met: rec ? rec.met[i] ?? false : null })) };
      })
    : [];
  const timeline = s.cards
    .filter((c) => !c.inGame.includes(ATROCITY_LINE))
    .map((c) => ({ id: c.id, title: cardById(c.id)?.title ?? c.id, date: date(w, c.day), inGame: c.inGame, same: / too\b/.test(c.inGame) }));
  const e = me ? w.economies[me] : undefined;
  return {
    mode: w.mode,
    player: me,
    ended: s.ended ? { date: date(w, s.ended.day), why: s.ended.why } : null,
    verdict: verdict(w, table),
    rows,
    chapters,
    cards: { filed: s.cards.length, total: CARDS.length },
    timeline,
    losses: Object.entries(s.losses).map(([country, lost]) => ({ country, lost: Math.round(lost * 10) / 10 })).filter((x) => x.lost >= 0.5).sort((a, b) => b.lost - a.lost).slice(0, 8),
    scores: table,
    economy: e ? { debt: Math.round(e.debt), inflation: Math.round(e.inflation * 10) / 10, stability: Math.round(e.stability), support: Math.round(e.warSupport) } : null,
  };
}
