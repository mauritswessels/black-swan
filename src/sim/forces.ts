/**
 * The navy and the air force together: what the rest of the engine needs from them.
 *
 * Each day world.ts calls `pictures` once (who controls each sea zone and the sky over each
 * province), then `runForces` (sea battles, the convoy war, air losses, bombing, troops
 * sailing), and uses the same pictures for supply and for the land battles.
 */
import { airPicture, cannotRaiseWing, giveWingOrder, MEN_PER_WING, navalAir, runAir, startWings, type AirPicture } from './air';
import { musterPoint } from './economy';
import { giveFleetOrder, giveShipOrder, navalPicture, runNavy, runShipping, startFleets, type ForceDraft } from './navy';
import { Rng } from './rng';
import type { SeaPicture } from './sea';
import type { Order, World } from './types';

export type ForceOrder = Extract<Order, { type: 'ship' | 'fleet' | 'transfer' | 'wing' | 'raiseWing' }>;
export const isForceOrder = (o: Order): o is ForceOrder => o.type === 'ship' || o.type === 'fleet' || o.type === 'transfer' || o.type === 'wing' || o.type === 'raiseWing';

export interface Pictures {
  sea: SeaPicture;
  air: AirPicture;
}

type View = Pick<World, 'fleets' | 'wings' | 'controller' | 'wars' | 'economies' | 'day'> & { owner?: string[] };

/** Control of the sea and of the sky as things stand. `friends` is each country's allies (allianceMap). */
export function pictures(w: View, friends: Map<string, Set<string>>): Pictures {
  return { sea: navalPicture(w, friends, navalAir(w, friends)), air: airPicture(w, friends) };
}

/** The navies and air forces of 1 January 1936. */
export function startForces(): Pick<World, 'fleets' | 'wings' | 'nextForceId' | 'bombed' | 'clashes' | 'forceLog' | 'nextForceEventId'> {
  const fleets = startFleets();
  const wings = startWings(fleets.length);
  return { fleets, wings, nextForceId: fleets.length + wings.length, bombed: {}, clashes: [], forceLog: [], nextForceEventId: 0 };
}

/** Carry out an order to a fleet, a wing or a division going by sea. Orders that make no sense are ignored. */
export function giveForceOrder(d: ForceDraft, o: ForceOrder, friends: Map<string, Set<string>>, sea: () => SeaPicture): void {
  switch (o.type) {
    case 'fleet':
    case 'transfer':
      giveFleetOrder(d, o);
      break;
    case 'wing':
      giveWingOrder(d, o, friends.get(d.wings.find((x) => x.id === o.wing)?.owner ?? ''));
      break;
    case 'ship': {
      const u = d.units.find((x) => x.id === o.unit);
      if (u) giveShipOrder(d, sea(), friends, u, o.to);
      break;
    }
    case 'raiseWing': {
      const e = d.economies[o.country];
      if (!e || d.capitulated.includes(o.country) || (o.plane !== 'fighter' && o.plane !== 'bomber') || cannotRaiseWing(e, o.plane)) break;
      const base = musterPoint(d.controller, o.country, d.owner);
      if (base === null) break;
      e.stock[o.plane] -= 1;
      e.manpower -= MEN_PER_WING;
      d.wings.push({ id: d.nextForceId++, owner: o.country, type: o.plane, base, mission: o.plane === 'fighter' ? 'superiority' : 'ground', strength: 100, ready: d.day });
      break;
    }
  }
}

/** One day of the war at sea and in the air. */
export function runForces(d: ForceDraft, rng: Rng, p: Pictures, friends: Map<string, Set<string>>): void {
  runNavy(d, rng, p.sea, friends);
  runAir(d, rng, p.air, friends, p.sea);
  runShipping(d, p.sea, friends);
}

/** After a surrender or an annexation: the loser's ships and aircraft are gone. */
export function disband(d: Pick<ForceDraft, 'fleets' | 'wings'>, gone: (country: string) => boolean): void {
  if (d.fleets.some((f) => gone(f.owner))) d.fleets = d.fleets.filter((f) => !gone(f.owner));
  if (d.wings.some((w) => gone(w.owner))) d.wings = d.wings.filter((w) => !gone(w.owner));
}
