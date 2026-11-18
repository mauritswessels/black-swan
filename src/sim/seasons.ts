/**
 * Seasons and the ground, worked out from the date alone, so they are the same on every
 * computer.
 *
 *   winter   1 December to the end of February: snow in the Soviet Union, the Nordic countries,
 *            Poland, the Baltic states and Romania. Marching is slower and the front moves at
 *            three quarters of its pace. An army from outside the Soviet Union and the Nordic
 *            countries also attacks at 75% there (WINTER_ATTACK), and wears out twice as fast.
 *   mud      the spring thaw (15 March to 30 April) and the autumn rains (10 October to
 *            20 November), in the Soviet Union, Poland, the Baltic states and Romania. The
 *            Russians call it the rasputitsa, "the time without roads". Marching takes twice as
 *            long, attacks hit 20% less hard and the front moves at half its pace.
 *   heat     June to August in the desert. Divisions there recover their organisation at half
 *            speed and wear out twice as fast at the front.
 *
 * Which country a province belonged to in 1936 decides its climate, not who holds it now.
 */
import { PROVINCES } from './map';

export type Ground = 'dry' | 'snow' | 'mud' | 'heat';

/** Countries where an invader fights the cold as well as the defenders. */
export const WINTER_LANDS = new Set(['Soviet Union', 'Finland', 'Norway', 'Sweden']);
/** Where snow lies in winter: the winter lands, and the east of Europe. */
export const SNOW_LANDS = new Set([...WINTER_LANDS, 'Poland', 'Lithuania', 'Latvia', 'Estonia', 'Romania']);
/** Where the thaw and the autumn rains turn the roads to mud. */
export const MUD_LANDS = new Set(['Soviet Union', 'Poland', 'Lithuania', 'Latvia', 'Estonia', 'Romania']);
/** From December to February an army attacking into a winter land, other than its own, keeps this share of its hitting power. */
export const WINTER_ATTACK = 0.75;

/** Marching speed on each kind of ground (0.5 = it takes twice as long). */
export const GROUND_MARCH: Record<Ground, number> = { dry: 1, snow: 0.75, mud: 0.5, heat: 1 };
/** How fast the front line moves on each kind of ground. */
export const GROUND_PUSH: Record<Ground, number> = { dry: 1, snow: 0.75, mud: 0.5, heat: 1 };
/** Hitting power of an attack into each kind of ground (snow is the WINTER_ATTACK rule instead, which only hits invaders). */
export const GROUND_ATTACK: Record<Ground, number> = { dry: 1, snow: 1, mud: 0.8, heat: 1 };

/** Month (0 = January) and day of the month of a game day. Uses UTC, so it is the same on every computer. */
export function calendar(startDate: string, day: number): { month: number; date: number } {
  const d = new Date(`${startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day);
  return { month: d.getUTCMonth(), date: d.getUTCDate() };
}

export function isWinter(startDate: string, day: number): boolean {
  const m = calendar(startDate, day).month;
  return m === 11 || m <= 1;
}

export type Season = 'winter' | 'thaw' | 'spring' | 'summer' | 'autumn' | 'rains';

/** The season of a game day, as the ground sees it. */
export function seasonOf(startDate: string, day: number): Season {
  const { month, date } = calendar(startDate, day);
  if (month === 11 || month <= 1) return 'winter';
  if ((month === 2 && date >= 15) || month === 3) return 'thaw';
  if (month === 2 || month === 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if ((month === 9 && date >= 10) || (month === 10 && date <= 20)) return 'rains';
  return 'autumn';
}

/** The ground in a province in a given season. */
export function groundIn(province: number, season: Season): Ground {
  const p = PROVINCES[province];
  if (season === 'winter') return SNOW_LANDS.has(p.owner) ? 'snow' : 'dry';
  if (season === 'thaw' || season === 'rains') return MUD_LANDS.has(p.owner) ? 'mud' : 'dry';
  if (season === 'summer') return p.terrain === 'desert' ? 'heat' : 'dry';
  return 'dry';
}

/** The ground in a province on a game day. */
export const groundOn = (province: number, startDate: string, day: number): Ground => groundIn(province, seasonOf(startDate, day));

/** The ground in every province on a game day, by province id. */
export function groundMap(startDate: string, day: number): Ground[] {
  const season = seasonOf(startDate, day);
  return PROVINCES.map((p) => groundIn(p.id, season));
}

export const SEASON_WORDS: Record<Season, string> = {
  winter: 'Winter: snow in the east and the north',
  thaw: 'Spring thaw: mud in the east',
  spring: 'Spring: the ground is dry',
  summer: 'Summer: heat in the desert',
  autumn: 'Autumn: the ground is dry',
  rains: 'Autumn rains: mud in the east',
};

export const GROUND_WORDS: Record<Ground, string> = {
  dry: 'dry ground',
  snow: 'snow: marching at 75% speed, the front moves at 75% of its pace',
  mud: 'mud: marching takes twice as long, attacks hit 20% less hard, the front moves at half pace',
  heat: 'desert heat: organisation comes back at half speed, twice the wear at the front',
};
