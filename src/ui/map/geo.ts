/**
 * The map's shapes, worked out once: every province as an SVG path on the table, the centre point
 * of each province, and the border lines between them.
 *
 * Since version 1.7 the table is the whole world on the Miller projection, which keeps the shapes
 * of countries close to what people know from school atlases. It wraps around: scroll right past
 * Japan and you reach California. Europe sits in the middle at about the size it had on the old
 * map of Europe, so the game plays the same up close; zoom out to see the oceans.
 */
import { geoGraticule10, geoPath, geoProjection, type GeoRawProjection } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import topo from '../../content/map/world1936.topo.json';
import { PROVINCES } from '../../sim/map';
import { ZONES } from '../../sim/sea';

/** Width of the table: one trip round the world. */
export const TABLE_W = 4800;
/** The longitude in the middle of the table. The wrap-around seam runs half a world away, through the Bering Strait. */
const CENTRE_LON = 11;
const NORTH = 84;
const SOUTH = -57;
const PAD = 60;

const miller: GeoRawProjection = (lambda, phi) => [lambda, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi))];
miller.invert = (x, y) => [x, 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI];

/* eslint-disable @typescript-eslint/no-explicit-any */
const t = topo as any;
const object = t.objects.provinces;
const fc = feature(t, object) as any;
const projection = geoProjection(miller).rotate([-CENTRE_LON, 0]).scale(TABLE_W / (2 * Math.PI)).translate([TABLE_W / 2, 0]);
const top = (projection([0, NORTH]) as [number, number])[1];
const bottom = (projection([0, SOUTH]) as [number, number])[1];
projection.translate([TABLE_W / 2, PAD - top]);
/** Height of the table, from the Arctic to Cape Horn. */
export const TABLE_H = Math.round(bottom - top + 2 * PAD);
const path = geoPath(projection);

/** The copy of `x` (shifted a world's width either way) nearest to `from`: lines across the seam take the short way. */
export const nearX = (from: number, x: number): number => (x - from > TABLE_W / 2 ? x - TABLE_W : from - x > TABLE_W / 2 ? x + TABLE_W : x);
/** A point on the table as a string for SVG paths. */
const xy = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

/** Province shapes, by province id. */
export const SHAPES: string[] = fc.features.map((f: any) => path(f) ?? '');
/** Where each province's counter and label sit. */
export const POINTS: [number, number][] = PROVINCES.map((p) => (projection(p.centre) as [number, number]) ?? [0, 0]);
export const project = (lonLat: [number, number]): [number, number] => (projection(lonLat) as [number, number]) ?? [0, 0];

const index = new Map<unknown, number>(object.geometries.map((g: unknown, i: number) => [g, i]));
export const COAST: string = path(mesh(t, object, (a: unknown, b: unknown) => a === b)) ?? '';
export const PROVINCE_LINES: string = path(mesh(t, object, (a: unknown, b: unknown) => a !== b)) ?? '';
export const GRATICULE: string = path(geoGraticule10()) ?? '';

const pairKey = (a: number, b: number): number => (a < b ? a * 1000 + b : b * 1000 + a);
const borders = new Map<number, { d: string; mid: [number, number] } | null>();
/** The border line between two neighbouring provinces, and its middle point. Null when they only meet across the sea. */
export function sharedBorder(a: number, b: number): { d: string; mid: [number, number] } | null {
  const k = pairKey(a, b);
  let hit = borders.get(k);
  if (hit === undefined) {
    const m = mesh(t, object, (x: unknown, y: unknown) => {
      const i = index.get(x);
      const j = index.get(y);
      return (i === a && j === b) || (i === b && j === a);
    });
    const d = path(m) ?? '';
    hit = d ? { d, mid: path.centroid(m) as [number, number] } : null;
    borders.set(k, hit);
  }
  return hit;
}

/** The outline of a group of provinces (a pocket), coasts included. */
export function outline(provinces: number[]): string {
  const inside = new Set(provinces);
  const has = (g: unknown) => inside.has(index.get(g)!);
  return path(mesh(t, object, (x: unknown, y: unknown) => (x === y ? has(x) : has(x) !== has(y)))) ?? '';
}

/** The lines between provinces held by different countries. Changes as provinces change hands. */
export function countryLines(controller: string[]): string {
  return path(mesh(t, object, (a: unknown, b: unknown) => a !== b && controller[index.get(a)!] !== controller[index.get(b)!])) ?? '';
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Names on the sea. The seas of Europe show once you zoom in; the oceans of the world always. */
export const SEAS: { name: string; at: [number, number]; near?: boolean }[] = [
  { name: 'NORTH ATLANTIC OCEAN', at: [-40, 38] },
  { name: 'SOUTH ATLANTIC OCEAN', at: [-18, -25] },
  { name: 'INDIAN OCEAN', at: [78, -18] },
  { name: 'ARABIAN SEA', at: [64, 15] },
  { name: 'BAY OF BENGAL', at: [88, 14] },
  { name: 'SOUTH CHINA SEA', at: [114, 14] },
  { name: 'PACIFIC OCEAN', at: [-150, 22] },
  { name: 'PACIFIC OCEAN', at: [165, 12] },
  { name: 'CORAL SEA', at: [155, -17] },
  { name: 'TASMAN SEA', at: [160, -38] },
  { name: 'SEA OF JAPAN', at: [135, 40.5] },
  { name: 'GULF OF MEXICO', at: [-90, 25] },
  { name: 'CARIBBEAN SEA', at: [-75, 15] },
  { name: 'ARCTIC OCEAN', at: [80, 79] },
  { name: 'ATLANTIC OCEAN', at: [-12, 49.5], near: true },
  { name: 'NORTH SEA', at: [3.2, 57.2], near: true },
  { name: 'NORWEGIAN SEA', at: [3, 65.5], near: true },
  { name: 'BALTIC SEA', at: [19.3, 56.6], near: true },
  { name: 'MEDITERRANEAN SEA', at: [18, 34.6], near: true },
  { name: 'BLACK SEA', at: [34, 43.3], near: true },
  { name: 'BAY OF BISCAY', at: [-4.8, 45.6], near: true },
].map((s) => ({ name: s.name, at: project(s.at as [number, number]), near: s.near }));

/** Where to print each country's name: the centre of its home provinces around the capital, weighted by size. */
export function countryLabelPoints(): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  const capitals = PROVINCES.filter((p) => p.capital);
  for (const cap of capitals) {
    // Only the piece of the country that holds the capital, so colonies do not drag the label out to sea.
    const seen = new Set<number>([cap.id]);
    const queue = [cap.id];
    while (queue.length) for (const n of PROVINCES[queue.pop()!].neighbours) if (!seen.has(n) && PROVINCES[n].owner === cap.owner) (seen.add(n), queue.push(n));
    let x = 0;
    let y = 0;
    let w = 0;
    for (const id of seen) {
      const a = Math.sqrt(PROVINCES[id].areaKm2);
      x += POINTS[id][0] * a;
      y += POINTS[id][1] * a;
      w += a;
    }
    out.set(cap.owner, [x / w, y / w]);
    HOME_AREA.set(cap.owner, [...seen].reduce((a, id) => a + PROVINCES[id].areaKm2, 0));
  }
  return out;
}
/** The area of each country's home piece around its capital, in km2: the big ones keep their names when you zoom out to the whole world. */
export const HOME_AREA = new Map<string, number>();
export const COUNTRY_POINTS = countryLabelPoints();

/** Sea zones: their outlines (drawn under the land) and where their names and fleet counters sit. An outline across the seam runs on past the edge of the table, where the next copy of the world picks it up. */
export const ZONE_SHAPES: string[] = ZONES.map((z) => {
  const first = project(z.outline[0]);
  return `M${z.outline.map((pt) => {
    const [x, y] = project(pt);
    return xy([nearX(first[0], x), y]);
  }).join('L')}Z`;
});
export const ZONE_POINTS: [number, number][] = ZONES.map((z) => project(z.label));
