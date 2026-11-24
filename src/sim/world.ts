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
 * and in the air (forces.ts), supply, battles (combat.ts), marching, rest and attrition,
 * any surrenders, and once a week a record of the front for the war replay (replay.ts). Divisions may only
 * enter their own land, the land of an ally, or the land of a country they are at war with.
 */
import { DIG_IN_MAX_DAYS, fightBattles, stillHolding, type Draft } from './combat';
import { COUNTRIES, STORY_ASLEEP } from './countries';
import { carryOutAim } from './agenda';
import { allianceMap, cloneDiplomacy, giveDiplomacyOrder, isDiplomacyOrder, onGovernmentFell, runDiplomacy, startDiplomacy, surrenders, type DipDraft } from './diplomacy';
import { cloneEconomies, giveEconomyOrder, isEconomyOrder, MEN_PER_DIVISION, monthEnds, moraleOf, onBattleEnded, reinforce, runEconomies, startEconomies, startFactories } from './economy';
import { disband, fireSupport, giveForceOrder, isForceOrder, pictures, pounding, runForces, startForces, type Pictures } from './forces';
import { giveStrikeOrder, leaveStrikes, runStrikes, type StrikeDraft } from './strike';
import { SHELL_LOSS } from './navy';
import { SHIP_KINDS } from './sea';
import { combatEdges, isWinter, modsOf, WINTER_LANDS } from './mods';
import { recordFront, startReplay } from './replay';
import { GROUND_MARCH, groundMap } from './seasons';
import type { ForceDraft } from './navy';
import { beyond, daysToEnter, EUROPE_SIZE, EUROPEAN, findRoute, PROVINCES } from './map';
import { Rng, seedFrom } from './rng';
import { cloneStory, runStory, startStory } from './story';
import { runAmerica, shipAid } from './america';
import { DEPOTS, linkedProvinces, supplyCapacity, supplyLevels } from './supply';
import type { Economy, Mode, Order, Unit, UnitType, World } from './types';
import { atWar, canEnter, enemiesOf } from './war';
import { dateWords } from './dmath';
import { FALL_BACK_DIG, giveArmyOrder, isArmyOrder, keepArmies, type ArmyDraft } from './armies';
import { commanderTraits } from './mods';
import { TRAIT_RECOVERY } from './commanders';

export type { Mode, World } from './types';

const TYPES: UnitType[] = ['infantry', 'armour', 'artillery'];

/** Share of a country's army that starts overseas (colonies and islands), one division per territory. */
const OVERSEAS_SHARE = 0.15;
/**
 * Divisions that start in an ally's land (1.8): Japan's Kwantung Army in Manchukuo, which Japan
 * had conquered in 1931 and ruled through a puppet emperor. Infantry, by province name.
 */
const START_ABROAD: Record<string, [string, number][]> = {
  Japan: [['Kirin', 2], ['Fengtien', 2], ['Heilungkiang', 1]],
};

/**
 * Where a country's divisions start. Most stand in the homeland (the piece of its territory
 * that holds the capital), on the capital and the foreign borders, never more in a province
 * than half of what it can supply while there is room elsewhere. A few garrison its other territories, the richest first.
 * Uses the seeded generator for the order.
 */
function startingUnits(mainRng: Rng, farRng: Rng): Unit[] {
  const units: Unit[] = [];
  let rng = mainRng;
  const shuffle = (ids: number[]): number[] => {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  };
  for (const country of COUNTRIES) {
    // The countries of the Europe-only map stand where they did before 1.7: on their older lands
    // only, placed with the game's own random numbers, so the war in Europe starts as it did. The
    // rest of the world uses numbers of its own.
    const old = EUROPEAN.has(country.name);
    const seen = old ? (p: number) => p < EUROPE_SIZE : () => true;
    if (!old) rng = farRng;
    const home = PROVINCES.filter((p) => p.owner === country.name && seen(p.id));
    const capitalDepot = home.find((p) => p.capital)?.id;
    // The homeland: every home province linked by land to the capital.
    const linked = linkedProvinces(PROVINCES.map((p) => p.owner), country.name);
    const inHomeland = new Set<number>();
    if (capitalDepot !== undefined) {
      const queue = [capitalDepot];
      inHomeland.add(capitalDepot);
      while (queue.length) for (const n of PROVINCES[queue.pop()!].neighbours) if (linked[n] && seen(n) && !inHomeland.has(n)) (inHomeland.add(n), queue.push(n));
    }
    const homeland = home.filter((p) => inHomeland.has(p.id));
    const priority = homeland.filter((p) => p.capital || p.neighbours.some((n) => seen(n) && PROVINCES[n].owner !== country.name));
    const order = shuffle((priority.length ? priority : homeland.length ? homeland : home).map((p) => p.id));
    const rest = shuffle(homeland.filter((p) => !order.includes(p.id)).map((p) => p.id));
    const overseas = (DEPOTS[country.name] ?? []).filter((d) => seen(d) && !inHomeland.has(d)).sort((a, b) => PROVINCES[b].victoryPoints - PROVINCES[a].victoryPoints || a - b);
    const total = country.startArmy[0] + country.startArmy[1] + country.startArmy[2];
    const abroad = overseas.length ? Math.round(total * OVERSEAS_SHARE) : 0;

    const kwantung = (START_ABROAD[country.name] ?? []).flatMap(([name, n]) => new Array<number>(n).fill(PROVINCES.find((p) => p.name === name)!.id));
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
        const at = t === 0 && n < kwantung.length ? kwantung[n] : garrison ? overseas[(count - 1 - n) % overseas.length] : nextSpot();
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
  const units = startingUnits(rng, new Rng(seedFrom(`${seedText}:world`)));
  const controller = PROVINCES.map((p) => p.owner);
  const factories = startFactories();
  const forces = startForces();
  const economies = startEconomies({ controller, factories, units, wars: [], fleets: forces.fleets, wings: forces.wings });
  // In Story mode the rest of the world sits out the war, all but East Asia (countries.ts, 1.8).
  const asleep = mode === 'story' ? [...STORY_ASLEEP] : [];
  return { mode, player, seed, rng: rng.state, day: 0, startDate, units, nextUnitId: units.length, controller, owner: [...controller], diplomacy: startDiplomacy(economies, asleep), wars: [], declaredBy: {}, capitulated: [], asleep, battles: [], nextBattleId: 0, reports: [], economies, factories, ...forces, story: startStory('1936', 'close', seed), replay: startReplay(controller, 0), armies: [], nextArmyId: 0, strikes: [], nextStrikeId: 0 };
}

/** Organisation regained per day of rest with full supply. */
export const ORG_RECOVERY = 3;
/** Organisation lost per day while above what the division's supply can sustain, and strength lost per day once a cut-off division has none left. */
export const ATTRITION_ORG = 3;
export const ATTRITION_STRENGTH = 2;
/**
 * Strength a division in the front line loses a day even when no battle is fought: sickness,
 * shelling, raids, accidents. A front is any province next to one held by an enemy. The loss is
 * made good from the equipment stock and the manpower pool like any other, so holding a long
 * front for years drains a country's men and factories: a war of attrition. Twice as much in
 * the northern winter for an army that is not used to it.
 */
export const FRONT_WASTAGE = 0.05;
/** Share of the men lost in battle or to wear and tear who are wounded or sick and come back from hospital (see callUp in economy.ts). */
export const WOUNDED_RETURN = 0.4;
/** Points of strength lost: the wounded among them start on their way back to the manpower pool. */
const recover = (e: Economy | undefined, strength: number): void => {
  if (e) e.callUp = (e.callUp ?? 0) + (strength / 100) * MEN_PER_DIVISION * WOUNDED_RETURN;
};
export { SURRENDER_SHARE } from './diplomacy';

type StepDraft = DipDraft & ForceDraft & ArmyDraft & StrikeDraft;

/** A copy of the world that orders and diplomacy may change freely. */
function draftOf(world: World): StepDraft {
  return {
    armies: (world.armies ?? []).map((a) => ({ ...a, units: [...a.units], order: { ...a.order } })), nextArmyId: world.nextArmyId ?? 0,
    strikes: (world.strikes ?? []).map((s) => ({ ...s, units: [...s.units], wings: [...s.wings], fleets: [...s.fleets] })), nextStrikeId: world.nextStrikeId ?? 0,
    fleets: world.fleets.map((f) => ({ ...f, ships: { ...f.ships } })), wings: world.wings.map((x) => ({ ...x })), nextForceId: world.nextForceId, bombed: { ...world.bombed },
    clashes: world.clashes, forceLog: world.forceLog, nextForceEventId: world.nextForceEventId,
    day: world.day, startDate: world.startDate, mode: world.mode, player: world.player,
    units: world.units.map((u) => ({ ...u, path: [...u.path] })), nextUnitId: world.nextUnitId,
    controller: [...world.controller], owner: [...world.owner], wars: [...world.wars], declaredBy: { ...world.declaredBy }, capitulated: [...world.capitulated], asleep: world.asleep,
    economies: cloneEconomies(world.economies), factories: { civ: [...world.factories.civ], mil: [...world.factories.mil] }, diplomacy: cloneDiplomacy(world.diplomacy), story: cloneStory(world.story),
  };
}

/** Carry out orders on a world that is being changed. Orders that make no sense are ignored. */
function giveOrders(d: StepDraft, orders: Order[]): void {
  let seas: Pictures | null = null;
  let units: Unit[] | null = null;
  let byId = new Map<number, Unit>();
  let friends: Map<string, Set<string>> | null = null;
  for (const order of orders) {
    if (isForceOrder(order)) {
      if ((order.type === 'ship' || order.type === 'drop') && d.strikes.length) leaveStrikes(d, [order.unit]);
      friends ??= allianceMap(d.diplomacy);
      giveForceOrder(d, order, friends, () => (seas ??= pictures(d, friends!)).sea);
      if (order.type !== 'ship') seas = null; // fleets and wings may have moved
      continue;
    }
    if (isEconomyOrder(order)) {
      giveEconomyOrder(d, d.capitulated, order);
      continue;
    }
    if (isArmyOrder(order)) {
      giveArmyOrder(d, order);
      continue;
    }
    if (order.type === 'strike') {
      friends ??= allianceMap(d.diplomacy);
      giveStrikeOrder(d, order, friends, () => (seas ??= pictures(d, friends!)).sea);
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
    if (u.dropped && u.path.length) continue; // paratroopers in a fight cannot be called back
    // A new order on land cancels a crossing that has not sailed yet, a drop, and any joint attack it was waiting for.
    u.sea = undefined;
    u.drop = undefined;
    if (d.strikes.length) leaveStrikes(d, [u.id]);
    if (order.type === 'halt') {
      u.path = [];
      u.progress = 0;
      u.landing = undefined;
      u.via = undefined; // a division that had pushed on goes back to the line it set out from
    } else {
      friends ??= allianceMap(d.diplomacy);
      const mine = friends.get(u.owner);
      const safe = order.friendly ? (p: number) => d.controller[p] === u.owner || !!mine?.has(d.controller[p]) : () => true;
      const ok = (p: number) => canEnter(d, u.owner, p, mine) && safe(p);
      // A division that has pushed on (a deep attack) carries on from where it got to, if it can.
      const onward = u.via !== undefined && u.via !== order.to ? findRoute(u.via, order.to, u.type, ok) : null;
      // `through`: by way of that province (an army pushing on past the province it attacks, armies.ts).
      const by = order.through !== undefined && !onward ? findRoute(u.at, order.through, u.type, ok) : null;
      const rest = by ? findRoute(order.through!, order.to, u.type, ok) : null;
      const route = onward ?? (by && rest ? [...by, ...rest] : findRoute(u.at, order.to, u.type, ok));
      if (!route) continue; // no way by land, or it would cross a country it is neither allied to nor at war with: ignored
      if (!onward) u.via = undefined;
      // Keep the progress already made if the new route starts the same way.
      if (route[0] !== u.path[0]) u.progress = 0;
      u.path = route;
      u.landing = undefined;
    }
  }
}

const fromDraft = (world: World, d: StepDraft): World => ({
  ...world, armies: d.armies, nextArmyId: d.nextArmyId, strikes: d.strikes, nextStrikeId: d.nextStrikeId, fleets: d.fleets, wings: d.wings, nextForceId: d.nextForceId, bombed: d.bombed, clashes: d.clashes, forceLog: d.forceLog, nextForceEventId: d.nextForceEventId, units: d.units, nextUnitId: d.nextUnitId, controller: d.controller, owner: d.owner, wars: d.wars, declaredBy: d.declaredBy, capitulated: d.capitulated, economies: d.economies, factories: d.factories, diplomacy: d.diplomacy, story: d.story,
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
  // The dice for battles beyond the Europe-only map (1.8): their own, made fresh each day from the
  // seed, so that the war in China cannot change the luck of a battle in Europe.
  const far = new Rng(seedFrom(`${world.seed}:far:${world.day}`));
  const dd = draftOf(world);

  // 1. Orders, then the day's diplomacy: deadlines, cases for war, and once a month the drift of relations.
  giveOrders(dd, orders);
  // Joint attacks whose fleets and wings are in place go in (strike.ts).
  if (dd.strikes.length) giveOrders(dd, runStrikes(dd));
  const monthEnd = monthEnds(world.startDate, world.day);
  runDiplomacy(dd, monthEnd);
  // 1a. The story: history cards, events with choices, chapters and the end of the game (story.ts).
  runStory(dd, monthEnd, world.seed);
  // America and the Dominions (1.9, america.ts): neutrality, Lend-Lease, going to war, Torch.
  runAmerica(dd, monthEnd);

  // 1b. The economy: taxes and bills, production lines, construction, training. New divisions appear.
  const fallen = new Map(Object.entries(dd.economies).map(([name, e]) => [name, [e.governmentsFallen, e.government] as const]));
  const oil = runEconomies(dd, world.asleep?.length ? [...dd.capitulated, ...world.asleep] : dd.capitulated);
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
    ground: groundMap(world.startDate, world.day),
  };
  const ground = d.ground!;
  const friends = d.friends!;
  const economies = dd.economies;

  // 1c. The war at sea and in the air: who controls each sea zone and the sky, sea battles,
  // convoys, air losses, bombing, and divisions sailing.
  dd.forceLog = [...dd.forceLog];
  const seen = pictures(dd, friends);
  runForces(dd, rng, seen, friends, far);
  // The month's Lend-Lease convoys cross the ocean (america.ts).
  if (monthEnd) shipAid(dd, seen.sea, friends);
  d.units = dd.units;
  d.air = seen.air.battle;
  // Fire support in battles: aimed bombers and ships shelling the coast (forces.ts).
  const anyFire = seen.air.aimed.size > 0 || dd.fleets.some((f) => f.target !== undefined);
  if (anyFire) {
    d.fire = fireSupport(dd, seen, friends);
    d.shelled = new Set();
  }

  // 2. Supply, from where everyone stands this morning.
  const levels = supplyLevels({ ...d, asleep: world.asleep }, friends, seen.sea);
  d.units.forEach((u, i) => {
    u.supply = levels[i];
    // Tanks without fuel: a country short of oil cannot keep its armour fully supplied.
    if (u.type === 'armour') u.supply = Math.min(u.supply, Math.max(0.4, oil.get(u.owner) ?? 1));
  });

  // 3. Battles. Research, plans and forts give each side its edge; results move the mood at home.
  d.edges = combatEdges(economies, { effects: dd.story.effects, day: world.day, startDate: world.startDate, armies: dd.armies });
  const known = new Set(d.reports.map((r) => r.id));
  const before = new Map(d.units.map((u) => [u.id, u.strength]));
  const fought = fightBattles(d, rng, far);
  // Many of the men a battle costs are wounded, not killed or taken prisoner: they come back to the pool from hospital.
  for (const u of d.units) {
    const lost = (before.get(u.id) ?? u.strength) - u.strength;
    if (lost > 0) recover(economies[u.owner], lost);
  }
  for (const r of d.reports) {
    if (known.has(r.id)) continue;
    for (const [side, lost] of [[r.attackers, r.attackerLosses], [r.defenders, r.defenderLosses + r.surrendered]] as const) for (const name of side) dd.story.losses[name] = (dd.story.losses[name] ?? 0) + lost / side.length;
  }
  for (const r of d.reports) if (!known.has(r.id)) onBattleEnded(economies, r.winner === 'attacker' ? r.attackers : r.defenders, r.winner === 'attacker' ? r.defenders : r.attackers);
  // The shore batteries hit back at the ships that shelled them.
  if (d.shelled?.size) for (const f of dd.fleets) if (d.shelled.has(f.id)) for (const k of SHIP_KINDS) f.ships[k] *= 1 - SHELL_LOSS;

  // 4. Marching. A division cannot walk into a province while enemy divisions stand in it.
  const occupied = new Map<number, Set<string>>();
  for (const u of d.units) {
    const owners = occupied.get(u.at);
    if (owners) owners.add(u.owner);
    else occupied.set(u.at, new Set([u.owner]));
  }
  const blocked = (u: Unit, p: number): boolean => [...(occupied.get(p) ?? [])].some((o) => atWar(d, u.owner, o));
  const arrive = (u: Unit, p: number, allies: Set<string> | undefined): void => {
    u.at = p;
    const holder = d.controller[p];
    if (atWar(d, u.owner, holder)) {
      // Captured. Land that belongs to an ally still in the fight is handed back to it (liberated).
      const owner = dd.owner[p];
      d.controller[p] = owner !== u.owner && allies?.has(owner) && !dd.capitulated.includes(owner) && atWar(d, owner, holder) ? owner : u.owner;
    }
    const owners = occupied.get(p);
    if (owners) owners.add(u.owner);
    else occupied.set(p, new Set([u.owner]));
  };
  for (const u of d.units) {
    let dayLeft = 1; // a unit may cross more than one small province in a day
    const allies = friends.get(u.owner);
    // A deep attack (combat.ts): the province the division pushed on through.
    if (u.via !== undefined) {
      const b = u.via;
      const ours = d.controller[b] === u.owner || !!allies?.has(d.controller[b]);
      if (ours || (atWar(d, u.owner, d.controller[b]) && !blocked(u, b))) {
        // Taken, or its defenders have gone: the division is standing in it.
        u.via = undefined;
        arrive(u, b, allies);
      } else if (!atWar(d, u.owner, d.controller[b]) || !d.battles.some((x) => x.province === b && stillHolding(x) && x.attackers.some((c) => c === u.owner || !!allies?.has(c)))) {
        // The fight behind it was lost (or peace was made): back to the line it set out from.
        u.via = undefined;
        u.path = [];
        u.progress = 0;
      }
    }
    while (u.path.length && dayLeft > 0) {
      const next = u.path[0];
      if (!canEnter(d, u.owner, next, allies)) {
        // Peace broke out, or the province changed hands to a neutral: stop here.
        u.path = [];
        u.progress = 0;
        break;
      }
      // A landing crosses in a day: the weeks of preparation are already behind it. Mud and snow slow the march (seasons.ts).
      const need = u.landing ? 1 : daysToEnter(u.via ?? u.at, next, u.type) / GROUND_MARCH[ground[next]];
      if (blocked(u, next)) {
        // It fights for the province instead: how far in it stands is the battle's front line (combat.ts).
        break;
      }
      const remaining = (1 - u.progress) * need;
      if (remaining <= dayLeft) {
        dayLeft -= remaining;
        u.progress = 0;
        u.via = undefined;
        arrive(u, u.path.shift()!, allies);
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
  const winter = isWinter(world.startDate, world.day);
  // Armies: a commander good at supply speeds recovery; an army falling back digs in faster.
  const traits = commanderTraits(dd.armies);
  const digging = new Set(dd.armies.filter((a) => a.order.kind === 'fallBack').flatMap((a) => a.units));
  // Under the bombs and the guns of an enemy aimed at them, divisions cannot dig in (forces.ts).
  const pounded = anyFire ? pounding(dd, seen) : null;
  const underFire = (u: Unit): boolean => !!pounded?.get(u.at)?.some((c) => atWar(d, c, u.owner));
  const front = new Map<string, boolean>();
  const atFront = (u: Unit): boolean => {
    const k = `${u.owner}@${u.at}`;
    let x = front.get(k);
    if (x === undefined) front.set(k, (x = PROVINCES[u.at].neighbours.some((n) => atWar(d, u.owner, d.controller[n]) && !beyond(n, u.owner, d.controller[n]))));
    return x;
  };
  for (const u of d.units) {
    u.dugIn = u.path.length ? 0 : underFire(u) ? Math.max(0, u.dugIn - 1) : Math.min(DIG_IN_MAX_DAYS, u.dugIn + (digging.has(u.id) ? FALL_BACK_DIG : 1));
    // Wear and tear at the front. Divisions in a battle take their losses there instead.
    const hot = ground[u.at] === 'heat';
    if (!fought.has(u.id) && atFront(u)) {
      const worn = Math.min(u.strength, FRONT_WASTAGE * (winter && WINTER_LANDS.has(PROVINCES[u.at].owner) && !WINTER_LANDS.has(u.owner) ? 2 : 1) * (hot ? 2 : 1));
      u.strength -= worn;
      recover(economies[u.owner], worn);
    }
    if (u.landing && !u.path.length) u.landing = u.dropped = undefined; // ashore, or the landing was beaten off
    // Supply sets a ceiling on organisation: a division getting 70% of its supply cannot stay
    // above 70 organisation. A division that is cut off sinks to zero and then starts to starve.
    const ceiling = 100 * u.supply;
    const resting = !fought.has(u.id);
    const rest = u.path.length ? 0.5 : 1; // marching divisions recover at half speed
    if (u.organisation > ceiling) u.organisation = Math.max(ceiling, u.organisation - ATTRITION_ORG);
    else if (resting) u.organisation = Math.min(ceiling, u.organisation + ORG_RECOVERY * rest * recoveryOf(u.owner) * (hot ? 0.5 : 1) * (traits.has(u.id) ? TRAIT_RECOVERY[traits.get(u.id)!] : 1));
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
  // Armies lose the divisions that are gone and take in the new ones.
  keepArmies(dd, world.nextUnitId);

  // 7. Once a week, the front is written down for the war replay.
  return { ...fromDraft(world, dd), day: world.day + 1, rng: rng.state, battles: d.battles, nextBattleId: d.nextBattleId, reports: d.reports, replay: recordFront(world.replay, dd.controller, world.day + 1) };
}

/** The current date in words, e.g. "7 March 1936". Uses UTC so it is the same on every computer. */
export function dateLabel(w: Pick<World, 'startDate' | 'day'>): string {
  return dateWords(w.startDate, w.day);
}

/** Units standing in a province. */
export const unitsAt = (w: World, province: number): Unit[] => w.units.filter((u) => u.at === province);
