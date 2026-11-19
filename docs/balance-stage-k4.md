# Balance report, Stage K4: 200 AI against AI wars, 24 finance playtests, four years of peace, six runs of history, three free-for-alls and three games played with armies

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 65% | 35% | 0% | 111 | 3.9 | 13.1 | 27 | 82% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 0% | 100% | 0% | 141 | 10.7 | 2.0 | 21 | 76% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 21 | 0.2 | 1.3 | 4 | 92% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 27 | 0.5 | 1.9 | 3 | 77% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 25% | 0% | 75% | 130 | 0.0 | 4.1 | 5 | 34% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 95% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 33 | 0.1 | 5.8 | 32 | 98% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 75 | 0.0 | 13.8 | 25 | 59% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 73 | 0.0 | 8.4 | 12 | 78% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 90% | 0% | 10% | 215 | 0.5 | 14.0 | 20 | 51% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| United Kingdom | 11 to 34 | 30 + 8 to 46 + 11 | 14 of 25 | 10 | Shadow factories, Ministry of Supply | 80 | 41 | 33% |
| France | 32 to 50 | 22 + 7 to 34 + 9 | 14 of 25 | 9 | Nationalise the arms industry, Extend the Maginot Line | 80 | 39 | 37% |
| Germany | 30 to 78 | 34 + 12 to 36 + 48 | 14 of 25 | 9 | Four Year Plan, Westwall, Armoured corps | 68 | 55 | 51% |
| Italy | 28 to 51 | 13 + 6 to 15 + 19 | 14 of 25 | 9 | Autarky campaign, Alpine Wall | 63 | 60 | 49% |
| Soviet Union | 74 to 197 | 32 + 16 to 36 + 49 | 14 of 25 | 10 | Third Five-Year Plan, Universal military duty | 67 | 55 | 45% |
| Poland | 28 to 41 | 8 + 3 to 15 + 7 | 14 of 25 | 10 | National Defence Fund, Central Industrial Region | 79 | 56 | 26% |

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
| Poland falls | 6 October 1939 | 12 October 1939 | 29 September 1939 | 3 October 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 February 1940 | did not happen | did not happen |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 15 April 1940 | 9 June 1940 | 14 April 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 8 July 1940 | 2 September 1940 | 5 August 1940 |
| France falls | 22 June 1940 | 9 August 1940 | 12 September 1940 | 19 August 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 10 August 1940 | 13 September 1940 | 20 August 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 13 September 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 17 May 1941 | 14 July 1941 | 15 September 1941 |
| Greece falls | 23 April 1941 | did not happen | did not happen | did not happen |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Mussolini falls | 25 July 1943 | 3 August 1943 | 5 August 1943 | 22 August 1943 |
| Italy signs an armistice and changes sides | 8 September 1943 | 18 September 1943 | 20 September 1943 | 7 October 1943 |
| Moscow falls | never | did not happen | did not happen | did not happen |
| The Soviet Union surrenders | never | did not happen | did not happen | did not happen |
| Germany surrenders | 8 May 1945 | 11 November 1943 | 11 December 1943 | 26 March 1944 |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 2 August 1943 | 31 July 1943 | 18 August 1943 |
| The Allies land in northern France or the Low Countries | 6 June 1944 | did not happen | did not happen | did not happen |
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
| history-1 | 506 | 2.0 | 35% | 208 | 18 | 38 |
| history-2 | 543 | 2.0 | 31% | 240 | 21 | 43 |
| history-3 | 758 | 1.8 | 38% | 226 | 14 | 169 |
| 1939-1 | 634 | 1.8 | 40% | 252 | 13 | 51 |
| 1939-2 | 565 | 2.0 | 41% | 121 | 12 | 66 |
| 1939-3 | 667 | 1.7 | 33% | 218 | 11 | 69 |

## Armies

Stage K2 lets the player command armies instead of divisions. A bot plays the September 1939
start as Germany using only army orders: Army Group North and Army Group South push on Warsaw
from two sides, Army Group West holds the French border and takes every new division. When
Poland falls, all three hold the French border through the winter. On 10 May 1940 they push
into Lorraine and Burgundy, then each pushes on to Paris once it has taken its target. The AI finance minister runs Germany's economy and the
AI leads every other country. The bot does not attack Belgium or the Netherlands: in Story mode
that needs a cause for war, which this bot does not seek. The run ends on 1 June 1941. Real history: Poland fell on
6 October 1939, France on 22 June 1940.

| Run | Poland falls | France falls | German divisions on 1 June 1941 | German provinces lost | German attacks | Armies at the end | Divisions that pushed on (deep attacks) | Milliseconds a day |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| armies-1 | did not fall | did not fall | 0 | 22 | 10 |  | 22 | 9.0 |
| armies-2 | 15 November 1939 | did not fall | 316 | 0 | 35 | Army Group North: 17, Army Group South: 20, Army Group West: 279 | 17 | 17.7 |
| armies-3 | 19 November 1939 | did not fall | 316 | 0 | 25 | Army Group North: 17, Army Group South: 20, Army Group West: 279 | 19 | 17.2 |

## Land, sea and air together

Stage K3 lets the player (and the AI) aim air wings at one province, shell a coast from the
sea, and drop paratroopers. For each run: how many AI bomber wings were aimed at a battle on an
average day, how many fleets were shelling a coast, the paratrooper divisions each country had
on an average day, and the drops made (empty provinces taken, and drops into a battle).

| Run | Bomber wings aimed at a battle (average day) | Fleets shelling (average day) | Paratrooper divisions (average day) | Drops | Drops by | First drop |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | 11.3 | 0.3 | Soviet Union 4, Germany 3, Italy 1, United Kingdom 2 | 29 (20 into a battle) | Germany 15, Soviet Union 12, United Kingdom 2 | 11 July 1941 |
| history-2 | 7.9 | 0.2 | Soviet Union 3, Germany 2, Italy 1, United Kingdom 2 | 35 (23 into a battle) | Germany 17, Soviet Union 14, United Kingdom 4 | 18 July 1941 |
| history-3 | 9.4 | 0.3 | Soviet Union 3, Germany 3, Italy 1, United Kingdom 2 | 36 (20 into a battle) | Germany 19, Soviet Union 14, United Kingdom 3 | 16 November 1942 |
| 1939-1 | 19.1 | 0.3 | Soviet Union 5, Germany 5, Italy 2, United Kingdom 3 | 38 (24 into a battle) | Soviet Union 17, Germany 10, United Kingdom 8, Italy 3 | 10 October 1942 |
| 1939-2 | 10.7 | 0.4 | Soviet Union 4, Germany 5, Italy 1, United Kingdom 2 | 20 (6 into a battle) | Germany 11, Soviet Union 3, United Kingdom 6 | 22 August 1941 |
| 1939-3 | 13.7 | 0.3 | Soviet Union 5, Germany 4, Italy 1, United Kingdom 3 | 25 (14 into a battle) | Germany 9, United Kingdom 8, Soviet Union 8 | 11 April 1941 |

## The finer map and deep attacks

Stage K4 splits the biggest provinces near the main fronts, from 183 provinces to 280, and
adds deep attacks: divisions sent further than the next province push on once the fight there
is going well, while the rest finish it. The AI attacks one province at a time, so in these
runs only armies on a Push order (the army bot above) push on. For each run: how long the
simulation takes for one game day on this computer (the fastest game speed allows 60 ms),
when Poland surrendered (really: Warsaw on 28 September 1939, the last troops on 6 October),
how many divisions pushed on, and the most battles fought on one day.

| Run | Milliseconds a game day | Poland surrenders | Divisions that pushed on | Most battles on one day |
| --- | --- | --- | --- | --- |
| history-1 | 13.5 | 12 October 1939 | 152 | 14 |
| history-2 | 12.9 | 29 September 1939 | 188 | 15 |
| history-3 | 13.5 | 3 October 1939 | 217 | 13 |
| 1939-1 | 18.5 | 29 September 1939 | 258 | 14 |
| 1939-2 | 18.6 | 29 September 1939 | 78 | 11 |
| 1939-3 | 18.0 | 3 October 1939 | 205 | 13 |

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
| history-1 | 9 August 1940 | 18 September 1943 | 11 November 1943 | 45% | x2.4 | 0 | communist |
| history-2 | 12 September 1940 | 20 September 1943 | 11 December 1943 | 47% | x2.5 | 0 | communist |
| history-3 | 19 August 1940 | 7 October 1943 | 26 March 1944 | 47% | x2.7 | 0 | communist |
| 1939-1 | 30 August 1940 | 1 November 1943 | 29 January 1944 | 41% | x2.3 | 0 | communist |
| 1939-2 | 31 July 1940 | 4 October 1943 | 18 October 1943 | 124% | x19.0 | 1 | authoritarian |
| 1939-3 | 4 September 1940 | 6 October 1943 | 25 November 1943 | 44% | x2.3 | 0 | communist |

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-1 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-1 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-1 | 1 January 1940 | Germany | 124 (97%) | 56 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-1 | 1 January 1940 | Soviet Union | 212 (100%) | 49 | 2% | x1.1 | 47% | no | 68 | 0 |
| history-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-1 | 1 January 1941 | Germany | 297 (97%) | 79 | 2% | x1.1 | 45% | yes | 58 | 0 |
| history-1 | 1 January 1941 | Soviet Union | 286 (100%) | 67 | 2% | x1.1 | 39% | no | 63 | 0 |
| history-1 | 1 January 1941 | United Kingdom | 126 (99%) | 28 | 2% | x1.1 | 45% | yes | 76 | 0 |
| history-1 | 1 January 1942 | Germany | 336 (86%) | 101 | 2% | x1.1 | 49% | yes | 60 | 0 |
| history-1 | 1 January 1942 | Soviet Union | 443 (86%) | 61 | 31% | x1.2 | 79% | yes | 65 | 0 |
| history-1 | 1 January 1942 | United Kingdom | 162 (100%) | 39 | 2% | x1.1 | 57% | yes | 68 | 0 |
| history-1 | 1 January 1943 | Germany | 358 (66%) | 120 | 2% | x1.2 | 57% | yes | 55 | 0 |
| history-1 | 1 January 1943 | Soviet Union | 443 (92%) | 65 | 35% | x1.8 | 70% | yes | 50 | 0 |
| history-1 | 1 January 1943 | United Kingdom | 170 (100%) | 45 | 2% | x1.2 | 73% | yes | 66 | 0 |
| history-1 | 1 January 1944 | Soviet Union | 510 (100%) | 118 | 11% | x2.2 | 44% | yes | 57 | 0 |
| history-1 | 1 January 1944 | United Kingdom | 176 (100%) | 54 | 2% | x1.2 | 80% | no | 63 | 0 |
| history-1 | 1 January 1945 | Soviet Union | 580 (100%) | 133 | 5% | x2.4 | 39% | yes | 54 | 0 |
| history-1 | 1 January 1945 | United Kingdom | 194 (100%) | 66 | 2% | x1.2 | 66% | no | 60 | 0 |
| history-1 | 8 May 1945 | Soviet Union | 597 (100%) | 138 | 4% | x2.4 | 39% | no | 56 | 0 |
| history-1 | 8 May 1945 | United Kingdom | 199 (100%) | 70 | 2% | x1.2 | 64% | no | 60 | 0 |
| history-2 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-2 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-2 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-2 | 1 January 1940 | Germany | 124 (97%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-2 | 1 January 1940 | Soviet Union | 227 (100%) | 49 | 2% | x1.1 | 46% | no | 68 | 0 |
| history-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-2 | 1 January 1941 | Germany | 299 (93%) | 79 | 2% | x1.1 | 46% | yes | 58 | 0 |
| history-2 | 1 January 1941 | Soviet Union | 288 (100%) | 67 | 2% | x1.1 | 39% | no | 66 | 0 |
| history-2 | 1 January 1941 | United Kingdom | 127 (98%) | 28 | 2% | x1.1 | 45% | yes | 71 | 0 |
| history-2 | 1 January 1942 | Germany | 337 (82%) | 101 | 2% | x1.1 | 49% | yes | 59 | 0 |
| history-2 | 1 January 1942 | Soviet Union | 459 (88%) | 62 | 29% | x1.2 | 72% | yes | 66 | 0 |
| history-2 | 1 January 1942 | United Kingdom | 144 (100%) | 39 | 2% | x1.1 | 58% | yes | 66 | 0 |
| history-2 | 1 January 1943 | Germany | 358 (58%) | 120 | 2% | x1.2 | 57% | yes | 56 | 0 |
| history-2 | 1 January 1943 | Soviet Union | 459 (89%) | 65 | 38% | x1.8 | 72% | yes | 49 | 0 |
| history-2 | 1 January 1943 | United Kingdom | 146 (100%) | 50 | 2% | x1.2 | 69% | yes | 65 | 0 |
| history-2 | 1 January 1944 | Soviet Union | 459 (98%) | 121 | 11% | x2.3 | 55% | yes | 59 | 0 |
| history-2 | 1 January 1944 | United Kingdom | 155 (96%) | 63 | 2% | x1.2 | 73% | yes | 63 | 0 |
| history-2 | 1 January 1945 | Soviet Union | 588 (100%) | 135 | 5% | x2.4 | 39% | yes | 56 | 0 |
| history-2 | 1 January 1945 | United Kingdom | 165 (99%) | 75 | 2% | x1.2 | 61% | no | 57 | 0 |
| history-2 | 8 May 1945 | Soviet Union | 606 (100%) | 140 | 4% | x2.5 | 38% | no | 57 | 0 |
| history-2 | 8 May 1945 | United Kingdom | 167 (100%) | 79 | 2% | x1.2 | 58% | no | 57 | 0 |
| history-3 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-3 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-3 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-3 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-3 | 1 January 1940 | Soviet Union | 212 (100%) | 49 | 2% | x1.1 | 46% | no | 68 | 0 |
| history-3 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-3 | 1 January 1941 | Germany | 298 (96%) | 79 | 2% | x1.1 | 45% | yes | 57 | 0 |
| history-3 | 1 January 1941 | Soviet Union | 287 (100%) | 68 | 2% | x1.1 | 38% | no | 65 | 0 |
| history-3 | 1 January 1941 | United Kingdom | 125 (99%) | 28 | 2% | x1.1 | 46% | yes | 71 | 0 |
| history-3 | 1 January 1942 | Germany | 337 (83%) | 102 | 2% | x1.1 | 49% | yes | 60 | 0 |
| history-3 | 1 January 1942 | Soviet Union | 468 (83%) | 60 | 31% | x1.2 | 82% | yes | 65 | 0 |
| history-3 | 1 January 1942 | United Kingdom | 144 (99%) | 38 | 3% | x1.1 | 58% | yes | 65 | 0 |
| history-3 | 1 January 1943 | Germany | 364 (63%) | 119 | 2% | x1.2 | 56% | yes | 58 | 0 |
| history-3 | 1 January 1943 | Soviet Union | 457 (87%) | 64 | 40% | x1.9 | 72% | yes | 47 | 0 |
| history-3 | 1 January 1943 | United Kingdom | 142 (99%) | 48 | 2% | x1.2 | 69% | yes | 65 | 0 |
| history-3 | 1 January 1944 | Germany | 300 (52%) | 137 | 3% | x1.2 | 67% | yes | 50 | 0 |
| history-3 | 1 January 1944 | Soviet Union | 456 (94%) | 69 | 16% | x2.4 | 67% | yes | 55 | 0 |
| history-3 | 1 January 1944 | United Kingdom | 151 (93%) | 58 | 2% | x1.2 | 79% | yes | 64 | 0 |
| history-3 | 1 January 1945 | Soviet Union | 517 (99%) | 132 | 6% | x2.7 | 36% | yes | 55 | 0 |
| history-3 | 1 January 1945 | United Kingdom | 157 (96%) | 72 | 2% | x1.2 | 68% | no | 58 | 0 |
| history-3 | 8 May 1945 | Soviet Union | 533 (99%) | 137 | 5% | x2.7 | 36% | no | 55 | 0 |
| history-3 | 8 May 1945 | United Kingdom | 157 (99%) | 76 | 2% | x1.2 | 65% | no | 57 | 0 |
| 1939-1 | 1 January 1940 | Germany | 124 (98%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-1 | 1 January 1941 | Germany | 299 (94%) | 80 | 2% | x1.1 | 45% | yes | 58 | 0 |
| 1939-1 | 1 January 1941 | Soviet Union | 285 (100%) | 66 | 2% | x1.1 | 42% | no | 64 | 0 |
| 1939-1 | 1 January 1941 | United Kingdom | 128 (98%) | 28 | 2% | x1.1 | 45% | yes | 74 | 0 |
| 1939-1 | 1 January 1942 | Germany | 340 (79%) | 103 | 2% | x1.1 | 49% | yes | 59 | 0 |
| 1939-1 | 1 January 1942 | Soviet Union | 452 (87%) | 61 | 27% | x1.2 | 71% | yes | 67 | 0 |
| 1939-1 | 1 January 1942 | United Kingdom | 154 (100%) | 39 | 2% | x1.1 | 56% | yes | 71 | 0 |
| 1939-1 | 1 January 1943 | Germany | 372 (62%) | 121 | 2% | x1.2 | 57% | yes | 56 | 0 |
| 1939-1 | 1 January 1943 | Soviet Union | 452 (90%) | 63 | 32% | x1.7 | 78% | yes | 52 | 0 |
| 1939-1 | 1 January 1943 | United Kingdom | 154 (97%) | 49 | 2% | x1.2 | 68% | yes | 71 | 0 |
| 1939-1 | 1 January 1944 | Germany | 305 (39%) | 120 | 6% | x1.2 | 88% | yes | 51 | 0 |
| 1939-1 | 1 January 1944 | Soviet Union | 457 (98%) | 73 | 12% | x2.1 | 75% | yes | 60 | 0 |
| 1939-1 | 1 January 1944 | United Kingdom | 156 (85%) | 60 | 2% | x1.2 | 79% | yes | 66 | 0 |
| 1939-1 | 1 January 1945 | Soviet Union | 570 (100%) | 85 | 5% | x2.3 | 67% | yes | 54 | 0 |
| 1939-1 | 1 January 1945 | United Kingdom | 169 (89%) | 71 | 2% | x1.2 | 68% | no | 57 | 0 |
| 1939-1 | 8 May 1945 | Soviet Union | 595 (100%) | 88 | 4% | x2.3 | 67% | no | 56 | 0 |
| 1939-1 | 8 May 1945 | United Kingdom | 172 (91%) | 75 | 2% | x1.2 | 65% | no | 57 | 0 |
| 1939-2 | 1 January 1940 | Germany | 124 (98%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-2 | 1 January 1941 | Germany | 296 (97%) | 80 | 2% | x1.1 | 45% | yes | 58 | 0 |
| 1939-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-2 | 1 January 1941 | United Kingdom | 126 (99%) | 28 | 2% | x1.1 | 45% | yes | 73 | 0 |
| 1939-2 | 1 January 1942 | Germany | 336 (85%) | 102 | 2% | x1.1 | 48% | yes | 60 | 0 |
| 1939-2 | 1 January 1942 | Soviet Union | 450 (77%) | 58 | 34% | x1.2 | 93% | yes | 65 | 0 |
| 1939-2 | 1 January 1942 | United Kingdom | 147 (100%) | 38 | 2% | x1.1 | 57% | yes | 65 | 0 |
| 1939-2 | 1 January 1943 | Germany | 360 (80%) | 123 | 2% | x1.2 | 50% | yes | 57 | 0 |
| 1939-2 | 1 January 1943 | Soviet Union | 432 (82%) | 55 | 86% | x2.3 | 86% | yes | 33 | 0 |
| 1939-2 | 1 January 1943 | United Kingdom | 143 (100%) | 49 | 2% | x1.2 | 70% | yes | 64 | 0 |
| 1939-2 | 1 January 1944 | Soviet Union | 431 (83%) | 58 | 105% | x6.4 | 41% | yes | 27 | 1 |
| 1939-2 | 1 January 1944 | United Kingdom | 139 (94%) | 100 | 2% | x1.2 | 50% | yes | 64 | 0 |
| 1939-2 | 1 January 1945 | Soviet Union | 431 (98%) | 58 | 79% | x14.8 | 14% | yes | 24 | 1 |
| 1939-2 | 1 January 1945 | United Kingdom | 149 (95%) | 122 | 2% | x1.2 | 38% | no | 64 | 0 |
| 1939-2 | 8 May 1945 | Soviet Union | 431 (100%) | 58 | 75% | x19.0 | 11% | yes | 24 | 1 |
| 1939-2 | 8 May 1945 | United Kingdom | 152 (97%) | 128 | 2% | x1.2 | 36% | no | 65 | 0 |
| 1939-3 | 1 January 1940 | Germany | 124 (97%) | 56 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-3 | 1 January 1940 | Soviet Union | 212 (100%) | 49 | 2% | x1.1 | 47% | no | 68 | 0 |
| 1939-3 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-3 | 1 January 1941 | Germany | 300 (92%) | 79 | 2% | x1.1 | 45% | yes | 57 | 0 |
| 1939-3 | 1 January 1941 | Soviet Union | 286 (100%) | 67 | 2% | x1.1 | 38% | no | 64 | 0 |
| 1939-3 | 1 January 1941 | United Kingdom | 131 (98%) | 28 | 2% | x1.1 | 45% | yes | 75 | 0 |
| 1939-3 | 1 January 1942 | Germany | 337 (78%) | 101 | 2% | x1.1 | 49% | yes | 56 | 0 |
| 1939-3 | 1 January 1942 | Soviet Union | 456 (86%) | 60 | 29% | x1.2 | 72% | yes | 65 | 0 |
| 1939-3 | 1 January 1942 | United Kingdom | 154 (99%) | 39 | 2% | x1.1 | 57% | yes | 71 | 0 |
| 1939-3 | 1 January 1943 | Germany | 317 (56%) | 119 | 2% | x1.2 | 56% | yes | 55 | 0 |
| 1939-3 | 1 January 1943 | Soviet Union | 455 (91%) | 67 | 32% | x1.8 | 67% | yes | 49 | 0 |
| 1939-3 | 1 January 1943 | United Kingdom | 153 (98%) | 46 | 2% | x1.2 | 73% | yes | 67 | 0 |
| 1939-3 | 1 January 1944 | Soviet Union | 484 (100%) | 114 | 9% | x2.1 | 49% | yes | 59 | 0 |
| 1939-3 | 1 January 1944 | United Kingdom | 155 (96%) | 65 | 2% | x1.2 | 66% | no | 63 | 0 |
| 1939-3 | 1 January 1945 | Soviet Union | 617 (100%) | 126 | 4% | x2.2 | 44% | no | 55 | 0 |
| 1939-3 | 1 January 1945 | United Kingdom | 167 (99%) | 77 | 2% | x1.2 | 54% | no | 62 | 0 |
| 1939-3 | 8 May 1945 | Soviet Union | 635 (100%) | 130 | 4% | x2.3 | 45% | no | 56 | 0 |
| 1939-3 | 8 May 1945 | United Kingdom | 169 (100%) | 83 | 2% | x1.2 | 52% | no | 62 | 0 |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 22 of 55 | 0 | 336 | 443 | 162 | with Germany |
| history-1 | 1 January 1943 | 4 of 55 | 0 | 358 | 443 | 170 | with Germany |
| history-1 | 1 January 1944 | 0 of 55 | 22 | 0 | 510 | 176 | with the Allies |
| history-1 | 1 January 1945 | 0 of 55 | 22 | 0 | 580 | 194 | with the Allies |
| history-2 | 1 January 1942 | 20 of 55 | 0 | 337 | 459 | 144 | with Germany |
| history-2 | 1 January 1943 | 4 of 55 | 0 | 358 | 459 | 146 | with Germany |
| history-2 | 1 January 1944 | 0 of 55 | 22 | 0 | 459 | 155 | with the Allies |
| history-2 | 1 January 1945 | 0 of 55 | 22 | 0 | 588 | 165 | with the Allies |
| history-3 | 1 January 1942 | 23 of 55 | 0 | 337 | 468 | 144 | with Germany |
| history-3 | 1 January 1943 | 12 of 55 | 0 | 364 | 457 | 142 | with Germany |
| history-3 | 1 January 1944 | 0 of 55 | 0 | 300 | 456 | 151 | with the Allies |
| history-3 | 1 January 1945 | 0 of 55 | 22 | 0 | 517 | 157 | with the Allies |
| 1939-1 | 1 January 1942 | 13 of 55 | 0 | 340 | 452 | 154 | with Germany |
| 1939-1 | 1 January 1943 | 5 of 55 | 0 | 372 | 452 | 154 | with Germany |
| 1939-1 | 1 January 1944 | 0 of 55 | 8 | 305 | 457 | 156 | with the Allies |
| 1939-1 | 1 January 1945 | 0 of 55 | 22 | 0 | 570 | 169 | with the Allies |
| 1939-2 | 1 January 1942 | 35 of 55 | 0 | 336 | 450 | 147 | with Germany |
| 1939-2 | 1 January 1943 | 43 of 55 | 0 | 360 | 432 | 143 | with Germany |
| 1939-2 | 1 January 1944 | 26 of 55 | 22 | 0 | 431 | 139 | with the Allies |
| 1939-2 | 1 January 1945 | 26 of 55 | 22 | 0 | 431 | 149 | with the Allies |
| 1939-3 | 1 January 1942 | 17 of 55 | 0 | 337 | 456 | 154 | with Germany |
| 1939-3 | 1 January 1943 | 4 of 55 | 0 | 317 | 455 | 153 | with Germany |
| 1939-3 | 1 January 1944 | 0 of 55 | 22 | 0 | 484 | 155 | with the Allies |
| 1939-3 | 1 January 1945 | 0 of 55 | 22 | 0 | 617 | 167 | with the Allies |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 81 | Albania, Estonia, Latvia, Lithuania, Finland, Germany, Romania, Hungary | none |
| history-2 | 82 | Albania, Finland, Estonia, Latvia, Lithuania, Hungary, Germany | none |
| history-3 | 84 | Albania, Finland, Estonia, Latvia, Lithuania, Hungary, Germany | none |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | France | 0 of 55 | Germany 343, Soviet Union 253, Romania 88 |
| history-2 | 52 | Franco | France | 0 of 55 | Germany 372, Soviet Union 248, Romania 77 |
| history-3 | 52 | Franco | France | 0 of 55 | Soviet Union 362, Germany 347, Hungary 117 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 20 | 14 | 5 | Soviet Union 211 (+118), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 25 | 15 | 6 | Soviet Union 174 (+81), Germany 156 (+88), Romania 80 (+55) | none |
| ffa-3 | 1 April 1936 | 28 | 16 | 8 | Soviet Union 240 (+147), Italy 201 (+150), Germany 109 (+41) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 16 / 71 / 5 | 21 + 3 | 0% | 4 | 199 |
| history-1 | France | 0 / 0 / 0 | 3 + 0 | 0% | 0 | 82 |
| history-1 | Italy | 4 / 11 / 9 | 12 + 6 | 0% | 0 | 147 |
| history-1 | Soviet Union | 2 / 15 / 31 | 66 + 25 | 0% | 0 | 597 |
| history-1 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 10 |
| history-2 | United Kingdom | 15 / 70 / 4 | 20 + 3 | 0% | 3 | 167 |
| history-2 | France | 0 / 0 / 0 | 3 + 0 | 0% | 0 | 70 |
| history-2 | Italy | 4 / 16 / 9 | 9 + 4 | 0% | 0 | 91 |
| history-2 | Soviet Union | 2 / 15 / 33 | 59 + 27 | 0% | 0 | 606 |
| history-2 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 8 |
| history-3 | United Kingdom | 16 / 74 / 5 | 13 + 3 | 0% | 3 | 157 |
| history-3 | France | 0 / 0 / 0 | 4 + 0 | 0% | 0 | 79 |
| history-3 | Italy | 4 / 13 / 10 | 8 + 4 | 0% | 0 | 38 |
| history-3 | Soviet Union | 2 / 14 / 28 | 57 + 30 | 0% | 0 | 533 |
| history-3 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 9 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 0 | 19 | 4 | 0 | 0 |
| history-2 | 0 | 20 | 3 | 0 | 0 |
| history-3 | 0 | 13 | 3 | 0 | 0 |

## What the results say

Stage K4 brought the finer map (280 provinces) and deep attacks. The first runs on the new map
went badly wrong in one way: France now has two provinces on the German border (Alsace and
Lorraine) instead of one, so its AI stood 28 divisions there in September 1939 and marched on
Berlin while Germany was in Poland; Germany surrendered to France on 30 October 1939. Three
changes put that right, all in Story mode only:

- **The phoney war.** From September 1939 an AI France and Britain wait behind their border,
  and an AI Germany keeps only a screen in the West (about the guard its border needs), until
  Germany attacks in the West (its plan for 10 May 1940) or any German division crosses
  into France or the Low Countries. Divisions changing places in that time keep to friendly
  land. Without the screen rule Germany sent half its army west and through Italy, and
  Poland held out until 1940.
- **No British landing on Germany's own coast before Normandy.** One run had a landing in
  Schleswig-Holstein walk into an empty Berlin in June 1941.
- **Italy hands back what it held of the Vichy zone** at the armistice (it kept Provence once).

What the runs show now:

- **Poland** surrenders on 29 September to 12 October from 1936, and 29 September to
  3 October from 1939 (really 6 October). See also docs/balance-stage-k4-poland.md.
- **France** falls on 31 July to 12 September 1940 (K1: July to September; really 22 June). A
  little slow: the French line is longer on the finer map.
- **Moscow** never falls (K3: 1 run of 3). Barbarossa now goes deeper than before: by
  1 January 1942 the Axis holds 13 to 35 of the 55 Soviet provinces (K2: 2 to 7 of 28).
- **Italy** changes sides in 5 runs of 6 between September and November 1943, close to history.
- **Greece** never falls (K3: 2 runs of 3). The German attack goes in late, after a slow
  Yugoslav campaign, and Greece makes a last stand in Attica with most of its army: Athens
  holds most of its victory points, so it never reaches the surrender line. Known gap.
- **Germany** still falls too early, between October 1943 and March 1944 (K3: August 1943 to
  September 1944). This is the same gap as before (the war economy and the army AI after
  Italy changes sides), not something the new map made worse.
- **One 1939 run** (1939-2) had Soviet inflation reach 124% a year and the Soviet government
  fall; the other five Soviet economies came through as before (prices x2.3 to x2.7).
- **The army bot** (a player Germany giving only army orders): two runs of three take Poland,
  in mid-November (K3: 27 September), and France does not fall, as before. In the third run
  the Polish army slips past the two armies at Warsaw into an empty Germany and Germany
  surrenders to Poland in February 1940. That is the old gap that a player's armies keep no
  capital garrison; the bot does not keep one either.
- **Deep attacks** happen in every run: 78 to 258 divisions pushed on in a run, nearly all of
  them in the AI's own wars (an AI division sent across an empty province into a defended one
  can push on too). Battles still last about 2 days on average.
- **Speed**: 13 to 19 milliseconds a game day with everything led by the AI (K3: about 15),
  well inside the 60 the fastest speed allows.
