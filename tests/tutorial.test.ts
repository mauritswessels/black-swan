import { describe, expect, it } from 'vitest';
import { LESSONS, textOf } from '../src/tutorial/lessons';
import { playLesson, viewOf } from '../src/tutorial/play';

describe('tutorial lessons', () => {
  for (const lesson of LESSONS) {
    it(`"${lesson.title}" can be finished by following Show me on every step`, () => {
      const r = playLesson(lesson);
      const step = r.stuck >= 0 ? textOf(lesson.steps[r.stuck], r.view) : '';
      expect(r.stuck, `stuck on step ${r.stuck + 1}: ${step}`).toBe(-1);
      // Nothing outside the lesson interrupts it: no decisions, history cards or end of the game.
      expect(r.view.world.diplomacy.decisions).toEqual([]);
      expect(r.view.world.story.cards).toEqual([]);
      expect(r.view.world.story.ended).toBeNull();
    });
  }

  it('every lesson has steps, and every step that waits on the player can be shown', () => {
    expect(LESSONS.length).toBe(9);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      expect(l.steps.length).toBeGreaterThan(3);
      for (const s of l.steps) if (s.done) expect(s.show, `${l.id}: ${textOf(s, viewOf(l.build()))}`).toBeDefined();
    }
  });

  it('a step is not already done when its lesson reaches it, so the player has to do it', () => {
    for (const l of LESSONS) {
      const v = viewOf(l.build());
      // The first step that waits on the player is not done before they act.
      const s = l.steps.find((x) => x.done)!;
      expect(s.done!(v, v), `${l.id}: ${textOf(s, v)}`).toBe(false);
    }
  });
});
