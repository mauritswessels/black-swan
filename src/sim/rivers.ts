/**
 * The great rivers, and the Suez Canal, as the borders between provinces that they run along.
 *
 * A river is put on the borders it follows, or that an attack has to cross it to get over. Attacking across
 * one is hard: the attackers have to cross under fire on boats and bridges, so
 *
 *   - each division attacking across a river hits at RIVER_ATTACK (85%) of its power, and
 *   - until the front line is BRIDGEHEAD (20) points into the province, it moves at half pace
 *     for the share of the attack that comes across the river. Once a bridgehead is won, the
 *     front moves as usual.
 *
 * So the front stalls at a river until the crossing is forced, as it did on the Meuse in
 * 1940, the Dnieper in 1943 and the Rhine in 1945.
 */
import data from '../content/map/europe1936.json';
import { PROVINCES } from './map';

export const RIVER_ATTACK = 0.85;
export const RIVER_PUSH = 0.5;
export const BRIDGEHEAD = 20;

/**
 * Each river and the province borders it runs along, by province name. Worked out by
 * scripts/build-map.mjs from where the rivers really run (Natural Earth): a border counts when a
 * third of it follows the river, or when the river lies across the way from one province's centre
 * to the other's, close to their border. Since version 1.5 (the finer map) this includes the Oder,
 * the Seine, the Neman, the Western Dvina and the Volga at Stalingrad.
 */
export const RIVERS: { name: string; borders: [string, string][] }[] = data.rivers as { name: string; borders: [string, string][] }[];

const idOf = (name: string): number => {
  const p = PROVINCES.find((q) => q.name === name);
  if (!p) throw new Error(`rivers.ts: no province called ${name}`);
  return p.id;
};
const key = (a: number, b: number): number => (a < b ? a * 1000 + b : b * 1000 + a);

const BY_BORDER = new Map<number, string>();
for (const r of RIVERS) for (const [a, b] of r.borders) BY_BORDER.set(key(idOf(a), idOf(b)), r.name);

/** Every river border as a pair of province ids, with the river's name. */
export const RIVER_BORDERS: { a: number; b: number; river: string }[] = RIVERS.flatMap((r) => r.borders.map(([a, b]) => ({ a: idOf(a), b: idOf(b), river: r.name })));

/** The river between two provinces, or null if there is none. */
export const riverBetween = (a: number, b: number): string | null => BY_BORDER.get(key(a, b)) ?? null;
