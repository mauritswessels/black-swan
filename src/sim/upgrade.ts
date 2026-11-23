/**
 * Bringing a world saved by an older version of the game up to date.
 *
 * Saves from version 10 (games 1.0 and 1.1) have no front line in their battles and no war
 * replay. Each battle starts its line at the border (0), and the replay starts recording from
 * the day the game is loaded. Saves from version 11 (game 1.2) have no armies: they start with none.
 * Saves from version 12 (game 1.3) have no paratroopers and no joint attacks: every country
 * gets an empty paratrooper production line and store, and there are no joint attacks waiting.
 * Their air wings and fleets are not aimed at anything, which is how they were.
 * Saves from version 13 and before (games up to 1.4) were made on the map of 183 provinces. The
 * finer map of 1.5 keeps those provinces, with the same numbers, and adds the parts split off
 * them after them (map.ts SPLIT_FROM). Each new part is held by whoever held the province it was
 * part of, and has no factories (they stay in the part that kept the old number).
 * Saves from version 14 and before (games up to 1.6) were made on the map of Europe, North
 * Africa and the Near East only. They load as Europe-only games (World.europeOnly): the rest of
 * the world is added as it stood in 1936, with its countries' armies, fleets, air wings,
 * factories and economies, but those countries stay asleep for the rest of the game. The
 * outposts of the countries already on the map (India, Siberia...) go to their 1936 owners.
 */
import { WORLD_COUNTRIES } from './countries';
import { LINE_START } from './economy';
import { EUROPE_SIZE, PROVINCES, SPLIT_FROM } from './map';
import { startReplay } from './replay';
import type { Economy, World } from './types';
import { newWorld } from './world';

/** A list with one entry for each province of the old, coarser map, extended to the new one: each new part takes `fill(parent's entry)`. */
function finer<T>(old: T[], fill: (parent: T) => T): T[] {
  if (old.length >= PROVINCES.length) return old;
  const out = [...old];
  for (const [part, from] of SPLIT_FROM) if (part >= old.length) out[part] = fill(old[from]);
  return out;
}

export function upgradeWorld(w: World): World {
  if (w.controller.length < EUROPE_SIZE) {
    const same = <T>(x: T) => x;
    const replay = w.replay ? { ...w.replay, base: finer(w.replay.base, same), now: finer(w.replay.now, same) } : w.replay;
    w = { ...w, controller: finer(w.controller, same), owner: finer(w.owner, same), factories: { civ: finer(w.factories.civ, () => 0), mil: finer(w.factories.mil, () => 0) }, replay };
  }
  if (w.controller.length < PROVINCES.length) w = addWorld(w);
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

/**
 * A game saved on the Europe-only map (up to 1.6): add the rest of the world as it stood on
 * 1 January 1936, from a fresh world, with its countries asleep for good.
 */
function addWorld(w: World): World {
  const fresh = newWorld('story', `${w.seed}:world`);
  const n = w.controller.length;
  const extend = (old: string[]) => [...old, ...PROVINCES.slice(n).map((p) => p.owner)];
  const replay = w.replay ? { ...w.replay, base: extend(w.replay.base), now: extend(w.replay.now) } : w.replay;
  const world = new Set(WORLD_COUNTRIES);
  // New divisions, fleets and wings are numbered after the save's own.
  let unitId = w.nextUnitId;
  const units = fresh.units.filter((u) => world.has(u.owner)).map((u) => ({ ...u, id: unitId++ }));
  let forceId = w.nextForceId;
  const fleets = fresh.fleets.filter((f) => world.has(f.owner)).map((f) => ({ ...f, id: forceId++ }));
  const wings = fresh.wings.filter((x) => world.has(x.owner)).map((x) => ({ ...x, id: forceId++ }));
  const economies = { ...w.economies };
  for (const name of WORLD_COUNTRIES) if (!economies[name] && fresh.economies[name]) economies[name] = fresh.economies[name];
  return {
    ...w,
    controller: extend(w.controller),
    owner: extend(w.owner),
    factories: { civ: [...w.factories.civ, ...fresh.factories.civ.slice(n)], mil: [...w.factories.mil, ...fresh.factories.mil.slice(n)] },
    replay,
    units: [...w.units, ...units],
    nextUnitId: unitId,
    fleets: [...w.fleets, ...fleets],
    wings: [...w.wings, ...wings],
    nextForceId: forceId,
    economies,
    asleep: [...new Set([...(w.asleep ?? []), ...WORLD_COUNTRIES])],
    europeOnly: true,
  };
}
