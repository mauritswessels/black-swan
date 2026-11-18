/**
 * The player's settings, kept on this computer. Sound on or off and the advisor tips have
 * their own older keys (store.ts, lessonProgress.ts); everything else lives here.
 */
export interface Settings {
  /** Loudness of every sound, 0 to 1. */
  volume: number;
  /** Stop the clock when an enemy attacks one of your provinces. */
  pauseOnAttack: boolean;
  /** Stop the clock when a history card arrives. */
  pauseOnCard: boolean;
  /** Size of everything in the window, 1 = normal. The Mac app only. */
  textSize: number;
  /** Switch off moving and fading effects, whatever the Mac's own setting says. */
  reduceMotion: boolean;
  /** Look for a new version each time the app starts. */
  checkUpdates: boolean;
  /** A low rumble of guns that grows with the battles in view. */
  battleSounds: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.5,
  pauseOnAttack: true,
  pauseOnCard: true,
  textSize: 1,
  reduceMotion: false,
  checkUpdates: true,
  battleSounds: true,
};

/** The sizes offered in Settings. */
export const TEXT_SIZES: { value: number; label: string }[] = [
  { value: 0.9, label: 'Smaller' },
  { value: 1, label: 'Normal' },
  { value: 1.1, label: 'Larger' },
  { value: 1.2, label: 'Largest' },
];

const KEY = 'black-swan:settings';

/** Settings from storage, with anything missing or broken replaced by its default. */
export function cleanSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const bool = (k: 'pauseOnAttack' | 'pauseOnCard' | 'reduceMotion' | 'checkUpdates' | 'battleSounds') => (typeof r[k] === 'boolean' ? (r[k] as boolean) : DEFAULT_SETTINGS[k]);
  const volume = typeof r.volume === 'number' && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : DEFAULT_SETTINGS.volume;
  const textSize = TEXT_SIZES.some((t) => t.value === r.textSize) ? (r.textSize as number) : DEFAULT_SETTINGS.textSize;
  return {
    volume,
    pauseOnAttack: bool('pauseOnAttack'),
    pauseOnCard: bool('pauseOnCard'),
    textSize,
    reduceMotion: bool('reduceMotion'),
    checkUpdates: bool('checkUpdates'),
    battleSounds: bool('battleSounds'),
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return cleanSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function storeSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* fine: it just won't be remembered */
  }
}
