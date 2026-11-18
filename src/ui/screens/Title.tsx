import { APP_VERSION } from '../../native';
import { readSave, SLOTS } from '../../save/storage';
import { lessonsDone } from '../lessonProgress';
import { useGame } from '../store';
import { dismissJustUpdated, installUpdate, snoozeUpdate, useUpdates } from '../updates';
import { Notes, saveBeforeUpdate, updateLine } from './Settings';
import './screens.css';

/** A new version is ready, is downloading, or has just been installed. */
function UpdateCard() {
  const { status, snoozed, justUpdated } = useUpdates();
  if (justUpdated) {
    return (
      <aside className="update-card glass rise" aria-label="What is new">
        <span className="update-kicker">Updated to version {justUpdated.version}</span>
        <Notes text={justUpdated.notes} />
        <div className="update-actions">
          <button className="btn" onClick={dismissJustUpdated}>
            Got it
          </button>
        </div>
      </aside>
    );
  }
  if (snoozed || (status.kind !== 'available' && status.kind !== 'downloading' && status.kind !== 'restarting')) return null;
  return (
    <aside className="update-card glass rise" aria-label="Update">
      <span className="update-kicker">{status.kind === 'available' ? `Version ${status.version} is ready` : 'Updating'}</span>
      {status.kind === 'available' ? <Notes text={status.notes} /> : <p role="status">{updateLine(status)}</p>}
      {status.kind === 'downloading' && <progress className="set-progress" max={status.total ?? undefined} value={status.total ? status.got : undefined} aria-label="Download progress" />}
      {status.kind === 'available' && (
        <div className="update-actions">
          <button className="btn primary" onClick={() => void installUpdate(saveBeforeUpdate)}>
            Update and restart
          </button>
          <button className="btn" onClick={snoozeUpdate}>
            Later
          </button>
        </div>
      )}
    </aside>
  );
}

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
        <p className="tagline">Lead a real country through the 1930s and the war that followed. Command its armies, run its factories and its money, win allies, and face the choices its leaders faced.</p>
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
          <button className="btn" onClick={() => setOverlay('settings')}>
            Settings
          </button>
        </div>
        <p className="fine">Real countries and real history as the starting point. What happens next is up to you.</p>
      </div>
      <UpdateCard />
      <span className="title-version">Version {APP_VERSION}</span>
    </main>
  );
}
