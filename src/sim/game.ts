/**
 * One day of a game with a human player: the player's orders, plus the AI's orders for every
 * other country that is at war, then step().
 *
 * In Stage C wars start only when the player declares one (or a test sets one up). Countries
 * at peace do nothing yet; Stage F gives them diplomacy and plans of their own.
 */
import { aiOrders } from './ai';
import type { Order, World } from './types';
import { step } from './world';

/** The countries the AI is leading in a war today. */
export function aiCountries(w: World): string[] {
  const out = new Set<string>();
  for (const key of w.wars) for (const name of key.split('|')) if (name !== w.player) out.add(name);
  return [...out].sort();
}

export function advance(w: World, playerOrders: Order[] = []): World {
  // Orders for units the player does not own are dropped, so a bug in the screen cannot move the enemy.
  const own = new Set(w.units.filter((u) => u.owner === w.player).map((u) => u.id));
  const mine = playerOrders.filter((o) => (o.type === 'move' || o.type === 'halt' ? own.has(o.unit) : true));
  const ai = aiCountries(w).flatMap((c) => aiOrders(w, c));
  return step(w, [...mine, ...ai]);
}
