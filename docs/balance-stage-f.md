# Balance report, Stage F: 200 AI against AI wars, 24 finance playtests, four years of peace and three runs of history

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 100% | 0% | 0% | 94 | 0.0 | 6.9 | 24 | 79% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 65% | 35% | 0% | 220 | 3.8 | 8.7 | 47 | 77% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 20 | 0.7 | 0.7 | 2 | 95% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 26 | 0.6 | 5.6 | 3 | 67% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 0 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 75 | 0.0 | 5.7 | 50 | 100% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 113 | 0.0 | 6.4 | 27 | 63% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 65 | 0.0 | 1.9 | 9 | 75% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 5% | 0% | 95% | 220 | 0.0 | 2.6 | 27 | 84% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

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

Every country is led by the AI from 1 January 1936 to 1 January 1940, with the historical
plans switched off, so nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | 11 to 50 | 30 + 8 to 44 + 11 | 8 of 16 | 9 | Shadow factories, Ministry of Supply | 80 | 43 | 34% |
| France | 32 to 73 | 22 + 7 to 34 + 9 | 8 of 16 | 9 | Nationalise the arms industry, Extend the Maginot Line | 75 | 40 | 34% |
| Germany | 30 to 120 | 34 + 12 to 36 + 31 | 8 of 16 | 9 | Four Year Plan, Westwall | 68 | 59 | 57% |
| Italy | 28 to 77 | 13 + 6 to 15 + 18 | 8 of 16 | 9 | Autarky campaign, Alpine Wall | 63 | 58 | 58% |
| Soviet Union | 74 to 297 | 32 + 16 to 36 + 37 | 8 of 16 | 10 | Third Five-Year Plan, Universal military duty | 64 | 55 | 54% |
| Poland | 28 to 61 | 8 + 3 to 15 + 5 | 8 of 16 | 10 | Central Industrial Region, National Defence Fund | 72 | 53 | 28% |

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
| Poland falls | 6 October 1939 | 4 October 1939 | 28 September 1939 | 28 September 1939 |
| The Winter War begins | 30 November 1939 | 30 November 1939 | 30 November 1939 | 30 November 1939 |
| The Winter War ends | 13 March 1940 | 1 January 1940 | 1 January 1940 | 1 January 1940 |
| Germany occupies Denmark | 9 April 1940 | 9 April 1940 | 9 April 1940 | 9 April 1940 |
| Germany attacks in the west | 10 May 1940 | 10 May 1940 | 10 May 1940 | 10 May 1940 |
| Italy declares war on France | 10 June 1940 | 8 July 1940 | 8 July 1940 | 22 July 1940 |
| France falls | 22 June 1940 | 22 August 1940 | 20 August 1940 | 30 August 1940 |
| The Soviet Union annexes the Baltic states | June to August 1940 | 15 June 1940 | 15 June 1940 | 15 June 1940 |
| Germany invades Yugoslavia | 6 April 1941 | 6 April 1941 | 6 April 1941 | 6 April 1941 |
| Germany invades the Soviet Union | 22 June 1941 | 22 June 1941 | 22 June 1941 | 22 June 1941 |

How each run stood on 1 January 1942:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
| history-1 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, France, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Hungary and Soviet Union |
| history-2 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, France, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Hungary and Soviet Union; Finland and Soviet Union |
| history-3 | 100 | Austria, Czechoslovakia, Albania, Poland, Denmark, Luxembourg, Netherlands, Belgium, Estonia, Latvia, Lithuania, France, Yugoslavia | Germany and United Kingdom; Italy and United Kingdom; Egypt and Italy; Germany and Soviet Union; Hungary and Soviet Union; Finland and Soviet Union |

## What the results say

- **Up to September 1939 the AI repeats history to the day** in all three runs. Munich falls on
  29 September (the conference met on the 29th and signed in the first hour of the 30th), and
  Britain guarantees Poland on 1 April rather than 31 March because the containment rule is
  checked at the end of each month.
- **Britain and France declare war on 1 September, not the 3rd.** Promises are honoured the
  same day; the two days of real hesitation are not modelled.
- **Poland falls in four to five weeks**, as it did, once the Soviet Union comes in from the
  east on 17 September.
- **The Winter War is short.** It ends on 1 January 1940 with the border province in Soviet
  hands, ten weeks early. Finland has no winter or forest advantage yet.
- **France falls about two months late** (late August instead of 22 June), and Italy joins
  about a month late, because it waits until France has lost 15% of its land. The campaign in
  the west is slower than the real one: there are no tanks breaking through and no air force.
- **Germany attacks the Soviet Union on 22 June 1941** in every run.
- Two-country test wars, the finance runs and the peace run are close to Stage E. Differences
  come from the AI now arming faster when world tension is high, which the peace run does not
  have.

## Known weak spots, to revisit in later stages

- **After France falls the western war goes quiet.** Britain has no navy or air force to fight
  with until Stage G, and nobody can cross the sea in force.
- **The eastern front becomes a stalemate** within a few months instead of swinging to Moscow
  and back. The army AI has no idea of an offensive on a whole front, and there is no winter.
- By 1 January 1942 world tension is at its ceiling of 100 and stays there; it tells the
  player nothing more once the big war has begun.
- Finland still falls too easily, and the Soviet army of 1941 is too large (both as in Stage E).
- Norway, Greece, the Spanish Civil War, the Vienna Awards and Vichy France are not modelled.
