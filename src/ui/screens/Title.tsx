import { readSave, SLOTS } from '../../save/storage';
import { lessonsDone } from '../lessonProgress';
import { useGame } from '../store';
import './screens.css';

export function Title() {
  const { chooseMode, load, setOverlay, go } = useGame();
  const auto = readSave('auto');
  const anySave = SLOTS.some((s) => readSave(s));
  // Someone new: the lessons come first.
  const newcomer = !anySave && lessonsDone().length === 0;
  return (
    <main className="title-screen">
      <div className="title-glow" aria-hidden="true" />
      <div className="title-inner rise">
        <div className="eyebrow">Europe · 1936</div>
        <h1>
          Black <span>Swan</span>
        </h1>
        <p className="tagline">Lead a country through the 1930s and the war that followed. Command its armies on the map table: select divisions, march, attack and read why each battle went the way it did.</p>
        <div className="title-actions">
          {newcomer && (
            <button className="btn primary" onClick={() => go('lessons')} autoFocus>
              Learn to play <kbd>L</kbd>
            </button>
          )}
          <button className={`btn${newcomer ? '' : ' primary'}`} onClick={() => chooseMode('story')} autoFocus={!newcomer}>
            Story <kbd>N</kbd>
          </button>
          <button className="btn" onClick={() => chooseMode('freeForAll')}>
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
          {!newcomer && (
            <button className="btn" onClick={() => go('lessons')}>
              Learn to play <kbd>L</kbd>
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
