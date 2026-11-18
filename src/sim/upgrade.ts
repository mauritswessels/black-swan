/**
 * Bringing a world saved by an older version of the game up to date.
 *
 * Saves from version 10 (games 1.0 and 1.1) have no front line in their battles and no war
 * replay. Each battle starts its line at the border (0), and the replay starts recording from
 * the day the game is loaded. Saves from version 11 (game 1.2) have no armies: they start with none.
 */
import { startReplay } from './replay';
import type { World } from './types';

export function upgradeWorld(w: World): World {
  const battles = w.battles.map((b) => {
    if (typeof b.line === 'number') return b;
    return { ...b, line: 0, push: 0 };
  });
  return { ...w, battles, replay: w.replay ?? startReplay(w.controller, w.day), armies: w.armies ?? [], nextArmyId: w.nextArmyId ?? 0 };
}
