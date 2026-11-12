/**
 * Builds the game map of Europe on 1 January 1936.
 *
 *   npm run build:map
 *
 * Source: Natural Earth "admin 1 states and provinces" (public domain, naturalearthdata.com).
 * That data shows TODAY's regions. This script:
 *   1. keeps the regions inside the game area,
 *   2. gives each one to the country that held it in 1936 (see owner1936 below),
 *   3. merges neighbouring regions into about 160 game provinces,
 *   4. works out which provinces touch, and writes the result to src/content/map/.
 *
 * Because it is built from modern regions, borders that ran through the middle of a modern
 * region are approximate. Known gaps are listed in KNOWN_GAPS and printed in the README.
 */
import fs from 'node:fs';
import { topology } from 'topojson-server';
import { merge, neighbors, feature } from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoArea, geoCentroid, geoContains, geoDistance } from 'd3-geo';

const SRC = '.cache/admin1.geojson';
const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
if (!fs.existsSync(SRC)) {
  console.log('Downloading Natural Earth data (40 MB)...');
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(SRC, Buffer.from(await (await fetch(URL)).arrayBuffer()));
}
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8')).features;

// ---------- 1 and 2: who held each modern region in 1936 ----------
const SOVIET = ['Russia', 'Ukraine', 'Belarus', 'Georgia', 'Armenia', 'Azerbaijan'];
const YUGO = ['Republic of Serbia', 'Croatia', 'Slovenia', 'Bosnia and Herzegovina', 'Montenegro', 'Macedonia', 'Kosovo'];
const SAME = ['Germany', 'France', 'Italy', 'Poland', 'Spain', 'Portugal', 'Ireland', 'Belgium', 'Netherlands', 'Luxembourg', 'Switzerland', 'Austria',
  'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Albania', 'Turkey', 'Denmark', 'Norway', 'Sweden', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Egypt', 'Iraq'];
const BRITISH = ['United Kingdom', 'Jersey', 'Guernsey', 'Isle of Man', 'Gibraltar', 'Malta', 'Cyprus', 'Northern Cyprus', 'Dhekelia Sovereign Base Area',
  'Akrotiri Sovereign Base Area', 'Israel', 'Gaza Strip', 'West Bank', 'Jordan'];
const FRENCH = ['Algeria', 'Tunisia', 'Morocco', 'Syria', 'Lebanon'];
/** Modern regions that belonged to a different country in 1936: "Modern country/Region name" -> 1936 owner. */
const MOVED = {
  'Poland/Lower Silesian': 'Germany', 'Poland/Opole': 'Germany', 'Poland/Lubusz': 'Germany', 'Poland/West Pomeranian': 'Germany',
  'Poland/Warmian-Masurian': 'Germany', 'Russia/Kaliningrad': 'Germany',
  "Ukraine/L'viv": 'Poland', "Ukraine/Ternopil'": 'Poland', "Ukraine/Ivano-Frankivs'k": 'Poland', 'Ukraine/Volyn': 'Poland', 'Ukraine/Rivne': 'Poland',
  'Belarus/Brest': 'Poland', 'Belarus/Grodno': 'Poland', 'Lithuania/Vilniaus': 'Poland',
  'Ukraine/Transcarpathia': 'Czechoslovakia', 'Ukraine/Chernivtsi': 'Romania',
  'Bulgaria/Dobrich': 'Romania', 'Bulgaria/Silistra': 'Romania',
  'Croatia/Istarska': 'Italy', 'Turkey/Hatay': 'France',
};
export const KNOWN_GAPS = [
  'The Free City of Danzig is shown as part of Poland.',
  'The Polish-Soviet and Polish-German borders follow modern regional lines, so they are a few dozen kilometres off in places.',
  'Finnish Karelia (around Viipuri) is shown as Soviet, because it lies inside a modern Russian region.',
  'The Italian territories around Trieste, Zara and the Dodecanese islands are shown as Yugoslav or Greek, except Istria.',
  'Spanish Morocco is shown as part of French Morocco.',
  'Southern Bessarabia and Transnistria follow the modern Moldovan border.',
];

function owner1936(p) {
  const moved = MOVED[`${p.admin}/${p.name}`];
  if (moved) return moved;
  if (SOVIET.includes(p.admin)) return 'Soviet Union';
  if (YUGO.includes(p.admin)) return 'Yugoslavia';
  if (p.admin === 'Czech Republic' || p.admin === 'Slovakia') return 'Czechoslovakia';
  if (p.admin === 'Moldova') return 'Romania';
  if (p.admin === 'Libya') return 'Italy';
  if (p.admin === 'Aland') return 'Finland';
  if (BRITISH.includes(p.admin)) return 'United Kingdom';
  if (FRENCH.includes(p.admin)) return 'France';
  if (SAME.includes(p.admin)) return p.admin;
  return null;
}

/** The game area: Europe, the north coast of Africa and the Near East. */
function inArea(p) {
  const { longitude: lon, latitude: lat } = p;
  if (lon == null || lat == null) return false;
  if (lon < -11 || lon > 50 || lat > 71.5) return false;
  const africaOrArabia = ['Algeria', 'Tunisia', 'Morocco', 'Libya', 'Egypt', 'Iraq', 'Jordan', 'Syria', 'Lebanon', 'Israel', 'Gaza Strip', 'West Bank'].includes(p.admin);
  if (lat < (africaOrArabia ? 29.5 : 34)) return false;
  if (p.admin === 'Russia' && lon > 49) return false;
  return true;
}

// ---------- 3: groups of regions, and how many provinces each becomes ----------
/** [1936 owner, zone name, number of provinces, test]. A region goes to the first zone whose test passes. */
const A = (...names) => (p) => names.includes(p.admin);
const ZONES = [
  ['Germany', 'East Prussia', 1, (p) => p.name === 'Kaliningrad' || p.name === 'Warmian-Masurian'],
  ['Germany', 'Germany', 14, () => true],
  ['France', 'Corsica', 1, (p) => p.region === 'Corse'],
  ['France', 'Algeria', 2, A('Algeria')], ['France', 'Tunisia', 1, A('Tunisia')], ['France', 'Morocco', 2, A('Morocco')],
  ['France', 'Levant', 2, (p) => ['Syria', 'Lebanon'].includes(p.admin) || p.name === 'Hatay'],
  ['France', 'France', 13, () => true],
  ['United Kingdom', 'Northern Ireland', 1, (p) => p.geonunit === 'Northern Ireland'],
  ['United Kingdom', 'Malta', 1, A('Malta')], ['United Kingdom', 'Gibraltar', 1, A('Gibraltar')],
  ['United Kingdom', 'Cyprus', 1, A('Cyprus', 'Northern Cyprus', 'Dhekelia Sovereign Base Area', 'Akrotiri Sovereign Base Area')],
  ['United Kingdom', 'Palestine', 1, A('Israel', 'Gaza Strip', 'West Bank')], ['United Kingdom', 'Transjordan', 1, A('Jordan')],
  ['United Kingdom', 'Great Britain', 8, () => true],
  ['Italy', 'Libya', 2, A('Libya')], ['Italy', 'Sardinia', 1, (p) => p.region === 'Sardegna'], ['Italy', 'Sicily', 1, (p) => p.region === 'Sicily'],
  ['Italy', 'Italy', 9, () => true],
  ['Soviet Union', 'Caucasus', 3, A('Georgia', 'Armenia', 'Azerbaijan')], ['Soviet Union', 'Ukraine', 7, A('Ukraine')],
  ['Soviet Union', 'Belarus', 2, A('Belarus')], ['Soviet Union', 'Russia', 16, () => true],
  ['Poland', 'Poland', 10, () => true], ['Spain', 'Balearic Islands', 1, (p) => p.name === 'Baleares'], ['Spain', 'Spain', 8, () => true],
  ['Turkey', 'Turkey', 8, () => true], ['Romania', 'Romania', 6, () => true], ['Yugoslavia', 'Yugoslavia', 6, () => true],
  ['Czechoslovakia', 'Czechoslovakia', 4, () => true], ['Hungary', 'Hungary', 3, () => true], ['Austria', 'Austria', 3, () => true],
  ['Sweden', 'Sweden', 5, () => true], ['Norway', 'Norway', 4, () => true], ['Finland', 'Finland', 4, () => true],
  ['Greece', 'Crete', 1, (p) => p.name === 'Kriti'], ['Greece', 'Greece', 4, () => true], ['Bulgaria', 'Bulgaria', 3, () => true],
  ['Portugal', 'Portugal', 2, () => true], ['Belgium', 'Belgium', 2, () => true], ['Netherlands', 'Netherlands', 2, () => true],
  ['Switzerland', 'Switzerland', 2, () => true], ['Denmark', 'Denmark', 2, () => true], ['Ireland', 'Ireland', 2, () => true],
  ['Egypt', 'Egypt', 3, () => true], ['Iraq', 'Iraq', 2, () => true],
  ['Albania', 'Albania', 1, () => true], ['Lithuania', 'Lithuania', 1, () => true], ['Latvia', 'Latvia', 1, () => true],
  ['Estonia', 'Estonia', 1, () => true], ['Luxembourg', 'Luxembourg', 1, () => true],
];

const kept = [];
for (let f of raw) {
  const p = f.properties;
  if (!inArea(p) || p.name === 'Svalbard') continue;
  const owner = owner1936(p);
  if (!owner) continue;
  const zone = ZONES.findIndex((z) => z[0] === owner && z[3](p));
  if (zone < 0) throw new Error(`No zone for ${p.admin}/${p.name}`);
  // Drop far-away pieces of a region, such as Arctic islands.
  let geometry = f.geometry;
  if (geometry.type === 'MultiPolygon') {
    const parts = geometry.coordinates.filter((poly) => { const [lon, lat] = geoCentroid({ type: 'Polygon', coordinates: poly }); return lat < 72 && lat > 28 && lon > -12 && lon < 52; });
    if (!parts.length) continue;
    geometry = { type: 'MultiPolygon', coordinates: parts };
  }
  f = { ...f, geometry };
  kept.push({ type: 'Feature', geometry, properties: { name: p.name_en || p.name, owner, zone, area: geoArea(f), c: geoCentroid(f) } });
}

// Seeded random numbers (same generator as the game) so the map is identical on every build.
let s = 1936;
const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/** Group the regions of one zone into k compact provinces (k-means on their centres, weighted by area). */
function cluster(items, k) {
  if (k >= items.length) return items.map((_, i) => i);
  const flat = items.map((f) => { const [lon, lat] = f.properties.c; return [lon * Math.cos((lat * Math.PI) / 180), lat]; });
  let best = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    // k-means++ start
    const centres = [flat[Math.floor(rnd() * flat.length)]];
    while (centres.length < k) {
      const d = flat.map((p) => Math.min(...centres.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2)));
      let r = rnd() * d.reduce((a, b) => a + b, 0), i = 0;
      while (i < d.length - 1 && (r -= d[i]) > 0) i++;
      centres.push(flat[i]);
    }
    let assign = [];
    for (let it = 0; it < 40; it++) {
      assign = flat.map((p) => { let bi = 0, bd = Infinity; centres.forEach((c, i) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (dd < bd) { bd = dd; bi = i; } }); return bi; });
      for (let i = 0; i < k; i++) {
        let w = 0, x = 0, y = 0;
        flat.forEach((p, j) => { if (assign[j] === i) { const a = items[j].properties.area; w += a; x += p[0] * a; y += p[1] * a; } });
        if (w > 0) centres[i] = [x / w, y / w];
      }
    }
    const cost = flat.reduce((sum, p, j) => sum + items[j].properties.area * ((p[0] - centres[assign[j]][0]) ** 2 + (p[1] - centres[assign[j]][1]) ** 2), 0);
    const used = new Set(assign).size;
    if (used === k && (!best || cost < best.cost)) best = { cost, assign };
  }
  if (!best) throw new Error('clustering failed');
  return best.assign;
}

const provinceOf = new Array(kept.length);
const provinces = [];
ZONES.forEach((z, zi) => {
  const idx = kept.map((f, i) => (f.properties.zone === zi ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) throw new Error(`Zone ${z[1]} is empty`);
  const assign = cluster(idx.map((i) => kept[i]), z[2]);
  const ids = {};
  idx.forEach((i, j) => {
    const key = assign[j];
    if (!(key in ids)) { ids[key] = provinces.length; provinces.push({ owner: z[0], zone: z[1], members: [] }); }
    provinceOf[i] = ids[key];
    provinces[ids[key]].members.push(i);
  });
});

// ---------- 4: merge, simplify, find neighbours ----------
let topo = topology({ regions: { type: 'FeatureCollection', features: kept } }, 1e5);
const merged = provinces.map((p) => merge(topo, p.members.map((i) => topo.objects.regions.geometries[i])));
let ptopo = topology({ provinces: { type: 'GeometryCollection', geometries: merged } }, 1e5);
ptopo = presimplify(ptopo);
ptopo = simplify(ptopo, quantile(ptopo, 0.12));
const geoms = ptopo.objects.provinces.geometries;
const nb = neighbors(geoms);

const CAPITALS = {
  'United Kingdom': ['London', -0.12, 51.5], France: ['Paris', 2.35, 48.86], Germany: ['Berlin', 13.4, 52.52], Italy: ['Rome', 12.5, 41.9],
  'Soviet Union': ['Moscow', 37.62, 55.75], Poland: ['Warsaw', 21.01, 52.23], Spain: ['Madrid', -3.7, 40.42], Portugal: ['Lisbon', -9.14, 38.72],
  Ireland: ['Dublin', -6.26, 53.35], Belgium: ['Brussels', 4.35, 50.85], Netherlands: ['Amsterdam', 4.9, 52.37], Luxembourg: ['Luxembourg', 6.13, 49.61],
  Switzerland: ['Bern', 7.45, 46.95], Austria: ['Vienna', 16.37, 48.21], Czechoslovakia: ['Prague', 14.42, 50.08], Hungary: ['Budapest', 19.04, 47.5],
  Romania: ['Bucharest', 26.1, 44.43], Yugoslavia: ['Belgrade', 20.46, 44.8], Bulgaria: ['Sofia', 23.32, 42.7], Greece: ['Athens', 23.73, 37.98],
  Albania: ['Tirana', 19.82, 41.33], Turkey: ['Ankara', 32.85, 39.93], Denmark: ['Copenhagen', 12.57, 55.68], Norway: ['Oslo', 10.75, 59.91],
  Sweden: ['Stockholm', 18.07, 59.33], Finland: ['Helsinki', 24.94, 60.17], Estonia: ['Tallinn', 24.75, 59.44], Latvia: ['Riga', 24.11, 56.95],
  Lithuania: ['Kaunas', 23.9, 54.9], Egypt: ['Cairo', 31.24, 30.04], Iraq: ['Baghdad', 44.37, 33.31],
};
/** Other important cities: [name, lon, lat, victory points]. */
const CITIES = [
  ['Leningrad', 30.31, 59.94, 15], ['Kiev', 30.52, 50.45, 10], ['Stalingrad', 44.52, 48.71, 8], ['Minsk', 27.56, 53.9, 5], ['Baku', 49.87, 40.41, 8],
  ['Hamburg', 9.99, 53.55, 8], ['Munich', 11.58, 48.14, 8], ['Cologne', 6.96, 50.94, 8], ['Königsberg', 20.51, 54.71, 5], ['Breslau', 17.04, 51.11, 5],
  ['Marseille', 5.37, 43.3, 8], ['Lyon', 4.84, 45.76, 6], ['Algiers', 3.06, 36.75, 5], ['Manchester', -2.24, 53.48, 8], ['Glasgow', -4.25, 55.86, 6],
  ['Milan', 9.19, 45.46, 10], ['Naples', 14.27, 40.85, 6], ['Tripoli', 13.19, 32.89, 3], ['Barcelona', 2.17, 41.39, 8], ['Kraków', 19.94, 50.06, 6],
  ['Lwów', 24.03, 49.84, 5], ['Istanbul', 28.98, 41.01, 10], ['Alexandria', 29.92, 31.2, 5], ['Gothenburg', 11.97, 57.71, 4], ['Rotterdam', 4.48, 51.92, 5],
];


/** Historical region names, used to name each province: [name, lon, lat]. A province takes the listed place nearest its centre. */
const PLACES = [
  ['Saxony', 13.7, 51.05], ['Bavaria', 11.6, 48.8], ['Palatinate', 7.5, 49.8], ['Schleswig-Holstein', 9.8, 54.2], ['Silesia', 17.0, 51.1], ['Hanover', 9.7, 52.6],
  ['Rhineland', 7.0, 51.2], ['Württemberg', 9.2, 48.6], ['Pomerania', 15.5, 53.8], ['Brandenburg', 13.4, 52.4], ['Mecklenburg', 12.4, 53.8], ['Hesse', 8.9, 50.6],
  ['Thuringia', 11.0, 50.9], ['Magdeburg', 11.7, 52.0], ['Franconia', 10.9, 49.6], ['Westphalia', 8.0, 51.9],
  ['Île-de-France', 2.35, 48.86], ['Lorraine', 6.2, 48.7], ['Alsace', 7.5, 48.3], ['Champagne', 4.4, 48.9], ['Burgundy', 4.5, 47.2], ['Normandy', 0.0, 49.1],
  ['Brittany', -3.0, 48.1], ['Loire', -0.6, 47.4], ['Aquitaine', -0.6, 44.8], ['Auvergne', 3.0, 45.6], ['Languedoc', 2.8, 43.5], ['Provence', 5.8, 43.8],
  ['Rhône', 5.0, 45.5], ['Picardy', 2.8, 49.9], ['Limousin', 1.3, 45.7], ['Poitou', 0.3, 46.6], ['Orléanais', 1.7, 47.7], ['Gascony', 0.3, 43.7],
  ['Franche-Comté', 6.0, 47.2], ['Savoy', 6.4, 45.6], ['Flanders and Artois', 2.8, 50.5],
  ['Algiers', 3.06, 36.75], ['Oran', -0.6, 35.7], ['Constantine', 6.6, 36.3], ['Algerian Sahara', 2.0, 31.5], ['Rabat', -6.8, 34.0], ['Marrakech', -8.0, 31.6],
  ['Fez', -5.0, 34.0], ['Damascus', 36.3, 33.5], ['Aleppo', 37.2, 36.2], ['Syrian Desert', 39.5, 35.0],
  ['London', -0.12, 51.5], ['Midlands', -1.9, 52.5], ['Wales', -3.7, 52.3], ['Yorkshire', -1.3, 54.0], ['Lancashire', -2.6, 53.7], ['Southern England', -1.3, 51.0],
  ['South West England', -3.8, 50.7], ['East Anglia', 1.0, 52.6], ['Northern England', -2.5, 54.7], ['Scottish Lowlands', -3.8, 55.9], ['Scottish Highlands', -4.5, 57.3],
  ['Lazio', 12.5, 41.9], ['Piedmont', 7.7, 45.0], ['Lombardy', 9.9, 45.6], ['Veneto', 11.9, 45.6], ['South Tyrol', 11.3, 46.5], ['Emilia', 11.3, 44.5],
  ['Tuscany', 11.2, 43.5], ['Umbria', 12.5, 43.0], ['Campania', 14.5, 40.9], ['Apulia', 16.6, 41.0], ['Calabria', 16.3, 39.0], ['Abruzzo', 13.9, 42.2],
  ['Liguria', 8.9, 44.4], ['Marche', 13.2, 43.4], ['Tripolitania', 13.2, 32.5], ['Cyrenaica', 22.0, 32.0],
  ['Moscow', 37.62, 55.75], ['Leningrad', 30.3, 59.9], ['Karelia', 33.0, 63.0], ['Murmansk', 34.0, 68.0], ['Arkhangelsk', 41.0, 64.0], ['Vologda', 40.0, 59.5],
  ['Smolensk', 32.0, 54.8], ['Kalinin', 35.9, 56.9], ['Yaroslavl', 39.9, 57.6], ['Gorky', 44.0, 56.3], ['Ryazan', 39.7, 54.6], ['Tula', 37.6, 54.2],
  ['Voronezh', 39.2, 51.7], ['Kursk', 36.2, 51.7], ['Oryol', 36.0, 53.0], ['Tambov', 41.4, 52.7], ['Penza', 45.0, 53.2], ['Saratov', 46.0, 51.5],
  ['Stalingrad', 44.5, 48.7], ['Rostov', 40.0, 47.5], ['Kuban', 39.0, 45.0], ['Stavropol', 43.0, 45.0], ['Kalmykia', 45.0, 46.3], ['Dagestan', 47.0, 43.0],
  ['North Caucasus', 44.5, 43.3], ['Crimea', 34.2, 45.2], ['Kiev', 30.52, 50.45], ['Chernigov', 31.3, 51.5], ['Zhitomir', 28.7, 50.3], ['Vinnitsa', 28.5, 49.2],
  ['Odessa', 30.7, 46.5], ['Poltava', 34.5, 49.6], ['Kharkov', 36.2, 50.0], ['Dnepropetrovsk', 35.0, 48.5], ['Donbass', 37.8, 48.0], ['Zaporozhye', 35.2, 47.8],
  ['Kherson', 33.0, 46.8], ['Minsk', 27.56, 53.9], ['Gomel', 31.0, 52.4], ['Vitebsk', 30.2, 55.2], ['Mogilev', 30.3, 53.9], ['Georgia', 44.8, 41.7],
  ['Armenia', 44.5, 40.2], ['Azerbaijan', 47.5, 40.4], ['Pskov', 28.3, 57.8], ['Novgorod', 31.3, 58.5], ['Astrakhan', 47.5, 47.0],
  ['Warsaw', 21.01, 52.23], ['Kraków', 19.94, 50.06], ['Upper Silesia', 19.0, 50.3], ['Poznań', 16.9, 52.4], ['Pomerelia', 18.4, 53.9], ['Łódź', 19.5, 51.8],
  ['Lublin', 22.6, 51.2], ['Białystok', 23.2, 53.1], ['Lwów', 24.03, 49.84], ['Volhynia', 25.6, 50.8], ['Polesie', 25.5, 52.2], ['Wilno', 25.3, 54.7],
  ['Nowogródek', 25.0, 53.6], ['Tarnopol', 25.6, 49.55], ['Stanisławów', 24.7, 48.9], ['Kielce', 20.6, 50.9], ['Rzeszów', 22.0, 50.0],
  ['Madrid', -3.7, 40.42], ['Catalonia', 1.5, 41.8], ['Andalusia', -4.8, 37.5], ['Galicia', -7.9, 42.8], ['Basque Country', -2.6, 43.0], ['Valencia', -0.6, 39.4],
  ['Aragon', -0.9, 41.6], ['Old Castile', -4.0, 41.8], ['León', -5.6, 42.6], ['Extremadura', -6.2, 39.2], ['La Mancha', -3.0, 39.3], ['Asturias', -5.9, 43.3],
  ['Murcia', -1.5, 38.0], ['Navarre', -1.6, 42.7], ['Lisbon', -9.14, 38.72], ['Porto', -8.6, 41.15], ['Alentejo', -7.9, 38.2], ['Beira', -7.7, 40.3],
  ['Ankara', 32.85, 39.93], ['Istanbul', 29.0, 41.0], ['Thrace', 27.0, 41.4], ['Smyrna', 27.1, 38.4], ['Antalya', 30.7, 36.9], ['Konya', 32.5, 37.9],
  ['Adana', 35.3, 37.0], ['Sivas', 37.0, 39.7], ['Trebizond', 39.7, 41.0], ['Erzurum', 41.3, 39.9], ['Van', 43.4, 38.5], ['Diyarbakır', 40.2, 37.9],
  ['Bursa', 29.0, 40.2], ['Samsun', 36.3, 41.3], ['Kayseri', 35.5, 38.7],
  ['Wallachia', 26.1, 44.43], ['Transylvania', 24.5, 46.5], ['Moldavia', 27.0, 46.9], ['Bessarabia', 28.8, 47.0], ['Dobruja', 28.3, 44.2], ['Banat', 21.3, 45.7],
  ['Oltenia', 23.8, 44.4], ['Bukovina', 25.9, 47.9], ['Crișana', 22.0, 47.0],
  ['Serbia', 20.46, 44.8], ['Croatia', 16.0, 45.8], ['Slovenia', 14.5, 46.05], ['Bosnia', 17.8, 44.2], ['Dalmatia', 16.5, 43.5], ['Macedonia', 21.5, 41.6],
  ['Montenegro', 19.3, 42.7], ['Vojvodina', 20.0, 45.4], ['Kosovo', 21.0, 42.6], ['South Serbia', 21.9, 43.3],
  ['Bohemia', 14.42, 50.08], ['Moravia', 16.6, 49.3], ['Slovakia', 19.5, 48.7], ['Ruthenia', 23.3, 48.4],
  ['Budapest', 19.04, 47.5], ['Transdanubia', 17.8, 46.8], ['Great Hungarian Plain', 20.8, 47.2], ['Northern Hungary', 20.6, 48.1],
  ['Vienna', 16.37, 48.21], ['Styria', 15.0, 47.2], ['Tyrol', 11.4, 47.2], ['Upper Austria', 14.0, 48.1], ['Salzburg', 13.0, 47.5], ['Carinthia', 14.0, 46.7],
  ['Stockholm', 18.07, 59.33], ['Götaland', 13.5, 57.7], ['Scania', 13.5, 55.9], ['Norrland', 17.0, 63.0], ['Norrbotten', 20.0, 66.8], ['Dalarna', 14.5, 61.0], ['Västerbotten', 18.0, 64.5],
  ['Oslo', 10.75, 59.91], ['Vestlandet', 6.0, 60.5], ['Trøndelag', 11.0, 63.5], ['Nordland', 14.5, 67.0], ['Finnmark', 25.0, 70.0], ['Sørlandet', 8.0, 58.5],
  ['Helsinki', 24.94, 60.17], ['Lapland', 27.0, 67.5], ['Ostrobothnia', 24.0, 64.0], ['Savonia', 28.0, 62.5], ['Tampere', 23.8, 61.5], ['Turku', 22.3, 60.5],
  ['Attica', 23.73, 37.98], ['Peloponnese', 22.2, 37.5], ['Thessaly', 22.2, 39.5], ['Salonika', 22.95, 40.64], ['Epirus', 20.8, 39.6], ['Western Thrace', 25.5, 41.1],
  ['Aegean Islands', 25.4, 37.0], ['Guyenne', 2.6, 44.3], ['Roussillon', 2.5, 42.9],
  ['Sofia', 23.32, 42.7], ['Plovdiv', 24.75, 42.15], ['Varna', 27.9, 43.2], ['Burgas', 27.5, 42.5], ['Pleven', 24.6, 43.4],
  ['Brussels', 4.35, 50.85], ['Wallonia', 5.3, 50.2], ['Flanders', 3.7, 51.0], ['Holland', 4.9, 52.37], ['Brabant', 5.3, 51.6], ['Friesland', 5.8, 53.1], ['Gelderland', 6.0, 52.1],
  ['Bern', 7.45, 46.95], ['Zürich', 8.54, 47.37], ['Graubünden', 9.6, 46.7], ['Geneva', 6.5, 46.5],
  ['Zealand', 12.0, 55.5], ['Jutland', 9.3, 56.2], ['Leinster', -6.8, 53.2], ['Munster', -8.6, 52.3], ['Connacht', -9.0, 53.7],
  ['Cairo', 31.24, 30.04], ['Alexandria', 29.92, 31.2], ['Sinai', 33.8, 30.3], ['Western Desert', 27.0, 30.5], ['Baghdad', 44.37, 33.31], ['Mosul', 43.1, 36.3],
  ['Basra', 47.0, 30.8], ['Western Iraq', 41.5, 33.0],
];

/** A first pass at terrain from where a province's centre lies: [terrain, west, east, south, north]. First match wins. */
const TERRAIN_BOXES = [
  ['mountains', 6, 14.5, 45.9, 47.6], ['mountains', -1.5, 3, 42.2, 43.1], ['mountains', 39, 49, 41.6, 43.9], ['mountains', 5, 16, 60.5, 69.5],
  ['mountains', 38, 45, 37, 41.5], ['hills', 21.5, 26.5, 45, 49.3], ['hills', 15.5, 23.5, 40, 45], ['hills', 10.5, 16.5, 40.5, 44.5],
  ['hills', -6, -2.5, 55.5, 59], ['hills', 1.5, 4.5, 44, 46.3], ['hills', 12, 18, 48.5, 51], ['hills', 20, 24.5, 37, 41.5], ['hills', 28, 38, 36, 41.5],
  ['marsh', 24, 30.5, 51.2, 53.4], ['forest', 20, 50, 57, 71.5], ['forest', 11, 25, 60, 71.5], ['forest', 22, 34, 53.4, 57],
  ['desert', -11, 50, 29, 34.2],
];
const terrainAt = ([lon, lat]) => (TERRAIN_BOXES.find(([, w, e, s2, n]) => lon >= w && lon <= e && lat >= s2 && lat <= n) ?? ['plains'])[0];

const feats = geoms.map((g) => feature(ptopo, g));
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
const find = (lon, lat, owner) => {
  let hit = feats.findIndex((f, i) => (!owner || provinces[i].owner === owner) && geoContains(f, [lon, lat]));
  if (hit < 0) { // simplification can push a coastal city just outside: take the nearest province instead
    let bd = Infinity;
    feats.forEach((f, i) => { if (owner && provinces[i].owner !== owner) return; const d = geoDistance(geoCentroid(f), [lon, lat]); if (d < bd) { bd = d; hit = i; } });
  }
  return hit;
};

const zoneSize = (z) => provinces.filter((q) => q.zone === z).length;
const out = provinces.map((p, i) => {
  const biggest = p.members.map((m) => kept[m].properties).sort((a, b) => b.area - a.area)[0];
  const centre = geoCentroid(feats[i]).map((v) => round(v, 3));
  const inside = PLACES.filter(([, lon, lat]) => geoContains(feats[i], [lon, lat])).sort((a, b) => geoDistance(centre, [a[1], a[2]]) - geoDistance(centre, [b[1], b[2]]));
  const name = zoneSize(p.zone) === 1 ? p.zone : inside.length ? inside[0][0] : biggest.name;
  return { id: i, name, owner: p.owner, terrain: terrainAt(centre), centre, areaKm2: Math.round(geoArea(feats[i]) * 6371 ** 2), neighbours: [...nb[i]].sort((a, b) => a - b), victoryPoints: 1, city: null, capital: false };
});
for (const [country, [city, lon, lat]] of Object.entries(CAPITALS)) {
  const i = find(lon, lat, country);
  Object.assign(out[i], { city, capital: true, victoryPoints: 20 });
  const near = PLACES.filter(([, x, y]) => geoContains(feats[i], [x, y])).sort((a, b) => geoDistance([lon, lat], [a[1], a[2]]) - geoDistance([lon, lat], [b[1], b[2]]))[0];
  if (near && zoneSize(provinces[i].zone) > 1) out[i].name = near[0];
}
for (const [city, lon, lat, vp] of CITIES) {
  const i = find(lon, lat, null);
  out[i].victoryPoints += vp;
  if (!out[i].city) out[i].city = city;
}
// Make names unique within the map.
const seen = {};
for (const p of out) { seen[p.name] = (seen[p.name] || 0) + 1; }
for (const p of out) if (seen[p.name] > 1 && p.city) p.name = p.city;
const dup = out.map((p) => p.name).filter((n, i, a) => a.indexOf(n) !== i);
if (dup.length) throw new Error('Duplicate province names: ' + dup.join(', '));

// Narrow sea crossings that armies can use without ships.
const STRAITS = [['Sicily', 'Calabria'], ['Zealand', 'Jutland']]; // the Strait of Messina; the Danish islands
for (const [a, b] of STRAITS) {
  const i = out.findIndex((p) => p.name === a), j = out.findIndex((p) => p.name === b);
  if (i < 0 || j < 0) throw new Error(`Strait ${a} to ${b}: province not found`);
  if (!out[i].neighbours.includes(j)) { out[i].neighbours.push(j); out[j].neighbours.push(i); }
  out[i].neighbours.sort((x, y) => x - y); out[j].neighbours.sort((x, y) => x - y);
}
// Keep the drawing data small: whole numbers on a fine grid.
const { quantize } = await import('topojson-client');
const small = quantize(ptopo, 2e4);
small.objects.provinces.geometries.forEach((g, i) => { g.id = i; delete g.properties; });
fs.writeFileSync('src/content/map/europe1936.json', JSON.stringify({ source: 'Natural Earth (public domain), regrouped to 1936 borders by scripts/build-map.mjs', knownGaps: KNOWN_GAPS, provinces: out }, null, 1));
fs.writeFileSync('src/content/map/europe1936.topo.json', JSON.stringify(small));
const owners = [...new Set(out.map((p) => p.owner))];
console.log(`${out.length} provinces, ${owners.length} countries, drawing data ${(JSON.stringify(small).length / 1024).toFixed(0)} KB`);
console.log(owners.map((o) => `${o} ${out.filter((p) => p.owner === o).length}`).join(', '));
console.log('isolated:', out.filter((p) => !p.neighbours.length).map((p) => p.name).join(', '));
