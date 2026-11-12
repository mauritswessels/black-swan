/**
 * The game world and how it moves forward one day at a time.
 *
 *   step(world, orders) -> next world
 *
 * Pure TypeScript with no UI: nothing in src/sim may import from src/ui. step never changes the
 * world it is given; it returns a new one. The same world and the same orders always give the
 * same result, because all randomness comes from the seeded generator stored in the world.
 *
 * Stage A has the clock and movement. Battles, supply and control of provinces come in Stage B,
 * so for now units may walk anywhere and nothing changes hands.
 */
import { COUNTRIES } from './countries';
import { daysToEnter, findRoute, PROVINCES } from './map';
import { Rng, seedFrom } from './rng';
import type { Mode, Order, Unit, UnitType, World } from './types';

export type { Mode, World } from './types';

const TYPES: UnitType[] = ['infantry', 'armour', 'artillery'];

/**
 * Where a country's divisions start: spread over its home provinces, with the capital and the
 * provinces on a foreign border getting them first. Uses the seeded generator for the order.
 */
function startingUnits(rng: Rng): Unit[] {
  const units: Unit[] = [];
  for (const country of COUNTRIES) {
    const home = PROVINCES.filter((p) => p.owner === country.name);
    const priority = home.filter((p) => p.capital || p.neighbours.some((n) => PROVINCES[n].owner !== country.name));
    const spots = priority.length ? priority : home;
    // Shuffle so the spread differs from seed to seed (Fisher-Yates).
    const order = spots.map((p) => p.id);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let k = 0;
    country.startArmy.forEach((count, t) => {
      for (let n = 0; n < count; n++) {
        units.push({ id: units.length, owner: country.name, type: TYPES[t], at: order[k++ % order.length], strength: 100, organisation: 100, path: [], progress: 0 });
      }
    });
  }
  return units;
}

export function newWorld(mode: Mode, seedText: string, startDate = '1936-01-01'): World {
  const seed = seedFrom(seedText);
  const rng = new Rng(seed);
  const units = startingUnits(rng);
  return { mode, seed, rng: rng.state, day: 0, startDate, units, nextUnitId: units.length, controller: PROVINCES.map((p) => p.owner) };
}

/** Advance the world by one day, after applying the orders given today. */
export function step(world: World, orders: Order[] = []): World {
  const units = world.units.map((u) => ({ ...u, path: [...u.path] }));
  const byId = new Map(units.map((u) => [u.id, u]));

  for (const order of orders) {
    const u = byId.get(order.unit);
    if (!u) continue; // an order for a unit that no longer exists is ignored
    if (order.type === 'halt') {
      u.path = [];
      u.progress = 0;
    } else {
      const route = findRoute(u.at, order.to, u.type);
      if (!route) continue; // no way by land: the order is ignored
      // Keep the progress already made if the new route starts the same way.
      if (route[0] !== u.path[0]) u.progress = 0;
      u.path = route;
    }
  }

  for (const u of units) {
    let dayLeft = 1; // a unit may cross more than one small province in a day
    while (u.path.length && dayLeft > 0) {
      const need = daysToEnter(u.at, u.path[0], u.type);
      const remaining = (1 - u.progress) * need;
      if (remaining <= dayLeft) {
        dayLeft -= remaining;
        u.at = u.path.shift()!;
        u.progress = 0;
      } else {
        u.progress += dayLeft / need;
        dayLeft = 0;
      }
    }
  }

  return { ...world, day: world.day + 1, units };
}

/** The current date in words, e.g. "7 March 1936". Uses UTC so it is the same on every computer. */
export function dateLabel(w: Pick<World, 'startDate' | 'day'>): string {
  const d = new Date(`${w.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + w.day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Units standing in a province. */
export const unitsAt = (w: World, province: number): Unit[] => w.units.filter((u) => u.at === province);
