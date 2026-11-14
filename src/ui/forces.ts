/** Control of the sea and the sky for the world on screen, worked out once per day and shared by the map and the sidebar. */
import { allianceMap } from '../sim/diplomacy';
import { AIR_CONTROL_MIN, AIR_CONTROL_RATIO } from '../sim/air';
import { pictures, type Pictures } from '../sim/forces';
import type { World } from '../sim/types';
import { enemiesOf } from '../sim/war';

interface Seen extends Pictures {
  friends: Map<string, Set<string>>;
}
const cache = new WeakMap<World, Seen>();

export function picturesOf(w: World): Seen {
  let p = cache.get(w);
  if (!p) {
    const friends = allianceMap(w.diplomacy);
    p = { ...pictures(w, friends), friends };
    cache.set(w, p);
  }
  return p;
}

export type SkyStatus = 'own' | 'enemy' | 'contested' | 'empty';

/** Who controls the sky over a province, from one country's point of view. Same rule as in a battle (air.ts). */
export function skyOver(w: World, country: string, province: number): { status: SkyStatus; mine: number; enemy: number } {
  const { air } = picturesOf(w);
  const mine = air.side([country], province);
  const foes = enemiesOf(w, country);
  const enemy = foes.length ? air.side(foes, province) : 0;
  let status: SkyStatus = 'empty';
  if (mine >= AIR_CONTROL_MIN && mine >= AIR_CONTROL_RATIO * enemy) status = 'own';
  else if (enemy >= AIR_CONTROL_MIN && enemy >= AIR_CONTROL_RATIO * mine) status = 'enemy';
  else if (mine > 0.05 && enemy > 0.05) status = 'contested';
  else if (mine > 0.05) status = 'own';
  return { status, mine, enemy };
}
