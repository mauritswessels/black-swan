/**
 * One AI-only Story run, watched from the Atlantic (version 1.9): American opinion, Lend-Lease
 * convoys and losses, the American and Dominion armies at home and abroad, month by month.
 *   npx vite-node scripts/atlantic.ts -- <seed> [end date] [start 1936|1939] [out.json]
 */
import fs from 'node:fs';
import { dayOf } from '../src/sim/agenda';
import { ATLANTIC } from '../src/sim/countries';
import { tallies } from '../src/sim/economy';
import { PROVINCES } from '../src/sim/map';
import { newGame } from '../src/sim/scenario';
import { advance } from '../src/sim/game';
import { dateLabel } from '../src/sim/world';

const args = process.argv.slice(2).filter((a) => a !== '--');
const seed = args[0] ?? 'atlantic-1';
const end = args[1] ?? '1945-05-08';
const start = (args[2] ?? '1936') as '1936' | '1939';
const out = args[3];
let w = newGame({ mode: 'story', start, player: null, seed });
const rows: any[] = [];
const log: string[] = [];
let last = -1;
const t0 = Date.now();
const days = dayOf(w.startDate, end);
const WATCH = [...ATLANTIC, 'Germany', 'Italy', 'France'];
for (let d = 0; d < days; d++) {
  w = advance(w);
  for (const e of w.diplomacy.log) {
    if (e.id <= last) continue;
    last = e.id;
    if (e.countries.some((c) => ATLANTIC.includes(c)) || /Lend-Lease|Torch|Anton|Pearl/.test(e.text)) log.push(`${dateLabel({ startDate: w.startDate, day: e.day })}: ${e.text}`);
  }
  if (!/^1 /.test(dateLabel(w))) continue;
  const t = tallies(w);
  const us = w.economies['United States'];
  const n = (c: string, f: (p: number) => boolean = () => true) => w.units.filter((u) => u.owner === c && f(u.at)).length;
  const ll = w.story.lendLease;
  rows.push({
    date: dateLabel(w),
    usMil: t.get('United States')?.mil, usCiv: t.get('United States')?.civ, ws: Math.round(us.warSupport), cons: us.conscription, ll: us.lendLease ?? 0,
    usDiv: n('United States'), usAbroad: n('United States', (p) => PROVINCES[p].owner !== 'United States'),
    dom: ['Canada', 'Australia', 'New Zealand', 'South Africa'].map((c) => `${c.slice(0, 3)}:${n(c)}/${n(c, (p) => PROVINCES[p].owner !== c)}`).join(' '),
    ship: ll && ll.day >= w.day - 2 ? ll.shipments.map((s) => `${s.route}:${s.sent}-${s.sunk}${s.paid ? '$' + s.paid : ''}`).join(' ') : '',
    deDiv: n('Germany'), wars: w.wars.filter((k) => k.split('|').some((c) => ATLANTIC.includes(c))).length,
    paris: w.controller[PROVINCES.find((p) => p.capital && p.owner === 'France')!.id],
    berlin: w.controller[PROVINCES.find((p) => p.capital && p.owner === 'Germany')!.id],
    out: w.capitulated.filter((c) => WATCH.includes(c) || ['Soviet Union', 'United Kingdom'].includes(c)).join(','),
  });
  if (w.capitulated.includes('Germany') && w.story.ended) break;
}
const res = { seed, rows, log, ms: (Date.now() - t0) / days };
if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
else {
  for (const r of rows) console.log(JSON.stringify(r));
  console.log(log.join('\n'));
  console.log(`${res.ms.toFixed(1)} ms a day`);
}
