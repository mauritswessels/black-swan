/**
 * The game world. Pure TypeScript with no UI: nothing in src/sim may import from src/ui.
 *
 * Stage 0 only has the outline: the date, the seed and the random-number state. Stage A adds
 * the map, countries and units, and a step(world, orders) function that advances one day.
 */
import { seedFrom } from './rng';

export type Mode = 'story' | 'freeForAll';

export interface World {
  mode: Mode;
  seed: number;
  /** State of the seeded random-number generator (see rng.ts). */
  rng: number;
  /** Days since the start date. */
  day: number;
  /** The first day of the game, as an ISO date. */
  startDate: string;
}

export function newWorld(mode: Mode, seedText: string, startDate = '1936-01-01'): World {
  const seed = seedFrom(seedText);
  return { mode, seed, rng: seed, day: 0, startDate };
}

/** The current date in words, e.g. "7 March 1936". Uses UTC so it is the same on every computer. */
export function dateLabel(w: World): string {
  const d = new Date(`${w.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + w.day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
