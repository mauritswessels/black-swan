# Black Swan

A grand-strategy game set in Europe from 1936. You lead a real country through the 1930s and
the war that followed, and face what its leaders faced: armies, factories, money, allies and
public support. It is built to teach the history and the economics as you play.

> **Version 1.2.** The finished Mac app, now with a front line that moves inside each province. Lead one of six great powers in Story mode, or any
> of 31 countries in Free-for-all, from 1936 or September 1939: armies, a navy and air force,
> factories and war finance, research, diplomacy and 53 history cards. The app updates itself
> from GitHub, keeps its saves as files, and has a Settings screen. New to the game? Press
> **Learn to play** on the title screen.
>
> New in 1.2: the front creeps. When you attack a province, a band in your colour grows into
> it day by day, slides back on a bad day, and the province is yours only when the band
> reaches the far side. Great rivers stall an attack until a bridgehead is won, the autumn
> rains and the spring thaw turn the east to mud, trapped armies are ringed on the map with a
> count, a war replay plays the whole war back in a minute (key V), and the guns rumble when
> battles are near.
>
> New in 1.1: a war of attrition, soldiers paid by what a worker earns, and wartime finance
> as it really worked (forced saving, an interest rate capped below inflation, compulsory
> loans in the Soviet Union).

## Installing the Mac app

1. Open the [latest release](../../releases/latest) on GitHub and download `Black.Swan_..._universal.dmg`.
2. Open the .dmg and drag **Black Swan** into Applications.
3. The first time, macOS says it cannot check the app, because it is not signed with a paid
   Apple Developer account. Open **System Settings → Privacy & Security**, scroll down and press
   **Open Anyway** next to Black Swan. (Or, in Terminal:
   `xattr -dr com.apple.quarantine "/Applications/Black Swan.app"`.) You only do this once:
   updates install without asking again.

From then on the app looks for a new version each time it opens. When there is one, the title
screen shows what is new; press **Update and restart**. Your game is saved first. You can also
use **Black Swan → Check for Updates…** in the menu bar, or Settings.

Your saves are files in `~/Library/Application Support/app.blackswan.game/saves` (Settings →
Saves → Show in Finder). Copy them to another Mac to carry a game over.

## How to play

**Start with Learn to play** (key **L** on the title screen). The ten lessons take about 41
minutes in all, and you can take them in any order. Everything below is what they teach.

1. Choose **Story** or **Free-for-all**, then a start (1 January 1936, or 1 September 1939)
   and a country. The clock starts paused. In Story mode press **C** for the Chronicle: your
   chapter, its objectives and the history cards. A card stops the clock when it arrives;
   press Space to carry on. Press **O** at any time for the report that sets your game beside
   the real history.
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
   Click the crossed swords to follow a battle: the **front line** bar (and the band on the
   map) shows how far your divisions have got. The province changes hands when it reaches
   the far side.
10. **Armies.** Moving every division by hand gets slow in a big war. Hold Shift and drag a
    box around divisions, then press **A**: they become an army with a flag on the map and a
    number key (1 to 9). Drag the flag onto an enemy province to **push** toward it, onto a
    border to **hold** it, onto your own land behind the front to wait in **reserve**; or use
    the buttons in its sidebar, which also has **fall back**, the pace of a push (careful,
    steady, all-out), a **commander** (real generals, each with one trait) and the option to
    send new divisions to it. Two armies pushing at one place from different sides are a
    **pincer**: the map counts the enemy divisions it would cut off.
11. To end a war, open the enemy's sidebar and offer peace: back to the old borders, or each
    keeps what it holds. It shows the war score and whether they are likely to accept. A
    country that loses 60% of its own land's victory points surrenders (40% once its capital
    has fallen); you then choose to
    occupy it, annex it or set up a friendly government.

12. Press **F** for the Navy and air force, and switch the map to **Air and sea** (bottom
    left). You do not steer ships or aircraft: give each fleet a sea zone and a mission
    (patrol, escort convoys, raid convoys, stay in port), and each air wing a base and a
    mission (air superiority, ground support, strategic bombing, naval strike). Click a fleet
    or an air base on the map to open it; right-click a sea zone or a province to send it
    there.
13. To cross the sea, select divisions standing on a coast, press **B** (Go by sea) and click
    another coast. A friendly shore takes a few days. An enemy shore is a landing: it takes
    two weeks to prepare, you must control the sea zone off the beach, and the troops fight at
    60% as they come ashore.
14. Aircraft and ships are built on production lines like everything else (Production, **P**).
    Your lines for them start empty, so move some factories there before a war.

Tips for the sea and the air: whoever has twice the other side's naval strength in a zone
controls it. Control lets you land troops there and cuts the enemy's trade through it by 90%.
If you live by imports, as Britain does, keep a fleet on Escort along your trade route or
submarines will starve your factories and shops; the news line warns you. Fighters reach 400
km and bombers 800 km from their base, so move your wings forward as the front moves. The side
with 1.5 times the other's air strength over a battle hits 15% harder.

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
other's depots. Avoid attacking across the great rivers drawn in blue unless you must, and
plan around the seasons: mud in the east from mid-October to late November and from
mid-March to the end of April, snow from December to February, heat in the desert in
summer. When the map rings a pocket in red, those divisions are cut off: break out fast.

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
npm run balance      # run the bot playtests (wars, finance, history to 1945) and write docs/balance-stage-j.md
npm run typecheck    # check the types
npm run build:map    # rebuild the 1936 map from Natural Earth data (rarely needed)
```

The rules and every number behind them are in [MODEL.md](MODEL.md). The latest balance report
is [docs/balance-stage-j.md](docs/balance-stage-j.md).

## Running it as a Mac app from the code

To play, install the app (above). To work on the game, run it from the code. The app is made
with [Tauri](https://tauri.app), which wraps the game in a native Mac window.

One-time set-up:

1. Xcode command line tools: `xcode-select --install` (skip if Xcode is already installed).
2. Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`, then open a new Terminal window.

Then:

```bash
npm install
npm run app          # opens Black Swan in its own window (first run takes a few minutes)
npm run app:build    # builds Black Swan.app and a .dmg on your Mac
```

The copy started with `npm run app` uses the same save files as the installed app. It does not
update itself; `npm run update` (below) brings it up to date.

### Getting the newest version

After a pull request is merged on GitHub, one command brings your Mac up to date and opens the
app:

```bash
npm run update       # pull the newest code, install new libraries, open the app
```

Add `-- --browser` to open it in the browser instead, or `-- --no-start` to only update. If you
have edited files yourself, it stops and tells you how to keep or discard them first.

An app built with `npm run app:build` is at `src-tauri/target/release/bundle/macos/Black Swan.app`.
Built on your own Mac, it opens without the Open Anyway step.

### Releasing a new version

1. `npm run set-version -- 1.0.1` puts the new number in package.json, package-lock.json,
   Cargo.toml and Cargo.lock (a test checks they agree).
2. Add a section at the top of CHANGELOG.md that starts with `## 1.0.1: ` and a short title.
   It becomes the release notes and the text on the update card.
3. Merge to main. The **Release** workflow on GitHub sees a version with no release yet,
   builds Black Swan for Apple Silicon and Intel Macs on one of GitHub's Macs (about 15
   minutes), and publishes the release. Every installed copy then offers the update.

Every pull request runs the **Checks** workflow: tests, types, the web build, and the Mac app,
which is built and opened on a GitHub Mac to see that it starts.

**The signing key (set up once).** Updates are signed so that the app only installs builds
made by this project. The public half of the key is in `src-tauri/tauri.conf.json`
(`plugins.updater.pubkey`). The private half is the repository secret
`TAURI_SIGNING_PRIVATE_KEY` (GitHub → Settings → Secrets and variables → Actions). It never
goes in the code. Keep a copy somewhere safe: if it is lost, a new key pair has to be made, and
every installed copy then needs one manual reinstall.

## Keys

| Key | Does |
| --- | --- |
| L | On the title screen: Learn to play |
| Space | Pause or resume |
| Shift + 1 to 5 | Game speed |
| . | Advance one day while paused |
| Click | Select your divisions, or open the details of anything else |
| Shift-click | Add another of your counters to the selection |
| Shift-drag | Draw a box to select all your divisions inside it |
| A | Form an army from the selected divisions (with none selected: your armies) |
| 1 to 9 | Select an army; press again to look at it on the map |
| Drag a flag | Give an army a new front (enemy province: push; border: hold; your land: reserve) |
| Right-click | Send the selected divisions there (attack if the enemy is there), or point the selected army there |
| G | Move or attack: then click the destination or type its name |
| H | Halt the selected divisions |
| Tab | Step through your stacks of divisions (while the map has the focus) |
| Arrows, + and - | Move and zoom the map (or drag, scroll and pinch) |
| R | Battle reports |
| P | Production: factories, new divisions, manpower |
| E | Economy: budget, taxes, debt and inflation |
| T | Research: technologies and research teams |
| N | National plan |
| W | Home front: stability and war support |
| D | Diplomacy: tension, treaties, wars and world news |
| F | Navy and air force: fleets, air wings, your trade by sea |
| B | Selected divisions: go by sea (then click a coast) |
| G | With a fleet or an air base open: choose where it goes on the map |
| C | Chronicle: chapters, objectives and history cards (Standings in Free-for-all) |
| O | Report: your game beside the real history |
| V | War replay: the front week by week, in about a minute |
| X | Codex |
| S | Save and load (3 slots plus an autosave) |
| M | Sound on or off |
| ⌘ , | Settings (Mac app; or the Settings button on the title screen and the rail) |
| ? | All shortcuts |
| Esc | Close a panel or the sidebar |
| N / F / C | Title screen: Story, Free-for-all, Continue |

## How the code is organised

```text
src/sim/          the game engine: pure TypeScript, no UI, fully testable
  world.ts        newWorld() and step(world, orders): one day at a time
  combat.ts       battles: daily rounds, the front line, retreat, surrender and battle reports
  rivers.ts       the great rivers and the borders they run along
  seasons.ts      snow, mud and desert heat, worked out from the date
  pockets.ts      divisions cut off from supply, grouped into pockets
  replay.ts       the front written down once a week, for the war replay
  upgrade.ts      bringing a world saved by an older version up to date
  supply.ts       depots, links home and how many divisions a province can feed
  war.ts          who is at war with whom
  diplomacy.ts    relations, pacts, world tension, causes for war, ultimatums, peace,
                  surrender and what happens to a conquered country
  agenda.ts       what each AI country wants and when (the real timetable of 1936 to 1941),
                  and the conditions that let the player change it
  story.ts        Story mode: history cards, decisions on real dates, Spain, Vichy,
                  Lend-Lease, surprise and the purge, the Far East army, Italy's change
                  of sides, chapters, how a game ends
  operations.ts   the timetable of real expeditions and landings an AI Britain carries out
  scenario.ts     starting a game: the 1936 and September 1939 starts, and Free-for-all
  chapters.ts     the three chapters and each country's objectives
  opportunist.ts  Free-for-all: AI countries that look after themselves
  report.ts       the end report: this game beside the real history, and the scoreboard
  sea.ts          the 17 sea zones, coasts, trade routes and who controls each zone
  navy.ts         fleets and missions, naval battles, convoys and blockade, troops by sea
  air.ts          air wings and missions, control of the sky, bombing
  forces.ts       ties the navy and the air force into the day
  aiForces.ts     how AI countries use their fleets, wings and transports
  economy.ts      factories, production lines, manpower, the budget, debt and inflation,
                  and the home front: stability and war support
  research.ts     the 24 technologies, research teams and how fast they work
  plans.ts        the 25 national plans
  mods.ts         adds up what research and finished plans change
  aiEconomy.ts    a simple finance minister for AI countries (it also picks research and plans)
  testeconomy.ts  finance playtests, used by the balance report
  ai.ts           the army commander for AI countries: fronts, offensives, encirclement
  armies.ts       the player's armies: Hold, Push, Fall back, Reserve, pincers
  commanders.ts   the 24 generals who can lead them, and their traits
  game.ts         advance(): one day with a player, the AI leading every other country
  intel.ts        what a country can see (fog of war)
  testwar.ts      AI against AI test wars, used by the balance report
  map.ts          the provinces, distances, marching speeds and route finding
  countries.ts    the 31 countries of 1936, their starting armies and their industry
  types.ts        the shapes of all engine data
  rng.ts          seeded random numbers (same seed = same game)
src/content/map/  the 1936 map data (built by scripts/build-map.mjs)
src/content/      the codex and the history cards (history.ts)
src/save/         save slots (whole game state as JSON): files in the Mac app, local storage in a browser
src/native.ts     the bridge to the Mac app (save files, the menu, text size); does nothing in a browser
src/ui/           React screens, widgets, sound and the War Room theme
  map/            the Map table: shapes, colours and the map itself
  screens/        title, choose your country, the Map table, sidebar, overlays, Settings,
                  the war replay
  audio/          sound made in code: clicks, alarms, the map room hum and the guns
  settings.ts     the player's settings and their defaults
  updates.ts      checking for, downloading and installing a new version
  releaseNotes.ts release notes as plain text, and comparing version numbers
src-tauri/        the Mac app wrapper (Tauri): save files, the menu, updates, the icon
  tauri.release.conf.json  what the release build adds (signed update files)
.github/workflows/ checks.yml (every pull request) and release.yml (publishes new versions)
scripts/          build-map.mjs turns modern map data into 1936 provinces;
                  build-sea.mjs draws the sea zones and works out the coasts;
                  update.mjs is `npm run update`; set-version.mjs is `npm run set-version`;
                  release-notes.mjs takes a version's notes from CHANGELOG.md
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

Version 1.0 completes the plan, 1.1 fixes the war economy, 1.2 makes the front move inside
each province and 1.3 adds armies with Hold and Push orders (see CHANGELOG.md). Next: a
right-click attack menu for land, sea and air (K3). Ideas for later versions: playing against
friends over the internet (the engine is already deterministic, with a fingerprint check for
it), and the Pacific and the Americas.

## History and symbols

The game uses real countries, borders and leaders as historical facts. It shows no Nazi or
fascist symbols, never makes atrocities a game mechanic, and describes them honestly in the
codex and history cards. The history cards (`src/content/history.ts`) use the well-established
dates and figures; where numbers are estimates or historians disagree, the card says so. If
you find a mistake in one, it is a bug: please fix it.
