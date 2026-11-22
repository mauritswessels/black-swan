# How long Poland lasts, Stage L (version 1.6.0)

The September 1939 start, everyone but Poland led by the AI. Made by `npx vite-node scripts/poland.ts docs/balance-stage-l-poland.md "Stage L (version 1.6.0)"`.
Real history: Germany attacked on 1 September 1939 and the Soviet Union on 17 September. Warsaw
gave in on 28 September; the last Polish troops stopped fighting on 6 October (day 36).

| Poland led by | Seed | Warsaw falls | Poland surrenders | Polish divisions just before | Provinces still Polish just before |
| --- | --- | --- | --- | --- | --- |
| AI | 1939-1 | the day it surrendered | 28 September 1939 (day 28) | 41 of 41 | 8 of 15 |
| AI | 1939-2 | the day it surrendered | 30 September 1939 (day 30) | 41 of 41 | 8 of 15 |
| AI | 1939-3 | the day it surrendered | 30 September 1939 (day 30) | 41 of 41 | 8 of 15 |
| AI | poland-4 | the day it surrendered | 29 September 1939 (day 29) | 41 of 41 | 8 of 15 |
| AI | poland-5 | the day it surrendered | 28 September 1939 (day 28) | 40 of 41 | 7 of 15 |
| AI | poland-6 | the day it surrendered | 29 September 1939 (day 29) | 40 of 41 | 8 of 15 |
| Player, no orders | 1939-1 | the day it surrendered | 28 September 1939 (day 28) | 41 of 41 | 9 of 15 |
| Player, no orders | 1939-2 | the day it surrendered | 27 September 1939 (day 27) | 41 of 41 | 9 of 15 |
| Player, no orders | 1939-3 | the day it surrendered | 27 September 1939 (day 27) | 41 of 41 | 9 of 15 |
| Player, no orders | poland-4 | the day it surrendered | 27 September 1939 (day 27) | 41 of 41 | 9 of 15 |
| Player, no orders | poland-5 | the day it surrendered | 1 October 1939 (day 31) | 41 of 41 | 8 of 15 |
| Player, no orders | poland-6 | 2 October 1939 | 3 October 1939 (day 33) | 41 of 41 | 8 of 15 |
| Player, holds Warsaw and Kraków | 1939-1 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | 1939-2 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | 1939-3 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | poland-4 | the day it surrendered | 3 October 1939 (day 33) | 41 of 41 | 6 of 15 |
| Player, holds Warsaw and Kraków | poland-5 | the day it surrendered | 4 October 1939 (day 34) | 41 of 41 | 5 of 15 |
| Player, holds Warsaw and Kraków | poland-6 | the day it surrendered | 4 October 1939 (day 34) | 41 of 41 | 5 of 15 |

## What the results say

Stage L asked whether the AI's Poland still plays worse than a player who gives no orders at
all, as it did in 1.4.1 (AI 26 to 27 September, idle player 1 October).

- **Not any more.** Led by the AI, Poland surrenders on 28 to 30 September (average day 29);
  a player who gives no orders on 27 September to 3 October (average day 28.8); a player who
  holds Warsaw and Kraków on 3 or 4 October. Version 1.5 (docs/balance-stage-k4-poland.md) had
  already closed most of the gap; Stage L changes nothing here on purpose, and the numbers
  stay within a day of 1.5.
- The new home reserve (ai.ts, HOME_SHARE: a tenth of a big army kept inside the homeland
  while a great power is an enemy) hardly touches Poland: every Polish province is home, and
  the reserve is dropped once the enemy stands on the homeland along the main front, which
  for Poland is within days.
- Real history: Warsaw fell on 28 September and the last troops on 6 October, so all three
  are close to the real dates, a little early.
