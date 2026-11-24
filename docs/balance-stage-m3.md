# Balance check, Stage M3 (version 1.9.0): America and the Atlantic

Stage M3 wakes the United States, Canada, Australia, New Zealand and South Africa in Story mode,
ships Lend-Lease across the sea from America's own factories, and puts American and Dominion
divisions into the real landings. The plan's check for it:

> Germany does not fall earlier than in 1.6; the USA enters the war only on a real cause.

## Europe: 1.8 against 1.9

`node scripts/sweep.mjs <label> 1936|1939 8 4 [first seed]` runs AI-only Story games and lists
the day each event happened. 8 seeds from 1936 and 16 from 1939, the same seeds for 1.8 (main)
and 1.9. A date is the median of the runs where it happened; brackets give the earliest and
latest month.

| | 1.8 from 1936 (8) | 1.9 from 1936 (8) | 1.8 from 1939 (16) | 1.9 from 1939 (16) |
| --- | --- | --- | --- | --- |
| Poland surrenders | 5 Oct 1939 | 5 Oct 1939 | 30 Sep 1939 | 30 Sep 1939 |
| France falls | 14 Aug 1940 | 21 Jul 1940 | 17 Aug 1940 | 15 Aug 1940 |
| Greece falls | 8 of 8, 14 Aug 1941 | 8 of 8, 4 Sep 1941 | 16 of 16, 26 Aug 1941 | 16 of 16, 21 Aug 1941 |
| Moscow falls | 0 of 8 | 0 of 8 | 0 of 16 | 1 of 16 (Mar 1942) |
| Soviet Union surrenders | 0 of 8 | 0 of 8 | 0 of 16 | 1 of 16 (Mar 1942) |
| Italy's armistice | 7 of 8, 28 Sep 1943 | 8 of 8, 14 Sep 1943 | 11 of 16, 28 Sep 1943 | 14 of 16, 21 Sep 1943 |
| Germany surrenders | 8 of 8, 4 Jul 1944 (Feb 1944 to Sep 1944) | 8 of 8, 13 Nov 1944 (Mar 1944 to May 1945) | 16 of 16, 25 Jun 1944 (Sep 1943 to Feb 1945) | 15 of 16, 2 Aug 1944 (Nov 1943 to Apr 1945) |

Real history: Poland 6 October 1939, France 22 June 1940, Greece April to June 1941, Italy's
armistice 8 September 1943, Germany 8 May 1945.

So **Germany does not fall earlier than before**: about four months later from 1936 and about
five weeks later from 1939, a little closer to May 1945. (1.6 had a median of 31 August 1944
from 1936; 1.9 is later than that too.) The rest of Europe is about as in 1.8: Poland, France and
Greece fall on the same dates within the noise of these runs, and Italy now changes sides in
nearly every run, in September 1943.

Why Germany lasts longer although America now fights it: in 1.8 Britain and the Soviet Union got
their Lend-Lease from off the map every month from March 1941, and none of it was ever sunk. Now
it is America's own factories that make it, only what was really sent goes (Cash and Carry for
cash from late 1939, Lend-Lease from March 1941, the Soviet Union only from October 1941), and
America's own divisions come to Europe only in the planned operations. Britain's own landings
are a little smaller to make room for the Americans.

The one bad run: seed 1939-4, where Moscow falls on 4 March 1942 and the Soviet Union surrenders
the day before. It is the only one of 24 and the same seed does not do it in 1.8; the Soviet
Lend-Lease of that run had only just begun to arrive. Balance runs are chaotic (see
docs/balance-1.4.1-poland.md), so it is a known gap to watch, not a pattern yet.

## The Atlantic

`scripts/atlantic.ts` runs a Story game from 1936 with AI players only and prints America and the
Dominions once a month (`npx vite-node scripts/atlantic.ts -- <seed> [end] [1936|1939] [out.json]`).
Three seeds, run to Germany's surrender (atlantic-1 March 1945, atlantic-2 September 1944,
atlantic-3 February 1945).

In all three runs the road to war follows the real dates:

| | atlantic-1, 2 and 3 | Real history |
| --- | --- | --- |
| Dominions declare war on Germany | 1 Sep 1939 (one line of news) | 3 to 10 Sep 1939 |
| Cash and Carry, first convoys | Dec 1939 | 4 Nov 1939 |
| Destroyers for Bases | 2 Sep 1940 | 2 Sep 1940 |
| Lend-Lease Act, first convoys to Britain | 11 Mar 1941, Mar 1941 | 11 Mar 1941 |
| Lend-Lease to China (Burma Road) | May 1941 | May 1941 |
| Lend-Lease to the Soviet Union (Pacific) | Oct 1941 | Oct 1941 |
| Shoot on sight (a cause for war) | Sep 1941 in 2 of 3 runs | 11 Sep 1941 |
| Pearl Harbor; Germany and Italy declare war on America | 7 and 11 Dec 1941 | 7 and 11 Dec 1941 |
| Operation Torch, Case Anton | 8 Nov 1942 | 8 and 11 Nov 1942 |

America's war support is 15 to 41 until Pearl Harbor (the Neutrality Acts hold it at war only
from 60) and 92 to 100 from mid-1942. Its army grows from 11 divisions in 1936 to about 54 in
January 1940, 100 at Pearl Harbor and 115 to 120 in 1944 (real: about 90 divisions, most of
them overseas by 1945). Divisions abroad: 12 in Britain by July 1942 (Bolero), 24 after Torch,
33 to 58 in mid-1944, 53 to 65 by early 1945. Canada keeps 4 divisions in Britain and lands
5 more in Normandy (9 abroad from July 1944); in atlantic-1 Canada liberates Paris. Australia
and South Africa send 5 and 7 to 8 divisions to Egypt; the Australians go home in 1943.

Lend-Lease, in factory-days of equipment, in atlantic-1 (the others are within a few per cent):

| | 1940 | 1941 | 1942 | 1943 | 1944 |
| --- | --- | --- | --- | --- | --- |
| Sent | 1,893 | 4,592 | 8,044 | 7,882 | 8,371 |
| Sunk on the way | 342 (18%) | 11 | 21 | 14 | 14 |

By route, 1939 to March 1945: North Atlantic to Britain 14,083 (349 sunk), Atlantic to France
220 (53 sunk) until France fell, Burma Road to China 11,285, Pacific to Vladivostok 3,474,
Arctic convoys 1,736, Persian Gulf 1,556. Britain and France paid 849 (money) under Cash and Carry.
Real history sent about 60% of Lend-Lease to Britain, 20% to the Soviet Union (half of that
across the Pacific, a quarter through Iran, a quarter by the Arctic convoys) and a few per cent to
China; the routes and their order of size match, the shares do not quite (see below).

## Speed

AI-only on the cloud machine: about 25 to 27 ms a game day over a whole war from 1936 (the
atlantic runs and the 1936 sweep), against about 18 ms in 1.8 for the same span; 1943 alone about 30 ms. The
fastest game speed allows 60 ms. America and the Dominions' AI is about 15% of the time.

## Known gaps

- **The U-boats are beaten too early.** Germany's U-boat Arm sinks 18% of what crosses in 1940,
  but its 12 flotillas are worn down by the end of 1940 and Germany builds too few new ones (about
  3% of its arms factories), so from 1941 almost nothing is sunk. Really, 1942 was the worst year
  of the Battle of the Atlantic and the U-boats lost only in May 1943. This was already so in 1.8
  (Britain's own trade was safe from 1941); building more U-boats takes factories from Germany's
  army, so it belongs in the second balance pass.
- **China gets too much.** The Burma Road carries about as much as the North Atlantic, because
  China asks for the equipment 1.8 planned to give it (CHINA_AID). Really China got a few per cent
  of Lend-Lease, and from 1942 only over the Hump. The Pacific stage (M4) cuts the Burma Road when
  Japan takes Burma, which leaves China 25% by air.
- **The Soviet Union surrenders in 1 of 24 runs** (seed 1939-4, March 1942).
- **Germany still falls early**: a median of about August to November 1944 against the real May 1945.
- Pearl Harbor and the Pacific war are not fought on the map yet (Stage M4).
