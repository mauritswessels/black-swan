# Balance report, Stage G: 200 AI against AI wars, 24 finance playtests, four years of peace and three runs of history

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 85% | 15% | 0% | 81 | 0.0 | 3.2 | 12 | 70% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 55% | 40% | 5% | 319 | 2.0 | 6.7 | 52 | 73% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 19 | 0.6 | 0.8 | 2 | 93% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 23 | 0.5 | 7.0 | 3 | 67% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 0 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 73 | 0.0 | 3.9 | 33 | 99% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 92 | 0.0 | 5.0 | 13 | 69% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 72 | 0.0 | 3.9 | 9 | 67% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 0% | 0% | 100% | n/a | 0.0 | 7.3 | 38 | 87% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| United Kingdom | Tax | 11 to 137 | 24 | 2% | x 1.1 | 57% | 59 | 88% | 0% |
| United Kingdom | Borrow | 11 to 72 | 17 | 2% | x 1.1 | 105% | 71 | 95% | 0% |
| United Kingdom | Print | 11 to 68 | 18 | 55% | x 3.7 | 13% | 51 | 86% | 100% |
| United Kingdom | Mixed | 11 to 99 | 20 | 2% | x 1.1 | 87% | 66 | 93% | 0% |
| France | Tax | 32 to 103 | 19 | 2% | x 1.1 | 91% | 59 | 88% | 0% |
| France | Borrow | 32 to 53 | 10 | 2% | x 1.1 | 123% | 70 | 95% | 0% |
| France | Print | 32 to 53 | 10 | 64% | x 5.1 | 11% | 47 | 83% | 100% |
| France | Mixed | 32 to 74 | 13 | 2% | x 1.1 | 110% | 65 | 93% | 0% |
| Germany | Tax | 30 to 176 | 26 | 2% | x 1.1 | 67% | 63 | 88% | 0% |
| Germany | Borrow | 30 to 94 | 18 | 2% | x 1.1 | 112% | 73 | 95% | 0% |
| Germany | Print | 30 to 96 | 19 | 59% | x 4.1 | 12% | 52 | 86% | 100% |
| Germany | Mixed | 30 to 128 | 22 | 2% | x 1.1 | 96% | 70 | 93% | 0% |
| Italy | Tax | 28 to 61 | 9 | 2% | x 1.1 | 113% | 63 | 88% | 0% |
| Italy | Borrow | 28 to 30 | 6 | 2% | x 1.1 | 134% | 67 | 95% | 0% |
| Italy | Print | 28 to 30 | 6 | 66% | x 6.1 | 10% | 49 | 85% | 100% |
| Italy | Mixed | 28 to 44 | 7 | 2% | x 1.1 | 128% | 67 | 93% | 0% |
| Soviet Union | Tax | 74 to 198 | 26 | 2% | x 1.1 | 90% | 62 | 88% | 0% |
| Soviet Union | Borrow | 74 to 118 | 20 | 2% | x 1.1 | 124% | 73 | 95% | 0% |
| Soviet Union | Print | 74 to 117 | 20 | 62% | x 5.0 | 11% | 51 | 86% | 100% |
| Soviet Union | Mixed | 74 to 154 | 22 | 2% | x 1.1 | 116% | 69 | 93% | 0% |
| Poland | Tax | 28 to 47 | 7 | 2% | x 1.1 | 101% | 62 | 88% | 0% |
| Poland | Borrow | 28 to 28 | 3 | 7% | x 1.1 | 147% | 67 | 95% | 3% |
| Poland | Print | 28 to 28 | 3 | 133% | x 12.3 | 6% | 36 | 63% | 100% |
| Poland | Mixed | 28 to 31 | 3 | 2% | x 1.1 | 131% | 67 | 93% | 0% |

## Four years of peace

Every country is led by the AI from 1 January 1936 to 1 January 1940, with the historical
plans switched off, so nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | 11 to 50 | 30 + 8 to 44 + 11 | 14 of 24 | 9 | Shadow factories, Ministry of Supply | 80 | 43 | 34% |
| France | 32 to 73 | 22 + 7 to 34 + 9 | 14 of 24 | 9 | Nationalise the arms industry, Extend the Maginot Line | 76 | 42 | 33% |
| Germany | 30 to 118 | 34 + 12 to 36 + 32 | 14 of 24 | 9 | Four Year Plan, Westwall, Armoured corps | 68 | 55 | 57% |
| Italy | 28 to 76 | 13 + 6 to 15 + 18 | 14 of 24 | 9 | Autarky campaign, Alpine Wall | 63 | 58 | 60% |
| Soviet Union | 74 to 293 | 32 + 16 to 36 + 36 | 14 of 24 | 10 | Third Five-Year Plan, Universal military duty | 64 | 55 | 54% |
| Poland | 28 to 61 | 8 + 3 to 15 + 7 | 14 of 24 | 10 | Central Industrial Region, National Defence Fund | 72 | 58 | 29% |

## Does the AI follow history?

Story mode from 1 January 1936 to 1 January 1942, three times with different random numbers,
every country led by the AI and no player. The table shows the date each event happened in the
game beside its real date.

| Event | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| Germany moves troops into the Rhineland | 7 March 1936 | 7 March 1936 | 7 March 1936 | 7 March 1936 |
| Germany annexes Austria | 12 March 1938 | 12 March 1938 | 12 March 1938 | 12 March 1938 |
| Munich: Czechoslovakia gives up its border districts | 30 September 1938 | 29 September 1938 | 29 September 1938 | 29 September 1938 |
| Germany occupies the rest of Czechoslovakia | 15 March 1939 | 15 March 1939 | 15 March 1939 | 15 March 1939 |
| Britain guarantees Poland | 31 March 1939 | 1 April 1939 | 1 April 1939 | 1 April 1939 |
| Italy annexes Albania | 7 April 1939 | 7 April 1939 | 7 April 1939 | 7 April 1939 |
| Germany and Italy sign the Pact of Steel | 22 May 1939 | 22 May 1939 | 22 May 1939 | 22 May 1939 |
| German-Soviet non-aggression pact | 23 August 1939 | 23 August 1939 | 23 August 1939 | 23 August 1939 |
| Germany invades Poland | 1 September 1939 | 1 September 1939 | 1 September 1939 | 1 September 1939 |
| Britain and France declare war on Germany | 3 September 1939 | 1 September 1939 | 1 September 1939 | 1 September 1939 |
| The Soviet Union invades eastern Poland | 17 September 1939 | 17 September 1939 | 17 September 1939 | 17 September 1939 |
| Poland falls | 6 October 1939 | 26 October 1939 | 6 October 1939 | 12 October 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 January 1940 | 1 January 1940 | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 8 July 1940 | 1 July 1940 | 5 August 1940 |
| France falls | 22 June 1940 | 14 September 1940 | 26 September 1940 | 25 September 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |

How each run stood on 1 January 1942:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, France, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Hungary and Soviet Union |
| history-2 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, France, Yugoslavia, Romania | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Hungary and Soviet Union |
| history-3 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, France, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Hungary and Soviet Union; Finland and Soviet Union |

## The war at sea and in the air

The same three runs on 1 January 1942. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 15 / 43 / 5 | 17 + 3 | 0% | 0 | 116 |
| history-1 | Germany | 3 / 5 / 0 | 31 + 13 | 10% | 0 | 351 |
| history-1 | Italy | 4 / 14 / 10 | 11 + 5 | 0% | 0 | 148 |
| history-1 | Soviet Union | 3 / 10 / 27 | 44 + 20 | 0% | 0 | 446 |
| history-2 | United Kingdom | 14 / 43 / 5 | 18 + 3 | 0% | 0 | 115 |
| history-2 | Germany | 3 / 5 / 0 | 33 + 13 | 10% | 0 | 359 |
| history-2 | Italy | 4 / 14 / 10 | 11 + 6 | 0% | 0 | 103 |
| history-2 | Soviet Union | 3 / 11 / 27 | 44 + 20 | 0% | 0 | 446 |
| history-3 | United Kingdom | 15 / 44 / 5 | 19 + 3 | 0% | 1 | 119 |
| history-3 | Germany | 3 / 5 / 0 | 31 + 13 | 10% | 0 | 346 |
| history-3 | Italy | 4 / 13 / 10 | 12 + 6 | 72% | 0 | 130 |
| history-3 | Soviet Union | 3 / 10 / 27 | 44 + 20 | 0% | 0 | 446 |

Over the six years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 4 | 6 | 0 | 0 | 1 |
| history-2 | 4 | 7 | 0 | 0 | 4 |
| history-3 | 4 | 7 | 1 | 0 | 0 |

## What the results say

- **Up to September 1939 the AI still repeats history to the day** in all three runs, as in
  Stage F. Adding navies and air forces did not disturb the diplomatic timetable.
- **France falls in September 1940**, about three months late (Stage F: late August). Part of
  German industry now builds aircraft and submarines, so its army of 1940 is about a tenth
  smaller, and Britain ships an expedition to France. Three things keep the campaign from
  stalling: the new German "Armoured corps" programme, control of the sky (Germany usually
  has it over the battles in France), and the new rule that a country gives up at 40% of its
  victory points once its capital has fallen. In eight further test runs France fell between
  13 September and 30 October 1940 every time.
- **Britain holds the seas.** The Royal Navy keeps its home waters and the Mediterranean, the
  German surface fleet stays in the Baltic approaches, and Germany's submarines are hunted
  down by the escorts in the Western Approaches within a year. Britain's imports are safe by
  1942 in every run; in 1939 and 1940 it loses up to a quarter of them for some months.
- **Germany is blockaded but barely hurt** (10% of its imports), as intended: its ore and oil
  came overland and across the Baltic.
- **Italy's trade is cut in one run of three** (72% sunk) when the Royal Navy wins control of
  the central Mediterranean.
- **Bombing is a nuisance, not a war-winner**: a handful of provinces carry damage at any time.
- Two-country test wars are close to Stage F. Germany against France in 1936 is a little more
  even (55% to 40%) because both now spend on aircraft.

## Known weak spots, to revisit in later stages

- **Few landings.** The AI lands only on weakly held coasts with good odds, so Britain rarely
  returns to the continent by itself: one landing in three runs. The west is no longer silent
  (there is a sea war, an air war and bombing), but there is no second front without a player.
- **The submarine war ends too soon.** Germany builds few submarines and loses them by 1941.
  The real Battle of the Atlantic peaked in 1942 and 1943.
- **No air wings are ever wiped out**: losses are bounded so that an air force is worn down,
  not destroyed. Air battles like the Battle of Britain decide less than they did.
- **The eastern front is still a stalemate**, and in one run Romania falls to the Soviet Union
  by 1942. The army AI has no front-wide offensives and there is no winter.
- Straits are not modelled, and aircraft do not scout for the army.
- Finland still falls too easily, and the Soviet army of 1941 is too large (as in Stage F).
