# How long Poland lasts, version 1.4.1

The September 1939 start, everyone but Poland led by the AI. Made by `npx vite-node scripts/poland.ts`.
Real history: Germany attacked on 1 September 1939 and the Soviet Union on 17 September. Warsaw
gave in on 28 September; the last Polish troops stopped fighting on 6 October (day 36).

| Poland led by | Seed | Warsaw falls | Poland surrenders | Polish divisions just before | Provinces still Polish just before |
| --- | --- | --- | --- | --- | --- |
| AI | 1939-1 | 25 September 1939 | 26 September 1939 (day 26) | 41 of 41 | 7 of 10 |
| AI | 1939-2 | 23 September 1939 | 27 September 1939 (day 27) | 41 of 41 | 6 of 10 |
| AI | 1939-3 | 25 September 1939 | 27 September 1939 (day 27) | 41 of 41 | 6 of 10 |
| AI | poland-4 | 24 September 1939 | 26 September 1939 (day 26) | 41 of 41 | 7 of 10 |
| AI | poland-5 | 25 September 1939 | 27 September 1939 (day 27) | 41 of 41 | 6 of 10 |
| AI | poland-6 | 25 September 1939 | 26 September 1939 (day 26) | 41 of 41 | 7 of 10 |
| Player, no orders | 1939-1 | 26 September 1939 | 1 October 1939 (day 31) | 41 of 41 | 6 of 10 |
| Player, no orders | 1939-2 | 27 September 1939 | 1 October 1939 (day 31) | 41 of 41 | 6 of 10 |
| Player, no orders | 1939-3 | 26 September 1939 | 1 October 1939 (day 31) | 41 of 41 | 6 of 10 |
| Player, no orders | poland-4 | 27 September 1939 | 1 October 1939 (day 31) | 41 of 41 | 6 of 10 |
| Player, no orders | poland-5 | 26 September 1939 | 1 October 1939 (day 31) | 41 of 41 | 6 of 10 |
| Player, no orders | poland-6 | 26 September 1939 | 1 October 1939 (day 31) | 41 of 41 | 6 of 10 |
| Player, holds Warsaw and Kraków | 1939-1 | held to the end | 8 October 1939 (day 38) | 35 of 41 | 2 of 10 |
| Player, holds Warsaw and Kraków | 1939-2 | held to the end | 9 October 1939 (day 39) | 35 of 41 | 2 of 10 |
| Player, holds Warsaw and Kraków | 1939-3 | held to the end | 8 October 1939 (day 38) | 35 of 41 | 2 of 10 |
| Player, holds Warsaw and Kraków | poland-4 | held to the end | 8 October 1939 (day 38) | 35 of 41 | 2 of 10 |
| Player, holds Warsaw and Kraków | poland-5 | held to the end | 9 October 1939 (day 39) | 35 of 41 | 2 of 10 |
| Player, holds Warsaw and Kraków | poland-6 | held to the end | 8 October 1939 (day 38) | 35 of 41 | 2 of 10 |

## What the results say

**Before 1.4.1** (the same script on version 1.4.0): the AI's Poland surrendered on 20 or
21 September in all six runs, a player giving no orders on 20 or 21 September, and the
"hold Warsaw and Kraków" player on 26 September. Every time Poland gave up on the day Warsaw
fell, with all 41 divisions still in the field. Warsaw is 20 of Poland's 40 victory points, so
losing it alone passed the old 40% rule. Its province also borders East Prussia, Silesia,
Poznań and Upper Silesia, so the Germans attacked it from four directions with up to 20
divisions at a time against 8 defenders.

**After:** the AI's Warsaw falls on 23 to 25 September (really 28 September) and Poland gives
up a day or two later, when the Soviet Union walks into the empty eastern provinces. A player
who sits tight lasts to 1 October; one who holds Warsaw and Kraków holds Warsaw to the end and
lasts to 8 or 9 October, a little longer than the real Poland (6 October).

The AI's Poland does worse than a player who gives no orders at all: it moves divisions out
of Kraków and the east while the Germans close on Warsaw. That is the army AI, left for a later
version.

**The rest of the war** (the September 1939 start, AI only, 8 seeds to 1 January 1942, old
version against new; real dates in brackets):

| | 1.4.0 | 1.4.1 |
| --- | --- | --- |
| Poland surrenders (6 Oct 1939) | 20 September in 8 of 8 | 26 or 27 September in 8 of 8 |
| Germany attacks in the west (10 May 1940) | 6 of 8 | 8 of 8 |
| France falls (22 June 1940) | 18 Mar, 6 Apr, 26 May, 24 Jun, 30 Jun, 9 Jul, 11 Jul, 15 Jul | 15 May, 4 Jun, 19 Jun, 22 Jun, 24 Jun, 25 Jun, 5 Jul, 17 Jul |
| Greece falls by 1942 (23 April 1941) | 1 of 8 | 2 of 8 |
| Moscow falls in 1941 (never) | 5 of 8 | 5 of 8 |
| Germany surrenders by 1942 (never) | 0 of 8 | 1 of 8 |

France now falls closer to the real date and never before the attack in the west. Moscow is
unchanged (still too often). The one German surrender (seed 1939-3) is an old weakness that
the new timing happened to expose: in June 1941 a British landing at Hamburg walked into an
empty Berlin, because the army AI keeps no garrison in its own capital. A simple fix (send
divisions to a threatened capital) was tried and taken out again: it piled 25 divisions into
Warsaw and Moscow, starved the fronts, and in one run the Soviet Union surrendered. It needs a
proper fix in the army AI.

The full report (`npm run balance`) was also run. Its runs are chaotic (a small change early on
moves everything after), so its six runs of history are no better a guide than the table above
and docs/balance-stage-k3.md is left as it was.
