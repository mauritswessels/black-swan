# Black Swan

A grand-strategy game set in Europe from 1936. You lead a real country through the 1930s and
the war that followed, and face what its leaders faced: armies, factories, money, allies and
public support. It is built to teach the history and the economics as you play.

> **Status: Stage B of the war game.** Divisions now fight battles, need supply, retreat,
> get surrounded and surrender, and every battle ends with a report that says why it went the
> way it did. You cannot give orders yourself yet (the Map table screen is Stage C), but you
> can watch two AI countries fight a test war on the plain map.

The earlier central bank game is kept, complete and playable, on the branch
[`central-bank-v0.2`](../../tree/central-bank-v0.2).

## Running it in the browser (fastest, for development)

You need [Node.js](https://nodejs.org) 20 or newer. Then, in this folder:

```bash
npm install          # once
npm run dev          # opens the game in your browser
npm test             # run the unit tests
npm run balance      # run 200 AI against AI wars and write docs/balance-stage-b.md
npm run build:map    # rebuild the 1936 map from Natural Earth data (rarely needed)
```

The rules and every number behind them are in [MODEL.md](MODEL.md). The latest balance report
is [docs/balance-stage-b.md](docs/balance-stage-b.md).

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

### Getting the newest version

After a pull request is merged on GitHub, one command brings your Mac up to date and opens the
app:

```bash
npm run update       # pull the newest code, install new libraries, open the app
```

Add `-- --browser` to open it in the browser instead, or `-- --no-start` to only update. If you
have edited files yourself, it stops and tells you how to keep or discard them first.

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
  world.ts        newWorld() and step(world, orders): one day at a time
  combat.ts       battles: daily rounds, retreat, surrender and battle reports
  supply.ts       depots, links home and how many divisions a province can feed
  war.ts          who is at war with whom
  ai.ts           a simple army commander for AI countries
  testwar.ts      AI against AI test wars, used by the balance report and the app
  map.ts          the provinces, distances, marching speeds and route finding
  countries.ts    the 31 countries of 1936 and their starting armies
  types.ts        the shapes of all engine data
  rng.ts          seeded random numbers (same seed = same game)
src/content/map/  the 1936 map data (built by scripts/build-map.mjs)
src/content/      the codex
src/save/         save slots (whole game state as JSON)
src/ui/           React screens, charts, widgets, sound and the War Room theme
src-tauri/        the Mac app wrapper (Tauri); you rarely need to touch this
scripts/          build-map.mjs turns modern map data into 1936 provinces;
                  update.mjs is `npm run update`
tests/            unit tests
CHANGELOG.md      what each stage added
```

The rule that keeps this clean: nothing in `src/sim/` may import from the user interface.

## The map and its known gaps

The map is built from [Natural Earth](https://www.naturalearthdata.com) data, which is in the
public domain. That data shows today's regions, so `scripts/build-map.mjs` hands each region to
the country that held it in 1936 and merges regions into provinces. Borders that ran through
the middle of a modern region are therefore approximate:

- The Free City of Danzig is shown as part of Poland.
- The Polish-Soviet and Polish-German borders follow modern regional lines, so they are a few
  dozen kilometres off in places.
- Finnish Karelia (around Viipuri) is shown as Soviet.
- The Italian territories around Trieste, Zara and the Dodecanese are shown as Yugoslav or
  Greek, except Istria.
- Spanish Morocco is shown as part of French Morocco.
- Terrain is a first pass and army sizes are rough; both get tuned in later stages.

## Plan

See CHANGELOG.md for what is done. Next is Stage B (land combat and supply), then C (the map
table screen), D (production and war finance), E (research and politics), F (diplomacy and AI),
G (navy and air), H (Story mode) and I (polish).

## History and symbols

The game uses real countries, borders and leaders as historical facts. It shows no Nazi or
fascist symbols, never makes atrocities a game mechanic, and describes them honestly in the
codex and history cards.
