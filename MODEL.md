# How the game works: the rules and the numbers

This file lists the rules of each system as they are in the code right now. Maths is written
in plain text. The numbers were tuned with `npm run balance` (see
[docs/balance-stage-f.md](docs/balance-stage-f.md)) and will be tuned again as later stages
add the navy and air power.

## The day

`step(world, orders)` moves the world on one day, always in this order:

1. Orders are applied (move, halt, everything about the economy and everything about
   diplomacy).
2. Diplomacy runs: cases for war and truces count down, unanswered decisions take their
   default, and on the last day of a month relations drift and tension falls.
3. Every economy runs for a day: taxes and bills, production lines, construction, training,
   research and the national plan. On the last day of a month, inflation, stability and war
   support are worked out.
4. Supply is worked out for every division.
5. Every battle fights one round.
6. Divisions march. Allies may cross each other's land; land taken back from an enemy
   returns to the ally that owned it.
7. Divisions rest, refill, dig in or go hungry.
8. Countries that have lost too much surrender.

## A day with a player (`src/sim/game.ts`)

`advance(world, playerOrders)` is one day of a game you play yourself: your orders, plus the
army AI's orders for every other country that is at war, the AI finance minister's orders and
the AI foreign minister's orders (`agenda.ts`) for every other country, then `step`. The player
cannot give the engine-only orders that force a peace or carry out an AI aim.
Orders for divisions or economies that are not yours are dropped.

`applyOrders(world, orders)` carries out orders without a day passing, so the map can show a
march the moment you order it, even while paused. `step(applyOrders(w, orders))` gives exactly
the same world as `step(w, orders)`.

## Repeatable to the last digit (`src/sim/dmath.ts`, `src/sim/hash.ts`)

The same seed and the same orders always give the same world, on any computer. That is what
lets a saved game carry on exactly, and it is what multiplayer will need later: in "lockstep"
play every computer runs the simulation itself and only the players' orders are sent between
them, so the worlds must never drift apart.

- All randomness comes from the seeded generator in `rng.ts`, whose whole state is one number
  kept in the world.
- Adding, subtracting, multiplying, dividing and square roots are exact on every computer.
  `Math.log`, `Math.exp`, `Math.sin` and the like are not: each browser works them out its own
  way and may differ in the last digit. The engine uses its own versions (`dmath.ts`), built
  only from the exact steps, accurate to about 15 figures. Dates are written out by the engine
  too, not by the computer's language settings.
- `worldHash(world)` is a 14-digit fingerprint of the whole world. Two computers that are in
  step have the same fingerprint at the end of every day; if they ever differ, one of them
  has drifted and needs the world sent again.
- A test (`tests/lockstep.test.ts`) plays the same game twice and checks every day's
  fingerprint, checks that a game saved and loaded half way ends exactly like one that never
  stopped, and checks that no file in `src/sim` uses the maths, clocks or language settings
  that differ between computers.

## Lessons (`src/tutorial/lessons.ts`)

Learn to play has ten lessons. Each is a world built from the real 1936 world, with France as
the player, divisions placed where the lesson wants them, and `story.lesson` set. That switches
off history cards, story events, random events and the end of the game; the AI's historical
agenda and the treaties are off too, so nothing happens but what the lesson set up. Two lessons
start a war: France and Germany on 7 September 1939 (the Saar, with most of the German army in
the east; the Battle and Armies lessons both use it), and Italy and France on 11 June 1940. The AI still leads the enemy army, so it can
counter-attack.

Each step is a check on the game (a panel open, divisions marching, a province taken) and a
"Show me" that does the step. The tests play every lesson with Show me alone and fail if any
step cannot be finished. Lessons are never saved and never touch the autosave.

## What you can see (`src/sim/intel.ts`)

You always see the map and who holds each province. You see foreign divisions only in
provinces you control, provinces where your divisions stand, and the neighbours of both. For
now what you see is exact; estimates that can be wrong arrive with air reconnaissance in
Stage G.

## Divisions

| Division | Attack | Defence | Speed (km a day) |
| --- | --- | --- | --- |
| Infantry | 10 | 15 | 25 |
| Armour | 22 | 10 | 60 |
| Artillery | 16 | 8 | 20 |

Each division has strength (men and equipment, 0 to 100) and organisation (readiness to fight,
0 to 100).

A division may only enter its own country's land or the land of a country it is at war with.

## Battles (`src/sim/combat.ts`)

A battle starts when a division is ordered into a province where enemy divisions stand. Each
day, each side's damage is:

    damage = sum of [ attack or defence x strength/100 x terrain x river x dig-in x supply ] x luck

- **attack or defence**: attackers use attack, defenders use defence.
- **river** (attackers only, Stage K1): 0.85 for a division attacking across one of the great
  rivers (`src/sim/rivers.ts`), 1 otherwise. Mud also takes 20% off every attack into it (see
  the seasons below).
- **terrain** (attackers only, for the province being attacked): plains 1.0, desert 0.9,
  forest 0.8, hills 0.7, marsh 0.7, mountains 0.5. Armour loses a further x 0.7 in forest,
  marsh and mountains.
- **dig-in** (defenders only): +2% for each day standing still, up to +20%. Each artillery
  division in the attack removes a quarter of that bonus.
- **supply**: 0.5 + 0.5 x supply level, so 1.0 when fully supplied and 0.5 when cut off.
- **luck**: a seeded random number from 0.9 to 1.1, rolled once per side per day.

**Front width.** Only 8 divisions per side fight at once, the best-organised first. Attackers
get 4 more places for each extra direction they attack from. The rest wait in reserve.

**Taking damage.** A side's damage is shared equally among the enemy divisions in the fight.
Each point costs a division 0.5 organisation and 0.06 strength.

**How a battle ends.**

- A defender at 0 organisation retreats to a neighbouring province its country controls (the
  one nearest its capital), leaving 10% of its strength behind (guns and stragglers), or 20%
  when it is chased across plains or desert by attackers of whom at least a fifth are armour.
  If there is nowhere to go, it surrenders and is removed.
- An attacker below 10 organisation stops attacking and stays where it was.
- When no defenders are left, the attackers win. The front line (below) jumps forward and they
  march the rest of the way in. Arriving captures the province.
- When no attackers are left, the defenders win.

**The front line** (Stage K1). Every battle has a line from 0 (the attackers are still at the
border) to 100 (they have reached the far side). Each day it moves by

    push = 10 x (attackers' damage - defenders' damage) / (attackers' damage + defenders' damage)
           x ground   (dry 1, snow 0.75, mud 0.5)
           x river    (only while the line is under 20 and moving forward:
                       1 - 0.5 x the share of the attack coming across a river)

and it stays between 0 and 100. A day where you deal twice the damage you take moves it
10 x (2 - 1) / (2 + 1) = 3.3 points; a day where you take twice what you deal moves it 3.3
points back. Attackers stand as far into the province as the line, and that is what the map
draws: a band in their colour, growing from each border they attack across.

- A new battle starts its line from how far the attackers had already walked in (so a
  division that was 60% of the way into an empty province when defenders arrived starts at 60).
- If the line reaches 100 while defenders still stand, they are all pushed out: each falls
  back with the usual 10% loss, or surrenders if it has nowhere to go.
- When the defenders break (0 organisation) and none are left, the line jumps 60% of the way
  that is left, or 85% when the attackers' tanks can chase them (open ground, at least a fifth
  of the attackers armour). The attackers then march the rest at their usual pace, and the
  province changes hands when they arrive. So a battle won at line 30 by infantry has the
  attackers at 30 + 0.6 x 70 = 72, with 28% of the walk still to go.
- Walking into an empty enemy province is drawn the same way, from how far the division has
  walked.
- Who holds a province, for supply, factories and victory points, changes only at 100.
- **Reeling defenders** (since 1.3). When the defenders' army is caught by surprise or in the
  shock of 1940 (see Story mode), the line gives way much faster:
  push = 10 x (A - D) / the smaller of A and D, between -10 and +15 a day. Twice the damage
  moves it 10 points instead of 3.3. Armies taken by surprise in 1941 lost hundreds of
  kilometres in weeks, which the even formula could not show.

**Rivers** (`src/sim/rivers.ts`). Sixteen great rivers and the Suez Canal lie on the province
borders they follow most closely: the Rhine, Meuse, Elbe, Vistula, Narew, Bug, Dniester, Prut,
Danube, Dnieper, Don, Svir, Po, Loire and Ebro. Attacking across one costs 15% of the attack and
halves the line's pace until a bridgehead of 20 points is won.

**The army AI and the front line.** An AI country keeps feeding a battle whose line moved
forward yesterday or is at least 50 points in, at 60% of its usual margin, and never calls such
a battle off.

Worked example: 8 infantry attack 8 infantry on plains, nobody dug in. Attackers deal
8 x 10 = 80, so each defender loses 80 / 8 x 0.5 = 5 organisation a day. Defenders deal
8 x 15 = 120, so each attacker loses 7.5 a day. The attackers break first, after about 12 days.
That is why an attack needs more than equal numbers.

**Outlook.** `outlook()` gives the estimate shown in the sidebar. It uses the same line-up as
the real battle, without the luck:

    days attackers last = (average organisation - 10) / (defenders' damage / attackers fighting x 0.5)
    days defenders last = average organisation / (attackers' damage / defenders fighting x 0.5)

It favours whichever side lasts longer, and says "too close to call" within 15%. In the worked
example above that is (100 - 10) / 7.5 = 12 days for the attackers against 100 / 5 = 20 for
the defenders.

**Battle reports.** When a battle ends, a report records who won, the losses and up to three
causes, biggest first (for example "attacking into mountains", "the attackers were short of
supply", "3 surrounded divisions had nowhere to retreat and surrendered").

**Research, plans and forts.** Each division's damage is also multiplied by its country's
"edge": 1 plus whatever its technologies add for that type of division (for example +10%
infantry defence), and for a defender on its own country's home soil, 1 plus its
fortifications. The outlook shows the edge, and a battle report names it when it mattered.
Each battle that ends moves the mood at home (see the home front below).

Air power is in the formula through control of the sky (see "The air" below).

## Seasons (`src/sim/seasons.ts`)

Worked out from the date, so they are the same on every computer. Which country a province
belonged to in 1936 decides its climate.

| Season | Dates | Where | Effect |
| --- | --- | --- | --- |
| Snow | 1 December to the end of February | the Soviet Union, the Nordic countries, Poland, the Baltic states, Romania | marching at 75% speed, the line at 75% pace |
| Winter cold | the same months | the Soviet Union, Finland, Norway, Sweden | an invader attacks at 75% and wears out twice as fast |
| Mud | 15 March to 30 April, 10 October to 20 November | the Soviet Union, Poland, the Baltic states, Romania | marching takes twice as long, attacks hit 20% less hard, the line at half pace |
| Desert heat | June to August | desert provinces | organisation comes back at half speed, twice the wear at the front |

Marching slows only the walk, not route finding: divisions take the same roads, just more slowly.

## Pockets (`src/sim/pockets.ts`)

A pocket is a group of neighbouring provinces holding divisions of one country that get no
supply at all. The map rings each one with its count ("12 divisions trapped"), red for your
own and gold for the enemy's, and the news line warns when a new one forms.

## The war replay (`src/sim/replay.ts`)

On the first day of a game the engine writes down who holds every province, and every seventh
day after that it adds whatever changed hands. The replay screen (key V, or from the report)
plays the weeks back in about a minute, one picture a week. A whole war is a few dozen
kilobytes in the save. Saves from 1.1 start recording on the day they are loaded.

## Supply (`src/sim/supply.ts`)

    supply = 0                                   if the division is cut off
    supply = min(1, capacity / divisions there)  otherwise

- **Cut off** means no path, through provinces your country controls, back to one of your
  depots. A depot is your capital, or the biggest city of each separate piece of your home
  territory (for France: Paris, Algiers, Corsica and Damascus). It only works while you hold it.
- **Capacity** of a province = 5 + 4 x infrastructure (4 + 3 x infrastructure before 1.3).
  Infrastructure runs from 1 to 5: plains 3, forest 2, hills 2, marsh 1, mountains 1, desert 1,
  plus 1 for a big city and plus 1 for a capital. So open country feeds 17 divisions, a
  mountain province 9 and a capital up to 25. It was raised in 1.3 because an army invading
  the Soviet Union could not fit enough divisions on its front to push far.

What supply does:

- In battle, low supply cuts damage (see above).
- Organisation cannot stay above 100 x supply. Above that it falls 3 a day; a rested division
  below it regains 3 a day (half that while marching).
- A cut-off division at 0 organisation loses 2 strength a day until it is gone.
- **Wear and tear** (Stage J). A division next to an enemy province that is not in a battle
  loses 0.05 strength a day (sickness, shelling, patrols), twice that in a Russian, Finnish or
  Scandinavian winter for an army from outside. In a long war this, not the big battles, is most
  of the cost.
- A rested, supplied division regains up to 0.5 strength a day, if there is equipment in store
  and manpower for it (see "Production" below).
- Armoured divisions of a country that is short of oil have their supply capped at the share
  of its oil need that is met, never below 0.4.

## The economy (`src/sim/economy.ts`)

Money is in millions of the country's own currency ("m"). Amounts are per month unless it says
otherwise. Nothing in the economy is random.

### Factories

Factories stand in provinces. Each country's 1936 total is spread over its home provinces, with
most in the capital, the big cities and the industrial regions (the Rhineland, Lorraine,
Yorkshire, Lombardy, the Donbass and others). Whoever controls a province uses its factories:
fully if it is their own home province, at 30% if they are occupying it. Occupiers also take
half of its steel and oil.

New factories, built or given by a plan, go where the country has least industry for its size
(since 1.6): among its home provinces furthest from foreign land (not touching it, if it has any
such province), the one with the fewest factories for 1 + victory points / 4 + its industrial
weight. Before 1.6 nearly all of them went to the capital: by 1943 Berlin had 106 of Germany's
132 military factories, and one battle for Berlin decided the war.

- **Civilian factories** make consumer goods, unless you set them to build.
- **Military factories** make equipment for divisions, on production lines.

Speed of all factories:

    output factor = conscription x strikes x inflation x tax drag

- conscription: see "Manpower"
- strikes: 1 - 0.8 x (50 - stability) / 100 when stability is below 50
- inflation: 0.9 above 30% a year, 0.75 above 100%
- tax drag: 1 - 0.5 x (tax rate - 0.30) when taxes are above 30%

### Output and the budget

    real output (GDP)  = 10m x (civilian factories + military factories in use) x output factor
    nominal output     = real output x price level / 100

    balance = taxes + exports
              - (civil government + army upkeep + military factories + construction + imports + interest)

| Line | Amount |
| --- | --- |
| Taxes | tax rate x nominal output (5% less under rationing: the black market) |
| Civil government | 12% of nominal output |
| Army upkeep | infantry 0.3m, artillery 0.45m, armour 0.6m per division; **x 3 at war**; x the country's pay level |
| Military factories | 2m for each one working |
| Construction | 2m for each civilian factory building |
| Imports, exports | steel 1.5m, oil 2.5m a unit; exports earn half price |
| Interest | debt x average interest rate / 12 |

**Pay level** (Stage J). Soldiers are paid, fed and clothed at about what a worker earns, so a
division costs less where output per head is low:

    pay level = 0.4 + 0.6 x (factories per million people / 0.7), kept between 0.5 and 1.2

Britain 1.09, France 1.01, Germany 0.99, Italy 0.78, Poland 0.68, the Soviet Union 0.65.

Everything except interest rises with the price level. Money moves every day (a thirtieth of the
monthly figures).

A game starts with the budget balanced: each country's tax rate is set to the rate that does
that, between 15% and 35%. Debt starts at 50% of a year's output, the money supply at 50% of a
year's output, the treasury at one month of spending, inflation at 2%.

### Covering a shortfall

A shortfall is paid from the treasury. When that is empty:

    borrowed = min(shortfall x bond share, what lenders will still buy this month)
    printed  = shortfall - borrowed

So whatever bonds will not cover is printed. A surplus refills the treasury up to one month of
spending and then pays off debt.

**Taxes** (10% to 60%). Each point above 25% takes 1.2 off stability; each point above 30% slows
all factories by 0.5%. Taxes also cut what people can spend: the goods they need fall by 0.6%
for each point of tax above 20%.

**Bonds.** Lenders ask for a real rate plus the inflation they expect (the Fisher equation):

    i = r + expected inflation
    r = 3  +  5 x (debt / yearly output - 0.6, if above)  +  2 if at war  +  8 x share of home victory points lost

New bonds are sold at i. The average rate on the debt is the weighted average of old and new
bonds, and one sixtieth of the debt rolls over to today's rate each month. What a lender really
earns is r = i - pi (pi is today's inflation).

    lenders buy up to 25% of a month's output x confidence x war support bonus  +  forced saving
    confidence = (1 - (debt ratio - 1.5) / 1.5)   falls from debt of 150% of output, gone at 300%
               x (1 - (inflation - 10) / 20)      falls from 10% inflation, gone at 30%
               x (1 - 1.5 x home points lost)     people lend to likely winners

Three wartime rules (Stage J), all from how the real war was paid for:

- **Forced saving.** At war with rationing on, people cannot spend their wages, so 12% of a
  month's output goes into savings and war bonds on top of what lenders would buy. It fades
  as inflation rises from 30% and is gone at 100%: people spend money before it loses value.
- **Financial repression.** At war with rationing on, the rate on new bonds is capped at 4%,
  so when prices rise faster the real rate r = i - pi is negative and inflation shrinks the
  debt (Britain paid about 3% on war debt).
- **Compulsory loans.** A communist government at war orders its people to buy bonds out of
  their wages (the Soviet state loans), so its confidence never falls below 60%.

**Printing** adds to the money supply, and shows up in prices over the following months.

### Inflation

Worked out at the end of each month, in per cent a year:

    inflation = 0.8 x last month's inflation
              + 0.1 x (expected inflation - last month's), if people expect more
              + 0.2 x (money growth - economy growth)
              + shortages

- money growth = money printed this month / money supply x 12, plus 2% of ordinary bank lending.
  Above 20% expected inflation people spend money faster, which multiplies the printed part by
  1 + (expected - 20) / 100.
- economy growth: in a growing economy the banks lend enough to match, so only a shrinking one
  counts (output lost over the past twelve months adds to inflation).
- shortages = 8 points x the share of consumer goods missing.
- expected inflation = 0.85 x last month's expectation + 0.15 x inflation.
- Rationing and price controls: printed money counts x 0.75 and shortages x 0.5.

With nothing printed and full shops this settles at 2%. Worked example: France at war prints 30m
a month with 1,740m in circulation. Money growth from printing = 30 / 1740 x 12 = 21% a year, so
inflation settles near 21 + 2 = 23%, reaching about half of that after three months.

The price level rises by inflation / 12 each month. Because debt is fixed in money while output
and taxes rise with prices, inflation shrinks debt as a share of output.

Above 10% stability falls; above 30% factories slow by 10% and bonds stop selling; above 100% is
hyperinflation (factories slow by 25%, stability falls a further 15).

### Guns or butter

    goods people need = 70% of civilian factories x (0.75 under rationing) x tax effect
    shortage = 1 - (factories making goods x conscription factor) / goods needed, never below 0

Civilian factories set aside for construction only stop making goods while there is something
to build. Up to 5 work on one project.

| Project | Factory-days | With 5 builders |
| --- | --- | --- |
| Military factory | 360 | 72 days |
| Civilian factory | 540 | 108 days |

You can build only in your own home provinces that you hold. Roads, forts, airfields and ports
are not in yet.

### Production lines and new divisions

There is one line per kind of division. Each day:

    equipment made = factories x line efficiency x output factor x steel x (oil, armour only) / cost

Cost in factory-days: infantry 120, artillery 180, armour 300. A line starts at 50% efficiency
and gains 0.25 points a day, so it reaches 100% after 200 days. Factories added to a line start
at 50% and pull its average down; taking factories away costs nothing; an emptied line starts
again from 50%.

Raising a division takes one set of equipment and 25,000 men (the division slice: about 15,000
in the division and its share of the supply troops, staffs and depots behind it; a new air wing
takes 20,000, crews, mechanics, airfields and flak), then 30 days of training
(artillery 40, armour 60). It joins the army at 40% organisation, at the capital while that holds
fewer divisions than half of what it can feed, otherwise in the least crowded home province.

**Steel and oil.** Each working military factory needs 1 steel. Each factory on the armour line
needs 1 oil and each armoured division 0.5. With imports on, anything missing is bought. With
imports off, lines run at the share of their need that is met. Until the navy arrives in Stage G
imports cannot be cut off.

### Manpower

| Law | Share of the people who can serve | Factory output |
| --- | --- | --- |
| Volunteers only | 1.5% | 100% |
| Limited conscription | 2.5% | 100% |
| Extensive conscription | 5% | 95% |
| Mass mobilisation | 10% | 88% |
| Every adult serves | 15% | 78% |

Only people in home provinces you still hold count; the people of annexed land count at half
(Austrians served, Czechs and Poles were not called up). Widening the law adds 40% of the
difference at once (the reservists) and puts the rest in a call-up queue, of which a sixth
reports each month; narrowing it takes from the queue first. Each step up costs 2 stability that
day, and the two widest laws cost 3 and 6 for as long as they last. Each year 6% of the law's
total comes of age.

**Refits first** (since 1.6). An AI country at war keeps back men for its worn divisions
before it raises new ones: once the army's average strength falls below 85%, half of what it
would take to bring every division back to full strength is kept for refits, all of it below
75%. Not while an enemy holds any of its home victory points: a country fighting on its own soil
raises every division it can. Before 1.6 Germany put every recruit into new divisions and went
from 320 divisions at 97% in 1941 to 380 at 40% in 1943.

**Wounded.** 40% of the strength a division loses, in battle or at the front, comes back to the
call-up queue as wounded men who recover. Britain starts
on volunteers, everyone else on limited conscription.

### Stability

    target = 75 - taxes above the threshold (1.2 a point) - inflation above 10% (0.5 a point, at most 30)
                - 15 in hyperinflation - 5 in fast deflation - 40 x shortage - 5 for rationing
                - 3 for each conscription law above "extensive"
                - 0.5 x (40 - war support), at war with war support under 40
                + 5, at war with war support of 70 or more
                + whatever finished plans add

    tax threshold = 25% + plans (tax reform: 3 points) + at war: 15 points x war support / 100

Each month stability moves a fifth of the way to the target. Below 50, strikes slow the
factories. Declaring war costs stability on the day if war support is under 50: 0.4 for each
point short in a democracy, 0.2 under an authoritarian government, 0.1 in a dictatorship.

**The government falls** when stability has been below 20 at three month-ends in a row. The
new government starts at 45 stability; the national plan under way is abandoned and war support
drops by 10. (The kind of government does not change yet; that needs diplomacy, Stage F.)

### War support

How willing people are to fight and to make sacrifices, 0 to 100.

    target = 35 in a democracy, 45 authoritarian, 55 fascist, 50 communist
           + 30 if the country is at war and somebody else declared it
           - 10 (democracy) or 5 (authoritarian) if every war it is in is one it started
           + at peace: 2 for each other country at war (at most 10), and 8 if a neighbour is at war
           - 60 x the share of home victory points in enemy hands
           + the mood from recent battles (-15 to 15)
           - war weariness (0 to 20)
           - inflation above 10% (0.3 a point, at most 15) - 25 x shortage
           - 5 for each conscription law above "extensive" in peacetime
           + whatever finished plans add

Each month it moves a fifth of the way to the target. A country that is attacked also gains 10
on the day. **Mood:** each battle won adds 2 and each battle lost takes 2 away, within 15 either
way, and the mood fades by a fifth a month. **War weariness** grows half a point for each month
at war and falls a point for each month of peace.

What it decides:

- **Conscription.** The three widest laws need war support of 30, 55 and 75. Authoritarian
  governments need 10 less and dictatorships 20 less.
- **Taxes.** At war the tax threshold above rises with war support.
- **Bonds.** At war, bond sales are multiplied by 0.7 + 0.6 x war support / 100.
- **The army.** At war with war support under 40, divisions regain organisation more slowly:
  x (0.7 + 0.3 x war support / 40).

### Research (`src/sim/research.ts`)

Four branches (infantry, armour and artillery, industry, economy and society) of four
technologies each. The navy and air branches arrive in Stage G. The major powers have two
research teams, other countries one; a team works on one technology at a time and a branch is
taken in order. The four steps of a branch belong to 1936, 1938, 1940 and 1942 and need 200,
280, 360 and 440 days of work. Ahead of its year a team is slower:

    speed = 1 / (1 + 0.5 x years ahead)

Work done is kept if a team moves to something else. The list, with every effect and a note on
the real history, is in the file and in the Research panel.

### National plans (`src/sim/plans.ts`)

One plan runs at a time, for 60 to 180 days, and each can be carried out once. While it runs it
costs a share of a month's output every month (0% to 6%), as a line in the budget. When it ends
it gives new factories (see Factories), equipment, money, or a lasting effect such as +10%
defence on home soil. Twelve plans are open to every country; each major power also has two
real programmes of the 1930s (for example Britain's shadow factories, France extending the
Maginot Line and Poland's Central Industrial Region), some only from the year they began.
Cancelling a plan loses the work done.

### What research and plans change (`src/sim/mods.ts`)

Every technology and finished plan carries a list of effects. A country's effects are added
together (two +10% effects give +20%) and read by the rest of the engine: attack and defence by
type of division, defence on home soil, how fast divisions recover, production line output and
learning, construction speed, steel and oil needed, tax income, bond sales, the cost of
rationing, the output lost to conscription, export prices, manpower, the goods people expect,
the interest lenders ask for, the tax threshold, stability and war support.

### The AI finance minister (`src/sim/aiEconomy.ts`)

Every country you do not lead forms new divisions whenever equipment and men are ready and the
shortfall stays inside its limit: 2% of output for democracies at peace, 3% for authoritarian
governments, 8% for the Soviet Union, 10% for the fascist dictatorships, and 20% for anyone at
war. A communist government that has lost 5% of its home victory points fights a total war and
goes to 35% (only up to what its land can feed). Since Stage J the limit shrinks as inflation
rises above 15% and is zero at 50%: a finance minister who sees prices running away stops adding
to the bill. On the first of each month it also moves taxes two points towards its limit (at most 35% at
peace, 45% at war), rations when shops run short, prices pass 15% or it is at war with a great power, widens
conscription in a serious war (a great power still standing, a war of 90 days, or one on its
soil) when men and the call-up queue cannot fill the equipment waiting in its depots, calls up
its reserves to extensive conscription at peace once the great powers are at war with each
other (armed neutrality, September 1939), queues as many construction projects as it has
builders for, gives idle military factories a line (60% infantry, 20%
artillery, 20% armour) and sets 15% to 25% of its civilian factories to building. It borrows
whatever it can and prints the rest.

It puts idle research teams on whichever technology is most due, weapons first for the
dictatorships and for anyone at war, industry first for the rest. When no national plan is
running and the budget can carry one, it starts its own real programmes first and then the
general plans in an order that fits it (arms for the dictatorships, industry and public works
for the democracies, the war economy for anyone at war).

## Diplomacy (`src/sim/diplomacy.ts`)

**Relations** run from -100 to 100 and are the same in both directions. Each month a relation
moves 2 points towards its resting point:

    resting point = governments + history + treaties + claims + missions

- Governments: two democracies +25, two fascist states +20, two communist +20, democracy and
  fascist -30, democracy and communist -25, fascist and communist -45. An authoritarian state
  is -5 with a democracy, +5 with a fascist state and -30 with a communist one.
- History: fixed 1936 figures, such as Britain and France +35 or Poland and the Soviet Union -30.
- Treaties: alliance +40, guarantee +20, non-aggression pact +15.
- A claim on the other's land: -30. A diplomatic mission: +30, at a monthly cost of 0.2% of
  a year's factory output.

Events move a relation at once: a war without a cause costs 20 with everyone (30 with
democracies, nothing with allies), a broken promise 15, a broken pact 25 to 40.

**World tension** runs from 0 to 100. An ultimatum adds 5, a country giving in 10, a war on a
small country 10, on a major power 20, a war without a cause 10 more, building a case 3, an
annexation 5. It falls 0.5 a month. A democracy may guarantee a country from tension 25 and
build a case for war from 50 (or at any time against a country that has already broken the
peace). At 50 and above every AI government accepts a larger deficit and builds arms
factories. In a country at peace, war support gains 0.2 points for every point of tension.

**A cause for war** is one of: a claim (permanent), a case built by `justify` (45 days for
fascist and communist states, 75 for authoritarian, 120 for democracies; it lasts a year), a
refused ultimatum, or a promise to a country under attack. Story mode refuses a declaration
without one. Free-for-all allows it at twice the stability cost.

**An ultimatum** demands a claim: join us, hand over a province, or accept our troops. The
target gives in only if both are true:

    no protector stands firm, and
    strength of the demander and its allies / strength of the target >= 1.5

An AI protector stands firm when its war support is 50 or more, or world tension is 60 or
more. A protector led by the player is asked. If the target gives in, protectors who looked
away lose their treaty with it. If it refuses, the demander has a cause for war; an AI
demander attacks when its odds reach the aim's threshold, and otherwise backs down, loses 5
stability and looks again after 180 days.

**Promises.** When a country is attacked, its allies and guarantors declare war on the
attacker, unless they are already fighting another major power. The attacker's own allies are
not obliged to join a war it started; it may ask them, and they weigh relations, tension and
the odds. A guarantee that is honoured becomes an alliance. The player is asked each time, has
7 days, and loses 10 stability and 15 points with every democracy for breaking a promise.

**War score**, from the point of view of A against B:

    score = 100 x (share of B's land points A holds - share of A's that B holds)
          + 20 x (A's strength - B's strength) / (A's strength + B's strength)
          + up to 15 for the gap in war support and war weariness
          - 8 for each other major power A is fighting, + 8 for each B is fighting

A country accepts a peace on the old borders when the score is against it, and a peace where
each side keeps what it holds when it is badly against it. Two major powers never settle a
plain stalemate; one of them has to be losing, or have war support below 25 after a year of
war. A country that owes an ally its freedom will not make peace with the conqueror unless it
is losing badly itself. Every peace starts a truce of 180 days.

## The AI's plans (`src/sim/agenda.ts`)

Each AI country has a list of dated aims taken from what really happened between 1936 and
1941: a treaty to sign, an ultimatum to send or a war to start. Each day the AI looks at the
aims whose date has come. An aim is carried out when its conditions hold: the government is
still the kind that wanted it, earlier aims are done, the target is not protected by someone
too strong, and for a war the odds are good enough:

    odds = (own strength + allies already at war) / (target's strength + a share of its protectors')

If the conditions do not hold, the AI looks again every 7 days, and drops the aim after three
years. So with no player the AI repeats history to the day, and a player changes it by
changing the conditions: a guarantee that is believed, a bigger army, a fallen government, an
earlier war. The country the player leads has no agenda at all.

Two rules are general rather than dated. The major democracies guarantee the countries an
aggressor still claims once it has broken the peace three times (or once, when tension is 50
or more). And every month each AI country at war asks whether peace would serve it better.

## Story mode (`src/sim/story.ts`, `src/sim/scenario.ts`)

**History cards** (`src/content/history.ts`) are filed on their real dates whatever has
happened. Each card's "in your game" line is worked out that day from the world as it stands
and saved with the card. Cards about crimes carry one fixed line instead: the game does not
model them.

**Decisions on real dates** reach the player as ordinary decisions with a deadline; if it runs
out, the answer is what the country really did. Marching into the Rhineland as France costs
Germany 10 stability and pushes every later German aim back 300 days.

**Spain** is fought off the map from 17 July 1936. Each great power that sends help adds to a
balance: Germany +1, Italy +1, the Soviet Union -1, France -2, Britain -2 (the last two never
did). On 1 April 1939 the Nationalists win if the balance is above zero, otherwise the
Republic survives. AI governments do what theirs really did, so the balance is +1 unless the
player changes it.

**The armistice.** When France falls to Germany, an AI Germany signs an armistice (a player
chooses): Germany keeps the north and the Atlantic coast; France gets back the south, Corsica,
North Africa and Syria, an authoritarian government, part of its army and a five-year truce
with Germany and Italy. If Paris is ever French again, the old government returns.

**Army effects** multiply a whole army's attack and defence for a time:

| Effect | Attack | Defence | When |
| --- | --- | --- | --- |
| Lost officers (Soviet Union) | x 0.85 | x 0.90 | 11 June 1937 to 30 June 1942 |
| Caught by surprise | x 0.60 | x 0.60 | 150 days, for a great power attacked in breach of a non-aggression pact while at peace with everyone else |
| The shock of 1940 (France, Belgium) | x 0.65 | x 0.65 | 120 days from the day Germany, at war with France, attacks Belgium or the Netherlands |
| Surprise landing (Oslo) | x 0.60 | x 0.60 | 30 days, for the defender |
| Winter | x 0.75 | | December to February, for an outsider attacking into the Soviet Union, Finland, Norway or Sweden |
| The Balkans, April 1941 (Greece, Yugoslavia) | x 0.60 | x 0.60 | 60 days from the day Germany attacks Greece while Italy is already at war with it |
| Mussolini has fallen (Italy) | x 0.80 | x 0.80 | the 45 days between the fall and the armistice |

**The Far East.** From 29 July 1938 (the border war with Japan) an AI Soviet Union keeps a
quarter of its infantry in the Far East, off the map: each month the newest infantry from the
interior goes there until it holds 25%. Those divisions still cost upkeep. From 15 October 1941,
if the Soviet Union is fighting a great power, two fifths of them come back to Moscow at full
strength in two waves, on the first of November and of December (the Siberian divisions).

**Allies in time of need.** When Germany attacks Norway, or the Axis attacks Greece, while an AI
Britain is already at war with the invader, the victim joins Britain (and France, if it is
fighting) in an alliance.

**Italy changes sides.** From 25 July 1943 an AI Italy whose fascist government is at war with
Britain loses Mussolini once an enemy stands on Italian soil in Europe, or once Libya is lost
and war support is under 35. The new government is authoritarian, war support drops to 20, and
for 45 days the army fights at x 0.8 and the country does not surrender. Then it signs an
armistice: peace with every enemy, an alliance with Britain, and the end of its alliance with
Germany. An AI Germany then carries out Operation Achse: it takes every Italian province its
divisions stand in, and every Italian province it can reach by land from its own side that is
not next to Allied troops or Allied land (northern and central Italy, Albania and the Italian
zones in the Balkans), disarms the Italian divisions there, and declares war. Only the south,
where the Allies have landed, stays Italian. After the armistice Italy fights on like a small
country (see Surrender), and an AI Italy keeps at most 8 divisions (the Co-Belligerent Army,
about six division-sized combat groups). Before 1.6 the Italian army stayed whole, raised 100
more divisions within months and marched into Austria.

**Total war.** On 18 February 1943 (Goebbels' speech after Stalingrad) a fascist Germany at war
with the Soviet Union calls up 1,000,000 more men, who report over the following months like any
call-up, and gains 5 war support.

**Greece gives up** once an AI Greece at war with Germany has lost all of Epirus and Salonika:
the army in the north is cut off and surrenders, and the King and the government leave for
Crete and Egypt (April 1941). Allied divisions in Greece are taken home. Before 1.6 the Greek
army held the one pass into Attica for ever.

**Fuel.** From 1 November 1942 an AI Italy keeps its fleets in port: it had no oil for them.

**Operations overseas** (`src/sim/operations.ts`) are the timetable of the real expeditions and
landings, carried out by an AI Britain:

| Operation | From | Kind | Where | First wave | Up to |
| --- | --- | --- | --- | --- | --- |
| Norway | 12 April 1940 | help | Narvik and central Norway | | 4 divisions, called home 25 days after the attack in the west begins or when France falls |
| Greece | 7 March 1941 | help | Attica, Salonika | | 5 |
| Sicily | 10 July 1943 | landing | Sicily, then Calabria, then Sardinia | 8 | 20 |
| Salerno | 3 September 1943 | landing | Calabria, Campania, Apulia (once Sicily is taken) | 8 | 24 |
| Normandy | 6 June 1944 | landing | Normandy, then Brittany, then Holland | 10 | 50 |
| Provence | 15 August 1944 | landing | Provence, Languedoc | 6 | 12 |

An operation waits while its conditions are not met (for Sicily: Britain must be at war with
Italy), and is given up after its last day. A landing needs the sea off the beach (see The
sea), so the British fleets away from home waters gather off the beach while a landing is due,
if together they are stronger than the enemy there by a fifth.

**Lend-Lease** adds equipment to the stock each month, free: to Britain from 11 March 1941
(0.6 infantry sets, 0.2 artillery, 0.2 armour, 0.3 fighter wings, 0.15 bomber wings, 0.3 escort
flotillas) and to the Soviet Union from 1 October 1941 (0.6 infantry, 0.3 armour, 0.3 fighter),
while each is at war with Germany.

**History kept loosely** shifts every AI aim by a fixed number of days drawn from the seed,
between 45 days early and 150 days late.

**The September 1939 start** runs the engine from 1 January 1936 for 1,339 days with every
country led by the AI and the fixed seed `prelude-1939`, then gives one country to the player.

**Chapters** (`chapters.ts`) check their objectives on their last day: 31 August 1939, 21 June
1941 and 8 May 1945.

**The end.** Story mode ends when the player surrenders; on 8 May 1945; when the great powers
have been at war and are at peace again for 90 days; or, in the 1939 scenario, on 1 January
1942. The report (`report.ts`) only reads the world; victory points are those of the provinces
a country controls.

## Free-for-all (`src/sim/opportunist.ts`)

All pacts are removed and every historical aim is dropped. After a quiet first 90 days, at the end of each month every AI
country at peace rolls seeded dice: a fascist government looks for a war with a chance of 25%,
a communist one 20%, an authoritarian one 10% and a democracy 2%. It attacks the neighbour it
has the best odds against, if those odds are 1.8 to 1 or better (the same odds formula as
above, protectors included). A country with a hostile neighbour 1.5 times its strength
proposes an alliance to another neighbour of that danger. Each month a major power has a 5%
chance, and a small country 2%, of one random event: stability +4 or -4, 40 days of research,
or a bank failure costing 15% of a month's output. The game ends after 3,653 days.

## Surrender and occupation

A country surrenders when its enemies control 60% of the victory points of its own land, or
40% once they hold its capital (France asked for an armistice eight days after Paris fell).
Land it has annexed since 1936 counts for a quarter of its victory points. Three exceptions:
a small country fights on while it holds some of its homeland and a great power fighting the
same enemy has divisions on its soil (Norway in 1940); in Story mode, a government negotiating
an armistice does not surrender (Italy, 1943); and in Story mode the Soviet Union, fighting a
fascist Germany, gives up only when the enemy holds 85% of its victory points, capital or not
(the government was ready to fight on from Kuibyshev): Moscow, Leningrad, Kiev, Minsk,
Stalingrad, Baku and most of the land between them. It was 75% before 1.6.

In Story mode no AI country makes a negotiated peace with a fascist Germany or Italy (or their
allies beside them): the real war in Europe ended only in surrender, an armistice or a change
of sides. Border wars for a few provinces are not affected. Its
army leaves the map and the enemy holding most of it occupies the rest of its homeland;
occupied factories work at 30%. Countries it had conquered itself are restored, and land it
took from others goes back. An attacker with a limited aim (eastern Poland, Bessarabia, the
Karelian border) annexes only that. The occupier may then annex the country (its factories
work fully and its people can be conscripted, at the price of tension and relations) or set up
a friendly government (the country returns as an ally with a small army).

When stability brings a government down, the kind of government changes: democracy to
authoritarian, authoritarian to democracy, fascist or communist to authoritarian. An AI
country's historical aims belong to the government that had them, so they end with it.

## The sea (`src/sim/sea.ts`, `src/sim/navy.ts`)

The sea around Europe is cut into 17 zones. A province with a coast lies on one or more of
them. Nobody steers ships: a fleet has a zone and a mission, and takes 2 days to cross each
zone on its way to a new one.

**Strength.** A capital ship counts 10, an escort flotilla 3, a submarine flotilla 1. A fleet
on patrol counts in full, on escort 70%, on a raid or in port nothing. Naval bombers in range
add 6 per wing at full strength.

**Control**, worked out each day for each country and zone:

    own        its side has at least 2 x the enemy's strength, and a ship there
    enemy      the enemy has at least 2 x its side's strength
    contested  both are there and neither has twice the other
    open       nobody is there

**Battle.** Each day a surface fleet in a zone with enemy strength loses

    share of its ships lost = 1.5% x enemy strength x luck (0.7 to 1.3) / its own strength

Ship counts are fractions (2.5 is two ships and a damaged one). A fleet under half a ship is
destroyed. Ships are not repaired; new ones come from the ship lines.

**Convoys.** Each country's imports cross a fixed route from the ocean to its home waters
(Britain: the Western Approaches). In each zone of the route:

    raiders  = submarines + 2 x capital ships + 0.5 x escorts of enemy fleets on Raid
    escorts  = escort flotillas of friendly fleets on Escort (30% for fleets on Patrol)
    sunk     = raiders / (raiders + 2 x escorts + 6), at most 70%
               90% if the enemy controls the zone outright

The shares multiply along the route. Escorts sink raiders: submarines lost a day = 0.4% x
enemy escort strength x luck.

    imports lost = share sunk x share of the country's imports that go by sea

That share is 100% for Britain, 80% for Italy, 60% for France, 15% for the Soviet Union, 10%
for Germany (ore from Sweden and oil from Romania come overland or across the Baltic), and 50%
for other countries with a coast. Lost imports mean less steel and oil for the factories, and
for half of the loss, fewer goods in the shops, which pushes prices up.

**Troops by sea.** A division on a coast can be shipped to any other coast it can reach
through zones the enemy does not control.

    to a friendly shore   3 days + 2 for each further zone
    landing               14 days + 2 for each further zone; the zone off the beach must be
                          your own; at most 2 divisions + 1 per friendly ship there at a time

A division coming ashore attacks at 60% (less of a penalty with Landing craft). Ports matter
for supply: troops overseas are in supply only while a coastal province linked to them opens
onto a sea the enemy does not control.

## The air (`src/sim/air.ts`)

An air wing is about a hundred aircraft, fighters or bombers, with a base and a mission.
Fighters reach 400 km from the base, bombers 800 km. Moving to a new base takes 3 days.

**The sky over a province.** Each side's air score there is

    fighters on Air superiority in range (x strength)
    + 0.7 x bombers on Ground support in range

The side with at least 1.5 x the other's score, and at least 0.5, controls the sky: in a land
battle there it hits 15% harder and the other side 15% less hard.

**Losses.** Each day a flying wing loses strength where enemy fighters can reach it:

    loss = 0.3 x threat x luck / (1 + threat + cover)

where threat is the enemy fighter score and cover its own side's. Bombers on a raid also lose
a little to the defences. Wings refill from the aircraft in store, faster when resting.

**Strategic bombing.** Each bomber wing puts 0.3% of the factories of its target province out
of action per day, up to half of them; the damage mends by 1.5% of itself a day. The target is
the enemy province in range with the most working factories. Bombing also lowers war support
and stability a little in the country being bombed.

**Naval strike.** Bombers add to their side's strength in every sea zone in range, so they
help hold a sea and wear down enemy fleets there.

## Land, sea and air together (`src/sim/strike.ts`, `src/sim/forces.ts`)

Stage K3 adds ways to put the navy and the air force behind one attack.

**Aimed wings.** A wing on Air superiority, Ground support or Strategic bombing can be aimed at
one province in its reach. It then flies only there: it counts 1.5 times in the air score over
that province and nowhere else. Moving the wing out of reach, or giving it Naval strike or
Rest, drops the aim.

**Close air support.** Each bomber wing aimed at a province on Ground support adds damage to
its side in a battle there:

    damage a day = 3 x strength / 100 x (1 + bomber research) / (1 + enemy fighters over it)

**Shore bombardment.** A fleet on Patrol can be aimed at a coastal province on its zone. Once
it has arrived, and unless the enemy controls the zone, it adds

    damage a day = 3 per capital ship + 0.5 per escort flotilla (x naval research)

halved if the zone is contested, at most 20 for each side of a battle. Ships that shell a
battle lose 0.3% of themselves a day to coastal guns.

**Softening up.** Divisions in a province that enemy bombers or ships are aimed at cannot dig
in: they lose a day of digging in each day instead of gaining one.

**Scouting.** A wing on Scouting must be aimed at a province. While it flies, its country sees
every division in that province and the ones next to it. Enemy fighters over the target shoot
some down: loss a day = 0.15 x threat / (1 + threat).

**Paratroopers.** A division type that needs the Airborne forces research (attack 13 and defence
13, against infantry's 10 and 15; equipment 220, upkeep 0.5, 75 days of training). A drop needs a friendly
province to take off from, a target within 400 km (more with aircraft range research) that is
not neutral, and organisation of at least 60. The divisions jump 3 days after the order:

    the jump costs 20 organisation, and strength: 30 under an enemy sky, 10 under a contested one
    an empty enemy province is taken at once (land of an ally still at war goes back to it)
    a province with enemy divisions: they join the attack there from a new direction, as a
    landing does, and fight at 70%; if their organisation falls below the break-off point
    they cannot retreat, and are captured

**Joint attacks.** The menu's Joint attack aims the bombers and fighters in reach and the
warships that can reach the sea off the province, and keeps a record of the attack. Each
morning, once its wings can fly and its fleets have arrived (or after 10 days in any case), its
divisions march (or jump). For a landing the divisions start their preparation at once and
wait at the end of it until the sea off the beach is theirs, for up to 45 days from the order.
Another order to one of its divisions takes that division out of the joint attack.

**The attack menu.** Every option and its preview is worked out by `attackMenu()` from what the
country can see, with the same outlook as the battle itself. The forecast assumes today's
damage rates hold: the attack wins when the defenders run out of organisation or the front
line reaches 100 before the attackers run out themselves, looking ahead at most 60 days.

**The AI.** Ground-support bombers aim at the battle with most of the country's attacking
divisions (or, failing that, its defence with most divisions). Fleets on patrol shell coastal
battles their side is attacking, landings first. Germany, the Soviet Union, Italy and Britain
research Airborne forces (about half a year late) and give 4% of their army to paratroopers;
they drop on an empty province behind the enemy front or into a battle they are winning, never
under an enemy sky, at most 3 divisions a day.

## Starting armies

Divisions start in the homeland (the land connected to the capital), on the capital and the
foreign borders first, at most half of what each province can supply. About 15% of the army
garrisons overseas territories, one division each, the richest first.

## Armies (`src/sim/armies.ts`, `src/sim/commanders.ts`)

Since 1.3 the player can group divisions into armies (an AI country does not use them: its army
commander below leads its whole army). An army has a name, a number key from 1 to 9 (the
lowest free one when it is formed; a tenth army has none), its divisions, one order and,
optionally, a commander. A division belongs to one army at most. Armies are part of the world,
so they are saved and give the same orders on every computer.

Each day, before the player's own orders and the AI's, every army turns its order into orders
for its divisions. On the day an order is given the army takes back all its divisions; on later
days it leaves alone any that the player has marched by hand, until its next order.

| Order | What the army does |
| --- | --- |
| None | Nothing: the player moves its divisions. |
| Hold (a country) | Spreads over the line of friendly provinces that touch that country, by weight: 1 + the country's divisions next door + 0.5 for each of its provinces next door + 2 for a city of your own with 10 victory points or more. Each province gets its share, up to what it can feed (after the divisions there that are not the army's); the rest stand in the depth behind. A division already in the right place stays. No attacks: those under way are called off on the day of the order. |
| Hold (the ground around a province) | What a push becomes when its target is taken: the province and the land next to it facing the enemy, weighted 1 + the enemy pressure there (+1 for the province itself). |
| Push (a target, a pace) | At war: the AI army commander, for this army alone, on one front, attacking only the enemy provinces on the axis (below), at the pace's margin: careful 1.6, steady 1.3, all-out 1.0. It never waits for the whole front to be strong enough, as the AI does. At peace: deploys on the stretch of border nearest the target, weighted 1 / (1 + steps to the target) squared. When the target is held by the army's country or an ally, the order becomes Hold the ground around it. |
| Fall back (a province) | No attacks, every day. The line is the province and the friendly land next to it that faces the enemy (weight 1 + enemy pressure, +1 for the province); the rest stand behind. Divisions of the army dig in twice as fast (4% a day, still up to 20%). |
| Reserve (a province) | Stands at the province and the land next to it. When a friendly province within 2 steps is under attack and its line is 30 or more in, the nearest divisions go to help, up to what it can feed. When the enemy holds a province of yours or an ally's within 2 steps, the reserve counter-attacks if it can bring 1.2 times the defence. |

**The axis of a push.** Once the target is on the front (next to friendly land) the army attacks
only it, unless it is too strong to take head on: it holds more than a third as many divisions
as the army, or the army has not attacked it for 10 days. Then the army may also attack the
front provinces beside it, to go round it. Before the target is on the front, the army attacks up
to three front provinces, those with the lowest score = steps to the target + half the steps from
the army's centre (the province holding most of its divisions), within 1 of the best. So an army
coming from the south does not wander round to attack its target from the north.

**New divisions.** One army at a time may be set to take new divisions: each new division
joins it on the day it is raised. Divisions that are destroyed leave their army; an army whose
country surrenders is gone.

**Pincers.** Two armies of one country pushing against the same enemy, at the same target or at
targets next to each other, whose directions from the target to each army's centre are at
least 60 degrees apart, form a pincer. The map labels it with the number of enemy (and allied
enemy) divisions that would lose their link to a depot if both targets were taken today. The
jaws are closing when each army's centre is within 2 steps of its target; the news reports it
once, the day it starts.

**Commanders.** 24 real generals, four or five for each playable country, each with one trait:
bold (the army's divisions attack x 1.1), careful (they defend x 1.1) or good at supply (they
regain organisation x 1.25 as fast). A commander leads one army of his own country at a time.
Each has a codex entry: what he did, and, where a general took part in or was tried for crimes,
that too.

## The army AI (`src/sim/ai.ts`)

Leads the armies of every AI country at war, and of every country with a war planned in the
next 45 days (100 days for a war on a great power), so that the army is in place on the day.

**Fronts.** Each enemy is one front: the friendly provinces next to it (the line), the
provinces one step behind (the depth), and the enemy provinces it can attack. A front's room is
what its line and depth can feed (Supply). A front whose war is only planned gets a guard of one
division per line province. A front against a small country wants enough to beat it: twice the
enemy divisions near it, plus two, at most its room. A front against a great power wants 1.5
times its room (the extra waits behind). The army is shared out in that order: every guard
first, then the small fronts, then the great ones in proportion to the enemy divisions facing
them. A big army (30 divisions or more) keeps a tenth at home while a great power is an enemy:
since 1.6 those divisions really stand inside the homeland, and divisions no front needs go home
until the reserve is full. It is not kept while the main front itself runs across the homeland
(the Soviet Union from June 1941). An enemy standing on the homeland along any other front (a
landing behind the lines) is met first, before the small fronts, with twice the enemy divisions
there plus two, and that front may also take the home reserve. Before 1.6 Germany had 2 of its
300 divisions inside Germany in 1943, and a British landing in Jutland walked into Berlin. A front overseas gets what its
operation calls for (see Story mode), or at most an eighth of the army, and nothing once its
expedition has been called home.

**Offensives.** When the divisions on a front outnumber the enemy's by 1.2 to 1 or more, the
whole front attacks: it needs only 0.7 of the usual edge and keeps a smaller guard. Below 0.6
to 1 it only defends and finishes battles already started.

**A reeling enemy** (since 1.3). Against an enemy caught by surprise or in shock, attacks go in
at 0.75 of the usual margin, before it can recover.

**Choosing targets.** Each enemy province the front can reach scores (victory points + 2 x the
number of enemy divisions that would be cut off + 1) / (its defence + 1). An attack that would
cut off two or more enemy divisions needs 15% less of an edge. Undefended provinces get one
fast division. A defended one is attacked only if the divisions that can join, from every
direction, are expected to outlast the defenders (the odds formula above) by the AI's margin
of 1.3, or 1.04 if a battle there is already under way. Each province next to the target keeps
a guard back: one division plus a third of the other enemy divisions next to it, never more
than a quarter (offensive) or half of what the province can feed.

**Moving up.** Divisions go first to their country's great cities in the line (the capital and
any city of 10 victory points or more, kept at full strength), then to the provinces next to
the three best targets, then anywhere in the line with room, then the depth. A division in a
province more than a quarter overcrowded steps back to the nearest province with room. Those
below 25 organisation pull out of the line to rest. A division already standing on its front
stays unless the move is clearly better (since 1.3), so the line does not shuffle sideways
every day.

**By sea.** Divisions that cannot reach a front on foot go to a front overseas through the
nearest friendly port, sail on the expeditions and landings of the timetable, and otherwise
make a landing of their own only when most of the army has no front on land: on a coast whose
sea the country controls, with at least 4 rested divisions, where the enemy cannot answer with
twice as many, and (since 1.3) never on a stretch of coast the timetable keeps for a later
landing of the same country, so Britain does not land in northern France years before Normandy, nor (since 1.5 for Germany, 1.6 for Denmark) on the German or Danish coast before it. A communist country and the others fight the same enemy on separate fronts:
neither ships divisions to a front in the other's land.

**Total war** (`src/sim/aiEconomy.ts`). An AI country with a communist government fighting
on its own soil (the Soviet Union from 1941) forms every division it has equipment and men
for, whatever the budget, until its army reaches 90% of what the land it holds can feed.
