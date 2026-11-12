/**
 * The map table: provinces, borders, labels, division counters, marching arrows and battle
 * markers. Scroll or pinch to zoom, drag to move. It only draws the world and reports clicks;
 * the rules live in src/sim.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, countryByName } from '../../sim/countries';
import { visibleProvinces, visibleStacks, type Stack } from '../../sim/intel';
import { PROVINCES } from '../../sim/map';
import { linkedProvinces, supplyCapacity } from '../../sim/supply';
import type { World } from '../../sim/types';
import { atWar } from '../../sim/war';
import { useGame, type MapMode } from '../store';
import { countryColour, landColour, TERRAIN_COLOUR, tint } from './colours';
import { COAST, COUNTRY_POINTS, countryLines, GRATICULE, POINTS, PROVINCE_LINES, SEAS, SHAPES, TABLE_H, TABLE_W } from './geo';

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
  if (mode === 'diplomacy') return w.controller.map((c) => (c === me ? tint('#5b9bff', 0.6) : me && atWar(w, me, c) ? 'url(#hatch-war)' : tint('#8592a9', 0.22)));
  if (mode === 'supply' && me) {
    const linked = linkedProvinces(w.controller, me);
    const count = new Array<number>(PROVINCES.length).fill(0);
    for (const u of w.units) count[u.at]++;
    return w.controller.map((c, p) => {
      if (c !== me) return tint('#8592a9', 0.1);
      if (!linked[p]) return 'url(#hatch-cut)';
      if (count[p] > supplyCapacity(p)) return tint('#ffc46b', 0.6);
      return tint('#9cc8ff', 0.12 + 0.5 * ((supplyCapacity(p) - 7) / 12));
    });
  }
  return w.controller.map((c) => landColour(c, c === me));
}

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
    return { stack, battle, country, province: province == null ? null : Number(province) };
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
    const at = p.stack ? Number(p.stack.split('|')[0]) : p.province;
    if (at !== hover) setHover(at);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const g = useGame.getState();
    const h = hit(d.target);
    if (h.battle != null) return g.select({ kind: 'battle', id: Number(h.battle) });
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
    g.select(null);
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const g = useGame.getState();
    if (g.selection?.kind !== 'units') return;
    const h = hit(e.target as Element);
    const p = h.stack ? Number(h.stack.split('|')[0]) : h.province;
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

  const fill = useMemo(() => fills(world, mapMode), [world.controller, world.wars, mapMode, mapMode === 'supply' ? world.units : null]); // eslint-disable-line react-hooks/exhaustive-deps
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
          <Land fill={fill} lines={lines} />
          {hover !== null && <path d={SHAPES[hover]} className="mt-hover" />}
          {selectedProvince !== null && <path d={SHAPES[selectedProvince]} className="mt-picked" />}
          {[...ends].map((p) => (
            <path key={p} d={SHAPES[p]} className="mt-target" />
          ))}

          <g className="mt-labels">
            {SEAS.map((s) => (
              <text key={s.name} x={s.at[0]} y={s.at[1]} className="mt-sea" style={{ fontSize: 12 * Math.max(inv, 0.5) }}>
                {s.name}
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
      <HoverLine province={hover} />
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
function HoverLine({ province }: { province: number | null }) {
  const world = useGame((s) => s.world)!;
  const selection = useGame((s) => s.selection);
  const ordering = useGame((s) => s.ordering);
  if (province === null) return null;
  const p = PROVINCES[province];
  const me = world.player;
  const holder = world.controller[province];
  const mine = selection?.kind === 'units' && selection.ids.length > 0;
  let hint = '';
  if (mine && me) {
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
