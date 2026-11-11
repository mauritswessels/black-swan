# The economic model of Kestria

This file explains every equation and parameter in the game in plain words. The code is in
`src/sim/model.ts` and every number is in `src/sim/params.ts`, with the same names.

The model is a simplified **small open economy New Keynesian model**: a few equations that
describe how spending, prices, jobs, the currency and expectations react to each other and to
the central bank. Real central banks use bigger versions of the same idea.

## Symbols

All numbers are in percent; interest rates and growth are per year. One step is one quarter
(3 months). `[t-1]` means "last quarter", `[t-2]` "two quarters ago", and so on.

| Symbol | Meaning |
| --- | --- |
| i | Policy rate set by the Kestrian National Bank (KNB) |
| pi | Headline inflation (all prices) |
| core | Core inflation (without energy) |
| pi_e | Expected inflation |
| pi_star | The target people *believe* the bank is aiming for (the perceived target) |
| r | Real interest rate |
| y | Output gap: how far output is above (+) or below (-) its normal level |
| u | Unemployment rate |
| s | Thaler strength: percent above its long-run value |
| C | Credibility, 0 to 100 |
| A | Public approval, 0 to 100 |

## 1. Real interest rate

```text
r = i - pi_e
r_star = 0.5        (neutral real rate)
```

People and firms care about the interest rate after inflation. If i = 1.25 and people expect
2.5% inflation, the real rate is -1.25, which encourages borrowing and spending. The neutral
real rate r_star is the real rate that neither speeds up nor slows down the economy.

## 2. Demand: the IS curve

```text
y[t] = 0.75*y[t-1]                      momentum in spending
     - 0.20*(r_eff - r_star)            interest rates
     - 0.05*s[t-1]                      a strong thaler hurts exports
     + 0.25*y_CU[t]                     the Continental Union's economy
     + 0.30*fiscal[t]                   extra government spending
     + 0.045*(credit growth - 4)        a credit boom adds spending
     - 0.03*(energy price change)/10    expensive energy squeezes households
     + demand_shock[t] + noise

r_eff = 0.6 * (average real rate 2 to 6 quarters ago)
      + 0.4 * (real 5-year bond yield, minus its normal term premium)
```

The weights on the past real rates are 0.15, 0.25, 0.25, 0.20 and 0.15 for 2, 3, 4, 5 and 6
quarters ago. That is the **lag**: a rate change today mostly hits spending 2 to 6 quarters later.
The 5-year bond yield part reacts at once, which is why forward guidance (and later QE) can
work faster than the rate itself.

## 3. Inflation: the Phillips curve

```text
core[t] = 0.6*core[t-1] + 0.4*pi_e[t]
        + 0.25*y[t-2]                       a hot economy pushes up prices, 2 quarters later
        - 0.06*(change in s over the past year)   a stronger thaler makes imports cheaper
        + supply_shock[t] + wage_push[t] + noise

pi[t] = core[t] + 0.08*(energy price change over the year) + noise
```

Because demand reacts 2 to 6 quarters after a rate change, and prices react to demand 2 quarters
after that, **inflation responds most strongly 4 to 8 quarters later**. The exchange rate is a
faster channel: a rate hike strengthens the thaler at once, and that starts lowering import prices
within a quarter or two.

The weights on past inflation (0.6) and expected inflation (0.4) add up to 1. Together with the
perceived target in equation 4, this means there is **a trade-off in the short run but none in the
long run**: you cannot buy permanently lower unemployment with permanently higher inflation.

## 4. Expectations, anchoring and the perceived target

```text
a = 0.2 + 0.7*(C/100)^2                    how firmly expectations are anchored
recent = average of pi over the last 4 quarters
pi_star[t] = pi_star[t-1] + 0.06*(1.5 - C/100)*(recent - pi_star[t-1])
pi_e[t+1] = a*pi_star[t] + (1 - a)*recent
```

With high credibility (C near 100), `a` is about 0.9: people mostly expect inflation to be what
they believe the bank is aiming for. With low credibility, `a` is near 0.2 and people just
extrapolate past inflation. Expectations are then **unanchored**, and inflation is much harder
to bring down.

If inflation stays away from the target for years, people slowly stop believing the target
(`pi_star` drifts towards actual inflation). The drift is slow when credibility is high and fast
when it is low.

## 5. Unemployment: Okun's law

```text
u[t] = 0.5*u[t-1] + 0.5*(u_star - 0.4*y[t])
u_star = 3.0     (NAIRU: the unemployment rate the economy settles at in the long run)
```

A 1-point positive output gap lowers unemployment by about 0.4 points, with a short delay,
because firms are slow to hire and fire.

GDP growth (year on year) is normal growth plus the change in the output gap over the year:

```text
GDP growth = 1.5 + productivity boost + (y[t] - y[t-4])
```

## 6. Exchange rate

```text
s[t] = 0.85*s[t-1]
     + 1.5*(change in (i - i_CU))         our rates rising relative to the Continental Union's
     + 1.0*(i - rate markets expected)    a surprise moves the currency
     + safe_haven_flow[t]                 global panic: money floods into the thaler
     - 0.8*FX_purchases[t]                buying foreign currency weakens the thaler
     - 1.0*(C/100) if you said "prepared to intervene"
     + noise

KST per aurel = 0.95 / (1 + s/100)
```

The currency reacts in the same quarter. Markets expect the bank to move partway towards what
the Taylor rule suggests (at most 0.5 points a quarter), or to do what it promised, weighted by
credibility. Anything else is a surprise.

## 7. Bond yields and the yield curve

```text
yield for n years = average expected policy rate over n years
                  + 0.15*sqrt(n)                         normal term premium
                  + 0.05*|pi - target|                   extra premium when inflation is off target
```

Markets expect the policy rate to drift back towards neutral (r_star + pi_e) by 15% a quarter.
Forward guidance bends that path, weighted by credibility:

- "Rates stay here for an extended period": markets expect no change for 4 quarters.
- "We stand ready to act against inflation": markets expect hikes of up to 0.5 points.

This gives a real yield curve (2, 5 and 10 years) that can steepen, flatten or invert.

## 8. The lower bound

```text
i >= -0.75
```

Rates can go a little below zero, but not much: below about -0.75, people would rather hold cash.
At the lower bound, only guidance, FX intervention and (later) QE are left.

## 9. Housing and financial stability

```text
mortgage rate = 5-year yield + 1.0
house[t]  = 0.7*house[t-1] + 0.3*(4 + 1.5*y[t-1] - 2.0*(real mortgage rate - its normal level))
          + housing_shock + noise
credit[t] = 0.7*credit[t-1] + 0.3*(2 + 0.5*house[t])
risk[t]   = 0.9*risk[t-1] + (credit growth above 4%, if any)
```

House prices grow about 4% a year in normal times. Cheap money and a hot economy push them up,
which speeds up credit growth. Fast credit growth builds up **financial risk**, which raises the
odds that a bank gets into trouble. Risk above 15 means a financial crisis (game over).

## 10. Bank balance sheet

```text
FX reserves[t] = FX reserves[t-1] + FX purchases     (starts at 80% of GDP)
paper gain     = -FX reserves * (change in s) / 100
```

Like the real Swiss National Bank, the KNB holds huge foreign-currency reserves. When the thaler
gets stronger, those reserves are worth less in thalers: a **paper loss**. Big losses hurt public
approval.

## 11. Credibility

Each quarter (using the published inflation figure, since that is what people see):

- drifts 5% of the way towards 60
- +1.5 if inflation is inside the target band
- -2.5 for every point inflation is outside the band
- -8 for breaking "rates stay here for an extended period" within 4 quarters
- -4 for cutting rates right after saying "we stand ready to act against inflation"

Credibility below 15 means the government fires you (game over).

## 12. Approval

```text
A_target = 65 - 8*(u - 3) - 5*(inflation above the band) - 3*(inflation below the band)
              - 2*(mortgage rate above 3.5) + 1.5*(paper loss, if any)
A[t] = A[t-1] + 0.3*(A_target - A[t-1])
```

Approval below 25 for two quarters in a row means parliament removes the bank's independence
(game over).

## 13. Data you see versus the truth

```text
first estimate = true value + error
errors: GDP growth 0.3, inflation 0.1, core 0.08, unemployment 0.05, output gap 0.4 (typical size)
```

A quarter later the error shrinks to 30% of its size (the first revision); two quarters later the
figure is final. Figures are published rounded to one decimal. You always decide on imperfect
data, as real central bankers do.

## 14. Shocks: supply versus demand

Each event pushes on one or more of the equations above (see `src/sim/events.ts`):

- A **demand shock** (confidence boom, recession next door, government spending) enters the
  IS curve. Output and inflation move **in the same direction**. Rate changes are the right tool.
- A **supply shock** (energy prices, wage deals, pandemic bottlenecks, productivity) enters the
  Phillips curve. Output and inflation move **in opposite directions**. Rate changes cannot fix
  the cause, so central banks often "look through" them, as long as expectations stay anchored.

- A **political event** (the finance minister demands a cut) has no direct economic effect.
  If you cut in the next meeting, approval rises by 3 but credibility falls by 5, because markets
  see a bank that bends to politicians. If you hold firm, approval falls by 4.

Events are paced: none in the 3 quarters after an event starts, so the game has calm spells.

## 15. The Taylor rule and the score

```text
Taylor rule:  i = r_star + pi + 0.5*(pi - target) + 0.5*y

Quarter loss: L = (inflation miss)^2 + 0.5*y^2 + 0.25*(change in i)^2 + 0.5*(financial risk penalty)^2
Quarter points = 100 * e^(-L/3)
```

- With the 0 to 2% range, the inflation miss is the distance outside the band plus a quarter
  of the distance from 1%. With the 2% point target, it is simply pi - 2.
- The financial risk penalty is (risk - 3)/2 when risk is above 3.
- Squaring means big misses cost far more than small ones.

The term score is the average points over the term; quarters lost to a game over score 0.

## 16. Reserves: the textbook and reality

Kestria runs an **ample reserves** system, like the Fed, ECB and SNB today. The KNB sets the
interest it pays on banks' reserves, and market rates follow it. In this system, changing the
reserve requirement barely moves interest rates. The AP Macro textbook model (limited reserves,
money multiplier = 1 / reserve ratio) will be shown side by side as a lesson in a later stage.

## The two settings for the target

| Setting | Band counted as "on target" | Expectations anchor to |
| --- | --- | --- |
| 0 to 2% range (default, Swiss style) | 0 to 2% | 1% |
| 2% point | 1 to 3% | 2% |

## Where this model simplifies reality

- A real economy has millions of people and firms; this model has a dozen aggregate equations.
- Real lags vary from one episode to the next. Here their shape is fixed, with noise added.
- Real exchange rates are close to unpredictable. This one is more logical than reality, so you
  can learn from it.
- Politics is reduced to an approval number and a few events.
- Parameter values are chosen to give realistic-looking behaviour, not estimated from data.
