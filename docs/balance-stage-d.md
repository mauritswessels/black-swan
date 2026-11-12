# Balance report, Stage D: 200 AI against AI wars and 24 finance playtests

Made by `npm run balance`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones and
pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Germany v Poland | 30 v 28 | 100% | 0% | 0% | 94 | 0.0 | 6.9 | 24 | 79% | In September 1939 Germany, by then far stronger than in 1936, won in 5 weeks. |
| Germany v France | 30 v 32 | 60% | 40% | 0% | 237 | 4.2 | 9.7 | 54 | 78% | In 1936 France was the stronger army; Germany won in 6 weeks in 1940 after 4 years of rearming. |
| Germany v Czechoslovakia | 30 v 17 | 100% | 0% | 0% | 20 | 0.7 | 0.7 | 2 | 95% | Never fought: Czechoslovakia was given up at Munich in 1938. Its border was mountainous and fortified. |
| Germany v Belgium | 30 v 7 | 100% | 0% | 0% | 26 | 0.6 | 5.6 | 3 | 67% | Belgium fell in 18 days in May 1940. |
| Italy v Yugoslavia | 28 v 16 | 0% | 0% | 100% | n/a | 0.0 | 0.0 | 0 | 0% | Yugoslavia fell in 11 days in April 1941, but to Germany and its allies together. |
| Germany v Netherlands | 30 v 4 | 100% | 0% | 0% | 13 | 0.1 | 0.2 | 1 | 100% | The Netherlands fell in 5 days in May 1940. |
| Soviet Union v Finland | 74 v 6 | 100% | 0% | 0% | 74 | 0.0 | 5.5 | 47 | 100% | Winter War, 1939 to 1940: Finland held for 105 days against a far larger army, then gave up land. |
| Soviet Union v Poland | 74 v 28 | 100% | 0% | 0% | 111 | 0.0 | 6.8 | 25 | 64% | In 1920 Poland stopped the Red Army at Warsaw. In 1939 the Soviets met little resistance. |
| Soviet Union v Romania | 74 v 18 | 100% | 0% | 0% | 62 | 0.0 | 2.0 | 8 | 74% | Never fought alone: Romania gave up Bessarabia to a Soviet ultimatum in 1940. |
| France v Italy | 32 v 28 | 5% | 0% | 95% | 224 | 0.0 | 7.3 | 52 | 90% | In June 1940 Italy attacked across the Alps and barely advanced. Mountains favour the defender. |

"Divisions lost" compares strength on the field at the start and the end, so divisions raised
during the war count against losses and the figure can be zero for a side that grew.

## Paying for a war

Each major power is put at war for four years with a country it cannot reach, so nothing is
lost in battle and the only difference between runs is how the war is paid for. Conscription is
"extensive". The AI raises divisions and builds arms factories until the shortfall reaches 20%
of output; the money policy is fixed:

- **Tax**: taxes at 45%, bonds for the rest.
- **Borrow**: taxes left at 25%, bonds for the rest.
- **Print**: taxes left at 25%, everything else printed.
- **Mixed**: taxes at 35%, bonds for the rest, rationing.

| Country | Policy | Divisions | Military factories | Highest inflation | Prices after 4 years | Debt, % of a year's output | Lowest stability | Factory speed at the end | Share of shortfall printed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | Tax | 11 to 139 | 22 | 2% | x 1.1 | 36% | 51 | 88% | 0% |
| United Kingdom | Borrow | 11 to 74 | 14 | 2% | x 1.1 | 95% | 71 | 95% | 0% |
| United Kingdom | Print | 11 to 79 | 14 | 58% | x 2.8 | 18% | 53 | 86% | 100% |
| United Kingdom | Mixed | 11 to 104 | 18 | 2% | x 1.1 | 73% | 58 | 93% | 0% |
| France | Tax | 32 to 105 | 16 | 2% | x 1.1 | 80% | 51 | 88% | 0% |
| France | Borrow | 32 to 58 | 9 | 3% | x 1.1 | 121% | 73 | 95% | 1% |
| France | Print | 32 to 58 | 9 | 62% | x 4.7 | 12% | 51 | 86% | 100% |
| France | Mixed | 32 to 74 | 12 | 2% | x 1.1 | 106% | 58 | 93% | 0% |
| Germany | Tax | 30 to 165 | 23 | 2% | x 1.1 | 59% | 51 | 88% | 0% |
| Germany | Borrow | 30 to 94 | 16 | 3% | x 1.1 | 112% | 73 | 95% | 0% |
| Germany | Print | 30 to 95 | 16 | 61% | x 3.8 | 14% | 51 | 86% | 100% |
| Germany | Mixed | 30 to 120 | 19 | 2% | x 1.1 | 91% | 58 | 93% | 0% |
| Italy | Tax | 28 to 60 | 9 | 2% | x 1.1 | 105% | 51 | 88% | 0% |
| Italy | Borrow | 28 to 38 | 6 | 7% | x 1.1 | 130% | 68 | 95% | 3% |
| Italy | Print | 28 to 39 | 6 | 78% | x 6.7 | 9% | 46 | 83% | 100% |
| Italy | Mixed | 28 to 46 | 8 | 4% | x 1.1 | 123% | 58 | 93% | 1% |
| Soviet Union | Tax | 74 to 201 | 25 | 2% | x 1.1 | 81% | 51 | 88% | 0% |
| Soviet Union | Borrow | 74 to 126 | 18 | 4% | x 1.1 | 122% | 73 | 95% | 1% |
| Soviet Union | Print | 74 to 130 | 18 | 69% | x 5.0 | 11% | 48 | 84% | 100% |
| Soviet Union | Mixed | 74 to 158 | 21 | 2% | x 1.1 | 108% | 58 | 93% | 0% |
| Poland | Tax | 28 to 43 | 5 | 8% | x 1.1 | 115% | 51 | 88% | 5% |
| Poland | Borrow | 28 to 28 | 3 | 32% | x 1.3 | 125% | 67 | 86% | 16% |
| Poland | Print | 28 to 28 | 3 | 110% | x 10.4 | 7% | 42 | 67% | 100% |
| Poland | Mixed | 28 to 32 | 3 | 4% | x 1.1 | 131% | 58 | 93% | 2% |

## What the results say

### Wars

- **Results are close to Stage B, with longer wars.** Both sides now refill their divisions and
  raise new ones, so a beaten army recovers if it is given time. Germany against Poland takes
  about three months instead of a few weeks.
- **Industry decides the long wars.** Germany and France start with almost equal armies, but
  Germany has 12 military factories to France's 7, so in a war that lasts most of a year
  Germany now wins more often than not. In Stage B France usually won.
- **Mountain borders still freeze.** Italy and Yugoslavia, and France and Italy, mostly end in
  stalemate.

### Paying for a war

- **Taxing buys the biggest army and the least debt, and costs the most at home.** At 45% tax,
  stability sits just above 50, the line where strikes begin, and factories run about 12%
  slower. Any more bad news and the strikes start.
- **Borrowing is the quiet option, for a while.** Prices and stability barely move, but the
  army is little more than half the size and debt reaches 95% to 130% of a year's output in
  four years, with
  interest taking a growing share of the budget.
- **Printing wrecks prices.** Inflation peaks between 58% and 110% a year and prices end 3 to 10
  times higher. It also wipes out the debt (the inflation tax), buys no more divisions than
  borrowing, and leaves stability near or below 50.
- **A mix with rationing avoids the worst of each**, which is roughly what Britain did.
- **Poor countries with big armies have no good option.** Poland cannot cover its shortfall at
  25% tax even by borrowing: lenders will not take it all, the rest is printed, and inflation
  passes 30%.

## Known weak spots, to revisit in later stages

- Left at peace until 1940, armies grow to about 120 divisions for Germany, 70 for France, 50
  for Britain and 285 for the Soviet Union. Germany and France are near the historical figures;
  Britain and the Soviet Union are too high. The cap is the conscription law, and the AI has no
  reason yet to stop arming (diplomacy and threat arrive in Stage F).
- High taxes may still be too cheap, because war support does not exist yet (Stage E). A
  democracy should not be able to tax at 45% in peacetime without a reason.
- Imports cannot be cut off until there is a navy (Stage G), so steel and oil only cost money.
- Finland still falls too easily (no winter, no difference in army quality yet).
- The army AI has no memory and no plan beyond the next province. Stage F replaces it.
