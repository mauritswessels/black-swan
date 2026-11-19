/**
 * Bringing a world saved by an older version of the game up to date.
 *
 * Saves from version 10 (games 1.0 and 1.1) have no front line in their battles and no war
 * replay. Each battle starts its line at the border (0), and the replay starts recording from
 * the day the game is loaded. Saves from version 11 (game 1.2) have no armies: they start with none.
 * Saves from version 12 (game 1.3) have no paratroopers and no joint attacks: every country
 * gets an empty paratrooper production line and store, and there are no joint attacks waiting.
 * Their air wings and fleets are not aimed at anything, which is how they were.
 */
import { LINE_START } from './economy';
import { startReplay } from './replay';
import type { Economy, World } from './types';

export function upgradeWorld(w: World): World {
  const battles = w.battles.map((b) => {
    if (typeof b.line === 'number') return b;
    return { ...b, line: 0, push: 0 };
  });
  const economies: Record<string, Economy> = {};
  for (const [name, e] of Object.entries(w.economies)) {
    economies[name] = e.stock.airborne === undefined || !e.lines.airborne ? { ...e, stock: { ...e.stock, airborne: e.stock.airborne ?? 0 }, lines: { ...e.lines, airborne: e.lines.airborne ?? { factories: 0, efficiency: LINE_START } } } : e;
  }
  return { ...w, battles, economies, replay: w.replay ?? startReplay(w.controller, w.day), armies: w.armies ?? [], nextArmyId: w.nextArmyId ?? 0, strikes: w.strikes ?? [], nextStrikeId: w.nextStrikeId ?? 0 };
}
