/**
 * Save slots.
 *
 * A save holds the whole game state as plain JSON, plus a one-line summary for the
 * save screen. (The central bank game saved only the list of decisions and replayed
 * them; a war has far too many orders for that to load quickly.)
 *
 * For now saves live in the app's local storage. A later stage moves them to real
 * files in the app's own folder on the Mac, behind these same four functions.
 */

export const SLOTS = ['auto', '1', '2', '3'] as const;
export type Slot = (typeof SLOTS)[number];

export interface SaveFile<State = unknown> {
  version: 9;
  /** Shown on the save screen, e.g. "France · 7 March 1936". */
  summary: string;
  state: State;
  savedAt: string;
}

const key = (slot: Slot) => `black-swan:war:save:${slot}`;

export function writeSave<State>(slot: Slot, summary: string, state: State): boolean {
  try {
    const file: SaveFile<State> = { version: 9, summary, state, savedAt: new Date().toISOString() };
    localStorage.setItem(key(slot), JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export function readSave<State = unknown>(slot: Slot): SaveFile<State> | null {
  try {
    const raw = localStorage.getItem(key(slot));
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile<State>;
    return file.version === 9 ? file : null;
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
