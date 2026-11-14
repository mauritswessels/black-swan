/**
 * The game world and how it moves forward one day at a time.
 *
 *   step(world, orders) -> next world
 *
 * Pure TypeScript with no UI: nothing in src/sim may import from src/ui. step never changes the
 * world it is given; it returns a new one. The same world and the same orders always give the
 * same result, because all randomness comes from the seeded generator stored in the world.
 *
 * Each day, in order: orders (military, economic and diplomatic), the day's diplomacy
 * (diplomacy.ts), the economy with research and national plans (economy.ts), the war at sea
 * and in the air (forces.ts), supply, battles (combat.ts), marching, rest and attrition, and
 * finally any surrenders. Divisions may only
 * enter their own land, the land of an ally, or the land of a country they are at war with.
 */
import { DIG_IN_MAX_DAYS, fightBattles, type Draft } from './combat';
import { COUNTRIES } from './countries';
import { carryOutAim } from './agenda';
import { allianceMap, cloneDiplomacy, giveDiplomacyOrder, isDiplomacyOrder, onGovernmentFell, runDiplomacy, startDiplomacy, surrenders, type DipDraft } from './diplomacy';
import { cloneEconomies, giveEconomyOrder, isEconomyOrder, monthEnds, moraleOf, onBattleEnded, reinforce, runEconomies, startEconomies, startFactories } from './economy';
import { disband, giveForceOrder, isForceOrder, pictures, runForces, startForces, type Pictures } from './forces';
import { combatEdges, modsOf } from './mods';
import type { ForceDraft } from './navy';
import { daysToEnter, findRoute, PROVINCES } from './map';
import { Rng, seedFrom } from './rng';
import { DEPOTS, linkedProvinces, supplyCapacity, supplyLevels } from './supply';
import type { Mode, Order, Unit, UnitType, World } from './types';
import { atWar, canEnter, enemiesOf } from './war';

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
  const forces = startForces();
  const economies = startEconomies({ controller, factories, units, wars: [], fleets: forces.fleets, wings: forces.wings });
  return { mode, player, seed, rng: rng.state, day: 0, startDate, units, nextUnitId: units.length, controller, owner: [...controller], diplomacy: startDiplomacy(economies), wars: [], declaredBy: {}, capitulated: [], battles: [], nextBattleId: 0, reports: [], economies, factories, ...forces };
}

/** Organisation regained per day of rest with full supply. */
export const ORG_RECOVERY = 3;
/** Organisation lost per day while above what the division's supply can sustain, and strength lost per day once a cut-off division has none left. */
export const ATTRITION_ORG = 3;
export const ATTRITION_STRENGTH = 2;
export { SURRENDER_SHARE } from './diplomacy';

/** A copy of the world that orders and diplomacy may change freely. */
function draftOf(world: World): DipDraft & ForceDraft {
  return {
    fleets: world.fleets.map((f) => ({ ...f, ships: { ...f.ships } })), wings: world.wings.map((x) => ({ ...x })), nextForceId: world.nextForceId, bombed: { ...world.bombed },
    clashes: world.clashes, forceLog: world.forceLog, nextForceEventId: world.nextForceEventId,
    day: world.day, startDate: world.startDate, mode: world.mode, player: world.player,
    units: world.units.map((u) => ({ ...u, path: [...u.path] })), nextUnitId: world.nextUnitId,
    controller: [...world.controller], owner: [...world.owner], wars: [...world.wars], declaredBy: { ...world.declaredBy }, capitulated: [...world.capitulated],
    economies: cloneEconomies(world.economies), factories: { civ: [...world.factories.civ], mil: [...world.factories.mil] }, diplomacy: cloneDiplomacy(world.diplomacy),
  };
}

/** Carry out orders on a world that is being changed. Orders that make no sense are ignored. */
function giveOrders(d: DipDraft & ForceDraft, orders: Order[]): void {
  let seas: Pictures | null = null;
  let units: Unit[] | null = null;
  let byId = new Map<number, Unit>();
  let friends: Map<string, Set<string>> | null = null;
  for (const order of orders) {
    if (isForceOrder(order)) {
      friends ??= allianceMap(d.diplomacy);
      giveForceOrder(d, order, friends, () => (seas ??= pictures(d, friends!)).sea);
      if (order.type !== 'ship') seas = null; // fleets and wings may have moved
      continue;
    }
    if (isEconomyOrder(order)) {
      giveEconomyOrder(d, d.capitulated, order);
      continue;
    }
    if (order.type === 'aim' || isDiplomacyOrder(order)) {
      if (order.type === 'aim') carryOutAim(d, order.id, order.go);
      else giveDiplomacyOrder(d, order);
      friends = null; // pacts and wars may have changed
      seas = null;
      continue;
    }
    if (units !== d.units) {
      units = d.units;
      byId = new Map(units.map((u) => [u.id, u]));
    }
    const u = byId.get(order.unit);
    if (!u) continue; // an order for a unit that no longer exists is ignored
    // A new order on land cancels a crossing that has not sailed yet.
    u.sea = undefined;
    if (order.type === 'halt') {
      u.path = [];
      u.progress = 0;
      u.landing = undefined;
    } else {
      friends ??= allianceMap(d.diplomacy);
      const mine = friends.get(u.owner);
      const route = findRoute(u.at, order.to, u.type, (p) => canEnter(d, u.owner, p, mine));
      if (!route) continue; // no way by land, or it would cross a country it is neither allied to nor at war with: ignored
      // Keep the progress already made if the new route starts the same way.
      if (route[0] !== u.path[0]) u.progress = 0;
      u.path = route;
      u.landing = undefined;
    }
  }
}

const fromDraft = (world: World, d: DipDraft & ForceDraft): World => ({
  ...world, fleets: d.fleets, wings: d.wings, nextForceId: d.nextForceId, bombed: d.bombed, clashes: d.clashes, forceLog: d.forceLog, nextForceEventId: d.nextForceEventId, units: d.units, nextUnitId: d.nextUnitId, controller: d.controller, owner: d.owner, wars: d.wars, declaredBy: d.declaredBy, capitulated: d.capitulated, economies: d.economies, factories: d.factories, diplomacy: d.diplomacy,
});

/**
 * Give orders without letting a day pass, so that the map can show them while the game is
 * paused. step(applyOrders(w, orders)) gives the same world as step(w, orders).
 */
export function applyOrders(world: World, orders: Order[]): World {
  if (!orders.length) return world;
  const d = draftOf(world);
  giveOrders(d, orders);
  return fromDraft(world, d);
}

/** Advance the world by one day, after applying the orders given today. */
export function step(world: World, orders: Order[] = []): World {
  const rng = new Rng(world.rng);
  const dd = draftOf(world);

  // 1. Orders, then the day's diplomacy: deadlines, cases for war, and once a month the drift of relations.
  giveOrders(dd, orders);
  const monthEnd = monthEnds(world.startDate, world.day);
  runDiplomacy(dd, monthEnd);

  // 1b. The economy: taxes and bills, production lines, construction, training. New divisions appear.
  const fallen = new Map(Object.entries(dd.economies).map(([name, e]) => [name, [e.governmentsFallen, e.government] as const]));
  const oil = runEconomies(dd, dd.capitulated);
  for (const [name, [n, was]] of fallen) if (dd.economies[name].governmentsFallen > n) onGovernmentFell(dd, name, was);

  const d: Draft = {
    day: world.day,
    units: dd.units,
    controller: dd.controller,
    wars: dd.wars,
    battles: world.battles.map((b) => ({ ...b, attackers: [...b.attackers], defenders: [...b.defenders], attackerUnits: [...b.attackerUnits], defenderUnits: [...b.defenderUnits], tally: { ...b.tally } })),
    nextBattleId: world.nextBattleId,
    reports: [...world.reports],
    friends: allianceMap(dd.diplomacy),
  };
  const friends = d.friends!;
  const economies = dd.economies;

  // 1c. The war at sea and in the air: who controls each sea zone and the sky, sea battles,
  // convoys, air losses, bombing, and divisions sailing.
  dd.forceLog = [...dd.forceLog];
  const seen = pictures(dd, friends);
  runForces(dd, rng, seen, friends);
  d.units = dd.units;
  d.air = seen.air.battle;

  // 2. Supply, from where everyone stands this morning.
  const levels = supplyLevels(d, friends, seen.sea);
  d.units.forEach((u, i) => {
    u.supply = levels[i];
    // Tanks without fuel: a country short of oil cannot keep its armour fully supplied.
    if (u.type === 'armour') u.supply = Math.min(u.supply, Math.max(0.4, oil.get(u.owner) ?? 1));
  });

  // 3. Battles. Research, plans and forts give each side its edge; results move the mood at home.
  d.edges = combatEdges(economies);
  const known = new Set(d.reports.map((r) => r.id));
  const fought = fightBattles(d, rng);
  for (const r of d.reports) if (!known.has(r.id)) onBattleEnded(economies, r.winner === 'attacker' ? r.attackers : r.defenders, r.winner === 'attacker' ? r.defenders : r.attackers);

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
    const allies = friends.get(u.owner);
    while (u.path.length && dayLeft > 0) {
      const next = u.path[0];
      if (!canEnter(d, u.owner, next, allies)) {
        // Peace broke out, or the province changed hands to a neutral: stop here.
        u.path = [];
        u.progress = 0;
        break;
      }
      // A landing crosses in a day: the weeks of preparation are already behind it.
      const need = u.landing ? 1 : daysToEnter(u.at, next, u.type);
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
        const holder = d.controller[u.at];
        if (atWar(d, u.owner, holder)) {
          // Captured. Land that belongs to an ally still in the fight is handed back to it (liberated).
          const owner = dd.owner[u.at];
          d.controller[u.at] = owner !== u.owner && allies?.has(owner) && !dd.capitulated.includes(owner) && atWar(d, owner, holder) ? owner : u.owner;
        }
        const owners = occupied.get(u.at);
        if (owners) owners.add(u.owner);
        else occupied.set(u.at, new Set([u.owner]));
      } else {
        u.progress += dayLeft / need;
        dayLeft = 0;
      }
    }
  }

  // 5. Rest, digging in and going hungry. An army recovers faster with better transport and
  // staff work, and more slowly in a war its people do not want.
  const recovery = new Map<string, number>();
  const recoveryOf = (owner: string): number => {
    let x = recovery.get(owner);
    if (x === undefined) {
      const e = economies[owner];
      x = e ? (1 + modsOf(e).orgRecovery) * moraleOf(e.warSupport, enemiesOf(d, owner).length > 0) : 1;
      recovery.set(owner, x);
    }
    return x;
  };
  for (const u of d.units) {
    u.dugIn = u.path.length ? 0 : Math.min(DIG_IN_MAX_DAYS, u.dugIn + 1);
    if (u.landing && !u.path.length) u.landing = undefined; // ashore, or the landing was beaten off
    // Supply sets a ceiling on organisation: a division getting 70% of its supply cannot stay
    // above 70 organisation. A division that is cut off sinks to zero and then starts to starve.
    const ceiling = 100 * u.supply;
    const resting = !fought.has(u.id);
    const rest = u.path.length ? 0.5 : 1; // marching divisions recover at half speed
    if (u.organisation > ceiling) u.organisation = Math.max(ceiling, u.organisation - ATTRITION_ORG);
    else if (resting) u.organisation = Math.min(ceiling, u.organisation + ORG_RECOVERY * rest * recoveryOf(u.owner));
    if (u.supply === 0 && u.organisation === 0) u.strength -= ATTRITION_STRENGTH;
    else if (resting) u.strength = Math.min(100, u.strength + reinforce(economies[u.owner], u, u.supply * rest));
  }
  d.units = d.units.filter((u) => u.strength > 0);

  // 6. Surrender (diplomacy.ts): the loser is occupied, and whatever it had conquered is restored.
  dd.units = d.units;
  dd.controller = d.controller;
  dd.wars = d.wars;
  surrenders(dd);
  disband(dd, (name) => dd.capitulated.includes(name) || name in dd.diplomacy.conquered);

  return { ...fromDraft(world, dd), day: world.day + 1, rng: rng.state, battles: d.battles, nextBattleId: d.nextBattleId, reports: d.reports };
}

/** The current date in words, e.g. "7 March 1936". Uses UTC so it is the same on every computer. */
export function dateLabel(w: Pick<World, 'startDate' | 'day'>): string {
  const d = new Date(`${w.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + w.day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Units standing in a province. */
export const unitsAt = (w: World, province: number): Unit[] => w.units.filter((u) => u.at === province);
