/** Who is at war with whom. Wars are stored as "A|B" with the two names in alphabetical order. */
import type { World } from './types';

export const warKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

export const atWar = (w: Pick<World, 'wars'>, a: string, b: string): boolean => a !== b && w.wars.includes(warKey(a, b));

/** The countries this one is at war with. */
export function enemiesOf(w: Pick<World, 'wars'>, country: string): string[] {
  const out: string[] = [];
  for (const key of w.wars) {
    const [a, b] = key.split('|');
    if (a === country) out.push(b);
    else if (b === country) out.push(a);
  }
  return out;
}

/** May a division of this country walk into this province? Only its own land, an enemy's, or an ally's (`friends`). */
export const canEnter = (w: Pick<World, 'wars' | 'controller'>, country: string, province: number, friends?: Set<string>): boolean =>
  w.controller[province] === country || atWar(w, country, w.controller[province]) || !!friends?.has(w.controller[province]);
