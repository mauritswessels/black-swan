# Balance report, Stage K1: 200 AI against AI wars, 24 finance playtests, four years of peace, six runs of history and three free-for-alls

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 100% | 0% | 0% | 62 | 1.1 | 4.6 | 7 | 68% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 25% | 10% | 65% | 406 | 0.4 | 6.8 | 36 | 56% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 19 | 0.7 | 1.2 | 1 | 90% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 26 | 0.5 | 5.6 | 2 | 85% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.3 | 1 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 17 | 0.1 | 0.4 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 101 | 0.1 | 5.5 | 151 | 94% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 85 | 0.0 | 15.5 | 38 | 69% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 44 | 0.1 | 4.0 | 5 | 52% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 0% | 0% | 100% | n/a | 0.0 | 3.1 | 9 | 39% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| United Kingdom | Tax | 11 to 107 | 37 | 2% | x 1.1 | 56% | 59 | 88% | 0% |
| United Kingdom | Borrow | 11 to 61 | 27 | 5% | x 1.1 | 104% | 71 | 95% | 1% |
| United Kingdom | Print | 11 to 39 | 22 | 36% | x 3.1 | 14% | 61 | 86% | 100% |
| United Kingdom | Mixed | 11 to 98 | 30 | 2% | x 1.1 | 90% | 66 | 93% | 0% |
| France | Tax | 32 to 95 | 31 | 7% | x 1.1 | 76% | 59 | 88% | 2% |
| France | Borrow | 32 to 50 | 16 | 8% | x 1.1 | 117% | 70 | 95% | 2% |
| France | Print | 32 to 38 | 13 | 50% | x 3.8 | 13% | 59 | 86% | 100% |
| France | Mixed | 32 to 77 | 20 | 3% | x 1.1 | 107% | 65 | 93% | 0% |
| Germany | Tax | 30 to 154 | 44 | 2% | x 1.1 | 56% | 63 | 88% | 0% |
| Germany | Borrow | 30 to 105 | 31 | 2% | x 1.1 | 113% | 73 | 95% | 0% |
| Germany | Print | 30 to 74 | 26 | 42% | x 3.5 | 13% | 59 | 86% | 100% |
| Germany | Mixed | 30 to 138 | 36 | 2% | x 1.1 | 88% | 70 | 93% | 0% |
| Italy | Tax | 28 to 80 | 15 | 2% | x 1.1 | 90% | 63 | 88% | 0% |
| Italy | Borrow | 28 to 39 | 9 | 6% | x 1.1 | 131% | 68 | 95% | 1% |
| Italy | Print | 28 to 33 | 8 | 60% | x 5.4 | 10% | 51 | 86% | 100% |
| Italy | Mixed | 28 to 55 | 12 | 2% | x 1.1 | 106% | 68 | 93% | 0% |
| Soviet Union | Tax | 74 to 327 | 46 | 2% | x 1.1 | 55% | 63 | 88% | 0% |
| Soviet Union | Borrow | 74 to 177 | 33 | 6% | x 1.1 | 109% | 73 | 95% | 1% |
| Soviet Union | Print | 74 to 133 | 27 | 40% | x 3.2 | 15% | 61 | 86% | 100% |
| Soviet Union | Mixed | 74 to 252 | 39 | 2% | x 1.1 | 87% | 69 | 93% | 0% |
| Poland | Tax | 28 to 69 | 12 | 2% | x 1.1 | 79% | 62 | 88% | 0% |
| Poland | Borrow | 28 to 32 | 5 | 2% | x 1.1 | 126% | 71 | 95% | 0% |
| Poland | Print | 28 to 30 | 4 | 58% | x 5.0 | 11% | 52 | 86% | 100% |
| Poland | Mixed | 28 to 49 | 9 | 2% | x 1.1 | 95% | 69 | 93% | 0% |

## Four years of peace

Every country is led by the AI from 1 January 1936 to 1 January 1940, with the historical
plans switched off, so nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | 11 to 34 | 30 + 8 to 46 + 11 | 14 of 24 | 10 | Shadow factories, Ministry of Supply | 80 | 41 | 33% |
| France | 32 to 50 | 22 + 7 to 34 + 9 | 14 of 24 | 9 | Nationalise the arms industry, Extend the Maginot Line | 80 | 39 | 37% |
| Germany | 30 to 78 | 34 + 12 to 36 + 48 | 14 of 24 | 9 | Four Year Plan, Westwall, Armoured corps | 68 | 55 | 51% |
| Italy | 28 to 51 | 13 + 6 to 15 + 19 | 14 of 24 | 9 | Autarky campaign, Alpine Wall | 63 | 60 | 49% |
| Soviet Union | 74 to 197 | 32 + 16 to 36 + 49 | 14 of 24 | 10 | Third Five-Year Plan, Universal military duty | 67 | 55 | 45% |
| Poland | 28 to 41 | 8 + 3 to 15 + 7 | 14 of 24 | 10 | National Defence Fund, Central Industrial Region | 79 | 56 | 26% |

## Does the AI follow history?

Story mode from 1 January 1936 to 8 May 1945, three times with different random numbers,
every country led by the AI and no player. The table shows the date each event happened in the
game beside its real date.

| Event | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| Germany moves troops into the Rhineland | 7 March 1936 | 7 March 1936 | 7 March 1936 | 7 March 1936 |
| Civil war begins in Spain | 17 July 1936 | 17 July 1936 | 17 July 1936 | 17 July 1936 |
| Germany annexes Austria | 12 March 1938 | 12 March 1938 | 12 March 1938 | 12 March 1938 |
| Munich: Czechoslovakia gives up its border districts | 30 September 1938 | 29 September 1938 | 29 September 1938 | 29 September 1938 |
| Germany occupies the rest of Czechoslovakia | 15 March 1939 | 15 March 1939 | 15 March 1939 | 15 March 1939 |
| The First Vienna Award | 2 November 1938 | 2 November 1938 | 2 November 1938 | 2 November 1938 |
| Britain guarantees Poland | 31 March 1939 | 31 March 1939 | 31 March 1939 | 31 March 1939 |
| Franco wins in Spain | 1 April 1939 | 1 April 1939 | 1 April 1939 | 1 April 1939 |
| Italy annexes Albania | 7 April 1939 | 7 April 1939 | 7 April 1939 | 7 April 1939 |
| Germany and Italy sign the Pact of Steel | 22 May 1939 | 22 May 1939 | 22 May 1939 | 22 May 1939 |
| German-Soviet non-aggression pact | 23 August 1939 | 23 August 1939 | 23 August 1939 | 23 August 1939 |
| Germany invades Poland | 1 September 1939 | 1 September 1939 | 1 September 1939 | 1 September 1939 |
| Britain and France declare war on Germany | 3 September 1939 | 1 September 1939 | 1 September 1939 | 1 September 1939 |
| The Soviet Union invades eastern Poland | 17 September 1939 | 17 September 1939 | 17 September 1939 | 17 September 1939 |
| Poland falls | 6 October 1939 | 21 September 1939 | 23 September 1939 | 19 September 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | did not happen | did not happen | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 8 June 1940 | 8 June 1940 | 6 August 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 10 June 1940 | 10 June 1940 | 10 June 1940 |
| France falls | 22 June 1940 | 21 July 1940 | 9 August 1940 | 6 August 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 22 July 1940 | 10 August 1940 | 7 August 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 30 August 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 27 May 1941 | 12 June 1941 | 1 June 1941 |
| Greece falls | 23 April 1941 | did not happen | 4 October 1941 | did not happen |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Mussolini falls | 25 July 1943 | 7 August 1943 | did not happen | did not happen |
| Italy signs an armistice and changes sides | 8 September 1943 | 22 September 1943 | did not happen | did not happen |
| Moscow falls | never | did not happen | did not happen | did not happen |
| The Soviet Union surrenders | never | did not happen | did not happen | did not happen |
| Germany surrenders | 8 May 1945 | 27 November 1943 | 12 February 1944 | 18 May 1944 |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 6 August 1943 | 16 August 1943 | did not happen |
| The Allies land in northern France or the Low Countries | 6 June 1944 | 16 November 1943 | 12 September 1943 | 28 January 1942 |
| The Allies land in the south of France | 15 August 1944 | did not happen | did not happen | did not happen |

## The moving front

Stage K1 made the front move inside each province: a battle's line goes from 0 to 100 and
the province changes hands at 100, rivers slow a crossing, and mud and snow slow the front.
For each run, every battle fought from 1936 (or September 1939) to 8 May 1945: how many days
a battle lasted on average, how many attacks succeeded, how many battles were fought across a
river and how many of those crossings were forced, and in how many lost attacks the mud or
snow was one of the three main reasons.

| Run | Battles | Average days | Attacks that succeed | River battles | Crossings forced | Lost partly to mud or snow |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | 438 | 2.4 | 19% | 76 | 14 | 48 |
| history-2 | 361 | 3.2 | 24% | 81 | 15 | 27 |
| history-3 | 494 | 2.2 | 23% | 102 | 13 | 56 |
| 1939-1 | 346 | 2.8 | 43% | 112 | 22 | 22 |
| 1939-2 | 696 | 2.0 | 23% | 135 | 10 | 163 |
| 1939-3 | 460 | 2.7 | 32% | 94 | 21 | 32 |

## The war economy

Stage J's question: can each country pay for the war it fights, as the real ones did? The same
three runs from 1936, then three runs of the September 1939 start, every country led by the
AI. Real figures for comparison: Germany had about 210 divisions in June 1941 and about 300 at
its peak; Soviet prices roughly doubled in the shops during the war but the government never
fell; Britain's debt reached about 2.5 years' output by 1945 (this game counts debt as a share
of a year's output, so 250%) and its prices rose by about half.

When the great powers fell (the date of surrender or armistice), and how the Soviet economy came through by 8 May 1945:

| Run | France | Italy | Germany | Highest Soviet inflation (a year) | Soviet prices at the end | Soviet governments fallen | Soviet government |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 21 July 1940 | 22 September 1943 | 27 November 1943 | 24% | x1.6 | 0 | communist |
| history-2 | 9 August 1940 | did not fall | 12 February 1944 | 27% | x1.6 | 0 | communist |
| history-3 | 6 August 1940 | 5 July 1942 | 18 May 1944 | 26% | x1.6 | 0 | communist |
| 1939-1 | 16 July 1940 | 2 October 1943 | 27 October 1943 | 11% | x1.3 | 0 | communist |
| 1939-2 | 5 September 1940 | 20 June 1942 | did not fall | 22% | x1.6 | 0 | communist |
| 1939-3 | 27 July 1940 | 20 August 1942 | 2 December 1943 | 17% | x1.4 | 0 | communist |

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-1 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-1 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-1 | 1 January 1940 | Germany | 122 (91%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| history-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| history-1 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-1 | 1 January 1941 | Germany | 296 (94%) | 80 | 2% | x1.1 | 45% | yes | 58 | 0 |
| history-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| history-1 | 1 January 1941 | United Kingdom | 118 (99%) | 28 | 2% | x1.1 | 45% | yes | 79 | 0 |
| history-1 | 1 January 1942 | Germany | 338 (89%) | 99 | 2% | x1.1 | 51% | yes | 60 | 0 |
| history-1 | 1 January 1942 | Soviet Union | 488 (98%) | 70 | 15% | x1.2 | 67% | yes | 74 | 0 |
| history-1 | 1 January 1942 | United Kingdom | 143 (99%) | 40 | 2% | x1.1 | 55% | yes | 70 | 0 |
| history-1 | 1 January 1943 | Germany | 362 (79%) | 118 | 2% | x1.2 | 58% | yes | 59 | 0 |
| history-1 | 1 January 1943 | Soviet Union | 488 (97%) | 74 | 15% | x1.4 | 83% | yes | 62 | 0 |
| history-1 | 1 January 1943 | United Kingdom | 143 (100%) | 50 | 2% | x1.2 | 68% | yes | 65 | 0 |
| history-1 | 1 January 1944 | Soviet Union | 619 (99%) | 113 | 5% | x1.5 | 71% | yes | 66 | 0 |
| history-1 | 1 January 1944 | United Kingdom | 140 (99%) | 64 | 2% | x1.2 | 67% | yes | 65 | 0 |
| history-1 | 1 January 1945 | Soviet Union | 716 (100%) | 125 | 3% | x1.6 | 70% | no | 57 | 0 |
| history-1 | 1 January 1945 | United Kingdom | 152 (100%) | 79 | 2% | x1.2 | 56% | no | 62 | 0 |
| history-1 | 8 May 1945 | Soviet Union | 729 (100%) | 128 | 3% | x1.6 | 71% | no | 57 | 0 |
| history-1 | 8 May 1945 | United Kingdom | 156 (100%) | 84 | 2% | x1.2 | 53% | no | 62 | 0 |
| history-2 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-2 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-2 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-2 | 1 January 1940 | Germany | 123 (91%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| history-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| history-2 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-2 | 1 January 1941 | Germany | 281 (91%) | 80 | 2% | x1.1 | 44% | yes | 60 | 0 |
| history-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| history-2 | 1 January 1941 | United Kingdom | 120 (99%) | 28 | 2% | x1.1 | 45% | yes | 79 | 0 |
| history-2 | 1 January 1942 | Germany | 326 (86%) | 101 | 2% | x1.1 | 48% | yes | 60 | 0 |
| history-2 | 1 January 1942 | Soviet Union | 487 (97%) | 70 | 15% | x1.2 | 67% | yes | 74 | 0 |
| history-2 | 1 January 1942 | United Kingdom | 141 (99%) | 40 | 2% | x1.1 | 54% | yes | 68 | 0 |
| history-2 | 1 January 1943 | Germany | 351 (78%) | 118 | 2% | x1.2 | 56% | yes | 59 | 0 |
| history-2 | 1 January 1943 | Soviet Union | 487 (98%) | 77 | 14% | x1.4 | 79% | yes | 62 | 0 |
| history-2 | 1 January 1943 | United Kingdom | 141 (100%) | 51 | 2% | x1.2 | 63% | yes | 65 | 0 |
| history-2 | 1 January 1944 | Germany | 367 (64%) | 131 | 2% | x1.2 | 66% | yes | 52 | 0 |
| history-2 | 1 January 1944 | Soviet Union | 487 (99%) | 79 | 5% | x1.5 | 93% | yes | 73 | 0 |
| history-2 | 1 January 1944 | United Kingdom | 135 (95%) | 64 | 2% | x1.2 | 64% | yes | 63 | 0 |
| history-2 | 1 January 1945 | Soviet Union | 721 (100%) | 122 | 3% | x1.6 | 74% | no | 58 | 0 |
| history-2 | 1 January 1945 | United Kingdom | 128 (95%) | 77 | 2% | x1.2 | 65% | yes | 64 | 0 |
| history-2 | 8 May 1945 | Soviet Union | 734 (100%) | 125 | 3% | x1.6 | 75% | no | 57 | 0 |
| history-2 | 8 May 1945 | United Kingdom | 132 (95%) | 81 | 2% | x1.2 | 65% | yes | 64 | 0 |
| history-3 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-3 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-3 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-3 | 1 January 1940 | Germany | 124 (92%) | 58 | 2% | x1.1 | 41% | yes | 70 | 0 |
| history-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| history-3 | 1 January 1940 | United Kingdom | 45 (98%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-3 | 1 January 1941 | Germany | 294 (94%) | 80 | 2% | x1.1 | 45% | yes | 58 | 0 |
| history-3 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| history-3 | 1 January 1941 | United Kingdom | 124 (99%) | 28 | 2% | x1.1 | 45% | yes | 76 | 0 |
| history-3 | 1 January 1942 | Germany | 329 (88%) | 99 | 2% | x1.1 | 51% | yes | 60 | 0 |
| history-3 | 1 January 1942 | Soviet Union | 486 (98%) | 69 | 17% | x1.2 | 66% | yes | 73 | 0 |
| history-3 | 1 January 1942 | United Kingdom | 147 (99%) | 40 | 2% | x1.1 | 55% | yes | 68 | 0 |
| history-3 | 1 January 1943 | Germany | 356 (76%) | 114 | 2% | x1.2 | 59% | yes | 59 | 0 |
| history-3 | 1 January 1943 | Soviet Union | 486 (98%) | 76 | 16% | x1.4 | 77% | yes | 61 | 0 |
| history-3 | 1 January 1943 | United Kingdom | 123 (100%) | 57 | 2% | x1.2 | 60% | yes | 64 | 0 |
| history-3 | 1 January 1944 | Germany | 350 (58%) | 119 | 6% | x1.2 | 76% | yes | 51 | 0 |
| history-3 | 1 January 1944 | Soviet Union | 486 (98%) | 78 | 5% | x1.6 | 90% | yes | 73 | 0 |
| history-3 | 1 January 1944 | United Kingdom | 126 (98%) | 69 | 2% | x1.2 | 59% | yes | 63 | 0 |
| history-3 | 1 January 1945 | Soviet Union | 691 (100%) | 118 | 3% | x1.6 | 75% | no | 59 | 0 |
| history-3 | 1 January 1945 | United Kingdom | 137 (98%) | 87 | 2% | x1.2 | 53% | yes | 65 | 0 |
| history-3 | 8 May 1945 | Soviet Union | 707 (100%) | 121 | 3% | x1.6 | 75% | no | 58 | 0 |
| history-3 | 8 May 1945 | United Kingdom | 140 (99%) | 91 | 2% | x1.2 | 53% | yes | 65 | 0 |
| 1939-1 | 1 January 1940 | Germany | 124 (90%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-1 | 1 January 1941 | Germany | 285 (91%) | 80 | 2% | x1.1 | 44% | yes | 59 | 0 |
| 1939-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-1 | 1 January 1941 | United Kingdom | 124 (99%) | 28 | 2% | x1.1 | 45% | yes | 79 | 0 |
| 1939-1 | 1 January 1942 | Germany | 329 (88%) | 98 | 2% | x1.1 | 50% | yes | 60 | 0 |
| 1939-1 | 1 January 1942 | Soviet Union | 487 (98%) | 72 | 10% | x1.2 | 65% | yes | 73 | 0 |
| 1939-1 | 1 January 1942 | United Kingdom | 147 (99%) | 40 | 2% | x1.1 | 55% | yes | 68 | 0 |
| 1939-1 | 1 January 1943 | Germany | 353 (72%) | 110 | 2% | x1.2 | 62% | yes | 57 | 0 |
| 1939-1 | 1 January 1943 | Soviet Union | 487 (97%) | 76 | 5% | x1.3 | 90% | yes | 74 | 0 |
| 1939-1 | 1 January 1943 | United Kingdom | 142 (100%) | 53 | 2% | x1.2 | 61% | yes | 64 | 0 |
| 1939-1 | 1 January 1944 | Soviet Union | 664 (100%) | 109 | 3% | x1.3 | 82% | no | 65 | 0 |
| 1939-1 | 1 January 1944 | United Kingdom | 153 (96%) | 63 | 2% | x1.2 | 70% | yes | 64 | 0 |
| 1939-1 | 1 January 1945 | Soviet Union | 714 (100%) | 121 | 2% | x1.3 | 82% | no | 57 | 0 |
| 1939-1 | 1 January 1945 | United Kingdom | 165 (95%) | 74 | 2% | x1.2 | 76% | yes | 64 | 0 |
| 1939-1 | 8 May 1945 | Soviet Union | 728 (100%) | 127 | 2% | x1.3 | 82% | no | 57 | 0 |
| 1939-1 | 8 May 1945 | United Kingdom | 169 (95%) | 78 | 2% | x1.2 | 77% | yes | 64 | 0 |
| 1939-2 | 1 January 1940 | Germany | 123 (91%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| 1939-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-2 | 1 January 1941 | Germany | 286 (89%) | 80 | 2% | x1.1 | 44% | yes | 58 | 0 |
| 1939-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-2 | 1 January 1941 | United Kingdom | 125 (99%) | 28 | 2% | x1.1 | 45% | yes | 79 | 0 |
| 1939-2 | 1 January 1942 | Germany | 331 (83%) | 97 | 2% | x1.1 | 50% | yes | 60 | 0 |
| 1939-2 | 1 January 1942 | Soviet Union | 483 (96%) | 72 | 10% | x1.2 | 65% | yes | 73 | 0 |
| 1939-2 | 1 January 1942 | United Kingdom | 147 (99%) | 40 | 2% | x1.1 | 55% | yes | 73 | 0 |
| 1939-2 | 1 January 1943 | Germany | 362 (75%) | 110 | 2% | x1.2 | 62% | yes | 60 | 0 |
| 1939-2 | 1 January 1943 | Soviet Union | 482 (99%) | 70 | 16% | x1.4 | 84% | yes | 61 | 0 |
| 1939-2 | 1 January 1943 | United Kingdom | 133 (99%) | 57 | 2% | x1.2 | 57% | yes | 64 | 0 |
| 1939-2 | 1 January 1944 | Germany | 366 (66%) | 122 | 2% | x1.2 | 71% | yes | 58 | 0 |
| 1939-2 | 1 January 1944 | Soviet Union | 482 (99%) | 76 | 5% | x1.5 | 97% | yes | 70 | 0 |
| 1939-2 | 1 January 1944 | United Kingdom | 145 (94%) | 71 | 2% | x1.2 | 57% | yes | 63 | 0 |
| 1939-2 | 1 January 1945 | Germany | 356 (54%) | 137 | 2% | x1.2 | 77% | yes | 59 | 0 |
| 1939-2 | 1 January 1945 | Soviet Union | 482 (98%) | 77 | 3% | x1.6 | 119% | yes | 65 | 0 |
| 1939-2 | 1 January 1945 | United Kingdom | 157 (86%) | 83 | 2% | x1.2 | 60% | yes | 62 | 0 |
| 1939-2 | 8 May 1945 | Germany | 325 (53%) | 138 | 3% | x1.2 | 88% | yes | 56 | 0 |
| 1939-2 | 8 May 1945 | Soviet Union | 481 (99%) | 79 | 3% | x1.6 | 120% | yes | 68 | 0 |
| 1939-2 | 8 May 1945 | United Kingdom | 161 (83%) | 87 | 2% | x1.2 | 60% | yes | 63 | 0 |
| 1939-3 | 1 January 1940 | Germany | 124 (93%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| 1939-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-3 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-3 | 1 January 1941 | Germany | 280 (93%) | 80 | 2% | x1.1 | 44% | yes | 60 | 0 |
| 1939-3 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-3 | 1 January 1941 | United Kingdom | 124 (99%) | 28 | 2% | x1.1 | 45% | yes | 79 | 0 |
| 1939-3 | 1 January 1942 | Germany | 325 (87%) | 98 | 2% | x1.1 | 49% | yes | 60 | 0 |
| 1939-3 | 1 January 1942 | Soviet Union | 483 (96%) | 72 | 12% | x1.2 | 66% | yes | 73 | 0 |
| 1939-3 | 1 January 1942 | United Kingdom | 147 (99%) | 39 | 2% | x1.1 | 56% | yes | 69 | 0 |
| 1939-3 | 1 January 1943 | Germany | 352 (71%) | 114 | 2% | x1.2 | 57% | yes | 58 | 0 |
| 1939-3 | 1 January 1943 | Soviet Union | 483 (98%) | 75 | 7% | x1.3 | 88% | yes | 73 | 0 |
| 1939-3 | 1 January 1943 | United Kingdom | 138 (98%) | 51 | 2% | x1.2 | 63% | yes | 64 | 0 |
| 1939-3 | 1 January 1944 | Soviet Union | 483 (99%) | 108 | 3% | x1.4 | 98% | yes | 71 | 0 |
| 1939-3 | 1 January 1944 | United Kingdom | 129 (99%) | 68 | 2% | x1.2 | 62% | yes | 63 | 0 |
| 1939-3 | 1 January 1945 | Soviet Union | 710 (100%) | 120 | 2% | x1.4 | 80% | no | 58 | 0 |
| 1939-3 | 1 January 1945 | United Kingdom | 141 (100%) | 81 | 2% | x1.2 | 60% | yes | 63 | 0 |
| 1939-3 | 8 May 1945 | Soviet Union | 727 (100%) | 123 | 2% | x1.4 | 80% | no | 57 | 0 |
| 1939-3 | 8 May 1945 | United Kingdom | 145 (100%) | 86 | 2% | x1.2 | 61% | yes | 63 | 0 |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 2 of 28 | 0 | 338 | 488 | 143 | with Germany |
| history-1 | 1 January 1943 | 0 of 28 | 0 | 362 | 488 | 143 | with Germany |
| history-1 | 1 January 1944 | 0 of 28 | 15 | 0 | 619 | 140 | with the Allies |
| history-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 716 | 152 | with the Allies |
| history-2 | 1 January 1942 | 1 of 28 | 0 | 326 | 487 | 141 | with Germany |
| history-2 | 1 January 1943 | 1 of 28 | 0 | 351 | 487 | 141 | with Germany |
| history-2 | 1 January 1944 | 0 of 28 | 3 | 367 | 487 | 135 | with Germany |
| history-2 | 1 January 1945 | 0 of 28 | 15 | 0 | 721 | 128 | with Germany |
| history-3 | 1 January 1942 | 3 of 28 | 0 | 329 | 486 | 147 | with Germany |
| history-3 | 1 January 1943 | 0 of 28 | 0 | 356 | 486 | 123 | fallen |
| history-3 | 1 January 1944 | 0 of 28 | 2 | 350 | 486 | 126 | fallen |
| history-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 691 | 137 | fallen |
| 1939-1 | 1 January 1942 | 3 of 28 | 0 | 329 | 487 | 147 | with Germany |
| 1939-1 | 1 January 1943 | 0 of 28 | 1 | 353 | 487 | 142 | with Germany |
| 1939-1 | 1 January 1944 | 0 of 28 | 15 | 0 | 664 | 153 | with the Allies |
| 1939-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 714 | 165 | with the Allies |
| 1939-2 | 1 January 1942 | 1 of 28 | 0 | 331 | 483 | 147 | with Germany |
| 1939-2 | 1 January 1943 | 1 of 28 | 0 | 362 | 482 | 133 | fallen |
| 1939-2 | 1 January 1944 | 0 of 28 | 1 | 366 | 482 | 145 | fallen |
| 1939-2 | 1 January 1945 | 0 of 28 | 1 | 356 | 482 | 157 | fallen |
| 1939-3 | 1 January 1942 | 2 of 28 | 0 | 325 | 483 | 147 | with Germany |
| 1939-3 | 1 January 1943 | 0 of 28 | 1 | 352 | 483 | 138 | fallen |
| 1939-3 | 1 January 1944 | 0 of 28 | 15 | 0 | 483 | 129 | fallen |
| 1939-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 710 | 141 | fallen |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 82 | Albania, Finland, Estonia, Latvia, Lithuania, Germany, Romania | none |
| history-2 | 90 | Albania, Finland, Estonia, Latvia, Lithuania, Germany, Romania | Italy and United Kingdom; Egypt and Italy |
| history-3 | 80 | Luxembourg, Estonia, Latvia, Lithuania, Belgium, Italy, Germany | Romania and United Kingdom; Hungary and United Kingdom |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | France | 0 of 28 | Germany 167, Soviet Union 124, Romania 55 |
| history-2 | 52 | Franco | none | 0 of 28 | Germany 166, United Kingdom 121, Soviet Union 120 |
| history-3 | 52 | Franco | France | 0 of 28 | Germany 258, Soviet Union 160, United Kingdom 112 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 19 | 15 | 9 | Soviet Union 215 (+122), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 25 | 14 | 7 | Soviet Union 168 (+75), Germany 135 (+67), Romania 105 (+80) | none |
| ffa-3 | 1 April 1936 | 23 | 14 | 8 | Soviet Union 210 (+117), Germany 115 (+47), Italy 101 (+50) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 16 / 77 / 5 | 15 + 4 | 0% | 9 | 156 |
| history-1 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 25 |
| history-1 | Italy | 4 / 16 / 10 | 7 + 4 | 0% | 0 | 110 |
| history-1 | Soviet Union | 3 / 22 / 43 | 15 + 9 | 0% | 0 | 729 |
| history-1 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 9 |
| history-2 | United Kingdom | 16 / 78 / 5 | 12 + 3 | 0% | 10 | 132 |
| history-2 | France | 0 / 2 / 0 | 0 + 0 | 0% | 0 | 27 |
| history-2 | Italy | 4 / 12 / 10 | 7 + 4 | 0% | 0 | 139 |
| history-2 | Soviet Union | 3 / 22 / 42 | 15 + 9 | 0% | 0 | 734 |
| history-2 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 42 |
| history-3 | United Kingdom | 16 / 82 / 5 | 11 + 3 | 0% | 8 | 140 |
| history-3 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 26 |
| history-3 | Soviet Union | 3 / 22 / 40 | 16 + 11 | 0% | 0 | 707 |
| history-3 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 7 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 4 | 24 | 9 | 0 | 0 |
| history-2 | 4 | 27 | 10 | 0 | 0 |
| history-3 | 4 | 28 | 8 | 0 | 0 |

## What the results say

- **The front now moves, and stalls, the way a real front does.** A battle lasts 2 to 3 days on
  average, but most attacks (57 to 81%) are called off before the line reaches 100, so a
  province usually takes several tries. Each run has 76 to 135 battles across a river, and the
  attackers force 10 to 22 crossings. Mud and snow are one of the main reasons for 22 to 163
  failed attacks a run, nearly all of them in the east.
- **Rivers were eased once.** With attacks across a river at 75% of their power, Germany fell in
  only 3 of 6 runs: the Allies stalled for years at the Rhine, the Elbe and the Vistula. At 85%
  (this report) Germany falls in 5 of 6 runs again, the same as Stage J.
- **Test wars.** Germany beats Poland every time, in 62 days (Stage J: 90% in 116 days). Germany
  against France in 1936 is now a stalemate 65% of the time (Stage J 25%): France was the stronger
  army then, and the Rhine and the Meuse stand between them. The Winter War lasts 101 days
  (really 105).
- **History.** France falls between 16 July and 5 September 1940 (really 22 June; Stage J 18 July
  to 14 August). Germany is defeated in 5 of 6 runs, between 27 October 1943 and 18 May 1944
  (Stage J: January to August 1944, so a few months earlier now). Greece falls in 2 of 3 runs from
  1936, once on 23 April 1941, the real date; in Stage J it never fell. Soviet prices end the war
  at 1.3 to 1.6 times their 1936 level and no Soviet government falls.
- **Still to do.** Barbarossa still stops near the border (1 to 3 of 28 Soviet provinces taken by
  1 January 1942). The front line is not the cause: Germany puts only about 100 to 115 divisions
  against 140 to 200 Soviet ones near the front, because the army AI spreads its army over every
  border. Stage K2 (Hold and Push orders, pincers) should fix this. The British AI still lands in
  northern France too early (January 1942 to November 1943, really June 1944), and Italy changes
  sides in only 1 of 3 runs from 1936.
