/** The shapes of data in the game engine. Plain objects only, so the world saves as JSON. */

export type Terrain = 'plains' | 'forest' | 'hills' | 'mountains' | 'marsh' | 'desert';
export type Government = 'democracy' | 'authoritarian' | 'fascist' | 'communist';
export type UnitType = 'infantry' | 'armour' | 'artillery';
export type Mode = 'story' | 'freeForAll';

/** One piece of the map. This never changes during a game, so it is not stored in saves. */
export interface Province {
  id: number;
  name: string;
  /** The country that held it on 1 January 1936. */
  owner: string;
  terrain: Terrain;
  /** [longitude, latitude] of its centre. */
  centre: [number, number];
  areaKm2: number;
  /** Ids of the provinces an army can walk to from here. */
  neighbours: number[];
  victoryPoints: number;
  /** The main city, if it has a notable one. */
  city: string | null;
  capital: boolean;
}

export interface Country {
  /** The country's name, also used as its id. */
  name: string;
  adjective: string;
  government: Government;
  /** One of the six countries you can play in Story mode. */
  major: boolean;
  /** Divisions at the start: [infantry, armour, artillery]. Rough peacetime figures for 1936. */
  startArmy: [number, number, number];
}

export interface Unit {
  id: number;
  owner: string;
  type: UnitType;
  /** Province it is standing in. */
  at: number;
  /** Men and equipment, 0 to 100. */
  strength: number;
  /** Readiness to fight, 0 to 100. */
  organisation: number;
  /** Provinces still to walk through, next one first. Empty when standing still. */
  path: number[];
  /** How far along the way to path[0], from 0 to 1. */
  progress: number;
  /** Days spent standing still, 0 to 10. Each day adds 2% to its defence (see combat.ts). */
  dugIn: number;
  /** How much of its daily supply arrived, from 0 (cut off) to 1 (all of it). */
  supply: number;
}

/** A battle being fought right now for one province. */
export interface Battle {
  id: number;
  province: number;
  startDay: number;
  /** The countries attacking and defending, the one with most divisions first. */
  attackers: string[];
  defenders: string[];
  /** Every division that has taken part so far, by id. */
  attackerUnits: number[];
  defenderUnits: number[];
  /** Strength lost so far, in division-equivalents (100 points of strength = 1). */
  attackerLosses: number;
  defenderLosses: number;
  /** Divisions that surrendered because they had nowhere to retreat. */
  surrendered: number;
  /** Running totals used to explain the result afterwards (see combat.ts). */
  tally: BattleTally;
}

/** Sums over the days of a battle. Dividing by `days` gives the averages. */
export interface BattleTally {
  days: number;
  /** Divisions in the fight each day. */
  attackerCount: number;
  defenderCount: number;
  /** The attackers' terrain multiplier (1 = open ground). */
  terrain: number;
  /** Supply multipliers, 0.5 to 1. */
  attackerSupply: number;
  defenderSupply: number;
  /** The defenders' dig-in multiplier after enemy artillery, 1 to 1.2. */
  dugIn: number;
  /** Directions the attack came from. */
  directions: number;
  /** Share of the attackers' hitting power that came from armour and from artillery. */
  armourShare: number;
  artilleryShare: number;
}

/** One reason for how a battle ended, e.g. "attacking into mountains". */
export interface Cause {
  text: string;
  /** How much it mattered; causes are listed biggest first. */
  weight: number;
}

/** What is kept after a battle ends, for the player to read. */
export interface BattleReport {
  id: number;
  province: number;
  startDay: number;
  endDay: number;
  attackers: string[];
  defenders: string[];
  winner: 'attacker' | 'defender';
  attackerDivisions: number;
  defenderDivisions: number;
  attackerLosses: number;
  defenderLosses: number;
  surrendered: number;
  /** Why it ended this way, biggest cause first. */
  causes: Cause[];
}

/** Everything that changes during a game. */
export interface World {
  mode: Mode;
  seed: number;
  /** State of the seeded random-number generator (see rng.ts). */
  rng: number;
  /** Days since the start date. */
  day: number;
  /** The first day of the game, as an ISO date. */
  startDate: string;
  units: Unit[];
  nextUnitId: number;
  /** Who controls each province right now, by province id. */
  controller: string[];
  /** Pairs of countries at war, each written "A|B" with the names in alphabetical order. */
  wars: string[];
  /** Countries that have surrendered. */
  capitulated: string[];
  battles: Battle[];
  nextBattleId: number;
  /** The most recent battle reports, oldest first (the last 60 are kept). */
  reports: BattleReport[];
}

/** What a player or an AI can tell its units to do. */
export type Order =
  | { type: 'move'; unit: number; to: number }
  | { type: 'halt'; unit: number }
  /** Stage B has no diplomacy: war and peace simply happen. Stage F adds the rules around them. */
  | { type: 'declareWar'; by: string; on: string }
  | { type: 'makePeace'; a: string; b: string };
