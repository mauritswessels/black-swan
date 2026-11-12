# Balance report, Stage B: 200 AI against AI wars

Made by `npm run balance`. Do not edit by hand; run the command again instead.

Each war starts on 1 January 1936 with the real map and each country's starting army. The first
country declares war on the second on day 1 and both are led by the same simple AI. A war ends
when one side surrenders (enemies hold 60% of its home victory points) or after 2 years, which
counts as a stalemate. Only the two countries fight; everyone else stays neutral.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 80% | 20% | 0% | 109 | 5.6 | 6.9 | 31 | 75% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 10% | 90% | 0% | 167 | 8.0 | 5.2 | 32 | 77% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 20 | 0.7 | 0.8 | 2 | 95% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 26 | 0.7 | 5.4 | 3 | 67% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 0 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 69 | 0.8 | 4.9 | 39 | 100% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 105 | 2.8 | 7.0 | 19 | 61% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 63 | 1.6 | 1.7 | 8 | 73% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 10% | 5% | 85% | 268 | 1.1 | 14.2 | 18 | 76% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

"Divisions lost" counts strength: 100 points of strength lost is one division, wherever it was lost.

Across all wars, 83% of attacks on a defended province succeeded.

## What the results say

- **Numbers win, but not quickly.** A country with a clearly bigger army beats a small neighbour in
  two to four weeks (the Netherlands, Belgium, Czechoslovakia). Evenly matched armies fight for
  months, and the result can go either way.
- **1936 is not 1939.** Germany starts with 30 divisions against France's 32, so France usually
  wins a one-on-one war. That matches the real balance in 1936; Germany's advantage came from
  rearming, which arrives with factories in Stage D.
- **Attacks that are launched mostly succeed** because the AI only attacks when it expects to
  outlast the defenders. With equal numbers an attack fails; it takes about 2 to 1 on open
  ground and far more into hills or mountains.
- **Mountain borders freeze.** Italy and Yugoslavia touch along a single mountain province that
  can supply only 7 divisions, so neither side can gather enough to break through, and the AI
  rightly does not try. France and Italy mostly end the same way in the Alps.

## Known weak spots, to revisit in later stages

- Finland falls faster and far more cheaply than in the real Winter War. The game has no
  winter and no difference in army quality yet (research and leaders come in Stage E).
- Losses are lower than in real wars of this length. A beaten division retreats with most of
  its men, and lost strength slowly returns for free until manpower exists (Stage D).
- The test AI has no memory and no plan beyond the next province. Stage F replaces it.
