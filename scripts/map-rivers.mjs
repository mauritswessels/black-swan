/**
 * The great rivers as province borders (Stage K4), used by build-map.mjs.
 *
 * The courses come from Natural Earth's rivers (public domain); the Narew and the Bzura, which it
 * leaves out, are drawn by hand. A border between two provinces counts as a river border when
 *
 *   - at least a third of it runs within 25 km of the river (the river is the border), or
 *   - the straight line between the two provinces' centres crosses the river within 20 km of
 *     their border (the river runs just inside one of them, so an attack has to cross it).
 * A few borders are put right by hand (DROP and EXTRA).
 *
 * Only the main courses matter, so a river is cut off where it stops mattering (MAX_LAT etc.).
 */
import fs from 'node:fs';

const SRC = '.cache/rivers.geojson';
const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson';

/** Each river: the name the game uses, the Natural Earth names that make it up, and an optional box [w, s, e, n] to keep. */
const RIVERS = [
  { name: 'Rhine', ne: ['Rhein', 'Rhine', 'Waal', 'Nederrijn', 'Lek'], box: [3, 47.55, 9, 53] },
  { name: 'Meuse', ne: ['Maas'] },
  { name: 'Seine', ne: ['Seine'], box: [-1, 47.5, 5, 50] },
  { name: 'Loire', ne: ['Loire'], box: [-3, 46.6, 3.2, 48] },
  { name: 'Elbe', ne: ['Elbe'], box: [8, 50.9, 15, 54] },
  { name: 'Oder', ne: ['Oder'], box: [13, 50.9, 19, 54] },
  { name: 'Vistula', ne: ['Vistula'] },
  { name: 'Narew', line: [[23.4, 53.1], [22.8, 53.15], [22.07, 53.18], [21.57, 53.08], [21.08, 52.7], [20.7, 52.43]] },
  { name: 'Warta', ne: ['Warta'] },
  { name: 'Bzura', line: [[19.45, 51.8], [19.6, 52.0], [19.9, 52.2], [20.2, 52.38]] },
  { name: 'Bug', ne: ['Bug', 'Mukhavyets'] },
  { name: 'Neman', ne: ['Nemunas'] },
  { name: 'Western Dvina', ne: ['Zapadnaya Dvina'] },
  { name: 'Dniester', ne: ['Dniester'] },
  { name: 'Prut', ne: ['Prut'] },
  { name: 'Danube', ne: ['Danube'], box: [16.5, 43, 30, 49] },
  { name: 'Dnieper', ne: ['Dnieper', 'Dnepre'] },
  { name: 'Don', ne: ['Don'] },
  { name: 'Volga', ne: ['Volga'], box: [40, 45, 50, 55] },
  { name: 'Svir', ne: ['Svir'] },
  { name: 'Po', ne: ['Po'] },
  { name: 'Ebro', ne: ['Ebro'] },
  { name: 'Suez Canal', ne: ['Suez Canal'] },
];

const NEAR_KM = 25;
const ALONG_SHARE = 1 / 3;
const CROSS_NEAR_KM = 20;
/** Corrections by hand: borders the rules get wrong, by province name. */
const DROP = [['Upper Silesia', 'Moravia'], ['Slovakia', 'Moravia'], ['Lorraine', 'Burgundy'], ['Rzeszów', 'Lwów']]; // the springs of the Vistula, the Seine and the Dniester
const EXTRA = [['Dnieper', 'Kiev', 'Chernigov'], ['Narew', 'Masuria', 'Warsaw']]; // the Dnieper and the Desna north of Kiev; the Narew line north of Warsaw

export async function riverBorders(topo, provinces) {
  if (!fs.existsSync(SRC)) {
    console.log('Downloading Natural Earth rivers (7 MB)...');
    fs.mkdirSync('.cache', { recursive: true });
    fs.writeFileSync(SRC, Buffer.from(await (await fetch(URL)).arrayBuffer()));
  }
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8')).features;
  const km = ([x1, y1], [x2, y2]) => Math.hypot((x2 - x1) * 111.32 * Math.cos((((y1 + y2) / 2) * Math.PI) / 180), (y2 - y1) * 110.57);
  const segDist = (p, a, b) => {
    // Distance from p to segment ab, on a flat map around p.
    const k = Math.cos((p[1] * Math.PI) / 180);
    const [px, py, ax, ay, bx, by] = [p[0] * k, p[1], a[0] * k, a[1], b[0] * k, b[1]];
    const dx = bx - ax, dy = by - ay;
    const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy) * 111;
  };
  const crossAt = (a, b, c, d) => {
    const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
    if (!den) return null;
    const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
    const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])] : null;
  };

  // The shared border of each pair of provinces, as points.
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map((arc) => { let x = 0, y = 0; return arc.map(([dx, dy]) => [(x += dx) * scale[0] + translate[0], (y += dy) * scale[1] + translate[1]]); });
  const users = new Map();
  topo.objects.provinces.geometries.forEach((g, id) => {
    const walk = (a) => (Array.isArray(a) ? a.forEach(walk) : (users.get(a < 0 ? ~a : a) ?? users.set(a < 0 ? ~a : a, new Set()).get(a < 0 ? ~a : a)).add(id));
    walk(g.arcs);
  });
  const border = new Map();
  for (const [arc, ids] of users) {
    if (ids.size !== 2) continue;
    const [a, b] = [...ids].sort((x, y) => x - y);
    const pts = border.get(`${a},${b}`) ?? border.set(`${a},${b}`, []).get(`${a},${b}`);
    // Add points every few km so long straight edges count for their length.
    const line = arcs[arc];
    for (let i = 0; i < line.length - 1; i++) {
      const n = Math.max(1, Math.ceil(km(line[i], line[i + 1]) / 5));
      for (let k = 0; k < n; k++) pts.push([line[i][0] + ((line[i + 1][0] - line[i][0]) * k) / n, line[i][1] + ((line[i + 1][1] - line[i][1]) * k) / n]);
    }
  }

  const out = [];
  for (const r of RIVERS) {
    const lines = r.line ? [r.line] : raw.filter((f) => r.ne.includes(f.properties.name_en || f.properties.name) || r.ne.includes(f.properties.name)).flatMap((f) => (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates));
    const inBox = (p) => !r.box || (p[0] >= r.box[0] && p[0] <= r.box[2] && p[1] >= r.box[1] && p[1] <= r.box[3]);
    const segs = [];
    for (const l of lines) for (let i = 0; i < l.length - 1; i++) if (inBox(l[i]) && inBox(l[i + 1]) && l[i][0] > -11 && l[i][0] < 50 && l[i][1] > 29) segs.push([l[i], l[i + 1]]);
    if (!segs.length) throw new Error(`River ${r.name}: no course found`);
    // Bucket the river into half-degree cells so distances are quick.
    const cell = (x, y) => `${Math.floor(x * 2)},${Math.floor(y * 2)}`;
    const grid = new Map();
    for (const s of segs) {
      const [x0, x1] = [Math.min(s[0][0], s[1][0]), Math.max(s[0][0], s[1][0])], [y0, y1] = [Math.min(s[0][1], s[1][1]), Math.max(s[0][1], s[1][1])];
      for (let x = Math.floor(x0 * 2); x <= Math.floor(x1 * 2); x++) for (let y = Math.floor(y0 * 2); y <= Math.floor(y1 * 2); y++) (grid.get(`${x},${y}`) ?? grid.set(`${x},${y}`, []).get(`${x},${y}`)).push(s);
    }
    const near = (p) => {
      let best = Infinity;
      const [cx, cy] = [Math.floor(p[0] * 2), Math.floor(p[1] * 2)];
      for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const s of grid.get(`${x},${y}`) ?? []) best = Math.min(best, segDist(p, s[0], s[1]));
      return best;
    };
    const borders = [];
    for (const [key, pts] of border) {
      const [a, b] = key.split(',').map(Number);
      const along = pts.filter((p) => near(p) <= NEAR_KM).length / pts.length;
      let crossed = false;
      if (along < ALONG_SHARE) {
        const ca = provinces[a].centre, cb = provinces[b].centre;
        for (const s of segs) {
          const x = crossAt(ca, cb, s[0], s[1]);
          if (x && pts.some((p) => km(p, x) <= CROSS_NEAR_KM)) { crossed = true; break; }
        }
      }
      if (along >= ALONG_SHARE || crossed) borders.push([a, b]);
    }
    out.push({ name: r.name, borders });
  }
  // A border keeps only the first river found on it (the list is roughly from west to east).
  const seen = new Set();
  for (const r of out) r.borders = r.borders.filter(([a, b]) => !seen.has(`${a},${b}`) && seen.add(`${a},${b}`));
  const id = (name) => { const i = provinces.findIndex((p) => p.name === name); if (i < 0) throw new Error(`Rivers: no province ${name}`); return i; };
  const drop = new Set(DROP.map(([a, b]) => [id(a), id(b)].sort((x, y) => x - y).join(',')));
  for (const r of out) r.borders = r.borders.filter(([a, b]) => !drop.has(`${a},${b}`));
  for (const [river, a, b] of EXTRA) {
    if (!provinces[id(a)].neighbours.includes(id(b))) throw new Error(`Rivers: ${a} and ${b} do not touch`);
    const pair = [id(a), id(b)].sort((x, y) => x - y);
    if (!out.some((r) => r.borders.some(([x, y]) => x === pair[0] && y === pair[1]))) out.find((r) => r.name === river).borders.push(pair);
  }
  return out.filter((r) => r.borders.length);
}
