/**
 * App state for the user interface. The UI only reads the world and sends orders to the
 * engine (src/sim); it never does game maths itself.
 */
import { create } from 'zustand';
import { advance, ownOrders } from '../sim/game';
import { PROVINCES } from '../sim/map';
import { planById } from '../sim/plans';
import { techById } from '../sim/research';
import type { EconomyOrder } from '../sim/economy';
import type { Mode, Order, World } from '../sim/types';
import { atWar } from '../sim/war';
import { shipPlan } from '../sim/navy';
import { cannotBase, REBASE_DAYS } from '../sim/air';
import { DAYS_PER_ZONE, zoneById, ZONE_INDEX, zonePath } from '../sim/sea';
import { picturesOf } from './forces';
import { applyOrders, dateLabel, newWorld } from '../sim/world';
import { readSave, writeSave, type Slot } from '../save/storage';
import { sound } from './audio/sound';

export type Screen = 'title' | 'setup' | 'game';
export type MapMode = 'political' | 'terrain' | 'supply' | 'diplomacy' | 'airsea';

/** What the sidebar is showing. */
export type Selection =
  | { kind: 'units'; ids: number[] }
  | { kind: 'stack'; province: number; owner: string }
  | { kind: 'province'; id: number }
  | { kind: 'country'; name: string }
  | { kind: 'battle'; id: number }
  | { kind: 'report'; id: number }
  | { kind: 'reports' }
  | { kind: 'economy' }
  | { kind: 'production' }
  | { kind: 'research' }
  | { kind: 'tech'; id: string }
  | { kind: 'plans' }
  | { kind: 'plan'; id: string }
  | { kind: 'politics' }
  | { kind: 'diplomacy' }
  | { kind: 'decision'; id: number }
  | { kind: 'forces' }
  | { kind: 'zone'; id: string }
  | { kind: 'fleet'; id: number }
  | { kind: 'wings'; province: number };

/** An economic order before the player's country is filled in. */
export type EconomyAction = EconomyOrder extends infer O ? (O extends { country: string } ? Omit<O, 'country'> : never) : never;

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
  /** With `ordering` and divisions selected: the destination is reached by sea. */
  bySea: boolean;
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
  setBySea: (on: boolean) => void;
  /** Send the selected divisions to a province by sea: a transport to a friendly shore, a landing on an enemy one. */
  shipTo: (province: number) => void;
  /** Give an order to one of your fleets or air wings. It takes effect at once. */
  force: (order: Order) => void;
  /** Send the selected fleet to a sea zone. */
  sailTo: (zone: string) => void;
  /** Move the selected air wings (of one kind, or all) to a new base. */
  rebaseTo: (province: number) => void;
  /** Give a diplomatic order as your country (declare war, propose a pact, answer a decision). It takes effect at once. */
  act: (order: Order) => void;
  cycleArmy: (step: 1 | -1) => void;
  /** Give an order about your economy (taxes, factories, new divisions). It takes effect at once. */
  economy: (action: EconomyAction) => void;
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
  out.push(...forceNews(before, after));
  out.push(...diplomaticNews(before, after));
  // Capitals changing hands.
  for (const p of PROVINCES) {
    if (!p.capital || before.controller[p.id] === after.controller[p.id] || after.capitulated.includes(p.owner)) continue;
    const to = after.controller[p.id];
    add(to === p.owner ? `${p.owner} retakes ${p.city ?? p.name}` : `${p.city ?? p.name} falls to ${to}`, to === me ? 'good' : p.owner === me ? 'bad' : 'plain', p.id, { kind: 'province', id: p.id });
  }
  // Your own economy: new divisions, finished factories and the monthly figures.
  const was = me ? before.economies[me] : undefined;
  const now = me ? after.economies[me] : undefined;
  if (me && was && now && !after.capitulated.includes(me)) {
    const raised = after.units.filter((u) => u.owner === me && u.id >= before.nextUnitId);
    if (raised.length) add(raised.length === 1 ? `A new ${raised[0].type} division is ready in ${PROVINCES[raised[0].at].name}` : `${raised.length} new divisions are ready in ${PROVINCES[raised[0].at].name}`, 'good', raised[0].at, { kind: 'units', ids: raised.map((u) => u.id) });
    for (const p of PROVINCES) {
      if (after.controller[p.id] !== me) continue;
      if (after.factories.civ[p.id] > before.factories.civ[p.id]) add(`A civilian factory is finished in ${p.name}`, 'good', p.id, { kind: 'production' });
      if (after.factories.mil[p.id] > before.factories.mil[p.id]) add(`A military factory is finished in ${p.name}: give it a production line`, 'good', p.id, { kind: 'production' });
    }
    if (now.history !== was.history && now.history.length) {
      const month = now.history[now.history.length - 1];
      const earlier = now.history[now.history.length - 2];
      const crossed = (level: number) => was.inflation < level && now.inflation >= level;
      if (crossed(100)) add('Hyperinflation: prices are rising more than 100% a year', 'bad', undefined, { kind: 'economy' });
      else if (crossed(30)) add('Inflation passes 30%: factories slow down and bonds stop selling', 'bad', undefined, { kind: 'economy' });
      else if (crossed(10)) add('Inflation passes 10% a year: people are getting angry', 'bad', undefined, { kind: 'economy' });
      else if (was.inflation >= 10 && now.inflation < 10) add('Inflation is back under 10% a year', 'good', undefined, { kind: 'economy' });
      if (month.printed > 0.01 && (!earlier || earlier.printed <= 0.01)) add('The treasury is empty and bonds did not cover the bills: the central bank is printing money', 'bad', undefined, { kind: 'economy' });
      if (earlier && earlier.stability >= 50 && month.stability < 50) add('Strikes are spreading: stability has fallen below 50', 'bad', undefined, { kind: 'economy' });
      if (month.shortage > 0.02 && (!earlier || earlier.shortage <= 0.02)) add('Shops are running short of goods', 'bad', undefined, { kind: 'production' });
      if (after.wars.some((k) => k.split('|').includes(me)) && earlier && earlier.warSupport >= 40 && month.warSupport < 40) add('War support has fallen below 40: people are turning against the war', 'bad', undefined, { kind: 'politics' });
      if (earlier && earlier.stability >= 20 && month.stability < 20) add('Crisis: stability is below 20. Three months of this and the government falls', 'bad', undefined, { kind: 'politics' });
    }
    // The war on your trade.
    const sinking = (x: number) => was.blockade < x && now.blockade >= x;
    if (sinking(0.5)) add(`Half of your imports are being sunk at sea. Factories and shops will run short`, 'bad', undefined, { kind: 'forces' });
    else if (sinking(0.15)) add(`Enemy raiders are sinking ${Math.round(now.blockade * 100)}% of your imports: put fleets on Escort along your trade route`, 'bad', undefined, { kind: 'forces' });
    else if (was.blockade >= 0.15 && now.blockade < 0.15) add('Your convoys are getting through again', 'good', undefined, { kind: 'forces' });
    // Research, national plans and the government itself.
    for (const id of now.research.done) {
      if (was.research.done.includes(id)) continue;
      const tech = techById(id);
      if (tech) add(`Research finished: ${tech.name}. A team is free`, 'good', undefined, { kind: 'research' });
    }
    for (const id of now.plan.done) {
      if (was.plan.done.includes(id)) continue;
      const plan = planById(id);
      if (plan) add(`National plan carried out: ${plan.name}. Choose the next one`, 'good', undefined, { kind: 'plans' });
    }
    if (now.governmentsFallen > was.governmentsFallen) add('The government has fallen. A new one takes office, and the national plan is abandoned', 'bad', undefined, { kind: 'politics' });
  }
  return out;
}

/** Headlines from the war at sea and in the air that involve the player. */
function forceNews(before: World, after: World): News[] {
  const out: News[] = [];
  const me = after.player;
  const last = before.forceLog.length ? before.forceLog[before.forceLog.length - 1].id : -1;
  for (const e of after.forceLog) {
    if (e.id <= last || (me && !e.countries.includes(me))) continue;
    const loss = /loses|destroyed|called off/.test(e.text);
    const tone: News['tone'] = !me || (e.kind === 'sea' && !loss) ? 'plain' : (e.countries[0] === me) === loss ? 'bad' : 'good';
    const open: Selection | undefined = e.zone ? { kind: 'zone', id: e.zone } : e.province !== undefined ? { kind: 'province', id: e.province } : { kind: 'forces' };
    out.push({ id: newsId++, day: e.day, text: e.text, tone, province: e.province, open });
  }
  return out;
}

/** Headlines for diplomatic news and for decisions that have just landed on the player's desk. */
function diplomaticNews(before: World, after: World): News[] {
  const out: News[] = [];
  const me = after.player;
  const last = before.diplomacy.log.length ? before.diplomacy.log[before.diplomacy.log.length - 1].id : -1;
  for (const e of after.diplomacy.log) {
    if (e.id <= last) continue;
    const mine = !!me && e.countries.includes(me);
    const other = e.countries.find((c) => c !== me) ?? e.countries[0];
    const capital = PROVINCES.find((p) => p.owner === other && p.capital);
    const tone: News['tone'] = e.kind === 'war' || e.kind === 'crisis' ? (mine && e.countries[0] !== me ? 'bad' : 'plain') : e.kind === 'peace' && mine ? 'good' : 'plain';
    out.push({ id: newsId++, day: e.day, text: e.text, tone, province: capital?.id, open: other ? { kind: 'country', name: other } : { kind: 'diplomacy' } });
  }
  const known = new Set(before.diplomacy.decisions.map((d) => d.id));
  for (const d of after.diplomacy.decisions) {
    if (known.has(d.id) || d.country !== me) continue;
    out.push({ id: newsId++, day: after.day, text: `Decision needed: ${d.title}`, tone: 'bad', open: { kind: 'decision', id: d.id } });
  }
  return out;
}

const fresh = { running: false, selection: null, ordering: false, bySea: false, news: [] as News[], notice: '', focus: null, defeated: false };
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
      // A decision always stops the clock and opens in the sidebar: it has a deadline.
      const decision = added.find((n) => n.open?.kind === 'decision');
      if (decision) sel = decision.open!;
      else if (sel?.kind === 'decision' && !next.diplomacy.decisions.some((d) => d.id === (sel as { id: number }).id)) sel = { kind: 'diplomacy' };
      if ((attacked || decision) && get().running && !get().muted) sound.alert();
      set({ world: next, selection: sel, news: added.length ? [...news, ...added].slice(-40) : news, defeated, running: get().running && !defeated && !attacked && !decision });
      // Autosave on the first of each month.
      if (dateLabel(next).startsWith('1 ')) writeSave('auto', summaryOf(next), next);
    },

    select: (selection) => {
      // Fleets, wings and sea zones only show on the air and sea map.
      const sea = selection?.kind === 'zone' || selection?.kind === 'fleet' || selection?.kind === 'wings';
      set({ selection, ordering: false, bySea: false, notice: '', ...(sea ? { mapMode: 'airsea' as MapMode } : {}) });
    },
    setOrdering: (ordering) => {
      const k = get().selection?.kind;
      set({ ordering: ordering && (selectedUnits().length > 0 || k === 'fleet' || k === 'wings'), bySea: false, notice: '' });
    },
    setBySea: (on) => set({ ordering: on && selectedUnits().length > 0, bySea: on && selectedUnits().length > 0, notice: '' }),

    shipTo: (province) => {
      const { world } = get();
      const ids = selectedUnits();
      if (!world?.player || !ids.length) return;
      const { sea, friends } = picturesOf(world);
      const p = PROVINCES[province];
      let sent = 0;
      let days = 0;
      let landing = false;
      let why = '';
      let w: World = world;
      // One at a time, because ships can only land so many divisions on one shore at once.
      for (const id of ids) {
        const u = w.units.find((x) => x.id === id);
        if (!u) continue;
        const plan = shipPlan(w, sea, friends, u, province);
        if ('why' in plan) {
          why = plan.why;
          continue;
        }
        w = applyOrders(w, [{ type: 'ship', unit: id, to: province }]);
        sent++;
        days = Math.max(days, plan.days);
        landing = plan.landing;
      }
      if (sent) {
        set({ world: w });
        if (!get().muted) sound.click();
      }
      const notice = sent
        ? `${plural(sent, 'division')} ${landing ? `preparing to land at ${p.name}: ${days} days. They attack at 60% strength as they come ashore` : `embarking for ${p.name}: ${days} days`}.${sent < ids.length ? ` The others cannot go: ${why}.` : ''}`
        : `Cannot go to ${p.name} by sea: ${why || 'no way'}.`;
      set({ notice, ordering: false, bySea: false });
    },

    force: (order) => {
      const { world } = get();
      if (!world?.player || world.capitulated.includes(world.player)) return;
      give(ownOrders(world, [order]));
    },

    sailTo: (zone) => {
      const { world, selection } = get();
      if (!world?.player || selection?.kind !== 'fleet') return;
      const fleet = world.fleets.find((f) => f.id === selection.id && f.owner === world.player);
      const target = zoneById(zone);
      if (!fleet || !target) return;
      if (fleet.zone === zone) return set({ notice: `Already in the ${target.name}.`, ordering: false });
      const path = zonePath(ZONE_INDEX[fleet.zone], ZONE_INDEX[zone]);
      if (!path) return set({ notice: `No way by sea to the ${target.name}.`, ordering: false });
      give(ownOrders(world, [{ type: 'fleet', fleet: fleet.id, zone }]));
      if (!get().muted) sound.click();
      set({ notice: `Sailing to the ${target.name}: ${(path.length - 1) * DAYS_PER_ZONE} days.`, ordering: false });
    },

    rebaseTo: (province) => {
      const { world, selection } = get();
      if (!world?.player || selection?.kind !== 'wings') return;
      const me = world.player;
      const wings = world.wings.filter((x) => x.owner === me && x.base === selection.province);
      if (!wings.length) return;
      const no = cannotBase(world, me, province, picturesOf(world).friends.get(me));
      if (no) return set({ notice: `Cannot move there: ${no}.`, ordering: false });
      if (province === selection.province) return set({ notice: 'Already based there.', ordering: false });
      give(ownOrders(world, wings.map((x) => ({ type: 'wing', wing: x.id, base: province }) as Order)));
      if (!get().muted) sound.click();
      set({ selection: { kind: 'wings', province }, notice: `${plural(wings.length, 'wing')} moving to ${PROVINCES[province].name}. They fly again in ${REBASE_DAYS} days.`, ordering: false });
    },
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
      set({ notice, ordering: false, bySea: false });
    },

    halt: () => {
      const ids = selectedUnits();
      if (!ids.length) return;
      give(ids.map((unit) => ({ type: 'halt', unit })));
      set({ notice: `${plural(ids.length, 'division')} halted.`, ordering: false });
    },

    act: (order) => {
      const { world, selection } = get();
      if (!world?.player || world.capitulated.includes(world.player)) return;
      const next = give(ownOrders(world, [order]));
      if (!next || next === world) return;
      const added = diplomaticNews(world, next);
      const decision = added.find((n) => n.open?.kind === 'decision');
      let sel = selection;
      if (decision) sel = decision.open!;
      else if (sel?.kind === 'decision' && !next.diplomacy.decisions.some((d) => d.id === (sel as { id: number }).id)) sel = { kind: 'diplomacy' };
      if (!get().muted) sound.click();
      set((s) => ({ news: added.length ? [...s.news, ...added].slice(-40) : s.news, selection: sel, defeated: next.capitulated.includes(world.player!), running: s.running && !next.capitulated.includes(world.player!) }));
    },

    economy: (action) => {
      const { world } = get();
      if (!world?.player || world.capitulated.includes(world.player)) return;
      give([{ ...action, country: world.player } as Order]);
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
// While developing, `game.getState()` in the browser console gives the whole app state.
if (import.meta.env.DEV) (window as unknown as { game: typeof useGame }).game = useGame;
