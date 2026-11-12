# Changelog

## War game, Stage B: land battles, supply and battle reports (2026-11-12)

- **Battles.** Ordering a division into a province held by enemy divisions starts a battle,
  fought one round a day. Terrain, digging in, supply and a little luck decide the damage.
  Infantry defends better than it attacks, armour breaks through on open ground and artillery
  wears down dug-in defenders. Only 8 divisions a side fight at once; attacking from more
  directions lets more join in.
- **Retreat and surrender.** A division at zero organisation falls back. If it is surrounded,
  it surrenders. Provinces change hands when the attackers walk in.
- **Supply.** Each province can feed a limited number of divisions and needs a link, through
  your own land, back to a depot. Short supply caps organisation; a cut-off division wastes
  away.
- **Battle reports.** Every finished battle records who won, the losses and up to three
  causes, biggest first, such as "attacking into mountains" or "the attackers had the numbers".
- **War and peace** exist as plain orders (the diplomacy around them is Stage F). Divisions can
  no longer cross neutral countries. A country surrenders when enemies hold 60% of its victory
  points.
- **A simple AI commander** and `npm run balance`, which runs 200 AI against AI wars and writes
  [docs/balance-stage-b.md](docs/balance-stage-b.md).
- **Watch a test war** in the app: pick a war, press Start and follow the front, the battle
  markers and the reports on the plain map.
- Starting armies now stand mostly in the homeland, with small garrisons overseas.
- New file [MODEL.md](MODEL.md) with every rule and number. Six new codex terms.
- 46 unit tests.
- Saves from Stage A no longer load (the game state has new parts).

Not in this stage: giving orders yourself (Stage C), air power, rivers, manpower and peace terms.

## One-command update (2026-11-12)

- `npm run update` pulls the newest code from GitHub, installs new libraries and opens the Mac
  app. It stops with a plain message if you have unsaved edits or no connection.

## War game, Stage A: the 1936 map, countries and marching armies (2026-11-12)

- The map of Europe, North Africa and the Near East on 1 January 1936: 183 provinces in
  31 countries, built from public-domain Natural Earth data by `npm run build:map`. It shows
  the borders of the time: Germany with Silesia, Pomerania and East Prussia, Poland reaching
  east to Wilno and Lwów, an independent Austria and Czechoslovakia, French North Africa and
  Italian Libya. Known gaps are listed in the README.
- Each province has a historical name, terrain, neighbours, victory points and, where it has
  one, a main city.
- The engine: `step(world, orders)` moves the world on one day. Divisions follow move and halt
  orders along the quickest route, at speeds set by their type and the terrain.
- Starting armies for every country (rough figures until Stage B).
- The app shows a plain preview of the map. Point at a province to see its name, owner,
  terrain and divisions.
- 25 unit tests, including a French division marching from Paris to Berlin.
- The Mac app (`npm run app`) was confirmed working on a MacBook after Stage 0.

Not in this stage: battles, supply, control of provinces changing hands, sea zones.

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
