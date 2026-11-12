# Changelog

## War game, Stage 0: clean-up and Mac app shell (2026-11-12)

Black Swan is now a grand-strategy game set in Europe from 1936. The central bank game is kept
on the branch `central-bank-v0.2`.

- Removed the central bank engine, its screens, tests, bots and documents (about 2,900 lines).
- Kept and tidied what the war game reuses: seeded random numbers, charts and widgets, sound,
  the War Room theme, the title screen, the codex, save slots and keyboard help.
- New world outline in `src/sim/world.ts` (mode, seed, date) and saves that store the whole
  game state.
- Title screen with Story and Free-for-all; a placeholder game screen until the map exists.
- Codex restarted with 18 terms for the war game (military, political and economic).
- Added Tauri: `npm run app` opens the game as a Mac app, `npm run app:build` makes the .app.
- 9 unit tests.

Not yet checked: the Mac app itself. It can only be built on a Mac, so the first
`npm run app` on a MacBook is the real test.

## Stage 2: first playable version (2026-11-11)

- Run `npm run dev` to play. A title screen, an appointment letter where you pick the target
  and the seed, then 20 quarterly meetings and an end-of-term report.
- War Room screen: the situation with first-estimate tags, an inflation fan chart with the staff
  forecast (50% and 90% ranges), the five-member committee around the table with advice in
  their own voices, credibility gauge, approval, market expectations and a news feed.
- Decision panel: the rate dial, four statements (forward guidance) and currency purchases.
- After each decision: a newspaper front page with the market reaction.
- Briefing: "why did that happen?" chains that trace each big move back to its cause,
  including your own rate changes from quarters ago.
- Data Room: eight charts and a table of releases and revisions.
- End-of-term report: score, grade, four sub-grades, a timeline, and how the Taylor rule
  would have scored on exactly the same luck.
- Codex with 41 terms (the full 80+ comes in a later stage), shown as tooltips on underlined words.
- Three save slots plus an autosave; keyboard shortcuts for everything; sound made in code
  with a mute key; reduced-motion support.
- New event: the finance minister demands a rate cut (14 events in total).
- Animation uses CSS rather than the Motion library: it was enough, and keeps the game smaller.

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
