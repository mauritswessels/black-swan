/**
 * Turning the loss into a score.
 *
 * Each quarter's loss L (see model.ts, equation 15) becomes points:
 *   points = 100 * e^(-L / 3)
 * A perfect quarter (L = 0) is worth 100; L = 3 (e.g. inflation 1.7 points outside
 * the band) is worth about 37. The term score is the average over all quarters of the
 * term. Quarters lost to a game over score 0, so getting fired is very costly.
 */
import { playedQuarters } from './model';
import type { EconomyState } from './types';

export function quarterPoints(loss: number): number {
  return 100 * Math.exp(-loss / 3);
}

export function termScore(state: EconomyState): number {
  const played = playedQuarters(state);
  const total = played.reduce((acc, q) => acc + quarterPoints(q.loss), 0);
  return total / state.settings.quarters;
}

/** Letter grade for the end-of-term report. */
export function grade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
