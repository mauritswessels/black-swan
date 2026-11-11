/**
 * Events and shocks.
 *
 * Each event has a clear economic cause and effect, written as a set of shocks that
 * hit the model over the following quarters. Stage 1 has the economic core of
 * 13 events; later stages add news articles, choices, and many more events.
 *
 * Pacing: at most one new event per quarter, and none in the 2 quarters after an
 * event starts, so the game has calm stretches as well as crises.
 */
import { Rng } from './rng';

import type { ActiveEvent, EconomyState, Shocks } from './types';

export type EventKind = 'supply' | 'demand' | 'financial' | 'political' | 'data';

export interface EventDef {
  id: string;
  title: string;
  kind: EventKind;
  /** One-line economics: cause and effect. */
  lesson: string;
  /** Chance per quarter that it starts, given the state of the economy. */
  probability: (s: EconomyState) => number;
  /** The shocks it adds, by age in quarters (0 = the quarter it starts). */
  effect: (age: number) => Partial<Shocks>;
}

const last = (s: EconomyState) => s.history[s.history.length - 1];
const isActive = (s: EconomyState, id: string) => s.activeEvents.some((e) => e.id === id);
const during = (age: number, from: number, to: number, value: number) => (age >= from && age <= to ? value : 0);

export const EVENTS: EventDef[] = [
  {
    id: 'energySpike',
    title: 'Pipeline blast sends energy prices soaring',
    kind: 'supply',
    lesson: 'A supply shock: prices rise while output falls. Rate rises cannot make more gas flow.',
    probability: () => 0.04,
    effect: (age) => ({ energy: age === 0 ? 35 : 0 }),
  },
  {
    id: 'energySlump',
    title: 'Oil glut: energy prices collapse',
    kind: 'supply',
    lesson: 'A positive supply shock: cheaper energy lowers inflation and helps growth.',
    probability: () => 0.025,
    effect: (age) => ({ energy: age === 0 ? -25 : 0 }),
  },
  {
    id: 'cuRecession',
    title: 'Recession in the Continental Union',
    kind: 'demand',
    lesson: 'Our biggest customer buys less, so exports fall and our output gap opens downwards.',
    probability: () => 0.035,
    effect: (age) => ({ foreign: during(age, 0, 3, -1.2) }),
  },
  {
    id: 'safeHaven',
    title: 'Global panic: investors rush into the thaler',
    kind: 'financial',
    lesson: 'Safe-haven flows push up the thaler, which cuts import prices and hurts exporters: deflation risk.',
    probability: (s) => 0.035 + (isActive(s, 'cuRecession') ? 0.08 : 0),
    effect: (age) => ({ haven: age === 0 ? 5 : age === 1 ? 2 : 0 }),
  },
  {
    id: 'housingBoom',
    title: 'Housing boom: mortgage lending hits a record',
    kind: 'financial',
    lesson: 'Cheap credit pushes up house prices. The risk builds slowly and shows up later.',
    probability: (s) => 0.025 + (last(s).realRate < 0 ? 0.03 : 0),
    effect: (age) => ({ housing: during(age, 0, 3, 2) }),
  },
  {
    id: 'electionSpree',
    title: 'Government spending spree before the election',
    kind: 'political',
    lesson: 'Fiscal stimulus adds demand. If the economy is already full, it mostly adds inflation.',
    probability: () => 0.03,
    effect: (age) => ({ fiscal: during(age, 0, 3, 0.8) }),
  },
  {
    id: 'wageDeal',
    title: 'Unions win big pay rises',
    kind: 'supply',
    lesson: 'Higher wages push up costs. If expectations are loose, a wage-price spiral can start.',
    probability: (s) => {
      const q = last(s);
      return 0.015 + (q.unemployment < 2.8 && q.headline > 2 ? 0.1 : 0);
    },
    effect: (age) => ({ wage: during(age, 0, 3, 0.25) }),
  },
  {
    id: 'pandemic',
    title: 'Pandemic: lockdowns across the continent',
    kind: 'supply',
    lesson: 'Demand and supply collapse at once. Later, supply bottlenecks push prices up.',
    probability: () => 0.006,
    effect: (age) => ({
      demand: age === 0 ? -4 : age === 1 ? -1 : 0,
      supply: during(age, 2, 5, 0.25),
      energy: age === 0 ? -20 : 0,
      foreign: age === 0 ? -2 : 0,
    }),
  },
  {
    id: 'techBoom',
    title: 'Productivity boom from new technology',
    kind: 'supply',
    lesson: 'Higher productivity means faster growth without extra inflation. Raising rates would be a mistake.',
    probability: () => 0.015,
    effect: (age) => ({ productivity: during(age, 0, 7, 0.6), supply: during(age, 0, 7, -0.15) }),
  },
  {
    id: 'globalInflation',
    title: 'Global inflation wave: other central banks hike fast',
    kind: 'supply',
    lesson: 'Imported inflation, and foreign rate rises that weaken the thaler relative to them.',
    probability: () => 0.02,
    effect: (age) => ({ energy: age === 0 ? 15 : 0, foreignRate: during(age, 0, 3, 0.5), supply: during(age, 0, 3, 0.15) }),
  },
  {
    id: 'bankTrouble',
    title: 'A major bank gets into trouble',
    kind: 'financial',
    lesson: 'When too much risky lending has built up, a bank can fail, and credit dries up for everyone.',
    probability: (s) => 0.002 + 0.012 * Math.max(0, last(s).risk - 4),
    effect: (age) => ({ demand: age === 0 ? -1.5 : age === 1 ? -0.8 : 0, housing: during(age, 0, 2, -3) }),
  },
  {
    id: 'confidenceBoom',
    title: 'Consumer confidence surges',
    kind: 'demand',
    lesson: 'A demand shock: output and inflation rise together. This is what rate rises are for.',
    probability: () => 0.03,
    effect: (age) => ({ demand: during(age, 0, 2, 0.8) }),
  },
  {
    id: 'ministerPressure',
    title: 'Finance Minister demands a rate cut',
    kind: 'political',
    lesson: 'Central bank independence: giving in may win friends today, but it costs credibility for years.',
    probability: (s) => {
      const q = last(s);
      return 0.01 + (q.approval < 55 ? 0.03 : 0) + (q.unemployment > 3.4 ? 0.04 : 0);
    },
    // The economic effect is nothing; the political effect is handled in model.ts:
    // cutting in the next quarter counts as caving in.
    effect: () => ({}),
  },
  {
    id: 'dataError',
    title: 'Statistics office admits a data error',
    kind: 'data',
    lesson: 'First estimates can be badly wrong. Waiting for revisions is sometimes wise.',
    probability: () => 0.02,
    effect: (age) => ({ dataNoise: age === 0 ? 3 : 1 }),
  },
];

const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

export function eventById(id: string): EventDef | undefined {
  return BY_ID.get(id);
}

/** Longest event effect we ever need to look at. */
const MAX_AGE = 8;

export function emptyShocks(): Shocks {
  return { demand: 0, supply: 0, wage: 0, energy: 0, foreign: 0, foreignRate: 0, haven: 0, housing: 0, fiscal: 0, productivity: 0, dataNoise: 1 };
}

/** Maybe start a new event this quarter. Returns the id, or null. */
export function rollEvent(state: EconomyState, rng: Rng): string | null {
  if (state.t - state.lastEventAt < 3) return null; // pacing: calm after each event
  const candidates = EVENTS.filter((e) => !isActive(state, e.id));
  // Draw every candidate's chance in a fixed order so replays stay identical.
  const hits = candidates.filter((e) => rng.chance(e.probability(state)));
  if (hits.length === 0) return null;
  return rng.pick(hits).id;
}

/** Add up the shocks from every active event at its current age. */
export function sumShocks(active: ActiveEvent[], t: number): Shocks {
  const total = emptyShocks();
  for (const a of active) {
    const def = eventById(a.id);
    if (!def) continue;
    const fx = def.effect(t - a.startedAt);
    for (const [k, v] of Object.entries(fx) as [keyof Shocks, number][]) {
      if (k === 'dataNoise') total.dataNoise = Math.max(total.dataNoise, v);
      else total[k] += v;
    }
  }
  return total;
}

export function pruneEvents(active: ActiveEvent[], t: number): ActiveEvent[] {
  return active.filter((a) => t - a.startedAt <= MAX_AGE);
}
