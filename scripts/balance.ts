/**
 * Bot playtests: AI against AI test wars, to check the balance of land combat, supply and
 * production, and finance playtests, to check what each way of paying for a war costs.
 *
 *   npm run balance            200 wars and 24 finance runs, writes docs/balance-stage-d.md
 *   npm run balance -- 40      a quicker run with fewer wars
 *
 * Every war uses the real 1936 map and starting armies, with both sides led by the simple AI
 * in src/sim/ai.ts and the AI finance minister in src/sim/aiEconomy.ts. The same command always gives the same report (seeded random numbers).
 */
import fs from 'node:fs';
import { COUNTRIES } from '../src/sim/countries';
import { POLICIES, runFinance } from '../src/sim/testeconomy';
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

// Finance playtests: each major power on a war footing for four years under four policies.
const financeRows: string[] = [];
for (const c of COUNTRIES.filter((k) => k.major)) {
  for (const p of POLICIES) {
    const r = runFinance(c.name, p, 4);
    const start = c.startArmy[0] + c.startArmy[1] + c.startArmy[2];
    financeRows.push(`| ${c.name} | ${p.name} | ${start} to ${r.divisions} | ${r.militaryFactories} | ${r.peakInflation > 1000 ? 'over 1,000' : Math.round(r.peakInflation)}% | ${r.prices > 100000 ? 'worthless money' : `x ${(r.prices / 100).toFixed(1)}`} | ${Math.round(r.debtRatio * 100)}% | ${Math.round(r.lowestStability)} | ${Math.round(r.output * 100)}% | ${Math.round(r.printedShare * 100)}% |`);
    console.log(financeRows[financeRows.length - 1]);
  }
}

const report = `# Balance report, Stage D: ${all.length} AI against AI wars and ${financeRows.length} finance playtests

Made by \`npm run balance\`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones and
pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

"Divisions lost" compares strength on the field at the start and the end, so divisions raised
during the war count against losses and the figure can be zero for a side that grew.

## Paying for a war

Each major power is put at war for four years with a country it cannot reach, so nothing is
lost in battle and the only difference between runs is how the war is paid for. Conscription is
"extensive". The AI raises divisions and builds arms factories until the shortfall reaches 20%
of output; the money policy is fixed:

${POLICIES.map((p) => `- **${p.name}**: ${p.what.toLowerCase()}.`).join('\n')}

| Country | Policy | Divisions | Military factories | Highest inflation | Prices after 4 years | Debt, % of a year's output | Lowest stability | Factory speed at the end | Share of shortfall printed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${financeRows.join('\n')}
`;
fs.mkdirSync('docs', { recursive: true });
const file = 'docs/balance-stage-d.md';
// Keep the hand-written notes below the tables when the numbers are refreshed.
const marker = '\n## What the results say';
const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const notes = old.includes(marker) ? old.slice(old.indexOf(marker)) : '';
fs.writeFileSync(file, report + notes);
console.log(`\n${all.length} wars and ${financeRows.length} finance runs in ${((Date.now() - t0) / 1000).toFixed(1)} s. Report written to ${file}`);
