/**
 * Simple policy rules, used for the end-of-term comparison, the committee's
 * advice and the bot playtest.
 *
 * Taylor rule (John Taylor, 1993):
 *   i = r_star + pi + 0.5*(pi - target) + 0.5*y
 * Raise the rate by MORE than any rise in inflation (here 1.5x), so the real rate rises.
 */
import { PARAMS } from './params';

export function taylorRate(pi: number, outputGap: number, target: number): number {
  return PARAMS.rStar + pi + 0.5 * (pi - target) + 0.5 * outputGap;
}

/** Round to the nearest 0.25 and keep within the allowed range. */
export function toPolicyStep(rate: number): number {
  const r = Math.round(rate * 4) / 4;
  return Math.min(PARAMS.upperBound, Math.max(PARAMS.lowerBound, r));
}
