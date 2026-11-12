/**
 * The 31 countries on the map, as they were on 1 January 1936.
 *
 * `government` is a broad label for game rules, not a full description. Army sizes are rough
 * peacetime figures in divisions, [infantry, armour, artillery], scaled for play. They are
 * placeholders until Stage B balances them against the historical record.
 *
 * The second list is the economy: [civilian factories, military factories, people in millions,
 * steel a month, oil a month]. These are rough relative sizes for 1936, not statistics: Germany,
 * Britain and the Soviet Union are the big industrial economies, the Soviet Union and Romania
 * have the oil, and every country with an army has at least one arms factory.
 */
import type { Country, Government } from './types';

const c = (tag: string, name: string, adjective: string, government: Government, startArmy: [number, number, number], i: [number, number, number, number, number], major = false): Country => ({
  name,
  adjective,
  government,
  major,
  tag,
  startArmy,
  industry: { civ: i[0], mil: i[1], population: i[2], steel: i[3], oil: i[4] },
});

export const COUNTRIES: Country[] = [
  c('GBR', 'United Kingdom', 'British', 'democracy', [8, 1, 2], [30, 8, 47, 14, 0], true),
  c('FRA', 'France', 'French', 'democracy', [26, 2, 4], [22, 7, 41, 9, 0], true),
  c('GER', 'Germany', 'German', 'fascist', [24, 3, 3], [34, 12, 67, 20, 1], true),
  c('ITA', 'Italy', 'Italian', 'fascist', [24, 1, 3], [13, 6, 43, 3, 0], true),
  c('SOV', 'Soviet Union', 'Soviet', 'communist', [60, 6, 8], [32, 16, 165, 18, 28], true),
  c('POL', 'Poland', 'Polish', 'authoritarian', [24, 1, 3], [8, 3, 34, 2, 1], true),
  c('SPA', 'Spain', 'Spanish', 'democracy', [8, 0, 1], [7, 2, 25, 1, 0]),
  c('POR', 'Portugal', 'Portuguese', 'authoritarian', [3, 0, 0], [2, 1, 7, 0, 0]),
  c('IRE', 'Ireland', 'Irish', 'democracy', [1, 0, 0], [1, 1, 3, 0, 0]),
  c('BEL', 'Belgium', 'Belgian', 'democracy', [6, 0, 1], [6, 2, 8, 3, 0]),
  c('NED', 'Netherlands', 'Dutch', 'democracy', [4, 0, 0], [6, 1, 8.5, 0, 0]),
  c('LUX', 'Luxembourg', 'Luxembourg', 'democracy', [0, 0, 0], [1, 0, 0.3, 2, 0]),
  c('SWI', 'Switzerland', 'Swiss', 'democracy', [6, 0, 1], [4, 1, 4, 0, 0]),
  c('AUT', 'Austria', 'Austrian', 'authoritarian', [5, 0, 1], [4, 1, 6.7, 1, 0]),
  c('CZE', 'Czechoslovakia', 'Czechoslovak', 'democracy', [14, 1, 2], [8, 4, 15, 3, 0]),
  c('HUN', 'Hungary', 'Hungarian', 'authoritarian', [6, 0, 1], [3, 1, 9, 1, 0]),
  c('ROM', 'Romania', 'Romanian', 'authoritarian', [16, 0, 2], [4, 1, 19, 1, 9]),
  c('YUG', 'Yugoslavia', 'Yugoslav', 'authoritarian', [14, 0, 2], [3, 1, 15, 1, 0]),
  c('BUL', 'Bulgaria', 'Bulgarian', 'authoritarian', [6, 0, 1], [2, 1, 6, 0, 0]),
  c('GRE', 'Greece', 'Greek', 'democracy', [8, 0, 1], [2, 1, 7, 0, 0]),
  c('ALB', 'Albania', 'Albanian', 'authoritarian', [1, 0, 0], [1, 1, 1, 0, 0]),
  c('TUR', 'Turkey', 'Turkish', 'authoritarian', [16, 0, 2], [3, 1, 16, 0, 0]),
  c('DEN', 'Denmark', 'Danish', 'democracy', [2, 0, 0], [3, 1, 3.7, 0, 0]),
  c('NOR', 'Norway', 'Norwegian', 'democracy', [3, 0, 0], [3, 1, 2.9, 0, 0]),
  c('SWE', 'Sweden', 'Swedish', 'democracy', [5, 0, 1], [6, 2, 6.2, 7, 0]),
  c('FIN', 'Finland', 'Finnish', 'democracy', [5, 0, 1], [2, 1, 3.6, 0, 0]),
  c('EST', 'Estonia', 'Estonian', 'authoritarian', [2, 0, 0], [1, 1, 1.1, 0, 0]),
  c('LAT', 'Latvia', 'Latvian', 'authoritarian', [3, 0, 0], [1, 1, 1.9, 0, 0]),
  c('LIT', 'Lithuania', 'Lithuanian', 'authoritarian', [3, 0, 0], [1, 1, 2.5, 0, 0]),
  c('EGY', 'Egypt', 'Egyptian', 'authoritarian', [2, 0, 0], [2, 1, 16, 0, 0]),
  c('IRQ', 'Iraq', 'Iraqi', 'authoritarian', [2, 0, 0], [1, 1, 3.5, 0, 5]),
];

export const countryByName = (name: string): Country => {
  const found = COUNTRIES.find((k) => k.name === name);
  if (!found) throw new Error(`No country called ${name}`);
  return found;
};
