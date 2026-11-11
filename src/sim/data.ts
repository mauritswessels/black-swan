/**
 * Noisy data: what you see is not quite the truth.
 *
 *   first_estimate = true value + error
 *
 * The next quarter the error shrinks to 30% of its size (the first revision), and after
 * two quarters the figure is final. Real statistics offices work like this, so real
 * central bankers always decide on imperfect data.
 */
import { PARAMS } from './params';
import { Rng } from './rng';
import type { DataErrors, EconomyState, Release } from './types';

export function drawErrors(rng: Rng, multiplier: number): DataErrors {
  const e = PARAMS.dataErrors;
  return {
    gdp: rng.normal(e.gdp * multiplier),
    cpi: rng.normal(e.cpi * multiplier),
    core: rng.normal(e.core * multiplier),
    unemployment: rng.normal(e.unemployment * multiplier),
    outputGap: rng.normal(e.outputGap * multiplier),
  };
}

/** Share of the first-estimate error still in the data, by age in quarters. */
function errorLeft(age: number): number {
  if (age <= 0) return 1;
  if (age === 1) return PARAMS.revisionLeft;
  return 0;
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Every quarter's figures as they look at the start of quarter `state.t`.
 * Figures are rounded to one decimal, as published statistics are.
 */
export function releases(state: EconomyState): Release[] {
  const now = state.t;
  return state.history.map((q) => {
    const age = now - 1 - q.t;
    const k = errorLeft(age);
    return {
      t: q.t,
      vintage: Math.min(2, Math.max(0, age)),
      headline: r1(q.headline + k * q.errors.cpi),
      core: r1(q.core + k * q.errors.core),
      gdpGrowth: r1(q.gdpGrowth + k * q.errors.gdp),
      unemployment: r1(q.unemployment + k * q.errors.unemployment),
      outputGap: r1(q.outputGap + k * q.errors.outputGap),
    };
  });
}

/** The latest release (last quarter's first estimate). */
export function latestRelease(state: EconomyState): Release {
  const all = releases(state);
  return all[all.length - 1];
}
