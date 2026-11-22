# Balance report, Stage L: 200 AI against AI wars, 24 finance playtests, four years of peace, six runs of history, three free-for-alls and three games played with armies

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 80% | 20% | 0% | 116 | 3.4 | 13.8 | 23 | 82% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 20% | 80% | 0% | 120 | 6.9 | 4.7 | 19 | 77% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 21 | 0.2 | 1.3 | 4 | 92% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 27 | 0.5 | 1.9 | 3 | 77% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 25% | 0% | 75% | 130 | 0.0 | 4.1 | 5 | 34% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 95% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 33 | 0.1 | 5.8 | 32 | 98% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 64 | 0.0 | 11.9 | 14 | 55% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 73 | 0.0 | 8.4 | 12 | 78% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 80% | 0% | 20% | 204 | 0.5 | 14.5 | 23 | 37% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| Poland falls | 6 October 1939 | 6 October 1939 | 26 September 1939 | 7 October 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 January 1940 | did not happen | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 15 April 1940 | 8 June 1940 | 15 April 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 24 June 1940 | 19 August 1940 | 24 June 1940 |
| France falls | 22 June 1940 | 22 July 1940 | 28 August 1940 | 14 July 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 23 July 1940 | 29 August 1940 | 15 July 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 30 August 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 1 June 1941 | 26 July 1941 | 22 July 1941 |
| Greece falls | 23 April 1941 | 25 August 1941 | 24 July 1941 | 25 September 1941 |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Mussolini falls | 25 July 1943 | 11 August 1943 | did not happen | 19 August 1943 |
| Italy signs an armistice and changes sides | 8 September 1943 | 26 September 1943 | did not happen | 4 October 1943 |
| Moscow falls | never | did not happen | did not happen | did not happen |
| The Soviet Union surrenders | never | did not happen | did not happen | did not happen |
| Germany surrenders | 8 May 1945 | 12 August 1944 | 9 May 1944 | 27 June 1944 |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 10 August 1943 | did not happen | 18 August 1943 |
| The Allies land in northern France or the Low Countries | 6 June 1944 | did not happen | did not happen | 15 June 1944 |
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
| history-1 | 637 | 2.1 | 31% | 231 | 20 | 88 |
| history-2 | 689 | 1.7 | 32% | 234 | 15 | 88 |
| history-3 | 740 | 1.7 | 28% | 231 | 13 | 107 |
| 1939-1 | 578 | 2.5 | 37% | 159 | 13 | 55 |
| 1939-2 | 768 | 1.8 | 34% | 220 | 14 | 86 |
| 1939-3 | 700 | 2.1 | 36% | 292 | 22 | 83 |

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
| armies-1 | did not fall | did not fall | 0 | 22 | 4 |  | 27 | 10.2 |
| armies-2 | did not fall | did not fall | 0 | 22 | 1 |  | 25 | 15.3 |
| armies-3 | did not fall | did not fall | 0 | 22 | 3 |  | 24 | 15.3 |

## Land, sea and air together

Stage K3 lets the player (and the AI) aim air wings at one province, shell a coast from the
sea, and drop paratroopers. For each run: how many AI bomber wings were aimed at a battle on an
average day, how many fleets were shelling a coast, the paratrooper divisions each country had
on an average day, and the drops made (empty provinces taken, and drops into a battle).

| Run | Bomber wings aimed at a battle (average day) | Fleets shelling (average day) | Paratrooper divisions (average day) | Drops | Drops by | First drop |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | 12.5 | 0.4 | Soviet Union 3, Germany 3, Italy 0, United Kingdom 2 | 35 (20 into a battle) | Soviet Union 18, Germany 5, Italy 2, United Kingdom 10 | 6 February 1943 |
| history-2 | 9.9 | 0.3 | Soviet Union 3, Germany 3, Italy 1, United Kingdom 2 | 37 (22 into a battle) | Soviet Union 21, Germany 15, United Kingdom 1 | 1 February 1942 |
| history-3 | 9.9 | 0.2 | Soviet Union 3, Germany 3, Italy 0, United Kingdom 2 | 33 (23 into a battle) | Soviet Union 17, Germany 4, United Kingdom 12 | 10 March 1942 |
| 1939-1 | 11.3 | 0.4 | Soviet Union 4, Germany 4, Italy 1, United Kingdom 3 | 16 (8 into a battle) | Germany 5, Soviet Union 3, United Kingdom 8 | 27 June 1942 |
| 1939-2 | 12.5 | 0.4 | Soviet Union 3, Germany 5, Italy 1, United Kingdom 2 | 23 (8 into a battle) | Soviet Union 8, United Kingdom 9, Germany 6 | 13 August 1943 |
| 1939-3 | 14.6 | 0.6 | Soviet Union 4, Germany 5, Italy 1, United Kingdom 2 | 26 (19 into a battle) | Soviet Union 10, Germany 5, United Kingdom 11 | 24 July 1943 |

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
| history-1 | 13.6 | 6 October 1939 | 216 | 16 |
| history-2 | 12.2 | 26 September 1939 | 180 | 14 |
| history-3 | 13.3 | 7 October 1939 | 194 | 13 |
| 1939-1 | 20.8 | 28 September 1939 | 169 | 12 |
| 1939-2 | 19.6 | 30 September 1939 | 257 | 15 |
| 1939-3 | 20.2 | 30 September 1939 | 209 | 10 |

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
| history-1 | 22 July 1940 | 26 September 1943 | 12 August 1944 | 50% | x3.0 | 0 | communist |
| history-2 | 28 August 1940 | did not fall | 9 May 1944 | 42% | x2.3 | 0 | communist |
| history-3 | 14 July 1940 | 4 October 1943 | 27 June 1944 | 48% | x2.8 | 0 | communist |
| 1939-1 | 26 August 1940 | 24 October 1943 | did not fall | 236% | x52.9 | 3 | authoritarian |
| 1939-2 | 8 August 1940 | 1 February 1944 | 7 October 1944 | 79% | x9.3 | 0 | communist |
| 1939-3 | 20 July 1940 | 28 March 1944 | 12 April 1945 | 62% | x4.3 | 0 | communist |

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-1 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-1 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-1 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 44% | yes | 70 | 0 |
| history-1 | 1 January 1940 | Soviet Union | 212 (100%) | 50 | 2% | x1.1 | 44% | no | 68 | 0 |
| history-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-1 | 1 January 1941 | Germany | 296 (97%) | 76 | 2% | x1.1 | 47% | yes | 57 | 0 |
| history-1 | 1 January 1941 | Soviet Union | 286 (100%) | 69 | 2% | x1.1 | 36% | no | 65 | 0 |
| history-1 | 1 January 1941 | United Kingdom | 126 (98%) | 25 | 4% | x1.1 | 49% | yes | 70 | 0 |
| history-1 | 1 January 1942 | Germany | 336 (86%) | 105 | 2% | x1.1 | 48% | yes | 56 | 0 |
| history-1 | 1 January 1942 | Soviet Union | 456 (81%) | 39 | 35% | x1.2 | 98% | yes | 65 | 0 |
| history-1 | 1 January 1942 | United Kingdom | 145 (100%) | 37 | 4% | x1.2 | 58% | yes | 66 | 0 |
| history-1 | 1 January 1943 | Germany | 341 (76%) | 122 | 2% | x1.2 | 55% | yes | 53 | 0 |
| history-1 | 1 January 1943 | Soviet Union | 456 (72%) | 43 | 43% | x1.9 | 83% | yes | 47 | 0 |
| history-1 | 1 January 1943 | United Kingdom | 153 (100%) | 43 | 2% | x1.2 | 72% | yes | 66 | 0 |
| history-1 | 1 January 1944 | Germany | 333 (70%) | 140 | 2% | x1.2 | 62% | yes | 52 | 0 |
| history-1 | 1 January 1944 | Soviet Union | 452 (77%) | 66 | 21% | x2.7 | 59% | yes | 53 | 0 |
| history-1 | 1 January 1944 | United Kingdom | 165 (99%) | 46 | 2% | x1.2 | 90% | yes | 65 | 0 |
| history-1 | 1 January 1945 | Soviet Union | 538 (91%) | 98 | 7% | x3.0 | 48% | yes | 56 | 0 |
| history-1 | 1 January 1945 | United Kingdom | 171 (94%) | 65 | 2% | x1.3 | 73% | no | 60 | 0 |
| history-1 | 8 May 1945 | Soviet Union | 554 (92%) | 102 | 5% | x3.0 | 47% | yes | 55 | 0 |
| history-1 | 8 May 1945 | United Kingdom | 173 (97%) | 68 | 2% | x1.3 | 69% | no | 60 | 0 |
| history-2 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-2 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-2 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-2 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 43% | yes | 70 | 0 |
| history-2 | 1 January 1940 | Soviet Union | 221 (100%) | 49 | 2% | x1.1 | 46% | no | 68 | 0 |
| history-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-2 | 1 January 1941 | Germany | 296 (93%) | 76 | 2% | x1.1 | 46% | yes | 57 | 0 |
| history-2 | 1 January 1941 | Soviet Union | 289 (100%) | 67 | 2% | x1.1 | 40% | no | 66 | 0 |
| history-2 | 1 January 1941 | United Kingdom | 126 (98%) | 28 | 2% | x1.1 | 45% | yes | 76 | 0 |
| history-2 | 1 January 1942 | Germany | 336 (86%) | 101 | 2% | x1.1 | 49% | yes | 56 | 0 |
| history-2 | 1 January 1942 | Soviet Union | 458 (90%) | 55 | 27% | x1.2 | 75% | yes | 67 | 0 |
| history-2 | 1 January 1942 | United Kingdom | 144 (100%) | 39 | 2% | x1.1 | 58% | yes | 67 | 0 |
| history-2 | 1 January 1943 | Germany | 337 (69%) | 119 | 2% | x1.2 | 56% | yes | 53 | 0 |
| history-2 | 1 January 1943 | Soviet Union | 458 (91%) | 64 | 32% | x1.7 | 76% | yes | 52 | 0 |
| history-2 | 1 January 1943 | United Kingdom | 144 (100%) | 49 | 2% | x1.2 | 70% | yes | 65 | 0 |
| history-2 | 1 January 1944 | Germany | 305 (58%) | 131 | 3% | x1.2 | 72% | yes | 54 | 0 |
| history-2 | 1 January 1944 | Soviet Union | 503 (97%) | 74 | 11% | x2.1 | 72% | yes | 60 | 0 |
| history-2 | 1 January 1944 | United Kingdom | 153 (100%) | 58 | 2% | x1.2 | 81% | yes | 64 | 0 |
| history-2 | 1 January 1945 | Soviet Union | 552 (97%) | 126 | 5% | x2.3 | 50% | yes | 56 | 0 |
| history-2 | 1 January 1945 | United Kingdom | 166 (100%) | 70 | 2% | x1.2 | 75% | no | 58 | 0 |
| history-2 | 8 May 1945 | Soviet Union | 568 (98%) | 131 | 4% | x2.3 | 49% | no | 56 | 0 |
| history-2 | 8 May 1945 | United Kingdom | 169 (100%) | 74 | 2% | x1.2 | 72% | no | 57 | 0 |
| history-3 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-3 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-3 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-3 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 44% | yes | 70 | 0 |
| history-3 | 1 January 1940 | Soviet Union | 213 (100%) | 50 | 2% | x1.1 | 44% | no | 68 | 0 |
| history-3 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-3 | 1 January 1941 | Germany | 294 (98%) | 76 | 2% | x1.1 | 47% | yes | 57 | 0 |
| history-3 | 1 January 1941 | Soviet Union | 287 (100%) | 70 | 2% | x1.1 | 35% | no | 64 | 0 |
| history-3 | 1 January 1941 | United Kingdom | 125 (99%) | 25 | 4% | x1.1 | 48% | yes | 71 | 0 |
| history-3 | 1 January 1942 | Germany | 336 (83%) | 104 | 2% | x1.1 | 48% | yes | 56 | 0 |
| history-3 | 1 January 1942 | Soviet Union | 460 (79%) | 38 | 32% | x1.2 | 107% | yes | 65 | 0 |
| history-3 | 1 January 1942 | United Kingdom | 144 (100%) | 37 | 4% | x1.2 | 58% | yes | 65 | 0 |
| history-3 | 1 January 1943 | Germany | 335 (69%) | 118 | 2% | x1.2 | 56% | yes | 55 | 0 |
| history-3 | 1 January 1943 | Soviet Union | 456 (77%) | 62 | 39% | x1.9 | 67% | yes | 47 | 0 |
| history-3 | 1 January 1943 | United Kingdom | 145 (100%) | 45 | 2% | x1.2 | 71% | yes | 64 | 0 |
| history-3 | 1 January 1944 | Germany | 321 (57%) | 136 | 2% | x1.2 | 66% | yes | 48 | 0 |
| history-3 | 1 January 1944 | Soviet Union | 452 (82%) | 71 | 17% | x2.5 | 59% | yes | 55 | 0 |
| history-3 | 1 January 1944 | United Kingdom | 158 (100%) | 51 | 2% | x1.2 | 84% | yes | 64 | 0 |
| history-3 | 1 January 1945 | Soviet Union | 528 (94%) | 126 | 6% | x2.7 | 41% | yes | 56 | 0 |
| history-3 | 1 January 1945 | United Kingdom | 164 (95%) | 78 | 2% | x1.3 | 61% | no | 59 | 0 |
| history-3 | 8 May 1945 | Soviet Union | 544 (95%) | 131 | 5% | x2.8 | 41% | no | 56 | 0 |
| history-3 | 8 May 1945 | United Kingdom | 168 (96%) | 82 | 2% | x1.3 | 58% | no | 60 | 0 |
| 1939-1 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 43% | yes | 70 | 0 |
| 1939-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-1 | 1 January 1941 | Germany | 296 (96%) | 77 | 2% | x1.1 | 46% | yes | 57 | 0 |
| 1939-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-1 | 1 January 1941 | United Kingdom | 122 (99%) | 28 | 2% | x1.1 | 45% | yes | 73 | 0 |
| 1939-1 | 1 January 1942 | Germany | 333 (83%) | 101 | 2% | x1.1 | 50% | yes | 59 | 0 |
| 1939-1 | 1 January 1942 | Soviet Union | 456 (80%) | 30 | 34% | x1.2 | 126% | yes | 66 | 0 |
| 1939-1 | 1 January 1942 | United Kingdom | 146 (100%) | 39 | 2% | x1.1 | 58% | yes | 68 | 0 |
| 1939-1 | 1 January 1943 | Germany | 334 (73%) | 124 | 2% | x1.2 | 52% | yes | 58 | 0 |
| 1939-1 | 1 January 1943 | Soviet Union | 436 (66%) | 22 | 83% | x2.3 | 141% | yes | 34 | 0 |
| 1939-1 | 1 January 1943 | United Kingdom | 147 (99%) | 48 | 2% | x1.2 | 70% | yes | 66 | 0 |
| 1939-1 | 1 January 1944 | Germany | 334 (74%) | 160 | 2% | x1.2 | 50% | yes | 54 | 0 |
| 1939-1 | 1 January 1944 | Soviet Union | 422 (57%) | 20 | 126% | x6.3 | 78% | yes | 36 | 1 |
| 1939-1 | 1 January 1944 | United Kingdom | 147 (100%) | 57 | 2% | x1.2 | 82% | yes | 65 | 0 |
| 1939-1 | 1 January 1945 | Germany | 325 (72%) | 170 | 2% | x1.2 | 51% | yes | 57 | 0 |
| 1939-1 | 1 January 1945 | Soviet Union | 380 (55%) | 19 | 188% | x27.6 | 17% | yes | 36 | 3 |
| 1939-1 | 1 January 1945 | United Kingdom | 147 (94%) | 71 | 2% | x1.2 | 76% | yes | 63 | 0 |
| 1939-1 | 8 May 1945 | Germany | 327 (68%) | 182 | 2% | x1.2 | 48% | yes | 57 | 0 |
| 1939-1 | 8 May 1945 | Soviet Union | 372 (53%) | 14 | 236% | x52.9 | 14% | yes | 15 | 3 |
| 1939-1 | 8 May 1945 | United Kingdom | 151 (88%) | 76 | 2% | x1.2 | 76% | yes | 63 | 0 |
| 1939-2 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 43% | yes | 70 | 0 |
| 1939-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 69 | 0 |
| 1939-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-2 | 1 January 1941 | Germany | 296 (97%) | 77 | 2% | x1.1 | 46% | yes | 57 | 0 |
| 1939-2 | 1 January 1941 | Soviet Union | 286 (100%) | 67 | 2% | x1.1 | 41% | no | 67 | 0 |
| 1939-2 | 1 January 1941 | United Kingdom | 124 (99%) | 28 | 2% | x1.1 | 45% | yes | 73 | 0 |
| 1939-2 | 1 January 1942 | Germany | 337 (83%) | 107 | 2% | x1.1 | 47% | yes | 56 | 0 |
| 1939-2 | 1 January 1942 | Soviet Union | 460 (78%) | 28 | 35% | x1.2 | 149% | yes | 66 | 0 |
| 1939-2 | 1 January 1942 | United Kingdom | 145 (100%) | 39 | 2% | x1.1 | 58% | yes | 66 | 0 |
| 1939-2 | 1 January 1943 | Germany | 335 (74%) | 127 | 2% | x1.2 | 52% | yes | 53 | 0 |
| 1939-2 | 1 January 1943 | Soviet Union | 454 (71%) | 28 | 71% | x2.2 | 116% | yes | 38 | 0 |
| 1939-2 | 1 January 1943 | United Kingdom | 144 (99%) | 48 | 2% | x1.2 | 70% | yes | 66 | 0 |
| 1939-2 | 1 January 1944 | Germany | 334 (71%) | 145 | 2% | x1.2 | 60% | yes | 49 | 0 |
| 1939-2 | 1 January 1944 | Soviet Union | 448 (66%) | 29 | 79% | x4.5 | 79% | yes | 28 | 0 |
| 1939-2 | 1 January 1944 | United Kingdom | 145 (100%) | 58 | 2% | x1.2 | 80% | yes | 66 | 0 |
| 1939-2 | 1 January 1945 | Soviet Union | 431 (79%) | 117 | 42% | x8.2 | 16% | yes | 33 | 0 |
| 1939-2 | 1 January 1945 | United Kingdom | 139 (87%) | 75 | 2% | x1.2 | 70% | no | 61 | 0 |
| 1939-2 | 8 May 1945 | Soviet Union | 431 (90%) | 123 | 35% | x9.3 | 13% | yes | 37 | 0 |
| 1939-2 | 8 May 1945 | United Kingdom | 143 (90%) | 79 | 2% | x1.2 | 67% | no | 59 | 0 |
| 1939-3 | 1 January 1940 | Germany | 124 (98%) | 56 | 2% | x1.1 | 43% | yes | 70 | 0 |
| 1939-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 69 | 0 |
| 1939-3 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-3 | 1 January 1941 | Germany | 295 (97%) | 77 | 2% | x1.1 | 46% | yes | 59 | 0 |
| 1939-3 | 1 January 1941 | Soviet Union | 286 (100%) | 67 | 2% | x1.1 | 41% | no | 67 | 0 |
| 1939-3 | 1 January 1941 | United Kingdom | 128 (100%) | 28 | 2% | x1.1 | 45% | yes | 72 | 0 |
| 1939-3 | 1 January 1942 | Germany | 328 (88%) | 103 | 2% | x1.1 | 49% | yes | 59 | 0 |
| 1939-3 | 1 January 1942 | Soviet Union | 484 (83%) | 36 | 35% | x1.2 | 115% | yes | 66 | 0 |
| 1939-3 | 1 January 1942 | United Kingdom | 167 (100%) | 36 | 2% | x1.1 | 62% | yes | 65 | 0 |
| 1939-3 | 1 January 1943 | Germany | 340 (74%) | 118 | 2% | x1.2 | 57% | yes | 58 | 0 |
| 1939-3 | 1 January 1943 | Soviet Union | 484 (80%) | 54 | 58% | x2.1 | 76% | yes | 40 | 0 |
| 1939-3 | 1 January 1943 | United Kingdom | 167 (100%) | 37 | 2% | x1.2 | 79% | yes | 65 | 0 |
| 1939-3 | 1 January 1944 | Germany | 326 (67%) | 137 | 2% | x1.2 | 64% | yes | 53 | 0 |
| 1939-3 | 1 January 1944 | Soviet Union | 477 (81%) | 64 | 39% | x3.3 | 57% | yes | 44 | 0 |
| 1939-3 | 1 January 1944 | United Kingdom | 204 (100%) | 37 | 2% | x1.2 | 99% | yes | 65 | 0 |
| 1939-3 | 1 January 1945 | Germany | 278 (46%) | 153 | 2% | x1.2 | 65% | yes | 54 | 0 |
| 1939-3 | 1 January 1945 | Soviet Union | 489 (98%) | 82 | 12% | x4.1 | 50% | yes | 59 | 0 |
| 1939-3 | 1 January 1945 | United Kingdom | 192 (90%) | 49 | 2% | x1.2 | 99% | yes | 65 | 0 |
| 1939-3 | 8 May 1945 | Soviet Union | 486 (99%) | 92 | 9% | x4.3 | 53% | yes | 63 | 0 |
| 1939-3 | 8 May 1945 | United Kingdom | 199 (88%) | 90 | 2% | x1.2 | 64% | no | 63 | 0 |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 21 of 55 | 0 | 336 | 456 | 145 | with Germany |
| history-1 | 1 January 1943 | 17 of 55 | 0 | 341 | 456 | 153 | with Germany |
| history-1 | 1 January 1944 | 4 of 55 | 0 | 333 | 452 | 165 | with the Allies |
| history-1 | 1 January 1945 | 0 of 55 | 22 | 0 | 538 | 171 | with the Allies |
| history-2 | 1 January 1942 | 13 of 55 | 0 | 336 | 458 | 144 | with Germany |
| history-2 | 1 January 1943 | 4 of 55 | 0 | 337 | 458 | 144 | with Germany |
| history-2 | 1 January 1944 | 0 of 55 | 1 | 305 | 503 | 153 | with Germany |
| history-2 | 1 January 1945 | 0 of 55 | 22 | 0 | 552 | 166 | with Germany |
| history-3 | 1 January 1942 | 19 of 55 | 0 | 336 | 460 | 144 | with Germany |
| history-3 | 1 January 1943 | 7 of 55 | 0 | 335 | 456 | 145 | with Germany |
| history-3 | 1 January 1944 | 0 of 55 | 1 | 321 | 452 | 158 | with the Allies |
| history-3 | 1 January 1945 | 0 of 55 | 22 | 0 | 528 | 164 | with the Allies |
| 1939-1 | 1 January 1942 | 28 of 55 | 0 | 333 | 456 | 146 | with Germany |
| 1939-1 | 1 January 1943 | 37 of 55 | 0 | 334 | 436 | 147 | with Germany |
| 1939-1 | 1 January 1944 | 39 of 55 | 0 | 334 | 422 | 147 | with the Allies |
| 1939-1 | 1 January 1945 | 40 of 55 | 0 | 325 | 380 | 147 | with the Allies |
| 1939-2 | 1 January 1942 | 30 of 55 | 0 | 337 | 460 | 145 | with Germany |
| 1939-2 | 1 January 1943 | 30 of 55 | 0 | 335 | 454 | 144 | with Germany |
| 1939-2 | 1 January 1944 | 29 of 55 | 0 | 334 | 448 | 145 | with Germany |
| 1939-2 | 1 January 1945 | 0 of 55 | 22 | 0 | 431 | 139 | with the Allies |
| 1939-3 | 1 January 1942 | 21 of 55 | 0 | 328 | 484 | 167 | with Germany |
| 1939-3 | 1 January 1943 | 13 of 55 | 0 | 340 | 484 | 167 | with Germany |
| 1939-3 | 1 January 1944 | 3 of 55 | 0 | 326 | 477 | 204 | with Germany |
| 1939-3 | 1 January 1945 | 0 of 55 | 2 | 278 | 489 | 192 | fallen |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 86 | Albania, Estonia, Latvia, Lithuania, Finland, Germany, Hungary, Romania | none |
| history-2 | 85 | Albania, Finland, Estonia, Latvia, Lithuania, Germany | none |
| history-3 | 85 | Albania, Estonia, Latvia, Lithuania, Romania, Germany | none |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | France | 0 of 55 | Germany 363, Soviet Union 267, Romania 110 |
| history-2 | 52 | Franco | France | 0 of 55 | Germany 382, Soviet Union 277, Hungary 109 |
| history-3 | 52 | Franco | France | 0 of 55 | Soviet Union 314, Germany 313, Romania 98 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 20 | 14 | 5 | Soviet Union 211 (+118), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 24 | 16 | 6 | Soviet Union 190 (+97), Germany 135 (+67), Romania 80 (+55) | none |
| ffa-3 | 1 April 1936 | 30 | 16 | 8 | Soviet Union 253 (+160), Italy 198 (+147), Germany 99 (+31) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 15 / 70 / 5 | 22 + 4 | 0% | 5 | 173 |
| history-1 | France | 0 / 0 / 0 | 3 + 0 | 0% | 0 | 78 |
| history-1 | Italy | 4 / 13 / 10 | 28 + 10 | 0% | 0 | 33 |
| history-1 | Soviet Union | 1 / 13 / 24 | 97 + 32 | 0% | 0 | 554 |
| history-1 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 7 |
| history-2 | United Kingdom | 17 / 77 / 5 | 19 + 4 | 0% | 0 | 169 |
| history-2 | France | 0 / 1 / 0 | 2 + 1 | 0% | 0 | 90 |
| history-2 | Italy | 4 / 12 / 10 | 6 + 4 | 0% | 0 | 178 |
| history-2 | Soviet Union | 2 / 15 / 29 | 83 + 30 | 0% | 0 | 568 |
| history-2 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 7 |
| history-3 | United Kingdom | 17 / 76 / 5 | 18 + 5 | 0% | 4 | 168 |
| history-3 | France | 0 / 0 / 0 | 3 + 0 | 0% | 0 | 81 |
| history-3 | Italy | 4 / 13 / 9 | 25 + 6 | 0% | 0 | 22 |
| history-3 | Soviet Union | 2 / 14 / 28 | 93 + 31 | 0% | 0 | 544 |
| history-3 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 8 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 0 | 16 | 5 | 0 | 0 |
| history-2 | 0 | 21 | 0 | 0 | 0 |
| history-3 | 0 | 21 | 4 | 0 | 0 |

## What the results say

Stage L is a balance pass with four aims, in order: Germany fell too early (October 1943 to
March 1944 in the Stage K4 runs, within about a year of Italy changing sides); Greece never
fell; Moscow never fell on the finer map; and the AI's Poland played worse than a player who
gives no orders, with no AI army keeping a garrison at home.

The six history runs above are too few to compare versions: one change early in the war sends
a run down a different path. So each change was also tried on 16 whole Story-mode wars, eight
from 1936 and eight from September 1939 (seeds sweep-1936-1 to 8 and sweep-1939-1 to 8), every
country led by the AI, with `node scripts/sweep.mjs`. Version 1.5.0 against 1.6.0, the same seeds:

| Start, seed | Germany falls, 1.5 | 1.6 | Italy's armistice, 1.5 | 1.6 | Greece falls, 1.5 | 1.6 | Moscow falls, 1.5 | 1.6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1936, seed 1 | 27 October 1943 | 18 April 1945 | 10 October 1943 | 28 September 1943 | - | 4 August 1941 | - | - |
| 1936, seed 2 | 31 August 1943 | not by August 1945 | - | - | 22 September 1941 | 20 May 1941 | - | - |
| 1936, seed 3 | 25 November 1943 | 18 June 1944 | 9 September 1943 | 17 June 1944 | - | 31 August 1941 | - | - |
| 1936, seed 4 | 17 April 1944 | 24 May 1944 | - | 4 October 1943 | - | 7 September 1941 | - | - |
| 1936, seed 5 | 23 November 1943 | 18 September 1944 | 14 October 1943 | 16 September 1943 | - | 20 August 1941 | - | - |
| 1936, seed 6 | 4 July 1943 | 12 November 1943 | - | 30 September 1943 | - | 13 September 1941 | - | - |
| 1936, seed 7 | 12 November 1943 | 12 December 1944 | 8 October 1943 | 28 September 1943 | - | 21 July 1941 | - | - |
| 1936, seed 8 | 10 March 1944 | 1 October 1944 | 4 October 1943 | 5 October 1943 | 13 October 1941 | 12 July 1941 | - | - |
| 1939, seed 1 | 26 February 1944 | 22 March 1945 | - | 15 August 1944 | - | 19 August 1941 | - | - |
| 1939, seed 2 | 19 November 1943 | 2 February 1944 | - | - | 16 September 1941 | 31 July 1941 | - | - |
| 1939, seed 3 | 5 December 1943 | 29 June 1944 | 15 October 1943 | - | - | 26 August 1941 | - | - |
| 1939, seed 4 | 20 March 1944 | 17 October 1944 | 26 September 1943 | 16 September 1944 | 10 September 1941 | 4 November 1941 | 23 December 1941 | - |
| 1939, seed 5 | 15 October 1943 | 31 August 1944 | - | 6 February 1944 | - | 6 September 1941 | - | - |
| 1939, seed 6 | 26 November 1943 | 10 January 1944 | 11 October 1943 | 28 September 1943 | - | 3 August 1941 | - | - |
| 1939, seed 7 | 23 November 1943 | 23 June 1944 | 6 November 1943 | 11 October 1943 | - | 25 October 1941 | - | - |
| 1939, seed 8 | 30 November 1943 | 20 October 1944 | 30 September 1943 | 28 September 1943 | - | 17 August 1941 | - | - |

(Germany is said to fall on the day it surrenders or signs an armistice. The runs stop on 8 May 1945 for the history tables above and on 1 August 1945 for these.)

**Germany.** In 1.5 Germany fell in all 16 runs, between 4 July 1943 and 17 April 1944; the
middle run on 25 November 1943. In 1.6 it falls in 15 of 16, between 12 November 1943 and
18 April 1945; the middle run on 31 August 1944, nine months later. Two of the 16 reach the spring
of 1945, six reach October 1944. The time from Italy's armistice to Germany's fall went from
about two months (middle run) to about eight. The reasons it fell so early, found by following
single runs month by month:

- Germany built almost every new factory in Berlin (factorySite in economy.ts now spreads them).
- New divisions took every recruit, so the old ones bled away: 97% strength in 1941, 40% in
  1943 (REFIT_FIRST and REFIT_FROM in aiEconomy.ts).
- Almost no divisions stayed inside Germany, so any landing reached Berlin (the home reserve in
  ai.ts, INVADED_RATIO for a landing behind the lines, and no landing in Denmark before
  Normandy in operations.ts).
- When Italy changed sides its whole army of 130 to 190 divisions changed with it, grew again
  after the armistice and walked into Austria and Bavaria (Operation Achse and
  CO_BELLIGERENT_ARMY).
- The German call-up ran dry in 1943 (TOTAL_WAR in story.ts).

Tried and dropped: an AI total mobilisation law after two years of war (it depended on war
support and made one run in eight last for ever); refits first at all times (the Soviet Union
then fell in 1942); a hidden boost for German arms output from 1942 (the Speer ministry, no
clear change in 16 runs). Still open: Germany usually falls in the second half of 1944, not in
May 1945. In the run that did not end (1936, seed 2) the Allies never landed in Italy, Italy
stayed in the war, and the Red Army was still pushing slowly westwards in the summer of 1945.

**Greece** fell in 5 of 20 runs in 1.5 and now in 16 of 16, between 20 May and 4 November 1941
(really April 1941). Its army used to hold the one pass into Attica for ever; it now gives up
once the Axis holds Epirus and Salonika (greeceGivesUp in story.ts).

**The Soviet Union and Moscow.** Moscow fell in one run of 20 in 1.5 and in none of these 16.
Along the way some versions of these changes made Germany strong enough to break the Soviet
Union in the winter of 1941 in one or two runs out of eight. Three changes stop that: the
Soviet Union gives up only at 85% of its victory points (LAST_STAND_SHARE, was 75%), keeps no
home reserve while its main front runs across its own land, and the "landing behind the lines"
rule does not apply to a country's main front. The Soviet Union surrendered in none of the 16.

**Poland and the capital garrison.** See docs/balance-stage-l-poland.md: led by the AI, Poland
now surrenders on 28 to 30 September 1939, the same as a player who gives no orders (27
September to 3 October). The 1.4.1 attempt at a capital garrison for every army was dropped
because it starved the Soviet front; the home reserve here only keeps divisions somewhere inside
the homeland, only for big armies facing a great power, and not while the main front is at home.

**The six history runs above** agree with the sweep: Germany falls between May 1944 and April
1945 in five of them (1.5: October 1943 to March 1944), Greece falls in all three that start in 1936, and Moscow in
none of them. One run (1939-1) is the bad case of this version: Barbarossa went deep (28 of 55
Soviet provinces lost by January 1942), the Soviet Union lost most of its arms factories,
printed money (prices x53 by 1945, three governments fallen) and still did not surrender, and
Germany was still standing on 8 May 1945. Version 1.5 had a run like it too (prices x19).
Building new Soviet factories deeper in the interior was tried for it: it made the Soviet Union
stronger in every run and Germany fall two months earlier again (middle run 21 June 1944), so
it was left out.
