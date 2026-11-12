/**
 * App state for the user interface. The UI only reads the world and sends orders to the
 * engine (src/sim); it never does game maths itself.
 */
import { create } from 'zustand';
import type { Mode, World } from '../sim/types';
import { dateLabel, newWorld } from '../sim/world';
import { readSave, writeSave, type Slot } from '../save/storage';
import { sound } from './audio/sound';

export type Screen = 'title' | 'game';

interface Store {
  screen: Screen;
  overlay: null | 'codex' | 'saves' | 'help';
  world: World | null;
  muted: boolean;

  go: (screen: Screen) => void;
  setOverlay: (o: Store['overlay']) => void;
  startGame: (mode: Mode) => void;
  load: (slot: Slot) => boolean;
  save: (slot: Slot) => boolean;
  toggleMute: () => void;
}

const MUTE_KEY = 'black-swan:muted';
const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
};

const MODE_NAME: Record<Mode, string> = { story: 'Story', freeForAll: 'Free-for-all' };
export const summaryOf = (w: World) => `${MODE_NAME[w.mode]} · ${dateLabel(w)}`;

export const useGame = create<Store>((set, get) => ({
  screen: 'title',
  overlay: null,
  world: null,
  muted: readMuted(),

  go: (screen) => set({ screen, overlay: null }),
  setOverlay: (overlay) => set({ overlay }),

  startGame: (mode) => {
    const world = newWorld(mode, String(Date.now()));
    set({ world, screen: 'game', overlay: null });
    writeSave('auto', summaryOf(world), world);
    if (!get().muted) sound.startAmbient();
  },

  load: (slot) => {
    const file = readSave<World>(slot);
    if (!file) return false;
    set({ world: file.state, screen: 'game', overlay: null });
    if (!get().muted) sound.startAmbient();
    return true;
  },

  save: (slot) => {
    const { world } = get();
    return world ? writeSave(slot, summaryOf(world), world) : false;
  },

  toggleMute: () => {
    const muted = !get().muted;
    sound.setMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* fine: the setting just won't be remembered */
    }
    set({ muted });
  },
}));

if (useGame.getState().muted) sound.setMuted(true);
