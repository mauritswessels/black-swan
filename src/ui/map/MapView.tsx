/**
 * The map table: provinces, borders, labels, division counters, marching arrows and battle
 * markers. Scroll or pinch to zoom, drag to move. It only draws the world and reports clicks;
 * the rules live in src/sim.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, countryByName } from '../../sim/countries';
import { visibleProvinces, visibleStacks, type Stack } from '../../sim/intel';
import { PROVINCES } from '../../sim/map';
import { allianceMap, allied, hasPact, relation } from '../../sim/diplomacy';
import { linkedProvinces, supplyCapacity } from '../../sim/supply';
import type { World } from '../../sim/types';
import { atWar } from '../../sim/war';
import { aimOf, km, wingRange } from '../../sim/air';
import { strikeStatus } from '../../sim/strike';
import { AttackMenuView } from './AttackMenu';
import { modsOf } from '../../sim/mods';
import { shipPlan } from '../../sim/navy';
import { shipCount, ZONE_INDEX, ZONES, type SeaStatus } from '../../sim/sea';
import { picturesOf, skyOver } from '../forces';
import { useGame, type MapMode } from '../store';
import { lessonById } from '../../tutorial/lessons';
import { countryColour, landColour, TERRAIN_COLOUR, tint } from './colours';
import { COAST, COUNTRY_POINTS, countryLines, GRATICULE, HOME_AREA, nearX, outline, POINTS, PROVINCE_LINES, SEAS, SHAPES, sharedBorder, TABLE_H, TABLE_W, ZONE_POINTS, ZONE_SHAPES } from './geo';
import { RIVER_BORDERS, riverBetween } from '../../sim/rivers';
import { pocketsOf, pocketWords } from '../../sim/pockets';
import { GROUND_WORDS, groundOn } from '../../sim/seasons';
import { sound } from '../audio/sound';
import { armiesOf, armyCentre, describeOrder, orderFor, pincersOf } from '../../sim/armies';

/** One colour for each army, by its number key. */
export const ARMY_COLOURS = ['#ffc46b', '#5ee6b0', '#ff7fa8', '#7fd0ff', '#c9a0ff', '#ff9f5a', '#e6e66b', '#9cf27f', '#f0f0f0'];
export const armyColour = (slot: number) => ARMY_COLOURS[(slot || 9) - 1];

interface View {
  k: number;
  x: number;
  y: number;
}
/** The furthest out you can zoom: the whole world once across the screen (it wraps around, see geo.ts). */
const minK = (width: number) => Math.max(0.1, width / TABLE_W);
const MAX_K = 9;
/** Below this zoom you are looking at the whole world: fewer names, so it stays readable. */
const WORLD_VIEW = 0.7;
/** A country this big (km2 around its capital) keeps its name on the world view. */
const BIG_COUNTRY = 1_500_000;
/** Where the map opens when there is no country of yours to look at: central Europe. */
const OPENING = PROVINCES.find((p) => p.city === 'Berlin')?.id ?? 0;
/** Countries too small to label until you zoom in. */
const SMALL = new Set(COUNTRIES.filter((c) => PROVINCES.filter((p) => p.owner === c.name).length <= 2).map((c) => c.name));

/** How to fill each province in the current map mode. */
function fills(w: World, mode: MapMode): string[] {
  const me = w.player;
  if (mode === 'terrain') return PROVINCES.map((p) => TERRAIN_COLOUR[p.terrain]);
  if (mode === 'diplomacy') {
    const dip = w.diplomacy;
    return w.controller.map((c) => {
      if (c === me) return tint('#5b9bff', 0.6);
      if (!me) return tint('#8592a9', 0.22);
      if (atWar(w, me, c)) return 'url(#hatch-war)';
      if (allied(dip, me, c)) return tint('#5ee6b0', 0.5);
      if (hasPact(dip, 'guarantee', me, c)) return tint('#c9c96b', 0.4);
      if (relation(dip, me, c) < -25) return tint('#ff7fa8', 0.36);
      return tint('#8592a9', 0.22);
    });
  }
  if (mode === 'supply' && me) {
    const linked = linkedProvinces(w.controller, me, allianceMap(w.diplomacy).get(me));
    const count = new Array<number>(PROVINCES.length).fill(0);
    for (const u of w.units) count[u.at]++;
    return w.controller.map((c, p) => {
      if (c !== me) return tint('#8592a9', 0.1);
      if (!linked[p]) return 'url(#hatch-cut)';
      if (count[p] > supplyCapacity(p)) return tint('#ffc46b', 0.6);
      return tint('#9cc8ff', 0.12 + 0.5 * ((supplyCapacity(p) - 7) / 12));
    });
  }
  if (mode === 'airsea') {
    // The sky over each province, for the player: who would have the edge in a battle there.
    return w.controller.map((c, p) => {
      if (!me) return tint('#8592a9', 0.16);
      const sky = skyOver(w, me, p).status;
      if (sky === 'own') return tint('#5b9bff', 0.55);
      if (sky === 'enemy') return 'url(#hatch-war)';
      if (sky === 'contested') return tint('#ffc46b', 0.5);
      return tint('#8592a9', c === me ? 0.26 : 0.14);
    });
  }
  return w.controller.map((c) => landColour(c, c === me));
}

const SEA_FILL: Record<SeaStatus, string> = { own: 'rgba(91,155,255,0.30)', enemy: 'rgba(255,106,61,0.30)', contested: 'rgba(255,196,107,0.26)', open: 'rgba(133,146,169,0.07)' };

const Land = memo(function Land({ fill, lines }: { fill: string[]; lines: string }) {
  return (
    <g>
      <path d={GRATICULE} className="mt-graticule" />
      <path d={COAST} className="mt-coast-glow" />
      {SHAPES.map((d, i) => (
        <path key={i} d={d} fill={fill[i]} data-p={i} className="mt-province" />
      ))}
      <path d={PROVINCE_LINES} className="mt-province-lines" />
      <path d={COAST} className="mt-coast" />
      <path d={lines} className="mt-border-glow" />
      <path d={lines} className="mt-border" />
    </g>
  );
});

/** The great rivers, drawn on the borders they follow. */
const RIVER_LINES: string = RIVER_BORDERS.map((r) => sharedBorder(r.a, r.b)?.d ?? '').join('');

/** One front band: the attackers' colour growing into `to` from its border with `from`, `line` points of 100 deep. */
export interface Band {
  key: string;
  from: number;
  to: number;
  owner: string;
  line: number;
  battle: boolean;
}

/**
 * The front bands on the map: one for each direction of each battle, as deep as the battle's
 * front line, and one for each march into empty enemy land, as deep as the division has walked.
 */
export function frontBands(w: World, visible: (province: number, owner: string) => boolean): Band[] {
  const bands = new Map<string, Band>();
  const fighting = new Map(w.battles.map((b) => [b.province, b]));
  for (const u of w.units) {
    if (!u.path.length || u.sea) continue;
    const to = u.path[0];
    const b = fighting.get(to);
    let line: number;
    if (b) {
      if (!b.attackers.includes(u.owner)) continue;
      line = b.line;
    } else {
      if (u.landing || !atWar(w, u.owner, w.controller[to])) continue;
      line = 100 * u.progress;
    }
    if (line < 1 || !visible(to, u.owner)) continue;
    // A division that pushed on (a deep attack) comes in from the province it pushed through.
    const from = u.via ?? u.at;
    const key = `${from}>${to}`;
    const had = bands.get(key);
    if (!had || had.line < line) bands.set(key, { key, from, to, owner: had?.owner ?? u.owner, line, battle: !!b });
  }
  return [...bands.values()];
}

const FrontBand = memo(function FrontBand({ band, k }: { band: Band; k: number }) {
  const border = sharedBorder(band.from, band.to);
  const [tx, ty] = POINTS[band.to];
  // How deep the province is, seen from this border: twice the distance from the border to its centre.
  const [mx, my] = border?.mid ?? [(POINTS[band.from][0] + tx) / 2, (POINTS[band.from][1] + ty) / 2];
  const depth = Math.max(8, 2 * Math.hypot(tx - mx, ty - my));
  const width = 2 * depth * (band.line / 100);
  const d = border?.d ?? `M${mx - (ty - my) * 0.4},${my + (tx - mx) * 0.4}L${mx + (ty - my) * 0.4},${my - (tx - mx) * 0.4}`;
  const colour = countryColour(band.owner);
  return (
    <g clipPath={`url(#clip-${band.to})`} className={`mt-band${band.battle ? ' battle' : ''}`}>
      {/* A bright edge where the front is, then the band itself on top of it. */}
      <path d={d} strokeWidth={width + 3.5 / k} className="edge" />
      <path d={d} stroke={colour} strokeWidth={width} className="fill" />
    </g>
  );
});

function summary(s: Stack) {
  const n = s.units.length;
  const org = s.units.reduce((a, u) => a + u.organisation, 0) / n;
  const moving = s.units.some((u) => u.path.length);
  return { n, org, moving, armour: s.units.some((u) => u.type === 'armour') };
}

export function MapView() {
  const world = useGame((s) => s.world)!;
  const selection = useGame((s) => s.selection);
  const mapMode = useGame((s) => s.mapMode);
  const ordering = useGame((s) => s.ordering);
  const aim = useGame((s) => s.aim);
  const focus = useGame((s) => s.focus);
  // The province a lesson step is about, ringed in gold.
  const lessonProvince = useGame((s) => (s.lesson && !s.lesson.finished ? lessonById(s.lesson.id)?.steps[s.lesson.step]?.province : undefined));
  const me = world.player;

  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [hover, setHover] = useState<number | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);

  // Keep the table on screen: never let it be dragged wholly out of view up or down. Left and right
  // it wraps around the world, so x is kept within one world's width.
  const clamp = useCallback((v: View): View => {
    const { w, h } = sizeRef.current;
    const k = Math.max(minK(w), Math.min(MAX_K, v.k));
    const m = 0.5;
    const world = TABLE_W * k;
    let x = v.x % world;
    if (x > 0) x -= world;
    return { k, x, y: Math.max(h * (1 - m) - TABLE_H * k, Math.min(h * m, v.y)) };
  }, []);
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const k = Math.max(minK(sizeRef.current.w), Math.min(MAX_K, v.k * factor));
      return clamp({ k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k });
    });
  }, [clamp]);
  const centreOn = useCallback((province: number, minK = 0) => {
    const { w, h } = sizeRef.current;
    const k = Math.max(viewRef.current.k, minK);
    const [px, py] = POINTS[province];
    // The sidebar covers the right 360 pixels, so aim a little left of centre.
    setView(clamp({ k, x: (w - 360) / 2 - px * k, y: h / 2 - py * k }));
  }, [clamp]);

  useEffect(() => {
    const el = box.current!;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Centre when asked (new game, Tab to an army, a clicked headline).
  const sized = size.w !== 1200 || size.h !== 800;
  useEffect(() => {
    if (focus) centreOn(focus.province, 2.2);
    else centreOn(OPENING, 1);
  }, [focus, centreOn, sized]);

  // Wheel and trackpad. Listeners are added by hand because React's wheel events cannot stop the page scrolling.
  useEffect(() => {
    const el = box.current!;
    const point = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onWheel = (e: WheelEvent) => {
      // The attack menu scrolls by itself.
      if ((e.target as Element).closest('.mt-menu')) return;
      e.preventDefault();
      useGame.getState().bumpMoves();
      const [cx, cy] = point(e);
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), cx, cy);
    };
    // Safari and the Mac app report a trackpad pinch as "gesture" events.
    let last = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      last = 1;
    };
    const onGesture = (e: Event) => {
      e.preventDefault();
      const g = e as unknown as { scale: number; clientX: number; clientY: number };
      const [cx, cy] = point(g);
      useGame.getState().bumpMoves();
      zoomAt(g.scale / last, cx, cy);
      last = g.scale;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart);
    el.addEventListener('gesturechange', onGesture);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGesture);
    };
  }, [zoomAt]);

  // Dragging moves the map; a press without a drag is a click on whatever was under it.
  // Shift-drag draws a box to select divisions; dragging an army's flag points it at another province.
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; target: Element; mode: 'pan' | 'box' | 'army'; army?: number } | null>(null);
  const [band, setBand] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [pull, setPull] = useState<{ army: number; x: number; y: number; province: number | null } | null>(null);
  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const hit = (el: Element | null) => {
    const stack = el?.closest('[data-s]')?.getAttribute('data-s');
    const battle = el?.closest('[data-b]')?.getAttribute('data-b');
    const country = el?.closest('[data-c]')?.getAttribute('data-c');
    const province = el?.closest('[data-p]')?.getAttribute('data-p');
    const wing = el?.closest('[data-w]')?.getAttribute('data-w');
    const zone = el?.closest('[data-z]')?.getAttribute('data-z') ?? null;
    const army = el?.closest('[data-a]')?.getAttribute('data-a');
    return { stack, battle, country, zone, army: army == null ? null : Number(army), wing: wing == null ? null : Number(wing), province: province == null ? null : Number(province) };
  };
  /** The province under a hit, whatever was clicked in it. */
  const placeOf = (h: ReturnType<typeof hit>) => (h.stack ? Number(h.stack.split('|')[0]) : h.wing ?? h.province);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as Element).closest('.mt-menu')) return;
    if (useGame.getState().menu) useGame.getState().closeMenu();
    const target = e.target as Element;
    const army = hit(target).army;
    const mode = army != null ? 'army' : e.shiftKey && me ? 'box' : 'pan';
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, target, mode, army: army ?? undefined };
    box.current?.focus({ preventScroll: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < 5) return;
      d.moved = true;
      if (d.mode === 'box') {
        const [x0, y0] = local({ clientX: d.x, clientY: d.y });
        const [x1, y1] = local(e);
        setBand({ x0, y0, x1, y1 });
        return;
      }
      if (d.mode === 'army') {
        const [x, y] = local(e);
        const at = placeOf(hit(e.target as Element));
        setPull({ army: d.army!, x, y, province: at });
        if (at !== hover) setHover(at);
        return;
      }
      useGame.getState().bumpMoves();
      setView((v) => clamp({ k: v.k, x: d.vx + dx, y: d.vy + dy }));
      return;
    }
    const p = hit(e.target as Element);
    const at = p.stack ? Number(p.stack.split('|')[0]) : p.wing ?? p.province;
    if (at !== hover) setHover(at);
    const z = at === null ? p.zone : null;
    if (z !== hoverZone) setHoverZone(z);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('.mt-menu')) return;
    const d = drag.current;
    drag.current = null;
    setBand(null);
    setPull(null);
    const g = useGame.getState();
    if (d?.moved && d.mode === 'box') {
      // Every division of yours whose province's centre is inside the box.
      const [x0, y0] = local({ clientX: d.x, clientY: d.y });
      const [x1, y1] = local(e);
      const toMap = (x: number, y: number) => [(x - view.x) / view.k, (y - view.y) / view.k];
      const [ax, ay] = toMap(Math.min(x0, x1), Math.min(y0, y1));
      const [bx, by] = toMap(Math.max(x0, x1), Math.max(y0, y1));
      // The box may reach into the next copy of the world (geo.ts wraps around).
      const across = (x: number) => [x, x + TABLE_W, x - TABLE_W].some((v) => v >= ax && v <= bx);
      const ids = world.units.filter((u) => u.owner === me && !u.sea && across(POINTS[u.at][0]) && POINTS[u.at][1] >= ay && POINTS[u.at][1] <= by).map((u) => u.id);
      if (!ids.length) return useGame.setState({ notice: 'No divisions of yours in that box.' });
      g.select({ kind: 'units', ids });
      return useGame.setState({ notice: `${ids.length} ${ids.length === 1 ? 'division' : 'divisions'} selected. Press A to form an army from them.` });
    }
    if (d?.moved && d.mode === 'army') {
      const p = placeOf(hit(e.target as Element));
      if (p != null) g.armyTo(p, d.army);
      return;
    }
    if (!d || d.moved) return;
    const h = hit(d.target);
    if (h.army != null) return g.select({ kind: 'army', id: h.army });
    // An army's order: the next click is the place.
    if (g.aim && g.selection?.kind === 'army') {
      const p = placeOf(h);
      if (p != null) return g.armyTo(p);
      return useGame.setState({ notice: 'Click a province on land.' });
    }
    // Orders to a fleet or to air wings: the next click is where they go.
    if (g.ordering && g.selection?.kind === 'fleet') {
      if (h.zone && h.province == null && !h.stack) return g.sailTo(h.zone);
      return useGame.setState({ notice: 'Click a sea zone: fleets cannot go on land.' });
    }
    if (g.ordering && g.selection?.kind === 'wings') {
      const p = h.wing ?? (h.stack ? Number(h.stack.split('|')[0]) : h.province);
      if (p != null) return g.rebaseTo(p);
      return useGame.setState({ notice: 'Click a province in your hands or an ally\'s.' });
    }
    if (g.ordering && g.bySea) {
      const p = h.stack ? Number(h.stack.split('|')[0]) : h.wing ?? h.province;
      if (p != null) return g.shipTo(p);
      return;
    }
    if (h.battle != null) return g.select({ kind: 'battle', id: Number(h.battle) });
    if (h.wing != null) return g.ordering ? g.marchTo(h.wing) : g.select({ kind: 'wings', province: h.wing });
    if (h.stack) {
      const [p, owner] = [Number(h.stack.split('|')[0]), h.stack.slice(h.stack.indexOf('|') + 1)];
      if (g.ordering) return g.marchTo(p);
      if (owner !== me) return g.select({ kind: 'stack', province: p, owner });
      const ids = world.units.filter((u) => u.at === p && u.owner === me).map((u) => u.id);
      // Shift-click adds a stack to the selection, or takes it out again.
      if (e.shiftKey && g.selection?.kind === 'units') {
        const had = g.selection.ids;
        const merged = ids.every((id) => had.includes(id)) ? had.filter((id) => !ids.includes(id)) : [...new Set([...had, ...ids])];
        return g.select(merged.length ? { kind: 'units', ids: merged } : null);
      }
      return g.select({ kind: 'units', ids });
    }
    if (h.country) return g.select({ kind: 'country', name: h.country });
    if (h.province != null) return g.ordering ? g.marchTo(h.province) : g.select({ kind: 'province', id: h.province });
    if (h.zone) {
      // One fleet of your own there: open it. Otherwise open the zone.
      const own = world.fleets.filter((f) => f.zone === h.zone && f.owner === me);
      return g.select(own.length === 1 ? { kind: 'fleet', id: own[0].id } : { kind: 'zone', id: h.zone });
    }
    g.select(null);
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const g = useGame.getState();
    const h = hit(e.target as Element);
    const p = h.stack ? Number(h.stack.split('|')[0]) : h.wing ?? h.province;
    if (g.menu) g.closeMenu();
    // A province that is not yours or an ally's. With divisions or an army selected and the enemy
    // at war with you, they attack it straight away (and push on through the provinces on the way).
    // Otherwise, or with Shift held, the attack menu opens.
    if (p != null && me && !world.capitulated.includes(me)) {
      const holder = world.controller[p];
      if (holder !== me && !friendsOfMe?.has(holder)) {
        const sel = g.selection;
        if (!e.shiftKey && atWar(world, me, holder) && (sel?.kind === 'units' || sel?.kind === 'army')) return sel.kind === 'army' ? g.armyTo(p) : g.marchTo(p);
        const [x, y] = local(e);
        return g.openMenu(p, x, y);
      }
    }
    if (g.selection?.kind === 'fleet') {
      if (h.zone && p == null) g.sailTo(h.zone);
      return;
    }
    if (g.selection?.kind === 'wings') {
      if (p != null) g.rebaseTo(p);
      return;
    }
    if (g.selection?.kind === 'army') {
      if (p != null) g.armyTo(p);
      return;
    }
    if (g.selection?.kind !== 'units') return;
    if (p != null) g.marchTo(p);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const pan = 80;
    const { w, h } = size;
    const move = (dx: number, dy: number) => setView((v) => clamp({ k: v.k, x: v.x + dx, y: v.y + dy }));
    if (e.key === 'ArrowLeft') move(pan, 0);
    else if (e.key === 'ArrowRight') move(-pan, 0);
    else if (e.key === 'ArrowUp') move(0, pan);
    else if (e.key === 'ArrowDown') move(0, -pan);
    else if (e.key === '+' || e.key === '=') zoomAt(1.3, w / 2, h / 2);
    else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.3, w / 2, h / 2);
    else if (e.key === 'Tab') useGame.getState().cycleArmy(e.shiftKey ? -1 : 1);
    else return;
    if (e.key !== 'Tab') useGame.getState().bumpMoves();
    e.preventDefault();
  };

  const fill = useMemo(() => fills(world, mapMode), [world.controller, world.wars, mapMode, mapMode === 'supply' ? world.units : null, mapMode === 'diplomacy' ? world.diplomacy : null, mapMode === 'airsea' ? world.wings : null]); // eslint-disable-line react-hooks/exhaustive-deps
  const lines = useMemo(() => countryLines(world.controller), [world.controller]);
  // Scout planes widen what you see, so the wings count too.
  const stacks = useMemo(() => visibleStacks(world, me), [world.units, world.controller, world.wings, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const seen = useMemo(() => visibleProvinces(world, me), [world.units, world.controller, world.wings, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const friendsOfMe = useMemo(() => (me ? allianceMap(world.diplomacy).get(me) : undefined), [world.diplomacy, me]);
  const bands = useMemo(() => frontBands(world, (p, owner) => !me || owner === me || !!friendsOfMe?.has(owner) || seen[p]), [world.units, world.battles, world.controller, seen, me, friendsOfMe]); // eslint-disable-line react-hooks/exhaustive-deps
  // Pockets you can see: your own and your allies', and the enemy's where your divisions see them.
  const pockets = useMemo(() => pocketsOf(world).filter((x) => !me || x.owner === me || friendsOfMe?.has(x.owner) || x.provinces.some((p) => seen[p])).map((x) => ({ ...x, d: outline(x.provinces) })), [world.units, seen, me, friendsOfMe]); // eslint-disable-line react-hooks/exhaustive-deps
  const clipped = [...new Set(bands.map((b) => b.to))];

  // Battle sounds: a low rumble of guns that grows with the battles in view while the clock runs.
  const running = useGame((s) => s.running);
  const battleSounds = useGame((s) => s.settings.battleSounds);
  useEffect(() => {
    if (!running || !battleSounds) return sound.setRumble(0);
    const x0 = -view.x / view.k;
    const y0 = -view.y / view.k;
    const x1 = x0 + size.w / view.k;
    const y1 = y0 + size.h / view.k;
    const near = world.battles.filter((b) => {
      const [x, y] = POINTS[b.province];
      return [x, x + TABLE_W].some((v) => v >= x0 && v <= x1) && y >= y0 && y <= y1;
    }).length;
    sound.setRumble(Math.min(1, near / 6));
  }, [world.battles, view, size, running, battleSounds]);
  useEffect(() => () => sound.setRumble(0), []);

  const k = view.k;
  const inv = 1 / k;
  // Counters stay readable when zoomed out and do not balloon when zoomed in.
  const cs = Math.max(0.62, Math.min(1, 0.45 + 0.28 * k)) * inv;
  const selectedArmy = selection?.kind === 'army' && me ? armiesOf(world, me).find((a) => a.id === selection.id) : undefined;
  const selected = new Set(selection?.kind === 'units' ? selection.ids : selectedArmy ? selectedArmy.units : []);
  // Your armies: a flag over the province holding most of each, and an arrow for each push.
  const armies = me ? armiesOf(world, me).filter((a) => a.units.length) : [];
  const flags: { id: number; slot: number; name: string; x: number; y: number; picked: boolean }[] = [];
  {
    const at = new Map<number, number>();
    for (const a of armies) {
      const c = armyCentre(world, a);
      if (c === null) continue;
      const n = at.get(c) ?? 0;
      at.set(c, n + 1);
      flags.push({ id: a.id, slot: a.slot, name: a.name, x: POINTS[c][0] - 18 * cs + n * 26 * cs, y: POINTS[c][1] - 14 * cs, picked: a.id === selectedArmy?.id });
    }
  }
  const pincers = me && armies.length > 1 ? pincersOf(world, me) : [];
  const inPincer = new Set(pincers.flatMap((p) => p.armies));
  // One label for each place the jaws meet: under the target of the push that is nearest, with the most it would cut off.
  const pincerLabels: { at: number; cutOff: number; closing: boolean }[] = [];
  for (const x of pincers) {
    const at = Math.max(x.targets[0], x.targets[1]);
    const had = pincerLabels.find((y) => y.at === at || x.targets.includes(y.at));
    if (had) (had.cutOff = Math.max(had.cutOff, x.cutOff)), (had.closing ||= x.closing);
    else pincerLabels.push({ at, cutOff: x.cutOff, closing: x.closing });
  }
  const pushes = armies.flatMap((a) => {
    if (a.order.kind !== 'push') return [];
    const c = armyCentre(world, a);
    if (c === null || c === a.order.target) return [];
    const [x1, y1] = POINTS[c];
    const x2 = nearX(x1, POINTS[a.order.target][0]);
    const y2 = POINTS[a.order.target][1];
    // A gentle curve, bowed to the left of the way it goes.
    const mx = (x1 + x2) / 2 - (y2 - y1) * 0.18;
    const my = (y1 + y2) / 2 + (x2 - x1) * 0.18;
    return [{ id: a.id, d: `M${x1},${y1}Q${mx},${my} ${x2},${y2}`, colour: armyColour(a.slot), pincer: inPincer.has(a.id), picked: a.id === selectedArmy?.id }];
  });
  // Where the selected army stands fast: its fall-back line or reserve post.
  const post = selectedArmy?.order.kind === 'fallBack' ? selectedArmy.order.to : selectedArmy?.order.kind === 'reserve' ? selectedArmy.order.at : null;
  const selectedProvince = selection?.kind === 'province' ? selection.id : selection?.kind === 'stack' ? selection.province : null;

  // Marching arrows: one per stack and next province. Battles get their own, in red.
  const arrows: { key: string; from: number; to: number; own: boolean; attack: boolean; progress: number }[] = [];
  const fighting = new Set(world.battles.map((b) => b.province));
  for (const s of stacks) {
    // A division that pushed on (a deep attack) goes on from the province it pushed through.
    const next = new Map<string, { from: number; to: number; progress: number }>();
    for (const u of s.units) {
      if (!u.path.length) continue;
      const from = u.via ?? s.province;
      const k = `${from}>${u.path[0]}`;
      next.set(k, { from, to: u.path[0], progress: Math.max(next.get(k)?.progress ?? 0, u.progress) });
    }
    for (const { from, to, progress } of next.values()) arrows.push({ key: `${s.province}|${s.owner}|${from}|${to}`, from, to, own: s.owner === me, attack: fighting.has(to) && world.units.some((u) => u.at === to && atWar(world, u.owner, s.owner)), progress });
  }
  // The full routes of the selected divisions.
  const routes: string[] = [];
  const ends = new Set<number>();
  if (selected.size) {
    const done = new Set<string>();
    for (const u of world.units) {
      if (!selected.has(u.id) || !u.path.length) continue;
      const start = u.via === undefined ? [u.at] : [u.at, u.via];
      const key = `${start.join('>')}>${u.path.join('>')}`;
      if (done.has(key)) continue;
      done.add(key);
      // Each step takes the short way across the seam of the wrap-around map.
      let x = POINTS[start[0]][0];
      routes.push([...start, ...u.path].map((p) => `${(x = nearX(x, POINTS[p][0]))},${POINTS[p][1]}`).join(' '));
      ends.add(u.path[u.path.length - 1]);
    }
  }

  // The air and sea map: who holds each sea zone, the fleets in it, and the air wings at their bases.
  const airsea = mapMode === 'airsea';
  const seaNow = airsea ? picturesOf(world).sea : null;
  const selectedZone = selection?.kind === 'zone' ? selection.id : selection?.kind === 'fleet' ? world.fleets.find((f) => f.id === selection.id)?.zone ?? null : null;
  const fleetGroups: { zone: number; owner: string; ships: number; sailing: boolean }[] = [];
  const wingGroups: { base: number; owner: string; fighters: number; bombers: number }[] = [];
  if (airsea) {
    for (const f of world.fleets) {
      const zone = ZONE_INDEX[f.zone];
      let g = fleetGroups.find((x) => x.zone === zone && x.owner === f.owner);
      if (!g) fleetGroups.push((g = { zone, owner: f.owner, ships: 0, sailing: false }));
      g.ships += shipCount(f);
      if (world.day < f.arrives) g.sailing = true;
    }
    const friends = picturesOf(world).friends.get(me ?? '');
    for (const x of world.wings) {
      // Your own and your allies' airfields. Enemy airfields are not shown.
      if (me && x.owner !== me && !friends?.has(x.owner)) continue;
      let g = wingGroups.find((y) => y.base === x.base && y.owner === x.owner);
      if (!g) wingGroups.push((g = { base: x.base, owner: x.owner, fighters: 0, bombers: 0 }));
      if (x.type === 'fighter') g.fighters++;
      else g.bombers++;
    }
  }
  // Provinces within reach of the selected wings.
  let inRange: number[] = [];
  if (selection?.kind === 'wings' && me) {
    const based = world.wings.filter((x) => x.owner === me && x.base === selection.province);
    if (based.length) {
      const reach = Math.max(...based.map((x) => wingRange(x, modsOf(world.economies[me]))));
      inRange = PROVINCES.filter((p) => km(selection.province, p.id) <= reach).map((p) => p.id);
    }
  }
  // Divisions waiting to cross the sea.
  const crossings = new Map<string, { from: number; to: number; landing: boolean }>();
  for (const u of world.units) if (u.sea && (u.owner === me || !me)) crossings.set(`${u.at}>${u.sea.to}`, { from: u.at, to: u.sea.to, landing: u.sea.landing });

  // Where your air wings and fleets are aimed, and the joint attacks you have waiting.
  const aims: { key: string; x1: number; y1: number; to: number; kind: 'cas' | 'sky' | 'bomb' | 'scout' | 'shell'; n: number }[] = [];
  const strikes = me ? (world.strikes ?? []).filter((x) => x.owner === me) : [];
  if (me) {
    const add = (key: string, x1: number, y1: number, to: number, kind: (typeof aims)[number]['kind']) => {
      const had = aims.find((a) => a.key === key);
      if (had) had.n++;
      else aims.push({ key, x1, y1, to, kind, n: 1 });
    };
    for (const x of world.wings) {
      const t = x.owner === me ? aimOf(x) : undefined;
      if (t === undefined) continue;
      const kind = x.mission === 'scout' ? 'scout' : x.mission === 'strategic' ? 'bomb' : x.type === 'fighter' ? 'sky' : 'cas';
      add(`w${x.base}>${t}>${kind}`, POINTS[x.base][0], POINTS[x.base][1], t, kind);
    }
    for (const f of world.fleets) {
      if (f.owner !== me || f.target === undefined || f.mission !== 'patrol') continue;
      const [zx, zy] = ZONE_POINTS[ZONE_INDEX[f.zone]];
      add(`f${f.zone}>${f.target}`, zx, zy, f.target, 'shell');
    }
  }
  const AIM_WORDS = { cas: 'bombers supporting the attack', sky: 'fighters holding the sky', bomb: 'bombers hitting factories', scout: 'scout planes', shell: 'warships shelling the coast' };
  const menu = useGame((s) => s.menu);

  const showNames = k >= 2.6;
  const showCities = k >= 1.5;
  // The world wraps around (geo.ts): a second copy of everything fills the screen past the seam.
  const copies = view.x + TABLE_W * k < size.w ? [0, 1] : [0];
  const scene = (
    <>
      {airsea && (
        <g className="mt-zones">
          {ZONES.map((z, i) => (
            <path key={z.id} d={ZONE_SHAPES[i]} data-z={z.id} fill={me && seaNow ? SEA_FILL[seaNow.status(me, i)] : SEA_FILL.open} className={`mt-zone${hoverZone === z.id ? ' hover' : ''}${selectedZone === z.id ? ' picked' : ''}`} />
          ))}
        </g>
      )}
      <Land fill={fill} lines={lines} />
      {mapMode !== 'airsea' && (
        <g className="mt-fronts" aria-hidden="true">
          {bands.map((b) => (
            <FrontBand key={b.key} band={b} k={k} />
          ))}
        </g>
      )}
      {k >= WORLD_VIEW && <path d={RIVER_LINES} className="mt-river" />}
      {inRange.length > 0 && <path d={inRange.map((p) => SHAPES[p]).join('')} className="mt-range" />}
      {hover !== null && <path d={SHAPES[hover]} className="mt-hover" />}
      {selectedProvince !== null && <path d={SHAPES[selectedProvince]} className="mt-picked" />}
      {[...ends].map((p) => (
        <path key={p} d={SHAPES[p]} className="mt-target" />
      ))}
      {lessonProvince !== undefined && <path d={SHAPES[lessonProvince]} className="mt-lesson" />}

      <g className="mt-labels">
        {!airsea &&
          SEAS.filter((s) => !s.near || k >= WORLD_VIEW).map((s) => (
            <text key={`${s.name}@${s.at[0]}`} x={s.at[0]} y={s.at[1]} className="mt-sea" style={{ fontSize: 12 * Math.max(inv, 0.5) }}>
              {s.name}
            </text>
          ))}
        {airsea &&
          ZONES.map((z, i) => (
            <text key={z.id} x={ZONE_POINTS[i][0]} y={ZONE_POINTS[i][1] - 20 * cs} className="mt-sea zone" style={{ fontSize: 10.5 * Math.max(inv, 0.55) }}>
              {z.name.toUpperCase()}
            </text>
          ))}
        {k < 3.4 &&
          COUNTRIES.map((c) => {
            const at = COUNTRY_POINTS.get(c.name);
            if (!at || world.capitulated.includes(c.name)) return null;
            // Zoomed out to the whole world, only the biggest countries keep their names; closer in, the small ones wait until you zoom in.
            const big = (HOME_AREA.get(c.name) ?? 0) >= BIG_COUNTRY;
            if (k < WORLD_VIEW ? !big : !c.major && !big && k < (SMALL.has(c.name) ? 2.4 : 1.3)) return null;
            return (
              <text key={c.name} transform={`translate(${at[0]},${at[1]}) scale(${inv})`} data-c={c.name} className={`mt-country${c.major ? ' major' : ''}`} style={{ fontSize: c.major ? 15 : 11 }}>
                {c.name.toUpperCase()}
              </text>
            );
          })}
        {PROVINCES.map((p) => {
          const [x, y] = POINTS[p.id];
          if ((p.capital && k >= WORLD_VIEW) || (showCities && p.city))
            return (
              <g key={p.id} transform={`translate(${x},${y}) scale(${inv})`} className="mt-city">
                <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" className={p.capital ? 'capital' : ''} />
                {(showCities || k >= 1) && (
                  <text x={9} y={-8}>
                    {p.city}
                  </text>
                )}
              </g>
            );
          return showNames ? (
            <text key={p.id} transform={`translate(${x},${y - 17 * inv}) scale(${inv})`} className="mt-pname">
              {p.name}
            </text>
          ) : null;
        })}
      </g>

      <g className="mt-arrows">
        {arrows.map((a) => {
          const [x1, y1] = POINTS[a.from];
          const x2 = nearX(x1, POINTS[a.to][0]);
          const y2 = POINTS[a.to][1];
          // Stop short of the far counter so the arrowhead stays visible.
          const t = 0.78;
          return <line key={a.key} x1={x1} y1={y1} x2={x1 + (x2 - x1) * t} y2={y1 + (y2 - y1) * t} className={a.attack ? 'attack' : a.own ? 'own' : 'other'} markerEnd="url(#arr)" />;
        })}
        {[...crossings].map(([key, c]) => (
          <line key={key} x1={POINTS[c.from][0]} y1={POINTS[c.from][1]} x2={nearX(POINTS[c.from][0], POINTS[c.to][0])} y2={POINTS[c.to][1]} className={c.landing ? 'crossing landing' : 'crossing'} markerEnd="url(#arr)" />
        ))}
        {routes.map((pts, i) => (
          <polyline key={i} points={pts} className="route" markerEnd="url(#arr)" />
        ))}
      </g>

      <g className="mt-pushes" aria-hidden="true">
        {pushes.map((x) => (
          <g key={x.id} className={`mt-push${x.pincer ? ' pincer' : ''}${x.picked ? ' picked' : ''}`}>
            <path d={x.d} className="halo" />
            <path d={x.d} className="shaft" style={{ stroke: x.colour }} markerEnd="url(#push-head)" />
          </g>
        ))}
        {pincerLabels.map((x) => {
          const [px, py] = POINTS[x.at];
          return (
            <g key={x.at} transform={`translate(${px},${py + 30 * cs}) scale(${Math.max(cs, inv * 0.8)})`} className={`mt-pincer${x.closing && x.cutOff ? ' closing' : ''}`}>
              <rect x={-62} y={-10} width={124} height={20} rx={10} />
              <text y={4.5}>{x.cutOff ? `Pincer: ${x.cutOff} cut off` : 'Pincer'}</text>
            </g>
          );
        })}
        {post !== null && <circle cx={POINTS[post][0]} cy={POINTS[post][1]} r={30 * cs} className="mt-post" />}
      </g>

      <g className="mt-aims" aria-hidden="true">
        {aims.map((a) => {
          const [x2, y2] = POINTS[a.to];
          return (
            <g key={a.key} className={`mt-aim ${a.kind}`}>
              <title>{`${a.n} ${AIM_WORDS[a.kind]} over ${PROVINCES[a.to].name}`}</title>
              {/* Lines on the map keep their width on screen (non-scaling stroke), so these are pixels. */}
              <line x1={a.x1} y1={a.y1} x2={x2} y2={y2} className="halo" style={{ strokeWidth: 6 }} />
              <line x1={a.x1} y1={a.y1} x2={x2} y2={y2} style={{ strokeWidth: 2.6, strokeDasharray: a.kind === 'scout' ? '3 5' : '12 6' }} />
              <circle cx={x2} cy={y2} r={16 * cs} className="halo" style={{ strokeWidth: 6 * cs }} />
              <circle cx={x2} cy={y2} r={16 * cs} style={{ strokeWidth: 3 * cs }} />
            </g>
          );
        })}
        {strikes.map((x) => {
          const [px, py] = POINTS[x.province];
          return (
            <g key={x.id} className="mt-strike" transform={`translate(${px},${py - 40 * cs}) scale(${Math.max(cs, inv * 0.8)})`}>
              <title>{strikeStatus(world, x)}</title>
              <rect x={-50} y={-9} width={100} height={18} rx={9} />
              <text y={4}>{x.how === 'sea' ? 'Joint landing' : x.how === 'drop' ? 'Joint drop' : 'Joint attack'}</text>
            </g>
          );
        })}
      </g>

      <g className="mt-counters">
        {stacks.map((s) => {
          const [x, y] = POINTS[s.province];
          const { n, org, moving, armour } = summary(s);
          const own = s.owner === me;
          const enemy = !!me && atWar(world, me, s.owner);
          const picked = own ? s.units.some((u) => selected.has(u.id)) : selection?.kind === 'stack' && selection.province === s.province && selection.owner === s.owner;
          if (!own && !enemy && k < 1.3 && !picked) return null; // neutral armies appear as you zoom in
          if (airsea && !picked) return null; // the air and sea map shows fleets and air wings instead
          const colour = countryColour(s.owner);
          return (
            <g key={`${s.province}|${s.owner}`} data-s={`${s.province}|${s.owner}`} transform={`translate(${x},${y}) scale(${cs})`} className={`mt-counter${own ? ' own' : ''}${enemy ? ' enemy' : ''}${picked ? ' picked' : ''}${fighting.has(s.province) ? ' fighting' : ''}`}>
              {picked && <rect x={-27} y={-17} width={54} height={34} rx={5} className="ring" />}
              <rect x={-23} y={-13} width={46} height={26} rx={3} className="body" />
              <rect x={-23} y={-13} width={46} height={5} rx={1} fill={colour} />
              <text x={-19} y={7} className="tag">
                {countryByName(s.owner).tag}
              </text>
              <text x={19} y={8} textAnchor="end" className="num">
                {n}
              </text>
              <rect x={-21} y={10} width={42} height={2} className="org-back" />
              <rect x={-21} y={10} width={(42 * org) / 100} height={2} className="org" />
              {armour && <path d="M-22 -19h8v4h-8z" className="pip" />}
              {moving && <path d="M16 -20l6 3.5l-6 3.5z" className="pip" />}
            </g>
          );
        })}
      </g>

      {!airsea && (
        <g className="mt-flags">
          {flags.map((f) => (
            <g key={f.id} data-a={f.id} transform={`translate(${f.x},${f.y}) scale(${cs})`} className={`mt-flag${f.picked ? ' picked' : ''}`}>
              <title>{`${f.name}${f.slot ? ` (key ${f.slot})` : ''}: click to select, drag to give it a new front`}</title>
              <rect x={-6} y={-38} width={36} height={42} className="hit" />
              <line x1={0} y1={0} x2={0} y2={-34} className="pole" />
              <path d="M0 -34h26l-6 9l6 9h-26z" fill={armyColour(f.slot)} className="cloth" />
              <text x={10} y={-20.5} className="slot">
                {f.slot || '·'}
              </text>
              {(k >= 1.6 || f.picked) && (
                <text x={30} y={-21} className="name">
                  {f.name}
                </text>
              )}
            </g>
          ))}
        </g>
      )}

      {airsea && (
        <g className="mt-forces">
          {ZONES.map((z, i) => {
            const here = fleetGroups.filter((g) => g.zone === i).sort((a, b) => (a.owner === me ? -1 : b.owner === me ? 1 : b.ships - a.ships));
            return here.map((g, n) => {
              const own = g.owner === me;
              const enemy = !!me && atWar(world, me, g.owner);
              const x = ZONE_POINTS[i][0] + (n - (here.length - 1) / 2) * 44 * cs;
              return (
                <g key={`${z.id}|${g.owner}`} data-z={z.id} transform={`translate(${x},${ZONE_POINTS[i][1]}) scale(${cs})`} className={`mt-fleet${own ? ' own' : ''}${enemy ? ' enemy' : ''}${selectedZone === z.id && own ? ' picked' : ''}`}>
                  <path d="M-20 -9h40l-5 18h-30z" className="body" />
                  <rect x={-20} y={-9} width={40} height={4} fill={countryColour(g.owner)} />
                  <text x={-13} y={7} className="tag">
                    {countryByName(g.owner).tag}
                  </text>
                  <text x={13} y={7} textAnchor="end" className="num">
                    {Math.round(g.ships)}
                  </text>
                  {g.sailing && <path d="M14 -16l6 3.5l-6 3.5z" className="pip" />}
                </g>
              );
            });
          })}
          {wingGroups.map((g) => {
            const [x, y] = POINTS[g.base];
            const own = g.owner === me;
            const picked = own && selection?.kind === 'wings' && selection.province === g.base;
            return (
              <g key={`${g.base}|${g.owner}`} data-w={own ? g.base : undefined} data-p={own ? undefined : g.base} transform={`translate(${x},${y + 22 * cs}) scale(${cs})`} className={`mt-wing${own ? ' own' : ''}${picked ? ' picked' : ''}`}>
                <rect x={-22} y={-8} width={44} height={16} rx={8} className="body" />
                <circle cx={-14} cy={0} r={3.5} fill={countryColour(g.owner)} />
                <text x={15} y={4.5} textAnchor="end">
                  {g.fighters ? `F${g.fighters}` : ''}
                  {g.fighters && g.bombers ? ' ' : ''}
                  {g.bombers ? `B${g.bombers}` : ''}
                </text>
              </g>
            );
          })}
        </g>
      )}

      <g className="mt-pockets">
        {pockets.map((x) => {
          const [px, py] = POINTS[x.centre];
          const own = x.owner === me || !!friendsOfMe?.has(x.owner);
          return (
            <g key={`${x.owner}|${x.centre}`} className={`mt-pocket${own ? ' own' : ''}`}>
              <path d={x.d} className="ring" />
              <g transform={`translate(${px},${py + 26 * cs}) scale(${Math.max(cs, inv * 0.8)})`}>
                <rect x={-58} y={-9} width={116} height={18} rx={9} className="tag-back" />
                <text y={4}>{pocketWords(x.divisions)}</text>
              </g>
            </g>
          );
        })}
      </g>

      <g className="mt-battles">
        {world.battles.map((b) => {
          if (!seen[b.province] && !(me && (b.attackers.includes(me) || b.defenders.includes(me)))) return null;
          const [x, y] = POINTS[b.province];
          const on = selection?.kind === 'battle' && selection.id === b.id;
          return (
            <g key={b.id} data-b={b.id} transform={`translate(${x},${y - 24 * cs}) scale(${Math.max(cs, inv * 0.8)})`} className={`mt-battle${on ? ' picked' : ''}`}>
              <circle r={11} />
              <path d="M-5 -5L5 5M5 -5L-5 5M-6.5 -2.5l3 -3M6.5 -2.5l-3 -3" />
            </g>
          );
        })}
      </g>
    </>
  );
  return (
    <div
      ref={box}
      className={`mt-map${ordering || aim ? ' ordering' : ''}`}
      tabIndex={0}
      role="application"
      aria-label="Map of the world, which wraps around from east to west. Arrow keys move the map, plus and minus zoom, Tab steps through your armies, G gives a destination, H halts. Details of what you select appear in the sidebar."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        drag.current = null;
        setBand(null);
        setPull(null);
        setHover(null);
      }}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
    >
      <svg width={size.w} height={size.h} aria-hidden="true">
        <defs>
          <pattern id="hatch-war" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#4a1d10" />
            <rect width="2.5" height="7" fill="#ff6a3d" opacity="0.75" />
          </pattern>
          <pattern id="hatch-cut" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="6" height="6" fill="#3a1414" />
            <rect width="2" height="6" fill="#ff6a3d" />
          </pattern>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="context-stroke" />
          </marker>
          <marker id="push-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
            <path d="M0 0L10 5L0 10L2.5 5z" fill="context-stroke" />
          </marker>
          {clipped.map((p) => (
            <clipPath key={p} id={`clip-${p}`}>
              <path d={SHAPES[p]} />
            </clipPath>
          ))}
          <radialGradient id="table-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#12233f" />
            <stop offset="1" stopColor="#05070c" />
          </radialGradient>
        </defs>
        <rect width={size.w} height={size.h} fill="url(#table-glow)" />
        <g transform={`translate(${view.x},${view.y}) scale(${k})`}>
          {copies.map((o) => (
            <g key={o} transform={o ? `translate(${o * TABLE_W},0)` : undefined}>
              {scene}
            </g>
          ))}
        </g>
      </svg>
      {band && <div className="mt-band-select" style={{ left: Math.min(band.x0, band.x1), top: Math.min(band.y0, band.y1), width: Math.abs(band.x1 - band.x0), height: Math.abs(band.y1 - band.y0) }} />}
      {pull && (() => {
        const f = flags.find((x) => x.id === pull.army);
        if (!f) return null;
        const sx = view.x + f.x * k;
        const sy = view.y + f.y * k;
        return (
          <svg className="mt-pull" width={size.w} height={size.h} aria-hidden="true">
            <line x1={sx} y1={sy} x2={pull.x} y2={pull.y} style={{ stroke: armyColour(f.slot) }} />
            <circle cx={pull.x} cy={pull.y} r={6} style={{ fill: armyColour(f.slot) }} />
          </svg>
        );
      })()}
      <HoverLine province={hover} zone={hoverZone} pulling={pull?.army ?? null} />
      {menu && <AttackMenuView province={menu.province} x={menu.x} y={menu.y} width={size.w} height={size.h} />}
      <div className="mt-zoom">
        <button className="mt-icon" aria-label="Zoom in" onClick={() => (useGame.getState().bumpMoves(), zoomAt(1.4, size.w / 2, size.h / 2))} onPointerDown={(e) => e.stopPropagation()}>
          +
        </button>
        <button className="mt-icon" aria-label="Zoom out" onClick={() => (useGame.getState().bumpMoves(), zoomAt(1 / 1.4, size.w / 2, size.h / 2))} onPointerDown={(e) => e.stopPropagation()}>
          −
        </button>
      </div>
    </div>
  );
}

/** One line at the bottom of the map saying what is under the pointer, and what a right-click would do. */
function HoverLine({ province, zone, pulling }: { province: number | null; zone: string | null; pulling: number | null }) {
  const world = useGame((s) => s.world)!;
  const selection = useGame((s) => s.selection);
  const ordering = useGame((s) => s.ordering);
  const aim = useGame((s) => s.aim);
  const bySea = useGame((s) => s.bySea);
  if (province === null && zone !== null) {
    const i = ZONE_INDEX[zone];
    const status = world.player ? picturesOf(world).sea.status(world.player, i) : 'open';
    const words: Record<SeaStatus, string> = { own: 'you control it', enemy: 'the enemy controls it', contested: 'contested', open: 'open sea' };
    const fleets = world.fleets.filter((f) => f.zone === zone);
    return (
      <div className="mt-hoverline" aria-hidden="true">
        <b>{ZONES[i].name}</b> · {words[status]} · {fleets.length ? [...new Set(fleets.map((f) => f.owner))].join(', ') : 'no fleets'}
        {selection?.kind === 'fleet' && <em> · {ordering ? 'Click' : 'Right-click'} to sail here</em>}
      </div>
    );
  }
  if (province === null) return null;
  const p = PROVINCES[province];
  const me = world.player;
  const holder = world.controller[province];
  const mine = selection?.kind === 'units' && selection.ids.length > 0;
  let hint = '';
  const foreign = !!me && holder !== me && !picturesOf(world).friends.get(me)?.has(holder);
  const armyId = pulling ?? (selection?.kind === 'army' ? selection.id : null);
  const army = armyId !== null && me ? armiesOf(world, me).find((a) => a.id === armyId) : undefined;
  if (army && me) {
    // What pointing the army here would do.
    const got = orderFor(world, me, army, province, aim ?? undefined);
    const how = pulling !== null ? 'Let go' : aim ? 'Click' : 'Right-click';
    hint = 'why' in got ? `Cannot: ${got.why}` : `${how}: ${army.name} will ${describeOrder(got.order).replace(/^./, (c) => c.toLowerCase())}`;
  } else if (mine && me && ordering && bySea) {
    const u = world.units.find((x) => x.id === selection.ids[0]);
    const { sea, friends } = picturesOf(world);
    const plan = u ? shipPlan(world, sea, friends, u, province) : null;
    hint = !plan ? '' : 'why' in plan ? `Cannot go by sea: ${plan.why}` : `Click to ${plan.landing ? 'land here' : 'go here by sea'}: ${plan.days} days`;
  } else if (selection?.kind === 'wings' && me) {
    hint = holder === me || picturesOf(world).friends.get(me)?.has(holder) ? `${ordering ? 'Click' : 'Right-click'} to base the wings here` : '';
  } else if (mine && me) {
    const click = ordering ? 'Click' : 'Right-click';
    if (holder !== me && !atWar(world, me, holder)) hint = 'Neutral: your divisions cannot enter';
    else hint = world.units.some((u) => u.at === province && atWar(world, u.owner, me)) ? `${click} to attack` : `${click} to march here`;
  }
  if (foreign && pulling === null && !aim && !ordering) hint = atWar(world, me!, holder) ? 'Right-click for every way to attack it' : 'Right-click for options (you are not at war)';
  const rivers = [...new Set(p.neighbours.map((n) => riverBetween(province, n)).filter((r): r is string => !!r))];
  const ground = groundOn(province, world.startDate, world.day);
  return (
    <div className="mt-hoverline" aria-hidden="true">
      <b>{p.name}</b>
      {p.city && p.city !== p.name ? ` (${p.city})` : ''} · {holder}
      {holder !== p.owner ? `, taken from ${p.owner}` : ''} · {p.terrain}
      {rivers.length > 0 && ` · ${rivers.join(', ')}`}
      {ground !== 'dry' && ` · ${GROUND_WORDS[ground].split(':')[0]}`}
      {hint && <em> · {hint}</em>}
    </div>
  );
}
