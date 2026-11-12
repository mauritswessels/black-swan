/** Colours for countries and terrain. Colour is never the only signal: counters carry a country code and the sidebar says everything in words. */
import { COUNTRIES } from '../../sim/countries';
import type { Terrain } from '../../sim/types';

const MAJOR: Record<string, string> = {
  France: '#5b9bff', Germany: '#aab4c2', 'United Kingdom': '#ff8fa0', Italy: '#5ee6b0', 'Soviet Union': '#ff8266', Poland: '#c29bff',
};
const MINOR = ['#8fb3c9', '#c9b98f', '#9fc98f', '#c99fb8', '#8f9fc9', '#c9a58f', '#8fc9c0'];

/** The bright colour of a country, for counters and labels. */
export function countryColour(name: string): string {
  return MAJOR[name] ?? MINOR[COUNTRIES.findIndex((c) => c.name === name) % MINOR.length];
}

/** Mix a colour into the dark table, for filling land. */
export function tint(hex: string, share: number): string {
  const base = [13, 20, 34];
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const m = c.map((v, i) => Math.round(base[i] + (v - base[i]) * share));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

export const landColour = (name: string, mine: boolean): string => tint(countryColour(name), MAJOR[name] ? (mine ? 0.42 : 0.3) : 0.14);

export const TERRAIN_COLOUR: Record<Terrain, string> = { plains: '#2c4a36', forest: '#17382a', hills: '#55492f', mountains: '#6b6672', marsh: '#1f4650', desert: '#7a6636' };
export const TERRAIN_NOTE: Record<Terrain, string> = {
  plains: 'Open country: no penalty for attackers, quick to cross.',
  forest: 'Attackers hit 20% less hard. Armour loses a further 30%. Slow to cross.',
  hills: 'Attackers hit 30% less hard. Slow to cross.',
  mountains: 'Attackers hit 50% less hard. Armour loses a further 30%. Very slow to cross.',
  marsh: 'Attackers hit 30% less hard. Armour loses a further 30%. Slow to cross.',
  desert: 'Attackers hit 10% less hard. Few roads, so it feeds few divisions.',
};
