# Balance report, Stage I-2: 200 AI against AI wars, 24 finance playtests, four years of peace, three runs of history and three free-for-alls

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 85% | 15% | 0% | 113 | 1.5 | 7.2 | 13 | 75% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 20% | 30% | 50% | 291 | 2.8 | 4.8 | 28 | 70% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 19 | 0.7 | 1.0 | 2 | 85% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 27 | 0.4 | 6.4 | 3 | 83% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 1 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 16 | 0.1 | 0.4 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 67 | 0.0 | 5.7 | 59 | 100% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 57 | 0.0 | 9.8 | 13 | 58% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 47 | 0.0 | 4.4 | 6 | 59% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 0% | 0% | 100% | n/a | 0.0 | 4.2 | 18 | 74% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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
| United Kingdom | Tax | 11 to 137 | 24 | 2% | x 1.1 | 58% | 59 | 88% | 0% |
| United Kingdom | Borrow | 11 to 71 | 17 | 3% | x 1.1 | 106% | 71 | 95% | 0% |
| United Kingdom | Print | 11 to 65 | 18 | 53% | x 3.7 | 13% | 52 | 86% | 100% |
| United Kingdom | Mixed | 11 to 99 | 20 | 2% | x 1.1 | 89% | 66 | 93% | 0% |
| France | Tax | 32 to 103 | 19 | 6% | x 1.1 | 93% | 59 | 88% | 2% |
| France | Borrow | 32 to 53 | 10 | 8% | x 1.1 | 122% | 70 | 95% | 2% |
| France | Print | 32 to 53 | 10 | 68% | x 5.6 | 10% | 45 | 82% | 100% |
| France | Mixed | 32 to 74 | 13 | 6% | x 1.1 | 111% | 65 | 93% | 2% |
| Germany | Tax | 30 to 176 | 26 | 2% | x 1.1 | 67% | 63 | 88% | 0% |
| Germany | Borrow | 30 to 94 | 18 | 2% | x 1.1 | 113% | 73 | 95% | 0% |
| Germany | Print | 30 to 96 | 19 | 59% | x 4.1 | 12% | 52 | 86% | 100% |
| Germany | Mixed | 30 to 128 | 22 | 2% | x 1.1 | 97% | 70 | 93% | 0% |
| Italy | Tax | 28 to 61 | 9 | 2% | x 1.1 | 115% | 63 | 88% | 0% |
| Italy | Borrow | 28 to 30 | 6 | 5% | x 1.1 | 135% | 67 | 95% | 1% |
| Italy | Print | 28 to 30 | 6 | 68% | x 6.4 | 9% | 48 | 84% | 100% |
| Italy | Mixed | 28 to 44 | 7 | 4% | x 1.1 | 129% | 67 | 93% | 1% |
| Soviet Union | Tax | 74 to 197 | 26 | 2% | x 1.1 | 93% | 62 | 88% | 0% |
| Soviet Union | Borrow | 74 to 118 | 20 | 6% | x 1.1 | 125% | 73 | 95% | 2% |
| Soviet Union | Print | 74 to 117 | 20 | 64% | x 5.4 | 10% | 50 | 85% | 100% |
| Soviet Union | Mixed | 74 to 154 | 22 | 5% | x 1.1 | 117% | 69 | 93% | 1% |
| Poland | Tax | 28 to 47 | 7 | 2% | x 1.1 | 101% | 62 | 88% | 0% |
| Poland | Borrow | 28 to 28 | 3 | 7% | x 1.1 | 147% | 67 | 95% | 3% |
| Poland | Print | 28 to 28 | 3 | 133% | x 12.4 | 6% | 36 | 63% | 100% |
| Poland | Mixed | 28 to 31 | 3 | 2% | x 1.1 | 131% | 67 | 93% | 0% |

## Four years of peace

Every country is led by the AI from 1 January 1936 to 1 January 1940, with the historical
plans switched off, so nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | 11 to 50 | 30 + 8 to 44 + 11 | 14 of 24 | 9 | Shadow factories, Ministry of Supply | 80 | 43 | 34% |
| France | 32 to 73 | 22 + 7 to 34 + 9 | 14 of 24 | 9 | Nationalise the arms industry, Extend the Maginot Line | 77 | 35 | 37% |
| Germany | 30 to 118 | 34 + 12 to 36 + 32 | 14 of 24 | 9 | Four Year Plan, Westwall, Armoured corps | 68 | 55 | 57% |
| Italy | 28 to 76 | 13 + 6 to 15 + 18 | 14 of 24 | 9 | Autarky campaign, Alpine Wall | 63 | 58 | 60% |
| Soviet Union | 74 to 293 | 32 + 16 to 36 + 36 | 14 of 24 | 10 | Third Five-Year Plan, Universal military duty | 64 | 55 | 56% |
| Poland | 28 to 61 | 8 + 3 to 15 + 7 | 14 of 24 | 10 | Central Industrial Region, National Defence Fund | 72 | 58 | 29% |

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
| Poland falls | 6 October 1939 | 24 September 1939 | 23 September 1939 | 14 October 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 January 1940 | 1 January 1940 | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 27 June 1940 | 8 June 1940 | 19 June 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 15 July 1940 | 10 June 1940 | 17 June 1940 |
| France falls | 22 June 1940 | 19 August 1940 | 27 June 1940 | 4 July 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 20 August 1940 | 28 June 1940 | 5 July 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 30 August 1940 | 30 August 1940 | 30 August 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |
| Yugoslavia falls | 17 April 1941 | 9 May 1941 | 18 May 1941 | 11 June 1941 |
| Greece falls | 23 April 1941 | did not happen | 1 June 1941 | did not happen |
| Siberian divisions reach Moscow | November 1941 | 31 October 1941 | 31 October 1941 | 30 November 1941 |
| Mussolini falls | 25 July 1943 | 7 August 1943 | 15 August 1943 | did not happen |
| Italy signs an armistice and changes sides | 8 September 1943 | 22 September 1943 | 30 September 1943 | did not happen |
| Moscow falls | never | did not happen | 3 April 1942 | 10 October 1941 |
| The Soviet Union surrenders | never | did not happen | did not happen | 2 August 1943 |
| Germany surrenders | 8 May 1945 | did not happen | did not happen | did not happen |

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | history-1 | history-2 | history-3 |
| --- | --- | --- | --- | --- |
| The Allies land in Sicily or southern Italy | 10 July 1943 | 6 August 1943 | 14 August 1943 | did not happen |
| The Allies land in northern France or the Low Countries | 6 June 1944 | did not happen | 13 July 1944 | did not happen |
| The Allies land in the south of France | 15 August 1944 | did not happen | did not happen | did not happen |

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| history-1 | 1 January 1942 | 4 of 28 | 0 | 347 | 395 | 126 | with Germany |
| history-1 | 1 January 1943 | 5 of 28 | 0 | 357 | 395 | 153 | with Germany |
| history-1 | 1 January 1944 | 3 of 28 | 0 | 406 | 394 | 199 | with the Allies |
| history-1 | 1 January 1945 | 4 of 28 | 0 | 410 | 393 | 214 | with the Allies |
| history-2 | 1 January 1942 | 4 of 28 | 0 | 373 | 403 | 133 | with Germany |
| history-2 | 1 January 1943 | 4 of 28 | 0 | 404 | 399 | 151 | with Germany |
| history-2 | 1 January 1944 | 6 of 28 | 0 | 409 | 399 | 187 | with the Allies |
| history-2 | 1 January 1945 | 6 of 28 | 0 | 457 | 399 | 188 | with the Allies |
| history-3 | 1 January 1942 | 7 of 28 | 0 | 356 | 400 | 136 | with Germany |
| history-3 | 1 January 1943 | 8 of 28 | 0 | 396 | 399 | 152 | with Germany |
| history-3 | 1 January 1944 | surrendered | 0 | 436 | 0 | 187 | with Germany |
| history-3 | 1 January 1945 | surrendered | 0 | 447 | 0 | 204 | with Germany |

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Estonia, Latvia, Lithuania, Belgium, Norway, Yugoslavia | Germany and United Kingdom; Germany and Greece; Germany and Soviet Union; Romania and United Kingdom; Hungary and United Kingdom; Finland and United Kingdom; Germany and Italy |
| history-2 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Norway, Estonia, Latvia, Lithuania, Yugoslavia, Greece | Germany and United Kingdom; Germany and Soviet Union; Romania and United Kingdom; Finland and United Kingdom; Germany and Italy |
| history-3 | 90 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Norway, Yugoslavia, Soviet Union | Germany and United Kingdom; Germany and Greece; Romania and United Kingdom; Hungary and United Kingdom |

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 52 | Franco | France | 3 of 28 (Vinnitsa, Odessa, Minsk) | Soviet Union 240, Germany 229, United Kingdom 124 |
| history-2 | 52 | Franco | France | 6 of 28 (Vinnitsa, Gomel, Minsk, Novgorod, Murmansk, Karelia) | Soviet Union 231, Germany 222, United Kingdom 160 |
| history-3 | 52 | Franco | France | 28 of 28 (Abkhazia, Georgia, Azerbaijan, Kiev, Vinnitsa, Odessa, Poltava, Dnepropetrovsk, Donbass, Zaporozhye, Gomel, Minsk, Novgorod, Kuban, Dagestan, Murmansk, Karelia, Moscow, Kursk, Voronezh, Stalingrad, Saratov, Kalmykia, Crimea, Arkhangelsk, Penza, Gorky, Vologda) | Soviet Union 322, Germany 155, United Kingdom 41 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 23 | 13 | 11 | Soviet Union 161 (+68), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 28 | 14 | 5 | Soviet Union 173 (+80), Germany 135 (+67), Romania 80 (+55) | none |
| ffa-3 | 1 April 1936 | 22 | 11 | 13 | Soviet Union 145 (+52), France 123 (+64), Germany 115 (+47) | none |

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 14 / 65 / 5 | 19 + 7 | 0% | 3 | 214 |
| history-1 | France | 0 / 0 / 0 | 1 + 0 | 0% | 0 | 15 |
| history-1 | Germany | 3 / 5 / 0 | 38 + 13 | 10% | 0 | 410 |
| history-1 | Italy | 4 / 13 / 10 | 10 + 3 | 0% | 0 | 49 |
| history-1 | Soviet Union | 3 / 12 / 33 | 40 + 20 | 0% | 0 | 393 |
| history-2 | United Kingdom | 16 / 66 / 5 | 19 + 8 | 0% | 12 | 188 |
| history-2 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 14 |
| history-2 | Germany | 3 / 5 / 0 | 37 + 13 | 10% | 0 | 457 |
| history-2 | Italy | 4 / 12 / 10 | 11 + 5 | 0% | 0 | 54 |
| history-2 | Soviet Union | 3 / 11 / 33 | 40 + 20 | 0% | 0 | 398 |
| history-3 | United Kingdom | 14 / 65 / 5 | 23 + 8 | 1% | 2 | 204 |
| history-3 | France | 0 / 0 / 0 | 1 + 0 | 0% | 0 | 16 |
| history-3 | Germany | 3 / 5 / 0 | 40 + 13 | 10% | 0 | 447 |
| history-3 | Italy | 4 / 16 / 10 | 10 + 3 | 0% | 0 | 150 |

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 0 | 10 | 3 | 0 | 0 |
| history-2 | 4 | 25 | 12 | 0 | 0 |
| history-3 | 4 | 24 | 2 | 0 | 0 |

## What the results say

Written by hand after the run above; `npm run balance` keeps this section when it refreshes the tables.

- **1939 to 1941 follow history closely in all three runs.** Poland, Norway, France and
  Yugoslavia fall within weeks of their real dates, and Norway now holds out for two months
  with British help (8 to 27 June against the real 10 June) instead of ten days. France fell
  late in history-1 (19 August).
- **Greece falls in one run of three** (1 June 1941). In the other two the Greek army, dug in
  in the hills of Epirus, outlasts the German Balkan force while most of the German army masses
  for the Soviet Union.
- **Italy changes sides in two runs of three**, within two to three weeks of the real dates
  (Mussolini falls 7 and 15 August 1943, armistice 22 and 30 September). Both times the Allies
  landed in Sicily in August 1943, about a month late, because the British fleet first has to
  win the sea off the beach. In history-3 there was no landing and Mussolini stayed.
- **Normandy happened in one run** (13 July 1944). In the others the German army, over 400
  divisions by 1944 and with no second front to the east to feed, holds the Channel coast too
  strongly for the landing odds.
- **The eastern front is still the weak spot.** Germany attacks on 22 June 1941 and the Siberian
  divisions arrive on time, but the front then settles. In two runs Germany holds 3 to 6 Soviet
  provinces until 1945 and the Red Army never pushes it out; in history-3 Germany takes Moscow in
  October 1941 and the Soviet Union surrenders in August 1943 even with the new last stand rule.
  The causes are beyond the army AI: the Soviet economy falls into high inflation and its
  government falls, its land can feed fewer divisions than it raises, and Germany grows to over
  400 divisions. That needs a pass on war production and the home front.
