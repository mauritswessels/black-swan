import { useEffect } from 'react';
import { dateLabel } from '../sim/world';
import { readSave } from '../save/storage';
import { Codex, Help, Saves } from './screens/Overlays';
import { Title } from './screens/Title';
import { useGame } from './store';
import './screens/screens.css';

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      const g = useGame.getState();
      const k = e.key.toLowerCase();
      if (k === 'escape') return g.setOverlay(null);
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
      if (k === 'm') return g.toggleMute();
      if (k === 'x' || k === '?') {
        e.preventDefault(); // stop the key being typed into the codex search box
        const want = k === 'x' ? 'codex' : 'help';
        return g.setOverlay(g.overlay === want ? null : want);
      }
      if (g.overlay) return;
      if (g.screen === 'title') {
        if (k === 'n') g.startGame('story');
        if (k === 'f') g.startGame('freeForAll');
        if (k === 'c' && readSave('auto')) g.load('auto');
        return;
      }
      if (k === 's') return g.setOverlay('saves');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Stand-in for the map screen until Stage C. Shows that starting, saving and loading work. */
function Placeholder() {
  const { world, go, setOverlay, muted, toggleMute } = useGame();
  const w = world!;
  const stages: [string, boolean][] = [
    ['Stage 0: clean-up and Mac app shell', true],
    ['Stage A: Europe 1936 map data, countries, the daily clock', false],
    ['Stage B: land combat, supply and battle reports', false],
    ['Stage C: the map table screen', false],
  ];
  return (
    <div className="shell">
      <header className="shell-head">
        <div className="brand">Black Swan · {w.mode === 'story' ? 'Story' : 'Free-for-all'} · {dateLabel(w)}</div>
        <nav aria-label="Menu">
          <button className="btn" onClick={() => setOverlay('codex')}>
            Codex <kbd>X</kbd>
          </button>
          <button className="btn" onClick={() => setOverlay('saves')}>
            Save <kbd>S</kbd>
          </button>
          <button className="btn" onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? 'Sound is off' : 'Sound is on'}>
            {muted ? 'Sound off' : 'Sound on'} <kbd>M</kbd>
          </button>
          <button className="btn" onClick={() => go('title')}>
            Main menu
          </button>
        </nav>
      </header>
      <main className="shell-body">
        <div className="glass shell-card rise">
          <h2>The map table is being built</h2>
          <p className="muted">
            This is the empty shell of the war game. Starting a game, saving, loading, the codex and sound already work. The map
            arrives in Stage C.
          </p>
          <ol>
            {stages.map(([name, done]) => (
              <li key={name} className={done ? 'done' : undefined}>
                {name}
                {done ? ' (done)' : ''}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}

export function App() {
  useShortcuts();
  const { screen, overlay } = useGame();
  return (
    <>
      {screen === 'title' && <Title />}
      {screen === 'game' && <Placeholder />}
      {overlay === 'codex' && <Codex />}
      {overlay === 'saves' && <Saves />}
      {overlay === 'help' && <Help />}
    </>
  );
}
