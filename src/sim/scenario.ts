/**
 * Starting a game: the two modes and the two starts.
 *
 *   Story, 1936            the real situation on 1 January 1936.
 *   Story, September 1939  the same game led by the AI, which keeps to real history, from 1936
 *                          to the morning of 1 September 1939. You take over one country on
 *                          that morning. Nothing is scripted: the armies, factories, debts and
 *                          treaties are whatever three and a half years of the engine produced,
 *                          always from the same seed, so every 1939 game starts identically.
 *   Free-for-all           the same map with every treaty torn up and no historical timetable.
 *                          AI countries look after themselves (opportunist.ts), and the game
 *                          runs for ten years.
 */
import { AGENDA } from './agenda';
import { wake } from './diplomacy';
import { advance } from './game';
import { Rng, seedFrom } from './rng';
import { dayOf, FREE_FOR_ALL_DAYS, startStory } from './story';
import type { Mode, StartId, World } from './types';
import { newWorld } from './world';

export interface GameOptions {
  mode: Mode;
  start: StartId;
  player: string | null;
  seed: string;
  /** Story mode from 1936 only: how closely AI governments keep to the real timetable. */
  history?: 'close' | 'loose';
}

/** The seed of the AI-led years before the September 1939 start. */
export const PRELUDE_SEED = 'prelude-1939';
export const START_DATE = '1936-01-01';
export const PRELUDE_DAYS = dayOf(START_DATE, '1939-09-01');

function wipe(w: World): World {
  return {
    ...w, mode: 'freeForAll',
    diplomacy: { ...w.diplomacy, pacts: [], causes: [], justifying: [], ultimatums: [], decisions: [], agenda: Object.fromEntries(AGENDA.map((a) => [a.id, 'dropped' as const])) },
    story: { ...w.story, endDay: w.day + FREE_FOR_ALL_DAYS, opportunist: true, ended: null },
  };
}

function handOver(w: World, o: GameOptions): World {
  const seed = seedFrom(o.seed);
  const mine = { ...w, player: o.player, seed, rng: new Rng(seed).state, story: { ...w.story, start: '1939' as const } };
  // Free-for-all wakes the whole world; Story mode keeps the rest of the world out of the war (World.asleep).
  return o.mode === 'freeForAll' ? wipe(wake(mine, mine.asleep ?? [])) : mine;
}

/**
 * Build the world for a new game a piece at a time. Each `next()` does some of the work and
 * yields how far along it is, from 0 to 1, so that a screen can show progress; the finished
 * world is the generator's return value. Only the 1939 start takes more than an instant.
 */
export function* prepareGame(o: GameOptions): Generator<number, World> {
  if (o.start === '1936') {
    const w = newWorld(o.mode, o.seed, START_DATE, o.player);
    const story = startStory('1936', o.mode === 'story' ? o.history ?? 'close' : 'close', w.seed);
    return o.mode === 'freeForAll' ? wipe({ ...w, story }) : { ...w, story };
  }
  let w = newWorld('story', PRELUDE_SEED, START_DATE, null);
  for (let d = 0; d < PRELUDE_DAYS; d++) {
    w = advance(w);
    if (d % 30 === 29) yield (d + 1) / PRELUDE_DAYS;
  }
  return handOver(w, o);
}

/** The same, all at once. */
export function newGame(o: GameOptions): World {
  const steps = prepareGame(o);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
