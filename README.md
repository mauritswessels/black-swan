# Black Swan

An educational strategy game: you are the new Governor of the Kestrian National Bank, the
central bank of a small, wealthy, open economy. Set interest rates, choose your words, survive
the shocks, and learn how real central banks think.

> **Status: Stage 1 of 7.** The economic engine, its tests and the bot playtest are done.
> There are no game screens yet; Stage 2 adds the first playable version.

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
npm test             # run the model's unit tests
npm run playtest     # bots play 500 games each and write BALANCE.md
npm run sim -- 42    # print one game played by the Taylor rule, with seed 42
```

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
tests/            unit tests for the model
scripts/          playtest and one-game printout
MODEL.md          every equation explained in plain words
BALANCE.md        latest bot playtest results
CHANGELOG.md      what each stage added
```

The rule that keeps this clean: nothing in `src/sim/` may import from the user interface.
