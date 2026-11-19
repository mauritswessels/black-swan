/**
 * Fortress cities: big cities ringed with forts that held out under siege.
 *
 * Attacking one is like attacking up into hills: each division attacking the province hits
 * at FORTRESS_ATTACK (70%) of its power, whoever holds it. The defenders fight from forts,
 * cellars and barricades, street by street.
 *
 * Only Warsaw for now. The province map is coarse, and Warsaw's province touches Germany on
 * several sides, so without its forts one battle there ended the Polish war in under three
 * weeks. The real city held a three-week siege.
 */
import { PROVINCES } from './map';

export const FORTRESS_ATTACK = 0.7;

/** Each fortress city by name, and what happened there. */
export const FORTRESSES: { city: string; history: string }[] = [
  {
    city: 'Warsaw',
    history: 'Warsaw, with the old Russian forts around it and the fortress of Modlin to the north, was besieged from 8 to 28 September 1939. The first German tank attack on the city, on 9 September, was thrown back. It gave in after three weeks of shelling and bombing, with its water and food running out.',
  },
];

const idOf = (city: string): number => {
  const p = PROVINCES.find((q) => q.city === city) ?? PROVINCES.find((q) => q.name === city);
  if (!p) throw new Error(`fortresses.ts: no province with the city ${city}`);
  return p.id;
};

const BY_PROVINCE = new Map(FORTRESSES.map((f) => [idOf(f.city), f]));

/** The fortress city in a province, if there is one. */
export const fortressAt = (province: number): { city: string; history: string } | null => BY_PROVINCE.get(province) ?? null;

/** What attackers keep of their power attacking this province: FORTRESS_ATTACK for a fortress city, else 1. */
export const fortressAttack = (province: number): number => (BY_PROVINCE.has(province) ? FORTRESS_ATTACK : 1);
