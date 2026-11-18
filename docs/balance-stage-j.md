# Balance report, Stage J: 200 AI against AI wars, 24 finance playtests, four years of peace, six runs of history and three free-for-alls

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 90% | 10% | 0% | 116 | 2.5 | 8.2 | 13 | 75% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 55% | 20% | 25% | 365 | 1.5 | 12.7 | 28 | 68% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 19 | 0.7 | 1.0 | 2 | 85% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 27 | 0.4 | 6.4 | 3 | 83% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.3 | 1 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 16 | 0.1 | 0.4 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 86 | 0.0 | 5.7 | 99 | 100% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 63 | 0.0 | 11.6 | 20 | 62% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 47 | 0.0 | 4.7 | 6 | 60% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 0% | 0% | 100% | n/a | 0.0 | 4.7 | 10 | 44% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| Poland falls | 6 October 1939 | 21 September 1939 | 22 September 1939 | 20 September 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 January 1940 | 1 January 1940 | did not happen |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 8 June 1940 | 28 June 1940 | 22 June 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 10 June 1940 | 10 June 1940 | 10 June 1940 |
| France falls | 22 June 1940 | 18 July 1940 | 21 July 1940 | 27 July 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 19 July 1940 | 22 July 1940 | 28 July 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 30 August 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 17 May 1941 | 13 May 1941 | 12 May 1941 |
| Greece falls | 23 April 1941 | did not happen | did not happen | did not happen |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Mussolini falls | 25 July 1943 | 22 August 1943 | 28 August 1943 | 25 July 1943 |
| Italy signs an armistice and changes sides | 8 September 1943 | 7 October 1943 | 13 October 1943 | 9 September 1943 |
| Moscow falls | never | did not happen | did not happen | did not happen |
| The Soviet Union surrenders | never | did not happen | did not happen | did not happen |
| Germany surrenders | 8 May 1945 | 12 August 1944 | 16 February 1944 | 2 January 1944 |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 12 August 1943 | 16 August 1943 | did not happen |
| The Allies land in northern France or the Low Countries | 6 June 1944 | 31 August 1943 | 19 July 1943 | 23 January 1942 |
| The Allies land in the south of France | 15 August 1944 | did not happen | did not happen | did not happen |

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
| history-1 | 18 July 1940 | 7 October 1943 | 12 August 1944 | 28% | x1.8 | 0 | communist |
| history-2 | 21 July 1940 | 13 October 1943 | 16 February 1944 | 27% | x1.7 | 0 | communist |
| history-3 | 27 July 1940 | 9 September 1943 | 2 January 1944 | 22% | x1.5 | 0 | communist |
| 1939-1 | 31 July 1940 | 29 September 1943 | did not fall | 26% | x1.7 | 0 | communist |
| 1939-2 | 14 August 1940 | 20 October 1943 | 10 May 1944 | 28% | x1.7 | 0 | communist |
| 1939-3 | 3 August 1940 | 26 September 1943 | 29 January 1944 | 19% | x1.5 | 0 | communist |

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-1 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-1 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-1 | 1 January 1940 | Germany | 123 (90%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| history-1 | 1 January 1940 | United Kingdom | 45 (100%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-1 | 1 January 1941 | Germany | 284 (92%) | 80 | 2% | x1.1 | 44% | yes | 59 | 0 |
| history-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| history-1 | 1 January 1941 | United Kingdom | 134 (97%) | 28 | 2% | x1.1 | 46% | yes | 76 | 0 |
| history-1 | 1 January 1942 | Germany | 335 (87%) | 98 | 2% | x1.1 | 49% | yes | 60 | 0 |
| history-1 | 1 January 1942 | Soviet Union | 488 (95%) | 68 | 16% | x1.2 | 67% | yes | 73 | 0 |
| history-1 | 1 January 1942 | United Kingdom | 141 (99%) | 39 | 2% | x1.1 | 56% | yes | 72 | 0 |
| history-1 | 1 January 1943 | Germany | 362 (82%) | 118 | 2% | x1.2 | 56% | yes | 59 | 0 |
| history-1 | 1 January 1943 | Soviet Union | 488 (100%) | 68 | 21% | x1.5 | 83% | yes | 60 | 0 |
| history-1 | 1 January 1943 | United Kingdom | 142 (100%) | 49 | 2% | x1.2 | 68% | yes | 66 | 0 |
| history-1 | 1 January 1944 | Germany | 361 (66%) | 135 | 2% | x1.2 | 61% | yes | 55 | 0 |
| history-1 | 1 January 1944 | Soviet Union | 488 (98%) | 75 | 7% | x1.7 | 91% | yes | 70 | 0 |
| history-1 | 1 January 1944 | United Kingdom | 154 (94%) | 60 | 2% | x1.2 | 71% | yes | 64 | 0 |
| history-1 | 1 January 1945 | Soviet Union | 684 (100%) | 117 | 4% | x1.8 | 74% | no | 62 | 0 |
| history-1 | 1 January 1945 | United Kingdom | 166 (92%) | 72 | 2% | x1.2 | 73% | no | 60 | 0 |
| history-1 | 8 May 1945 | Soviet Union | 701 (100%) | 120 | 3% | x1.8 | 75% | no | 59 | 0 |
| history-1 | 8 May 1945 | United Kingdom | 170 (93%) | 76 | 2% | x1.2 | 70% | no | 58 | 0 |
| history-2 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-2 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-2 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-2 | 1 January 1940 | Germany | 123 (93%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| history-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| history-2 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-2 | 1 January 1941 | Germany | 294 (94%) | 80 | 2% | x1.1 | 45% | yes | 58 | 0 |
| history-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| history-2 | 1 January 1941 | United Kingdom | 123 (99%) | 28 | 2% | x1.1 | 45% | yes | 78 | 0 |
| history-2 | 1 January 1942 | Germany | 328 (90%) | 98 | 2% | x1.1 | 51% | yes | 60 | 0 |
| history-2 | 1 January 1942 | Soviet Union | 486 (97%) | 68 | 21% | x1.2 | 66% | yes | 72 | 0 |
| history-2 | 1 January 1942 | United Kingdom | 149 (99%) | 40 | 2% | x1.1 | 56% | yes | 68 | 0 |
| history-2 | 1 January 1943 | Germany | 358 (78%) | 112 | 2% | x1.2 | 59% | yes | 59 | 0 |
| history-2 | 1 January 1943 | Soviet Union | 486 (98%) | 72 | 17% | x1.5 | 78% | yes | 62 | 0 |
| history-2 | 1 January 1943 | United Kingdom | 151 (98%) | 51 | 2% | x1.2 | 66% | yes | 66 | 0 |
| history-2 | 1 January 1944 | Germany | 351 (59%) | 123 | 3% | x1.2 | 77% | yes | 48 | 0 |
| history-2 | 1 January 1944 | Soviet Union | 486 (99%) | 77 | 5% | x1.6 | 87% | yes | 73 | 0 |
| history-2 | 1 January 1944 | United Kingdom | 155 (90%) | 61 | 2% | x1.2 | 73% | yes | 66 | 0 |
| history-2 | 1 January 1945 | Soviet Union | 714 (100%) | 119 | 3% | x1.7 | 72% | no | 58 | 0 |
| history-2 | 1 January 1945 | United Kingdom | 167 (88%) | 72 | 2% | x1.2 | 80% | yes | 65 | 0 |
| history-2 | 8 May 1945 | Soviet Union | 727 (100%) | 122 | 3% | x1.7 | 73% | no | 57 | 0 |
| history-2 | 8 May 1945 | United Kingdom | 167 (91%) | 76 | 2% | x1.2 | 81% | yes | 65 | 0 |
| history-3 | 1 January 1939 | Germany | 74 (100%) | 43 | 2% | x1.1 | 45% | no | 72 | 0 |
| history-3 | 1 January 1939 | Soviet Union | 139 (100%) | 41 | 2% | x1.1 | 46% | no | 67 | 0 |
| history-3 | 1 January 1939 | United Kingdom | 33 (100%) | 11 | 2% | x1.1 | 35% | no | 80 | 0 |
| history-3 | 1 January 1940 | Germany | 123 (91%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| history-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 68 | 0 |
| history-3 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| history-3 | 1 January 1941 | Germany | 291 (92%) | 80 | 2% | x1.1 | 45% | yes | 61 | 0 |
| history-3 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| history-3 | 1 January 1941 | United Kingdom | 124 (99%) | 28 | 2% | x1.1 | 45% | yes | 79 | 0 |
| history-3 | 1 January 1942 | Germany | 330 (88%) | 99 | 2% | x1.1 | 50% | yes | 60 | 0 |
| history-3 | 1 January 1942 | Soviet Union | 518 (96%) | 69 | 18% | x1.2 | 69% | yes | 74 | 0 |
| history-3 | 1 January 1942 | United Kingdom | 150 (99%) | 40 | 2% | x1.1 | 55% | yes | 68 | 0 |
| history-3 | 1 January 1943 | Germany | 350 (74%) | 113 | 2% | x1.2 | 60% | yes | 59 | 0 |
| history-3 | 1 January 1943 | Soviet Union | 518 (98%) | 78 | 9% | x1.4 | 82% | yes | 70 | 0 |
| history-3 | 1 January 1943 | United Kingdom | 146 (100%) | 51 | 2% | x1.2 | 65% | yes | 65 | 0 |
| history-3 | 1 January 1944 | Germany | 300 (52%) | 109 | 17% | x1.2 | 97% | yes | 45 | 0 |
| history-3 | 1 January 1944 | Soviet Union | 518 (99%) | 83 | 4% | x1.5 | 92% | yes | 75 | 0 |
| history-3 | 1 January 1944 | United Kingdom | 149 (92%) | 67 | 2% | x1.2 | 65% | yes | 65 | 0 |
| history-3 | 1 January 1945 | Soviet Union | 714 (100%) | 121 | 3% | x1.5 | 78% | no | 58 | 0 |
| history-3 | 1 January 1945 | United Kingdom | 159 (96%) | 76 | 2% | x1.2 | 60% | no | 58 | 0 |
| history-3 | 8 May 1945 | Soviet Union | 732 (100%) | 127 | 2% | x1.5 | 77% | no | 57 | 0 |
| history-3 | 8 May 1945 | United Kingdom | 161 (98%) | 80 | 2% | x1.2 | 58% | no | 58 | 0 |
| 1939-1 | 1 January 1940 | Germany | 124 (93%) | 57 | 2% | x1.1 | 41% | yes | 70 | 0 |
| 1939-1 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-1 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-1 | 1 January 1941 | Germany | 294 (96%) | 80 | 2% | x1.1 | 45% | yes | 59 | 0 |
| 1939-1 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-1 | 1 January 1941 | United Kingdom | 119 (99%) | 28 | 2% | x1.1 | 45% | yes | 75 | 0 |
| 1939-1 | 1 January 1942 | Germany | 337 (89%) | 102 | 2% | x1.1 | 48% | yes | 60 | 0 |
| 1939-1 | 1 January 1942 | Soviet Union | 486 (96%) | 68 | 15% | x1.2 | 67% | yes | 73 | 0 |
| 1939-1 | 1 January 1942 | United Kingdom | 146 (99%) | 40 | 2% | x1.1 | 57% | yes | 69 | 0 |
| 1939-1 | 1 January 1943 | Germany | 367 (77%) | 120 | 2% | x1.2 | 56% | yes | 60 | 0 |
| 1939-1 | 1 January 1943 | Soviet Union | 486 (96%) | 75 | 17% | x1.4 | 78% | yes | 61 | 0 |
| 1939-1 | 1 January 1943 | United Kingdom | 145 (100%) | 50 | 2% | x1.2 | 68% | yes | 64 | 0 |
| 1939-1 | 1 January 1944 | Germany | 364 (69%) | 137 | 2% | x1.2 | 61% | yes | 59 | 0 |
| 1939-1 | 1 January 1944 | Soviet Union | 481 (98%) | 76 | 6% | x1.6 | 93% | yes | 66 | 0 |
| 1939-1 | 1 January 1944 | United Kingdom | 157 (97%) | 66 | 2% | x1.2 | 67% | yes | 63 | 0 |
| 1939-1 | 1 January 1945 | Germany | 350 (59%) | 147 | 3% | x1.2 | 72% | yes | 51 | 0 |
| 1939-1 | 1 January 1945 | Soviet Union | 481 (99%) | 77 | 3% | x1.7 | 112% | yes | 73 | 0 |
| 1939-1 | 1 January 1945 | United Kingdom | 159 (86%) | 78 | 2% | x1.2 | 71% | yes | 65 | 0 |
| 1939-1 | 8 May 1945 | Germany | 351 (57%) | 152 | 2% | x1.2 | 72% | yes | 51 | 0 |
| 1939-1 | 8 May 1945 | Soviet Union | 481 (99%) | 77 | 3% | x1.7 | 121% | yes | 74 | 0 |
| 1939-1 | 8 May 1945 | United Kingdom | 163 (82%) | 83 | 2% | x1.2 | 72% | yes | 64 | 0 |
| 1939-2 | 1 January 1940 | Germany | 124 (93%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-2 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 48% | no | 68 | 0 |
| 1939-2 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-2 | 1 January 1941 | Germany | 286 (90%) | 79 | 2% | x1.1 | 45% | yes | 62 | 0 |
| 1939-2 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 66 | 0 |
| 1939-2 | 1 January 1941 | United Kingdom | 108 (99%) | 28 | 2% | x1.1 | 44% | yes | 78 | 0 |
| 1939-2 | 1 January 1942 | Germany | 339 (86%) | 100 | 2% | x1.1 | 50% | yes | 60 | 0 |
| 1939-2 | 1 January 1942 | Soviet Union | 486 (98%) | 68 | 17% | x1.2 | 66% | yes | 73 | 0 |
| 1939-2 | 1 January 1942 | United Kingdom | 146 (100%) | 39 | 2% | x1.1 | 56% | yes | 73 | 0 |
| 1939-2 | 1 January 1943 | Germany | 356 (79%) | 117 | 2% | x1.2 | 58% | yes | 59 | 0 |
| 1939-2 | 1 January 1943 | Soviet Union | 486 (98%) | 71 | 19% | x1.5 | 78% | yes | 60 | 0 |
| 1939-2 | 1 January 1943 | United Kingdom | 149 (100%) | 49 | 2% | x1.2 | 69% | yes | 67 | 0 |
| 1939-2 | 1 January 1944 | Germany | 365 (62%) | 126 | 3% | x1.2 | 69% | yes | 55 | 0 |
| 1939-2 | 1 January 1944 | Soviet Union | 486 (100%) | 75 | 6% | x1.6 | 93% | yes | 72 | 0 |
| 1939-2 | 1 January 1944 | United Kingdom | 161 (89%) | 86 | 2% | x1.2 | 51% | yes | 65 | 0 |
| 1939-2 | 1 January 1945 | Soviet Union | 715 (100%) | 118 | 3% | x1.7 | 74% | no | 59 | 0 |
| 1939-2 | 1 January 1945 | United Kingdom | 178 (86%) | 97 | 2% | x1.2 | 51% | no | 60 | 0 |
| 1939-2 | 8 May 1945 | Soviet Union | 729 (100%) | 121 | 3% | x1.7 | 75% | no | 58 | 0 |
| 1939-2 | 8 May 1945 | United Kingdom | 182 (88%) | 102 | 2% | x1.2 | 49% | no | 59 | 0 |
| 1939-3 | 1 January 1940 | Germany | 123 (93%) | 57 | 2% | x1.1 | 42% | yes | 70 | 0 |
| 1939-3 | 1 January 1940 | Soviet Union | 210 (100%) | 49 | 2% | x1.1 | 46% | no | 68 | 0 |
| 1939-3 | 1 January 1940 | United Kingdom | 45 (99%) | 15 | 2% | x1.1 | 36% | yes | 77 | 0 |
| 1939-3 | 1 January 1941 | Germany | 290 (93%) | 80 | 2% | x1.1 | 45% | yes | 62 | 0 |
| 1939-3 | 1 January 1941 | Soviet Union | 285 (100%) | 67 | 2% | x1.1 | 41% | no | 69 | 0 |
| 1939-3 | 1 January 1941 | United Kingdom | 102 (100%) | 28 | 2% | x1.1 | 45% | yes | 78 | 0 |
| 1939-3 | 1 January 1942 | Germany | 330 (88%) | 97 | 2% | x1.1 | 52% | yes | 61 | 0 |
| 1939-3 | 1 January 1942 | Soviet Union | 484 (97%) | 73 | 11% | x1.2 | 67% | yes | 74 | 0 |
| 1939-3 | 1 January 1942 | United Kingdom | 154 (99%) | 41 | 2% | x1.1 | 53% | yes | 68 | 0 |
| 1939-3 | 1 January 1943 | Germany | 353 (78%) | 111 | 2% | x1.2 | 61% | yes | 59 | 0 |
| 1939-3 | 1 January 1943 | Soviet Union | 484 (98%) | 77 | 9% | x1.3 | 85% | yes | 69 | 0 |
| 1939-3 | 1 January 1943 | United Kingdom | 154 (100%) | 52 | 2% | x1.2 | 63% | yes | 65 | 0 |
| 1939-3 | 1 January 1944 | Germany | 349 (54%) | 123 | 2% | x1.2 | 71% | yes | 52 | 0 |
| 1939-3 | 1 January 1944 | Soviet Union | 484 (99%) | 79 | 4% | x1.4 | 101% | yes | 74 | 0 |
| 1939-3 | 1 January 1944 | United Kingdom | 165 (92%) | 63 | 2% | x1.2 | 68% | yes | 64 | 0 |
| 1939-3 | 1 January 1945 | Soviet Union | 706 (100%) | 121 | 3% | x1.5 | 80% | no | 58 | 0 |
| 1939-3 | 1 January 1945 | United Kingdom | 173 (96%) | 76 | 2% | x1.2 | 63% | no | 57 | 0 |
| 1939-3 | 8 May 1945 | Soviet Union | 719 (100%) | 127 | 2% | x1.5 | 80% | no | 57 | 0 |
| 1939-3 | 8 May 1945 | United Kingdom | 173 (98%) | 80 | 2% | x1.2 | 60% | no | 57 | 0 |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 3 of 28 | 0 | 335 | 488 | 141 | with Germany |
| history-1 | 1 January 1943 | 2 of 28 | 0 | 362 | 488 | 142 | with Germany |
| history-1 | 1 January 1944 | 0 of 28 | 1 | 361 | 488 | 154 | with the Allies |
| history-1 | 1 January 1945 | 0 of 28 | 15 | 0 | 684 | 166 | with the Allies |
| history-2 | 1 January 1942 | 3 of 28 | 0 | 328 | 486 | 149 | with Germany |
| history-2 | 1 January 1943 | 0 of 28 | 0 | 358 | 486 | 151 | with Germany |
| history-2 | 1 January 1944 | 0 of 28 | 3 | 351 | 486 | 155 | with the Allies |
| history-2 | 1 January 1945 | 0 of 28 | 15 | 0 | 714 | 167 | with the Allies |
| history-3 | 1 January 1942 | 2 of 28 | 0 | 330 | 518 | 150 | with Germany |
| history-3 | 1 January 1943 | 0 of 28 | 1 | 350 | 518 | 146 | with Germany |
| history-3 | 1 January 1944 | 0 of 28 | 9 | 300 | 518 | 149 | with the Allies |
| history-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 714 | 159 | with the Allies |
| 1939-1 | 1 January 1942 | 2 of 28 | 0 | 337 | 486 | 146 | with Germany |
| 1939-1 | 1 January 1943 | 0 of 28 | 0 | 367 | 486 | 145 | with Germany |
| 1939-1 | 1 January 1944 | 0 of 28 | 1 | 364 | 481 | 157 | fallen |
| 1939-1 | 1 January 1945 | 0 of 28 | 3 | 350 | 481 | 159 | fallen |
| 1939-2 | 1 January 1942 | 3 of 28 | 0 | 339 | 486 | 146 | with Germany |
| 1939-2 | 1 January 1943 | 1 of 28 | 0 | 356 | 486 | 149 | with Germany |
| 1939-2 | 1 January 1944 | 0 of 28 | 1 | 365 | 486 | 161 | with the Allies |
| 1939-2 | 1 January 1945 | 0 of 28 | 15 | 0 | 715 | 178 | with the Allies |
| 1939-3 | 1 January 1942 | 3 of 28 | 0 | 330 | 484 | 154 | with Germany |
| 1939-3 | 1 January 1943 | 0 of 28 | 0 | 353 | 484 | 154 | with Germany |
| 1939-3 | 1 January 1944 | 0 of 28 | 4 | 349 | 484 | 165 | with the Allies |
| 1939-3 | 1 January 1945 | 0 of 28 | 15 | 0 | 706 | 173 | with the Allies |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 86 | Albania, Estonia, Latvia, Lithuania, Germany | none |
| history-2 | 90 | Albania, Estonia, Latvia, Lithuania, Germany | Romania and United Kingdom |
| history-3 | 83 | Albania, Finland, Estonia, Latvia, Lithuania, Hungary, Germany | none |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | France | 0 of 28 | Germany 223, Soviet Union 144, United Kingdom 40 |
| history-2 | 52 | Franco | none | 0 of 28 | Germany 202, Soviet Union 104, United Kingdom 94 |
| history-3 | 52 | Franco | France | 0 of 28 | Germany 258, Soviet Union 135, United Kingdom 57 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 19 | 12 | 8 | Soviet Union 187 (+94), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 24 | 15 | 5 | Soviet Union 192 (+99), Germany 157 (+89), Romania 69 (+44) | none |
| ffa-3 | 1 April 1936 | 19 | 13 | 6 | Soviet Union 185 (+92), Germany 136 (+68), Italy 80 (+29) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 16 / 77 / 5 | 21 + 3 | 0% | 5 | 170 |
| history-1 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 25 |
| history-1 | Italy | 4 / 16 / 10 | 7 + 4 | 0% | 0 | 118 |
| history-1 | Soviet Union | 3 / 22 / 42 | 15 + 9 | 0% | 0 | 701 |
| history-1 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 7 |
| history-2 | United Kingdom | 16 / 76 / 5 | 14 + 4 | 0% | 11 | 167 |
| history-2 | France | 0 / 2 / 0 | 1 + 0 | 0% | 0 | 27 |
| history-2 | Italy | 4 / 16 / 10 | 8 + 5 | 0% | 0 | 107 |
| history-2 | Soviet Union | 3 / 22 / 43 | 16 + 10 | 0% | 0 | 727 |
| history-2 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 8 |
| history-3 | United Kingdom | 16 / 77 / 5 | 12 + 3 | 0% | 9 | 161 |
| history-3 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 28 |
| history-3 | Italy | 4 / 16 / 10 | 12 + 6 | 0% | 0 | 141 |
| history-3 | Soviet Union | 3 / 22 / 46 | 17 + 10 | 0% | 0 | 732 |
| history-3 | Poland | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 8 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 4 | 32 | 5 | 0 | 0 |
| history-2 | 4 | 26 | 11 | 0 | 0 |
| history-3 | 4 | 24 | 9 | 0 | 0 |

## What the results say

Written by hand for Stage J (version 1.1.0); the tables above are refreshed by `npm run balance`.

**Before Stage J** (docs/balance-stage-i2.md), the Soviet Union printed money to pay for the war:
its prices rose about 24,000 times over, its government fell three or four times and it ended
the war as a democracy. Germany grew to more than 400 divisions and never surrendered.

**Now:**

- **The Soviet economy holds.** In all six runs Soviet inflation peaks at 19% to 28% a year,
  prices end the war at 1.5 to 1.8 times their 1936 level (the real figure was about double in
  the state shops) and no Soviet government falls. What does it: soldiers paid like Soviet
  workers (65% of the usual upkeep), compulsory state loans, forced saving under rationing, a
  capped interest rate, and a finance minister that stops forming divisions as inflation climbs.
- **Armies near their real size.** Germany has about 125 divisions in January 1940, 285 to 295
  in January 1941 (real: about 210 by June 1941, but this game's divisions are a little
  smaller) and peaks at 350 to 365 in 1943, worn down to 52% to 69% strength by 1944: a war of
  attrition. Britain grows to about 170. The Soviet Union holds about 485 to 520 divisions in
  the war years. After Germany falls it keeps forming divisions at peace (to about 700), which
  only costs it money; the real Red Army demobilised.
- **The timeline.** France falls between 18 July and 14 August 1940 (real: 22 June), Norway
  holds for eight to twelve weeks with British help in the 1936 runs (real: two months), Mussolini falls in late
  July or August 1943 and Italy changes sides between 9 September and 20 October 1943 (real: 8
  September). Germany surrenders between January and August 1944 in five runs and holds out to
  May 1945 in one (real: 8 May 1945). So the war now ends, but a little early.
- **Finance.** Britain pays for its war with taxes and bonds at 2% inflation, and its debt
  reaches 60% to 80% of a year's output by 1945. That is too low: the real debt passed 250%,
  because Britain also borrowed abroad and paid for an empire-wide war that is not on this map.

**Still not like history:**

- **Barbarossa stops near the border.** Germany takes 2 or 3 Soviet provinces of 28 in 1941
  and is pushed back by 1943; the real Wehrmacht reached Moscow. The economy is no longer the
  reason (Germany has 330 divisions and the factories to supply them): the army AI only fights
  a few battles at a time and keeps too many divisions out of the front because supply caps how
  many it can feed there. That is army AI work for a later version.
- **Greece never falls**, and the Winter War ends in January 1940 or not at all, as before.
- **The Allied landing in northern France** comes in 1943 in two runs and in January 1942 in
  one (real: June 1944).
