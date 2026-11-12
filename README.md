# Black Swan

A grand-strategy game set in Europe from 1936. You lead a real country through the 1930s and
the war that followed, and face what its leaders faced: armies, factories, money, allies and
public support. It is built to teach the history and the economics as you play.

> **Status: Stage 0 of the war game.** The project has pivoted from the earlier central bank
> game. This stage is the cleaned-up shell and the Mac app set-up: title screen, save slots,
> codex and sound work; the map and the war arrive in the next stages.

The earlier central bank game is kept, complete and playable, on the branch
[`central-bank-v0.2`](../../tree/central-bank-v0.2).

## Running it in the browser (fastest, for development)

You need [Node.js](https://nodejs.org) 20 or newer. Then, in this folder:

```bash
npm install          # once
npm run dev          # opens the game in your browser
npm test             # run the unit tests
```

## Running it as a Mac app

The app is made with [Tauri](https://tauri.app), which wraps the game in a native Mac window.

One-time set-up:

1. Xcode command line tools: `xcode-select --install` (skip if Xcode is already installed).
2. Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`, then open a new Terminal window.

Then:

```bash
npm install
npm run app          # opens Black Swan in its own window (first run takes a few minutes)
npm run app:build    # builds Black Swan.app and a .dmg
```

The built app is at `src-tauri/target/release/bundle/macos/Black Swan.app`. Drag it to
Applications. The first time, right-click it and choose Open, because it is not signed with an
Apple Developer account.

## Keys

| Key | Does |
| --- | --- |
| N / F | New Story game / new Free-for-all game (title screen) |
| C | Continue from the autosave (title screen) |
| X | Codex |
| S | Save and load (3 slots plus an autosave) |
| M | Sound on or off |
| ? | All shortcuts |

## How the code is organised

```text
src/sim/          the game engine: pure TypeScript, no UI, fully testable
  world.ts        the world state (Stage 0: date, mode and seed only)
  rng.ts          seeded random numbers (same seed = same game)
src/save/         save slots (whole game state as JSON)
src/content/      the codex
src/ui/           React screens, charts, widgets, sound and the War Room theme
src-tauri/        the Mac app wrapper (Tauri); you rarely need to touch this
tests/            unit tests
CHANGELOG.md      what each stage added
```

The rule that keeps this clean: nothing in `src/sim/` may import from the user interface.

## Plan

Design document and stages: see CHANGELOG.md for what is done. Next is Stage A (Europe 1936
map data, countries and the daily clock), then B (land combat and supply), C (the map table
screen), D (production and war finance), E (research and politics), F (diplomacy and AI),
G (navy and air), H (Story mode) and I (polish).

## History and symbols

The game uses real countries, borders and leaders as historical facts. It shows no Nazi or
fascist symbols, never makes atrocities a game mechanic, and describes them honestly in the
codex and history cards.
