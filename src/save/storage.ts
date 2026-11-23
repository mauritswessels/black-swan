/**
 * Save slots.
 *
 * A save holds the whole game state as plain JSON, plus a one-line summary for the
 * save screen. (The central bank game saved only the list of decisions and replayed
 * them; a war has far too many orders for that to load quickly.)
 *
 * In the Mac app each slot is a real file in the app's own folder,
 * ~/Library/Application Support/app.blackswan.game/saves (auto.json, 1.json, 2.json, 3.json),
 * so saves survive updates, are shared by `npm run app` and the installed app, and can be
 * copied to another Mac. The files are read once when the game starts (`initSaves`) and
 * kept in memory, so the rest of the game can read a save at once. In a browser, saves
 * live in the browser's local storage, as before.
 */
import { inApp, invoke } from '../native';

export const SLOTS = ['auto', '1', '2', '3'] as const;
export type Slot = (typeof SLOTS)[number];

/**
 * The save format. Version 11 (game 1.2) added the front line in battles and the war replay;
 * version 12 (game 1.3) added armies; version 13 (game 1.4) added aimed air wings and fleets,
 * paratroopers and joint attacks; version 14 (game 1.5) the finer map of 280 provinces and deep
 * attacks; version 15 (game 1.7) the world map. Saves from version 10 on still load (see
 * upgrade.ts); those from before 1.7 load as Europe-only games.
 */
export const SAVE_VERSION = 15;
const READABLE = [10, 11, 12, 13, 14, 15];

export interface SaveFile<State = unknown> {
  version: number;
  /** Shown on the save screen, e.g. "France · 7 March 1936". */
  summary: string;
  state: State;
  savedAt: string;
}

const key = (slot: Slot) => `black-swan:war:save:${slot}`;

/** How saves are kept: files in the Mac app, local storage in a browser. Tests can swap it. */
export interface SaveBackend {
  /** Every save there is, by slot, as JSON text. */
  readAll(): Promise<Partial<Record<Slot, string>>>;
  write(slot: Slot, text: string): Promise<void>;
  remove(slot: Slot): Promise<void>;
}

const fileBackend: SaveBackend = {
  readAll: () => invoke<Partial<Record<Slot, string>>>('read_saves'),
  write: (slot, text) => invoke<void>('write_save', { slot, contents: text }),
  remove: (slot) => invoke<void>('delete_save', { slot }),
};

/** The saves in memory when files are used; null means local storage is used directly. */
let files: Map<Slot, string> | null = null;
let backend: SaveBackend | null = null;
/** Writes still on their way to the disk. */
let pending: Promise<void> = Promise.resolve();
/** The last thing that went wrong while writing a file, for the save screen. */
let lastError = '';
/** Parsed saves, so the title screen does not parse a large save on every redraw. */
const parsed = new Map<Slot, { text: string; file: SaveFile | null }>();

function localGet(slot: Slot): string | null {
  try {
    return localStorage.getItem(key(slot));
  } catch {
    return null;
  }
}
function localSet(slot: Slot, text: string): boolean {
  try {
    localStorage.setItem(key(slot), text);
    return true;
  } catch {
    return false;
  }
}
function localRemove(slot: Slot): void {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    /* storage unavailable: nothing to delete */
  }
}

/**
 * Read the save files once, before the game first draws. In the app, saves made before
 * version 1.0 (kept in the window's local storage) are copied into files the first time.
 * If the files cannot be read, the game carries on with local storage.
 */
export async function initSaves(use: SaveBackend | null = inApp() ? fileBackend : null): Promise<void> {
  backend = use;
  files = null;
  parsed.clear();
  if (!backend) return;
  try {
    const found = await backend.readAll();
    const map = new Map<Slot, string>();
    for (const slot of SLOTS) {
      const text = found[slot];
      if (text) map.set(slot, text);
    }
    files = map;
  } catch (e) {
    lastError = `Save files could not be read (${String(e)}), so saves are kept inside the app for now.`;
    backend = null;
    return;
  }
  for (const slot of SLOTS) {
    const old = localGet(slot);
    if (!old || files.has(slot)) continue;
    files.set(slot, old);
    queue(slot, old, () => localRemove(slot));
  }
}

function queue(slot: Slot, text: string, then?: () => void): void {
  const b = backend;
  if (!b) return;
  pending = pending
    .then(() => b.write(slot, text))
    .then(() => {
      then?.();
    })
    .catch((e) => {
      lastError = `The save could not be written to its file (${String(e)}). It is kept inside the app instead.`;
      localSet(slot, text);
    });
}

/** Wait until every save has reached the disk (before the app restarts for an update). */
export function flushSaves(): Promise<void> {
  return pending;
}

/** What went wrong with the save files, if anything. */
export const saveProblem = (): string => lastError;

/** True when saves are real files (the Mac app). */
export const savesAreFiles = (): boolean => files !== null;

export function writeSave<State>(slot: Slot, summary: string, state: State): boolean {
  let text: string;
  try {
    const file: SaveFile<State> = { version: SAVE_VERSION, summary, state, savedAt: new Date().toISOString() };
    text = JSON.stringify(file);
  } catch {
    return false;
  }
  if (files) {
    files.set(slot, text);
    queue(slot, text);
    return true;
  }
  return localSet(slot, text);
}

export function readSave<State = unknown>(slot: Slot): SaveFile<State> | null {
  const text = files ? files.get(slot) ?? null : localGet(slot);
  if (!text) return null;
  const hit = parsed.get(slot);
  if (hit && hit.text === text) return hit.file as SaveFile<State> | null;
  let file: SaveFile<State> | null = null;
  try {
    const f = JSON.parse(text) as SaveFile<State>;
    file = READABLE.includes(f.version) ? f : null;
  } catch {
    file = null;
  }
  parsed.set(slot, { text, file });
  return file;
}

export function deleteSave(slot: Slot): void {
  localRemove(slot);
  parsed.delete(slot);
  if (files && backend) {
    files.delete(slot);
    const b = backend;
    pending = pending.then(() => b.remove(slot)).catch(() => undefined);
  }
}

/** The folder the save files are in (Mac app only). */
export async function savesFolder(): Promise<string | null> {
  if (!files) return null;
  try {
    return await invoke<string>('saves_folder');
  } catch {
    return null;
  }
}

/** Open the saves folder in Finder (Mac app only). */
export function showSavesFolder(): void {
  if (files) void invoke('show_saves_folder').catch(() => undefined);
}
