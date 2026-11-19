# How long Poland lasts, Stage K4 (version 1.5.0)

The September 1939 start, everyone but Poland led by the AI. Made by `npx vite-node scripts/poland.ts docs/balance-stage-k4-poland.md "Stage K4 (version 1.5.0)"`.
Real history: Germany attacked on 1 September 1939 and the Soviet Union on 17 September. Warsaw
gave in on 28 September; the last Polish troops stopped fighting on 6 October (day 36).

| Poland led by | Seed | Warsaw falls | Poland surrenders | Polish divisions just before | Provinces still Polish just before |
| --- | --- | --- | --- | --- | --- |
| AI | 1939-1 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 6 of 15 |
| AI | 1939-2 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 7 of 15 |
| AI | 1939-3 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 4 of 15 |
| AI | poland-4 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 7 of 15 |
| AI | poland-5 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 6 of 15 |
| AI | poland-6 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 6 of 15 |
| Player, no orders | 1939-1 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 8 of 15 |
| Player, no orders | 1939-2 | 29 September 1939 | 2 October 1939 (day 32) | 41 of 41 | 8 of 15 |
| Player, no orders | 1939-3 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 8 of 15 |
| Player, no orders | poland-4 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 8 of 15 |
| Player, no orders | poland-5 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 8 of 15 |
| Player, no orders | poland-6 | the day it surrendered | 28 September 1939 (day 28) | 41 of 41 | 9 of 15 |
| Player, holds Warsaw and Kraków | 1939-1 | the day it surrendered | 2 October 1939 (day 32) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | 1939-2 | the day it surrendered | 2 October 1939 (day 32) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | 1939-3 | the day it surrendered | 1 October 1939 (day 31) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | poland-4 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | poland-5 | the day it surrendered | 2 October 1939 (day 32) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | poland-6 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 6 of 15 |

## What the results say

On the finer map Poland has 15 provinces instead of 10, and its cities keep their victory
points (Warsaw 20, Kraków 7, Lwów 5, the rest 1 or 0), so it still gives up when Warsaw
falls and most of its cities are lost.

- Led by the AI, Poland now surrenders on 29 September to 3 October (1.4.1: 26 to 27
  September). Real history: Warsaw on 28 September, the last troops on 6 October.
- A player who gives no orders lasts to 28 September to 2 October (1.4.1: 1 October).
- A player who holds Warsaw and Kraków in strength lasts to 1 to 3 October (1.4.1: 8 or
  9 October). The difference with the idle player is smaller than before: the finer map gives
  Germany more ways round Kraków. A good Polish player can still do better by holding the river
  lines (the Vistula, the Narew, the Bzura) instead of the two cities.
- "The day it surrendered" means Warsaw fell on the same day Poland gave up, which is what
  tipped it over the line.
- Every run stays inside the window the tests ask for (25 to 42 days).
