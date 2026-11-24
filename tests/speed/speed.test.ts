import { beforeAll, describe, expect, it } from 'vitest';
import { advance } from '../../src/sim/game';
import { dayOf } from '../../src/sim/story';
import type { World } from '../../src/sim/types';
import { newWorld, step } from '../../src/sim/world';

/**
 * Speed tests. `npm test` runs them after all the other tests, on their own: when the other test
 * files ran beside them (GitHub's runner has few processors), their clock counted that work too.
 */
const until = (w: World, date: string): World => {
  const end = dayOf(w.startDate, date);
  while (w.day < end) w = advance(w);
  return w;
};

describe('speed', () => {
  it('simulates a year of the whole map quickly', () => {
    let w = newWorld('story', 'speed');
    const t0 = performance.now();
    for (let d = 0; d < 366; d++) w = step(w);
    expect(performance.now() - t0).toBeLessThan(2000);
  });

  describe('the story led by the AI', () => {
    let mid: World;
    beforeAll(() => {
      mid = until(newWorld('story', 'history-2'), '1941-07-05');
    }, 240000);

    it('stays quick on the busiest days, the summer of 1941', () => {
      // Version 1.7 (the world map) took about 30 ms a day here on the cloud machines; fail if that gets 50% slower.
      const M1_MS = 30;
      const t0 = performance.now();
      until(mid, '1941-07-25');
      const perDay = (performance.now() - t0) / 20;
      expect(perDay).toBeLessThan(M1_MS * 1.5);
    });
  });
});
