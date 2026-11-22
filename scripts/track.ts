/**
 * One AI-only Story run, tracked month by month: when the key events happen and how Germany's
 * war is going. Used by scripts/sweep.mjs to compare many seeds.
 *   npx vite-node scripts/track.ts -- <seed> <1936|1939> [out.json]
 */
import fs from 'node:fs';
import { dayOf } from '../src/sim/agenda';
import { PROVINCES } from '../src/sim/map';
import { newGame } from '../src/sim/scenario';
import { economyView } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { dateLabel } from '../src/sim/world';

const args = process.argv.slice(2).filter((a) => a !== '--');
const seed = args[0] ?? 'track-1';
const start = (args[1] ?? '1936') as '1936' | '1939';
const out = args[2];
const END = '1945-08-01';
let w = newGame({ mode: 'story', start, player: null, seed });
const days = dayOf(start === '1936' ? '1936-01-01' : '1939-09-01', END);
const id = (n: string) => PROVINCES.find((p) => p.name === n)!.id;
const MOSCOW = id('Moscow');
const soviet = PROVINCES.filter((p) => p.owner === 'Soviet Union');
const german = PROVINCES.filter((p) => p.owner === 'Germany');
const events: Record<string, string> = {};
const EV: [string, RegExp][] = [
  ['poland', /^Poland surrenders/], ['france', /^France (surrenders|signs an armistice)/], ['yugoslavia', /^Yugoslavia surrenders/],
  ['greece', /^Greece surrenders/], ['barbarossa', /Germany declares war on (the )?Soviet Union/], ['italyArmistice', /Italy signs an armistice/],
  ['germany', /^Germany surrenders/], ['soviet', /Soviet Union surrenders/], ['uk', /^United Kingdom surrenders/],
];
let last = -1;
const months: any[] = [];
const t0 = Date.now();
for (let d = 0; d < days; d++) {
  w = advance(w);
  for (const e of w.diplomacy.log) {
    if (e.id <= last) continue;
    last = e.id;
    for (const [k, re] of EV) if (!events[k] && re.test(e.text)) events[k] = dateLabel({ startDate: w.startDate, day: e.day });
  }
  if (!events.moscow && w.controller[MOSCOW] !== 'Soviet Union') events.moscow = dateLabel(w);
  const date = dateLabel(w);
  if (/^1 /.test(date) && w.day > 0) {
    const n = (c: string) => w.units.filter((u) => u.owner === c);
    const g = n('Germany');
    const ge = w.economies['Germany'];
    const gv = economyView(w, 'Germany');
    months.push({
      date,
      gDivs: g.length,
      gStr: g.length ? Math.round(g.reduce((a, u) => a + u.strength, 0) / g.length) : 0,
      gMan: Math.round(ge.manpower),
      gMil: Math.floor(gv.mil),
      gStab: Math.round(ge.stability),
      gWS: Math.round(ge.warSupport),
      gInf: Math.round(ge.inflation),
      gLost: german.filter((p) => w.controller[p.id] !== 'Germany').length,
      sLost: soviet.filter((p) => w.controller[p.id] !== 'Soviet Union').length,
      sDivs: n('Soviet Union').length,
      ukDivs: n('United Kingdom').length,
      itDivs: n('Italy').length,
      war: w.wars.length,
    });
  }
  if (events.germany && events.soviet) break;
  if (w.capitulated.includes('Germany')) break;
}
const res = { seed, start, events, months, ms: (Date.now() - t0) / days };
if (out) fs.writeFileSync(out, JSON.stringify(res));
else console.log(JSON.stringify(res, null, 1));
