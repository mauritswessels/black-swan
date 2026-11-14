import { useEffect } from 'react';
import { readSave } from '../save/storage';
import { MapTable } from './screens/MapTable';
import { Codex, Help, Saves } from './screens/Overlays';
import { Setup } from './screens/Setup';
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
      const typing = el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA';
      if (k === 'escape') {
        if (g.overlay) return g.setOverlay(null);
        if (g.screen === 'setup') return g.go('title');
        if (g.screen === 'game') {
          if (g.ordering) g.setOrdering(false);
          else g.select(null);
          (document.querySelector('.mt-map') as HTMLElement | null)?.focus();
        }
        return;
      }
      if (typing) return;
      if (k === 'm') return g.toggleMute();
      if (k === 'x' || k === '?') {
        e.preventDefault(); // stop the key being typed into the codex search box
        const want = k === 'x' ? 'codex' : 'help';
        return g.setOverlay(g.overlay === want ? null : want);
      }
      if (g.overlay) return;
      if (g.screen === 'title') {
        if (k === 'n') g.chooseMode('story');
        if (k === 'f') g.chooseMode('freeForAll');
        if (k === 'c' && readSave('auto')) g.load('auto');
        return;
      }
      if (g.screen !== 'game') return;
      if (k === 's') return g.setOverlay('saves');
      if (k === ' ') {
        // Space on a focused button would also press it, so only the clock reacts.
        e.preventDefault();
        return g.setRunning(!g.running);
      }
      if (k >= '1' && k <= '5') return g.setSpeed(Number(k));
      if (k === '.' && !g.running) return g.tick();
      if (k === 'h') return g.halt();
      if (k === 'r') return g.select({ kind: 'reports' });
      if (k === 'p' && g.world?.player) return g.select({ kind: 'production' });
      if (k === 'e' && g.world?.player) return g.select({ kind: 'economy' });
      if (k === 't' && g.world?.player) return g.select({ kind: 'research' });
      if (k === 'n' && g.world?.player) return g.select({ kind: 'plans' });
      if (k === 'w' && g.world?.player) return g.select({ kind: 'politics' });
      if (k === 'd' && g.world?.player) return g.select({ kind: 'diplomacy' });
      if (k === 'f' && g.world?.player) return g.select({ kind: 'forces' });
      if (k === 'b' && g.selection?.kind === 'units') return g.setBySea(!g.bySea);
      if (k === 'g' && (g.selection?.kind === 'fleet' || g.selection?.kind === 'wings')) return g.setOrdering(!g.ordering);
      if (k === 'g' && g.selection?.kind === 'units') {
        e.preventDefault();
        g.setOrdering(true);
        (document.getElementById('goto') as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function App() {
  useShortcuts();
  const { screen, overlay } = useGame();
  return (
    <>
      {screen === 'title' && <Title />}
      {screen === 'setup' && <Setup />}
      {screen === 'game' && <MapTable />}
      {overlay === 'codex' && <Codex />}
      {overlay === 'saves' && <Saves />}
      {overlay === 'help' && <Help />}
    </>
  );
}
