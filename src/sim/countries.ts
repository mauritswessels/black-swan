/**
 * The 31 countries on the map, as they were on 1 January 1936.
 *
 * `government` is a broad label for game rules, not a full description. Army sizes are rough
 * peacetime figures in divisions, [infantry, armour, artillery], scaled for play. They are
 * placeholders until Stage B balances them against the historical record.
 */
import type { Country, Government } from './types';

const c = (name: string, adjective: string, government: Government, startArmy: [number, number, number], major = false): Country => ({ name, adjective, government, major, startArmy });

export const COUNTRIES: Country[] = [
  c('United Kingdom', 'British', 'democracy', [8, 1, 2], true),
  c('France', 'French', 'democracy', [26, 2, 4], true),
  c('Germany', 'German', 'fascist', [24, 3, 3], true),
  c('Italy', 'Italian', 'fascist', [24, 1, 3], true),
  c('Soviet Union', 'Soviet', 'communist', [60, 6, 8], true),
  c('Poland', 'Polish', 'authoritarian', [24, 1, 3], true),
  c('Spain', 'Spanish', 'democracy', [8, 0, 1]),
  c('Portugal', 'Portuguese', 'authoritarian', [3, 0, 0]),
  c('Ireland', 'Irish', 'democracy', [1, 0, 0]),
  c('Belgium', 'Belgian', 'democracy', [6, 0, 1]),
  c('Netherlands', 'Dutch', 'democracy', [4, 0, 0]),
  c('Luxembourg', 'Luxembourg', 'democracy', [0, 0, 0]),
  c('Switzerland', 'Swiss', 'democracy', [6, 0, 1]),
  c('Austria', 'Austrian', 'authoritarian', [5, 0, 1]),
  c('Czechoslovakia', 'Czechoslovak', 'democracy', [14, 1, 2]),
  c('Hungary', 'Hungarian', 'authoritarian', [6, 0, 1]),
  c('Romania', 'Romanian', 'authoritarian', [16, 0, 2]),
  c('Yugoslavia', 'Yugoslav', 'authoritarian', [14, 0, 2]),
  c('Bulgaria', 'Bulgarian', 'authoritarian', [6, 0, 1]),
  c('Greece', 'Greek', 'democracy', [8, 0, 1]),
  c('Albania', 'Albanian', 'authoritarian', [1, 0, 0]),
  c('Turkey', 'Turkish', 'authoritarian', [16, 0, 2]),
  c('Denmark', 'Danish', 'democracy', [2, 0, 0]),
  c('Norway', 'Norwegian', 'democracy', [3, 0, 0]),
  c('Sweden', 'Swedish', 'democracy', [5, 0, 1]),
  c('Finland', 'Finnish', 'democracy', [5, 0, 1]),
  c('Estonia', 'Estonian', 'authoritarian', [2, 0, 0]),
  c('Latvia', 'Latvian', 'authoritarian', [3, 0, 0]),
  c('Lithuania', 'Lithuanian', 'authoritarian', [3, 0, 0]),
  c('Egypt', 'Egyptian', 'authoritarian', [2, 0, 0]),
  c('Iraq', 'Iraqi', 'authoritarian', [2, 0, 0]),
];

export const countryByName = (name: string): Country => {
  const found = COUNTRIES.find((k) => k.name === name);
  if (!found) throw new Error(`No country called ${name}`);
  return found;
};
