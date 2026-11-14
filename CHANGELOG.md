# Changelog

## War game, Stage G: the navy and the air force (2026-11-14)

- **Sea zones.** The sea around Europe is cut into 17 zones, from the Barents Sea to the
  Eastern Mediterranean. The new **Air and sea** map mode shows who holds each one, the fleets
  in it and the air wings at their bases.
- **Fleets.** Three kinds of ship: capital ships, escort flotillas and submarine flotillas.
  The navies of 1936 are in place at the start. You do not steer ships: give a fleet a sea
  zone and a mission (patrol, escort convoys, raid convoys, stay in port). Fleets can be split
  and joined.
- **Control of the sea.** The side with twice the other's strength in a zone controls it.
  Enemy fleets in the same zone fight every day; the weaker one is worn down and should leave.
- **Convoys and blockade.** Each country's imports cross a route from the ocean to its home
  waters. Raiders sink them, escorts protect them and hunt the submarines, and a zone the
  enemy controls outright loses 90%. What is sunk never arrives: steel and oil for the
  factories, goods for the shops. Britain depends on the sea entirely, Germany hardly at all.
- **Troops by sea.** Select divisions on a coast, press B and click another coast. A friendly
  shore takes a few days. An enemy shore is a landing: two weeks to prepare, control of the
  sea off the beach, a limit on how many divisions can land at once, and the troops fight at
  60% as they come ashore. Troops overseas need an open port for supply.
- **Air wings.** Fighters and bombers, about a hundred aircraft to a wing, based in a province.
  Fighters reach 400 km, bombers 800 km. Missions: air superiority, ground support, strategic
  bombing, naval strike, rest.
- **Control of the sky.** The side with 1.5 times the other's air strength over a battle hits
  15% harder, and the other side 15% less hard. The battle outlook and battle reports say so.
- **Strategic bombing** puts up to half of a province's factories out of action for a while
  and wears down support for the war.
- **Production.** Fighters, bombers and the three kinds of ship are built on production lines
  by the same military factories. Finished aircraft repair your wings or form a new one; a
  finished ship joins a fleet off your home coast.
- **Research.** Two new branches, navy and air, of four technologies each (24 in all): sonar,
  ocean-going submarines, naval radar, landing craft, monoplane fighters, fast medium bombers,
  radar early warning and long-range aircraft. Research is a third faster, so the land
  technologies arrive when they did before.
- **The Navy and air force panel** (key F, or the Forces button on the rail): every fleet and
  air base, the state of your trade by sea, and new wings. Click a sea zone, a fleet or an air
  base on the map to open it in the sidebar. The news line reports naval battles, landings,
  lost wings and how much of your imports are being sunk.
- **AI countries use all of it.** They patrol their home waters, escort their own trade, send
  submarines against the enemy's, move their wings up to the front, bomb, send an expedition
  to an ally across the sea (Britain to France in 1939) and land on weakly held enemy coasts.
- **Surrender.** A country whose capital has fallen now gives up at 40% of its victory points
  instead of 60%. France asked for an armistice eight days after Paris fell.
- A new German programme, **Armoured corps** (from 1938), so the German army of 1940 can still
  break the French one now that part of its industry builds aircraft and submarines.
- 9 new codex entries, among them sea zone, control of the sea, convoy, blockade, landing, air
  wing and strategic bombing.
- Engine: `sea.ts`, `navy.ts`, `air.ts`, `forces.ts` and `aiForces.ts`, pure TypeScript. 151
  unit tests (22 new). `npm run balance` now writes `docs/balance-stage-g.md`, with tables for
  the war at sea and in the air. `npm run build:sea` rebuilds the sea zones.
- Saves from Stage F no longer load (a save now holds fleets, air wings and bomb damage).

Not in this stage, and known weak spots: straits are not modelled, so a fleet can pass
Gibraltar, the Bosporus or the Danish straits whoever holds the shore; you can see every fleet
on the map but only your own and your allies' air bases, and aircraft do not yet scout for the
army; ships are not repaired, only replaced; a player's aircraft and ship lines start empty
and must be set by hand; France now falls in September or October 1940, three to four months
late; the German-Soviet war still settles into a stalemate (no front-wide offensives, no
winter); Norway, Greece, the Spanish Civil War, the Vienna Awards and Vichy France are not
modelled; history cards come in Stage H; the Mac app build is not tested in the cloud.

## War game, Stage F: diplomacy, AI countries and peace (2026-11-13)

- **Relations.** Every pair of countries has a relation from -100 to 100. It drifts 2 points a
  month towards a resting point made of their kinds of government, their history, their
  treaties, claims on each other's land and any diplomatic mission. The sidebar lists every
  reason in points.
- **Treaties.** Alliances (you fight each other's wars and may use each other's land and
  depots), guarantees (a one-way promise to defend a country) and non-aggression pacts. The
  real treaties of 1936 are in place at the start: Britain and France, France with Poland and
  Czechoslovakia, the guarantee of Belgium, the German-Polish and Soviet pacts.
- **World tension**, 0 to 100, in the top bar. Ultimatums, annexations and wars raise it; it
  falls half a point a month. Democracies can guarantee other countries only from tension 25
  and build a case for war only from 50. From 50 every AI country arms faster, and tension
  raises war support in countries still at peace.
- **A cause for war.** Story mode needs one: a claim, a case you have built (45 days for a
  dictatorship, 120 for a democracy), a refused ultimatum, or a promise to an ally. Free-for-all
  lets you attack anyone without one, at twice the cost in stability, more tension and worse
  relations with everyone.
- **Ultimatums.** A country with a claim can demand it without a war. The target gives in if
  nobody will fight for it and it is clearly outmatched (1.5 to 1). If a protector stands firm
  it refuses, and the demander must fight or back down. This is how Austria, Munich and
  Bessarabia work.
- **Decisions.** When an ally is attacked, a country you protect receives an ultimatum, an ally
  calls you into its war or an enemy offers peace, the clock stops and the question opens in
  the sidebar with what each answer costs. Breaking a promise costs stability and trust.
- **AI countries follow history.** Each has the real timetable of 1936 to 1941: the Rhineland,
  the Anschluss, Munich, Prague, Albania, the Pact of Steel, the German-Soviet pact, Poland,
  the Winter War, Denmark, the attack in the west, the Baltic states, Yugoslavia and the
  invasion of the Soviet Union. Each step has conditions (earlier steps done, good enough
  odds, no firm protector), so what you do changes it: stand firm at Munich as France and
  Germany must fight in 1938 or back down; lead Germany and do nothing and there is no war.
- **Containment.** Once a country has broken the peace three times, the major democracies
  guarantee the countries it still has claims on. This is why Britain guarantees Poland two
  weeks after Prague.
- **Peace.** Offer peace on the old borders or with each side keeping what it holds. The other
  side answers by the war score (land, armies, the home front, who else it is fighting), which
  the sidebar shows with every reason. Peace starts a truce of 180 days. AI countries offer
  peace themselves when a war is lost or their people will no longer carry it.
- **Surrender and what follows.** A country that loses 60% of its own land's victory points
  surrenders and is occupied (factories at 30%). The victor can leave it occupied, annex it or
  set up a friendly government, which returns it to the map as an ally. When a conqueror falls,
  the countries it took are restored. Land you take back from an enemy returns to the ally
  that owned it.
- **A government that falls changes its kind**: a democracy becomes authoritarian, an
  authoritarian state a democracy, and fascist or communist rule gives way to authoritarian.
- **The Diplomacy panel** (key D, or the rail button): tension, treaties, wars, causes for war,
  the countries that matter most to you and the news of the world. The Diplomacy map mode
  colours allies, protected countries, enemies and hostile neighbours. A gold dot on the rail
  marks a question waiting for your answer.
- 14 new codex entries and a fuller one for appeasement, among them world tension, guarantee, cause for war, ultimatum,
  appeasement, containment, war score and the butterfly effect.
- Engine: `diplomacy.ts` and `agenda.ts`, pure TypeScript. 129 unit tests (19 new), including
  bot playtests: the AI alone reaches 1 September 1939 on the real dates, and two games where
  a player changes history. `npm run balance` now writes `docs/balance-stage-f.md`, with a
  table of 21 real events against the dates they happen in three AI-only games.
- Saves from Stage E no longer load (a save now holds relations, treaties and who owns what).

Not in this stage, and known weak spots: Britain cannot reach the continent or Africa in
force until the navy exists (Stage G), so after France falls the war in the west goes quiet;
the German-Soviet war settles into a stalemate after the first months instead of swinging back
and forth; the campaign in France takes about six weeks longer than the real one; Norway,
Greece, the Spanish Civil War, the Vienna Awards and Vichy France are not modelled; history
cards for each event come in Stage H; the Mac app build is not tested in the cloud.

## War game, Stage E: research, the home front and national plans (2026-11-13)

- **Research** (key T, or the Research button on the rail). Sixteen technologies in four
  branches: infantry, armour and artillery, industry, and economy and society. The major powers
  have two research teams, everyone else one. Each technology has the year it really appeared,
  and a team working ahead of that year is slower: speed = 1 / (1 + 0.5 x years ahead). Click a
  technology to see what it gives, how long it will take and what really happened.
- **War support**, the second meter of the home front, next to stability. It starts low in the
  democracies (35) and higher in the dictatorships (55). Being attacked adds 30; starting a war
  adds nothing, and costs a democracy 10. Lost provinces, defeats, a long war, inflation and
  empty shops pull it down; victories and civil defence push it up.
- **What war support decides.** The wider conscription laws need it (30, 55 and 75, less under
  a dictatorship). In wartime people accept higher taxes before stability falls, up to 15
  points more. War bonds sell better in a war people believe in. Below 40, a war costs
  stability and divisions recover more slowly. Declaring a war your people do not want costs
  stability on the day.
- **Governments can fall.** Three months in a row with stability below 20 and the government
  is replaced: stability returns to 45, but the national plan is abandoned and war support
  drops by 10.
- **National plans** (key N). One long programme at a time, 60 to 180 days, each paid for
  monthly in the budget. Twelve are open to everyone (rearmament, industrial expansion, border
  fortifications, public works, tax reform and more). Each major power also has two real
  programmes of the 1930s, with a note on what really happened: shadow factories and the
  Ministry of Supply, the Maginot extension and the nationalised arms industry, the Four Year
  Plan and the Westwall, the autarky campaign and the Alpine Wall, the Third Five-Year Plan and
  universal military duty, the Central Industrial Region and the National Defence Fund.
- **The Home front panel** (key W, or click Stability or War support in the top bar): both
  meters, every reason behind them in points, what war support currently allows, and a chart.
- **Research and forts change battles.** The outlook lists each side's edge, and battle reports
  name better weapons or fortifications when they decided the result.
- **AI countries research and plan too.** Idle teams take the technology that is most due; the
  dictatorships put weapons first and the democracies industry. Each country carries out its
  own real programmes first.
- A gold dot on the rail marks an idle research team or a missing plan. News lines report
  finished research and plans, falling war support, a crisis and a fallen government.
- 9 new codex entries (research, national plan, war weariness, the home front, autarky and
  national income accounts among them, two marked as AP Macroeconomics), and fuller entries
  for stability and war support.
- Engine: `research.ts`, `plans.ts` and `mods.ts`, all pure TypeScript; the home front lives in
  `economy.ts` beside the stability meter from Stage D. 110 unit tests (26 new), including a
  bot playtest of four years of AI peace. `npm run balance` now writes
  `docs/balance-stage-e.md`, with a new table of what each major power researched and planned.
- Saves from Stage D no longer load (a save now holds research, plans and war support).

Not in this stage: the navy and air research branches (Stage G, with the ships and aircraft);
road building as a plan (the map has no roads to improve yet); a fallen government changing the
kind of government, and democracies needing a cause for war (both need diplomacy, Stage F);
history cards (Stage H).

## War game, Stage D: factories, manpower and paying for the war (2026-11-12)

- **An economy for every country.** Civilian and military factories stand in provinces (most in
  capitals and the industrial regions), so taking or losing land takes or loses industry. An
  occupier gets 30% of a province's factories and half its steel and oil.
- **The Economy panel** (key E, or click Treasury, Balance, Inflation or Stability in the top
  bar): the monthly budget line by line, a tax slider, a slider for how much of a shortfall to
  borrow and how much to print, rationing, and the reasons behind inflation, the interest rate
  and stability, biggest first, with charts of inflation and debt.
- **Three ways to pay, each with a price.** Taxes cost stability and slow the factories. Bonds
  pile up debt, and lenders ask for more interest as debt grows, as the war goes badly and as
  they come to expect inflation (i = r + expected inflation). Printed money costs nothing today
  and turns into inflation over the next few months. Bonds nobody will buy are printed anyway.
- **Inflation** follows the design document's formula, with expectations that are slow to fade.
  Over 10% a year stability falls, over 30% factories slow and bonds stop selling, over 100% is
  hyperinflation. Inflation also melts debt, which is the temptation.
- **The Production panel** (key P): three production lines (infantry, artillery, armour) that
  speed up the longer they run, new divisions raised from finished equipment and 15,000 men,
  a building queue for new factories, conscription laws, and steel and oil.
- **Guns or butter.** Civilian factories that build are not filling the shops. Take too many
  and shortages push prices up and stability down.
- **Losses now cost something.** Damaged divisions refill only from equipment in store and the
  manpower pool; the free trickle of Stage C is gone. War triples army upkeep.
- **AI countries run their economies** with a simple finance minister, at peace and at war. The
  dictatorships accept big deficits to rearm; the democracies do not. Left alone until 1940,
  Germany grows from 30 to about 120 divisions and France from 32 to about 70.
- Province details show factories and raw materials, with buttons to build there. News lines
  report new divisions, finished factories, inflation passing 10, 30 and 100%, and the day the
  printing starts.
- 19 new codex entries, 14 of them AP Macroeconomics terms (opportunity cost, real interest
  rate, quantity theory of money, crowding out, inflation tax and more), plus Mefo bills and
  Keynes's "How to Pay for the War".
- Engine: `economy.ts`, `aiEconomy.ts` and `testeconomy.ts`, all pure TypeScript. 84 unit tests
  (29 new), including bot playtests of four finance policies and of four years of AI peace.
  `npm run balance` now also runs 24 finance playtests and writes `docs/balance-stage-d.md`.
- Saves from Stage C no longer load (a save now holds every country's economy).

Not in this stage: roads, forts, airfields and ports in the building queue; trade deals and
blockade (imports always arrive until the navy exists in Stage G); war support and what else
moves stability (Stage E); history cards for the economics (Stage H).

## War game, Stage C: the Map table screen, the first playable version (2026-11-12)

- **The Map table.** The map now fills the window in the "glowing map table" look: glowing
  coasts and borders, country names, capitals and cities. Scroll or pinch to zoom, drag to
  move. Top bar with your army's numbers, the date, pause and five speeds; a rail of panels on
  the left (those for later stages are greyed out); a news ticker along the bottom.
- **Choose your country.** Story offers the six major powers; Free-for-all offers every country
  with an army. (The two modes play the same until Story mode arrives in Stage H.)
- **Give orders.** Click one of your counters to select its divisions, shift-click to add
  another, then right-click a province to march there. If enemy divisions stand in it, that is
  an attack. Orders can be given while paused and show on the map at once.
- **A sidebar for everything you click:** your divisions (strength, organisation, supply,
  current order), a province, a foreign army, a country, a battle in progress and a finished
  battle with its reasons.
- **Outlook.** Before and during a battle the sidebar estimates how long each side can keep
  going and lists what is helping or hurting (terrain, digging in, supply, directions).
- **War and peace by hand.** Open a country and declare war or make peace. The test AI leads
  every country you are at war with. Diplomacy with rules comes in Stage F.
- **Fog of war.** You see foreign divisions only on and next to your own land and troops.
- **Map modes:** political, terrain, supply (overcrowded and cut-off provinces stand out) and
  diplomacy, each with a key.
- **Pause when attacked** (on by default) stops the clock when an enemy attacks one of your
  provinces. The game autosaves on the first of each month.
- **Keyboard:** Space, 1 to 5, full stop for one day, Tab through your armies, G then type a
  destination, H to halt, arrows and plus/minus for the map. Press ? for the list.
- Engine: `advance()`, `applyOrders()`, `visibleStacks()` and `outlook()`, all pure TypeScript
  with tests. 55 unit tests, including a bot that plays France against Germany twice from the
  same seed and gets the same war.
- Removed the plain map preview and "watch a test war" panel; the Map table replaces them.
- Saves from Stage B no longer load (a save now records which country you lead).

Not in this stage: production, money and manpower (Stage D), so losses are never replaced
beyond a slow trickle; AI countries starting wars of their own (Stage F); navy and air
(Stage G). Leaders' names and history cards come with Story mode (Stage H).

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
