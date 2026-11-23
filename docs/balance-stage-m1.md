# Balance check, Stage M1 (version 1.7.0): the world map

The world map adds 327 provinces, 40 countries and 39 sea zones. In Story mode the new countries
sit out the war, so the goal for M1 was simple: **the war in Europe should play exactly as it
did in 1.6.** This report checks that.

## Method

The same 16-seed sweep as Stage L: 8 whole wars from the 1936 start and 8 from the September
1939 start, run to the end of the game with AI players only, on 1.6.0 (`main` at b213cab) and on
1.7.0, with the same seeds.

    node scripts/sweep.mjs m1d-1936 1936 8 4
    node scripts/sweep.mjs m1d-1939 1939 8 4

## Result: all 16 wars end exactly as in 1.6

Every date in every run is the same in 1.7 as in 1.6: the fall of Poland, France, Yugoslavia and
Greece, Moscow, the Italian armistice and the German surrender. A day-by-day check of one 1936
game (seed `history-2`, the one the bot-playtest tests use) found the positions of every
division, every province's holder and every country's treasury and prices identical on every
day from 1 January 1936 to January 1942; seed `sweep-1936-5` was checked the same way to
January 1945.

### 1936 start (1.6 and 1.7 identical)

| seed | Poland | France | Yugoslavia | Greece | Moscow | Italy armistice | Germany | Soviet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 3 Oct 1939 | 17 Aug 1940 | 30 May 1941 | 4 Aug 1941 | - | 28 Sep 1943 | 18 Apr 1945 | - |
| 2 | 30 Sep 1939 | 5 Aug 1940 | 8 Jun 1941 | 20 May 1941 | - | - | - | - |
| 3 | 7 Oct 1939 | 18 Sep 1940 | 16 Jun 1941 | 31 Aug 1941 | - | 17 Jun 1944 | 18 Jun 1944 | - |
| 4 | 15 Oct 1939 | 17 Jul 1940 | 15 Jun 1941 | 7 Sep 1941 | - | 4 Oct 1943 | 24 May 1944 | - |
| 5 | 4 Oct 1939 | 11 Jul 1940 | 30 May 1941 | 20 Aug 1941 | - | 16 Sep 1943 | 18 Sep 1944 | - |
| 6 | 2 Oct 1939 | 6 Aug 1940 | 7 Jul 1941 | 13 Sep 1941 | - | 30 Sep 1943 | 12 Nov 1943 | - |
| 7 | 6 Oct 1939 | 6 Aug 1940 | 31 May 1941 | 21 Jul 1941 | - | 28 Sep 1943 | 12 Dec 1944 | - |
| 8 | 6 Oct 1939 | 24 Aug 1940 | 29 May 1941 | 12 Jul 1941 | - | 5 Oct 1943 | 1 Oct 1944 | - |

### September 1939 start (1.6 and 1.7 identical)

| seed | Poland | France | Yugoslavia | Greece | Moscow | Italy armistice | Germany | Soviet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 28 Sep 1939 | 24 Aug 1940 | 4 Jun 1941 | 19 Aug 1941 | - | 15 Aug 1944 | 22 Mar 1945 | - |
| 2 | 2 Oct 1939 | 16 Sep 1940 | 10 Jul 1941 | 31 Jul 1941 | - | - | 2 Feb 1944 | - |
| 3 | 27 Sep 1939 | 3 Aug 1940 | 14 Jun 1941 | 26 Aug 1941 | - | - | 29 Jun 1944 | - |
| 4 | 30 Sep 1939 | 19 Aug 1940 | 4 Jun 1941 | 4 Nov 1941 | - | 16 Sep 1944 | 17 Oct 1944 | - |
| 5 | 29 Sep 1939 | 20 Aug 1940 | 3 Jul 1941 | 6 Sep 1941 | - | 6 Feb 1944 | 31 Aug 1944 | - |
| 6 | 30 Sep 1939 | 22 Oct 1940 | 3 Jun 1941 | 3 Aug 1941 | - | 28 Sep 1943 | 10 Jan 1944 | - |
| 7 | 25 Sep 1939 | 14 Jul 1940 | 19 Jun 1941 | 25 Oct 1941 | - | 11 Oct 1943 | 23 Jun 1944 | - |
| 8 | 30 Sep 1939 | 25 Aug 1940 | 5 Jun 1941 | 17 Aug 1941 | - | 28 Sep 1943 | 20 Oct 1944 | - |

So the open gaps from Stage L are unchanged: Germany still falls about 8 months early (median
about September 1944), which is the next balance pass in the plan.

## What it took

The first 1.7 sweep was not the same as 1.6. From the 1939 start the Soviet Union surrendered
in 2 of 8 runs (in 1.6: never). Each cause was found by running 1.6 and 1.7 side by side and
finding the first day they differ:

1. **New divisions formed up in empty Siberia and India**, the least crowded provinces at home.
   They now form up on the old map only.
2. **The AI moved divisions into the outposts** (Siberia, India, the African colonies) as room to
   spare. In a war between countries of the old map, the AI now treats the outposts as not its
   ground: no fronts, no rear areas, no bases there.
3. **The Soviet Far East.** In 1938 a quarter of the Red Army leaves the map for the Far East,
   taken from divisions away from a border. The new border with Iran made the Caucasus count as
   a border, so different divisions went. Borders with outposts and with countries sitting out
   the war no longer count, here and when choosing where to build factories.
4. **Colonies kept European ports supplied.** A depot in Batavia (the Dutch East Indies) or in
   Siberia could ship supplies to every friendly port, or march them west over land. The
   outposts are now a supply network of their own: they feed themselves, not the homeland.
5. **Troops went round Africa.** With the Mediterranean closed by Italy, a British convoy from
   Palestine to France (and from London to Egypt) found the new route round the Cape. Crossings
   between two ports of the old map, by a country of the old map, keep to the European seas as
   before. The Cape route can open when the oceans join the war (Stage M2).

## Speed

On the cloud machine, 1.6 and 1.7 side by side (one 1936 game each, ms per day):

| year | 1936 | 1937 | 1938 | 1939 | 1940 | 1941 | 1942 | 1943 | 1944 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.6 | 4.1 | 2.6 | 3.6 | 10.4 | 18.1 | 23.6 | 26.1 | 26.1 | 19.8 |
| 1.7 | 5.3 | 4.1 | 4.6 | 11.8 | 16.3 | 26.0 | 25.2 | 27.0 | 19.0 |

A whole game takes about 4% longer on a map more than twice the size. The busiest stretch, the
summer of 1941, took 34 ms a day in both. The new speed test fails if it gets 50% slower.
