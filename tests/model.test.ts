/**
 * Unit tests for the economic model.
 *
 * Most tests compare two games with the same seed (so the same random luck) that differ
 * in one thing, averaged over many seeds. The difference shows the effect of that one thing.
 */
import { describe, expect, it } from 'vitest';
import { latestRelease, releases } from '../src/sim/data';
import { initialState, isFinished, playedQuarters, step } from '../src/sim/model';
import { PARAMS } from '../src/sim/params';
import { Rng, seedFrom } from '../src/sim/rng';
import { taylorRate } from '../src/sim/rules';
import type { Decision, EconomyState, Guidance, Quarter } from '../src/sim/types';

const SEEDS = 150;
const dd = (rate: number, guidance: Guidance = 'dataDependent'): Decision => ({ rate, guidance, fxPurchases: 0 });

/** No random events, so tests isolate one cause at a time. */
function calm(seed: number, quarters = 20): EconomyState {
  return { ...initialState({ seed, quarters }), lastEventAt: 10_000 };
}

/** Run a game where `policy(t, state)` picks each decision. Events stay switched off. */
function run(start: EconomyState, quarters: number, policy: (t: number, s: EconomyState) => Decision): Quarter[] {
  let s = start;
  for (let t = 0; t < quarters; t++) s = step({ ...s, lastEventAt: s.lastEventAt > 1000 ? 10_000 + t : s.lastEventAt }, policy(t, s));
  return playedQuarters(s);
}

/** Average difference (b - a) of a field, quarter by quarter, across seeds. */
function avgDiff(quarters: number, makeA: (seed: number) => Quarter[], makeB: (seed: number) => Quarter[], pick: (q: Quarter) => number): number[] {
  const out = Array(quarters).fill(0);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const a = makeA(seed);
    const b = makeB(seed);
    for (let t = 0; t < quarters; t++) out[t] += (pick(b[t]) - pick(a[t])) / SEEDS;
  }
  return out;
}

const taylorPolicy = (offset = 0) => (_t: number, s: EconomyState) => {
  const r = latestRelease(s);
  return dd(taylorRate(r.headline, r.outputGap, 1) + offset);
};

describe('random numbers', () => {
  it('repeat exactly for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let k = 0; k < 100; k++) expect(a.next()).toBe(b.next());
  });
  it('turn typed text into a seed', () => {
    expect(seedFrom('kestria')).toBe(seedFrom('kestria'));
    expect(seedFrom('kestria')).not.toBe(seedFrom('kestrib'));
  });
});

describe('determinism', () => {
  it('the same seed and the same decisions give exactly the same game', () => {
    const play = (seed: number) => {
      let s = initialState({ seed });
      while (!isFinished(s)) s = step(s, dd(1.5 + (s.t % 3) * 0.25));
      return JSON.stringify(s);
    };
    expect(play(7)).toBe(play(7));
    expect(play(7)).not.toBe(play(8));
  });
  it('step() never changes the state it is given', () => {
    const s = initialState({ seed: 3 });
    const before = JSON.stringify(s);
    step(s, dd(2));
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('monetary policy transmission', () => {
  // Raise the rate by 1 point for four quarters, then return to the Taylor rule.
  const N = 12;
  const base = (seed: number) => run(calm(seed), N, taylorPolicy());
  const hike = (seed: number) => run(calm(seed), N, (t, s) => (t < 4 ? dd(s.history[s.history.length - 1].policyRate + (t === 0 ? 1 : 0)) : taylorPolicy()(t, s)));

  it('a rate hike strengthens the thaler in the same quarter', () => {
    const fx = avgDiff(N, base, hike, (q) => q.thaler);
    expect(fx[0]).toBeGreaterThan(1);
  });

  it('a rate hike lowers output, mostly 2 to 6 quarters later', () => {
    const gap = avgDiff(N, base, hike, (q) => q.outputGap);
    expect(Math.abs(gap[0])).toBeLessThan(0.15); // little effect at once
    const peak = Math.min(...gap);
    const peakQuarter = gap.indexOf(peak);
    expect(peak).toBeLessThan(-0.2);
    expect(peakQuarter).toBeGreaterThanOrEqual(2);
    expect(peakQuarter).toBeLessThanOrEqual(7);
  });

  it('a rate hike lowers core inflation, with the biggest effect 4 to 8 quarters later', () => {
    const core = avgDiff(N, base, hike, (q) => q.core);
    const peak = Math.min(...core);
    expect(peak).toBeLessThan(-0.15);
    const peakQuarter = core.indexOf(peak);
    expect(peakQuarter).toBeGreaterThanOrEqual(3);
    expect(peakQuarter).toBeLessThanOrEqual(9);
  });

  it('the policy rate cannot go below the effective lower bound', () => {
    const s = step(initialState({ seed: 1 }), dd(-3));
    expect(s.history[s.history.length - 1].policyRate).toBe(PARAMS.lowerBound);
  });
});

describe('supply and demand shocks', () => {
  const N = 6;
  const withEvent = (id: string) => (seed: number) => {
    const s = calm(seed);
    return run({ ...s, activeEvents: [{ id, startedAt: 0 }], lastEventAt: 0 }, N, () => dd(1.5));
  };
  const noEvent = (seed: number) => {
    const s = calm(seed);
    return run({ ...s, lastEventAt: 0 }, N, () => dd(1.5));
  };

  it('an energy price spike (supply shock) raises inflation AND lowers output', () => {
    const infl = avgDiff(N, noEvent, withEvent('energySpike'), (q) => q.headline);
    const gap = avgDiff(N, noEvent, withEvent('energySpike'), (q) => q.outputGap);
    expect(infl[0]).toBeGreaterThan(1);
    expect(gap[2]).toBeLessThan(-0.1);
  });

  it('a confidence boom (demand shock) raises output AND, later, inflation', () => {
    const gap = avgDiff(N, noEvent, withEvent('confidenceBoom'), (q) => q.outputGap);
    const core = avgDiff(N, noEvent, withEvent('confidenceBoom'), (q) => q.core);
    expect(gap[1]).toBeGreaterThan(0.5);
    expect(core[4]).toBeGreaterThan(0.1);
  });
});

describe('credibility and expectations', () => {
  /** An economy where inflation has been running at 4% for two years. */
  function highInflation(seed: number, credibility: number): EconomyState {
    const s = calm(seed, 16);
    const history = s.history.map((q) => ({ ...q, core: 4, headline: 4, expectedInflation: 4 - (credibility / 100) * 2.5, perceivedTarget: 4 - (credibility / 100) * 3, credibility }));
    return { ...s, history };
  }
  const outputLost = (qs: Quarter[]) => qs.reduce((acc, q) => acc + Math.max(0, -q.outputGap), 0);

  it('bringing inflation down costs more output when credibility is low', () => {
    let lostHigh = 0;
    let lostLow = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      lostHigh += outputLost(run(highInflation(seed, 90), 12, taylorPolicy()));
      lostLow += outputLost(run(highInflation(seed, 25), 12, taylorPolicy()));
    }
    expect(lostLow).toBeGreaterThan(lostHigh * 1.2);
  });

  it('breaking "rates will stay here for an extended period" costs credibility', () => {
    const keep = run(calm(5), 2, (t) => (t === 0 ? dd(1.5, 'extended') : dd(1.5, 'extended')));
    const breakIt = run(calm(5), 2, (t) => (t === 0 ? dd(1.5, 'extended') : dd(2.5, 'dataDependent')));
    expect(keep[1].credibility - breakIt[1].credibility).toBeGreaterThan(PARAMS.credibilityBrokenGuidance - 3);
  });

  it('expectations follow the target when credibility is high, and past inflation when it is low', () => {
    const high = run(highInflation(2, 95), 1, () => dd(5));
    const low = run(highInflation(2, 20), 1, () => dd(5));
    expect(high[0].expectedInflation).toBeLessThan(low[0].expectedInflation - 1);
  });
});

describe('long run', () => {
  it('there is no lasting trade-off: looser policy raises inflation but not employment', () => {
    // "Long run" here means years 25 to 40 of a 40-year career. A rule that is 0.4 points
    // too loose ends up with inflation 0.8 points higher, but the same unemployment.
    const N = 160;
    const tail = (qs: Quarter[]) => qs.slice(100);
    const avg = (qs: Quarter[], f: (q: Quarter) => number) => qs.reduce((a, q) => a + f(q), 0) / qs.length;
    let uLoose = 0;
    let uNormal = 0;
    let piLoose = 0;
    let piNormal = 0;
    let n = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const normal = run(calm(seed, N), N, taylorPolicy());
      const loose = run(calm(seed, N), N, taylorPolicy(-0.4));
      if (normal.length < N || loose.length < N) continue; // skip the rare game that ended early
      n++;
      uNormal += avg(tail(normal), (q) => q.unemployment);
      uLoose += avg(tail(loose), (q) => q.unemployment);
      piNormal += avg(tail(normal), (q) => q.headline);
      piLoose += avg(tail(loose), (q) => q.headline);
    }
    expect(n).toBeGreaterThan(30);
    expect((piLoose - piNormal) / n).toBeGreaterThan(0.4);
    expect(Math.abs(uLoose - uNormal) / n).toBeLessThan(0.1);
  });
});

describe('noisy data', () => {
  it('first estimates differ from the truth, and revisions move them towards it', () => {
    let firstErr = 0;
    let finalErr = 0;
    let s = initialState({ seed: 11 });
    for (let k = 0; k < 12; k++) s = step(s, dd(1.5));
    const truth = s.history;
    for (let k = 0; k < 3; k++) {
      const rel = releases(s);
      const last = rel[rel.length - 1];
      firstErr += Math.abs(last.outputGap - truth[truth.length - 1].outputGap);
      s = step(s, dd(1.5));
    }
    const rel = releases(s);
    for (const r of rel.filter((x) => x.vintage === 2 && x.t >= 0)) {
      const q = s.history.find((h) => h.t === r.t)!;
      finalErr += Math.abs(r.outputGap - q.outputGap);
    }
    expect(firstErr).toBeGreaterThan(0.1);
    // Final figures only differ from the truth by rounding to one decimal.
    expect(finalErr / rel.length).toBeLessThan(0.051);
  });
});
