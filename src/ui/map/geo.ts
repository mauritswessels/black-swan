/**
 * The map's shapes, worked out once: every province as an SVG path on a 1600 x 1000 table,
 * the centre point of each province, and the border lines between them.
 */
import { geoConicConformal, geoGraticule10, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import topo from '../../content/map/europe1936.topo.json';
import { PROVINCES } from '../../sim/map';

export const TABLE_W = 1600;
export const TABLE_H = 1000;

/* eslint-disable @typescript-eslint/no-explicit-any */
const t = topo as any;
const object = t.objects.provinces;
const fc = feature(t, object) as any;
const projection = geoConicConformal().parallels([38, 62]).rotate([-18, 0]).fitExtent([[40, 40], [TABLE_W - 40, TABLE_H - 40]], fc);
const path = geoPath(projection);

/** Province shapes, by province id. */
export const SHAPES: string[] = fc.features.map((f: any) => path(f) ?? '');
/** Where each province's counter and label sit. */
export const POINTS: [number, number][] = PROVINCES.map((p) => (projection(p.centre) as [number, number]) ?? [0, 0]);
export const project = (lonLat: [number, number]): [number, number] => (projection(lonLat) as [number, number]) ?? [0, 0];

const index = new Map<unknown, number>(object.geometries.map((g: unknown, i: number) => [g, i]));
export const COAST: string = path(mesh(t, object, (a: unknown, b: unknown) => a === b)) ?? '';
export const PROVINCE_LINES: string = path(mesh(t, object, (a: unknown, b: unknown) => a !== b)) ?? '';
export const GRATICULE: string = path(geoGraticule10()) ?? '';

/** The lines between provinces held by different countries. Changes as provinces change hands. */
export function countryLines(controller: string[]): string {
  return path(mesh(t, object, (a: unknown, b: unknown) => a !== b && controller[index.get(a)!] !== controller[index.get(b)!])) ?? '';
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const SEAS: { name: string; at: [number, number] }[] = [
  { name: 'ATLANTIC OCEAN', at: [-12, 49.5] },
  { name: 'NORTH SEA', at: [3.2, 57.2] },
  { name: 'NORWEGIAN SEA', at: [3, 65.5] },
  { name: 'BALTIC SEA', at: [19.3, 56.6] },
  { name: 'MEDITERRANEAN SEA', at: [18, 34.6] },
  { name: 'BLACK SEA', at: [34, 43.3] },
  { name: 'BAY OF BISCAY', at: [-4.8, 45.6] },
].map((s) => ({ name: s.name, at: project(s.at as [number, number]) }));

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
  }
  return out;
}
export const COUNTRY_POINTS = countryLabelPoints();
