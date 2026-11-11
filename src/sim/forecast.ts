/**
 * The research staff's forecast, with uncertainty.
 *
 * The staff run the model forward many times (40 "possible futures"), each with different
 * random luck and random events, assuming the bank follows a standard rule from now on.
 * The spread of outcomes gives the fan chart: the middle line is the most likely path, the
 * dark band holds the middle half of outcomes, and the light band holds 90% of them.
 *
 * In reality, central bank staff build fan charts in a similar spirit, from models plus
 * judgment about the risks. Like theirs, this forecast will often be wrong.
 */
import { step } from './model';
import { taylorRate, toPolicyStep } from './rules';
import { targetFor } from './targets';
import type { EconomyState, Quarter } from './types';

export interface Fan {
  p5: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p95: number[];
}

export interface Forecast {
  horizon: number;
  headline: Fan;
  core: Fan;
  outputGap: Fan;
  unemployment: Fan;
  /** The rate path the forecast assumes (median). */
  rate: number[];
}

function percentile(sorted: number[], p: number): number {
  const k = (sorted.length - 1) * p;
  const lo = Math.floor(k);
  const hi = Math.ceil(k);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (k - lo);
}

function fanOf(paths: number[][], horizon: number): Fan {
  const fan: Fan = { p5: [], p25: [], p50: [], p75: [], p95: [] };
  for (let k = 0; k < horizon; k++) {
    const col = paths.map((p) => p[k]).sort((a, b) => a - b);
    fan.p5.push(percentile(col, 0.05));
    fan.p25.push(percentile(col, 0.25));
    fan.p50.push(percentile(col, 0.5));
    fan.p75.push(percentile(col, 0.75));
    fan.p95.push(percentile(col, 0.95));
  }
  return fan;
}

/** Forecast for the next `horizon` quarters. Pure: never changes the game state. */
export function staffForecast(state: EconomyState, horizon = 8, runs = 40): Forecast {
  const target = targetFor(state.settings.targetMode).centre;
  const series: Record<'headline' | 'core' | 'outputGap' | 'unemployment' | 'rate', number[][]> = {
    headline: [],
    core: [],
    outputGap: [],
    unemployment: [],
    rate: [],
  };
  for (let run = 0; run < runs; run++) {
    // A different stream of luck for each possible future.
    let s: EconomyState = {
      ...state,
      settings: { ...state.settings, quarters: state.t + horizon },
      rng: (state.rng ^ Math.imul(run + 1, 2654435761)) >>> 0,
      gameOver: null,
    };
    const path: Quarter[] = [];
    for (let k = 0; k < horizon; k++) {
      const q = s.history[s.history.length - 1];
      const ruleRate = taylorRate(q.core, q.outputGap, target);
      const rate = toPolicyStep(q.policyRate + 0.5 * (ruleRate - q.policyRate));
      s = step({ ...s, gameOver: null }, { rate, guidance: 'dataDependent', fxPurchases: 0 });
      path.push(s.history[s.history.length - 1]);
    }
    series.headline.push(path.map((q) => q.headline));
    series.core.push(path.map((q) => q.core));
    series.outputGap.push(path.map((q) => q.outputGap));
    series.unemployment.push(path.map((q) => q.unemployment));
    series.rate.push(path.map((q) => q.policyRate));
  }
  return {
    horizon,
    headline: fanOf(series.headline, horizon),
    core: fanOf(series.core, horizon),
    outputGap: fanOf(series.outputGap, horizon),
    unemployment: fanOf(series.unemployment, horizon),
    rate: fanOf(series.rate, horizon).p50,
  };
}
