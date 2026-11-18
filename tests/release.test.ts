/**
 * Version 1.0: the release set-up, settings, update notes and save files. These guard the
 * things that would break updates for everyone who has the app installed: version numbers that
 * disagree, a missing changelog section, a lost signing key setting.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach } from 'vitest';
// @ts-expect-error plain JavaScript scripts
import { versions } from '../scripts/set-version.mjs';
// @ts-expect-error plain JavaScript scripts
import { notesFor, titleFor } from '../scripts/release-notes.mjs';
import { isNewer, plainNotes } from '../src/ui/releaseNotes';
import { cleanSettings, DEFAULT_SETTINGS, TEXT_SIZES } from '../src/ui/settings';
import { flushSaves, initSaves, readSave, writeSave, deleteSave, savesAreFiles, saveProblem, type SaveBackend, type Slot } from '../src/save/storage';

const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json')) as { version: string; scripts: Record<string, string> };
const tauri = JSON.parse(read('src-tauri/tauri.conf.json'));

describe('the version', () => {
  it('is the same in every file that holds it', () => {
    const v = versions() as Record<string, string>;
    expect(Object.values(v).every((x) => x === pkg.version), JSON.stringify(v)).toBe(true);
  });
  it('is the one the Mac app is built with', () => {
    expect(tauri.version).toBe('../package.json');
  });
  it('has its own section in the changelog, which becomes the release notes', () => {
    const changelog = read('CHANGELOG.md');
    expect(notesFor(changelog, pkg.version).length).toBeGreaterThan(200);
    expect(titleFor(changelog, pkg.version)).not.toBe('');
  });
});

describe('release notes from the changelog', () => {
  const log = '# Changelog\n\n## 1.0.10: Ten\n\n- ten\n\n## 1.0.1: One (2026-12-01)\n\n- **Faster.** The map\n  draws quicker.\n- Fixes\n\n## War game, Stage I-2\n\nold\n';
  it('takes exactly the section for that version', () => {
    expect(notesFor(log, '1.0.1')).toBe('- **Faster.** The map\n  draws quicker.\n- Fixes');
    expect(notesFor(log, '1.0.10')).toBe('- ten');
    expect(notesFor(log, '1.0.2')).toBe('');
    expect(titleFor(log, '1.0.1')).toBe('One (2026-12-01)');
  });
  it('are shown as plain bullets, with wrapped lines joined', () => {
    expect(plainNotes(notesFor(log, '1.0.1'))).toEqual([
      { kind: 'li', text: 'Faster. The map draws quicker.' },
      { kind: 'li', text: 'Fixes' },
    ]);
    expect(plainNotes('Some `code` and a [link](https://x.y).\n')).toEqual([{ kind: 'p', text: 'Some code and a link.' }]);
  });
});

describe('comparing versions', () => {
  it('knows which is newer', () => {
    expect(isNewer('1.0.1', '1.0.0')).toBe(true);
    expect(isNewer('1.10.0', '1.9.9')).toBe(true);
    expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    expect(isNewer('0.12.0', '1.0.0')).toBe(false);
    expect(isNewer('2.0', '1.9.9')).toBe(true);
  });
});

describe('the updater', () => {
  it('only trusts updates signed with our key, from our GitHub releases', () => {
    const u = tauri.plugins.updater;
    expect(atob(u.pubkey)).toContain('minisign public key');
    expect(u.endpoints).toEqual(['https://github.com/mauritswessels/black-swan/releases/latest/download/latest.json']);
  });
  it('is allowed to check, install and restart, and nothing more', () => {
    const cap = JSON.parse(read('src-tauri/capabilities/default.json'));
    expect(cap.permissions).toEqual(expect.arrayContaining(['updater:default', 'process:allow-restart']));
    expect(cap.permissions).not.toContain('process:default');
  });
  it('makes signed update files only in the release build', () => {
    expect(tauri.bundle.createUpdaterArtifacts).toBeUndefined();
    expect(JSON.parse(read('src-tauri/tauri.release.conf.json')).bundle.createUpdaterArtifacts).toBe(true);
    const workflow = read('.github/workflows/release.yml');
    expect(workflow).toContain('--config src-tauri/tauri.release.conf.json');
    expect(workflow).toContain('universal-apple-darwin');
  });
  it('the app is signed for Apple Silicon even without a developer account', () => {
    expect(tauri.bundle.macOS.signingIdentity).toBe('-');
  });
  it('Cargo.toml has no features Tauri would rewrite on a Mac', () => {
    // `tauri dev` rewrites the features list to match the config; a mismatch would leave a
    // changed Cargo.toml behind and stop `npm run update`.
    expect(read('src-tauri/Cargo.toml')).toContain('tauri = { version = "2.12.5", features = [] }');
  });
  it('set-version is an npm script', () => {
    expect(pkg.scripts['set-version']).toBe('node scripts/set-version.mjs');
  });
});

describe('settings', () => {
  it('fill in anything missing or broken with the defaults', () => {
    expect(cleanSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(cleanSettings({ volume: 7, textSize: 3, pauseOnCard: 'yes', reduceMotion: true })).toEqual({ ...DEFAULT_SETTINGS, volume: 1, reduceMotion: true });
    expect(cleanSettings({ volume: -1, textSize: 1.2 })).toEqual({ ...DEFAULT_SETTINGS, volume: 0, textSize: 1.2 });
  });
  it('offer the normal size', () => {
    expect(TEXT_SIZES.some((t) => t.value === 1)).toBe(true);
  });
});

/** Save files, with a pretend disk standing in for the Mac app. */
function fakeDisk(start: Partial<Record<Slot, string>> = {}, failWrites = false) {
  const disk = new Map(Object.entries(start)) as Map<Slot, string>;
  const backend: SaveBackend = {
    readAll: async () => Object.fromEntries(disk),
    write: async (slot, text) => {
      await new Promise((r) => setTimeout(r, 5));
      if (failWrites) throw new Error('disk full');
      disk.set(slot, text);
    },
    remove: async (slot) => void disk.delete(slot),
  };
  return { disk, backend };
}

class MemoryStorage {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

describe('save files', () => {
  let local: MemoryStorage;
  beforeEach(() => {
    local = new MemoryStorage();
    (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = local;
  });

  it('in a browser, saves go to local storage as before', async () => {
    await initSaves(null);
    expect(savesAreFiles()).toBe(false);
    expect(writeSave('1', 'France · 1936', { day: 3 })).toBe(true);
    expect(local.getItem('black-swan:war:save:1')).toContain('France · 1936');
    expect(readSave<{ day: number }>('1')?.state.day).toBe(3);
  });

  it('in the app, a save is a file, and can be read at once while it is still being written', async () => {
    const { disk, backend } = fakeDisk();
    await initSaves(backend);
    expect(savesAreFiles()).toBe(true);
    writeSave('2', 'Britain · 1940', { day: 1500 });
    expect(readSave<{ day: number }>('2')?.state.day).toBe(1500);
    expect(disk.has('2')).toBe(false);
    await flushSaves();
    expect(JSON.parse(disk.get('2')!).summary).toBe('Britain · 1940');
    expect(local.getItem('black-swan:war:save:2')).toBeNull();
    deleteSave('2');
    await flushSaves();
    expect(disk.has('2')).toBe(false);
    expect(readSave('2')).toBeNull();
  });

  it('copies saves from before 1.0 into files once, and files win', async () => {
    const old = (summary: string) => JSON.stringify({ version: 10, summary, state: {}, savedAt: '2026-11-17T10:00:00Z' });
    local.setItem('black-swan:war:save:auto', old('Old autosave'));
    local.setItem('black-swan:war:save:3', old('Old slot 3'));
    const { disk, backend } = fakeDisk({ '3': old('File slot 3') });
    await initSaves(backend);
    await flushSaves();
    expect(JSON.parse(disk.get('auto')!).summary).toBe('Old autosave');
    expect(local.getItem('black-swan:war:save:auto')).toBeNull();
    expect(readSave('3')?.summary).toBe('File slot 3');
  });

  it('if a file cannot be written, the save is kept in local storage instead and the player is told', async () => {
    const { backend } = fakeDisk({}, true);
    await initSaves(backend);
    writeSave('1', 'Italy · 1939', { day: 9 });
    await flushSaves();
    expect(local.getItem('black-swan:war:save:1')).toContain('Italy · 1939');
    expect(saveProblem()).toMatch(/could not be written/);
  });

  it('only the four slots exist', () => {
    const rust = read('src-tauri/src/lib.rs');
    expect(rust).toContain('const SLOTS: [&str; 4] = ["auto", "1", "2", "3"];');
  });
});
