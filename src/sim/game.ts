/**
 * One day of a game with a human player: the player's orders, plus the AI's orders for every
 * other country, then step().
 *
 * Every AI country runs its economy (aiEconomy.ts) and its diplomacy (agenda.ts) every day.
 * Its army commander (ai.ts) gives orders only while the country is at war.
 */
import { aiDiplomacyOrders } from './agenda';
import { aiOrders } from './ai';
import { allAiEconomyOrders } from './aiEconomy';
import { isDiplomacyOrder } from './diplomacy';
import { isEconomyOrder } from './economy';
import type { Order, World } from './types';
import { step } from './world';

/** The countries the AI is leading in a war today. */
export function aiCountries(w: World): string[] {
  const out = new Set<string>();
  for (const key of w.wars) for (const name of key.split('|')) if (name !== w.player) out.add(name);
  return [...out].sort();
}

/** Only the player's own orders count: a bug in the screen cannot move the enemy or sign for another country. */
export function ownOrders(w: World, orders: Order[]): Order[] {
  const own = new Set(w.units.filter((u) => u.owner === w.player).map((u) => u.id));
  return orders.filter((o) => {
    if (o.type === 'move' || o.type === 'halt') return own.has(o.unit);
    if (isEconomyOrder(o)) return o.country === w.player;
    // Peace is offered, never simply made; and the historical agenda belongs to the AI.
    if (o.type === 'makePeace' || o.type === 'aim') return false;
    if (isDiplomacyOrder(o)) return o.by === w.player;
    return false;
  });
}

export function advance(w: World, playerOrders: Order[] = []): World {
  const ai = aiCountries(w).flatMap((c) => aiOrders(w, c));
  // Every other country runs its own economy and its own diplomacy, at peace or at war.
  return step(w, [...ownOrders(w, playerOrders), ...ai, ...allAiEconomyOrders(w), ...aiDiplomacyOrders(w)]);
}
