/**
 * The war replay: who held each province, recorded once a week, so the whole war can be played
 * back in about a minute (the replay screen, from the report or at the end of the game).
 *
 * Only the changes are kept. Recording starts on the first day of a game (or the day an older
 * save is first loaded) and adds an entry every seventh day in which anything changed hands.
 */
import type { Replay } from './types';

export const REPLAY_EVERY = 7;

export function startReplay(controller: string[], day: number): Replay {
  return { startDay: day, base: [...controller], weeks: [], now: [...controller] };
}

/** The replay after `day`, with this week's changes added when it is a recording day. */
export function recordFront(r: Replay | undefined, controller: string[], day: number): Replay {
  if (!r) return startReplay(controller, day);
  if ((day - r.startDay) % REPLAY_EVERY !== 0 || day <= r.startDay) return r;
  const changes: [number, string][] = [];
  for (let p = 0; p < controller.length; p++) if (controller[p] !== r.now[p]) changes.push([p, controller[p]]);
  if (!changes.length) return r;
  return { ...r, weeks: [...r.weeks, { day, changes }], now: [...controller] };
}

/** One picture for the replay: who held each province on a day. */
export interface ReplayFrame {
  day: number;
  controller: string[];
  /** Provinces that changed hands since the frame before. */
  changed: number[];
}

/**
 * Every week of the replay as a picture, from the first record to `lastDay`, one frame per
 * week whether or not anything changed, so that time runs evenly when it is played back.
 */
export function replayFrames(r: Replay, lastDay: number): ReplayFrame[] {
  const frames: ReplayFrame[] = [];
  const now = [...r.base];
  let next = 0;
  for (let day = r.startDay; day <= Math.max(r.startDay, lastDay); day += REPLAY_EVERY) {
    const changed: number[] = [];
    while (next < r.weeks.length && r.weeks[next].day <= day) {
      for (const [p, holder] of r.weeks[next].changes) {
        now[p] = holder;
        changed.push(p);
      }
      next++;
    }
    frames.push({ day, controller: [...now], changed });
  }
  return frames;
}

/** The frames from the first week in which anything changed hands, a few weeks early, so a replay does not open on years of peace. */
export function warFrames(r: Replay, lastDay: number): ReplayFrame[] {
  const all = replayFrames(r, lastDay);
  const first = all.findIndex((f) => f.changed.length > 0);
  return first < 0 ? all.slice(-1) : all.slice(Math.max(0, first - 4));
}
