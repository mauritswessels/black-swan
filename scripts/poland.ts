/**
 * How long Poland lasts in the September 1939 start (version 1.4.1).
 *
 *   npx vite-node scripts/poland.ts [file] [title]   writes docs/balance-1.4.1-poland.md, or the file given
 *
 * Three ways of leading Poland, six seeds each, everyone else led by the AI:
 *   - the AI leads Poland too;
 *   - a player who leads Poland and gives no orders at all;
 *   - a simple "good" player: on the first morning it sends 25 divisions to Warsaw (as many as
 *     the city can feed), 10 to Kraków and 3 to Lwów, and then lets them dig in.
 * Real history: Germany attacked on 1 September 1939, the Soviet Union on 17 September; Warsaw
 * gave in on 28 September and the last Polish troops on 6 October (36 days).
 */
import fs from 'node:fs';
import { advance } from '../src/sim/game';
import { distanceKm, PROVINCES } from '../src/sim/map';
import { newGame } from '../src/sim/scenario';
import type { Order, World } from '../src/sim/types';
import { dateLabel } from '../src/sim/world';

const SEEDS = ['1939-1', '1939-2', '1939-3', 'poland-4', 'poland-5', 'poland-6'];
const id = (n: string) => PROVINCES.find((p) => p.name === n)!.id;
const WARSAW = id('Warsaw');
const POLAND = PROVINCES.filter((p) => p.owner === 'Poland');

function goodPlayer(w: World): Order[] {
  const free = w.units.filter((u) => u.owner === 'Poland');
  const orders: Order[] = [];
  for (const [name, n] of [['Warsaw', 25], ['Kraków', 10], ['Stanisławów', 3]] as const) {
    const t = id(name);
    free.sort((a, b) => distanceKm(PROVINCES[a.at].centre, PROVINCES[t].centre) - distanceKm(PROVINCES[b.at].centre, PROVINCES[t].centre));
    for (const u of free.splice(0, n)) if (u.at !== t) orders.push({ type: 'move', unit: u.id, to: t });
  }
  return orders;
}

type Way = 'ai' | 'idle' | 'good';
function run(way: Way, seed: string): string {
  let w = newGame({ mode: 'story', start: '1939', player: way === 'ai' ? null : 'Poland', seed });
  const start = w.day;
  const before = w.units.filter((u) => u.owner === 'Poland').length;
  let warsaw = '';
  let army = before;
  let held = POLAND.length;
  for (let d = 0; d < 150; d++) {
    w = advance(w, d === 0 && way === 'good' ? goodPlayer(w) : []);
    // The news of a day is dated the day before the morning the world now shows.
    const today = dateLabel({ startDate: w.startDate, day: w.day - 1 });
    if (w.capitulated.includes('Poland')) {
      warsaw ||= 'the day it surrendered';
      break;
    }
    army = w.units.filter((u) => u.owner === 'Poland').length;
    held = POLAND.filter((p) => w.controller[p.id] === 'Poland').length;
    if (!warsaw && w.controller[WARSAW] !== 'Poland') warsaw = today;
  }
  const fell = w.diplomacy.log.find((e) => /^Poland surrenders/.test(e.text));
  const end = fell ? `${dateLabel({ startDate: w.startDate, day: fell.day })} (day ${fell.day - start + 1})` : `still fighting on ${dateLabel(w)}`;
  return `| ${way === 'ai' ? 'AI' : way === 'idle' ? 'Player, no orders' : 'Player, holds Warsaw and Kraków'} | ${seed} | ${warsaw || 'never'} | ${end} | ${army} of ${before} | ${held} of ${POLAND.length} |`;
}

const rows: string[] = [];
for (const way of ['ai', 'idle', 'good'] as Way[]) for (const seed of SEEDS) {
  rows.push(run(way, seed));
  console.log(rows[rows.length - 1]);
}
const report = `# How long Poland lasts, ${process.argv[3] ?? 'version 1.4.1'}

The September 1939 start, everyone but Poland led by the AI. Made by \`npx vite-node scripts/poland.ts\`.
Real history: Germany attacked on 1 September 1939 and the Soviet Union on 17 September. Warsaw
gave in on 28 September; the last Polish troops stopped fighting on 6 October (day 36).

| Poland led by | Seed | Warsaw falls | Poland surrenders | Polish divisions just before | Provinces still Polish just before |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
const file = process.argv[2] ?? 'docs/balance-1.4.1-poland.md';
const marker = '\n## What the results say';
const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
fs.writeFileSync(file, report + (old.includes(marker) ? old.slice(old.indexOf(marker)) : ''));
console.log(`Written to ${file}`);
