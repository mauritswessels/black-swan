/** The Map table: the main game screen. The map fills the window; bars and the sidebar sit over it. */
import { useEffect, useState } from 'react';
import { countryByName } from '../../sim/countries';
import { enemiesOf } from '../../sim/war';
import { dateLabel } from '../../sim/world';
import { MapView } from '../map/MapView';
import { TERRAIN_COLOUR } from '../map/colours';
import { SPEED_MS, useGame, type MapMode } from '../store';
import { Sidebar } from './Sidebar';
import './maptable.css';

const GOVERNMENT = { democracy: 'Democracy', authoritarian: 'Authoritarian government', fascist: 'Fascist dictatorship', communist: 'Communist dictatorship' };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Panels from the design that arrive in later stages, shown greyed out so the layout is already the final one. */
const RAIL: { label: string; stage: string; d: string }[] = [
  { label: 'Production', stage: 'D', d: 'M3 21V10l6 4v-4l6 4V4h6v17z' },
  { label: 'Research', stage: 'E', d: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3' },
  { label: 'Economy', stage: 'D', d: 'M2 20h20M5 20V11M10 20V5M15 20v-7M20 20V8' },
  { label: 'Diplomacy', stage: 'F', d: 'M3 12h18M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18' },
  { label: 'Plan', stage: 'E', d: 'M5 21V4h12l-3 4 3 4H5' },
];
const CODEX = 'M5 4h14v16H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12';
const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
    <path d={d} />
  </svg>
);

function TopBar() {
  const w = useGame((s) => s.world)!;
  const running = useGame((s) => s.running);
  const speed = useGame((s) => s.speed);
  const { setRunning, setSpeed, select, tick } = useGame.getState();
  const me = w.player;
  const mine = w.units.filter((u) => u.owner === me);
  const enemies = me ? enemiesOf(w, me) : [];
  const myBattles = w.battles.filter((b) => me && (b.attackers.includes(me) || b.defenders.includes(me))).length;
  const supply = avg(mine.map((u) => u.supply)) * 100;
  const stats: { label: string; value: string; warn?: boolean }[] = [
    { label: 'Divisions', value: String(mine.length) },
    { label: 'Strength', value: `${Math.round(avg(mine.map((u) => u.strength)))}%` },
    { label: 'Organisation', value: `${Math.round(avg(mine.map((u) => u.organisation)))}%` },
    { label: 'Supply', value: `${Math.round(supply)}%`, warn: supply < 80 },
    { label: 'Provinces', value: String(w.controller.filter((c) => c === me).length) },
    { label: 'Battles', value: String(myBattles), warn: myBattles > 0 },
  ];
  return (
    <header className="mt-top">
      <button className="mt-country-btn" onClick={() => me && select({ kind: 'country', name: me })}>
        <span>{(me ?? 'Observer').toUpperCase()}</span>
        <small>
          {me ? GOVERNMENT[countryByName(me).government] : 'Watching'} · {enemies.length ? `at war with ${enemies.join(', ')}` : 'at peace'}
        </small>
      </button>
      <dl className="mt-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd className={s.warn ? 'warn' : ''}>{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-clock">
        <div className="mt-date" role="status" aria-live="off">
          <span>{dateLabel(w)}</span>
          <small className={running ? 'run' : ''}>{running ? 'RUNNING' : 'PAUSED'}</small>
        </div>
        <button className="mt-play" onClick={() => setRunning(!running)} aria-label={running ? 'Pause (Space)' : 'Resume (Space)'} title="Space">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            {running ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5l11 7l-11 7z" />}
          </svg>
        </button>
        <button className="mt-play" onClick={tick} disabled={running} aria-label="Advance one day (full stop key)" title="One day ( . )">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5l9 7l-9 7zM16 5h3v14h-3z" />
          </svg>
        </button>
        <div className="mt-speed" role="group" aria-label={`Speed ${speed} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setSpeed(n)} aria-label={`Speed ${n}`} aria-pressed={speed === n} className={n <= speed ? 'on' : ''} title={`Speed ${n} (key ${n})`}>
              <i style={{ height: 5 + n * 3 }} />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Rail() {
  const { setOverlay, go, toggleMute, select } = useGame.getState();
  const muted = useGame((s) => s.muted);
  return (
    <nav className="mt-rail" aria-label="Panels">
      {RAIL.map((r) => (
        <button key={r.label} disabled title={`Arrives in Stage ${r.stage}`} aria-label={`${r.label}: arrives in Stage ${r.stage}`}>
          <Icon d={r.d} />
          <span>{r.label}</span>
        </button>
      ))}
      <button onClick={() => select({ kind: 'reports' })} title="Battle reports (R)">
        <Icon d="M5 5l14 14M19 5L5 19M4 8l4-4M20 8l-4-4" />
        <span>Battles</span>
      </button>
      <button onClick={() => setOverlay('codex')} title="Codex (X)">
        <Icon d={CODEX} />
        <span>Codex</span>
      </button>
      <div className="mt-rail-gap" />
      <button onClick={() => setOverlay('saves')} title="Save and load (S)">
        <Icon d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />
        <span>Save</span>
      </button>
      <button onClick={toggleMute} aria-pressed={!muted} title="Sound (M)">
        <Icon d={muted ? 'M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6' : 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11'} />
        <span>{muted ? 'Sound off' : 'Sound on'}</span>
      </button>
      <button onClick={() => setOverlay('help')} title="Keys (?)">
        <Icon d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18" />
        <span>Keys</span>
      </button>
      <button onClick={() => go('title')} title="Main menu">
        <Icon d="M4 12l8-8l8 8M6 10v10h12V10" />
        <span>Menu</span>
      </button>
    </nav>
  );
}

const MODES: { id: MapMode; label: string }[] = [
  { id: 'political', label: 'Political' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'supply', label: 'Supply' },
  { id: 'diplomacy', label: 'Diplomacy' },
];

function Legend({ mode }: { mode: MapMode }) {
  const key = (colour: string, text: string, cls = '') => (
    <li key={text}>
      <i style={{ background: colour }} className={cls} />
      {text}
    </li>
  );
  if (mode === 'political') return null;
  return (
    <ul className="mt-legend" aria-label="Map key">
      {mode === 'terrain' && (Object.keys(TERRAIN_COLOUR) as (keyof typeof TERRAIN_COLOUR)[]).map((t) => key(TERRAIN_COLOUR[t], t))}
      {mode === 'supply' && [key('rgb(40,58,88)', 'feeds few divisions'), key('rgb(98,128,162)', 'feeds many'), key('rgb(158,126,74)', 'overcrowded'), key('', 'cut off from your depots', 'hatch-cut')]}
      {mode === 'diplomacy' && [key('rgb(60,94,156)', 'you'), key('', 'at war with you', 'hatch-war'), key('rgb(39,45,60)', 'neutral')]}
    </ul>
  );
}

function ModeBar() {
  const mode = useGame((s) => s.mapMode);
  const setMapMode = useGame((s) => s.setMapMode);
  return (
    <div className="mt-modes">
      <div role="group" aria-label="Map mode">
        {MODES.map((m) => (
          <button key={m.id} aria-pressed={mode === m.id} onClick={() => setMapMode(m.id)}>
            {m.label}
          </button>
        ))}
        <button disabled title="Arrives in Stage G" aria-label="Air and sea: arrives in Stage G">
          Air and sea
        </button>
      </div>
      <Legend mode={mode} />
    </div>
  );
}

function Ticker() {
  const news = useGame((s) => s.news);
  const w = useGame((s) => s.world)!;
  const { select, focusOn } = useGame.getState();
  const latest = [...news].reverse().slice(0, 6);
  const pauseOnAttack = useGame((s) => s.pauseOnAttack);
  return (
    <footer className="mt-ticker">
      <span className="mt-ticker-h">News</span>
      <div role="log" aria-live="polite" aria-label="News">
        {latest.length ? (
          latest.map((n) => (
            <button
              key={n.id}
              className={n.tone}
              onClick={() => {
                if (n.open) select(n.open);
                if (n.province !== undefined) focusOn(n.province);
              }}
            >
              <small>{dateLabel({ startDate: w.startDate, day: n.day }).replace(/ \d{4}$/, '')}</small> {n.tone === 'good' ? '▲ ' : n.tone === 'bad' ? '▼ ' : ''}
              {n.text}
            </button>
          ))
        ) : (
          <span className="mt-quiet">
            {w.wars.length ? 'No news since you opened this game. ' : 'Europe is at peace. '}Click a country's name, or one of its provinces, to open its details and declare war. Then select your divisions and right-click where they should go.
          </span>
        )}
      </div>
      <button className="mt-toggle" aria-pressed={pauseOnAttack} onClick={() => useGame.getState().togglePauseOnAttack()} title="Stop the clock when an enemy attacks one of your provinces">
        Pause when attacked: {pauseOnAttack ? 'on' : 'off'}
      </button>
    </footer>
  );
}

function Defeat() {
  const w = useGame((s) => s.world)!;
  const { go } = useGame.getState();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="mt-defeat" role="alertdialog" aria-label="Your country has surrendered">
      <h2>{w.player} has surrendered</h2>
      <p>Your enemies hold more than 60% of your home victory points. Read the battle reports to see where it went wrong, then try again.</p>
      <div className="sb-actions">
        <button className="btn primary" onClick={() => go('title')} autoFocus>
          Main menu
        </button>
        <button className="btn" onClick={() => useGame.getState().select({ kind: 'reports' })}>
          Battle reports
        </button>
        <button className="btn" onClick={() => setOpen(false)}>
          Look at the map
        </button>
      </div>
    </div>
  );
}

export function MapTable() {
  const running = useGame((s) => s.running);
  const speed = useGame((s) => s.speed);
  const overlay = useGame((s) => s.overlay);
  const defeated = useGame((s) => s.defeated);
  const hasSelection = useGame((s) => !!s.selection);

  // The clock: one day per tick. It stops while a panel such as the codex is open.
  useEffect(() => {
    if (!running || overlay) return;
    const timer = setInterval(() => useGame.getState().tick(), SPEED_MS[speed - 1]);
    return () => clearInterval(timer);
  }, [running, speed, overlay]);

  useEffect(() => {
    (document.querySelector('.mt-map') as HTMLElement | null)?.focus();
  }, []);

  return (
    <div className={`mt${hasSelection ? ' has-sidebar' : ''}`}>
      <MapView />
      <div className="mt-vignette" aria-hidden="true" />
      <TopBar />
      <Rail />
      <ModeBar />
      <Sidebar />
      <Ticker />
      {defeated && <Defeat />}
    </div>
  );
}
