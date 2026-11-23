/**
 * One day of a game with a human player: the player's orders, plus the AI's orders for every
 * other country, then step().
 *
 * Every AI country runs its economy (aiEconomy.ts) and its diplomacy (agenda.ts) every day.
 * Its army commander (ai.ts) gives orders while the country is at war, or about to start a war
 * its government has planned; its admirals and air marshals (aiForces.ts) and its paratroopers
 * (strike.ts) only while it is at war.
 * The player's armies (armies.ts) give their divisions orders every day, the AI's front code included.
 */
import { aiDiplomacyOrders, plannedWars } from './agenda';
import { aiOrders, foeInTheatre, splitTheatres } from './ai';
import { enemiesOf } from './war';
import { aiForceOrders } from './aiForces';
import { allianceMap, isDiplomacyOrder } from './diplomacy';
import { pictures } from './forces';
import { allAiEconomyOrders } from './aiEconomy';
import { isEconomyOrder } from './economy';
import { opportunistOrders } from './opportunist';
import { armyOrders, isArmyOrder } from './armies';
import { aiDropOrders } from './strike';
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
    if (o.type === 'move' || o.type === 'halt' || o.type === 'ship' || o.type === 'drop') return own.has(o.unit);
    if (o.type === 'strike') return o.country === w.player;
    if (o.type === 'fleet' || o.type === 'transfer') return w.fleets.some((f) => f.id === o.fleet && f.owner === w.player);
    if (o.type === 'wing') return w.wings.some((x) => x.id === o.wing && x.owner === w.player);
    if (isEconomyOrder(o) || isArmyOrder(o)) return o.country === w.player;
    // Peace is offered, never simply made; and the historical agenda belongs to the AI.
    if (o.type === 'makePeace' || o.type === 'aim') return false;
    if (isDiplomacyOrder(o)) return o.by === w.player;
    return false;
  });
}

export function advance(w: World, playerOrders: Order[] = []): World {
  const fighting = aiCountries(w);
  // An army moves up to the border in the weeks before a war its government has planned.
  const planned = new Map<string, string[]>();
  for (const [by, on] of plannedWars(w)) planned.set(by, [...(planned.get(by) ?? []), on]);
  const commanded = [...new Set([...fighting, ...planned.keys()])].sort();
  // Control of the sea and the sky today, worked out once for every AI commander.
  const friends = commanded.length ? allianceMap(w.diplomacy) : null;
  const seen = friends ? pictures(w, friends) : undefined;
  // A country of Europe with a war beyond it too (the Soviet Union against Japan) fights each war with the army that stands there (ai.ts Theatre).
  const farWar = (c: string) => splitTheatres(w, c) && [...enemiesOf(w, c), ...(planned.get(c) ?? [])].some((x) => foeInTheatre('world', x));
  const ai = commanded.flatMap((c) => [
    ...aiOrders(w, c, { sea: seen?.sea, air: seen?.air.battle, planned: planned.get(c) }),
    ...(farWar(c) ? aiOrders(w, c, { sea: seen?.sea, air: seen?.air.battle, planned: planned.get(c), theatre: 'world' }) : []),
    ...(seen && friends && fighting.includes(c) ? [...aiForceOrders(w, c, seen.sea, friends), ...aiDropOrders(w, c, friends, seen)] : []),
  ]);
  // The player's armies carry out their orders (armies.ts). Orders the player gives by hand today come after, so they win.
  const generals = [...new Set((w.armies ?? []).map((a) => a.owner))].sort();
  let pics = seen;
  const armies = generals.flatMap((c) => {
    pics ??= pictures(w, allianceMap(w.diplomacy));
    return armyOrders(w, c, { sea: pics.sea, air: pics.air.battle });
  });
  // Every other country runs its own economy and its own diplomacy, at peace or at war.
  return step(w, [...armies, ...ownOrders(w, playerOrders), ...ai, ...allAiEconomyOrders(w), ...aiDiplomacyOrders(w), ...opportunistOrders(w)]);
}
