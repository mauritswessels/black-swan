/**
 * The great rivers, and the Suez Canal, as the borders between provinces that they run along.
 *
 * Provinces are big, so a river is put on the border it follows most closely. Attacking across
 * one is hard: the attackers have to cross under fire on boats and bridges, so
 *
 *   - each division attacking across a river hits at RIVER_ATTACK (85%) of its power, and
 *   - until the front line is BRIDGEHEAD (20) points into the province, it moves at half pace
 *     for the share of the attack that comes across the river. Once a bridgehead is won, the
 *     front moves as usual.
 *
 * So the front stalls at a river until the crossing is forced, as it did on the Meuse in
 * 1940, the Dnieper in 1943 and the Rhine in 1945.
 */
import { PROVINCES } from './map';

export const RIVER_ATTACK = 0.85;
export const RIVER_PUSH = 0.5;
export const BRIDGEHEAD = 20;

/** Each river and the province borders it runs along, by province name. */
export const RIVERS: { name: string; borders: [string, string][] }[] = [
  { name: 'Rhine', borders: [['Lorraine', 'Württemberg'], ['Palatinate', 'Württemberg'], ['Palatinate', 'Hesse'], ['Bern', 'Württemberg'], ['Graubünden', 'Württemberg'], ['Holland', 'Brabant']] },
  { name: 'Meuse', borders: [['Wallonia', 'Lorraine'], ['Rhineland', 'Brabant']] },
  { name: 'Elbe', borders: [['Schleswig-Holstein', 'Hanover'], ['Magdeburg', 'Brandenburg']] },
  { name: 'Vistula', borders: [['East Prussia', 'Poznań'], ['Warsaw', 'Lublin'], ['Kraków', 'Lublin']] },
  { name: 'Narew', borders: [['Warsaw', 'Białystok'], ['East Prussia', 'Warsaw']] },
  { name: 'Warta', borders: [['Silesia', 'Warsaw']] },
  { name: 'Bzura', borders: [['Poznań', 'Warsaw']] },
  { name: 'Bug', borders: [['Lublin', 'Volhynia']] },
  { name: 'Dniester', borders: [['Bessarabia', 'Vinnitsa'], ['Bessarabia', 'Odessa']] },
  { name: 'Prut', borders: [['Bessarabia', 'Bukovina']] },
  { name: 'Danube', borders: [['Wallachia', 'Varna'], ['Wallachia', 'Sofia'], ['Banat', 'Sofia'], ['Banat', 'Serbia'], ['Banat', 'South Serbia'], ['Wallachia', 'Dobruja'], ['Slovakia', 'Budapest'], ['Slovakia', 'Transdanubia']] },
  { name: 'Dnieper', borders: [['Kiev', 'Poltava'], ['Odessa', 'Zaporozhye'], ['Odessa', 'Dnepropetrovsk'], ['Minsk', 'Moscow']] },
  { name: 'Don', borders: [['Kursk', 'Voronezh'], ['Donbass', 'Stalingrad'], ['Stalingrad', 'Kuban']] },
  { name: 'Svir', borders: [['Karelia', 'Novgorod']] },
  { name: 'Po', borders: [['Lombardy', 'Emilia'], ['Piedmont', 'Emilia']] },
  { name: 'Loire', borders: [['Orléanais', 'Poitou']] },
  { name: 'Ebro', borders: [['Aragon', 'Catalonia']] },
  { name: 'Suez Canal', borders: [['Sinai', 'Cairo']] },
];

const idOf = (name: string): number => {
  const p = PROVINCES.find((q) => q.name === name);
  if (!p) throw new Error(`rivers.ts: no province called ${name}`);
  return p.id;
};
const key = (a: number, b: number): number => (a < b ? a * 1000 + b : b * 1000 + a);

const BY_BORDER = new Map<number, string>();
for (const r of RIVERS) for (const [a, b] of r.borders) BY_BORDER.set(key(idOf(a), idOf(b)), r.name);

/** Every river border as a pair of province ids, with the river's name. */
export const RIVER_BORDERS: { a: number; b: number; river: string }[] = RIVERS.flatMap((r) => r.borders.map(([a, b]) => ({ a: idOf(a), b: idOf(b), river: r.name })));

/** The river between two provinces, or null if there is none. */
export const riverBetween = (a: number, b: number): string | null => BY_BORDER.get(key(a, b)) ?? null;
