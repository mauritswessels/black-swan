/**
 * AI against AI test wars: two countries, both led by the simple AI, fight on the real map.
 * Used by `npm run balance` and by the "watch a test war" preview in the app.
 */
import { aiOrders } from './ai';
import { COUNTRIES } from './countries';
import type { Order, World } from './types';
import { newWorld, step } from './world';

export interface Scenario {
  attacker: string;
  defender: string;
  /** Divisions each side starts with. */
  start: [number, number];
  /** One line on the real war this resembles, for comparison. */
  history: string;
}

const size = (name: string): number => COUNTRIES.find((c) => c.name === name)!.startArmy.reduce((a, b) => a + b, 0);
const scenario = (attacker: string, defender: string, history: string): Scenario => ({ attacker, defender, start: [size(attacker), size(defender)], history });

export const SCENARIOS: Scenario[] = [
  scenario('Germany', 'Poland', 'In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks.'),
  scenario('Germany', 'France', 'In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming.'),
  scenario('Germany', 'Czechoslovakia', 'Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified.'),
  scenario('Germany', 'Belgium', 'Belgium fell in 18 days in May 1940.'),
  scenario('Italy', 'Yugoslavia', 'Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together.'),
  scenario('Germany', 'Netherlands', 'The Netherlands fell in 5 days in May 1940.'),
  scenario('Soviet Union', 'Finland', 'Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land.'),
  scenario('Soviet Union', 'Poland', 'In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance.'),
  scenario('Soviet Union', 'Romania', 'Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940.'),
  scenario('France', 'Italy', 'In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender.'),
];

/** Both countries' orders for today. */
export const bothSides = (w: World, a: string, b: string): Order[] => [...aiOrders(w, a), ...aiOrders(w, b)];

/** A fresh world in which `attacker` has just declared war on `defender`. */
export function startWar(attacker: string, defender: string, seed: string): World {
  return step(newWorld('freeForAll', seed), [{ type: 'declareWar', by: attacker, on: defender }]);
}

export interface WarResult {
  /** The country left standing, or null for a stalemate. */
  winner: string | null;
  days: number;
  /** Strength lost, in division-equivalents. */
  attackerLost: number;
  defenderLost: number;
  battles: number;
  /** Share of battles the attacking side of that battle won. */
  attackWinShare: number;
  world: World;
}

const strengthOf = (w: World, country: string): number => w.units.reduce((a, u) => a + (u.owner === country ? u.strength / 100 : 0), 0);

export function runWar(attacker: string, defender: string, seed: string, maxDays = 730): WarResult {
  let w = startWar(attacker, defender, seed);
  const before = [strengthOf(w, attacker), strengthOf(w, defender)];
  let battles = 0;
  let attackWins = 0;
  let seen = -1;
  let lastStrength = [...before];
  while (w.day < maxDays && !w.capitulated.length) {
    lastStrength = [strengthOf(w, attacker), strengthOf(w, defender)];
    w = step(w, bothSides(w, attacker, defender));
    for (const r of w.reports) {
      if (r.id <= seen) continue;
      battles++;
      if (r.winner === 'attacker') attackWins++;
    }
    if (w.reports.length) seen = Math.max(seen, ...w.reports.map((r) => r.id));
  }
  const loser = w.capitulated[0] ?? null;
  // A country that surrenders loses its whole army that day; count only what it lost in the fighting.
  const end = [loser === attacker ? lastStrength[0] : strengthOf(w, attacker), loser === defender ? lastStrength[1] : strengthOf(w, defender)];
  return {
    winner: loser ? (loser === attacker ? defender : attacker) : null,
    days: w.day,
    attackerLost: Math.max(0, before[0] - end[0]),
    defenderLost: Math.max(0, before[1] - end[1]),
    battles,
    attackWinShare: battles ? attackWins / battles : 0,
    world: w,
  };
}
