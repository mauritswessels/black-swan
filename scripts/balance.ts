/**
 * Bot playtests: AI against AI test wars, to check the balance of land combat, supply and
 * production; finance playtests, to check what each way of paying for a war costs; and four
 * years of AI peace, to check research, national plans and the home front.
 *
 *   npm run balance            200 wars, 24 finance runs and one peace run, writes docs/balance-stage-e.md
 *   npm run balance -- 40      a quicker run with fewer wars
 *
 * Every war uses the real 1936 map and starting armies, with both sides led by the simple AI
 * in src/sim/ai.ts and the AI finance minister in src/sim/aiEconomy.ts. The same command always gives the same report (seeded random numbers).
 */
import fs from 'node:fs';
import { COUNTRIES } from '../src/sim/countries';
import { economyView } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { planById } from '../src/sim/plans';
import { newWorld } from '../src/sim/world';
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

// Four years of peace with every country led by the AI: what did each major power research and plan?
let peace = newWorld('freeForAll', 'balance-peace');
for (let d = 0; d < 365 * 4 + 1; d++) peace = advance(peace);
const peaceRows: string[] = [];
for (const c of COUNTRIES.filter((k) => k.major)) {
  const e = peace.economies[c.name];
  const v = economyView(peace, c.name);
  const start = c.startArmy[0] + c.startArmy[1] + c.startArmy[2];
  peaceRows.push(`| ${c.name} | ${start} to ${peace.units.filter((u) => u.owner === c.name).length} | ${c.industry.civ} + ${c.industry.mil} to ${Math.floor(v.civ + 1e-9)} + ${Math.floor(v.mil + 1e-9)} | ${e.research.done.length} of 16 | ${e.plan.done.length} | ${e.plan.done.filter((id) => planById(id)?.country).map((id) => planById(id)!.name).join(', ') || 'none'} | ${Math.round(e.stability)} | ${Math.round(e.warSupport)} | ${Math.round(v.debtRatio * 100)}% |`);
  console.log(peaceRows[peaceRows.length - 1]);
}

const report = `# Balance report, Stage E: ${all.length} AI against AI wars, ${financeRows.length} finance playtests and four years of peace

Made by \`npm run balance\`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points) or after 2 years, which counts as a stalemate. Only the two countries fight.

| War | Divisions at the start | First side wins | Second side wins | Stalemate | Average days to win | Divisions lost, first | Divisions lost, second | Battles | Attacks that succeed | What really happened |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

"Divisions lost" compares strength on the field at the start and the end, so divisions raised
during the war count against losses and the figure can be zero for a side that grew.

## Paying for a war

Each major power is put at war for four years with a country it cannot reach, so nothing is
lost in battle and the only difference between runs is how the war is paid for. The other
country declares the war, so the public supports it (war support starts near 65 in the
democracies and 85 in the dictatorships, and wears down as the war drags on). Conscription is
"extensive". The AI raises divisions and builds arms factories until the shortfall reaches 20%
of output; the money policy is fixed:

${POLICIES.map((p) => `- **${p.name}**: ${p.what.toLowerCase()}.`).join('\n')}

| Country | Policy | Divisions | Military factories | Highest inflation | Prices after 4 years | Debt, % of a year's output | Lowest stability | Factory speed at the end | Share of shortfall printed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${financeRows.join('\n')}

## Four years of peace

Every country is led by the AI from 1 January 1936 to 1 January 1940 and nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${peaceRows.join('\n')}
`;
fs.mkdirSync('docs', { recursive: true });
const file = 'docs/balance-stage-e.md';
// Keep the hand-written notes below the tables when the numbers are refreshed.
const marker = '\n## What the results say';
const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const notes = old.includes(marker) ? old.slice(old.indexOf(marker)) : '';
fs.writeFileSync(file, report + notes);
console.log(`\n${all.length} wars, ${financeRows.length} finance runs and a peace run in ${((Date.now() - t0) / 1000).toFixed(1)} s. Report written to ${file}`);
