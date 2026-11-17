/**
 * Playing a lesson without a screen: the same steps a player takes, done by "Show me". Used by
 * the tests to check that every lesson can be finished.
 */
import { advance, ownOrders } from '../sim/game';
import type { World } from '../sim/types';
import { applyOrders } from '../sim/world';
import type { Action, Lesson, LessonView } from './lessons';

export const viewOf = (world: World): LessonView => ({ world, selection: null, mapMode: 'political', overlay: null, running: false, speed: 2, ordering: false, bySea: false, moves: 0 });

/** Do what "Show me" does, without the clock. */
export function perform(v: LessonView, a: Action): LessonView {
  let next: LessonView = { ...v };
  if (a.select !== undefined) next = { ...next, selection: a.select, ordering: false, bySea: false };
  if (a.orders?.length) next = { ...next, world: applyOrders(next.world, ownOrders(next.world, a.orders)) };
  if (a.mapMode !== undefined) next = { ...next, mapMode: a.mapMode };
  if (a.overlay !== undefined) next = { ...next, overlay: a.overlay };
  if (a.run !== undefined) next = { ...next, running: a.run };
  if (a.speed !== undefined) next = { ...next, speed: a.speed };
  if (a.look !== undefined) next = { ...next, moves: next.moves + 1 };
  for (let i = 0; i < (a.days ?? 0); i++) next = { ...next, world: advance(next.world) };
  return next;
}

export interface Played {
  /** Index of the step that could not be finished, or -1 when the lesson was finished. */
  stuck: number;
  view: LessonView;
  /** Days of game time the lesson took. */
  days: number;
}

/** Play a whole lesson with "Show me" on every step, letting the clock run where a step waits on it. */
export function playLesson(lesson: Lesson): Played {
  let v = viewOf(lesson.build());
  const first = v.world.day;
  for (let i = 0; i < lesson.steps.length; i++) {
    const step = lesson.steps[i];
    if (!step.keepClock) v = { ...v, running: false };
    const start = v;
    if (!step.done) continue;
    if (!step.done(v, start) && step.show) v = perform(v, step.show(v));
    for (let d = 0; d < (step.days ?? 0) && !step.done(v, start) && v.running; d++) v = { ...v, world: advance(v.world) };
    if (!step.done(v, start)) return { stuck: i, view: v, days: v.world.day - first };
  }
  return { stuck: -1, view: v, days: v.world.day - first };
}
