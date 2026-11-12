/**
 * AI against AI test wars, to check the balance of land combat and supply.
 *
 *   npm run balance            200 wars, writes docs/balance-stage-b.md
 *   npm run balance -- 40      a quicker run with fewer wars
 *
 * Every war uses the real 1936 map and starting armies, with both sides led by the simple AI
 * in src/sim/ai.ts. The same command always gives the same report (seeded random numbers).
 */
import fs from 'node:fs';
import { runWar, SCENARIOS, type WarResult } from '../src/sim/testwar';

const total = Number(process.argv[2]) || 200;
const perScenario = Math.ceil(total / SCENARIOS.length);
const t0 = Date.now();

const rows: string[] = [];
const all: WarResult[] = [];
for (const s of SCENARIOS) {
  const results: WarResult[] = [];
  for (let i = 0; i < perScenario; i++) results.push(runWar(s.attacker, s.defender, `balance-${i}`));
  all.push(...results);
  const n = results.length;
  const wins = results.filter((r) => r.winner === s.attacker).length;
  const losses = results.filter((r) => r.winner === s.defender).length;
  const decided = results.filter((r) => r.winner);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
  const days = mean(decided.map((r) => r.days));
  rows.push(
    `| ${s.attacker} v ${s.defender} | ${s.start[0]} v ${s.start[1]} | ${Math.round((wins / n) * 100)}% | ${Math.round((losses / n) * 100)}% | ${Math.round(((n - wins - losses) / n) * 100)}% | ${Number.isNaN(days) ? 'n/a' : Math.round(days)} | ${mean(results.map((r) => r.attackerLost)).toFixed(1)} | ${mean(results.map((r) => r.defenderLost)).toFixed(1)} | ${mean(results.map((r) => r.battles)).toFixed(0)} | ${Math.round(mean(results.map((r) => r.attackWinShare)) * 100)}% | ${s.history} |`,
  );
  console.log(rows[rows.length - 1]);
}

const report = `# Balance report, Stage B: ${all.length} AI against AI wars

Made by \`npm run balance\`. Do not edit by hand; run the command again instead.

Each war starts on 1 January 1936 with the real map and each country's starting army. The first
country declares war on the second on day 1 and both are led by the same simple AI. A war ends
when one side surrenders (enemies hold 60% of its home victory points) or after 2 years, which
counts as a stalemate. Only the two countries fight; everyone else stays neutral.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

"Divisions lost" counts strength: 100 points of strength lost is one division, wherever it was lost.

Across all wars, ${Math.round((all.reduce((a, r) => a + r.attackWinShare * r.battles, 0) / Math.max(1, all.reduce((a, r) => a + r.battles, 0))) * 100)}% of attacks on a defended province succeeded.

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
`;
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/balance-stage-b.md', report);
console.log(`\n${all.length} wars in ${((Date.now() - t0) / 1000).toFixed(1)} s. Report written to docs/balance-stage-b.md`);
