import { useEffect } from 'react';
import { onMenu, setZoom } from '../native';
import { readSave } from '../save/storage';
import { MapTable } from './screens/MapTable';
import { Codex, Help, Saves } from './screens/Overlays';
import { EndReport } from './screens/StoryPanels';
import { Setup } from './screens/Setup';
import { Lessons } from './screens/Lessons';
import { Settings } from './screens/Settings';
import { Title } from './screens/Title';
import { sound } from './audio/sound';
import { useGame } from './store';
import { cannotUpdate, checkForUpdates } from './updates';
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
        if (g.screen === 'setup' || g.screen === 'lessons') return g.go('title');
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
        if (k === 'l') g.go('lessons');
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
      if (k === 'c') return g.select({ kind: 'chronicle' });
      if (k === 'o') return g.setOverlay('report');
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

/** Put the settings into effect: loudness, size of everything, motion. */
function useSettings() {
  const { volume, textSize, reduceMotion } = useGame((s) => s.settings);
  useEffect(() => sound.setVolume(volume), [volume]);
  useEffect(() => {
    void setZoom(textSize);
  }, [textSize]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);
}

/** The Mac app: the Black Swan menu, and a quiet look for a new version at start. */
function useApp() {
  useEffect(() => {
    onMenu((id) => {
      const g = useGame.getState();
      if (id === 'settings') g.setOverlay('settings');
      if (id === 'check-updates') {
        g.setOverlay('settings');
        void checkForUpdates(false);
      }
    });
    if (cannotUpdate() || !useGame.getState().settings.checkUpdates) return;
    const t = setTimeout(() => void checkForUpdates(true), 4000);
    return () => clearTimeout(t);
  }, []);
}

export function App() {
  useShortcuts();
  useSettings();
  useApp();
  const { screen, overlay } = useGame();
  return (
    <>
      {screen === 'title' && <Title />}
      {screen === 'setup' && <Setup />}
      {screen === 'lessons' && <Lessons />}
      {screen === 'game' && <MapTable />}
      {overlay === 'codex' && <Codex />}
      {overlay === 'saves' && <Saves />}
      {overlay === 'help' && <Help />}
      {overlay === 'report' && <EndReport />}
      {overlay === 'settings' && <Settings />}
    </>
  );
}
