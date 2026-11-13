# Balance report, Stage E: 200 AI against AI wars, 24 finance playtests and four years of peace

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 100% | 0% | 0% | 94 | 0.0 | 6.9 | 24 | 79% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 65% | 35% | 0% | 231 | 3.8 | 8.7 | 48 | 78% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 20 | 0.7 | 0.7 | 2 | 95% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 26 | 0.6 | 5.6 | 3 | 67% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 0 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 74 | 0.0 | 5.5 | 47 | 100% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 111 | 0.0 | 6.8 | 25 | 64% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 62 | 0.0 | 2.0 | 8 | 74% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 5% | 0% | 95% | 220 | 0.0 | 2.5 | 27 | 84% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

"Divisions lost" compares strength on the field at the start and the end, so divisions raised
during the war count against losses and the figure can be zero for a side that grew.

## Paying for a war

Each major power is put at war for four years with a country it cannot reach, so nothing is
lost in battle and the only difference between runs is how the war is paid for. The other
country declares the war, so the public supports it (war support starts near 65 in the
democracies and 85 in the dictatorships, and wears down as the war drags on). Conscription is
"extensive". The AI raises divisions and builds arms factories until the shortfall reaches 20%
of output; the money policy is fixed:

- **Tax**: taxes at 45%, bonds for the rest.
- **Borrow**: taxes left at 25%, bonds for the rest.
- **Print**: taxes left at 25%, everything else printed.
- **Mixed**: taxes at 35%, bonds for the rest, rationing.

| Country | Policy | Divisions | Military factories | Highest inflation | Prices after 4 years | Debt, % of a year's output | Lowest stability | Factory speed at the end | Share of shortfall printed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | Tax | 11 to 151 | 24 | 2% | x 1.1 | 58% | 59 | 88% | 0% |
| United Kingdom | Borrow | 11 to 78 | 18 | 2% | x 1.1 | 104% | 71 | 95% | 0% |
| United Kingdom | Print | 11 to 81 | 18 | 63% | x 3.8 | 12% | 47 | 83% | 100% |
| United Kingdom | Mixed | 11 to 109 | 20 | 2% | x 1.1 | 87% | 66 | 93% | 0% |
| France | Tax | 32 to 110 | 19 | 2% | x 1.1 | 89% | 59 | 88% | 0% |
| France | Borrow | 32 to 61 | 8 | 2% | x 1.1 | 128% | 73 | 95% | 0% |
| France | Print | 32 to 60 | 8 | 66% | x 5.0 | 12% | 46 | 83% | 100% |
| France | Mixed | 32 to 80 | 13 | 2% | x 1.1 | 111% | 65 | 93% | 0% |
| Germany | Tax | 30 to 188 | 26 | 2% | x 1.1 | 69% | 63 | 88% | 0% |
| Germany | Borrow | 30 to 100 | 19 | 2% | x 1.1 | 113% | 73 | 95% | 0% |
| Germany | Print | 30 to 100 | 19 | 59% | x 4.1 | 12% | 52 | 86% | 100% |
| Germany | Mixed | 30 to 137 | 22 | 2% | x 1.1 | 98% | 70 | 93% | 0% |
| Italy | Tax | 28 to 70 | 11 | 2% | x 1.1 | 104% | 63 | 88% | 0% |
| Italy | Borrow | 28 to 38 | 6 | 2% | x 1.1 | 133% | 68 | 95% | 0% |
| Italy | Print | 28 to 39 | 6 | 71% | x 6.2 | 10% | 47 | 84% | 100% |
| Italy | Mixed | 28 to 50 | 8 | 2% | x 1.1 | 127% | 68 | 93% | 0% |
| Soviet Union | Tax | 74 to 211 | 26 | 2% | x 1.1 | 89% | 62 | 88% | 0% |
| Soviet Union | Borrow | 74 to 131 | 19 | 2% | x 1.1 | 126% | 73 | 95% | 0% |
| Soviet Union | Print | 74 to 132 | 19 | 67% | x 5.1 | 11% | 48 | 84% | 100% |
| Soviet Union | Mixed | 74 to 164 | 22 | 2% | x 1.1 | 113% | 69 | 93% | 0% |
| Poland | Tax | 28 to 50 | 8 | 2% | x 1.1 | 105% | 62 | 88% | 0% |
| Poland | Borrow | 28 to 28 | 3 | 3% | x 1.1 | 147% | 67 | 95% | 0% |
| Poland | Print | 28 to 28 | 3 | 96% | x 9.3 | 7% | 45 | 82% | 100% |
| Poland | Mixed | 28 to 32 | 3 | 2% | x 1.1 | 130% | 67 | 93% | 0% |

## Four years of peace

Every country is led by the AI from 1 January 1936 to 1 January 1940 and nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | 11 to 50 | 30 + 8 to 44 + 11 | 8 of 16 | 9 | Shadow factories, Ministry of Supply | 80 | 43 | 34% |
| France | 32 to 73 | 22 + 7 to 34 + 9 | 8 of 16 | 9 | Nationalise the arms industry, Extend the Maginot Line | 75 | 40 | 34% |
| Germany | 30 to 120 | 34 + 12 to 36 + 31 | 8 of 16 | 9 | Four Year Plan, Westwall | 68 | 59 | 57% |
| Italy | 28 to 77 | 13 + 6 to 15 + 18 | 8 of 16 | 9 | Autarky campaign, Alpine Wall | 63 | 58 | 58% |
| Soviet Union | 74 to 297 | 32 + 16 to 36 + 37 | 8 of 16 | 10 | Third Five-Year Plan, Universal military duty | 64 | 55 | 54% |
| Poland | 28 to 61 | 8 + 3 to 15 + 5 | 8 of 16 | 10 | Central Industrial Region, National Defence Fund | 72 | 53 | 28% |

## What the results say

### Wars

- **Almost the same as Stage D.** Most test wars are over before the first technology is
  finished (about 200 days), and both sides research at the same pace, so research does not
  tip these wars. Germany against France, the one long war, moves from 60% to 65% for Germany.
- Research and forts will matter more in wars that start late, after years of preparation.
  That needs the AI to start wars by itself (Stage F) before it can be measured.

### Paying for a war

- **The Stage D lessons hold.** Taxing buys the biggest army, borrowing piles up debt, and
  printing multiplies prices by 4 to 9 and still leaves stability lowest.
- **A war people support is easier to pay for.** With war support high, taxes at 45% now leave
  stability near 60 instead of 51, because people accept more tax in a war they believe in,
  and bonds sell well enough that almost nothing has to be printed.
- **An unpopular war is the opposite.** In an earlier run where each country started the war
  itself, the democracies' war support fell to about 25: stability under the Tax policy dropped
  to 35, bonds sold badly and part of the shortfall was printed.

### Four years of peace

- Every major power finishes 8 of the 16 technologies by 1940 (the 1936 and 1938 steps of each
  branch), which is the pace the years on the technologies intend.
- Each carries out 9 or 10 national plans, including both of its real programmes.
- War support drifts up a little in peacetime (civil defence, and Poland's National Defence
  Fund), but the democracies stay near 40: too low for mass mobilisation until they are attacked.

## Known weak spots, to revisit in later stages

- **Too many plans get done.** At 9 or 10 plans in four years, a country has done most of the
  list by 1940, so the choice is mostly about order. Longer or dearer plans, or more of them,
  would make the choice sharper. Worth a look once Story mode sets the pace (Stage H).
- **The AI researches everything in step.** All six powers know the same 8 technologies in
  1940. Stage F should give each country its own priorities.
- **Peacetime war support has few levers.** Until diplomacy brings threats and guarantees
  (Stage F), a democracy at peace can only raise it with two plans.
- Armies left at peace until 1940 are still too large for Britain and the Soviet Union (as in
  Stage D); the AI has no reason yet to stop arming.
- Finland still falls too easily (no winter, no difference in army quality yet).
