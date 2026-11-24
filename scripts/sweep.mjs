// Runs scripts/track.ts for many seeds in parallel and prints a table.
//   node scripts/sweep.mjs <label> <1936|1939> <n> [jobs] [first seed number, default 1]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [label = 'run', start = '1936', n = '8', jobs = '4', from = '1'] = process.argv.slice(2);
const dir = `/tmp/sweep/${label}`;
fs.mkdirSync(dir, { recursive: true });
const seeds = Array.from({ length: Number(n) }, (_, i) => `sweep-${start}-${i + Number(from)}`);
let next = 0;
const run = () => new Promise((resolve) => {
  const go = () => {
    if (next >= seeds.length) return resolve();
    const s = seeds[next++];
    const p = spawn('npx', ['vite-node', 'scripts/track.ts', '--', s, start, `${dir}/${s}.json`], { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('exit', go);
  };
  go();
});
await Promise.all(Array.from({ length: Number(jobs) }, run));
const keys = ['poland', 'france', 'yugoslavia', 'greece', 'moscow', 'italyArmistice', 'germany', 'soviet'];
console.log(`| seed | ${keys.join(' | ')} | ms |`);
for (const s of seeds) {
  const f = `${dir}/${s}.json`;
  if (!fs.existsSync(f)) { console.log(`| ${s} | failed |`); continue; }
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`| ${s} | ${keys.map((k) => r.events[k] ?? '-').join(' | ')} | ${r.ms.toFixed(1)} |`);
}
