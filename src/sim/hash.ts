/**
 * A fingerprint of the whole world: a short code that changes if anything in it changes.
 *
 * For multiplayer later: every computer runs the same simulation from the same seed and the
 * same orders, so every computer should have the same fingerprint at the end of each day. If
 * one ever differs, that computer has drifted out of step and needs the world sent again.
 * Saves can carry it too, to spot a damaged file.
 *
 * The world is plain data (see types.ts), so JSON is a faithful copy of it. The hash is
 * "cyrb53": fast, 53 bits, built from exact integer steps only, so it is the same everywhere.
 */
import type { World } from './types';

/** A 53-bit hash of a string, as 14 hex digits. */
export function hashText(text: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(16).padStart(14, '0');
}

/** The world's fingerprint. Two worlds with the same fingerprint are, for all purposes, the same. */
export const worldHash = (w: World): string => hashText(JSON.stringify(w));
