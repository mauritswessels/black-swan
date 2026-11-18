/** Which lessons the player has finished, and whether advisor tips are on. Kept on this computer only. */
const DONE_KEY = 'black-swan:lessons';
const TIPS_KEY = 'black-swan:tips';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* fine: it just won't be remembered */
  }
}

export const lessonsDone = (): string[] => read<string[]>(DONE_KEY, []);
export function markLessonDone(id: string): void {
  const done = lessonsDone();
  if (!done.includes(id)) write(DONE_KEY, [...done, id]);
}

/** Advisor tips: on or off, and the ones already read. */
export interface TipState {
  on: boolean;
  seen: string[];
}
export const tipState = (): TipState => read<TipState>(TIPS_KEY, { on: true, seen: [] });
export const saveTipState = (t: TipState): void => write(TIPS_KEY, t);
