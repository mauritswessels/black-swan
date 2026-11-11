import { useEffect } from 'react';
import { readSave } from '../save/storage';
import { GUIDANCE, WarRoom } from './screens/WarRoom';
import { DataRoom } from './screens/DataRoom';
import { Intro } from './screens/Intro';
import { Codex, Help, Saves } from './screens/Overlays';
import { Reaction } from './screens/Reaction';
import { Report } from './screens/Report';
import { Title } from './screens/Title';
import { quarterLabel, useGame } from './store';
import './screens/screens.css';

const FX_STEPS = [0, 2, 5];

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
        if (k === 'n') g.go('intro');
        if (k === 'c' && readSave('auto')?.decisions.length) g.load('auto');
        return;
      }
      if (g.screen === 'intro' && k === 'enter') return g.startGame();
      if (g.screen !== 'game') return;
      if (k === 's') return g.setOverlay('saves');
      if (g.phase === 'reaction') {
        if (k === 'enter') {
          e.preventDefault();
          g.continueQuarter();
        }
        return;
      }
      if (k === 'w') return g.setView('war');
      if (k === 'd') return g.setView('data');
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        return g.bumpRate(1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        return g.bumpRate(-1);
      }
      if (['1', '2', '3', '4'].includes(k)) return g.setGuidance(GUIDANCE[Number(k) - 1].id);
      if (k === 'f') return g.setFx(FX_STEPS[(FX_STEPS.indexOf(g.draft.fxPurchases) + 1) % FX_STEPS.length]);
      if (k === 'enter' && el.tagName !== 'BUTTON') {
        e.preventDefault();
        g.seal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function GameHeader() {
  const { game, view, setView, setOverlay, muted, toggleMute } = useGame();
  const s = game!;
  return (
    <header className="game-head">
      <div className="hl">
        <span className="rec" aria-hidden="true" />
        Meeting {Math.min(s.t + 1, s.settings.quarters)} of {s.settings.quarters} · {quarterLabel(s.t)}
      </div>
      <div className="hc">
        <small>Kestrian National Bank</small>
        Monetary Policy Committee
      </div>
      <nav className="hr" aria-label="Screens">
        <button className={`navb ${view === 'war' ? 'on' : ''}`} onClick={() => setView('war')} aria-pressed={view === 'war'}>
          War Room <kbd>W</kbd>
        </button>
        <button className={`navb ${view === 'data' ? 'on' : ''}`} onClick={() => setView('data')} aria-pressed={view === 'data'}>
          Data Room <kbd>D</kbd>
        </button>
        <button className="navb" onClick={() => setOverlay('codex')}>
          Codex <kbd>X</kbd>
        </button>
        <button className="navb" onClick={() => setOverlay('saves')}>
          Save <kbd>S</kbd>
        </button>
        <button className="navb" onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? 'Sound is off' : 'Sound is on'}>
          {muted ? 'Sound off' : 'Sound on'} <kbd>M</kbd>
        </button>
        <button className="navb" onClick={() => setOverlay('help')} aria-label="Keyboard shortcuts">
          ?
        </button>
      </nav>
    </header>
  );
}

export function App() {
  useShortcuts();
  const { screen, view, phase, overlay } = useGame();
  return (
    <>
      {screen === 'title' && <Title />}
      {screen === 'intro' && <Intro />}
      {screen === 'game' && (
        <div className="game">
          <GameHeader />
          {view === 'war' ? <WarRoom /> : <DataRoom />}
          {phase === 'reaction' && <Reaction />}
        </div>
      )}
      {screen === 'report' && <Report />}
      {overlay === 'codex' && <Codex />}
      {overlay === 'saves' && <Saves />}
      {overlay === 'help' && <Help />}
    </>
  );
}
