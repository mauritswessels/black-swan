/**
 * The 31 countries on the map, as they were on 1 January 1936.
 *
 * `government` is a broad label for game rules, not a full description. Army sizes are rough
 * peacetime figures in divisions, [infantry, armour, artillery], scaled for play. They are
 * placeholders until Stage B balances them against the historical record.
 */
import type { Country, Government } from './types';

const c = (tag: string, name: string, adjective: string, government: Government, startArmy: [number, number, number], major = false): Country => ({ name, adjective, government, major, tag, startArmy });

export const COUNTRIES: Country[] = [
  c('GBR', 'United Kingdom', 'British', 'democracy', [8, 1, 2], true),
  c('FRA', 'France', 'French', 'democracy', [26, 2, 4], true),
  c('GER', 'Germany', 'German', 'fascist', [24, 3, 3], true),
  c('ITA', 'Italy', 'Italian', 'fascist', [24, 1, 3], true),
  c('SOV', 'Soviet Union', 'Soviet', 'communist', [60, 6, 8], true),
  c('POL', 'Poland', 'Polish', 'authoritarian', [24, 1, 3], true),
  c('SPA', 'Spain', 'Spanish', 'democracy', [8, 0, 1]),
  c('POR', 'Portugal', 'Portuguese', 'authoritarian', [3, 0, 0]),
  c('IRE', 'Ireland', 'Irish', 'democracy', [1, 0, 0]),
  c('BEL', 'Belgium', 'Belgian', 'democracy', [6, 0, 1]),
  c('NED', 'Netherlands', 'Dutch', 'democracy', [4, 0, 0]),
  c('LUX', 'Luxembourg', 'Luxembourg', 'democracy', [0, 0, 0]),
  c('SWI', 'Switzerland', 'Swiss', 'democracy', [6, 0, 1]),
  c('AUT', 'Austria', 'Austrian', 'authoritarian', [5, 0, 1]),
  c('CZE', 'Czechoslovakia', 'Czechoslovak', 'democracy', [14, 1, 2]),
  c('HUN', 'Hungary', 'Hungarian', 'authoritarian', [6, 0, 1]),
  c('ROM', 'Romania', 'Romanian', 'authoritarian', [16, 0, 2]),
  c('YUG', 'Yugoslavia', 'Yugoslav', 'authoritarian', [14, 0, 2]),
  c('BUL', 'Bulgaria', 'Bulgarian', 'authoritarian', [6, 0, 1]),
  c('GRE', 'Greece', 'Greek', 'democracy', [8, 0, 1]),
  c('ALB', 'Albania', 'Albanian', 'authoritarian', [1, 0, 0]),
  c('TUR', 'Turkey', 'Turkish', 'authoritarian', [16, 0, 2]),
  c('DEN', 'Denmark', 'Danish', 'democracy', [2, 0, 0]),
  c('NOR', 'Norway', 'Norwegian', 'democracy', [3, 0, 0]),
  c('SWE', 'Sweden', 'Swedish', 'democracy', [5, 0, 1]),
  c('FIN', 'Finland', 'Finnish', 'democracy', [5, 0, 1]),
  c('EST', 'Estonia', 'Estonian', 'authoritarian', [2, 0, 0]),
  c('LAT', 'Latvia', 'Latvian', 'authoritarian', [3, 0, 0]),
  c('LIT', 'Lithuania', 'Lithuanian', 'authoritarian', [3, 0, 0]),
  c('EGY', 'Egypt', 'Egyptian', 'authoritarian', [2, 0, 0]),
  c('IRQ', 'Iraq', 'Iraqi', 'authoritarian', [2, 0, 0]),
];

export const countryByName = (name: string): Country => {
  const found = COUNTRIES.find((k) => k.name === name);
  if (!found) throw new Error(`No country called ${name}`);
  return found;
};
