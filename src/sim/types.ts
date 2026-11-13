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
  /** A three-letter code for map counters, e.g. FRA. */
  tag: string;
  /** Divisions at the start: [infantry, armour, artillery]. Rough peacetime figures for 1936. */
  startArmy: [number, number, number];
  /** Factories, people and raw materials at the start (see countries.ts). */
  industry: Industry;
}

/** A country's economy on 1 January 1936, in rough figures scaled for play. */
export interface Industry {
  civ: number;
  mil: number;
  /** Millions of people. */
  population: number;
  /** Units of steel and oil produced a month. One military factory needs one steel. */
  steel: number;
  oil: number;
}

export type FactoryKind = 'civ' | 'mil';

/** One production line: military factories all making equipment for one kind of division. */
export interface Line {
  factories: number;
  /** 0.5 to 1. Rises the longer the line runs; new factories start at 0.5. */
  efficiency: number;
}

/** One month of a country's economy and home front, kept for the charts. */
export interface MonthRecord {
  day: number;
  /** Per cent a year. */
  inflation: number;
  priceLevel: number;
  /** Debt as a share of a year's output (1 = 100%). */
  debtRatio: number;
  treasury: number;
  /** Income minus spending for the month. */
  balance: number;
  stability: number;
  printed: number;
  borrowed: number;
  realGDP: number;
  shortage: number;
  warSupport: number;
}

/** What a country knows and what its research teams are working on (see research.ts). */
export interface ResearchState {
  /** One entry per research team: the id of the technology it is working on, or null. */
  slots: (string | null)[];
  /** Days of work done on unfinished technologies, by id. Kept when a team moves on. */
  progress: Record<string, number>;
  /** Ids of finished technologies. */
  done: string[];
}

/** A country's national plans (see plans.ts). */
export interface PlanState {
  /** The plan under way, or null. */
  active: string | null;
  daysDone: number;
  /** Ids of finished plans. */
  done: string[];
}

/** What made up last month's inflation, in points. They add up to the inflation rate. */
export interface InflationCauses {
  carry: number;
  expectations: number;
  printing: number;
  credit: number;
  growth: number;
  shortage: number;
}

/** Everything that changes inside one country: its economy, its home front, its research and its plans. Money is in millions at current prices. */
export interface Economy {
  /** The kind of government in power now. It starts as the country's 1936 government and can change when a government falls or a victor installs a new one. */
  government: Government;
  treasury: number;
  debt: number;
  /** Average interest rate on the debt, per cent a year. */
  debtRate: number;
  /** The money supply. */
  money: number;
  /** Prices compared with January 1936 = 100. */
  priceLevel: number;
  /** Per cent a year. */
  inflation: number;
  /** The inflation people expect, per cent a year. */
  expected: number;
  /** Share of output taken in tax, 0.1 to 0.6. */
  taxRate: number;
  /** Share of any shortfall you try to cover by selling bonds, 0 to 1. The rest is printed. */
  bondShare: number;
  rationing: boolean;
  /** Buy missing steel and oil abroad. */
  imports: boolean;
  /** 0 to 4: see CONSCRIPTION in economy.ts. */
  conscription: number;
  /** 0 to 100. */
  stability: number;
  /** How willing people are to fight and to make sacrifices, 0 to 100. */
  warSupport: number;
  /** The public's mood from recent battles, -15 to 15. Each battle won adds 2, each lost takes 2; it fades by a fifth a month. */
  mood: number;
  /** War weariness, 0 to 20. Rises half a point for each month at war and falls a point for each month of peace. */
  weariness: number;
  /** Months in a row with stability under 20. At three the government falls. */
  crisisMonths: number;
  /** How many governments have fallen since the start of the game. */
  governmentsFallen: number;
  research: ResearchState;
  plan: PlanState;
  /** Men available to recruit, in thousands. */
  manpower: number;
  /** Finished equipment waiting for a division, in division-sets, by type. */
  stock: Record<UnitType, number>;
  lines: Record<UnitType, Line>;
  /** Civilian factories set aside for construction. They only leave consumer goods while there is something to build. */
  constructionFactories: number;
  construction: { kind: FactoryKind; province: number; done: number }[];
  training: { type: UnitType; daysLeft: number }[];
  /** Running totals for the current month. */
  printedThisMonth: number;
  borrowedThisMonth: number;
  balanceThisMonth: number;
  moneyAtMonthStart: number;
  causes: InflationCauses;
  /** The last 120 months, oldest first. */
  history: MonthRecord[];
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
  /** How much research, plans and forts multiplied each side's hitting power (1 = not at all). */
  attackerEdge: number;
  defenderEdge: number;
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
  /** The country the player leads, or null when the AI leads every country. */
  player: string | null;
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
  /** Whose land each province is, by province id. It starts as the 1936 owner and changes only by treaty or annexation. A province controlled by someone else is occupied. */
  owner: string[];
  /** Relations, pacts, world tension, causes for war and decisions waiting for the player (see diplomacy.ts). */
  diplomacy: Diplomacy;
  /** Pairs of countries at war, each written "A|B" with the names in alphabetical order. */
  wars: string[];
  /** Who declared each war, by the same "A|B" key. */
  declaredBy: Record<string, string>;
  /** Countries that have surrendered. */
  capitulated: string[];
  battles: Battle[];
  nextBattleId: number;
  /** The most recent battle reports, oldest first (the last 60 are kept). */
  reports: BattleReport[];
  /** Each country's economy, by country name. */
  economies: Record<string, Economy>;
  /** Factories standing in each province, by province id. Whoever controls the province uses them. */
  factories: { civ: number[]; mil: number[] };
}

export type PactKind = 'alliance' | 'guarantee' | 'nonAggression';

/** An agreement between two countries. A guarantee runs one way: `a` promises to defend `b`. */
export interface Pact {
  kind: PactKind;
  a: string;
  b: string;
  /** The day it was signed. */
  since: number;
}

/** What an ultimatum asks for. */
export type Demand =
  /** The whole country joins the one making the demand. */
  | { kind: 'annex' }
  /** Hand over these provinces. `arms` also hands over border forts and arms works that are too small to show on the map: a third of the army and up to two military factories. */
  | { kind: 'cede'; provinces: number[]; arms?: boolean }
  /** Accept occupation without a fight. */
  | { kind: 'submit' };

export type PeaceTerms = 'white' | 'asHeld';

/** An ultimatum that is waiting for answers. */
export interface Ultimatum {
  id: number;
  by: string;
  on: string;
  demand: Demand;
  /** The day it runs out. Whoever has not answered by then gets the default answer. */
  deadline: number;
  /** What each protector of the target has said: true = it will fight. */
  stances: Record<string, boolean | null>;
  /** The AI making the demand goes to war after a refusal only at these odds or better. */
  warOdds: number;
  /** The entry in the historical agenda this came from, if any. */
  aim?: string;
}

/** A choice waiting for the player. If the deadline passes, `fallback` is taken. */
export interface Decision {
  id: number;
  /** The country that has to decide (the player's). */
  country: string;
  kind: 'ultimatum' | 'backing' | 'honour' | 'proposal' | 'peace' | 'call' | 'event';
  /** The country it comes from, or is about. */
  from: string;
  /** A second country involved, e.g. the one that was attacked. */
  about?: string;
  /** Which ultimatum, pact or terms this is about. */
  ultimatum?: number;
  pact?: PactKind;
  terms?: PeaceTerms;
  aim?: string;
  title: string;
  text: string;
  options: { label: string; effect: string }[];
  deadline: number;
  fallback: number;
}

/** One line of diplomatic news. */
export interface DipEvent {
  id: number;
  day: number;
  kind: 'war' | 'peace' | 'pact' | 'crisis' | 'government' | 'info';
  text: string;
  /** The countries it involves, the one acting first. */
  countries: string[];
}

/** Everything about relations between countries (see diplomacy.ts). */
export interface Diplomacy {
  /** How two countries regard each other, -100 to 100, by "A|B" key (names in alphabetical order). */
  relations: Record<string, number>;
  pacts: Pact[];
  /** World tension, 0 to 100: how close Europe feels to a general war. */
  tension: number;
  /** How many times each country has broken the peace: ultimatums that were given in to, and wars it started. */
  aggression: Record<string, number>;
  /** Causes for war that run out: `by` may declare war on `on` until day `until`. */
  causes: { by: string; on: string; until: number; why: string }[];
  /** Cases for war being built. */
  justifying: { by: string; on: string; daysLeft: number }[];
  /** Truces after a peace, by "A|B" key: the day each one ends. */
  truces: Record<string, number>;
  /** Wars fought for a limited aim, by "A|B" key: the provinces the attacker wants. */
  aims: Record<string, { by: string; provinces: number[] }>;
  /** The day each war started, and wars that were joined to honour a pact, by "A|B" key. */
  warStart: Record<string, number>;
  honour: string[];
  /** Countries that are gone, and who conquered or annexed each. */
  conquered: Record<string, string>;
  /** For each country that is gone: who had promised to defend it. They do not make peace with its conqueror lightly. */
  owed: Record<string, string[]>;
  /** Diplomatic missions under way, each written "from>to". */
  missions: string[];
  /** The historical agenda (agenda.ts): 'done', 'dropped', or the day to look at it again. */
  agenda: Record<string, 'done' | 'dropped' | number>;
  /** Proposals that were turned down, by "from>to:what": the day they may be made again. */
  rebuffs: Record<string, number>;
  ultimatums: Ultimatum[];
  decisions: Decision[];
  nextId: number;
  /** The most recent diplomatic news, oldest first (the last 80 are kept). */
  log: DipEvent[];
}

/** What a player or an AI can tell its units to do. */
export type Order =
  | { type: 'move'; unit: number; to: number }
  | { type: 'halt'; unit: number }
  // Diplomacy (Stage F). `by` is the country giving the order.
  | { type: 'declareWar'; by: string; on: string }
  /** Sign a white peace at once. Used by treaties and tests; players and AI countries use offerPeace. */
  | { type: 'makePeace'; a: string; b: string }
  | { type: 'offerPeace'; by: string; to: string; terms: PeaceTerms }
  /** Propose an alliance or a non-aggression pact. `agreed` is set by the historical agenda when both governments have already settled it. */
  | { type: 'propose'; by: string; to: string; pact: 'alliance' | 'nonAggression'; agreed?: boolean }
  | { type: 'guarantee'; by: string; on: string }
  | { type: 'endPact'; by: string; other: string; pact: PactKind }
  /** Start building a case for war. */
  | { type: 'justify'; by: string; on: string }
  /** Demand what you claim. Without `demand`, the country's standing claim is used. */
  | { type: 'ultimatum'; by: string; on: string; demand?: Demand; warOdds?: number; aim?: string }
  | { type: 'mission'; by: string; to: string; on: boolean }
  /** Ask an ally to join your war against a country. */
  | { type: 'callAlly'; by: string; ally: string; against: string }
  /** Answer a decision that is waiting. */
  | { type: 'decide'; by: string; id: number; option: number }
  /** Decide the future of a country you have conquered. */
  | { type: 'settle'; by: string; target: string; how: 'annex' | 'friendly' }
  /** The AI's historical agenda: carry out an entry, or put it off. */
  | { type: 'aim'; id: string; go: boolean }
  // The economy (Stage D). `country` is the country giving the order.
  | { type: 'setTax'; country: string; rate: number }
  | { type: 'setBondShare'; country: string; share: number }
  | { type: 'setRationing'; country: string; on: boolean }
  | { type: 'setImports'; country: string; on: boolean }
  | { type: 'setConscription'; country: string; level: number }
  /** Put this many military factories on the line for one kind of division. */
  | { type: 'setLine'; country: string; unit: UnitType; factories: number }
  /** Set aside this many civilian factories for construction. */
  | { type: 'setConstruction'; country: string; factories: number }
  | { type: 'build'; country: string; kind: FactoryKind; province: number }
  | { type: 'cancelBuild'; country: string; index: number }
  /** Form a new division from finished equipment and recruits. */
  | { type: 'raise'; country: string; unit: UnitType }
  // Research and national plans (Stage E).
  /** Put a research team (0 or 1) on a technology, or stand it down with null. */
  | { type: 'setResearch'; country: string; slot: number; tech: string | null }
  | { type: 'startPlan'; country: string; plan: string }
  /** Give up the plan under way. The work done on it is lost. */
  | { type: 'cancelPlan'; country: string };
