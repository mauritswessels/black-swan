/** Small shared pieces: glossary tooltips, animated numbers, a gauge and a meter. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { termById } from '../../content/glossary';

// ---------- Tooltip for a glossary term ----------
let tipEl: HTMLDivElement | null = null;
function tip(): HTMLDivElement {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'tip';
    tipEl.setAttribute('role', 'tooltip');
    tipEl.hidden = true;
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

/** Wraps text that has a codex entry. Hover or focus shows the definition; `now` adds "why it matters right now". */
export function Term({ id, children, now }: { id: string; children: ReactNode; now?: string }) {
  const t = termById(id);
  if (!t) return <>{children}</>;
  const show = (x: number, y: number) => {
    const el = tip();
    el.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = t.term;
    el.append(b, document.createTextNode(t.definition));
    const i = document.createElement('i');
    i.textContent = now ?? t.why;
    el.append(i);
    el.hidden = false;
    const w = 300;
    el.style.left = `${Math.min(x + 14, window.innerWidth - w - 12)}px`;
    el.style.top = `${Math.min(y + 16, window.innerHeight - el.offsetHeight - 12)}px`;
  };
  const hide = () => {
    tip().hidden = true;
  };
  return (
    <span
      className="term"
      tabIndex={0}
      onMouseMove={(e) => show(e.clientX, e.clientY)}
      onMouseLeave={hide}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        show(r.left, r.bottom);
      }}
      onBlur={hide}
    >
      {children}
    </span>
  );
}

// ---------- Number that ticks to its new value ----------
export function Ticker({ value, decimals = 1, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      from.current = value;
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      const e = 1 - (1 - k) ** 3;
      setShown(start + (value - start) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <>
      {shown.toFixed(decimals)}
      {suffix}
    </>
  );
}

// ---------- Half-circle gauge (0 to 100) ----------
export function Gauge({ value, delta, label }: { value: number; delta: number; label: string }) {
  const cx = 75;
  const cy = 82;
  const r = 58;
  const a = (t: number) => Math.PI + t * Math.PI;
  const arc = (t0: number, t1: number) =>
    `M${cx + r * Math.cos(a(t0))},${cy + r * Math.sin(a(t0))} A${r},${r} 0 0 1 ${cx + r * Math.cos(a(t1))},${cy + r * Math.sin(a(t1))}`;
  const v = Math.max(0.001, Math.min(1, value / 100));
  const color = value < 30 ? 'var(--hot)' : value < 50 ? 'var(--gold)' : 'var(--ice)';
  return (
    <svg viewBox="0 0 150 106" width="150" height="106" role="img" aria-label={`${label} ${Math.round(value)} out of 100`}>
      <path d={arc(0, 1)} stroke="rgba(156,200,255,.12)" strokeWidth="10" fill="none" />
      <path d={arc(0, v)} stroke={color} strokeWidth="10" fill="none" style={{ transition: 'all .8s' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ font: "500 34px 'Barlow Condensed'", fill: '#fff' }}>
        {Math.round(value)}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ font: "500 11px 'Barlow Condensed'", letterSpacing: '.2em', fill: 'var(--dim)' }}>
        {label.toUpperCase()} {delta >= 0.5 ? `▲${delta.toFixed(0)}` : delta <= -0.5 ? `▼${(-delta).toFixed(0)}` : '–'}
      </text>
    </svg>
  );
}

export function Meter({ label, value, text, warm }: { label: ReactNode; value: number; text: string; warm?: boolean }) {
  return (
    <div>
      <div className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <b style={{ color: '#fff', fontWeight: 500, letterSpacing: '.04em', fontSize: 15 }}>{text}</b>
      </div>
      <div style={{ height: 6, background: 'rgba(156,200,255,.1)', position: 'relative', marginTop: 4 }}>
        <i
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(100, value))}%`,
            background: warm ? 'linear-gradient(90deg,#b4552f,var(--gold))' : 'linear-gradient(90deg,#3a6fd8,var(--ice))',
            transition: 'width .8s',
          }}
        />
      </div>
    </div>
  );
}
