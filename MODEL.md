# How the game works: the rules and the numbers

This file lists the rules of each system as they are in the code right now. Maths is written
in plain text. The numbers were tuned with `npm run balance` (see
[docs/balance-stage-b.md](docs/balance-stage-b.md)) and will be tuned again as later stages
add factories, research and air power.

## The day

`step(world, orders)` moves the world on one day, always in this order:

1. Orders are applied (move, halt, declare war, make peace).
2. Supply is worked out for every division.
3. Every battle fights one round.
4. Divisions march.
5. Divisions rest, dig in or go hungry.
6. Countries that have lost too much surrender.

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

**Battle reports.** When a battle ends, a report records who won, the losses and up to three
causes, biggest first (for example "attacking into mountains", "the attackers were short of
supply", "3 surrounded divisions had nowhere to retreat and surrendered").

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
- A rested, supplied division regains 0.2 strength a day. This stands in for manpower until
  Stage D.

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
