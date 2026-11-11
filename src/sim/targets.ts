/** The mandate: what inflation the bank is aiming for. */
import type { TargetMode } from './types';

export interface Target {
  /** The single number the model anchors expectations to. */
  centre: number;
  /** The band counted as "on target" for credibility. */
  low: number;
  high: number;
}

/**
 * - range (default, Swiss style): price stability means inflation between 0 and 2%.
 *   Expectations anchor to the middle, 1%.
 * - point: inflation of exactly 2%, with 1 to 3% treated as close enough.
 */
export function targetFor(mode: TargetMode): Target {
  return mode === 'range' ? { centre: 1, low: 0, high: 2 } : { centre: 2, low: 1, high: 3 };
}

/** How far inflation is outside the target band (0 when inside). */
export function distanceOutside(pi: number, t: Target): number {
  if (pi > t.high) return pi - t.high;
  if (pi < t.low) return t.low - pi;
  return 0;
}
