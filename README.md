# Black Swan

A grand-strategy game set in Europe from 1936. You lead a real country through the 1930s and
the war that followed, and face what its leaders faced: armies, factories, money, allies and
public support. It is built to teach the history and the economics as you play.

> **Status: Stage F of the war game.** Pick a country, run its economy, its research and its
> home front, command its divisions on the Map table, and now deal with the rest of the world:
> relations, alliances, guarantees, ultimatums, wars and peace. The other countries are led by
> an AI that follows the real history of 1936 to 1941 unless what you do changes the situation.
> The navy and air force come next (Stage G).

## How to play (Stage F)

1. Start a game and choose a country. The clock starts paused.
2. Press **P** for Production. Your military factories are already making equipment. When a
   line has enough for a division, press **Raise**. Set some civilian factories aside and
   build a military factory.
3. Press **E** for the Economy. The budget shows what everything costs each month. The
   numbers in the top bar open the same panels.
4. Press **T** for Research and put each research team on a technology. Press **N** for the
   National plan and start one. A gold dot on the rail means a team is idle or no plan is
   running. Click any technology or plan to read what it does and what really happened.
5. Press **W** for the Home front: stability and war support, and the reasons behind each.
6. Press **D** for Diplomacy: world tension, your treaties, your wars, the causes for war you
   hold, and the latest news of the world. Click any country there, or its name on the map, to
   open it in the sidebar: how it sees you and why, its allies and protectors, and everything
   you can do with it.
7. From a country's sidebar you can send a diplomatic mission, propose an alliance or a
   non-aggression pact, guarantee its independence, build a case for war, send an ultimatum
   (if you have a claim on it), or declare war. Each button says why it is blocked when it is.
8. When another country needs your answer (an ally is attacked, a country you protect gets an
   ultimatum, someone offers peace), the clock stops and the question opens in the sidebar.
   You have seven days; after that the answer shown as the default is given for you.
9. Click one of your counters, for example `FRA 4`, to select those divisions. Shift-click
   adds another counter. Right-click a province to send them there (two-finger click on a
   trackpad). If enemy divisions are in it, they attack. The sidebar shows the **outlook**.
10. To end a war, open the enemy's sidebar and offer peace: back to the old borders, or each
    keeps what it holds. It shows the war score and whether they are likely to accept. A
    country that loses 60% of its own land's victory points surrenders; you then choose to
    occupy it, annex it or set up a friendly government.

Tips for diplomacy: in Story mode you need a cause for war (a claim, a case you have built, a
refused ultimatum, or a promise to keep). A democracy can only build a case against a country
that has already broken the peace, or once world tension reaches 50, and can only hand out
guarantees once tension reaches 25. That is why Britain and France were slow in the 1930s. A
guarantee from a country that looks ready to fight makes the target refuse an ultimatum; a
guarantee nobody believes does not. Every aggressive move raises world tension, and tension
makes every other country arm faster.

Tips for the war: an attack needs about 2 to 1. Attack from several provinces at once, bring
artillery against dug-in defenders, and do not stack more divisions in a province than it can
feed (see the Supply map mode). Allies may march through each other's land and use each
other's depots.

Tips for the money: there is no free way to pay. Taxes above 25% cost stability. Bonds are
painless until the debt and its interest pile up. Printing is painless for about three months,
then prices take off, and once people expect inflation it is slow to stop. A mix, with
rationing, usually hurts least. The sidebar tells you why each number is what it is.

Tips for the home front: war support decides how wide a conscription law you can bring in and
how much tax people will bear in wartime. A country that is attacked rallies; one that starts a
war does not. Research what is due now rather than what is years ahead of its time, and
remember that a national plan's real price is the other plans you are not running.

The earlier central bank game is kept, complete and playable, on the branch
[`central-bank-v0.2`](../../tree/central-bank-v0.2).

## Running it in the browser (fastest, for development)

You need [Node.js](https://nodejs.org) 20 or newer. Then, in this folder:

```bash
npm install          # once
npm run dev          # opens the game in your browser
npm test             # run the unit tests
npm run balance      # run the bot playtests (wars and finance) and write docs/balance-stage-d.md
npm run build:map    # rebuild the 1936 map from Natural Earth data (rarely needed)
```

The rules and every number behind them are in [MODEL.md](MODEL.md). The latest balance report
is [docs/balance-stage-d.md](docs/balance-stage-d.md).

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
| Space | Pause or resume |
| 1 to 5 | Game speed |
| . | Advance one day while paused |
| Click | Select your divisions, or open the details of anything else |
| Shift-click | Add another of your counters to the selection |
| Right-click | Send the selected divisions there (attack if the enemy is there) |
| G | Move or attack: then click the destination or type its name |
| H | Halt the selected divisions |
| Tab | Step through your armies (while the map has the focus) |
| Arrows, + and - | Move and zoom the map (or drag, scroll and pinch) |
| R | Battle reports |
| P | Production: factories, new divisions, manpower |
| E | Economy: budget, taxes, debt and inflation |
| T | Research: technologies and research teams |
| N | National plan |
| W | Home front: stability and war support |
| D | Diplomacy: tension, treaties, wars and world news |
| X | Codex |
| S | Save and load (3 slots plus an autosave) |
| M | Sound on or off |
| ? | All shortcuts |
| Esc | Close a panel or the sidebar |
| N / F / C | Title screen: Story, Free-for-all, Continue |

## How the code is organised

```text
src/sim/          the game engine: pure TypeScript, no UI, fully testable
  world.ts        newWorld() and step(world, orders): one day at a time
  combat.ts       battles: daily rounds, retreat, surrender and battle reports
  supply.ts       depots, links home and how many divisions a province can feed
  war.ts          who is at war with whom
  diplomacy.ts    relations, pacts, world tension, causes for war, ultimatums, peace,
                  surrender and what happens to a conquered country
  agenda.ts       what each AI country wants and when (the real timetable of 1936 to 1941),
                  and the conditions that let the player change it
  economy.ts      factories, production lines, manpower, the budget, debt and inflation,
                  and the home front: stability and war support
  research.ts     the 16 technologies, research teams and how fast they work
  plans.ts        the 24 national plans
  mods.ts         adds up what research and finished plans change
  aiEconomy.ts    a simple finance minister for AI countries (it also picks research and plans)
  testeconomy.ts  finance playtests, used by the balance report
  ai.ts           a simple army commander for AI countries
  game.ts         advance(): one day with a player, the AI leading every other country
  intel.ts        what a country can see (fog of war)
  testwar.ts      AI against AI test wars, used by the balance report
  map.ts          the provinces, distances, marching speeds and route finding
  countries.ts    the 31 countries of 1936, their starting armies and their industry
  types.ts        the shapes of all engine data
  rng.ts          seeded random numbers (same seed = same game)
src/content/map/  the 1936 map data (built by scripts/build-map.mjs)
src/content/      the codex
src/save/         save slots (whole game state as JSON)
src/ui/           React screens, widgets, sound and the War Room theme
  map/            the Map table: shapes, colours and the map itself
  screens/        title, choose your country, the Map table, sidebar, overlays
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
- Because Danzig and the Sudetenland are not provinces of their own, Germany's demand on
  Poland is Poznań, and Munich costs Czechoslovakia its forts, a fifth of its army and its
  arms works rather than land.
- Terrain is a first pass and army sizes are rough; both get tuned in later stages.

## Plan

See CHANGELOG.md for what is done. Next is Stage G (navy and air), then H (Story mode) and
I (polish).

## History and symbols

The game uses real countries, borders and leaders as historical facts. It shows no Nazi or
fascist symbols, never makes atrocities a game mechanic, and describes them honestly in the
codex and history cards.
