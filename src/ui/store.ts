/**
 * Game state for the user interface. The UI only reads the economy and sends decisions
 * to the engine (src/sim); it never calculates economics itself.
 */
import { create } from 'zustand';
import { explainQuarter, type Chain } from '../sim/explain';
import { isFinished, initialState, step } from '../sim/model';
import { headlinesFor, type Headline } from '../sim/news';
import { seedFrom } from '../sim/rng';
import type { Decision, EconomyState, Guidance, Settings } from '../sim/types';
import { readSave, replay, writeSave, type Slot } from '../save/storage';
import { sound } from './audio/sound';

export type Screen = 'title' | 'intro' | 'game' | 'report';
export type View = 'war' | 'data';
export type Phase = 'decide' | 'reaction';

interface Store {
  screen: Screen;
  view: View;
  phase: Phase;
  overlay: null | 'codex' | 'saves' | 'help';
  game: EconomyState | null;
  /** The state before the last decision (for the reaction screen). */
  before: EconomyState | null;
  decisions: Decision[];
  draft: Decision;
  headlines: Headline[];
  chains: Chain[];
  muted: boolean;
  speaker: string;
  setupSeed: string;
  setupTarget: Settings['targetMode'];

  go: (screen: Screen) => void;
  setView: (v: View) => void;
  setOverlay: (o: Store['overlay']) => void;
  setSetup: (seed: string, target: Settings['targetMode']) => void;
  startGame: () => void;
  load: (slot: Slot) => boolean;
  save: (slot: Slot) => boolean;
  bumpRate: (dir: 1 | -1) => void;
  setGuidance: (g: Guidance) => void;
  setFx: (fx: number) => void;
  seal: () => void;
  continueQuarter: () => void;
  toggleMute: () => void;
  setSpeaker: (id: string) => void;
}

const MUTE_KEY = 'black-swan:muted';
const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
};

function draftFrom(s: EconomyState): Decision {
  const q = s.history[s.history.length - 1];
  return { rate: q.policyRate, guidance: q.guidance, fxPurchases: 0 };
}

function randomSeedText(): string {
  const words = ['alpine', 'thaler', 'valden', 'glacier', 'harbour', 'meridian', 'falcon', 'quarry', 'lantern', 'cedar'];
  const n = Math.floor(Math.random() * 900 + 100);
  return `${words[Math.floor(Math.random() * words.length)]}-${n}`;
}

export const useGame = create<Store>((set, get) => ({
  screen: 'title',
  view: 'war',
  phase: 'decide',
  overlay: null,
  game: null,
  before: null,
  decisions: [],
  draft: { rate: 1.5, guidance: 'dataDependent', fxPurchases: 0 },
  headlines: [],
  chains: [],
  muted: readMuted(),
  speaker: 'peyer',
  setupSeed: randomSeedText(),
  setupTarget: 'range',

  go: (screen) => set({ screen, overlay: null }),
  setView: (view) => set({ view }),
  setOverlay: (overlay) => set({ overlay }),
  setSetup: (setupSeed, setupTarget) => set({ setupSeed, setupTarget }),

  startGame: () => {
    const { setupSeed, setupTarget } = get();
    const settings: Settings = { seed: seedFrom(setupSeed.trim() || 'kestria'), targetMode: setupTarget, quarters: 20 };
    const game = initialState(settings);
    set({ game, before: null, decisions: [], draft: draftFrom(game), headlines: [], chains: [], phase: 'decide', view: 'war', screen: 'game', speaker: 'peyer' });
    writeSave('auto', settings, []);
    if (!get().muted) sound.startAmbient();
  },

  load: (slot) => {
    const file = readSave(slot);
    if (!file) return false;
    const game = replay(file);
    let before: EconomyState | null = null;
    if (file.decisions.length > 0) before = replay({ ...file, decisions: file.decisions.slice(0, -1) });
    set({
      game,
      before,
      decisions: file.decisions,
      draft: draftFrom(game),
      headlines: before ? headlinesFor(before, game) : [],
      chains: file.decisions.length ? explainQuarter(game) : [],
      phase: 'decide',
      view: 'war',
      overlay: null,
      screen: isFinished(game) ? 'report' : 'game',
    });
    if (!get().muted) sound.startAmbient();
    return true;
  },

  save: (slot) => {
    const { game, decisions } = get();
    return game ? writeSave(slot, game.settings, decisions) : false;
  },

  bumpRate: (dir) => {
    const { draft } = get();
    const rate = Math.round((draft.rate + 0.25 * dir) * 100) / 100;
    if (rate < -0.75 || rate > 12) return;
    sound.step(dir > 0);
    set({ draft: { ...draft, rate } });
  },
  setGuidance: (guidance) => {
    sound.click();
    set({ draft: { ...get().draft, guidance } });
  },
  setFx: (fxPurchases) => {
    sound.click();
    set({ draft: { ...get().draft, fxPurchases } });
  },

  seal: () => {
    const { game, draft, decisions, phase } = get();
    if (!game || phase !== 'decide' || isFinished(game)) return;
    const next = step(game, draft);
    const all = [...decisions, draft];
    const headlines = headlinesFor(game, next);
    sound.seal();
    if (headlines.some((h) => h.urgent)) setTimeout(sound.alert, 700);
    set({ before: game, game: next, decisions: all, headlines, chains: explainQuarter(next), phase: 'reaction' });
    writeSave('auto', next.settings, all);
  },

  continueQuarter: () => {
    const { game } = get();
    if (!game) return;
    sound.next();
    if (isFinished(game)) set({ screen: 'report', phase: 'decide' });
    else set({ phase: 'decide', draft: draftFrom(game), view: 'war' });
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
  setSpeaker: (speaker) => set({ speaker }),
}));

/** "2027 Q1" for quarter index t (t = 0 is the first quarter of the term). */
export function quarterLabel(t: number): string {
  const year = 2027 + Math.floor(t / 4);
  const q = (((t % 4) + 4) % 4) + 1;
  return `${year} Q${q}`;
}
