/**
 * The war replay: the front, week by week, played back in about a minute. Opened with key V,
 * from the end-of-war report, or from the defeat screen.
 */
import { useEffect, useMemo, useState } from 'react';
import { COUNTRIES } from '../../sim/countries';
import { PROVINCES } from '../../sim/map';
import { warFrames } from '../../sim/replay';
import { dateLabel } from '../../sim/world';
import { countryColour, landColour } from '../map/colours';
import { COAST, countryLines, SHAPES, TABLE_H, TABLE_W } from '../map/geo';
import { useGame } from '../store';
import { Shell } from './Overlays';

/** The whole replay takes about this long. */
const REPLAY_MS = 60000;

export function Replay() {
  const w = useGame((s) => s.world);
  const frames = useMemo(() => (w?.replay ? warFrames(w.replay, w.day) : []), [w?.replay, w?.day]); // eslint-disable-line react-hooks/exhaustive-deps
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const last = frames.length - 1;
  useEffect(() => {
    if (!playing || at >= last) return;
    const t = setTimeout(() => setAt((x) => Math.min(last, x + 1)), Math.max(25, REPLAY_MS / Math.max(1, frames.length)));
    return () => clearTimeout(t);
  }, [playing, at, last, frames.length]);
  const frame = frames[Math.min(at, last)];
  const lines = useMemo(() => (frame ? countryLines(frame.controller) : ''), [frame]);
  if (!w || !frame) {
    return (
      <Shell title="War replay">
        <p className="muted">Nothing has been recorded yet. The front is written down once a week as the game runs.</p>
      </Shell>
    );
  }
  const me = w.player;
  // Who holds the most victory points this week, for the legend.
  const held = new Map<string, number>();
  for (const p of PROVINCES) held.set(frame.controller[p.id], (held.get(frame.controller[p.id]) ?? 0) + p.victoryPoints + 1);
  const leaders = [...held].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  const changed = new Set(frame.changed);
  return (
    <Shell title="War replay">
      <div className="rp">
        <svg viewBox={`30 30 ${TABLE_W - 60} ${TABLE_H - 60}`} className="rp-map" role="img" aria-label={`The map on ${dateLabel({ startDate: w.startDate, day: frame.day })}`}>
          {SHAPES.map((d, i) => (
            <path key={i} d={d} fill={landColour(frame.controller[i], frame.controller[i] === me)} className={changed.has(i) ? 'rp-changed' : ''} />
          ))}
          <path d={COAST} className="rp-coast" />
          <path d={lines} className="rp-border" />
        </svg>
        <div className="rp-bar">
          <button className="btn primary" onClick={() => (at >= last ? (setAt(0), setPlaying(true)) : setPlaying(!playing))} autoFocus>
            {at >= last ? 'Play again' : playing ? 'Pause' : 'Play'}
          </button>
          <input type="range" min={0} max={last} value={at} aria-label="Week" onChange={(e) => (setAt(Number(e.target.value)), setPlaying(false))} />
          <b className="rp-date" aria-live="off">
            {dateLabel({ startDate: w.startDate, day: frame.day })}
          </b>
        </div>
        <ul className="rp-legend">
          {leaders.map((c) => (
            <li key={c}>
              <i style={{ background: countryColour(c) }} />
              {COUNTRIES.find((x) => x.name === c)?.name ?? c}
            </li>
          ))}
        </ul>
        <p className="muted">
          {frames.length} weeks, one picture a week. Provinces that just changed hands flash gold. Drag the slider to stop at any week.
        </p>
      </div>
    </Shell>
  );
}
