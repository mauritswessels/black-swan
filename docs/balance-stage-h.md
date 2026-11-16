# Balance report, Stage H: 200 AI against AI wars, 24 finance playtests, four years of peace, three runs of history and three free-for-alls

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
| Germany v France | 30 v 32 | 55% | 40% | 5% | 317 | 2.0 | 6.7 | 49 | 71% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 19 | 0.6 | 0.8 | 2 | 93% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 23 | 0.5 | 7.0 | 3 | 67% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 0 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 73 | 0.0 | 3.9 | 33 | 99% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 91 | 0.0 | 5.2 | 13 | 64% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 74 | 0.0 | 4.6 | 10 | 62% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 0% | 0% | 100% | n/a | 0.0 | 7.4 | 38 | 87% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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

Story mode from 1 January 1936 to 1 January 1942, three times with different random numbers,
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
| Poland falls | 6 October 1939 | 30 September 1939 | 29 September 1939 | 16 October 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 January 1940 | 1 January 1940 | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany lands in Norway | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Norway falls | 10 June 1940 | 20 April 1940 | 19 April 1940 | 19 April 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 22 July 1940 | 8 July 1940 | 29 July 1940 |
| France falls | 22 June 1940 | 8 September 1940 | 19 August 1940 | 7 September 1940 |
| France signs an armistice (Vichy) | 22 June 1940 | 9 September 1940 | 20 August 1940 | 8 September 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| The Second Vienna Award | 30 August 1940 | 13 September 1940 | 30 August 1940 | 13 September 1940 |
| Italy invades Greece | 28 October 1940 | 28 October 1940 | 28 October 1940 | 28 October 1940 |
| Lend-Lease reaches Britain | 11 March 1941 | 31 March 1941 | 31 March 1941 | 31 March 1941 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Britain and the Soviet Union become allies | 12 July 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |
| Lend-Lease reaches the Soviet Union | 1 October 1941 | 31 October 1941 | 31 October 1941 | 31 October 1941 |

How each run stood on 1 January 1942:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Norway, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Romania and Soviet Union; Romania and United Kingdom; Hungary and Soviet Union; Hungary and United Kingdom; Finland and Soviet Union; Finland and United Kingdom |
| history-2 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Norway, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Romania and Soviet Union; Romania and United Kingdom; Hungary and Soviet Union; Hungary and United Kingdom; Finland and Soviet Union; Finland and United Kingdom |
| history-3 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Norway, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Romania and Soviet Union; Romania and United Kingdom; Hungary and Soviet Union; Hungary and United Kingdom; Finland and Soviet Union; Finland and United Kingdom |

## Story mode in the same runs

How each run stood on 1 January 1942. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
| history-1 | 45 | Franco | France | 0 of 28 | Germany 45, Belgium 28, Soviet Union 26 |
| history-2 | 45 | Franco | France | 2 of 28 (Vinnitsa, Odessa) | Germany 42, Soviet Union 30, France 21 |
| history-3 | 45 | Franco | France | 1 of 28 (Vinnitsa) | Germany 54, Belgium 28, France 25 |

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
| ffa-1 | 1 April 1936 | 18 | 13 | 10 | Soviet Union 179 (+86), Germany 135 (+67), Italy 99 (+48) | none |
| ffa-2 | 1 April 1936 | 28 | 14 | 4 | Germany 213 (+145), Soviet Union 120 (+27), Romania 80 (+55) | none |
| ffa-3 | 1 April 1936 | 18 | 10 | 10 | Germany 115 (+47), Soviet Union 114 (+21), France 97 (+38) | none |

## The war at sea and in the air

The same three runs on 1 January 1942. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
| history-1 | United Kingdom | 15 / 47 / 5 | 17 + 3 | 0% | 1 | 136 |
| history-1 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 11 |
| history-1 | Germany | 3 / 5 / 0 | 30 + 13 | 10% | 0 | 374 |
| history-1 | Italy | 4 / 12 / 10 | 10 + 3 | 72% | 0 | 122 |
| history-1 | Soviet Union | 3 / 10 / 27 | 41 + 20 | 0% | 0 | 420 |
| history-2 | United Kingdom | 14 / 46 / 5 | 17 + 3 | 2% | 3 | 132 |
| history-2 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 13 |
| history-2 | Germany | 3 / 5 / 1 | 33 + 13 | 10% | 0 | 374 |
| history-2 | Italy | 4 / 12 / 10 | 11 + 4 | 72% | 0 | 121 |
| history-2 | Soviet Union | 3 / 10 / 27 | 41 + 20 | 0% | 0 | 420 |
| history-3 | United Kingdom | 15 / 47 / 5 | 20 + 4 | 0% | 1 | 139 |
| history-3 | France | 0 / 0 / 0 | 0 + 0 | 0% | 0 | 13 |
| history-3 | Germany | 3 / 5 / 1 | 34 + 13 | 10% | 0 | 363 |
| history-3 | Italy | 4 / 12 / 10 | 13 + 6 | 72% | 0 | 107 |
| history-3 | Soviet Union | 3 / 10 / 27 | 44 + 20 | 0% | 0 | 446 |

Over the six years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
| history-1 | 4 | 7 | 1 | 0 | 0 |
| history-2 | 4 | 4 | 3 | 0 | 0 |
| history-3 | 4 | 5 | 1 | 0 | 0 |

## What the results say

- **Up to September 1939 the AI repeats history to the day** in all three runs, now including
  the start and end of the war in Spain, the First Vienna Award and Britain's guarantee to
  Poland on 31 March 1939 (it used to come a day late).
- **Poland falls between 29 September and 16 October 1939** (really 6 October).
- **Norway falls in ten days.** The surprise landing at Oslo works every time. The real
  campaign lasted two months, because the Allies landed in the north; the AI does not.
- **France falls between 19 August and 8 September 1940**, about two months late, and signs
  the armistice the next day. Without the new "shock of 1940" rule the campaign depended on
  luck: in test runs France fell anywhere between August 1940 and never. With it, four seeds
  out of four fell within three weeks of each other.
- **The two Vienna Awards, Craiova, Italy's attack on Greece, Lend-Lease and the alliance of
  Britain and the Soviet Union all happen**, on or near their real dates. The Second Vienna
  Award waits for France to fall, so it is two weeks late in two runs.
- **Free-for-all is busy but not a massacre.** After the quiet first three months there are 18
  to 28 declarations of war in five years, 10 to 14 small countries fall and no great power
  does. Germany or the Soviet Union leads every time, which is what their armies would suggest.
- Two-country test wars and the finance and peace runs are unchanged from Stage G.

## Known weak spots, to revisit in Stage I

- **The eastern front is still a stalemate.** With surprise, the purge and the army massed on
  the border, Germany takes none to two Soviet provinces in six months of 1941; the real army
  reached the gates of Moscow. The army AI attacks province by province and has no idea of a
  front-wide offensive, and the Soviet army of 1941 is too large (420 divisions).
- **No second front without a player**: one to three AI landings in six years.
- **Greece usually holds** against Italy and then Germany, and makes peace.
- **Italy enters the war three to seven weeks late**, because it waits for France to be
  nearly beaten.
- **Norway falls too fast**, and the Winter War ends two months early (as in Stage F).
- The submarine war still ends by 1941, and air wings are never wiped out (as in Stage G).
