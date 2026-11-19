# Balance report, Stage K3: 200 AI against AI wars, 24 finance playtests, four years of peace, six runs of history, three free-for-alls and three games played with armies

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 85% | 15% | 0% | 46 | 3.4 | 2.7 | 5 | 71% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 40% | 20% | 40% | 303 | 0.9 | 7.6 | 27 | 60% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 19 | 0.7 | 1.2 | 1 | 93% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 25 | 0.5 | 5.4 | 2 | 85% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.8 | 1 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 17 | 0.1 | 0.4 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 36 | 0.1 | 5.8 | 21 | 88% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 100 | 0.0 | 12.4 | 69 | 72% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 80 | 0.1 | 12.9 | 7 | 79% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 10% | 0% | 90% | 121 | 0.1 | 9.6 | 8 | 61% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| Poland falls | 6 October 1939 | 20 September 1939 | 22 September 1939 | 21 September 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | did not happen | did not happen | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 8 June 1940 | 8 June 1940 | 8 June 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 24 June 1940 | 10 June 1940 | 10 June 1940 |
| France falls | 22 June 1940 | 6 July 1940 | 12 June 1940 | 27 June 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 7 July 1940 | 13 June 1940 | 28 June 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 30 August 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 6 May 1941 | 8 May 1941 | 7 May 1941 |
| Greece falls | 23 April 1941 | 24 June 1941 | 15 August 1941 | did not happen |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Mussolini falls | 25 July 1943 | 3 August 1943 | 1 August 1943 | 31 August 1943 |
| Italy signs an armistice and changes sides | 8 September 1943 | 18 September 1943 | 16 September 1943 | 16 October 1943 |
| Moscow falls | never | did not happen | did not happen | 21 September 1941 |
| The Soviet Union surrenders | never | did not happen | did not happen | did not happen |
| Germany surrenders | 8 May 1945 | 13 March 1944 | 9 August 1943 | 14 November 1943 |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 2 August 1943 | 31 July 1943 | 30 August 1943 |
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
| history-1 | 420 | 2.4 | 30% | 106 | 12 | 64 |
| history-2 | 478 | 2.1 | 21% | 60 | 11 | 38 |
| history-3 | 389 | 3.2 | 41% | 85 | 20 | 21 |
| 1939-1 | 641 | 2.2 | 31% | 149 | 30 | 70 |
| 1939-2 | 342 | 3.0 | 27% | 88 | 17 | 27 |
| 1939-3 | 488 | 2.3 | 49% | 88 | 11 | 41 |

## Armies

Stage K2 lets the player command armies instead of divisions. A bot plays the September 1939
start as Germany using only army orders: Army Group North and Army Group South push on Warsaw
from two sides, Army Group West holds the French border and takes every new division. When
Poland falls, all three hold the French border through the winter. On 10 May 1940 they push
into Lorraine and Burgundy, then each pushes on to Paris once it has taken its target. The AI finance minister runs Germany's economy and the
AI leads every other country. The bot does not attack Belgium or the Netherlands: in Story mode
that needs a cause for war, which this bot does not seek. The run ends on 1 June 1941. Real history: Poland fell on
6 October 1939, France on 22 June 1940.

| Run | Poland falls | France falls | German divisions on 1 June 1941 | German provinces lost | German attacks | Armies at the end | Milliseconds a day |
| --- | --- | --- | --- | --- | --- | --- | --- |
| armies-1 | 27 September 1939 | did not fall | 317 | 0 | 52 | Army Group North: 24, Army Group South: 29, Army Group West: 264 | 15.2 |
| armies-2 | 27 September 1939 | did not fall | 307 | 1 | 22 | Army Group North: 23, Army Group South: 29, Army Group West: 255 | 16.5 |
| armies-3 | 27 September 1939 | did not fall | 315 | 0 | 36 | Army Group North: 24, Army Group South: 29, Army Group West: 262 | 15.9 |

## Land, sea and air together

Stage K3 lets the player (and the AI) aim air wings at one province, shell a coast from the
sea, and drop paratroopers. For each run: how many AI bomber wings were aimed at a battle on an
average day, how many fleets were shelling a coast, the paratrooper divisions each country had
on an average day, and the drops made (empty provinces taken, and drops into a battle).

| Run | Bomber wings aimed at a battle (average day) | Fleets shelling (average day) | Paratrooper divisions (average day) | Drops | Drops by | First drop |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | 8.0 | 0.2 | Soviet Union 3, Germany 3, Italy 1, United Kingdom 2 | 21 (17 into a battle) | Soviet Union 5, Germany 15, Italy 1 | 15 September 1941 |
| history-2 | 6.0 | 0.1 | Soviet Union 3, Germany 3, Italy 1, United Kingdom 2 | 12 (5 into a battle) | Germany 7, Soviet Union 3, United Kingdom 2 | 9 June 1940 |
| history-3 | 7.6 | 0.4 | Soviet Union 4, Germany 3, Italy 1, United Kingdom 1 | 23 (13 into a battle) | Germany 12, Soviet Union 9, United Kingdom 2 | 26 June 1940 |
| 1939-1 | 12.9 | 0.3 | Soviet Union 5, Germany 8, Italy 1, United Kingdom 3 | 31 (13 into a battle) | Germany 13, United Kingdom 6, Soviet Union 12 | 29 June 1943 |
| 1939-2 | 11.4 | 0.3 | Soviet Union 5, Germany 7, Italy 1, United Kingdom 2 | 29 (16 into a battle) | Soviet Union 10, Germany 17, United Kingdom 2 | 22 July 1941 |
| 1939-3 | 10.9 | 0.3 | Soviet Union 6, Germany 5, Italy 1, United Kingdom 2 | 22 (19 into a battle) | Germany 9, Soviet Union 6, United Kingdom 7 | 13 April 1941 |

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
| history-1 | 6 July 1940 | 18 September 1943 | 13 March 1944 | 42% | x2.5 | 0 | communist |
| history-2 | 12 June 1940 | 16 September 1943 | 9 August 1943 | 53% | x4.1 | 0 | communist |
| history-3 | 27 June 1940 | 16 October 1943 | 14 November 1943 | 42% | x2.2 | 0 | communist |
| 1939-1 | 9 July 1940 | 29 October 1943 | 19 September 1944 | 41% | x2.7 | 0 | communist |
| 1939-2 | 24 June 1940 | 28 September 1943 | 9 June 1944 | 57% | x3.6 | 0 | communist |
| 1939-3 | 6 April 1940 | did not fall | 5 March 1944 | 48% | x2.7 | 0 | communist |

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-1 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-1 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-1 | 1 January 1940 | Germany | 124 (87%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| history-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-1 | 1 January 1941 | Germany | 285 (90%) | 80 | 2% | x1.1 | 44% | yes | 60 | 0 |
| history-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| history-1 | 1 January 1941 | United Kingdom | 127 (99%) | 28 | 2% | x1.1 | 45% | yes | 76 | 0 |
| history-1 | 1 January 1942 | Germany | 336 (82%) | 105 | 2% | x1.1 | 47% | yes | 60 | 0 |
| history-1 | 1 January 1942 | Soviet Union | 485 (95%) | 64 | 29% | x1.2 | 73% | yes | 69 | 0 |
| history-1 | 1 January 1942 | United Kingdom | 149 (100%) | 39 | 2% | x1.1 | 59% | yes | 66 | 0 |
| history-1 | 1 January 1943 | Germany | 354 (65%) | 124 | 2% | x1.2 | 53% | yes | 57 | 0 |
| history-1 | 1 January 1943 | Soviet Union | 485 (97%) | 66 | 35% | x1.8 | 79% | yes | 52 | 0 |
| history-1 | 1 January 1943 | United Kingdom | 155 (100%) | 48 | 2% | x1.2 | 73% | yes | 65 | 0 |
| history-1 | 1 January 1944 | Germany | 354 (45%) | 132 | 3% | x1.2 | 71% | yes | 50 | 0 |
| history-1 | 1 January 1944 | Soviet Union | 485 (99%) | 78 | 14% | x2.3 | 67% | yes | 62 | 0 |
| history-1 | 1 January 1944 | United Kingdom | 152 (97%) | 55 | 2% | x1.2 | 85% | yes | 65 | 0 |
| history-1 | 1 January 1945 | Soviet Union | 634 (100%) | 79 | 6% | x2.5 | 71% | yes | 55 | 0 |
| history-1 | 1 January 1945 | United Kingdom | 137 (100%) | 67 | 2% | x1.2 | 73% | no | 58 | 0 |
| history-1 | 8 May 1945 | Soviet Union | 634 (100%) | 79 | 5% | x2.5 | 73% | no | 55 | 0 |
| history-1 | 8 May 1945 | United Kingdom | 140 (100%) | 71 | 2% | x1.2 | 70% | no | 58 | 0 |
| history-2 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-2 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-2 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-2 | 1 January 1940 | Germany | 123 (90%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-2 | 1 January 1940 | Soviet Union | 214 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| history-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-2 | 1 January 1941 | Germany | 281 (92%) | 80 | 2% | x1.1 | 45% | yes | 61 | 0 |
| history-2 | 1 January 1941 | Soviet Union | 288 (100%) | 67 | 2% | x1.1 | 40% | no | 69 | 0 |
| history-2 | 1 January 1941 | United Kingdom | 120 (97%) | 28 | 2% | x1.1 | 45% | yes | 74 | 0 |
| history-2 | 1 January 1942 | Germany | 332 (85%) | 104 | 2% | x1.1 | 46% | yes | 59 | 0 |
| history-2 | 1 January 1942 | Soviet Union | 490 (94%) | 64 | 29% | x1.2 | 72% | yes | 69 | 0 |
| history-2 | 1 January 1942 | United Kingdom | 141 (99%) | 39 | 2% | x1.1 | 57% | yes | 67 | 0 |
| history-2 | 1 January 1943 | Germany | 363 (74%) | 123 | 2% | x1.2 | 53% | yes | 55 | 0 |
| history-2 | 1 January 1943 | Soviet Union | 484 (99%) | 64 | 51% | x1.9 | 79% | yes | 47 | 0 |
| history-2 | 1 January 1943 | United Kingdom | 141 (100%) | 50 | 2% | x1.2 | 65% | yes | 65 | 0 |
| history-2 | 1 January 1944 | Soviet Union | 484 (100%) | 75 | 39% | x3.0 | 55% | yes | 39 | 0 |
| history-2 | 1 January 1944 | United Kingdom | 152 (97%) | 101 | 2% | x1.2 | 48% | yes | 63 | 0 |
| history-2 | 1 January 1945 | Soviet Union | 500 (100%) | 79 | 14% | x3.9 | 36% | yes | 47 | 0 |
| history-2 | 1 January 1945 | United Kingdom | 163 (99%) | 116 | 2% | x1.2 | 40% | no | 60 | 0 |
| history-2 | 8 May 1945 | Soviet Union | 602 (100%) | 81 | 10% | x4.1 | 37% | yes | 51 | 0 |
| history-2 | 8 May 1945 | United Kingdom | 167 (99%) | 122 | 2% | x1.2 | 38% | no | 60 | 0 |
| history-3 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-3 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-3 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-3 | 1 January 1940 | Germany | 123 (94%) | 58 | 2% | x1.1 | 41% | yes | 70 | 0 |
| history-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| history-3 | 1 January 1940 | United Kingdom | 45 (98%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| history-3 | 1 January 1941 | Germany | 282 (91%) | 81 | 2% | x1.1 | 44% | yes | 62 | 0 |
| history-3 | 1 January 1941 | Soviet Union | 286 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| history-3 | 1 January 1941 | United Kingdom | 126 (99%) | 28 | 2% | x1.1 | 45% | yes | 76 | 0 |
| history-3 | 1 January 1942 | Germany | 329 (83%) | 101 | 2% | x1.1 | 49% | yes | 59 | 0 |
| history-3 | 1 January 1942 | Soviet Union | 488 (92%) | 65 | 28% | x1.2 | 68% | yes | 70 | 0 |
| history-3 | 1 January 1942 | United Kingdom | 146 (97%) | 38 | 2% | x1.1 | 56% | yes | 67 | 0 |
| history-3 | 1 January 1943 | Germany | 367 (65%) | 118 | 2% | x1.2 | 58% | yes | 58 | 0 |
| history-3 | 1 January 1943 | Soviet Union | 488 (97%) | 72 | 33% | x1.7 | 70% | yes | 53 | 0 |
| history-3 | 1 January 1943 | United Kingdom | 145 (98%) | 49 | 2% | x1.2 | 66% | yes | 64 | 0 |
| history-3 | 1 January 1944 | Soviet Union | 580 (100%) | 111 | 9% | x2.1 | 56% | yes | 62 | 0 |
| history-3 | 1 January 1944 | United Kingdom | 151 (90%) | 61 | 2% | x1.2 | 78% | yes | 64 | 0 |
| history-3 | 1 January 1945 | Soviet Union | 655 (100%) | 123 | 4% | x2.2 | 52% | no | 56 | 0 |
| history-3 | 1 January 1945 | United Kingdom | 138 (97%) | 72 | 2% | x1.2 | 78% | yes | 63 | 0 |
| history-3 | 8 May 1945 | Soviet Union | 672 (100%) | 126 | 4% | x2.2 | 53% | no | 56 | 0 |
| history-3 | 8 May 1945 | United Kingdom | 143 (97%) | 76 | 2% | x1.2 | 80% | yes | 63 | 0 |
| 1939-1 | 1 January 1940 | Germany | 124 (87%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| 1939-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-1 | 1 January 1941 | Germany | 275 (89%) | 81 | 2% | x1.1 | 42% | yes | 59 | 0 |
| 1939-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| 1939-1 | 1 January 1941 | United Kingdom | 127 (99%) | 28 | 2% | x1.1 | 45% | yes | 77 | 0 |
| 1939-1 | 1 January 1942 | Germany | 334 (81%) | 102 | 2% | x1.1 | 47% | yes | 58 | 0 |
| 1939-1 | 1 January 1942 | Soviet Union | 485 (96%) | 66 | 27% | x1.2 | 67% | yes | 71 | 0 |
| 1939-1 | 1 January 1942 | United Kingdom | 150 (99%) | 38 | 2% | x1.1 | 59% | yes | 67 | 0 |
| 1939-1 | 1 January 1943 | Germany | 361 (67%) | 121 | 2% | x1.2 | 54% | yes | 58 | 0 |
| 1939-1 | 1 January 1943 | Soviet Union | 485 (98%) | 67 | 37% | x1.7 | 78% | yes | 52 | 0 |
| 1939-1 | 1 January 1943 | United Kingdom | 149 (94%) | 48 | 2% | x1.2 | 72% | yes | 65 | 0 |
| 1939-1 | 1 January 1944 | Germany | 361 (53%) | 127 | 8% | x1.2 | 72% | yes | 56 | 0 |
| 1939-1 | 1 January 1944 | Soviet Union | 485 (99%) | 73 | 22% | x2.4 | 70% | yes | 54 | 0 |
| 1939-1 | 1 January 1944 | United Kingdom | 151 (80%) | 62 | 2% | x1.2 | 71% | yes | 64 | 0 |
| 1939-1 | 1 January 1945 | Soviet Union | 670 (100%) | 124 | 7% | x2.7 | 50% | yes | 59 | 0 |
| 1939-1 | 1 January 1945 | United Kingdom | 135 (69%) | 75 | 2% | x1.2 | 67% | no | 60 | 0 |
| 1939-1 | 8 May 1945 | Soviet Union | 686 (100%) | 128 | 5% | x2.7 | 50% | yes | 57 | 0 |
| 1939-1 | 8 May 1945 | United Kingdom | 139 (72%) | 79 | 2% | x1.2 | 63% | no | 61 | 0 |
| 1939-2 | 1 January 1940 | Germany | 125 (89%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| 1939-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-2 | 1 January 1941 | Germany | 284 (90%) | 81 | 2% | x1.1 | 44% | yes | 62 | 0 |
| 1939-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| 1939-2 | 1 January 1941 | United Kingdom | 120 (99%) | 28 | 2% | x1.1 | 45% | yes | 77 | 0 |
| 1939-2 | 1 January 1942 | Germany | 336 (83%) | 104 | 2% | x1.1 | 47% | yes | 59 | 0 |
| 1939-2 | 1 January 1942 | Soviet Union | 488 (89%) | 61 | 31% | x1.2 | 87% | yes | 71 | 0 |
| 1939-2 | 1 January 1942 | United Kingdom | 141 (99%) | 39 | 2% | x1.1 | 57% | yes | 69 | 0 |
| 1939-2 | 1 January 1943 | Germany | 367 (73%) | 123 | 2% | x1.2 | 54% | yes | 58 | 0 |
| 1939-2 | 1 January 1943 | Soviet Union | 488 (84%) | 63 | 55% | x2.0 | 77% | yes | 45 | 0 |
| 1939-2 | 1 January 1943 | United Kingdom | 141 (100%) | 50 | 2% | x1.2 | 68% | yes | 65 | 0 |
| 1939-2 | 1 January 1944 | Germany | 342 (54%) | 137 | 2% | x1.2 | 64% | yes | 54 | 0 |
| 1939-2 | 1 January 1944 | Soviet Union | 488 (94%) | 77 | 30% | x3.0 | 50% | yes | 48 | 0 |
| 1939-2 | 1 January 1944 | United Kingdom | 151 (99%) | 59 | 2% | x1.2 | 79% | yes | 65 | 0 |
| 1939-2 | 1 January 1945 | Soviet Union | 582 (100%) | 122 | 9% | x3.5 | 37% | yes | 55 | 0 |
| 1939-2 | 1 January 1945 | United Kingdom | 163 (99%) | 71 | 2% | x1.2 | 81% | yes | 65 | 0 |
| 1939-2 | 8 May 1945 | Soviet Union | 600 (100%) | 127 | 7% | x3.6 | 37% | yes | 54 | 0 |
| 1939-2 | 8 May 1945 | United Kingdom | 166 (99%) | 74 | 2% | x1.2 | 83% | yes | 65 | 0 |
| 1939-3 | 1 January 1940 | Germany | 124 (91%) | 58 | 2% | x1.1 | 40% | yes | 70 | 0 |
| 1939-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| 1939-3 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 76 | 0 |
| 1939-3 | 1 January 1941 | Germany | 287 (96%) | 75 | 2% | x1.1 | 50% | yes | 62 | 0 |
| 1939-3 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| 1939-3 | 1 January 1941 | United Kingdom | 116 (99%) | 28 | 2% | x1.1 | 44% | yes | 77 | 0 |
| 1939-3 | 1 January 1942 | Germany | 334 (80%) | 93 | 2% | x1.1 | 54% | yes | 59 | 0 |
| 1939-3 | 1 January 1942 | Soviet Union | 474 (85%) | 62 | 33% | x1.2 | 212% | yes | 67 | 0 |
| 1939-3 | 1 January 1942 | United Kingdom | 121 (99%) | 38 | 2% | x1.1 | 56% | yes | 67 | 0 |
| 1939-3 | 1 January 1943 | Germany | 330 (68%) | 109 | 2% | x1.2 | 63% | yes | 57 | 0 |
| 1939-3 | 1 January 1943 | Soviet Union | 474 (94%) | 66 | 40% | x1.9 | 72% | yes | 48 | 0 |
| 1939-3 | 1 January 1943 | United Kingdom | 122 (98%) | 48 | 2% | x1.2 | 63% | yes | 66 | 0 |
| 1939-3 | 1 January 1944 | Germany | 319 (54%) | 119 | 2% | x1.2 | 77% | yes | 52 | 0 |
| 1939-3 | 1 January 1944 | Soviet Union | 474 (99%) | 77 | 15% | x2.5 | 61% | yes | 58 | 0 |
| 1939-3 | 1 January 1944 | United Kingdom | 134 (94%) | 60 | 2% | x1.2 | 68% | yes | 66 | 0 |
| 1939-3 | 1 January 1945 | Soviet Union | 622 (100%) | 119 | 6% | x2.7 | 46% | yes | 56 | 0 |
| 1939-3 | 1 January 1945 | United Kingdom | 123 (88%) | 71 | 2% | x1.2 | 68% | yes | 64 | 0 |
| 1939-3 | 8 May 1945 | Soviet Union | 640 (100%) | 122 | 5% | x2.7 | 46% | no | 56 | 0 |
| 1939-3 | 8 May 1945 | United Kingdom | 127 (88%) | 75 | 2% | x1.2 | 68% | yes | 63 | 0 |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 6 of 28 | 0 | 336 | 485 | 149 | with Germany |
| history-1 | 1 January 1943 | 2 of 28 | 0 | 354 | 485 | 155 | with Germany |
| history-1 | 1 January 1944 | 0 of 28 | 5 | 354 | 485 | 152 | with the Allies |
| history-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 634 | 137 | with the Allies |
| history-2 | 1 January 1942 | 4 of 28 | 0 | 332 | 490 | 141 | with Germany |
| history-2 | 1 January 1943 | 7 of 28 | 0 | 363 | 484 | 141 | with Germany |
| history-2 | 1 January 1944 | 4 of 28 | 15 | 0 | 484 | 152 | with the Allies |
| history-2 | 1 January 1945 | 4 of 28 | 15 | 0 | 500 | 163 | with the Allies |
| history-3 | 1 January 1942 | 3 of 28 | 0 | 329 | 488 | 146 | with Germany |
| history-3 | 1 January 1943 | 0 of 28 | 0 | 367 | 488 | 145 | with Germany |
| history-3 | 1 January 1944 | 0 of 28 | 15 | 0 | 580 | 151 | with the Allies |
| history-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 655 | 138 | with the Allies |
| 1939-1 | 1 January 1942 | 2 of 28 | 0 | 334 | 485 | 150 | with Germany |
| 1939-1 | 1 January 1943 | 0 of 28 | 0 | 361 | 485 | 149 | with Germany |
| 1939-1 | 1 January 1944 | 0 of 28 | 3 | 361 | 485 | 151 | with the Allies |
| 1939-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 670 | 135 | with the Allies |
| 1939-2 | 1 January 1942 | 10 of 28 | 0 | 336 | 488 | 141 | with Germany |
| 1939-2 | 1 January 1943 | 9 of 28 | 0 | 367 | 488 | 141 | with Germany |
| 1939-2 | 1 January 1944 | 0 of 28 | 0 | 342 | 488 | 151 | with the Allies |
| 1939-2 | 1 January 1945 | 0 of 28 | 15 | 0 | 582 | 163 | with the Allies |
| 1939-3 | 1 January 1942 | 6 of 28 | 0 | 334 | 474 | 121 | with Germany |
| 1939-3 | 1 January 1943 | 1 of 28 | 0 | 330 | 474 | 122 | with Germany |
| 1939-3 | 1 January 1944 | 0 of 28 | 1 | 319 | 474 | 134 | with Germany |
| 1939-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 622 | 123 | with Germany |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 84 | Albania, Finland, Estonia, Latvia, Lithuania, Germany | none |
| history-2 | 82 | Albania, Finland, Estonia, Latvia, Lithuania, Germany, Romania | none |
| history-3 | 90 | Albania, Estonia, Latvia, Lithuania, Germany | Romania and United Kingdom |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | France | 0 of 28 | Germany 287, Soviet Union 159, United Kingdom 85 |
| history-2 | 52 | Franco | France | 4 of 28 (Vinnitsa, Gomel, Minsk, Murmansk) | Soviet Union 137, Germany 108, Romania 98 |
| history-3 | 52 | Franco | none | 0 of 28 | Germany 233, Soviet Union 168, United Kingdom 96 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 19 | 14 | 9 | Soviet Union 195 (+102), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 27 | 15 | 7 | Soviet Union 214 (+121), Germany 135 (+67), Romania 105 (+80) | none |
| ffa-3 | 1 April 1936 | 25 | 16 | 10 | Soviet Union 251 (+158), Germany 129 (+61), Italy 81 (+30) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 15 / 68 / 5 | 19 + 4 | 0% | 5 | 140 |
| history-1 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 26 |
| history-1 | Italy | 4 / 13 / 11 | 7 + 5 | 0% | 0 | 152 |
| history-1 | Soviet Union | 2 / 16 / 31 | 17 + 11 | 0% | 0 | 634 |
| history-1 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 7 |
| history-2 | United Kingdom | 16 / 82 / 5 | 15 + 3 | 0% | 5 | 167 |
| history-2 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 29 |
| history-2 | Italy | 4 / 13 / 9 | 10 + 7 | 0% | 0 | 212 |
| history-2 | Soviet Union | 2 / 17 / 31 | 23 + 13 | 0% | 0 | 602 |
| history-2 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 40 |
| history-3 | United Kingdom | 15 / 71 / 5 | 16 + 4 | 0% | 6 | 143 |
| history-3 | France | 0 / 2 / 0 | 0 + 0 | 0% | 0 | 34 |
| history-3 | Italy | 4 / 11 / 10 | 10 + 5 | 0% | 0 | 105 |
| history-3 | Soviet Union | 2 / 16 / 31 | 37 + 29 | 0% | 0 | 672 |
| history-3 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 8 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 0 | 22 | 5 | 0 | 0 |
| history-2 | 4 | 22 | 5 | 0 | 0 |
| history-3 | 2 | 24 | 6 | 0 | 0 |

## What the results say

- **The AI uses the new tools.** On an average day of war 6 to 13 AI bomber wings are aimed at
  one battle, a fleet or so is shelling a coast, and Germany, the Soviet Union, Italy and
  Britain keep a handful of paratrooper divisions (3 to 8 each). They make 12 to 31 drops a
  run, most of them into battles they are winning; the first ones come between June 1940 and
  July 1941 in five runs, and in June 1943 in one (Germany's real drops began in May 1940). Italy builds paratroopers but hardly ever drops them.
- **Moscow (a K2 gap): better.** Moscow falls in 1 of the 3 runs from 1936 (K2: 2 of 3) and in
  none from 1939. By 1 January 1942 the enemy holds 2 to 10 of the 28 Soviet provinces (K2: 2
  to 7), and the Soviet Union never surrenders.
- **Greece (a K2 gap): fixed in most runs.** Greece falls in 2 of the 3 runs from 1936, on 24 June
  and 15 August 1941 (really 23 April 1941; K2: never). Concentrated German bombers are what
  breaks the Greek line.
- **Germany still falls too early (a K2 gap): not fixed.** Germany surrenders in all 6 runs,
  between 9 August 1943 and 19 September 1944 (K2: 24 October 1943 to 7 December 1944; really
  8 May 1945). On average that is about the same as K2 (around March 1944), so K3 did not make it
  worse, but it did not fix it either. The pattern is the same as before: once Italy changes
  sides in the autumn of 1943, Germany's army of about 350 divisions melts away within a year.
  That is a war-economy and army-AI problem (refilling and holding a shrinking front), not one
  of the new air and sea rules. A test with close air support halved (1.5 damage a wing
  instead of 3) did not change it: Germany still fell between September 1943 and March 1944,
  while Moscow then fell in all 3 runs from 1936. So the value stays at 3.
- **History otherwise.** France falls between 12 June and 9 July 1940 in five runs (really 22
  June); in one run from 1939 it falls on 6 April 1940. Italy changes sides in 5 of 6 runs. The
  Allies land in Sicily or southern Italy between 31 July and 30 August 1943 (really 10 July),
  but never land in northern France: Germany has already collapsed in the east.
- **Armies.** The army bot takes Poland by 27 September 1939 (really 6 October; K2 4 to 17
  October), and its head-on push into Lorraine and Burgundy still does not break France: the
  real attack went through Belgium.
- **Speed.** About 15 milliseconds a game day with every country led by the AI, on a cloud
  machine busy with other work at the time (K2's report: about 11). Measured side by side on
  the same machine, 1.3 and 1.4 run equally fast (15.1 and 15.3 milliseconds). The fastest game
  speed allows 60.
- **Still to do.** Germany's collapse after 1943, and the Allied landing in northern France that
  never comes because of it.
