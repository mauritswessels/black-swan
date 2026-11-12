/**
 * The game world and how it moves forward one day at a time.
 *
 *   step(world, orders) -> next world
 *
 * Pure TypeScript with no UI: nothing in src/sim may import from src/ui. step never changes the
 * world it is given; it returns a new one. The same world and the same orders always give the
 * same result, because all randomness comes from the seeded generator stored in the world.
 *
 * Each day, in order: orders, the economy (economy.ts), supply, battles (combat.ts), marching, rest and attrition, and
 * finally any surrenders. Divisions may only enter their own land or the land of a country
 * they are at war with.
 */
import { DIG_IN_MAX_DAYS, fightBattles, type Draft } from './combat';
import { COUNTRIES } from './countries';
import { cloneEconomies, giveEconomyOrder, isEconomyOrder, reinforce, runEconomies, startEconomies, startFactories } from './economy';
import { daysToEnter, findRoute, PROVINCES } from './map';
import { Rng, seedFrom } from './rng';
import { DEPOTS, linkedProvinces, supplyCapacity, supplyLevels } from './supply';
import type { Mode, Order, Unit, UnitType, World } from './types';
import { atWar, canEnter, warKey } from './war';

export type { Mode, World } from './types';

const TYPES: UnitType[] = ['infantry', 'armour', 'artillery'];

/** Share of a country's army that starts overseas (colonies and islands), one division per territory. */
const OVERSEAS_SHARE = 0.15;

/**
 * Where a country's divisions start. Most stand in the homeland (the piece of its territory
 * that holds the capital), on the capital and the foreign borders, never more in a province
 * than half of what it can supply while there is room elsewhere. A few garrison its other territories, the richest first.
 * Uses the seeded generator for the order.
 */
function startingUnits(rng: Rng): Unit[] {
  const units: Unit[] = [];
  const shuffle = (ids: number[]): number[] => {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  };
  for (const country of COUNTRIES) {
    const home = PROVINCES.filter((p) => p.owner === country.name);
    const capitalDepot = home.find((p) => p.capital)?.id;
    // The homeland: every home province linked by land to the capital.
    const linked = linkedProvinces(PROVINCES.map((p) => p.owner), country.name);
    const inHomeland = new Set<number>();
    if (capitalDepot !== undefined) {
      const queue = [capitalDepot];
      inHomeland.add(capitalDepot);
      while (queue.length) for (const n of PROVINCES[queue.pop()!].neighbours) if (linked[n] && !inHomeland.has(n)) (inHomeland.add(n), queue.push(n));
    }
    const homeland = home.filter((p) => inHomeland.has(p.id));
    const priority = homeland.filter((p) => p.capital || p.neighbours.some((n) => PROVINCES[n].owner !== country.name));
    const order = shuffle((priority.length ? priority : homeland.length ? homeland : home).map((p) => p.id));
    const rest = shuffle(homeland.filter((p) => !order.includes(p.id)).map((p) => p.id));
    const overseas = (DEPOTS[country.name] ?? []).filter((d) => !inHomeland.has(d)).sort((a, b) => PROVINCES[b].victoryPoints - PROVINCES[a].victoryPoints || a - b);
    const total = country.startArmy[0] + country.startArmy[1] + country.startArmy[2];
    const abroad = overseas.length ? Math.round(total * OVERSEAS_SHARE) : 0;

    const placed = new Map<number, number>();
    let k = 0;
    const nextSpot = (): number => {
      // Borders and the capital first, each up to half of what it can supply; then the interior.
      for (const [list, share] of [[order, 0.5], [rest, 1], [order, 1]] as const) {
        for (let tries = 0; tries < list.length; tries++) {
          const p = list[k++ % list.length];
          if ((placed.get(p) ?? 0) < Math.ceil(supplyCapacity(p) * share)) return p;
        }
      }
      return order[k++ % order.length];
    };
    country.startArmy.forEach((count, t) => {
      for (let n = 0; n < count; n++) {
        // Garrisons overseas are infantry, taken from the end of the infantry list.
        const garrison = t === 0 && abroad > 0 && n >= count - abroad;
        const at = garrison ? overseas[(count - 1 - n) % overseas.length] : nextSpot();
        placed.set(at, (placed.get(at) ?? 0) + 1);
        units.push({ id: units.length, owner: country.name, type: TYPES[t], at, strength: 100, organisation: 100, path: [], progress: 0, dugIn: DIG_IN_MAX_DAYS, supply: 1 });
      }
    });
  }
  return units;
}

/** `player` is the country the person at the keyboard leads; null means every country is led by the AI. */
export function newWorld(mode: Mode, seedText: string, startDate = '1936-01-01', player: string | null = null): World {
  const seed = seedFrom(seedText);
  const rng = new Rng(seed);
  const units = startingUnits(rng);
  const controller = PROVINCES.map((p) => p.owner);
  const factories = startFactories();
  const economies = startEconomies({ controller, factories, units, wars: [] });
  return { mode, player, seed, rng: rng.state, day: 0, startDate, units, nextUnitId: units.length, controller, wars: [], capitulated: [], battles: [], nextBattleId: 0, reports: [], economies, factories };
}

/** Organisation regained per day of rest with full supply. */
export const ORG_RECOVERY = 3;
/** Organisation lost per day while above what the division's supply can sustain, and strength lost per day once a cut-off division has none left. */
export const ATTRITION_ORG = 3;
export const ATTRITION_STRENGTH = 2;
/** A country surrenders when enemies hold this share of its home victory points. */
export const SURRENDER_SHARE = 0.6;

/** Carry out orders on a world that is being changed. Orders that make no sense are ignored. */
function giveOrders(d: Pick<Draft, 'units' | 'controller' | 'wars'> & Pick<World, 'economies' | 'factories'>, capitulated: string[], orders: Order[]): void {
  const byId = new Map(d.units.map((u) => [u.id, u]));
  for (const order of orders) {
    if (isEconomyOrder(order)) {
      giveEconomyOrder(d, capitulated, order);
      continue;
    }
    if (order.type === 'declareWar' || order.type === 'makePeace') {
      const [a, b] = order.type === 'declareWar' ? [order.by, order.on] : [order.a, order.b];
      const key = warKey(a, b);
      const known = (n: string) => COUNTRIES.some((c) => c.name === n) && !capitulated.includes(n);
      if (order.type === 'makePeace') d.wars = d.wars.filter((k) => k !== key);
      else if (a !== b && known(a) && known(b) && !d.wars.includes(key)) d.wars.push(key);
      continue;
    }
    const u = byId.get(order.unit);
    if (!u) continue; // an order for a unit that no longer exists is ignored
    if (order.type === 'halt') {
      u.path = [];
      u.progress = 0;
    } else {
      const route = findRoute(u.at, order.to, u.type, (p) => canEnter(d, u.owner, p));
      if (!route) continue; // no way by land, or it would cross a country it is not at war with: ignored
      // Keep the progress already made if the new route starts the same way.
      if (route[0] !== u.path[0]) u.progress = 0;
      u.path = route;
    }
  }
}

/**
 * Give orders without letting a day pass, so that the map can show them while the game is
 * paused. step(applyOrders(w, orders)) gives the same world as step(w, orders).
 */
export function applyOrders(world: World, orders: Order[]): World {
  if (!orders.length) return world;
  const d = { units: world.units.map((u) => ({ ...u, path: [...u.path] })), controller: world.controller, wars: [...world.wars], economies: cloneEconomies(world.economies), factories: world.factories };
  giveOrders(d, world.capitulated, orders);
  return { ...world, units: d.units, wars: d.wars, economies: d.economies };
}

/** Advance the world by one day, after applying the orders given today. */
export function step(world: World, orders: Order[] = []): World {
  const rng = new Rng(world.rng);
  const d: Draft = {
    day: world.day,
    units: world.units.map((u) => ({ ...u, path: [...u.path] })),
    controller: [...world.controller],
    wars: [...world.wars],
    battles: world.battles.map((b) => ({ ...b, attackers: [...b.attackers], defenders: [...b.defenders], attackerUnits: [...b.attackerUnits], defenderUnits: [...b.defenderUnits], tally: { ...b.tally } })),
    nextBattleId: world.nextBattleId,
    reports: [...world.reports],
  };
  let capitulated = world.capitulated;
  const economies = cloneEconomies(world.economies);
  const factories = { civ: [...world.factories.civ], mil: [...world.factories.mil] };

  // 1. Orders.
  const ordered = { ...d, economies, factories };
  giveOrders(ordered, capitulated, orders);
  d.wars = ordered.wars;

  // 1b. The economy: taxes and bills, production lines, construction, training. New divisions appear.
  const econ = { day: d.day, startDate: world.startDate, units: d.units, nextUnitId: world.nextUnitId, controller: d.controller, wars: d.wars, economies, factories };
  const oil = runEconomies(econ, capitulated);

  // 2. Supply, from where everyone stands this morning.
  const levels = supplyLevels(d);
  d.units.forEach((u, i) => {
    u.supply = levels[i];
    // Tanks without fuel: a country short of oil cannot keep its armour fully supplied.
    if (u.type === 'armour') u.supply = Math.min(u.supply, Math.max(0.4, oil.get(u.owner) ?? 1));
  });

  // 3. Battles.
  const fought = fightBattles(d, rng);

  // 4. Marching. A division cannot walk into a province while enemy divisions stand in it.
  const occupied = new Map<number, Set<string>>();
  for (const u of d.units) {
    const owners = occupied.get(u.at);
    if (owners) owners.add(u.owner);
    else occupied.set(u.at, new Set([u.owner]));
  }
  const blocked = (u: Unit, p: number): boolean => [...(occupied.get(p) ?? [])].some((o) => atWar(d, u.owner, o));
  for (const u of d.units) {
    let dayLeft = 1; // a unit may cross more than one small province in a day
    while (u.path.length && dayLeft > 0) {
      const next = u.path[0];
      if (!canEnter(d, u.owner, next)) {
        // Peace broke out, or the province changed hands to a neutral: stop here.
        u.path = [];
        u.progress = 0;
        break;
      }
      const need = daysToEnter(u.at, next, u.type);
      if (blocked(u, next)) {
        // It fights for the province instead (see combat.ts), pressing forward as it does, so
        // that it can step in as soon as the defenders give way.
        u.progress = Math.min(1, u.progress + dayLeft / need);
        break;
      }
      const remaining = (1 - u.progress) * need;
      if (remaining <= dayLeft) {
        dayLeft -= remaining;
        u.at = u.path.shift()!;
        u.progress = 0;
        if (atWar(d, u.owner, d.controller[u.at])) d.controller[u.at] = u.owner; // captured
        const owners = occupied.get(u.at);
        if (owners) owners.add(u.owner);
        else occupied.set(u.at, new Set([u.owner]));
      } else {
        u.progress += dayLeft / need;
        dayLeft = 0;
      }
    }
  }

  // 5. Rest, digging in and going hungry.
  for (const u of d.units) {
    u.dugIn = u.path.length ? 0 : Math.min(DIG_IN_MAX_DAYS, u.dugIn + 1);
    // Supply sets a ceiling on organisation: a division getting 70% of its supply cannot stay
    // above 70 organisation. A division that is cut off sinks to zero and then starts to starve.
    const ceiling = 100 * u.supply;
    const resting = !fought.has(u.id);
    const rest = u.path.length ? 0.5 : 1; // marching divisions recover at half speed
    if (u.organisation > ceiling) u.organisation = Math.max(ceiling, u.organisation - ATTRITION_ORG);
    else if (resting) u.organisation = Math.min(ceiling, u.organisation + ORG_RECOVERY * rest);
    if (u.supply === 0 && u.organisation === 0) u.strength -= ATTRITION_STRENGTH;
    else if (resting) u.strength = Math.min(100, u.strength + reinforce(economies[u.owner], u, u.supply * rest));
  }
  d.units = d.units.filter((u) => u.strength > 0);

  // 6. Surrender. (Peace terms come in Stage F; for now the main occupier takes over.)
  for (const loser of new Set(d.wars.flatMap((k) => k.split('|')))) {
    const home = PROVINCES.filter((p) => p.owner === loser);
    const total = home.reduce((a, p) => a + p.victoryPoints, 0);
    const held = new Map<string, number>();
    for (const p of home) if (atWar(d, loser, d.controller[p.id])) held.set(d.controller[p.id], (held.get(d.controller[p.id]) ?? 0) + p.victoryPoints);
    const lost = [...held.values()].reduce((a, b) => a + b, 0);
    if (!total || lost / total < SURRENDER_SHARE) continue;
    const victor = [...held.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0][0];
    capitulated = [...capitulated, loser];
    d.units = d.units.filter((u) => u.owner !== loser);
    d.controller = d.controller.map((c) => (c === loser ? victor : c));
    d.wars = d.wars.filter((k) => !k.split('|').includes(loser));
  }

  return { ...world, day: world.day + 1, rng: rng.state, units: d.units, nextUnitId: econ.nextUnitId, controller: d.controller, wars: d.wars, capitulated, battles: d.battles, nextBattleId: d.nextBattleId, reports: d.reports, economies, factories };
}

/** The current date in words, e.g. "7 March 1936". Uses UTC so it is the same on every computer. */
export function dateLabel(w: Pick<World, 'startDate' | 'day'>): string {
  const d = new Date(`${w.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + w.day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Units standing in a province. */
export const unitsAt = (w: World, province: number): Unit[] => w.units.filter((u) => u.at === province);
