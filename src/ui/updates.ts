/**
 * Updates for the Mac app.
 *
 * Each new version is built by GitHub (.github/workflows/release.yml) and published as a
 * release with a small file, latest.json, that says which version is newest and where to
 * download it. The app reads that file, and if the version is newer it can download the new
 * app, check its signature (so only a build made with our key is ever installed) and restart.
 * Nothing is installed without the player pressing Update.
 */
import { create } from 'zustand';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { APP_VERSION, inApp } from '../native';
import { flushSaves } from '../save/storage';
import { isNewer } from './releaseNotes';

export type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'current'; at: number }
  | { kind: 'available'; version: string; notes: string; date?: string }
  | { kind: 'downloading'; version: string; got: number; total: number | null }
  | { kind: 'restarting'; version: string }
  | { kind: 'error'; message: string };

interface UpdateStore {
  status: UpdateStatus;
  /** The player pressed Later: no banner until the next start. */
  snoozed: boolean;
  /** Set after an update: the version it brought and its notes, shown once. */
  justUpdated: { version: string; notes: string } | null;
}

export const useUpdates = create<UpdateStore>(() => ({ status: { kind: 'idle' }, snoozed: false, justUpdated: readJustUpdated() }));

/** Why this copy cannot update itself, or '' if it can. */
export function cannotUpdate(): string {
  if (!inApp()) return 'Updates are for the Mac app. In a browser, get the newest version with npm run update.';
  if (import.meta.env.DEV) return 'This copy runs from the code (npm run app), so it updates with npm run update. The installed app updates itself.';
  return '';
}

let found: Update | null = null;

/** Ask GitHub whether there is a newer version. Quiet checks (at start) never show errors. */
export async function checkForUpdates(quiet = false): Promise<void> {
  const set = useUpdates.setState;
  const now = useUpdates.getState().status.kind;
  if (cannotUpdate() || now === 'checking' || now === 'downloading' || now === 'restarting') return;
  set({ status: { kind: 'checking' } });
  try {
    const u = await check({ timeout: 20000 });
    if (u && isNewer(u.version, APP_VERSION)) {
      found = u;
      set({ status: { kind: 'available', version: u.version, notes: u.body ?? '', date: u.date } });
    } else {
      found = null;
      set({ status: { kind: 'current', at: Date.now() } });
    }
  } catch (e) {
    set({ status: quiet ? { kind: 'idle' } : { kind: 'error', message: `Could not reach GitHub to check (${String(e)}). Check the internet connection and try again.` } });
  }
}

/**
 * Download and install the update, then restart. `beforeRestart` saves the game in progress;
 * the restart waits until every save has reached the disk.
 */
export async function installUpdate(beforeRestart?: () => void): Promise<void> {
  const set = useUpdates.setState;
  const s = useUpdates.getState().status;
  if (!found || s.kind !== 'available') return;
  const { version, notes } = s;
  let got = 0;
  let total: number | null = null;
  set({ status: { kind: 'downloading', version, got, total } });
  try {
    await found.downloadAndInstall((e) => {
      if (e.event === 'Started') total = e.data.contentLength ?? null;
      if (e.event === 'Progress') got += e.data.chunkLength;
      set({ status: { kind: 'downloading', version, got, total } });
    });
    set({ status: { kind: 'restarting', version } });
    beforeRestart?.();
    await flushSaves();
    writeJustUpdated({ version, notes });
    await relaunch();
  } catch (e) {
    set({ status: { kind: 'error', message: `The update did not install (${String(e)}). Your game is safe; try again later.` } });
  }
}

export const snoozeUpdate = () => useUpdates.setState({ snoozed: true });

const UPDATED_KEY = 'black-swan:updated';
function writeJustUpdated(v: { version: string; notes: string }): void {
  try {
    localStorage.setItem(UPDATED_KEY, JSON.stringify(v));
  } catch {
    /* not shown then: no harm */
  }
}
function readJustUpdated(): { version: string; notes: string } | null {
  try {
    const raw = localStorage.getItem(UPDATED_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { version: string; notes: string };
    // Only if this really is the version that was installed.
    return v.version === APP_VERSION ? v : (localStorage.removeItem(UPDATED_KEY), null);
  } catch {
    return null;
  }
}
/** The player has read what is new. */
export function dismissJustUpdated(): void {
  try {
    localStorage.removeItem(UPDATED_KEY);
  } catch {
    /* ignore */
  }
  useUpdates.setState({ justUpdated: null });
}
