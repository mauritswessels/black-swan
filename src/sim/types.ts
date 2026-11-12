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
  /** Divisions at the start: [infantry, armour, artillery]. Rough figures, tuned in Stage B. */
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
}

/** What a player or an AI can tell its units to do. */
export type Order =
  | { type: 'move'; unit: number; to: number }
  | { type: 'halt'; unit: number };
