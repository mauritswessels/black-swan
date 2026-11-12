import { describe, expect, it } from 'vitest';
import { Rng, seedFrom } from '../src/sim/rng';

describe('random numbers', () => {
  it('repeat exactly for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let k = 0; k < 100; k++) expect(a.next()).toBe(b.next());
  });
  it('can be paused and resumed from the saved state', () => {
    const a = new Rng(7);
    for (let k = 0; k < 10; k++) a.next();
    const b = new Rng(a.state);
    expect(b.next()).toBe(a.next());
  });
  it('stay between 0 and 1', () => {
    const r = new Rng(1936);
    for (let k = 0; k < 1000; k++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('turn typed text into a seed', () => {
    expect(seedFrom('kestria')).toBe(seedFrom('kestria'));
    expect(seedFrom('kestria')).not.toBe(seedFrom('kestrib'));
  });
});
