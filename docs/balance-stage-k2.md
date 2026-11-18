# Balance report, Stage K2: 200 AI against AI wars, 24 finance playtests, four years of peace, six runs of history, three free-for-alls and three games played with armies

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
| Poland falls | 6 October 1939 | 20 September 1939 | 22 September 1939 | 23 September 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | did not happen | did not happen | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 8 June 1940 | 8 June 1940 | 8 June 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 15 July 1940 | 10 June 1940 | 10 June 1940 |
| France falls | 22 June 1940 | 25 July 1940 | 30 June 1940 | 24 June 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 26 July 1940 | 1 July 1940 | 25 June 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 30 August 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 14 May 1941 | 11 May 1941 | 5 May 1941 |
| Greece falls | 23 April 1941 | did not happen | did not happen | did not happen |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Mussolini falls | 25 July 1943 | 14 August 1943 | 8 August 1943 | 13 August 1943 |
| Italy signs an armistice and changes sides | 8 September 1943 | 29 September 1943 | 23 September 1943 | 28 September 1943 |
| Moscow falls | never | did not happen | 3 October 1941 | 11 September 1941 |
| The Soviet Union surrenders | never | did not happen | did not happen | did not happen |
| Germany surrenders | 8 May 1945 | 14 December 1943 | 19 February 1944 | 7 December 1944 |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 4 August 1943 | 31 July 1943 | 12 August 1943 |
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
| history-1 | 328 | 3.1 | 24% | 85 | 20 | 26 |
| history-2 | 445 | 2.4 | 34% | 85 | 17 | 53 |
| history-3 | 539 | 2.5 | 23% | 107 | 23 | 39 |
| 1939-1 | 362 | 3.4 | 27% | 70 | 21 | 24 |
| 1939-2 | 577 | 2.4 | 24% | 135 | 17 | 78 |
| 1939-3 | 407 | 2.8 | 32% | 83 | 16 | 29 |

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
| armies-1 | 17 October 1939 | did not fall | 250 | 3 | 35 | Army Group North: 23, Army Group South: 28, Army Group West: 199 | 11.1 |
| armies-2 | 4 October 1939 | did not fall | 266 | 2 | 29 | Army Group North: 24, Army Group South: 28, Army Group West: 214 | 10.7 |
| armies-3 | 4 October 1939 | did not fall | 321 | 0 | 41 | Army Group North: 24, Army Group South: 29, Army Group West: 268 | 10.5 |

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
| history-1 | 25 July 1940 | 29 September 1943 | 14 December 1943 | 40% | x2.4 | 0 | communist |
| history-2 | 30 June 1940 | 23 September 1943 | 19 February 1944 | 42% | x2.6 | 0 | communist |
| history-3 | 24 June 1940 | 28 September 1943 | 7 December 1944 | 49% | x3.2 | 0 | communist |
| 1939-1 | 26 July 1940 | did not fall | 24 October 1943 | 34% | x2.0 | 0 | communist |
| 1939-2 | 7 July 1940 | 22 September 1943 | 23 June 1944 | 29% | x1.8 | 0 | communist |
| 1939-3 | 14 August 1940 | 7 May 1944 | 23 February 1944 | 44% | x2.6 | 0 | communist |

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-1 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-1 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-1 | 1 January 1940 | Germany | 124 (90%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| history-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-1 | 1 January 1941 | Germany | 277 (87%) | 80 | 2% | x1.1 | 44% | yes | 62 | 0 |
| history-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| history-1 | 1 January 1941 | United Kingdom | 121 (99%) | 28 | 2% | x1.1 | 44% | yes | 77 | 0 |
| history-1 | 1 January 1942 | Germany | 331 (81%) | 102 | 2% | x1.1 | 48% | yes | 60 | 0 |
| history-1 | 1 January 1942 | Soviet Union | 480 (94%) | 64 | 26% | x1.2 | 74% | yes | 72 | 0 |
| history-1 | 1 January 1942 | United Kingdom | 141 (99%) | 39 | 2% | x1.1 | 57% | yes | 72 | 0 |
| history-1 | 1 January 1943 | Germany | 354 (65%) | 120 | 2% | x1.2 | 54% | yes | 57 | 0 |
| history-1 | 1 January 1943 | Soviet Union | 480 (99%) | 67 | 34% | x1.7 | 80% | yes | 54 | 0 |
| history-1 | 1 January 1943 | United Kingdom | 142 (100%) | 49 | 2% | x1.2 | 68% | yes | 66 | 0 |
| history-1 | 1 January 1944 | Soviet Union | 479 (99%) | 112 | 12% | x2.2 | 61% | yes | 59 | 0 |
| history-1 | 1 January 1944 | United Kingdom | 152 (97%) | 59 | 2% | x1.2 | 73% | yes | 65 | 0 |
| history-1 | 1 January 1945 | Soviet Union | 673 (100%) | 124 | 5% | x2.3 | 50% | yes | 56 | 0 |
| history-1 | 1 January 1945 | United Kingdom | 162 (98%) | 70 | 2% | x1.2 | 79% | yes | 65 | 0 |
| history-1 | 8 May 1945 | Soviet Union | 699 (100%) | 127 | 4% | x2.4 | 51% | no | 57 | 0 |
| history-1 | 8 May 1945 | United Kingdom | 165 (99%) | 74 | 2% | x1.2 | 81% | yes | 64 | 0 |
| history-2 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-2 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-2 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-2 | 1 January 1940 | Germany | 122 (89%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-2 | 1 January 1940 | Soviet Union | 212 (100%) | 49 | 2% | x1.1 | 46% | no | 66 | 0 |
| history-2 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-2 | 1 January 1941 | Germany | 288 (93%) | 80 | 2% | x1.1 | 46% | yes | 62 | 0 |
| history-2 | 1 January 1941 | Soviet Union | 286 (100%) | 67 | 2% | x1.1 | 40% | no | 69 | 0 |
| history-2 | 1 January 1941 | United Kingdom | 125 (99%) | 28 | 2% | x1.1 | 45% | yes | 78 | 0 |
| history-2 | 1 January 1942 | Germany | 336 (84%) | 102 | 2% | x1.1 | 49% | yes | 60 | 0 |
| history-2 | 1 January 1942 | Soviet Union | 480 (93%) | 66 | 28% | x1.2 | 68% | yes | 69 | 0 |
| history-2 | 1 January 1942 | United Kingdom | 150 (100%) | 39 | 2% | x1.1 | 58% | yes | 68 | 0 |
| history-2 | 1 January 1943 | Germany | 367 (69%) | 121 | 2% | x1.2 | 56% | yes | 57 | 0 |
| history-2 | 1 January 1943 | Soviet Union | 480 (96%) | 66 | 36% | x1.8 | 77% | yes | 52 | 0 |
| history-2 | 1 January 1943 | United Kingdom | 149 (99%) | 48 | 2% | x1.2 | 70% | yes | 65 | 0 |
| history-2 | 1 January 1944 | Germany | 356 (53%) | 129 | 3% | x1.2 | 71% | yes | 55 | 0 |
| history-2 | 1 January 1944 | Soviet Union | 526 (99%) | 77 | 16% | x2.3 | 62% | yes | 56 | 0 |
| history-2 | 1 January 1944 | United Kingdom | 145 (98%) | 58 | 2% | x1.2 | 73% | yes | 64 | 0 |
| history-2 | 1 January 1945 | Soviet Union | 634 (100%) | 135 | 6% | x2.5 | 42% | yes | 54 | 0 |
| history-2 | 1 January 1945 | United Kingdom | 152 (98%) | 71 | 2% | x1.2 | 69% | no | 59 | 0 |
| history-2 | 8 May 1945 | Soviet Union | 652 (100%) | 140 | 5% | x2.6 | 41% | no | 54 | 0 |
| history-2 | 8 May 1945 | United Kingdom | 156 (99%) | 75 | 2% | x1.2 | 65% | no | 58 | 0 |
| history-3 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-3 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-3 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-3 | 1 January 1940 | Germany | 124 (88%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-3 | 1 January 1940 | Soviet Union | 212 (100%) | 49 | 2% | x1.1 | 47% | no | 68 | 0 |
| history-3 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-3 | 1 January 1941 | Germany | 285 (92%) | 80 | 2% | x1.1 | 44% | yes | 61 | 0 |
| history-3 | 1 January 1941 | Soviet Union | 287 (100%) | 67 | 2% | x1.1 | 40% | no | 66 | 0 |
| history-3 | 1 January 1941 | United Kingdom | 126 (99%) | 28 | 2% | x1.1 | 45% | yes | 76 | 0 |
| history-3 | 1 January 1942 | Germany | 339 (84%) | 101 | 2% | x1.1 | 48% | yes | 60 | 0 |
| history-3 | 1 January 1942 | Soviet Union | 481 (89%) | 63 | 33% | x1.2 | 76% | yes | 67 | 0 |
| history-3 | 1 January 1942 | United Kingdom | 152 (99%) | 40 | 2% | x1.1 | 56% | yes | 69 | 0 |
| history-3 | 1 January 1943 | Germany | 351 (73%) | 119 | 2% | x1.2 | 56% | yes | 59 | 0 |
| history-3 | 1 January 1943 | Soviet Union | 481 (95%) | 65 | 43% | x1.9 | 69% | yes | 46 | 0 |
| history-3 | 1 January 1943 | United Kingdom | 152 (100%) | 51 | 2% | x1.2 | 67% | yes | 65 | 0 |
| history-3 | 1 January 1944 | Germany | 361 (60%) | 133 | 2% | x1.2 | 63% | yes | 58 | 0 |
| history-3 | 1 January 1944 | Soviet Union | 480 (99%) | 72 | 29% | x2.7 | 55% | yes | 48 | 0 |
| history-3 | 1 January 1944 | United Kingdom | 162 (95%) | 64 | 2% | x1.2 | 69% | yes | 65 | 0 |
| history-3 | 1 January 1945 | Soviet Union | 504 (100%) | 123 | 8% | x3.1 | 56% | yes | 63 | 0 |
| history-3 | 1 January 1945 | United Kingdom | 171 (88%) | 74 | 2% | x1.2 | 77% | yes | 62 | 0 |
| history-3 | 8 May 1945 | Soviet Union | 659 (100%) | 129 | 6% | x3.2 | 44% | yes | 58 | 0 |
| history-3 | 8 May 1945 | United Kingdom | 175 (90%) | 78 | 2% | x1.2 | 74% | no | 59 | 0 |
| 1939-1 | 1 January 1940 | Germany | 124 (88%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| 1939-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-1 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-1 | 1 January 1941 | Germany | 278 (88%) | 81 | 2% | x1.1 | 43% | yes | 60 | 0 |
| 1939-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-1 | 1 January 1941 | United Kingdom | 118 (99%) | 19 | 12% | x1.1 | 59% | yes | 73 | 0 |
| 1939-1 | 1 January 1942 | Germany | 337 (81%) | 100 | 2% | x1.1 | 47% | yes | 59 | 0 |
| 1939-1 | 1 January 1942 | Soviet Union | 514 (96%) | 69 | 20% | x1.2 | 65% | yes | 73 | 0 |
| 1939-1 | 1 January 1942 | United Kingdom | 144 (100%) | 36 | 6% | x1.3 | 54% | yes | 65 | 0 |
| 1939-1 | 1 January 1943 | Germany | 358 (72%) | 117 | 2% | x1.2 | 56% | yes | 58 | 0 |
| 1939-1 | 1 January 1943 | Soviet Union | 514 (99%) | 76 | 32% | x1.6 | 77% | yes | 56 | 0 |
| 1939-1 | 1 January 1943 | United Kingdom | 147 (100%) | 46 | 3% | x1.3 | 66% | yes | 64 | 0 |
| 1939-1 | 1 January 1944 | Soviet Union | 649 (100%) | 115 | 8% | x1.9 | 56% | yes | 61 | 0 |
| 1939-1 | 1 January 1944 | United Kingdom | 148 (99%) | 54 | 2% | x1.4 | 72% | yes | 63 | 0 |
| 1939-1 | 1 January 1945 | Soviet Union | 706 (100%) | 131 | 4% | x2.0 | 55% | no | 56 | 0 |
| 1939-1 | 1 January 1945 | United Kingdom | 159 (98%) | 69 | 2% | x1.4 | 70% | yes | 64 | 0 |
| 1939-1 | 8 May 1945 | Soviet Union | 723 (100%) | 137 | 3% | x2.0 | 55% | no | 56 | 0 |
| 1939-1 | 8 May 1945 | United Kingdom | 163 (98%) | 72 | 2% | x1.4 | 72% | yes | 64 | 0 |
| 1939-2 | 1 January 1940 | Germany | 125 (88%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| 1939-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-2 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-2 | 1 January 1941 | Germany | 278 (88%) | 80 | 2% | x1.1 | 43% | yes | 63 | 0 |
| 1939-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-2 | 1 January 1941 | United Kingdom | 105 (100%) | 28 | 2% | x1.1 | 44% | yes | 79 | 0 |
| 1939-2 | 1 January 1942 | Germany | 340 (80%) | 101 | 2% | x1.1 | 47% | yes | 59 | 0 |
| 1939-2 | 1 January 1942 | Soviet Union | 513 (96%) | 69 | 17% | x1.2 | 66% | yes | 74 | 0 |
| 1939-2 | 1 January 1942 | United Kingdom | 155 (96%) | 38 | 2% | x1.1 | 57% | yes | 73 | 0 |
| 1939-2 | 1 January 1943 | Germany | 369 (68%) | 120 | 2% | x1.2 | 55% | yes | 58 | 0 |
| 1939-2 | 1 January 1943 | Soviet Union | 513 (97%) | 71 | 21% | x1.5 | 80% | yes | 60 | 0 |
| 1939-2 | 1 January 1943 | United Kingdom | 151 (100%) | 48 | 2% | x1.2 | 70% | yes | 67 | 0 |
| 1939-2 | 1 January 1944 | Germany | 341 (55%) | 123 | 7% | x1.2 | 74% | yes | 52 | 0 |
| 1939-2 | 1 January 1944 | Soviet Union | 513 (99%) | 79 | 7% | x1.7 | 85% | yes | 69 | 0 |
| 1939-2 | 1 January 1944 | United Kingdom | 155 (88%) | 87 | 2% | x1.2 | 49% | yes | 65 | 0 |
| 1939-2 | 1 January 1945 | Soviet Union | 672 (100%) | 127 | 4% | x1.8 | 70% | no | 60 | 0 |
| 1939-2 | 1 January 1945 | United Kingdom | 168 (79%) | 84 | 4% | x1.2 | 55% | no | 59 | 0 |
| 1939-2 | 8 May 1945 | Soviet Union | 690 (100%) | 130 | 3% | x1.8 | 70% | no | 58 | 0 |
| 1939-2 | 8 May 1945 | United Kingdom | 170 (83%) | 90 | 3% | x1.2 | 52% | no | 61 | 0 |
| 1939-3 | 1 January 1940 | Germany | 124 (88%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| 1939-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-3 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-3 | 1 January 1941 | Germany | 276 (88%) | 80 | 2% | x1.1 | 43% | yes | 60 | 0 |
| 1939-3 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-3 | 1 January 1941 | United Kingdom | 122 (99%) | 19 | 10% | x1.1 | 59% | yes | 74 | 0 |
| 1939-3 | 1 January 1942 | Germany | 334 (82%) | 101 | 2% | x1.1 | 46% | yes | 60 | 0 |
| 1939-3 | 1 January 1942 | Soviet Union | 513 (97%) | 67 | 24% | x1.2 | 68% | yes | 72 | 0 |
| 1939-3 | 1 January 1942 | United Kingdom | 141 (100%) | 37 | 6% | x1.3 | 52% | yes | 65 | 0 |
| 1939-3 | 1 January 1943 | Germany | 363 (70%) | 118 | 2% | x1.2 | 54% | yes | 59 | 0 |
| 1939-3 | 1 January 1943 | Soviet Union | 513 (98%) | 71 | 42% | x1.7 | 73% | yes | 50 | 0 |
| 1939-3 | 1 January 1943 | United Kingdom | 145 (98%) | 47 | 3% | x1.3 | 63% | yes | 64 | 0 |
| 1939-3 | 1 January 1944 | Germany | 364 (51%) | 132 | 2% | x1.2 | 63% | yes | 56 | 0 |
| 1939-3 | 1 January 1944 | Soviet Union | 513 (99%) | 78 | 15% | x2.3 | 65% | yes | 63 | 0 |
| 1939-3 | 1 January 1944 | United Kingdom | 151 (93%) | 56 | 2% | x1.4 | 70% | yes | 65 | 0 |
| 1939-3 | 1 January 1945 | Soviet Union | 697 (100%) | 121 | 6% | x2.5 | 51% | yes | 55 | 0 |
| 1939-3 | 1 January 1945 | United Kingdom | 160 (94%) | 71 | 2% | x1.4 | 62% | no | 59 | 0 |
| 1939-3 | 8 May 1945 | Soviet Union | 715 (100%) | 124 | 5% | x2.6 | 52% | no | 55 | 0 |
| 1939-3 | 8 May 1945 | United Kingdom | 160 (97%) | 76 | 2% | x1.4 | 59% | no | 60 | 0 |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 4 of 28 | 0 | 331 | 480 | 141 | with Germany |
| history-1 | 1 January 1943 | 0 of 28 | 0 | 354 | 480 | 142 | with Germany |
| history-1 | 1 January 1944 | 0 of 28 | 15 | 0 | 479 | 152 | with the Allies |
| history-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 673 | 162 | with the Allies |
| history-2 | 1 January 1942 | 4 of 28 | 0 | 336 | 480 | 150 | with Germany |
| history-2 | 1 January 1943 | 1 of 28 | 0 | 367 | 480 | 149 | with Germany |
| history-2 | 1 January 1944 | 0 of 28 | 2 | 356 | 526 | 145 | with the Allies |
| history-2 | 1 January 1945 | 0 of 28 | 15 | 0 | 634 | 152 | with the Allies |
| history-3 | 1 January 1942 | 7 of 28 | 0 | 339 | 481 | 152 | with Germany |
| history-3 | 1 January 1943 | 1 of 28 | 0 | 351 | 481 | 152 | with Germany |
| history-3 | 1 January 1944 | 0 of 28 | 1 | 361 | 480 | 162 | with the Allies |
| history-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 504 | 171 | with the Allies |
| 1939-1 | 1 January 1942 | 3 of 28 | 0 | 337 | 514 | 144 | with Germany |
| 1939-1 | 1 January 1943 | 0 of 28 | 0 | 358 | 514 | 147 | with Germany |
| 1939-1 | 1 January 1944 | 0 of 28 | 15 | 0 | 649 | 148 | with Germany |
| 1939-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 706 | 159 | with Germany |
| 1939-2 | 1 January 1942 | 2 of 28 | 0 | 340 | 513 | 155 | with Germany |
| 1939-2 | 1 January 1943 | 1 of 28 | 0 | 369 | 513 | 151 | with Germany |
| 1939-2 | 1 January 1944 | 0 of 28 | 4 | 341 | 513 | 155 | fallen |
| 1939-2 | 1 January 1945 | 0 of 28 | 15 | 0 | 672 | 168 | with the Allies |
| 1939-3 | 1 January 1942 | 5 of 28 | 0 | 334 | 513 | 141 | with Germany |
| 1939-3 | 1 January 1943 | 2 of 28 | 0 | 363 | 513 | 145 | with Germany |
| 1939-3 | 1 January 1944 | 0 of 28 | 3 | 364 | 513 | 151 | with Germany |
| 1939-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 697 | 160 | with the Allies |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 90 | Albania, Finland, Estonia, Latvia, Lithuania, Germany | Romania and United Kingdom; Hungary and United Kingdom |
| history-2 | 85 | Albania, Finland, Luxembourg, Estonia, Latvia, Lithuania, Belgium, Germany | none |
| history-3 | 88 | Albania, Estonia, Latvia, Lithuania, Hungary, Germany | none |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | none | 0 of 28 | Germany 219, Soviet Union 169, Romania 68 |
| history-2 | 52 | Franco | France | 0 of 28 | Germany 215, Soviet Union 186, United Kingdom 73 |
| history-3 | 52 | Franco | none | 0 of 28 | Germany 280, Soviet Union 219, France 130 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 19 | 14 | 9 | Soviet Union 195 (+102), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 24 | 15 | 7 | Soviet Union 190 (+97), Germany 135 (+67), Romania 94 (+69) | none |
| ffa-3 | 1 April 1936 | 25 | 16 | 10 | Soviet Union 273 (+180), Germany 129 (+61), Italy 81 (+30) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 16 / 75 / 5 | 15 + 3 | 0% | 6 | 165 |
| history-1 | France | 0 / 2 / 0 | 1 + 0 | 0% | 0 | 29 |
| history-1 | Italy | 4 / 17 / 10 | 11 + 7 | 0% | 0 | 136 |
| history-1 | Soviet Union | 3 / 21 / 42 | 18 + 12 | 0% | 0 | 699 |
| history-1 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 8 |
| history-2 | United Kingdom | 16 / 75 / 5 | 18 + 3 | 0% | 8 | 156 |
| history-2 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 29 |
| history-2 | Italy | 4 / 16 / 10 | 10 + 5 | 0% | 0 | 116 |
| history-2 | Soviet Union | 3 / 21 / 43 | 41 + 32 | 0% | 0 | 652 |
| history-2 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 7 |
| history-3 | United Kingdom | 16 / 80 / 5 | 14 + 3 | 0% | 7 | 175 |
| history-3 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 30 |
| history-3 | Italy | 4 / 16 / 10 | 8 + 5 | 0% | 0 | 96 |
| history-3 | Soviet Union | 3 / 21 / 40 | 18 + 10 | 0% | 0 | 659 |
| history-3 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 6 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 4 | 25 | 6 | 0 | 0 |
| history-2 | 4 | 27 | 8 | 0 | 0 |
| history-3 | 1 | 36 | 7 | 0 | 0 |

## What the results say

- **Barbarossa now goes deep, sometimes too deep.** By 1 January 1942 the enemy holds 2 to 7 of
  the 28 Soviet provinces (Stage K1: 1 to 3), and Moscow falls in 2 of the 3 runs from 1936,
  on 11 September and 3 October 1941. Moscow never fell in reality, so the push is now a little
  stronger than history in those runs, but the Soviet Union never surrenders: the Siberian
  divisions arrive at the end of October and the front swings back. The causes were the ones
  K1 named: a province now feeds more divisions, so Germany fits about 330 divisions on its
  fronts, and an army caught by surprise gives way faster.
- **No more early landings in northern France.** Britain lands there once, on 15 June 1944 (really
  6 June); in the other two runs it never needs to, because Germany has already lost the east.
  In Stage K1 it landed between January 1942 and November 1943. Sicily or southern Italy comes
  between 31 July and 12 August 1943 (really 10 July).
- **History.** France falls between 24 June and 14 August 1940 (really 22 June). Germany is
  defeated in all 6 runs, between 24 October 1943 and 7 December 1944 (K1: 5 of 6, October 1943
  to May 1944), still earlier than the real 8 May 1945. Italy changes sides in all 3 runs from
  1936 (K1: 1 of 3) and in 2 of 3 from 1939. Greece no longer falls (K1: 2 of 3), because the
  German army is now busy on its main fronts. Soviet prices end the war at 1.8 to 3.2 times
  their 1936 level (K1 1.3 to 1.6), the cost of a longer retreat, but no Soviet government falls.
- **Armies.** With only army orders, Germany takes Poland between 4 and 17 October 1939 (really
  6 October). A head-on push into Lorraine and Burgundy does not break France by June 1941: the
  French line holds behind the Maginot forts and even takes 0 to 3 German border provinces. That
  is history's lesson too: the real attack went round through Belgium and the Ardennes. A player
  who wants a quick France has to go the same way. Armies cost little time: 10.5 to 11.1
  milliseconds a game day.
- **Still to do.** Germany still falls 5 to 18 months early. Moscow falling in some runs should be
  watched in K3, which adds air attacks on one province. Greece should fall again in spring 1941.
