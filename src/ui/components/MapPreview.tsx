/**
 * A plain preview of the 1936 map, coloured by country. Hover or tab to a province to see what
 * it is. This is a stand-in until the Map table screen is built in Stage C.
 */
import { geoConicConformal, geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import topo from '../../content/map/europe1936.topo.json';
import { COUNTRIES } from '../../sim/countries';
import { PROVINCES } from '../../sim/map';
import type { World } from '../../sim/types';

const W = 1000;
const H = 640;
const MAJOR: Record<string, string> = {
  France: '#2d5aa0', 'United Kingdom': '#8a3b4c', Germany: '#59616d', Italy: '#2f7a55', 'Soviet Union': '#8c3a2c', Poland: '#6f55a0',
};
const MINOR = ['#1c2638', '#222e42', '#19222f', '#263247'];

export function MapPreview({ world }: { world: World }) {
  const [hover, setHover] = useState<number | null>(null);
  const shapes = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = feature(topo as any, (topo as any).objects.provinces) as any;
    const projection = geoConicConformal().parallels([38, 62]).rotate([-18, 0]).fitSize([W, H], fc);
    const path = geoPath(projection);
    return (fc.features as unknown[]).map((f) => path(f as never) ?? '');
  }, []);
  const counts = useMemo(() => {
    const n = new Array<number>(PROVINCES.length).fill(0);
    for (const u of world.units) n[u.at]++;
    return n;
  }, [world]);
  const p = hover === null ? null : PROVINCES[hover];
  return (
    <figure className="map-preview">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of Europe on 1 January 1936, coloured by country">
        {shapes.map((d, i) => {
          const owner = world.controller[i];
          const fill = MAJOR[owner] ?? MINOR[COUNTRIES.findIndex((c) => c.name === owner) % MINOR.length];
          return (
            <path key={i} d={d} fill={fill} className={hover === i ? 'on' : undefined} tabIndex={0} aria-label={`${PROVINCES[i].name}, ${owner}`}
              onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onMouseLeave={() => setHover(null)} onBlur={() => setHover(null)} />
          );
        })}
      </svg>
      <figcaption role="status">
        {p ? (
          <>
            <b>{p.name}</b> · {world.controller[p.id]} · {p.terrain}
            {p.city ? ` · ${p.city}${p.capital ? ' (capital)' : ''}` : ''} · {counts[p.id]} {counts[p.id] === 1 ? 'division' : 'divisions'}
          </>
        ) : (
          `${PROVINCES.length} provinces · ${COUNTRIES.length} countries · ${world.units.length} divisions. Point at a province to see what it is.`
        )}
      </figcaption>
    </figure>
  );
}
