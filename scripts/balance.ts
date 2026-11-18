/**
 * Bot playtests: AI against AI test wars, to check the balance of land combat, supply and
 * production; finance playtests, to check what each way of paying for a war costs; and four
 * years of AI peace, to check research, national plans and the home front; and three runs of
 * the whole story with every country led by the AI, to check that it follows real history (three from 1936 and three from September 1939).
 *
 *   npm run balance            200 wars, 24 finance runs, a peace run and six history runs, writes docs/balance-stage-j.md
 *   npm run balance -- 40      a quicker run with fewer wars
 *
 * Every war uses the real 1936 map and starting armies, with both sides led by the simple AI
 * in src/sim/ai.ts and the AI finance minister in src/sim/aiEconomy.ts. The same command always gives the same report (seeded random numbers).
 */
import fs from 'node:fs';
import { dayOf, quiet } from '../src/sim/agenda';
import { PROVINCES } from '../src/sim/map';
import { scores } from '../src/sim/report';
import { newGame } from '../src/sim/scenario';
import { COUNTRIES } from '../src/sim/countries';
import { economyView } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { planById } from '../src/sim/plans';
import { dateLabel, newWorld } from '../src/sim/world';
import type { World } from '../src/sim/types';
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
  ['Civil war begins in Spain', '17 July 1936', /Civil war in Spain/],
  ['Germany annexes Austria', '12 March 1938', /Austria gives in/],
  ['Munich: Czechoslovakia gives up its border districts', '30 September 1938', /Czechoslovakia gives in/],
  ['Germany occupies the rest of Czechoslovakia', '15 March 1939', /Germany (occupies|annexes) .*Czechoslovakia|Czechoslovakia (gives in: it is annexed|is annexed)/],
  ['The First Vienna Award', '2 November 1938', /First Vienna Award/],
  ['Britain guarantees Poland', '31 March 1939', /United Kingdom guarantees the independence of Poland/],
  ['Franco wins in Spain', '1 April 1939', /Franco wins the civil war/],
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
  ['Germany lands in Norway', '9 April 1940', /Germany declares war on Norway/],
  ['Norway falls', '10 June 1940', /Norway surrenders/],
  ['Germany attacks in the west', '10 May 1940', /Germany declares war on Belgium/],
  ['Italy declares war on France', '10 June 1940', /Italy declares war on France/],
  ['France falls', '22 June 1940', /France surrenders/],
  ['France signs an armistice (Vichy)', '22 June 1940', /France signs an armistice/],
  ['The Soviet Union annexes the Baltic states', 'June to August 1940', /Estonia gives in/],
  ['The Second Vienna Award', '30 August 1940', /Second Vienna Award/],
  ['Italy invades Greece', '28 October 1940', /Italy declares war on Greece/],
  ['Lend-Lease reaches Britain', '11 March 1941', /Lend-Lease: American equipment begins to reach the United Kingdom/],
  ['Germany invades Yugoslavia', '6 April 1941', /Germany declares war on Yugoslavia/],
  ['Germany invades the Soviet Union', '22 June 1941', /Germany declares war on the Soviet Union|Germany declares war on Soviet Union/],
  ['Britain and the Soviet Union become allies', '12 July 1941', /Soviet Union and the United Kingdom become allies/],
  ['Lend-Lease reaches the Soviet Union', '1 October 1941', /Lend-Lease: American equipment begins to reach the Soviet Union/],
  ['Yugoslavia falls', '17 April 1941', /Yugoslavia surrenders/],
  ['Greece falls', '23 April 1941', /Greece surrenders/],
  ['Siberian divisions reach Moscow', 'November 1941', /Siberian divisions reach Moscow/],
  ['Mussolini falls', '25 July 1943', /dismisses Mussolini/],
  ['Italy signs an armistice and changes sides', '8 September 1943', /Italy signs an armistice with the Allies/],
  ['Moscow falls', 'never', /^MOSCOW FALLS$/],
  ['The Soviet Union surrenders', 'never', /Soviet Union surrenders/],
  ['Germany surrenders', '8 May 1945', /Germany surrenders/],
];
/** Landings the AI makes (forceLog), with the real ones they stand for. */
const LANDINGS: [string, string, string[]][] = [
  ['The Allies land in Sicily or southern Italy', '10 July 1943', ['Sicily', 'Calabria', 'Sardinia', 'Campania', 'Apulia']],
  ['The Allies land in northern France or the Low Countries', '6 June 1944', ['Normandy', 'Brittany', 'Holland', 'Île-de-France', 'Poitou', 'Gascony']],
  ['The Allies land in the south of France', '15 August 1944', ['Provence', 'Languedoc']],
];
const END = '1945-05-08';
const SEEDS = ['history-1', 'history-2', 'history-3'];
// The world keeps only its latest news, so the whole of each run's news is gathered here as it happens.
const allNews = new Map<World, { day: number; text: string }[]>();
/** The eastern front on 1 January of each year, for each run: Soviet provinces held by the enemy, and the two armies. */
const eastRows: string[] = [];
/** The war economy of the big three on 1 January of each year, for each run (Stage J). */
const economyRows: string[] = [];
const BIG = ['Germany', 'Soviet Union', 'United Kingdom'];
const economyRow = (w: World, seed: string, date: string): string[] =>
  BIG.filter((c) => !w.capitulated.includes(c)).map((c) => {
    const e = w.economies[c];
    const v = economyView(w, c);
    const units = w.units.filter((u) => u.owner === c);
    const strength = units.length ? units.reduce((a, u) => a + u.strength, 0) / units.length : 0;
    return `| ${seed} | ${date} | ${c} | ${units.length} (${Math.round(strength)}%) | ${Math.floor(v.mil)} | ${e.inflation.toFixed(0)}% | x${(e.priceLevel / 100).toFixed(1)} | ${Math.round(v.debtRatio * 100)}% | ${e.rationing ? 'yes' : 'no'} | ${Math.round(e.stability)} | ${e.governmentsFallen} |`;
  });
const MOSCOW = PROVINCES.find((p) => p.name === 'Moscow')!.id;
const played = (start: World, days: number, seed?: string): World => {
  let w = start;
  const news: { day: number; text: string }[] = [];
  let last = -1;
  let moscow = false;
  const soviet = PROVINCES.filter((p) => p.owner === 'Soviet Union');
  for (let d = 0; d < days; d++) {
    w = advance(w);
    for (const e of w.diplomacy.log) if (e.id > last) { last = e.id; news.push({ day: e.day, text: e.text }); }
    if (!moscow && w.controller[MOSCOW] !== 'Soviet Union') (moscow = true), news.push({ day: w.day, text: 'MOSCOW FALLS' });
    const date = dateLabel(w);
    if (seed && (/^1 January 19(39|4[0-5])$/.test(date) || d === days - 1)) economyRows.push(...economyRow(w, seed, date));
    if (seed && /^1 January 19(4[2-5])$/.test(date)) {
      const lost = soviet.filter((p) => w.controller[p.id] !== 'Soviet Union').length;
      const n = (c: string) => w.units.filter((u) => u.owner === c).length;
      const out = PROVINCES.filter((p) => p.owner === 'Germany' && w.controller[p.id] !== 'Germany').length;
      eastRows.push(`| ${seed} | ${date} | ${w.capitulated.includes('Soviet Union') ? 'surrendered' : `${lost} of ${soviet.length}`} | ${out} | ${n('Germany')} | ${n('Soviet Union')} | ${n('United Kingdom')} | ${w.capitulated.includes('Italy') ? 'fallen' : w.story.fired.includes('italy-armistice') ? 'with the Allies' : 'with Germany'} |`);
    }
  }
  allNews.set(w, news);
  return w;
};
const histories = SEEDS.map((seed) => played(newWorld('story', seed), dayOf('1936-01-01', END), seed));
// The short September 1939 start, also led by the AI throughout.
const SEEDS_1939 = ['1939-1', '1939-2', '1939-3'];
const histories1939 = SEEDS_1939.map((seed) => played(newGame({ mode: 'story', start: '1939', player: null, seed }), dayOf('1939-09-01', END), seed));
const landingRows = LANDINGS.map(([what, real, where]) => {
  const ids = new Set(where.map((n) => PROVINCES.find((p) => p.name === n)!.id));
  const when = histories.map((w) => {
    const e = w.forceLog.find((x) => x.kind === 'landing' && x.countries[0] === 'United Kingdom' && / lands /.test(x.text) && x.province !== undefined && ids.has(x.province));
    return e ? dateLabel({ startDate: w.startDate, day: e.day }) : 'did not happen';
  });
  return `| ${what} | ${real} | ${when.join(' | ')} |`;
});
const historyRows = EVENTS.map(([what, real, text]) => {
  const when = histories.map((w) => {
    const e = allNews.get(w)!.find((x) => text.test(x.text));
    return e ? dateLabel({ startDate: w.startDate, day: e.day }) : 'did not happen';
  });
  return `| ${what} | ${real} | ${when.join(' | ')} |`;
});
/** When each run's great powers fell, and how the Soviet economy came through. */
const fallRows = [...histories.map((w, i) => [SEEDS[i], w] as const), ...histories1939.map((w, i) => [SEEDS_1939[i], w] as const)].map(([seed, w]) => {
  const fell = (c: string) => {
    const e = allNews.get(w)!.find((x) => new RegExp(`^${c} surrenders|^${c} signs an armistice`).test(x.text));
    return e ? dateLabel({ startDate: w.startDate, day: e.day }) : 'did not fall';
  };
  const soviet = w.economies['Soviet Union'];
  const peak = Math.max(...soviet.history.map((h) => h.inflation));
  return `| ${seed} | ${fell('France')} | ${fell('Italy')} | ${fell('Germany')} | ${Math.round(peak)}% | x${(soviet.priceLevel / 100).toFixed(1)} | ${soviet.governmentsFallen} | ${soviet.government} |`;
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
// Story mode's own record in the same runs, and the eastern front.
const storyRows = histories.map((w, i) => {
  const soviet = PROVINCES.filter((p) => p.owner === 'Soviet Union');
  const lost = soviet.filter((p) => w.controller[p.id] !== 'Soviet Union');
  const top = Object.entries(w.story.losses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${Math.round(v)}`).join(', ');
  return `| ${SEEDS[i]} | ${w.story.cards.length} | ${w.story.spain.state === 'nationalist' ? 'Franco' : w.story.spain.state} | ${w.story.armistice.join(', ') || 'none'} | ${lost.length} of ${soviet.length}${lost.length ? ` (${lost.map((p) => p.name).join(', ')})` : ''} | ${top} |`;
});
// Free-for-all: no treaties, no timetable, five years.
const FFA_SEEDS = ['ffa-1', 'ffa-2', 'ffa-3'];
const ffaRows = FFA_SEEDS.map((seed) => {
  const w = played(newGame({ mode: 'freeForAll', start: '1936', player: null, seed }), 365 * 5 + 1);
  const table = scores(w);
  const wars = allNews.get(w)!.filter((e) => /declares war on/.test(e.text)).length;
  const first = allNews.get(w)!.find((e) => /declares war on/.test(e.text));
  return `| ${seed} | ${first ? dateLabel({ startDate: w.startDate, day: first.day }) : 'none'} | ${wars} | ${w.capitulated.length} | ${w.diplomacy.pacts.filter((p) => p.kind === 'alliance').length} | ${table.slice(0, 3).map((r) => `${r.country} ${r.points} (${r.change >= 0 ? '+' : ''}${r.change})`).join(', ')} | ${COUNTRIES.filter((c) => c.major && w.capitulated.includes(c.name)).map((c) => c.name).join(', ') || 'none'} |`;
});
console.log(storyRows.join('\n'));
console.log(ffaRows.join('\n'));
console.log(forceRows.join('\n'));
console.log(seaRows.join('\n'));
console.log(historyRows.join('\n'));
console.log(landingRows.join('\n'));
console.log(eastRows.join('\n'));
console.log(endRows.join('\n'));
console.log(fallRows.join('\n'));
console.log(economyRows.join('\n'));

const report = `# Balance report, Stage J: ${all.length} AI against AI wars, ${financeRows.length} finance playtests, four years of peace, six runs of history and three free-for-alls

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

Story mode from 1 January 1936 to 8 May 1945, three times with different random numbers,
every country led by the AI and no player. The table shows the date each event happened in the
game beside its real date.

| Event | Really happened | ${SEEDS.join(' | ')} |
| --- | --- | --- | --- | --- |
${historyRows.join('\n')}

Landings by the British AI (the first one on each stretch of coast; there is no American army on this map, so British divisions stand in for all the Allies):

| Landing | Really happened | ${SEEDS.join(' | ')} |
| --- | --- | --- | --- | --- |
${landingRows.join('\n')}

## The war economy

Stage J's question: can each country pay for the war it fights, as the real ones did? The same
three runs from 1936, then three runs of the September 1939 start, every country led by the
AI. Real figures for comparison: Germany had about 210 divisions in June 1941 and about 300 at
its peak; Soviet prices roughly doubled in the shops during the war but the government never
fell; Britain's debt reached about 2.5 years' output by 1945 (this game counts debt as a share
of a year's output, so 250%) and its prices rose by about half.

When the great powers fell (the date of surrender or armistice), and how the Soviet economy came through by 8 May 1945:

| Run | France | Italy | Germany | Highest Soviet inflation (a year) | Soviet prices at the end | Soviet governments fallen | Soviet government |
| --- | --- | --- | --- | --- | --- | --- | --- |
${fallRows.join('\n')}

On 1 January of each year, and on the last day (divisions at their average strength; prices
compared with the start; debt as a share of a year's output):

| Run | Date | Country | Divisions | Military factories | Inflation | Prices | Debt | Rationing | Stability | Governments fallen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${economyRows.join('\n')}

## The eastern front

On 1 January of each year: how many of the Soviet Union's own provinces the enemy holds, how
many German provinces the enemy holds, and the size of the three biggest armies on the map
(the Soviet Union also has an army in the Far East that is not on this map until the autumn of 1941).

| Run | Date | Soviet provinces lost | German provinces lost | German divisions | Soviet divisions | British divisions | Italy |
| --- | --- | --- | --- | --- | --- | --- | --- |
${eastRows.join('\n')}

How each run stood on 8 May 1945:

| Run | World tension | Countries that have fallen | Wars still being fought |
| --- | --- | --- | --- |
${endRows.join('\n')}

## Story mode in the same runs

How each run stood on 8 May 1945. "Soviet provinces lost" shows how far the eastern front
has moved; losses are in divisions' worth of men and equipment.

| Run | History cards filed | Spain | Armistice signed by | Soviet provinces lost | Heaviest battle losses |
| --- | --- | --- | --- | --- | --- |
${storyRows.join('\n')}

## Free-for-all

Every treaty torn up, no timetable, every country led by the AI, 1 January 1936 to 1 January 1941.

| Run | First war | Declarations of war | Countries fallen | Alliances at the end | Top three by victory points (change since 1936) | Major powers fallen |
| --- | --- | --- | --- | --- | --- | --- |
${ffaRows.join('\n')}

## The war at sea and in the air

The same three runs on 8 May 1945. Ships are capital ships / escort flotillas / submarine
flotillas; wings are fighters + bombers; "imports sunk" is the share of the country's imports
lost at sea that day.

| Run | Country | Ships | Air wings | Imports sunk | Landings made | Divisions |
| --- | --- | --- | --- | --- | --- | --- |
${forceRows.join('\n')}

Over the nine years of each run:

| Run | Naval battles | Fleets destroyed | Landings | Air wings lost | Provinces with bomb damage at the end |
| --- | --- | --- | --- | --- | --- |
${seaRows.join('\n')}
`;
fs.mkdirSync('docs', { recursive: true });
const file = 'docs/balance-stage-j.md';
// Keep the hand-written notes below the tables when the numbers are refreshed.
const marker = '\n## What the results say';
const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const notes = old.includes(marker) ? old.slice(old.indexOf(marker)) : '';
fs.writeFileSync(file, report + notes);
console.log(`\n${all.length} wars, ${financeRows.length} finance runs, a peace run and ${histories.length + histories1939.length} history runs and three free-for-alls in ${((Date.now() - t0) / 1000).toFixed(1)} s. Report written to ${file}`);
