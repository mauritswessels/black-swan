/**
 * App state for the user interface. The UI only reads the world and sends orders to the
 * engine (src/sim); it never does game maths itself.
 */
import { create } from 'zustand';
import { advance } from '../sim/game';
import { PROVINCES } from '../sim/map';
import type { Mode, Order, World } from '../sim/types';
import { atWar } from '../sim/war';
import { applyOrders, dateLabel, newWorld } from '../sim/world';
import { readSave, writeSave, type Slot } from '../save/storage';
import { sound } from './audio/sound';

export type Screen = 'title' | 'setup' | 'game';
export type MapMode = 'political' | 'terrain' | 'supply' | 'diplomacy';

/** What the sidebar is showing. */
export type Selection =
  | { kind: 'units'; ids: number[] }
  | { kind: 'stack'; province: number; owner: string }
  | { kind: 'province'; id: number }
  | { kind: 'country'; name: string }
  | { kind: 'battle'; id: number }
  | { kind: 'report'; id: number }
  | { kind: 'reports' };

export interface News {
  id: number;
  day: number;
  text: string;
  tone: 'good' | 'bad' | 'plain';
  /** Clicking the headline opens this and centres the map on the province. */
  open?: Selection;
  province?: number;
}

/** Days of game time per second at each speed, 1 to 5. */
export const SPEED_MS = [1400, 700, 350, 160, 60];

interface Store {
  screen: Screen;
  setupMode: Mode;
  overlay: null | 'codex' | 'saves' | 'help';
  world: World | null;
  muted: boolean;

  running: boolean;
  /** 1 to 5. */
  speed: number;
  selection: Selection | null;
  /** True after pressing Move: the next province clicked is the destination. */
  ordering: boolean;
  mapMode: MapMode;
  news: News[];
  /** A short message about the last order, shown in the sidebar. */
  notice: string;
  /** Ask the map to centre on a province. `n` changes each time so the same place can be asked twice. */
  focus: { province: number; n: number } | null;
  /** Set when the player's country has surrendered. */
  defeated: boolean;
  /** Stop the clock when an enemy attacks one of your provinces. */
  pauseOnAttack: boolean;
  togglePauseOnAttack: () => void;

  go: (screen: Screen) => void;
  setOverlay: (o: Store['overlay']) => void;
  chooseMode: (mode: Mode) => void;
  startGame: (mode: Mode, player: string) => void;
  load: (slot: Slot) => boolean;
  save: (slot: Slot) => boolean;
  toggleMute: () => void;

  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
  select: (s: Selection | null) => void;
  setOrdering: (on: boolean) => void;
  setMapMode: (m: MapMode) => void;
  focusOn: (province: number) => void;
  /** Send the selected divisions to a province. */
  marchTo: (province: number) => void;
  halt: () => void;
  declareWar: (on: string) => void;
  makePeace: (withCountry: string) => void;
  cycleArmy: (step: 1 | -1) => void;
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
export const summaryOf = (w: World) => `${w.player ?? 'Observer'} · ${MODE_NAME[w.mode]} · ${dateLabel(w)}`;
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

let newsId = 0;
/** Headlines for what changed between yesterday and today. */
function headlines(before: World, after: World): News[] {
  const out: News[] = [];
  const me = after.player;
  const add = (text: string, tone: News['tone'], province?: number, open?: Selection) => out.push({ id: newsId++, day: after.day, text, tone, province, open });
  const seen = new Set(before.reports.map((r) => r.id));
  for (const r of after.reports) {
    if (seen.has(r.id)) continue;
    const attacking = !!me && r.attackers.includes(me);
    const defending = !!me && r.defenders.includes(me);
    if (me && !attacking && !defending) continue;
    const place = PROVINCES[r.province].name;
    const won = r.winner === 'attacker';
    const text = attacking ? (won ? `Victory at ${place}: your attack broke through` : `Your attack on ${place} was beaten off`) : defending ? (won ? `${place} lost to ${list(r.attackers)}` : `Your divisions held ${place}`) : `${place}: ${won ? `${list(r.attackers)} took it` : `${list(r.defenders)} held`}`;
    add(text, !me ? 'plain' : attacking === won ? 'good' : 'bad', r.province, { kind: 'report', id: r.id });
  }
  // An enemy opening an attack on you.
  const fighting = new Set(before.battles.map((b) => b.id));
  for (const b of after.battles) {
    if (fighting.has(b.id) || !me || !b.defenders.includes(me)) continue;
    add(`${list(b.attackers)} ${b.attackers.length > 1 ? 'attack' : 'attacks'} ${PROVINCES[b.province].name}`, 'bad', b.province, { kind: 'battle', id: b.id });
  }
  for (const c of after.capitulated) {
    if (before.capitulated.includes(c)) continue;
    const capital = PROVINCES.find((p) => p.owner === c && p.capital);
    add(c === me ? `${c} has surrendered` : `${c} surrenders`, c === me ? 'bad' : before.wars.some((k) => me && k.split('|').includes(me) && k.split('|').includes(c)) ? 'good' : 'plain', capital?.id, { kind: 'country', name: c });
  }
  // Capitals changing hands.
  for (const p of PROVINCES) {
    if (!p.capital || before.controller[p.id] === after.controller[p.id] || after.capitulated.includes(p.owner)) continue;
    const to = after.controller[p.id];
    add(to === p.owner ? `${p.owner} retakes ${p.city ?? p.name}` : `${p.city ?? p.name} falls to ${to}`, to === me ? 'good' : p.owner === me ? 'bad' : 'plain', p.id, { kind: 'province', id: p.id });
  }
  return out;
}

const fresh = { running: false, selection: null, ordering: false, news: [] as News[], notice: '', focus: null, defeated: false };
let focusN = 0;

export const useGame = create<Store>((set, get) => {
  /** Give orders now, while the clock may be stopped, so the map shows them at once. */
  const give = (orders: Order[]): World | null => {
    const { world } = get();
    if (!world) return null;
    const next = applyOrders(world, orders);
    set({ world: next });
    return next;
  };
  const say = (text: string, tone: News['tone'], open?: Selection, province?: number) =>
    set((s) => ({ news: [...s.news, { id: newsId++, day: s.world?.day ?? 0, text, tone, open, province }].slice(-40) }));
  const selectedUnits = (): number[] => {
    const { selection, world } = get();
    if (!world || selection?.kind !== 'units') return [];
    return selection.ids.filter((id) => world.units.some((u) => u.id === id && u.owner === world.player));
  };

  return {
    screen: 'title',
    setupMode: 'freeForAll',
    overlay: null,
    world: null,
    muted: readMuted(),
    speed: 2,
    mapMode: 'political',
    pauseOnAttack: true,
    togglePauseOnAttack: () => set((s) => ({ pauseOnAttack: !s.pauseOnAttack })),
    ...fresh,

    go: (screen) => {
      const { world, screen: was } = get();
      if (was === 'game' && world) writeSave('auto', summaryOf(world), world);
      set({ screen, overlay: null, running: false });
    },
    setOverlay: (overlay) => set({ overlay }),
    chooseMode: (mode) => set({ setupMode: mode, screen: 'setup', overlay: null }),

    startGame: (mode, player) => {
      const world = newWorld(mode, String(Date.now()), '1936-01-01', player);
      const capital = PROVINCES.find((p) => p.owner === player && p.capital);
      set({ ...fresh, world, screen: 'game', overlay: null, focus: capital ? { province: capital.id, n: ++focusN } : null });
      writeSave('auto', summaryOf(world), world);
      if (!get().muted) sound.startAmbient();
    },

    load: (slot) => {
      const file = readSave<World>(slot);
      if (!file) return false;
      const world = file.state;
      const capital = PROVINCES.find((p) => p.owner === world.player && p.capital);
      set({ ...fresh, world, screen: 'game', overlay: null, defeated: !!world.player && world.capitulated.includes(world.player), focus: capital ? { province: capital.id, n: ++focusN } : null });
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

    setRunning: (running) => set({ running: running && !get().defeated }),
    setSpeed: (speed) => set({ speed: Math.max(1, Math.min(5, speed)) }),

    tick: () => {
      const { world, selection, news } = get();
      if (!world) return;
      const next = advance(world);
      const added = headlines(world, next);
      // Forget divisions that no longer exist, and battles that have ended.
      let sel = selection;
      if (sel?.kind === 'units') {
        const alive = sel.ids.filter((id) => next.units.some((u) => u.id === id));
        sel = alive.length ? { kind: 'units', ids: alive } : null;
      } else if (sel?.kind === 'battle') {
        const id = sel.id;
        if (!next.battles.some((b) => b.id === id)) sel = next.reports.some((r) => r.id === id) ? { kind: 'report', id } : null;
      }
      const defeated = !!next.player && next.capitulated.includes(next.player);
      const attacked = get().pauseOnAttack && added.some((n) => n.open?.kind === 'battle');
      if (attacked && get().running && !get().muted) sound.alert();
      set({ world: next, selection: sel, news: added.length ? [...news, ...added].slice(-40) : news, defeated, running: get().running && !defeated && !attacked });
      // Autosave on the first of each month.
      if (dateLabel(next).startsWith('1 ')) writeSave('auto', summaryOf(next), next);
    },

    select: (selection) => set({ selection, ordering: false, notice: '' }),
    setOrdering: (ordering) => set({ ordering: ordering && selectedUnits().length > 0, notice: '' }),
    setMapMode: (mapMode) => set({ mapMode }),
    focusOn: (province) => set({ focus: { province, n: ++focusN } }),

    marchTo: (province) => {
      const { world } = get();
      const ids = selectedUnits();
      if (!world || !world.player || !ids.length) return;
      const next = give(ids.map((unit) => ({ type: 'move', unit, to: province })));
      if (!next) return;
      const p = PROVINCES[province];
      const moving = next.units.filter((u) => ids.includes(u.id) && u.path[u.path.length - 1] === province).length;
      const already = next.units.filter((u) => ids.includes(u.id) && u.at === province && !u.path.length).length;
      const holder = world.controller[province];
      let notice: string;
      if (moving) {
        const enemy = next.units.filter((u) => u.at === province && atWar(next, u.owner, world.player!)).length;
        const adjacent = next.units.some((u) => ids.includes(u.id) && u.path.length === 1 && u.path[0] === province);
        notice = `${plural(moving, 'division')} ${enemy && adjacent ? 'ordered to attack' : 'marching to'} ${p.name}.${moving + already < ids.length ? ' The others have no way there.' : ''}`;
        if (!get().muted) sound.click();
      } else if (already) notice = `Already in ${p.name}.`;
      else if (holder !== world.player && !atWar(world, world.player, holder)) notice = `${p.name} belongs to ${holder}, which is neutral. Divisions may only enter your own land or a country you are at war with.`;
      else notice = `No way to ${p.name} by land through your own or enemy territory.`;
      set({ notice, ordering: false });
    },

    halt: () => {
      const ids = selectedUnits();
      if (!ids.length) return;
      give(ids.map((unit) => ({ type: 'halt', unit })));
      set({ notice: `${plural(ids.length, 'division')} halted.`, ordering: false });
    },

    declareWar: (on) => {
      const { world } = get();
      if (!world?.player) return;
      give([{ type: 'declareWar', by: world.player, on }]);
      const capital = PROVINCES.find((p) => p.owner === on && p.capital);
      say(`${world.player} declares war on ${on}`, 'plain', { kind: 'country', name: on }, capital?.id);
    },

    makePeace: (other) => {
      const { world } = get();
      if (!world?.player) return;
      give([{ type: 'makePeace', a: world.player, b: other }]);
      say(`Peace between ${world.player} and ${other}`, 'plain', { kind: 'country', name: other });
    },

    cycleArmy: (step) => {
      const { world, selection } = get();
      if (!world?.player) return;
      const provinces = [...new Set(world.units.filter((u) => u.owner === world.player).map((u) => u.at))].sort((a, b) => a - b);
      if (!provinces.length) return;
      const current = selection?.kind === 'units' ? world.units.find((u) => u.id === selection.ids[0])?.at : undefined;
      const i = current === undefined ? (step > 0 ? -1 : 0) : provinces.indexOf(current);
      const at = provinces[(i + step + provinces.length) % provinces.length];
      set({ selection: { kind: 'units', ids: world.units.filter((u) => u.owner === world.player && u.at === at).map((u) => u.id) }, ordering: false, notice: '', focus: { province: at, n: ++focusN } });
    },
  };
});

if (useGame.getState().muted) sound.setMuted(true);
