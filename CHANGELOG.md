# Changelog

## Stage 1: the economy engine (2026-11-11)

- Economic model of Kestria: a small open economy New Keynesian model with demand (IS curve),
  inflation (Phillips curve), anchored and unanchored expectations, Okun's law, the exchange rate,
  a bond yield curve, the lower bound, housing and credit, financial risk, the bank's FX reserves,
  credibility and approval. All explained in MODEL.md.
- Lags: rate changes hit spending mostly after 2 to 6 quarters and core inflation after 4 to 8;
  the exchange rate reacts at once.
- Noisy data: first estimates with errors, revised a quarter later and final after two.
- 13 events with clear causes and effects, paced so there are calm spells between them.
- Seeded random numbers: the same seed and decisions always replay the same game.
- Two target settings: 0 to 2% range (default) and 2% point.
- Scoring: a loss each quarter turned into points, letter grades, and four game-over states
  (fired, independence removed, hyperinflation, financial crisis).
- 15 unit tests, including: a hike lowers output and later inflation, supply shocks raise
  inflation while lowering output, low credibility makes disinflation costlier, and there is
  no long-run trade-off between inflation and unemployment.
- Bot playtest with six strategies; results in BALANCE.md.
- The neighbouring currency is now called the aurel (it was the cor in the mock-ups).
