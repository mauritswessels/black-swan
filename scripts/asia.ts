/**
 * One AI-only Story run, watched from East Asia: the war in China, the border incidents with the
 * Soviet Union and China's prices, month by month (version 1.8).
 *   npx vite-node scripts/asia.ts -- <seed> [end date] [out.json]
 */
import fs from 'node:fs';
import { dayOf } from '../src/sim/agenda';
import { afar, PROVINCES } from '../src/sim/map';
import { newGame } from '../src/sim/scenario';
import { advance } from '../src/sim/game';
import { dateLabel } from '../src/sim/world';

const args = process.argv.slice(2).filter((a) => a !== '--');
const seed = args[0] ?? 'asia-1';
const end = args[1] ?? '1942-01-01';
const out = args[2];
const ASIA = ['Japan', 'China', 'Manchukuo', 'Chinese Communists', 'Mongolia'];
let w = newGame({ mode: 'story', start: '1936', player: null, seed });
const china = PROVINCES.filter((p) => p.owner === 'China');
const total = china.reduce((a, p) => a + p.victoryPoints, 0);
const named = ['Peiping', 'Shanghai', 'Kiangsu', 'Hupeh', 'Kwangtung', 'Chungking', 'Shensi', 'Primorye', 'Eastern Mongolia'].map((n) => PROVINCES.find((p) => p.name === n)!);
const rows: any[] = [];
const log: string[] = [];
let last = -1;
const t0 = Date.now();
const days = dayOf('1936-01-01', end);
for (let d = 0; d < days; d++) {
  w = advance(w);
  for (const e of w.diplomacy.log) {
    if (e.id <= last) continue;
    last = e.id;
    if (e.countries.some((c) => ASIA.includes(c))) log.push(`${dateLabel({ startDate: w.startDate, day: e.day })}: ${e.text}`);
  }
  if (!/^1 /.test(dateLabel(w))) continue;
  const n = (c: string, f: (p: number) => boolean = () => true) => w.units.filter((u) => u.owner === c && f(u.at)).length;
  const lost = china.filter((p) => w.controller[p.id] !== 'China').reduce((a, p) => a + p.victoryPoints, 0);
  const e = w.economies.China;
  const j = w.economies.Japan;
  rows.push({
    date: dateLabel(w),
    jap: n('Japan'), japChina: n('Japan', (p) => PROVINCES[p].owner === 'China'), japMan: n('Japan', (p) => PROVINCES[p].owner === 'Manchukuo'),
    chi: n('China'), ccp: n('Chinese Communists'), sovEast: n('Soviet Union', (p) => afar('Soviet Union', p)),
    chinaLost: Math.round((100 * lost) / total), held: named.map((p) => `${p.name}:${w.controller[p.id].slice(0, 3)}`).join(' '),
    chiPrice: Math.round(e.priceLevel), chiInf: Math.round(e.inflation), chiStab: Math.round(e.stability), japPrice: Math.round(j.priceLevel), japInf: Math.round(j.inflation),
    asiaBattles: w.battles.filter((b) => b.province >= 280).length, wars: w.wars.filter((k) => k.split('|').some((c) => ASIA.includes(c))).join(', '),
  });
}
const res = { seed, rows, log, ms: (Date.now() - t0) / days };
if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
else {
  for (const r of rows) console.log(JSON.stringify(r));
  console.log(log.join('\n'));
  console.log(`${res.ms.toFixed(1)} ms a day`);
}
