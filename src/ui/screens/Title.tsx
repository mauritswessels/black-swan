import { readSave, SLOTS } from '../../save/storage';
import { useGame } from '../store';
import './screens.css';

export function Title() {
  const { startGame, load, setOverlay } = useGame();
  const auto = readSave('auto');
  const anySave = SLOTS.some((s) => readSave(s));
  return (
    <main className="title-screen">
      <div className="title-glow" aria-hidden="true" />
      <div className="title-inner rise">
        <div className="eyebrow">Europe · 1936</div>
        <h1>
          Black <span>Swan</span>
        </h1>
        <p className="tagline">Lead a country through the 1930s and the war that followed. Armies, factories, money, allies and public support are all yours to manage.</p>
        <div className="title-actions">
          <button className="btn primary" onClick={() => startGame('story')} autoFocus>
            Story <kbd>N</kbd>
          </button>
          <button className="btn" onClick={() => startGame('freeForAll')}>
            Free-for-all <kbd>F</kbd>
          </button>
          {auto && (
            <button className="btn" onClick={() => load('auto')}>
              Continue <kbd>C</kbd>
            </button>
          )}
          {anySave && (
            <button className="btn" onClick={() => setOverlay('saves')}>
              Load
            </button>
          )}
          <button className="btn" onClick={() => setOverlay('codex')}>
            Codex <kbd>X</kbd>
          </button>
        </div>
        <p className="fine">Real countries and real history as the starting point. What happens next is up to you.</p>
      </div>
    </main>
  );
}
