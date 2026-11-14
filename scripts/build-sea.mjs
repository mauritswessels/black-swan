/**
 * Builds the sea zones of the game map.
 *
 *   npm run build:sea
 *
 * Each zone is a rough outline drawn by hand in [longitude, latitude]. The outlines may run
 * over land (the map draws land on top of them); what matters is where they meet at sea.
 * A province touches a zone when a stretch of its coastline lies inside the zone's outline.
 * Coastline = the edges of a province that no other province shares. The result goes to
 * src/content/map/sea.json.
 *
 * Not modelled: the Caspian Sea, the Red Sea and the Persian Gulf (nothing sails there in the
 * game), and the narrow straits (Gibraltar, the Bosporus, Suez), which anyone may pass.
 */
import fs from 'node:fs';

const ZONES = [
  { id: 'barents', name: 'Barents Sea', label: [38, 71.5], outline: [[20, 69.3], [28, 69.3], [31, 63.5], [46, 63.5], [46, 76], [20, 76]] },
  { id: 'norwegian', name: 'Norwegian Sea', label: [3, 66], outline: [[-30, 62], [5, 62], [20, 69.3], [20, 76], [-30, 76]] },
  { id: 'north', name: 'North Sea', label: [3, 56.5], outline: [[-4, 62], [5, 62], [7, 61], [9.5, 60.5], [11.3, 60], [11.2, 58.9], [10.6, 57.75], [9.5, 56.5], [9.3, 54.3], [9, 53], [5, 52], [1.9, 50.95], [1.4, 51.1], [0, 51.3], [-1, 52.5], [-2.5, 55], [-4, 57.5]] },
  { id: 'channel', name: 'English Channel', label: [-2.2, 49.9], outline: [[1.4, 51.1], [1.9, 50.95], [1.5, 49], [-1.5, 48.2], [-4.8, 48.3], [-5.7, 50.05], [-3, 51], [0, 51.3]] },
  { id: 'approaches', name: 'Western Approaches', label: [-11.5, 53], outline: [[-30, 62], [-4, 62], [-4, 57.5], [-2.5, 55], [-1, 52.5], [0, 51.3], [-3, 51], [-5.7, 50.05], [-4.8, 48.3], [-30, 48.3]] },
  { id: 'biscay', name: 'Bay of Biscay', label: [-6, 45.6], outline: [[-30, 48.3], [-4.8, 48.3], [-1.5, 48.2], [0, 45], [-1, 43], [-5, 42.5], [-9.3, 43], [-30, 43]] },
  { id: 'iberian', name: 'Iberian Coast', label: [-12, 38], outline: [[-30, 43], [-9.3, 43], [-8, 40], [-7.5, 37.8], [-5.6, 36.05], [-5.6, 35.8], [-6, 33], [-9, 29], [-9, 22], [-30, 22]] },
  { id: 'westmed', name: 'Western Mediterranean', label: [4.5, 38.6], outline: [[-5.6, 36.05], [-5.6, 35.8], [-4, 34], [3, 35], [8.5, 36], [9.8, 37.35], [9, 38.9], [9.1, 41], [9.2, 42.5], [9.45, 43], [10.5, 42.95], [10.5, 44.5], [7, 45], [3, 44.5], [0, 42.5], [-1, 40], [-3, 37.8], [-5.2, 36.9]] },
  { id: 'tyrrhenian', name: 'Tyrrhenian Sea', label: [12, 39.8], outline: [[9.45, 43], [10.5, 42.95], [12.5, 42.5], [15, 40.8], [16.2, 39.3], [15.65, 38.25], [14, 37.7], [12.4, 37.85], [11.05, 37.1], [10.2, 36.4], [9.5, 36.9], [9.8, 37.35], [9, 38.9], [9.1, 41], [9.2, 42.5]] },
  { id: 'centralmed', name: 'Central Mediterranean', label: [17.5, 34.5], outline: [[11.05, 37.1], [12.4, 37.85], [14, 37.7], [15.65, 38.25], [16.2, 39.3], [16.6, 40.9], [18, 40.7], [18.5, 40.15], [19.4, 40.25], [20.8, 39.5], [22, 38.6], [22.2, 37.6], [22.5, 36.4], [23.6, 35.25], [25.15, 31.6], [25, 24], [10, 24], [9.5, 33], [10.2, 36.4]] },
  { id: 'adriatic', name: 'Adriatic Sea', label: [15.6, 43], outline: [[18.5, 40.15], [18, 40.7], [16.6, 40.9], [15, 41.4], [13, 43], [11.8, 44.5], [12, 46], [14.3, 45.9], [16, 44.6], [18, 43.4], [19.8, 42], [20, 41], [19.4, 40.25]] },
  { id: 'aegean', name: 'Aegean Sea', label: [25, 38.2], outline: [[22.5, 36.4], [22.2, 37.6], [22, 38.6], [21.5, 39.5], [22, 40.8], [24, 41.5], [26.5, 41.3], [28.6, 41.3], [29.1, 41.15], [30.1, 40.9], [30, 40.2], [27.5, 39.5], [28.5, 37.5], [28.2, 36.7], [27.9, 35.9], [26.3, 35.2], [23.6, 35.25]] },
  { id: 'eastmed', name: 'Eastern Mediterranean', label: [30.5, 33.3], outline: [[23.6, 35.25], [26.3, 35.2], [27.9, 35.9], [28.2, 36.7], [30, 37.5], [34, 37.4], [36.6, 37.2], [36.6, 34], [35.4, 31.5], [34.3, 30.6], [32, 30.3], [29, 30.2], [25.15, 30.8], [25.15, 31.6]] },
  { id: 'black', name: 'Black Sea', label: [34, 43.3], outline: [[29.1, 41.15], [28.6, 41.3], [27.3, 41.5], [27.3, 43.5], [28, 45.5], [30, 47], [33, 47], [35, 47.5], [40.5, 47.5], [40.5, 45], [40.3, 43.8], [42.3, 42.3], [42, 41.3], [40, 40.6], [36, 40.8], [33, 41.2], [30.1, 40.9]] },
  { id: 'kattegat', name: 'Danish Straits', label: [11.4, 56.6], outline: [[10.6, 57.75], [11.2, 58.9], [12.6, 58.3], [13.3, 56.3], [12.9, 55.4], [12.5, 54.4], [11.5, 53.6], [9.6, 53.9], [9.3, 54.3], [9.5, 56.5]] },
  { id: 'baltic', name: 'Baltic Sea', label: [18.6, 56.3], outline: [[12.5, 54.4], [12.9, 55.4], [13.3, 56.3], [15, 57.5], [17, 59.6], [18.9, 59.95], [22.5, 59], [23.6, 58.9], [24.3, 59], [25.5, 58], [25, 56.5], [22, 55.3], [21, 54.2], [18.5, 53.8], [14.5, 53.3], [12.8, 53.8]] },
  { id: 'bothnia', name: 'Gulfs of Finland and Bothnia', label: [20, 62], outline: [[18.9, 59.95], [17, 59.6], [16.5, 61], [17.5, 63], [20, 64.5], [22, 66.2], [25, 66.2], [26.5, 65], [24, 63], [23, 61.5], [24, 60.8], [26, 60.9], [29, 61], [30.8, 60.3], [30.5, 59.5], [28, 59.1], [24.3, 59], [23.6, 58.9], [22.5, 59]] },
];
/** Which zones a ship can sail between directly. */
const LINKS = [
  ['barents', 'norwegian'], ['norwegian', 'north'], ['norwegian', 'approaches'], ['north', 'approaches'], ['north', 'channel'], ['north', 'kattegat'],
  ['channel', 'approaches'], ['approaches', 'biscay'], ['biscay', 'iberian'], ['iberian', 'westmed'], ['westmed', 'tyrrhenian'], ['tyrrhenian', 'centralmed'],
  ['centralmed', 'adriatic'], ['centralmed', 'aegean'], ['centralmed', 'eastmed'], ['aegean', 'eastmed'], ['aegean', 'black'], ['kattegat', 'baltic'], ['baltic', 'bothnia'],
];

const inside = ([x, y], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

const topo = JSON.parse(fs.readFileSync('src/content/map/europe1936.topo.json', 'utf8'));
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => [(x += dx) * scale[0] + translate[0], (y += dy) * scale[1] + translate[1]]);
});
// Which provinces use each arc? An arc used by one province only is coastline (or the edge of the map).
const users = new Map();
topo.objects.provinces.geometries.forEach((g, id) => {
  const walk = (a) => (Array.isArray(a) ? a.forEach(walk) : (users.get(a < 0 ? ~a : a) ?? users.set(a < 0 ? ~a : a, new Set()).get(a < 0 ? ~a : a)).add(id));
  walk(g.arcs);
});
const coast = {};
for (const [arc, ids] of users) {
  if (ids.size !== 1) continue;
  const [id] = ids;
  const found = new Map();
  for (const point of arcs[arc]) for (let z = 0; z < ZONES.length; z++) if (inside(point, ZONES[z].outline)) found.set(z, (found.get(z) ?? 0) + 1);
  for (const [z, n] of found) if (n >= 2) (coast[id] ??= new Set()).add(z);
}
const out = {
  zones: ZONES.map((z) => ({ ...z, neighbours: LINKS.filter((l) => l.includes(z.id)).map((l) => ZONES.findIndex((o) => o.id === (l[0] === z.id ? l[1] : l[0]))).sort((a, b) => a - b) })),
  coast: Object.fromEntries(Object.entries(coast).map(([id, set]) => [id, [...set].sort((a, b) => a - b)])),
};
fs.writeFileSync('src/content/map/sea.json', JSON.stringify(out));
const provinces = JSON.parse(fs.readFileSync('src/content/map/europe1936.json', 'utf8')).provinces;
for (let z = 0; z < ZONES.length; z++) console.log(`${ZONES[z].name}: ${Object.keys(out.coast).filter((id) => out.coast[id].includes(z)).map((id) => provinces[id].name).join(', ')}`);
console.log(`${Object.keys(out.coast).length} of ${provinces.length} provinces have a coast.`);
