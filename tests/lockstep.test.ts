/**
 * Groundwork for multiplayer: the simulation must be exactly repeatable, so that two computers
 * running it from the same seed and the same orders stay in step without sending the world.
 */
import { describe, expect, it } from 'vitest';
import { asin, atan, cos, dateWords, exp, ln, pow, sin } from '../src/sim/dmath';
import { advance } from '../src/sim/game';
import { hashText, worldHash } from '../src/sim/hash';
import { newGame } from '../src/sim/scenario';
import type { Order, World } from '../src/sim/types';

/** A few weeks of a game with orders on set days, as a player might give them. */
function play(days: number, from?: World, resumeAt?: number): { hashes: string[]; world: World } {
  let w = from ?? newGame({ mode: 'story', start: '1936', player: 'France', seed: 'lockstep' });
  const hashes: string[] = [];
  const orders = (day: number): Order[] =>
    day === 3 ? [{ type: 'setTax', country: 'France', rate: 0.3 }] : day === 10 ? [{ type: 'move', unit: w.units.find((u) => u.owner === 'France')!.id, to: 24 }] : day === 20 ? [{ type: 'setLine', country: 'France', unit: 'artillery', factories: 2 }] : [];
  for (let d = resumeAt ?? 0; d < days; d++) {
    w = advance(w, orders(d));
    hashes.push(worldHash(w));
  }
  return { hashes, world: w };
}

describe('lockstep groundwork', () => {
  it('the same seed and the same orders give the same world, day by day', () => {
    const a = play(60).hashes;
    const b = play(60).hashes;
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length); // and every day is different
  });

  it('a game saved and loaded half way carries on exactly as one that never stopped', () => {
    const whole = play(60);
    const half = play(30);
    const loaded = JSON.parse(JSON.stringify(half.world)) as World;
    const rest = play(60, loaded, 30);
    expect(rest.hashes[rest.hashes.length - 1]).toBe(whole.hashes[whole.hashes.length - 1]);
  });

  it('the fingerprint notices the smallest change', () => {
    const w = newGame({ mode: 'story', start: '1936', player: 'France', seed: 'lockstep' });
    const nudged = { ...w, economies: { ...w.economies, France: { ...w.economies.France, treasury: w.economies.France.treasury + 1e-9 } } };
    expect(worldHash(nudged)).not.toBe(worldHash(w));
    expect(hashText('a')).not.toBe(hashText('b'));
    expect(hashText('Black Swan')).toMatch(/^[0-9a-f]{14}$/);
  });

  it("the engine's own maths agrees with the computer's to about 15 figures", () => {
    const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-14 * Math.max(1, Math.abs(b)));
    for (const x of [1e-9, 0.001, 0.3, 0.5, 0.9999, 1, 1.5, 2, Math.E, 10, 1234.5, 1e12]) close(ln(x), Math.log(x));
    for (const x of [-30, -5, -1, -1e-6, 0, 0.5, 1, 3, 20, 100]) close(exp(x), Math.exp(x));
    for (const x of [-7, -3.2, -1, -0.1, 0, 0.2, 1, 1.5707, 3, 6.3, 40]) {
      close(sin(x), Math.sin(x));
      close(cos(x), Math.cos(x));
      close(atan(x), Math.atan(x));
    }
    for (const x of [-1, -0.7, -0.2, 0, 0.01, 0.3, 0.8, 1]) close(asin(x), Math.asin(x));
    close(pow(2, 10), 1024);
    close(pow(1.05, 12), Math.pow(1.05, 12));
    expect(ln(0)).toBe(-Infinity);
    expect(dateWords('1936-01-01', 0)).toBe('1 January 1936');
    expect(dateWords('1936-01-01', 1339)).toBe('1 September 1939');
  });
});

describe('the engine stays repeatable', () => {
  it('src/sim uses no maths, clocks or language settings that can differ between computers', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = new URL('../src/sim/', import.meta.url);
    const banned = /Math\.(random|log|log2|log10|log1p|exp|expm1|pow|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|cbrt|hypot)\b|\*\*|Date\.now|performance\.now|toLocale|Intl\./;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'dmath.ts')) {
      const code = readFileSync(new URL(f, dir), 'utf8').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l));
      const bad = code.find((l) => banned.test(l));
      expect(bad, `${f}: ${bad}`).toBeUndefined();
    }
  });
});
