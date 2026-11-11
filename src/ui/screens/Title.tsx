import { readSave, SLOTS } from '../../save/storage';
import { useGame } from '../store';
import './screens.css';

export function Title() {
  const { go, load, setOverlay } = useGame();
  const auto = readSave('auto');
  const anySave = SLOTS.some((s) => readSave(s));
  return (
    <main className="title-screen">
      <div className="title-glow" aria-hidden="true" />
      <div className="title-inner rise">
        <div className="eyebrow">Kestrian National Bank · Monetary Policy Committee</div>
        <h1>
          Black <span>Swan</span>
        </h1>
        <p className="tagline">Run the central bank of a small, rich, open economy. Set the rate. Choose your words. Survive the shocks.</p>
        <div className="title-actions">
          <button className="btn primary" onClick={() => go('intro')} autoFocus>
            New term <kbd>N</kbd>
          </button>
          {auto && auto.decisions.length > 0 && (
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
        <p className="fine">A fictional country and bank. The economics is real, simplified, and explained as you play.</p>
      </div>
    </main>
  );
}
