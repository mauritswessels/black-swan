/**
 * Seeded random numbers.
 *
 * The same seed always gives the same sequence of numbers, so a whole game can be
 * replayed exactly from its seed plus the player's decisions.
 *
 * The generator is "mulberry32": tiny, fast and good enough for a game.
 * Its whole internal state is one 32-bit integer, which we store inside the
 * world state so saving a game is trivial.
 */

export class Rng {
  private s: number;

  constructor(state: number) {
    this.s = state >>> 0;
  }

  /** Current internal state (store this to resume the sequence later). */
  get state(): number {
    return this.s >>> 0;
  }

  /** Uniform number in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Normal (bell-curve) random number with mean 0 and the given standard deviation. */
  normal(sd = 1): number {
    if (sd === 0) return 0;
    // Box-Muller transform: turns two uniform numbers into a normal one.
    // (We deliberately don't cache the second value, so the generator's whole
    // state stays a single number that can be saved.)
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
  }

  /** True with the given probability. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Pick one item from a list. */
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
}

/** Turn any text or number into a 32-bit seed (so players can type a word as a seed). */
export function seedFrom(input: string | number): number {
  const text = String(input);
  let h = 2166136261;
  for (let k = 0; k < text.length; k++) {
    h ^= text.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
