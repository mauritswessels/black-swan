/**
 * Automatic players used to test and balance the game.
 *
 * Bots only see what a human sees: the published (noisy) data, never the true economy.
 */
import { latestRelease, releases } from './data';
import { PARAMS } from './params';
import { Rng } from './rng';
import { taylorRate, toPolicyStep } from './rules';
import { targetFor } from './targets';
import type { Decision, EconomyState } from './types';

export interface Bot {
  name: string;
  description: string;
  decide: (state: EconomyState, rng: Rng) => Decision;
}

const lastRate = (s: EconomyState) => s.history[s.history.length - 1].policyRate;
const hold = (rate: number): Decision => ({ rate: toPolicyStep(rate), guidance: 'dataDependent', fxPurchases: 0 });

function taylorOnPublished(s: EconomyState): number {
  const r = latestRelease(s);
  return taylorRate(r.headline, r.outputGap, targetFor(s.settings.targetMode).centre);
}

export const BOTS: Bot[] = [
  {
    name: 'Do nothing',
    description: 'Never moves the rate',
    decide: (s) => hold(lastRate(s)),
  },
  {
    name: 'Random',
    description: 'Moves the rate by a random step between -0.5 and +0.5',
    decide: (s, rng) => hold(lastRate(s) + rng.pick([-0.5, -0.25, 0, 0.25, 0.5])),
  },
  {
    name: 'Overly hawkish',
    description: 'Taylor rule plus 1 point',
    decide: (s) => hold(taylorOnPublished(s) + 1),
  },
  {
    name: 'Overly dovish',
    description: 'Taylor rule minus 1 point',
    decide: (s) => hold(taylorOnPublished(s) - 1),
  },
  {
    name: 'Taylor rule',
    description: 'Follows the Taylor rule on the latest published headline inflation and output gap',
    decide: (s) => hold(taylorOnPublished(s)),
  },
  {
    name: 'Smart bot',
    description: 'Rule plus judgment: looks through energy, averages first estimates with revised data, moves gradually, leans against a soaring thaler',
    decide: (s) => {
      const tgt = targetFor(s.settings.targetMode);
      const rel = releases(s);
      const now = rel[rel.length - 1];
      const before = rel[rel.length - 2];
      // Look through one-off energy swings: steer by core inflation.
      const core = 0.6 * now.core + 0.4 * before.core;
      // Don't trust a single first estimate: blend with last quarter's revised figure.
      const gap = 0.6 * now.outputGap + 0.4 * before.outputGap;
      // Inflation reacts to the output gap with a lag, so look ahead a little.
      const coreAhead = core + 0.25 * gap;
      const desired = PARAMS.rStar + tgt.centre + 1.5 * (coreAhead - tgt.centre) + 0.6 * gap;
      // Move gradually: big swings unsettle markets and cost points.
      const current = lastRate(s);
      const rate = toPolicyStep(current + 0.5 * (desired - current));
      // A soaring thaler with low inflation: buy foreign currency to lean against it.
      const thaler = s.history[s.history.length - 1].thaler;
      const fxPurchases = thaler > 4 && core < tgt.centre + 0.5 ? Math.min(5, thaler - 3) : 0;
      return { rate, guidance: 'dataDependent', fxPurchases };
    },
  },
];
