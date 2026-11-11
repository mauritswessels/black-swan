/**
 * The codex: plain-English definitions of the terms used in the game.
 * `ap` marks terms that appear in AP Macroeconomics.
 * Stage 3 grows this to 80+ terms with "simpler" and "in depth" versions.
 */

export interface Term {
  id: string;
  term: string;
  definition: string;
  /** Why it matters in the game, or a real-world note. */
  why: string;
  ap?: boolean;
}

export const GLOSSARY: Term[] = [
  { id: 'policy-rate', term: 'Policy rate', definition: 'The short-term interest rate the central bank sets. Banks’ borrowing costs, and through them all other interest rates, follow it.', why: 'Your main tool. You move it in steps of 0.25 percentage points.' },
  { id: 'inflation', term: 'Inflation', definition: 'The rate at which the general level of prices rises, usually measured over 12 months.', why: 'Keeping it low and stable is the bank’s first job.', ap: true },
  { id: 'core-inflation', term: 'Core inflation', definition: 'Inflation without energy (and often food), whose prices jump around a lot.', why: 'Shows the underlying trend. If headline jumps but core doesn’t, the cause may be a one-off energy shock.' },
  { id: 'headline-inflation', term: 'Headline inflation', definition: 'Inflation of all consumer prices, including energy.', why: 'The number the public sees and the target is set on.' },
  { id: 'target', term: 'Inflation target', definition: 'The inflation rate the central bank promises to aim for. Kestria uses 0 to 2% (like Switzerland) or 2% (like the Fed and ECB), set in the settings.', why: 'Hitting it builds credibility; missing it costs credibility.' },
  { id: 'output-gap', term: 'Output gap', definition: 'How far the economy’s output is above (+) or below (−) its normal, sustainable level.', why: 'A positive gap pushes inflation up a couple of quarters later; a negative gap means lost jobs and income.', ap: true },
  { id: 'gdp', term: 'Real GDP growth', definition: 'How fast the total amount of goods and services produced grows, after removing inflation.', why: 'Kestria normally grows about 1.5% a year.', ap: true },
  { id: 'unemployment', term: 'Unemployment rate', definition: 'The share of people who want a job and are looking for one, but don’t have one.', why: 'It rises when the output gap falls (Okun’s law).', ap: true },
  { id: 'nairu', term: 'NAIRU', definition: 'The “non-accelerating inflation rate of unemployment”: the unemployment rate the economy settles at in the long run. Also called the natural rate.', why: 'About 3% in Kestria. Pushing unemployment below it for long raises inflation.', ap: true },
  { id: 'okun', term: 'Okun’s law', definition: 'A rule of thumb: when output falls below normal, unemployment rises. In Kestria a 1-point negative output gap adds about 0.4 points of unemployment.', why: 'Links the output gap to jobs.' },
  { id: 'phillips', term: 'Phillips curve', definition: 'The short-run trade-off between unemployment and inflation: a hot economy (low unemployment) pushes inflation up.', why: 'In the long run the trade-off disappears, because expectations adjust.', ap: true },
  { id: 'lrpc', term: 'Long-run Phillips curve', definition: 'In the long run, unemployment returns to the NAIRU whatever the inflation rate. The long-run Phillips curve is vertical.', why: 'You cannot buy permanently lower unemployment with permanently higher inflation.', ap: true },
  { id: 'nominal-rate', term: 'Nominal interest rate', definition: 'The interest rate as quoted, before taking inflation into account.', why: 'The policy rate is a nominal rate.', ap: true },
  { id: 'real-rate', term: 'Real interest rate', definition: 'The interest rate after inflation: r = i − expected inflation.', why: 'Spending decisions depend on the real rate. If inflation rises and you don’t move, the real rate falls and policy gets looser.', ap: true },
  { id: 'neutral-rate', term: 'Neutral real rate (r*)', definition: 'The real interest rate that neither speeds up nor slows down the economy.', why: 'About 0.5% in Kestria. Real rates above it slow the economy; below it, they speed it up.' },
  { id: 'taylor', term: 'Taylor rule', definition: 'A simple formula for the policy rate: i = r* + inflation + 0.5×(inflation − target) + 0.5×(output gap).', why: 'Your end-of-term report compares you with it. It can’t tell supply shocks from demand shocks, so judgment can beat it.' },
  { id: 'expectations', term: 'Inflation expectations', definition: 'What people and firms think inflation will be. They set wages and prices with it in mind.', why: 'If people expect high inflation, they create it. Credibility keeps expectations close to the target.' },
  { id: 'anchored', term: 'Anchored expectations', definition: 'Expectations that stay close to the target even when actual inflation moves around for a while.', why: 'Anchored expectations make shocks pass quickly. Unanchored expectations make inflation stubborn.' },
  { id: 'credibility', term: 'Credibility', definition: 'How much markets and the public believe the central bank will do what it says and hit its target.', why: 'High credibility makes your words powerful and inflation easier to control.' },
  { id: 'forward-guidance', term: 'Forward guidance', definition: 'What the central bank says about its future policy, to steer expectations and long-term interest rates today.', why: 'Strong promises move markets more, but breaking them costs credibility.' },
  { id: 'time-inconsistency', term: 'Time inconsistency', definition: 'A plan that looks best today may look tempting to abandon later. Knowing this, people don’t fully believe promises.', why: 'This is why central banks are made independent and why keeping your word matters.' },
  { id: 'independence', term: 'Central bank independence', definition: 'Freedom for the central bank to set policy without instructions from the government.', why: 'Politicians want low rates before elections. Giving in costs credibility.' },
  { id: 'supply-shock', term: 'Supply shock', definition: 'A sudden change in the cost of producing goods, such as an energy price spike. Prices and output move in opposite directions.', why: 'Rate rises can’t fix the cause. Central banks often “look through” them if expectations stay anchored.', ap: true },
  { id: 'demand-shock', term: 'Demand shock', definition: 'A sudden change in spending. Output and inflation move in the same direction.', why: 'This is what rate changes are best at fixing.', ap: true },
  { id: 'stagflation', term: 'Stagflation', definition: 'High inflation and weak growth at the same time, usually caused by a supply shock.', why: 'The hardest situation for a central bank: fighting one problem worsens the other.', ap: true },
  { id: 'deflation', term: 'Deflation', definition: 'Falling prices. It sounds nice, but it makes debts heavier and can make people delay spending.', why: 'A very strong thaler can push Kestria towards it.', ap: true },
  { id: 'lags', term: 'Policy lags', definition: 'The delay between a policy change and its effect. Rate changes take about 2 to 6 quarters to affect spending and 4 to 8 to affect inflation.', why: 'You have to act on where the economy is going, not where it is.' },
  { id: 'elb', term: 'Effective lower bound', definition: 'The lowest level the policy rate can usefully go, slightly below zero. Below it, people would rather hold cash.', why: 'Kestria’s lower bound is −0.75%. Once there, only other tools are left.' },
  { id: 'zlb', term: 'Zero lower bound and liquidity trap', definition: 'When rates are at or near zero and can’t be cut further, monetary policy loses its main tool. This is called a liquidity trap.', why: 'Why central banks invented QE and forward guidance.', ap: true },
  { id: 'exchange-rate', term: 'Exchange rate', definition: 'The price of one currency in another. Here, how many thalers buy one aurel. A lower number means a stronger thaler.', why: 'It reacts at once to your decisions and to global panics.', ap: true },
  { id: 'pass-through', term: 'Exchange rate pass-through', definition: 'How much a change in the exchange rate shows up in consumer prices, through the cost of imports.', why: 'A stronger thaler lowers Kestrian inflation within a quarter or two.' },
  { id: 'safe-haven', term: 'Safe haven', definition: 'An asset investors rush to in a crisis, like the Swiss franc in reality, or the thaler here.', why: 'Global panics push the thaler up, hurting exporters and pushing inflation down.' },
  { id: 'fx-intervention', term: 'FX intervention', definition: 'The central bank buying or selling foreign currency to move the exchange rate.', why: 'Buying aurels weakens the thaler, but leaves the bank holding risky foreign assets.' },
  { id: 'paper-loss', term: 'Paper loss', definition: 'A fall in the value of assets you still hold, measured in your own currency. It only becomes a real loss if you sell.', why: 'When the thaler strengthens, the KNB’s foreign reserves lose value in thalers, and politicians notice.' },
  { id: 'yield-curve', term: 'Yield curve', definition: 'A line showing interest rates on government bonds of different lengths, from short to long.', why: 'It shows what markets expect your future rates to be.' },
  { id: 'inverted-curve', term: 'Inverted yield curve', definition: 'When short-term yields are higher than long-term yields. Markets expect rates to fall, often because they expect a slowdown.', why: 'Historically a warning sign of recession.' },
  { id: 'term-premium', term: 'Term premium', definition: 'The extra yield investors demand for lending for a long time instead of rolling over short loans.', why: 'Rises with uncertainty. Quantitative easing aims to push it down.' },
  { id: 'revision', term: 'Data revision', definition: 'A correction to a published statistic as more complete information arrives. First estimates are often revised.', why: 'Your data marked “first estimate” may change next quarter.' },
  { id: 'macroprudential', term: 'Financial stability', definition: 'Keeping banks and credit markets safe from booms and crashes. Fast credit growth and soaring house prices are warning signs.', why: 'Kestria’s financial risk meter rises with credit growth. Above 15, a crisis hits.' },
  { id: 'ample-reserves', term: 'Ample reserves system', definition: 'Modern central banks supply plenty of reserves and steer rates by setting the interest paid on reserves, instead of by changing the quantity of reserves.', why: 'In this system the textbook money multiplier doesn’t steer the economy. Stage 3 shows both models.', ap: true },
  { id: 'fiscal-policy', term: 'Fiscal policy', definition: 'Government spending and taxes. Monetary policy is the central bank’s job; fiscal policy is the government’s.', why: 'A spending spree adds demand that you may have to offset.', ap: true },
];

const BY_ID = new Map(GLOSSARY.map((t) => [t.id, t]));
export const termById = (id: string) => BY_ID.get(id);
