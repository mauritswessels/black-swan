/** The shapes of data that flow through the simulation. Plain objects only, so they save as JSON. */

export type TargetMode = 'range' | 'point';

/**
 * Forward guidance: what the Governor says about future policy.
 * - dataDependent: "We will act as the data require." Safe, but moves markets little.
 * - extended: "Rates will stay at this level for an extended period." Powerful, but a promise.
 * - readyToAct: "We stand ready to act against inflation." A hawkish signal.
 * - fxReady: "We are prepared to intervene in the currency market." Calms the thaler.
 */
export type Guidance = 'dataDependent' | 'extended' | 'readyToAct' | 'fxReady';

export interface Decision {
  /** New policy rate in percent. Must be a multiple of 0.25. */
  rate: number;
  guidance: Guidance;
  /** Foreign currency bought this quarter, percent of GDP (negative = selling reserves). */
  fxPurchases: number;
}

export interface Settings {
  seed: number;
  /** 'range' = 0 to 2% (Swiss style, the default); 'point' = 2% exactly. */
  targetMode: TargetMode;
  /** Length of a term in quarters (20 = 5 years). */
  quarters: number;
}

/** What one quarter's events push into the economy. Every field is optional. */
export interface Shocks {
  demand: number; // direct push to the output gap
  supply: number; // direct push to core inflation (costs)
  wage: number; // pay deals pushing core inflation
  energy: number; // jump in energy prices, percent
  foreign: number; // push to the Continental Union's output gap
  foreignRate: number; // push to the CU's interest rate
  haven: number; // safe-haven money flowing into the thaler, percent
  housing: number; // push to house-price growth
  fiscal: number; // extra government spending, percent of GDP
  productivity: number; // extra potential growth, percent per year
  dataNoise: number; // multiplies first-estimate errors (1 = normal)
}

export interface ActiveEvent {
  id: string;
  startedAt: number;
}

/** Measurement errors drawn for one quarter's first estimates. */
export interface DataErrors {
  gdp: number;
  cpi: number;
  core: number;
  unemployment: number;
  outputGap: number;
}

/**
 * What pushed the output gap and inflation this quarter, in points. Used to explain
 * "why did that happen?". Each number is one term of equation 2 or 3 in MODEL.md.
 */
export interface Drivers {
  gapMomentum: number; // carry-over from last quarter
  gapRates: number; // interest rates (real, with lags)
  gapThaler: number; // strong or weak currency
  gapForeign: number; // the Continental Union's economy
  gapEnergy: number; // energy prices
  gapCredit: number; // credit boom or squeeze
  gapShocks: number; // events: confidence, fiscal, pandemic, bank trouble
  inflMomentum: number; // last quarter's core inflation (inertia)
  inflExpectations: number; // expected inflation
  inflDemand: number; // output gap two quarters ago
  inflThaler: number; // import prices via the exchange rate
  inflShocks: number; // supply shocks and wage deals
  inflEnergy: number; // energy prices (headline only)
}

/** One quarter of the TRUE economy (the player never sees this directly). */
export interface Quarter {
  t: number;
  outputGap: number;
  gdpGrowth: number; // year on year
  core: number;
  headline: number;
  unemployment: number;
  expectedInflation: number;
  /** The inflation rate people believe the bank is really aiming for. Drifts if inflation stays away from target. */
  perceivedTarget: number;
  policyRate: number;
  realRate: number;
  thaler: number; // strength, percent above long-run value
  kstPerAurel: number; // the exchange rate as quoted
  energy: number; // energy price level, percent above normal
  foreignGap: number;
  foreignRate: number;
  yield2: number;
  yield5: number;
  yield10: number;
  mortgageRate: number;
  houseGrowth: number;
  creditGrowth: number;
  risk: number;
  fxReserves: number;
  paperGain: number; // this quarter's valuation gain (+) or loss (-), percent of GDP
  credibility: number;
  approval: number;
  guidance: Guidance;
  fxPurchases: number;
  loss: number; // this quarter's loss score (lower is better)
  errors: DataErrors;
  events: string[]; // events that started this quarter
  /** All events in effect this quarter (including ones that started earlier). */
  activeEvents: string[];
  /** How far the rate decision differed from what markets expected (+ = more hawkish). */
  surprise: number;
  drivers: Drivers;
}

export type GameOverReason = 'fired' | 'independenceRemoved' | 'hyperinflation' | 'financialCrisis';

export interface EconomyState {
  settings: Settings;
  /** Index of the next quarter to be played (0 = first quarter of the term). */
  t: number;
  rng: number;
  /** History of the true economy, oldest first. Includes 8 quarters of history before the term. */
  history: Quarter[];
  activeEvents: ActiveEvent[];
  /** Quarter in which the last event started (for pacing). */
  lastEventAt: number;
  /** Guidance promise being tracked: rate when "extended" was promised, and when. */
  promise: { rate: number; madeAt: number } | null;
  /** What markets expect the policy rate to be this quarter (for surprises). */
  marketExpectedRate: number;
  lowApprovalQuarters: number;
  highInflationQuarters: number;
  gameOver: GameOverReason | null;
}

/** First estimates and revisions: what the player and the bots actually get to see. */
export interface Release {
  t: number;
  /** 0 = first estimate, 1 = revised once, 2 = final. */
  vintage: number;
  headline: number;
  core: number;
  gdpGrowth: number;
  unemployment: number;
  outputGap: number;
}
