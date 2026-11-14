/**
 * Bot playtests: AI against AI test wars, to check the balance of land combat, supply and
 * production; finance playtests, to check what each way of paying for a war costs; and four
 * years of AI peace, to check research, national plans and the home front; and three runs of
 * the whole story with every country led by the AI, to check that it follows real history.
 *
 *   npm run balance            200 wars, 24 finance runs, a peace run and three history runs, writes docs/balance-stage-g.md
 *   npm run balance -- 40      a quicker run with fewer wars
 *
 * Every war uses the real 1936 map and starting armies, with both sides led by the simple AI
 * in src/sim/ai.ts and the AI finance minister in src/sim/aiEconomy.ts. The same command always gives the same report (seeded random numbers).
 */
import fs from 'node:fs';
import { quiet } from '../src/sim/agenda';
import { COUNTRIES } from '../src/sim/countries';
import { economyView } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { planById } from '../src/sim/plans';
import { dateLabel, newWorld } from '../src/sim/world';
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
let peace = quiet(newWorld('freeForAll', 'balance-peace'));
for (let d = 0; d < 365 * 4 + 1; d++) peace = advance(peace);
const peaceRows: string[] = [];
for (const c of COUNTRIES.filter((k) => k.major)) {
  const e = peace.economies[c.name];
  const v = economyView(peace, c.name);
  const start = c.startArmy[0] + c.startArmy[1] + c.startArmy[2];
  peaceRows.push(`| ${c.name} | ${start} to ${peace.units.filter((u) => u.owner === c.name).length} | ${c.industry.civ} + ${c.industry.mil} to ${Math.floor(v.civ + 1e-9)} + ${Math.floor(v.mil + 1e-9)} | ${e.research.done.length} of 24 | ${e.plan.done.length} | ${e.plan.done.filter((id) => planById(id)?.country).map((id) => planById(id)!.name).join(', ') || 'none'} | ${Math.round(e.stability)} | ${Math.round(e.warSupport)} | ${Math.round(v.debtRatio * 100)}% |`);
  console.log(peaceRows[peaceRows.length - 1]);
}

// The whole story, every country led by the AI: does it follow real history?
const EVENTS: [string, string, RegExp][] = [
  ['Germany moves troops into the Rhineland', '7 March 1936', /Rhineland/],
  ['Germany annexes Austria', '12 March 1938', /Austria gives in/],
  ['Munich: Czechoslovakia gives up its border districts', '30 September 1938', /Czechoslovakia gives in/],
  ['Germany occupies the rest of Czechoslovakia', '15 March 1939', /Germany (occupies|annexes) .*Czechoslovakia|Czechoslovakia (gives in: it is annexed|is annexed)/],
  ['Britain guarantees Poland', '31 March 1939', /United Kingdom guarantees the independence of Poland/],
  ['Italy annexes Albania', '7 April 1939', /Albania gives in/],
  ['Germany and Italy sign the Pact of Steel', '22 May 1939', /Pact of Steel/],
  ['German-Soviet non-aggression pact', '23 August 1939', /Germany and the Soviet Union sign a non-aggression pact/],
  ['Germany invades Poland', '1 September 1939', /Germany declares war on Poland/],
  ['Britain and France declare war on Germany', '3 September 1939', /United Kingdom declares war on Germany/],
  ['The Soviet Union invades eastern Poland', '17 September 1939', /Soviet Union declares war on Poland/],
  ['Poland falls', '6 October 1939', /Poland surrenders/],
  ['The Winter War begins', '30 November 1939', /Soviet Union declares war on Finland/],
  ['The Winter War ends', '13 March 1940', /Peace between the Soviet Union and Finland/],
  ['Germany occupies Denmark', '9 April 1940', /Denmark (gives in|surrenders)/],
  ['Germany attacks in the west', '10 May 1940', /Germany declares war on Belgium/],
  ['Italy declares war on France', '10 June 1940', /Italy declares war on France/],
  ['France falls', '22 June 1940', /France surrenders/],
  ['The Soviet Union annexes the Baltic states', 'June to August 1940', /Estonia gives in/],
  ['Germany invades Yugoslavia', '6 April 1941', /Germany declares war on Yugoslavia/],
  ['Germany invades the Soviet Union', '22 June 1941', /Germany declares war on the Soviet Union|Germany declares war on Soviet Union/],
];
const SEEDS = ['history-1', 'history-2', 'history-3'];
const histories = SEEDS.map((seed) => {
  let w = newWorld('story', seed);
  for (let d = 0; d < 365 * 6 + 2; d++) w = advance(w);
  return w;
});
const historyRows = EVENTS.map(([what, real, text]) => {
  const when = histories.map((w) => {
    const e = w.diplomacy.log.find((x) => text.test(x.text));
    return e ? dateLabel({ startDate: w.startDate, day: e.day }) : 'did not happen';
  });
  return `| ${what} | ${real} | ${when.join(' | ')} |`;
});
const endRows = histories.map((w, i) => `| ${SEEDS[i]} | ${Math.round(w.diplomacy.tension)} | ${w.capitulated.join(', ') || 'none'} | ${w.wars.map((k) => k.replace('|', ' and ')).join('; ') || 'none'} |`);
// The war at sea and in the air in the same three runs.
const forceRows = histories.flatMap((w, i) =>
  COUNTRIES.filter((c) => c.major && !w.capitulated.includes(c.name)).map((c) => {
    const fleets = w.fleets.filter((f) => f.owner === c.name);
    const n = (k: 'capital' | 'escort' | 'submarine') => Math.round(fleets.reduce((a, f) => a + f.ships[k], 0));
    const wings = w.wings.filter((x) => x.owner === c.name);
    const landings = w.forceLog.filter((e) => e.kind === 'landing' && e.countries[0] === c.name && / lands /.test(e.text)).length;
    return `| ${SEEDS[i]} | ${c.name} | ${n('capital')} / ${n('escort')} / ${n('submarine')} | ${wings.filter((x) => x.type === 'fighter').length} + ${wings.filter((x) => x.type === 'bomber').length} | ${Math.round(economyView(w, c.name).blockade * 100)}% | ${landings} | ${w.units.filter((u) => u.owner === c.name).length} |`;
  }),
);
const seaRows = histories.map((w, i) => `| ${SEEDS[i]} | ${w.forceLog.filter((e) => /^Naval battle/.test(e.text)).length} | ${w.forceLog.filter((e) => /is destroyed/.test(e.text)).length} | ${w.forceLog.filter((e) => / lands /.test(e.text)).length} | ${w.forceLog.filter((e) => /loses a (fighter|bomber) wing/.test(e.text)).length} | ${Object.keys(w.bombed).length} |`);
console.log(forceRows.join('\n'));
console.log(seaRows.join('\n'));
console.log(historyRows.join('\n'));
console.log(endRows.join('\n'));

const report = `# Balance report, Stage G: ${all.length} AI against AI wars, ${financeRows.length} finance playtests, four years of peace and three runs of history

Made by \`npm run balance\`. Do not edit the tables by hand; run the command again instead.

## Wars

Each war starts on 1 January 1936 with the real map and each country's starting army and
economy, with all treaties set aside so that nobody else joins in. The first country declares war on the second on day 1. Both are led by the same simple
army AI and the same AI finance minister, which raises new divisions, refills damaged ones,
picks research and national plans, and pays for it all. A war ends when one side surrenders (enemies hold 60% of its home victory
points, or 40% once its capital has fallen) or after 2 years, which counts as a stalemate. Only the two countries fight.

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

Every country is led by the AI from 1 January 1936 to 1 January 1940, with the historical
plans switched off, so nobody declares war.
The table shows what the six major powers did with their research teams and national plans.

| Country | Divisions | Factories (civilian + military) | Technologies | Plans carried out | Its real programmes | Stability | War support | Debt, % of a year's output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${peaceRows.join('\n')}

## Does the AI follow history?

Story mode from 1 January 1936 to 1 January 1942, three times with different random numbers,
every country led by the AI and no player. The table shows the date each event happened in the
game beside its real date.

| Event | Really happened | ${SEEDS.join(' | ')} |
| --- | --- | --- | --- | --- |
${historyRows.join('\n')}

How each run stood on 1 January 1942:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
${endRows.join('\n')}

## The war at sea and in the air

The same three runs on 1 January 1942. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
${forceRows.join('\n')}

Over the six years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
${seaRows.join('\n')}
`;
fs.mkdirSync('docs', { recursive: true });
const file = 'docs/balance-stage-g.md';
// Keep the hand-written notes below the tables when the numbers are refreshed.
const marker = '\n## What the results say';
const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const notes = old.includes(marker) ? old.slice(old.indexOf(marker)) : '';
fs.writeFileSync(file, report + notes);
console.log(`\n${all.length} wars, ${financeRows.length} finance runs, a peace run and ${histories.length} history runs in ${((Date.now() - t0) / 1000).toFixed(1)} s. Report written to ${file}`);
