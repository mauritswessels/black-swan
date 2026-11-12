/**
 * What a country can see. You always see the map and who holds each province, but foreign
 * divisions only where your own land or divisions are, and in the provinces next to those.
 *
 * (The design document also makes the numbers an estimate that can be wrong. That arrives with
 * air reconnaissance in Stage G; for now what you see is exact.)
 */
import { PROVINCES } from './map';
import type { Unit, World } from './types';

/** For each province: can this country see the divisions in it? */
export function visibleProvinces(w: Pick<World, 'units' | 'controller'>, country: string | null): boolean[] {
  if (country === null) return new Array<boolean>(PROVINCES.length).fill(true);
  const seen = new Array<boolean>(PROVINCES.length).fill(false);
  const look = (p: number) => {
    seen[p] = true;
    for (const n of PROVINCES[p].neighbours) seen[n] = true;
  };
  w.controller.forEach((c, p) => c === country && look(p));
  for (const u of w.units) if (u.owner === country) look(u.at);
  return seen;
}

/** The divisions of one country standing together in one province: what a map counter shows. */
export interface Stack {
  province: number;
  owner: string;
  units: Unit[];
}

/** Every stack this country can see, its own included, in a fixed order (province, then owner). */
export function visibleStacks(w: Pick<World, 'units' | 'controller'>, country: string | null): Stack[] {
  const seen = visibleProvinces(w, country);
  const stacks = new Map<string, Stack>();
  for (const u of w.units) {
    if (u.owner !== country && !seen[u.at]) continue;
    const key = `${u.at}|${u.owner}`;
    const s = stacks.get(key);
    if (s) s.units.push(u);
    else stacks.set(key, { province: u.at, owner: u.owner, units: [u] });
  }
  return [...stacks.values()].sort((a, b) => a.province - b.province || (a.owner < b.owner ? -1 : 1));
}
