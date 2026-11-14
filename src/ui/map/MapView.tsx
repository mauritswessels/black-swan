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
import { km, wingRange } from '../../sim/air';
import { modsOf } from '../../sim/mods';
import { shipPlan } from '../../sim/navy';
import { shipCount, ZONE_INDEX, ZONES, type SeaStatus } from '../../sim/sea';
import { picturesOf, skyOver } from '../forces';
import { useGame, type MapMode } from '../store';
import { countryColour, landColour, TERRAIN_COLOUR, tint } from './colours';
import { COAST, COUNTRY_POINTS, countryLines, GRATICULE, POINTS, PROVINCE_LINES, SEAS, SHAPES, TABLE_H, TABLE_W, ZONE_POINTS, ZONE_SHAPES } from './geo';

interface View {
  k: number;
  x: number;
  y: number;
}
const MIN_K = 0.8;
const MAX_K = 9;
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
  const focus = useGame((s) => s.focus);
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

  // Keep the table on screen: never let it be dragged wholly out of view.
  const clamp = useCallback((v: View): View => {
    const { w, h } = sizeRef.current;
    const k = Math.max(MIN_K, Math.min(MAX_K, v.k));
    const m = 0.5;
    return { k, x: Math.max(w * (1 - m) - TABLE_W * k, Math.min(w * m, v.x)), y: Math.max(h * (1 - m) - TABLE_H * k, Math.min(h * m, v.y)) };
  }, []);
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const k = Math.max(MIN_K, Math.min(MAX_K, v.k * factor));
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
  }, [focus, centreOn, sized]);

  // Wheel and trackpad. Listeners are added by hand because React's wheel events cannot stop the page scrolling.
  useEffect(() => {
    const el = box.current!;
    const point = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
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
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; target: Element } | null>(null);
  const hit = (el: Element | null) => {
    const stack = el?.closest('[data-s]')?.getAttribute('data-s');
    const battle = el?.closest('[data-b]')?.getAttribute('data-b');
    const country = el?.closest('[data-c]')?.getAttribute('data-c');
    const province = el?.closest('[data-p]')?.getAttribute('data-p');
    const wing = el?.closest('[data-w]')?.getAttribute('data-w');
    const zone = el?.closest('[data-z]')?.getAttribute('data-z') ?? null;
    return { stack, battle, country, zone, wing: wing == null ? null : Number(wing), province: province == null ? null : Number(province) };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, target: e.target as Element };
    box.current?.focus({ preventScroll: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < 5) return;
      d.moved = true;
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
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const g = useGame.getState();
    const h = hit(d.target);
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
    if (g.selection?.kind === 'fleet') {
      if (h.zone && p == null) g.sailTo(h.zone);
      return;
    }
    if (g.selection?.kind === 'wings') {
      if (p != null) g.rebaseTo(p);
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
    e.preventDefault();
  };

  const fill = useMemo(() => fills(world, mapMode), [world.controller, world.wars, mapMode, mapMode === 'supply' ? world.units : null, mapMode === 'diplomacy' ? world.diplomacy : null, mapMode === 'airsea' ? world.wings : null]); // eslint-disable-line react-hooks/exhaustive-deps
  const lines = useMemo(() => countryLines(world.controller), [world.controller]);
  const stacks = useMemo(() => visibleStacks(world, me), [world.units, world.controller, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const seen = useMemo(() => visibleProvinces(world, me), [world.units, world.controller, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = view.k;
  const inv = 1 / k;
  // Counters stay readable when zoomed out and do not balloon when zoomed in.
  const cs = Math.max(0.62, Math.min(1, 0.45 + 0.28 * k)) * inv;
  const selected = new Set(selection?.kind === 'units' ? selection.ids : []);
  const selectedProvince = selection?.kind === 'province' ? selection.id : selection?.kind === 'stack' ? selection.province : null;

  // Marching arrows: one per stack and next province. Battles get their own, in red.
  const arrows: { key: string; from: number; to: number; own: boolean; attack: boolean; progress: number }[] = [];
  const fighting = new Set(world.battles.map((b) => b.province));
  for (const s of stacks) {
    const next = new Map<number, number>();
    for (const u of s.units) if (u.path.length) next.set(u.path[0], Math.max(next.get(u.path[0]) ?? 0, u.progress));
    for (const [to, progress] of next) arrows.push({ key: `${s.province}|${s.owner}|${to}`, from: s.province, to, own: s.owner === me, attack: fighting.has(to) && world.units.some((u) => u.at === to && atWar(world, u.owner, s.owner)), progress });
  }
  // The full routes of the selected divisions.
  const routes: string[] = [];
  const ends = new Set<number>();
  if (selected.size) {
    const done = new Set<string>();
    for (const u of world.units) {
      if (!selected.has(u.id) || !u.path.length) continue;
      const key = `${u.at}>${u.path.join('>')}`;
      if (done.has(key)) continue;
      done.add(key);
      routes.push([u.at, ...u.path].map((p) => POINTS[p].join(',')).join(' '));
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

  const showNames = k >= 2.6;
  const showCities = k >= 1.5;
  return (
    <div
      ref={box}
      className={`mt-map${ordering ? ' ordering' : ''}`}
      tabIndex={0}
      role="application"
      aria-label="Map of Europe. Arrow keys move the map, plus and minus zoom, Tab steps through your armies, G gives a destination, H halts. Details of what you select appear in the sidebar."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        drag.current = null;
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
          <radialGradient id="table-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#12233f" />
            <stop offset="1" stopColor="#05070c" />
          </radialGradient>
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${k})`}>
          <rect x={-TABLE_W} y={-TABLE_H} width={TABLE_W * 3} height={TABLE_H * 3} fill="url(#table-glow)" />
          {airsea && (
            <g className="mt-zones">
              {ZONES.map((z, i) => (
                <path key={z.id} d={ZONE_SHAPES[i]} data-z={z.id} fill={me && seaNow ? SEA_FILL[seaNow.status(me, i)] : SEA_FILL.open} className={`mt-zone${hoverZone === z.id ? ' hover' : ''}${selectedZone === z.id ? ' picked' : ''}`} />
              ))}
            </g>
          )}
          <Land fill={fill} lines={lines} />
          {inRange.length > 0 && <path d={inRange.map((p) => SHAPES[p]).join('')} className="mt-range" />}
          {hover !== null && <path d={SHAPES[hover]} className="mt-hover" />}
          {selectedProvince !== null && <path d={SHAPES[selectedProvince]} className="mt-picked" />}
          {[...ends].map((p) => (
            <path key={p} d={SHAPES[p]} className="mt-target" />
          ))}

          <g className="mt-labels">
            {!airsea &&
              SEAS.map((s) => (
                <text key={s.name} x={s.at[0]} y={s.at[1]} className="mt-sea" style={{ fontSize: 12 * Math.max(inv, 0.5) }}>
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
                if (!c.major && k < (SMALL.has(c.name) ? 2.4 : 1.3)) return null;
                return (
                  <text key={c.name} transform={`translate(${at[0]},${at[1]}) scale(${inv})`} data-c={c.name} className={`mt-country${c.major ? ' major' : ''}`} style={{ fontSize: c.major ? 15 : 11 }}>
                    {c.name.toUpperCase()}
                  </text>
                );
              })}
            {PROVINCES.map((p) => {
              const [x, y] = POINTS[p.id];
              if (p.capital || (showCities && p.city))
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
              const [x2, y2] = POINTS[a.to];
              // Stop short of the far counter so the arrowhead stays visible.
              const t = 0.78;
              return <line key={a.key} x1={x1} y1={y1} x2={x1 + (x2 - x1) * t} y2={y1 + (y2 - y1) * t} className={a.attack ? 'attack' : a.own ? 'own' : 'other'} markerEnd="url(#arr)" />;
            })}
            {[...crossings].map(([key, c]) => (
              <line key={key} x1={POINTS[c.from][0]} y1={POINTS[c.from][1]} x2={POINTS[c.to][0]} y2={POINTS[c.to][1]} className={c.landing ? 'crossing landing' : 'crossing'} markerEnd="url(#arr)" />
            ))}
            {routes.map((pts, i) => (
              <polyline key={i} points={pts} className="route" markerEnd="url(#arr)" />
            ))}
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
        </g>
      </svg>
      <HoverLine province={hover} zone={hoverZone} />
      <div className="mt-zoom">
        <button className="mt-icon" aria-label="Zoom in" onClick={() => zoomAt(1.4, size.w / 2, size.h / 2)} onPointerDown={(e) => e.stopPropagation()}>
          +
        </button>
        <button className="mt-icon" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.4, size.w / 2, size.h / 2)} onPointerDown={(e) => e.stopPropagation()}>
          −
        </button>
      </div>
    </div>
  );
}

/** One line at the bottom of the map saying what is under the pointer, and what a right-click would do. */
function HoverLine({ province, zone }: { province: number | null; zone: string | null }) {
  const world = useGame((s) => s.world)!;
  const selection = useGame((s) => s.selection);
  const ordering = useGame((s) => s.ordering);
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
  if (mine && me && ordering && bySea) {
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
  return (
    <div className="mt-hoverline" aria-hidden="true">
      <b>{p.name}</b>
      {p.city && p.city !== p.name ? ` (${p.city})` : ''} · {holder}
      {holder !== p.owner ? `, taken from ${p.owner}` : ''} · {p.terrain}
      {hint && <em> · {hint}</em>}
    </div>
  );
}
