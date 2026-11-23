# Balance check, Stage M2 (version 1.8.0): the war in China

Stage M2 wakes Japan, China, the Chinese Communists, Manchukuo and Mongolia in Story mode and
puts the Soviet Far East army on the map. The plan's check for it:

> Bot runs: Japan holds the coast by 1939 but China does not surrender; the Eastern Front in
> Europe stays close to 1.6.

## The war in China

`scripts/asia.ts` runs a Story game from 1936 with AI players only and prints East Asia once a
month (`npx vite-node scripts/asia.ts -- <seed> [end date] [out.json]`). Three seeds, run to
September 1945:

| seed | Peking | Shanghai | Nanjing | Wuhan | Canton | China's land lost, Jan 1939 / Jan 1941 / 1945 | China surrenders |
| --- | --- | --- | --- | --- | --- | --- | --- |
| asia-1 | Aug 1937 | Mar 1938 | Apr 1938 | Jun 1939 | Nov 1939 | 55% / 70% / 75% | never |
| asia-2 | Aug 1937 | Apr 1938 | Mar 1938 | Jul 1938 | Nov 1939 | 63% / 70% / 75% | never |
| asia-3 | Aug 1937 | Feb 1938 | Feb 1938 | Jul 1938 | Nov 1939 | 35% / 70% / 76% | never |

(The script looks once a month, so each date is the first of the month by which Japan held the
city. Land lost is the share of China's victory points held by Japan. In asia-3 China took
Shanghai and Nanjing back for most of 1939.) Real history: Peking July 1937, Shanghai November 1937, Nanjing December 1937, Wuhan and
Canton October 1938. So Japan is a few months late at Shanghai and Canton, about right at
Wuhan, and holds the coast in 2 of 3 runs by early 1939 and in all 3 by the end of 1939. China
never surrenders and the Communists never give up.

The armies, 1 January 1941: Japan about 133 divisions (about 108 in China, 5 in Manchukuo, the
rest at home), China 73 to 77, the Communists 13. The Soviet Far East army is 97 to 99
divisions in July 1941 and about 80 after the Siberian divisions come west.

China's prices (100 in 1936):

| seed | Jan 1940 | Jan 1942 | Jan 1945 |
| --- | --- | --- | --- |
| asia-1 | 232 | 811 | 4,244 |
| asia-2 | 240 | 796 | 3,529 |
| asia-3 | 176 | 680 | 9,264 |
| real (Chungking, roughly) | about 300 | about 2,000 | about 75,000 |

China's inflation is the worst in the game and gets worse every year, but it is still slower
than the real one after 1941. In this model inflation either stays under control or, past
about 300% a year, runs away (the first tries reached prices of 10^17 by 1945 as people spent
money ever faster). The settings chosen keep it steady and alike between seeds.

### What it took

- **Japan's army ran into the empty west and was cut off.** In the first runs the AI marched
  on Chungking, Yenan and Ningsia, China retook the north China plain behind it, and 35
  divisions surrendered in the hills in April 1938. An AI Japan now attacks only the provinces
  it really took, by date (`JAPAN_REACH` in operations.ts).
- **Japan's army stayed at home.** An AI country sends at most an eighth of its army overseas.
  Japan, an island empire, may now send 80% (`OVERSEAS_SHARE` in aiForces.ts).
- **The Communists surrendered in February 1938**, when Japan took Yenan. In Story mode they now
  fight on while Nationalist China does.
- **China's army melted away** once inflation passed the point where the AI stops raising
  divisions. A government that has lost its ports now keeps raising them up to 150% inflation a
  year (fewer up to 400%), and gets Soviet and then American arms.
- **China's government fell every few months** from 1940 on, swinging between an elected
  government and rule by decree. In Story mode an AI China's government no longer falls.
- **China's prices ran away** (10^17 by 1945) because its 75 divisions cost more than its whole
  economy produced: they were charged half the European upkeep. They now cost 30% of it.

## Europe against 1.6

The same 16-seed sweep as Stage L and M1 (`node scripts/sweep.mjs m2-1936 1936 8 4`, then
`m2-1939 1939 8 4`). In 1.7 every one of these wars ended exactly as in 1.6 (tables in
docs/balance-stage-m1.md).

### 1936 start, 1.8

| seed | Poland | France | Yugoslavia | Greece | Moscow | Italy armistice | Germany | Soviet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 3 Oct 1939 | 2 Aug 1940 | 20 May 1941 | 11 Sep 1941 | - | 21 Oct 1943 | 16 Jun 1944 | - |
| 2 | 30 Sep 1939 | 16 Aug 1940 | 27 May 1941 | 6 Nov 1941 | - | 28 Sep 1943 | 6 Sep 1944 | - |
| 3 | 7 Oct 1939 | 23 Aug 1940 | 1 Aug 1941 | 4 Aug 1941 | - | 28 Sep 1943 | 3 May 1944 | - |
| 4 | 15 Oct 1939 | 6 Aug 1940 | 20 May 1941 | 22 Oct 1941 | - | 16 Dec 1943 | 25 Feb 1944 | - |
| 5 | 4 Oct 1939 | 12 Aug 1940 | 29 May 1941 | 7 Aug 1941 | - | 16 Sep 1943 | 19 Sep 1944 | - |
| 6 | 2 Oct 1939 | 12 Jul 1940 | 17 Jun 1941 | 21 Aug 1941 | - | - | 12 Feb 1944 | - |
| 7 | 6 Oct 1939 | 11 Sep 1940 | 20 Jun 1941 | 25 Jun 1941 | - | 18 Sep 1943 | 19 Aug 1944 | - |
| 8 | 6 Oct 1939 | 31 Aug 1940 | 24 May 1941 | 13 Jun 1941 | - | 7 Nov 1943 | 23 Jul 1944 | - |

### September 1939 start, 1.8

| seed | Poland | France | Yugoslavia | Greece | Moscow | Italy armistice | Germany | Soviet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 28 Sep 1939 | 27 Aug 1940 | 3 Jun 1941 | 10 Jan 1942 | - | - | 7 May 1944 | - |
| 2 | 1 Oct 1939 | 26 Jul 1940 | 4 May 1941 | 2 Jul 1941 | - | 14 Sep 1943 | 15 Feb 1945 | - |
| 3 | 27 Sep 1939 | 25 Aug 1940 | 19 Jun 1941 | 24 Aug 1941 | - | 4 Oct 1943 | 3 Dec 1944 | - |
| 4 | 30 Sep 1939 | 25 Aug 1940 | 4 Jun 1941 | 25 Sep 1941 | - | 28 Sep 1943 | 14 Nov 1943 | - |
| 5 | 27 Sep 1939 | 10 Sep 1940 | 14 Jul 1941 | 31 Jul 1941 | - | 16 Sep 1943 | 18 Aug 1944 | - |
| 6 | 30 Sep 1939 | 27 Aug 1940 | 18 Jun 1941 | 29 Aug 1941 | - | - | 8 Jan 1945 | - |
| 7 | 26 Sep 1939 | 9 Aug 1940 | 17 Aug 1941 | 25 Aug 1941 | - | 23 Sep 1943 | 24 Nov 1944 | - |
| 8 | 30 Sep 1939 | 28 Jul 1940 | 29 May 1941 | 11 Aug 1941 | - | 16 Sep 1943 | 24 Sep 1944 | - |

So Europe is close to 1.6 but no longer the same, as expected now that the Soviet Union has a
second front and its Far East army is on the map:

- **The Eastern Front:** Moscow never falls and the Soviet Union never surrenders, in 1.6 or
  1.8, in any of the 16 runs.
- **Poland, France and Yugoslavia** fall within the same weeks as in 1.6 (Poland late
  September or early October 1939, France July to September 1940, Yugoslavia May to August
  1941). Greece falls in all 16 runs, once as late as January 1942.
- **Italy** signs its armistice in 13 of 16 runs, as in 1.6 (13 of 16).
- **Germany** surrenders in 16 of 16 runs (1.6: 15 of 16). From the 1936 start the median is
  about early July 1944 (1.6: late September 1944); from the 1939 start about October 1944
  (1.6: late July 1944). Taken together that is about the same as 1.6, and still several
  months before the real May 1945: the second balance pass in the plan.

Why it is not identical: the Soviet Union now keeps its Far East divisions on the map and
fights Japan at Lake Khasan and Khalkhin Gol with them, the Far East army is drawn from
different divisions than before, and the September 1939 start is built from a 1936 game that
now includes the war in China. Asian battles roll their own dice, so the luck of the war in
Europe is not shifted by them.

## Speed

On the cloud machine, 1.7 and 1.8 side by side (one 1936 game each, seed `history-2`, ms per day):

| year | 1936 | 1937 | 1938 | 1939 | 1940 | 1941 | 1942 | 1943 | 1944 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.7 | 4.5 | 3.9 | 4.7 | 10.2 | 16.9 | 22.7 | 26.7 | 24.4 | 14.4 |
| 1.8 | 5.3 | 10.9 | 14.5 | 15.4 | 20.2 | 30.4 | 33.8 | 34.9 | 25.6 |

The war in China adds about 200 divisions to command every day, so the war years are about a
third slower: the busiest year, 1943, takes 35 ms a day, still well inside the 60 ms a day the
fastest game speed allows. The speed test (the summer of 1941) still passes.

## Known gaps

- China's inflation is too slow after 1941 (prices x35 to x90 by 1945, against about x750).
- Japan reaches Shanghai and Canton a few months late, and in one run of three loses Shanghai
  and Nanjing again for most of 1939.
- Japan's army is too big (about 133 divisions in 1941, about 85 at the real 25,000 men each),
  because nothing yet calls it to the Pacific. Only about 5 of its divisions stand in Manchukuo,
  where the real Kwantung Army had 12 or more.
- Germany still falls several months early, as in 1.6 and 1.7.
