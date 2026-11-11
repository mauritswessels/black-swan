# Black Swan

An educational strategy game: you are the new Governor of the Kestrian National Bank, the
central bank of a small, wealthy, open economy. Set interest rates, choose your words, survive
the shocks, and learn how real central banks think.

> **Status: Stage 2 of 7.** The game is playable: a full five-year term in the War Room,
> with the Data Room, codex, saves and an end-of-term report.

## The world

| | |
| --- | --- |
| Country | Kestria (capital: Valden) |
| Central bank | Kestrian National Bank (KNB) |
| Currency | Kestrian thaler (KST) |
| Big neighbour | The Continental Union (CU) |
| Neighbour's currency | The aurel (AUR) |
| Inflation target | 0 to 2% (default) or 2% exactly, in settings |

## Running it

You need [Node.js](https://nodejs.org) 20 or newer. Then, in this folder:

```bash
npm install          # once
npm run dev          # play: opens the game in your browser
npm test             # run the model's unit tests
npm run playtest     # bots play 500 games each and write BALANCE.md
npm run sim -- 42    # print one game played by the Taylor rule, with seed 42
```

## How to play

Each meeting is one quarter. Read the situation on the left and the outlook in the middle,
click committee members to hear their advice, then set the rate, pick a statement and seal
the decision. The front page shows how markets and politicians reacted. After 20 quarters
(or if you are fired first) you get a report card that compares you with the Taylor rule.

| Key | Does |
| --- | --- |
| ↑ / ↓ | Raise or lower the rate by 0.25 |
| 1 to 4 | Choose your statement |
| F | Cycle currency purchases |
| Enter | Seal the decision / next quarter |
| W / D | War Room / Data Room |
| X | Codex (glossary) |
| S | Save and load (3 slots plus an autosave) |
| M | Sound on or off |
| ? | All shortcuts |

## How the code is organised

```text
src/sim/          the economy: pure TypeScript, no UI, fully testable
  model.ts        step(state, decision) -> next state: every equation lives here
  params.ts       every number in the model, with a comment
  events.ts       shocks and events (energy spike, recession next door, ...)
  data.ts         noisy first estimates and revisions
  rules.ts        the Taylor rule
  scoring.ts      loss, points and grades
  bots.ts         automatic players used for testing
  rng.ts          seeded random numbers (same seed = same game)
  forecast.ts     the staff forecast fan chart (many simulated futures)
  committee.ts    the five committee members and their advice
  explain.ts      "why did that happen?" chains
  news.ts         headlines after each decision
  report.ts       the end-of-term report card
src/save/         save slots in the browser's local storage
src/content/      the codex (glossary)
src/ui/           React screens, charts, sound and styles
tests/            unit tests for the model
scripts/          playtest and one-game printout
MODEL.md          every equation explained in plain words
BALANCE.md        latest bot playtest results
CHANGELOG.md      what each stage added
```

The rule that keeps this clean: nothing in `src/sim/` may import from the user interface.
