/**
 * Save slots in the browser's local storage.
 *
 * A save holds only the settings (including the seed) and the list of decisions. Loading
 * replays those decisions through the model, which rebuilds exactly the same game.
 * That keeps saves tiny and guarantees they are always consistent with the model.
 */
import { initialState, step } from '../sim/model';
import type { Decision, EconomyState, Settings } from '../sim/types';

export const SLOTS = ['auto', '1', '2', '3'] as const;
export type Slot = (typeof SLOTS)[number];

export interface SaveFile {
  version: 1;
  settings: Settings;
  decisions: Decision[];
  savedAt: string;
}

const key = (slot: Slot) => `black-swan:save:${slot}`;

export function writeSave(slot: Slot, settings: Settings, decisions: Decision[]): boolean {
  try {
    const file: SaveFile = { version: 1, settings, decisions, savedAt: new Date().toISOString() };
    localStorage.setItem(key(slot), JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export function readSave(slot: Slot): SaveFile | null {
  try {
    const raw = localStorage.getItem(key(slot));
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    return file.version === 1 ? file : null;
  } catch {
    return null;
  }
}

export function deleteSave(slot: Slot): void {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    /* storage unavailable: nothing to delete */
  }
}

/** Rebuild the game from a save by replaying every decision. */
export function replay(file: SaveFile): EconomyState {
  let s = initialState(file.settings);
  for (const d of file.decisions) s = step(s, d);
  return s;
}
