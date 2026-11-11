/**
 * Every number that shapes the economy lives here, with a plain-English comment.
 * MODEL.md explains each equation that uses them.
 *
 * Units: rates and growth are percent per year, gaps are percent of normal output,
 * and the balance sheet is percent of GDP. One model step = one quarter.
 */

export const PARAMS = {
  // ---- Long-run anchors ----------------------------------------------------
  /** Neutral real interest rate: the real rate that neither speeds up nor slows down the economy. */
  rStar: 0.5,
  /** NAIRU: the unemployment rate the economy settles at in the long run. */
  uStar: 3.0,
  /** Normal (potential) real GDP growth per year. */
  potentialGrowth: 1.5,
  /** Effective lower bound: rates can't usefully go lower than this. */
  lowerBound: -0.75,
  /** Highest policy rate the game allows. */
  upperBound: 12,

  // ---- Demand (IS curve) ---------------------------------------------------
  /** How much of last quarter's output gap carries over (momentum in spending). */
  demandPersistence: 0.75,
  /** How strongly the effective real rate pushes the output gap down. */
  demandRateEffect: 0.2,
  /** Share of the effective real rate that comes from past short rates (the rest is the 5-year yield). */
  shortRateWeight: 0.6,
  /** Which past quarters of the short real rate matter, and how much (2 to 6 quarters ago). */
  rateLagWeights: [0.15, 0.25, 0.25, 0.2, 0.15] as const, // lags 2,3,4,5,6
  /** How strongly a strong thaler hurts exports and so output. */
  demandFxEffect: 0.05,
  /** How much a boom or bust in the Continental Union spills over to Kestria. */
  foreignSpillover: 0.25,
  /** How much extra government spending (percent of GDP) raises the output gap. */
  fiscalMultiplier: 0.3,
  /** How much fast credit growth adds to spending. */
  creditEffect: 0.045,
  /** Credit growth regarded as normal. */
  normalCreditGrowth: 4,
  /** How much a 10% rise in energy prices drags on output (households have less to spend); a fall helps. */
  energyDrag: 0.03,

  // ---- Inflation (Phillips curve) -------------------------------------------
  /** Weight on last quarter's core inflation (inertia). The weight on expectations is 1 minus this. */
  inflationInertia: 0.6,
  /** How much the output gap from two quarters ago raises core inflation. */
  phillipsSlope: 0.25,
  /** Exchange-rate pass-through: a 1% stronger thaler over a year lowers core inflation this much. */
  fxPassThrough: 0.06,
  /** Energy's weight in the consumer price basket. */
  energyWeight: 0.08,

  // ---- Expectations and credibility ------------------------------------------
  /** Anchoring a = anchorBase + anchorRange * (C/100)^2. */
  anchorBase: 0.2,
  anchorRange: 0.7,
  /** Credibility drifts slowly towards this level. */
  /** How fast the target people believe in drifts towards actual inflation (scaled up when credibility is low). */
  perceivedTargetDrift: 0.06,
  credibilityHome: 60,
  credibilityDrift: 0.05,
  credibilityGainInBand: 1.5,
  credibilityLossPerPoint: 2.5,
  credibilityBrokenGuidance: 8,
  /** Used from Stage 2, when politicians can pressure you. */
  credibilityCaved: 5,

  // ---- Unemployment (Okun's law) --------------------------------------------
  okunCoefficient: 0.4,
  unemploymentSpeed: 0.5,

  // ---- Exchange rate ----------------------------------------------------------
  /** How much of last quarter's thaler strength carries over (the rest fades). */
  fxPersistence: 0.85,
  /** A 1-point rise in our rate relative to the CU's strengthens the thaler by this many percent. */
  fxRateEffect: 1.5,
  /** Extra move from a surprise (markets react to news, not to what they expected). */
  fxSurpriseEffect: 1.0,
  /** Buying foreign currency worth 1% of GDP weakens the thaler by this many percent. */
  fxInterventionEffect: 0.8,

  // ---- Bond market ------------------------------------------------------------
  /** How fast markets expect the policy rate to drift back to neutral, per quarter. */
  rateReversion: 0.85,
  /** Term premium = termPremiumBase * sqrt(years) + uncertainty - QE effect. */
  termPremiumBase: 0.15,
  /** Used from Stage 4, when QE unlocks. */
  qeTermPremiumEffect: 0.1,

  // ---- Housing and financial stability ---------------------------------------
  housePersistence: 0.7,
  /** Spread of the 5-year mortgage rate over the 5-year government yield. */
  mortgageSpread: 1.0,
  houseGapEffect: 1.5,
  houseRateEffect: 2.0,
  creditPersistence: 0.7,
  riskPersistence: 0.9,

  // ---- Balance sheet ------------------------------------------------------------
  /** Foreign-currency reserves at the start, percent of GDP (a Swiss-style central bank holds a lot). */
  startingFxReserves: 80,
  /** Used from Stage 4, when bond purchases unlock. */
  bondDuration: 5,

  // ---- Politics -------------------------------------------------------------------
  approvalSpeed: 0.3,

  // ---- Data noise (standard deviation of first-estimate errors) ----------------------
  dataErrors: { gdp: 0.3, cpi: 0.1, core: 0.08, unemployment: 0.05, outputGap: 0.4 },
  /** Share of a first-estimate error still left after the first revision. */
  revisionLeft: 0.3,

  // ---- Random noise in the true economy each quarter ------------------------------------
  noise: { output: 0.25, core: 0.1, headline: 0.05, fx: 1.0, energy: 2, foreign: 0.25, house: 0.8 },
} as const;

export type Params = typeof PARAMS;
