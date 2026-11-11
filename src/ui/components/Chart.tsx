/**
 * A line chart drawn as SVG, sized to its container.
 * Supports history + forecast, fan bands, a target band and a "now" marker.
 */
import { useEffect, useRef, useState } from 'react';

export interface Series {
  data: (number | null)[];
  /** Index on the x axis where data[0] sits. */
  from?: number;
  color: string;
  width?: number;
  dash?: boolean;
  glow?: boolean;
  dot?: boolean;
  label?: string;
}

export interface Band {
  lo: number[];
  hi: number[];
  from: number;
  fill: string;
}

export interface ChartProps {
  n: number;
  series: Series[];
  bands?: Band[];
  min?: number;
  max?: number;
  ticks?: number[];
  format?: (v: number) => string;
  target?: [number, number];
  now?: number;
  nowLabel?: string;
  xLabels?: { i: number; text: string }[];
  categories?: string[];
  /** Smallest y range to show (default 1, or 5% of the level). */
  minSpan?: number;
  pad?: Partial<{ l: number; r: number; t: number; b: number }>;
  title: string;
}

function tickStep(span: number): number {
  return span > 40 ? 20 : span > 16 ? 5 : span > 8 ? 2 : span > 4 ? 1 : span > 1.6 ? 0.5 : span > 0.6 ? 0.2 : span > 0.25 ? 0.1 : span > 0.1 ? 0.05 : 0.01;
}

function niceTicks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

export function Chart(p: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = [
    ...p.series.flatMap((s) => s.data.filter((v): v is number => v !== null)),
    ...(p.bands ?? []).flatMap((b) => [...b.lo, ...b.hi]),
    ...(p.target ?? []),
  ];
  let rawMin = Math.min(...values);
  let rawMax = Math.max(...values);
  // Never zoom in so far that a tiny wobble looks like a crash.
  const minSpan = p.minSpan ?? Math.max(1, Math.abs(rawMax + rawMin) * 0.05);
  if (rawMax - rawMin < minSpan) {
    const mid = (rawMax + rawMin) / 2;
    rawMin = mid - minSpan / 2;
    rawMax = mid + minSpan / 2;
  }
  const padY = (rawMax - rawMin) * 0.08;
  const min = p.min ?? rawMin - padY;
  const max = p.max ?? rawMax + padY;
  const step = tickStep(max - min);
  const ticks = p.ticks ?? niceTicks(min, max, step);
  const decimals = p.ticks ? 0 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const fmt = p.format ?? ((v: number) => v.toFixed(decimals));
  const pad = { l: 34, r: 14, t: 12, b: 22, ...p.pad };
  const W = size.w;
  const H = size.h;
  const x = (i: number) => pad.l + ((W - pad.l - pad.r) * i) / Math.max(1, p.n - 1);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - min) / (max - min || 1));

  const path = (s: Series) => {
    let d = '';
    let pen = false;
    s.data.forEach((v, k) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x((s.from ?? 0) + k).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 60 }}>
      {W > 0 && H > 0 && (
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={p.title}>
          <defs>
            <filter id="glow" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {p.now !== undefined && p.now < p.n - 1 && <rect className="fcbg" x={x(p.now)} y={pad.t} width={x(p.n - 1) - x(p.now)} height={H - pad.t - pad.b} />}
          {p.target && <rect className="target" x={pad.l} width={W - pad.l - pad.r} y={y(p.target[1])} height={Math.max(0, y(p.target[0]) - y(p.target[1]))} />}
          {ticks.map((v) => (
            <g key={v}>
              <line className={v === 0 ? 'zero' : 'grid'} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end">
                {fmt(v)}
              </text>
            </g>
          ))}
          {(p.xLabels ?? []).map((l) => (
            <text key={l.i} x={x(l.i)} y={H - 4} textAnchor="middle">
              {l.text}
            </text>
          ))}
          {(p.categories ?? []).map((c, k) => (
            <text key={c} x={x(k)} y={H - 4} textAnchor="middle">
              {c}
            </text>
          ))}
          {(p.bands ?? []).map((b, k) => {
            const up = b.hi.map((v, j) => `${x(b.from + j)},${y(v)}`);
            const dn = b.lo.map((v, j) => `${x(b.from + j)},${y(v)}`).reverse();
            return <polygon key={k} className="fade" points={[...up, ...dn].join(' ')} fill={b.fill} />;
          })}
          {p.now !== undefined && <line className="now" x1={x(p.now)} x2={x(p.now)} y1={pad.t} y2={H - pad.b} />}
          {p.now !== undefined && p.nowLabel && (
            <text className="lab" x={p.now > p.n * 0.8 ? x(p.now) - 5 : x(p.now) + 5} textAnchor={p.now > p.n * 0.8 ? 'end' : 'start'} y={pad.t + 11}>
              {p.nowLabel}
            </text>
          )}
          {p.series.map((s, k) => {
            const last = [...s.data].reverse().findIndex((v) => v !== null);
            const li = s.data.length - 1 - last;
            const lv = s.data[li];
            return (
              <g key={k}>
                <path
                  d={path(s)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.width ?? 2}
                  strokeDasharray={s.dash ? '5 5' : undefined}
                  className={s.dash ? 'fade' : 'draw'}
                  pathLength={s.dash ? undefined : 1}
                  filter={s.glow ? 'url(#glow)' : undefined}
                  strokeLinejoin="round"
                />
                {s.dot && lv !== null && lv !== undefined && <circle className="fade" cx={x((s.from ?? 0) + li)} cy={y(lv)} r={3.5} fill={s.color} />}
                {s.label && lv !== null && lv !== undefined && (
                  <text className="fade" x={x((s.from ?? 0) + li) + 7} y={y(lv) + 4} style={{ fill: s.color }}>
                    {s.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
