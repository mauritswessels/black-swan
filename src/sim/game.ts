/**
 * One day of a game with a human player: the player's orders, plus the AI's orders for every
 * other country, then step().
 *
 * Every AI country runs its economy (aiEconomy.ts) and its diplomacy (agenda.ts) every day.
 * Its army commander (ai.ts), admirals and air marshals (aiForces.ts) give orders only while
 * the country is at war.
 */
import { aiDiplomacyOrders } from './agenda';
import { aiOrders } from './ai';
import { aiForceOrders } from './aiForces';
import { allianceMap, isDiplomacyOrder } from './diplomacy';
import { pictures } from './forces';
import { allAiEconomyOrders } from './aiEconomy';
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
    if (o.type === 'move' || o.type === 'halt' || o.type === 'ship') return own.has(o.unit);
    if (o.type === 'fleet' || o.type === 'transfer') return w.fleets.some((f) => f.id === o.fleet && f.owner === w.player);
    if (o.type === 'wing') return w.wings.some((x) => x.id === o.wing && x.owner === w.player);
    if (isEconomyOrder(o)) return o.country === w.player;
    // Peace is offered, never simply made; and the historical agenda belongs to the AI.
    if (o.type === 'makePeace' || o.type === 'aim') return false;
    if (isDiplomacyOrder(o)) return o.by === w.player;
    return false;
  });
}

export function advance(w: World, playerOrders: Order[] = []): World {
  const fighting = aiCountries(w);
  // Control of the sea and the sky today, worked out once for every AI commander.
  const friends = fighting.length ? allianceMap(w.diplomacy) : null;
  const seen = friends ? pictures(w, friends) : undefined;
  const ai = fighting.flatMap((c) => [...aiOrders(w, c, { sea: seen?.sea, air: seen?.air.battle }), ...(seen && friends ? aiForceOrders(w, c, seen.sea, friends) : [])]);
  // Every other country runs its own economy and its own diplomacy, at peace or at war.
  return step(w, [...ownOrders(w, playerOrders), ...ai, ...allAiEconomyOrders(w), ...aiDiplomacyOrders(w)]);
}
