/**
 * The countries on the map, as they were on 1 January 1936: the 31 of the Europe-only map
 * (versions 1.0 to 1.6) first, then the 40 of the rest of the world (version 1.7).
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
  // The rest of the world (1.7). In Story mode most of them sit out the war for now ("asleep",
  // world.ts), all but the five of East Asia (EAST_ASIA, 1.8); in Free-for-all they play like everyone else. America's huge peacetime industry had almost no
  // arms factories; Japan's army was small but its war industry large for its size; China had
  // half a billion people and very little industry.
  c('USA', 'United States', 'American', 'democracy', [10, 0, 1], [66, 4, 128, 50, 70]),
  c('JAP', 'Japan', 'Japanese', 'authoritarian', [20, 1, 3], [18, 9, 69, 5, 0.5]),
  c('CHI', 'China', 'Chinese', 'authoritarian', [80, 0, 3], [10, 3, 450, 0.5, 0]),
  c('MAN', 'Manchukuo', 'Manchurian', 'authoritarian', [4, 0, 0], [3, 1, 33, 2, 0]),
  c('CCP', 'Chinese Communists', 'Chinese Communist', 'communist', [4, 0, 0], [1, 1, 5, 0, 0]),
  c('MON', 'Mongolia', 'Mongolian', 'communist', [3, 0, 0], [1, 1, 0.8, 0, 0]),
  c('CAN', 'Canada', 'Canadian', 'democracy', [3, 0, 1], [10, 1, 11, 3, 1]),
  c('AST', 'Australia', 'Australian', 'democracy', [3, 0, 1], [6, 1, 6.8, 2, 0]),
  c('NZL', 'New Zealand', 'New Zealand', 'democracy', [1, 0, 0], [2, 1, 1.6, 0, 0]),
  c('SAF', 'South Africa', 'South African', 'democracy', [2, 0, 0], [4, 1, 9.6, 1, 0]),
  c('SIA', 'Siam', 'Siamese', 'authoritarian', [4, 0, 0], [2, 1, 14, 0, 0]),
  c('IRN', 'Iran', 'Iranian', 'authoritarian', [6, 0, 1], [2, 1, 15, 0, 8]),
  c('AFG', 'Afghanistan', 'Afghan', 'authoritarian', [3, 0, 0], [1, 1, 10, 0, 0]),
  c('SAU', 'Saudi Arabia', 'Saudi', 'authoritarian', [1, 0, 0], [1, 1, 3, 0, 0]),
  c('YEM', 'Yemen', 'Yemeni', 'authoritarian', [1, 0, 0], [1, 1, 3.5, 0, 0]),
  c('OMA', 'Oman', 'Omani', 'authoritarian', [0, 0, 0], [1, 0, 0.5, 0, 0]),
  c('NEP', 'Nepal', 'Nepalese', 'authoritarian', [2, 0, 0], [1, 1, 6, 0, 0]),
  c('ETH', 'Ethiopia', 'Ethiopian', 'authoritarian', [6, 0, 0], [1, 1, 11, 0, 0]),
  c('LIB', 'Liberia', 'Liberian', 'authoritarian', [0, 0, 0], [1, 0, 1.5, 0, 0]),
  c('ICE', 'Iceland', 'Icelandic', 'democracy', [0, 0, 0], [1, 0, 0.1, 0, 0]),
  c('MEX', 'Mexico', 'Mexican', 'authoritarian', [5, 0, 1], [4, 1, 19, 0, 4]),
  c('GUA', 'Guatemala', 'Guatemalan', 'authoritarian', [1, 0, 0], [1, 1, 2.2, 0, 0]),
  c('HON', 'Honduras', 'Honduran', 'authoritarian', [1, 0, 0], [1, 1, 1, 0, 0]),
  c('ELS', 'El Salvador', 'Salvadoran', 'authoritarian', [1, 0, 0], [1, 1, 1.6, 0, 0]),
  c('NIC', 'Nicaragua', 'Nicaraguan', 'authoritarian', [1, 0, 0], [1, 1, 0.8, 0, 0]),
  c('COS', 'Costa Rica', 'Costa Rican', 'democracy', [0, 0, 0], [1, 0, 0.6, 0, 0]),
  c('PAN', 'Panama', 'Panamanian', 'democracy', [0, 0, 0], [1, 0, 0.6, 0, 0]),
  c('CUB', 'Cuba', 'Cuban', 'authoritarian', [1, 0, 0], [1, 1, 4, 0, 0]),
  c('HAI', 'Haiti', 'Haitian', 'authoritarian', [0, 0, 0], [1, 0, 2.6, 0, 0]),
  c('DOM', 'Dominican Republic', 'Dominican', 'authoritarian', [1, 0, 0], [1, 1, 1.5, 0, 0]),
  c('COL', 'Colombia', 'Colombian', 'democracy', [2, 0, 0], [2, 1, 8.5, 0, 1]),
  c('VEN', 'Venezuela', 'Venezuelan', 'authoritarian', [1, 0, 0], [1, 1, 3.4, 0, 4]),
  c('ECU', 'Ecuador', 'Ecuadorian', 'authoritarian', [1, 0, 0], [1, 1, 2.6, 0, 0]),
  c('PER', 'Peru', 'Peruvian', 'authoritarian', [2, 0, 0], [1, 1, 6.5, 0, 1]),
  c('BOL', 'Bolivia', 'Bolivian', 'authoritarian', [2, 0, 0], [1, 1, 2.7, 0, 0]),
  c('PAR', 'Paraguay', 'Paraguayan', 'authoritarian', [2, 0, 0], [1, 1, 1, 0, 0]),
  c('URU', 'Uruguay', 'Uruguayan', 'authoritarian', [1, 0, 0], [1, 1, 2, 0, 0]),
  c('CHL', 'Chile', 'Chilean', 'democracy', [3, 0, 0], [2, 1, 4.7, 0, 0]),
  c('ARG', 'Argentina', 'Argentine', 'authoritarian', [5, 0, 1], [7, 1, 13, 0, 2]),
  c('BRA', 'Brazil', 'Brazilian', 'democracy', [6, 0, 1], [6, 1, 41, 0, 0]),
];

/** How many of the countries above were on the Europe-only map (versions 1.0 to 1.6). */
export const EUROPE_COUNTRIES = 31;
/** The countries that joined with the world map of version 1.7. */
export const WORLD_COUNTRIES: string[] = COUNTRIES.slice(EUROPE_COUNTRIES).map((c) => c.name);
/**
 * The countries of the war in China and on the Soviet border (version 1.8): in Story mode they
 * are awake from the start. The rest of the world still sits out the war (World.asleep).
 */
export const EAST_ASIA: string[] = ['Japan', 'China', 'Manchukuo', 'Chinese Communists', 'Mongolia'];
/** The countries asleep at the start of a new Story game. */
export const STORY_ASLEEP: string[] = WORLD_COUNTRIES.filter((c) => !EAST_ASIA.includes(c));

export const countryByName = (name: string): Country => {
  const found = COUNTRIES.find((k) => k.name === name);
  if (!found) throw new Error(`No country called ${name}`);
  return found;
};
