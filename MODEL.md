# How the game works: the rules and the numbers

This file lists the rules of each system as they are in the code right now. Maths is written
in plain text. The numbers were tuned with `npm run balance` (see
[docs/balance-stage-e.md](docs/balance-stage-e.md)) and will be tuned again as later stages
add diplomacy and air power.

## The day

`step(world, orders)` moves the world on one day, always in this order:

1. Orders are applied (move, halt, declare war, make peace, and everything about the economy).
2. Every economy runs for a day: taxes and bills, production lines, construction, training,
   research and the national plan. On the last day of a month, inflation, stability and war
   support are worked out.
3. Supply is worked out for every division.
4. Every battle fights one round.
5. Divisions march.
6. Divisions rest, refill, dig in or go hungry.
7. Countries that have lost too much surrender.

## A day with a player (`src/sim/game.ts`)

`advance(world, playerOrders)` is one day of a game you play yourself: your orders, plus the
test AI's orders for every other country that is at war, plus the AI finance minister's orders
for every other country, then `step`. Countries at peace run their economies but make no moves.
Orders for divisions or economies that are not yours are dropped.

`applyOrders(world, orders)` carries out orders without a day passing, so the map can show a
march the moment you order it, even while paused. `step(applyOrders(w, orders))` gives exactly
the same world as `step(w, orders)`.

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

    damage = sum of [ attack or defence x strength/100 x terrain x dig-in x supply ] x luck

- **attack or defence**: attackers use attack, defenders use defence.
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
  one nearest its capital). If there is none, it surrenders and is removed.
- An attacker below 10 organisation stops attacking and stays where it was.
- When no defenders are left, the attackers win and walk in. They press forward during the
  battle, so they usually arrive the same day. Arriving captures the province.
- When no attackers are left, the defenders win.

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

Not in yet: air power (Stage G) and river crossings (the map has no rivers yet).

## Supply (`src/sim/supply.ts`)

    supply = 0                                   if the division is cut off
    supply = min(1, capacity / divisions there)  otherwise

- **Cut off** means no path, through provinces your country controls, back to one of your
  depots. A depot is your capital, or the biggest city of each separate piece of your home
  territory (for France: Paris, Algiers, Corsica and Damascus). It only works while you hold it.
- **Capacity** of a province = 4 + 3 x infrastructure. Infrastructure runs from 1 to 5: plains
  3, forest 2, hills 2, marsh 1, mountains 1, desert 1, plus 1 for a big city and plus 1 for a
  capital. So open country feeds 13 divisions, a mountain province 7 and a capital up to 19.

What supply does:

- In battle, low supply cuts damage (see above).
- Organisation cannot stay above 100 x supply. Above that it falls 3 a day; a rested division
  below it regains 3 a day (half that while marching).
- A cut-off division at 0 organisation loses 2 strength a day until it is gone.
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
| Army upkeep | infantry 0.3m, artillery 0.45m, armour 0.6m per division; **x 3 at war** |
| Military factories | 2m for each one working |
| Construction | 2m for each civilian factory building |
| Imports, exports | steel 1.5m, oil 2.5m a unit; exports earn half price |
| Interest | debt x average interest rate / 12 |

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

    lenders buy up to 25% of a month's output x confidence
    confidence = (1 - (debt ratio - 1.5) / 1.5)   falls from debt of 150% of output, gone at 300%
               x (1 - (inflation - 10) / 20)      falls from 10% inflation, gone at 30%
               x (1 - 1.5 x home points lost)     people lend to likely winners

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

Raising a division takes one set of equipment and 15,000 men, then 30 days of training
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

Only people in home provinces you still hold count. Changing the law adds (or removes) the
difference at once; each step up costs 2 stability that day, and the two widest laws cost 3 and
6 for as long as they last. The pool also grows by 2% of the law's total a year. Britain starts
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
it gives new factories in the capital, equipment, money, or a lasting effect such as +10%
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
war. On the first of each month it also moves taxes two points towards its limit (at most 35% at
peace, 45% at war), rations when shops run short, widens conscription when men run out in
wartime (if war support allows), gives idle military factories a line (60% infantry, 20%
artillery, 20% armour) and sets 15% to 25% of its civilian factories to building. It borrows
whatever it can and prints the rest.

It puts idle research teams on whichever technology is most due, weapons first for the
dictatorships and for anyone at war, industry first for the rest. When no national plan is
running and the budget can carry one, it starts its own real programmes first and then the
general plans in an order that fits it (arms for the dictatorships, industry and public works
for the democracies, the war economy for anyone at war).

## Surrender

A country surrenders when its enemies control 60% of the victory points of its home provinces.
Its army leaves the map and, for now, the enemy holding most of it takes over everything it
still controlled. Proper peace terms come in Stage F.

## Starting armies

Divisions start in the homeland (the land connected to the capital), on the capital and the
foreign borders first, at most half of what each province can supply. About 15% of the army
garrisons overseas territories, one division each, the richest first.

## The test AI (`src/sim/ai.ts`)

Used for AI against AI test wars until the real AI arrives in Stage F. Each day it walks into
undefended enemy provinces, attacks a defended one only if it expects to outlast the defenders
by a margin of 1.3, pulls out divisions below 25 organisation, moves divisions out of
overcrowded provinces and sends spare divisions towards the weakest valuable point in the
enemy line.
