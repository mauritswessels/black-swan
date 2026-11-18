/** Settings: sound, the clock, help, display, updates, saves, and what this version is. */
import { useEffect, useState } from 'react';
import { APP_VERSION, inApp } from '../../native';
import { saveProblem, savesAreFiles, savesFolder, showSavesFolder } from '../../save/storage';
import { saveTipState, tipState } from '../lessonProgress';
import { plainNotes } from '../releaseNotes';
import { TEXT_SIZES } from '../settings';
import { sound } from '../audio/sound';
import { useGame } from '../store';
import { cannotUpdate, checkForUpdates, installUpdate, useUpdates, type UpdateStatus } from '../updates';
import { Shell } from './Overlays';

function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <i aria-hidden="true" />
      {on ? 'On' : 'Off'}
    </button>
  );
}

function Row({ title, why, children }: { title: string; why?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <div>
        <b>{title}</b>
        {why && <span>{why}</span>}
      </div>
      <div className="set-control">{children}</div>
    </div>
  );
}

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

/** One line on where updates stand. */
export function updateLine(s: UpdateStatus): string {
  switch (s.kind) {
    case 'idle':
      return '';
    case 'checking':
      return 'Looking for a new version…';
    case 'current':
      return `You have the newest version. Checked at ${new Date(s.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`;
    case 'available':
      return `Version ${s.version} is ready to install.`;
    case 'downloading':
      return `Downloading version ${s.version}: ${s.total ? `${Math.round((s.got / s.total) * 100)}% of ${mb(s.total)}` : mb(s.got)}…`;
    case 'restarting':
      return `Version ${s.version} is installed. Black Swan is restarting…`;
    case 'error':
      return s.message;
  }
}

/** Save the game in progress before the app restarts for an update. */
export function saveBeforeUpdate(): void {
  const g = useGame.getState();
  if (g.screen === 'game' && g.world && !g.world.story.lesson) g.save('auto');
}

function Updates() {
  const status = useUpdates((s) => s.status);
  const checkUpdates = useGame((s) => s.settings.checkUpdates);
  const setSetting = useGame((s) => s.setSetting);
  const why = cannotUpdate();
  const busy = status.kind === 'checking' || status.kind === 'downloading' || status.kind === 'restarting';
  return (
    <section className="set-group" aria-labelledby="set-updates">
      <h3 id="set-updates">Updates</h3>
      <Row title={`Version ${APP_VERSION}`} why={why || 'New versions come from GitHub. Nothing is installed until you press Update.'}>
        <button className="btn" onClick={() => void checkForUpdates(false)} disabled={!!why || busy}>
          Check now
        </button>
      </Row>
      {!why && (
        <Row title="Check when the app starts" why="Looks once, quietly, a few seconds after you open Black Swan.">
          <Switch on={checkUpdates} onChange={(v) => setSetting('checkUpdates', v)} label="Check for updates when the app starts" />
        </Row>
      )}
      {status.kind === 'downloading' && <progress className="set-progress" max={status.total ?? undefined} value={status.total ? status.got : undefined} aria-label="Download progress" />}
      <p className={`set-status${status.kind === 'error' ? ' warn' : ''}`} role="status">
        {updateLine(status)}
      </p>
      {status.kind === 'available' && (
        <div className="set-update">
          <Notes text={status.notes} />
          <button className="btn primary" onClick={() => void installUpdate(saveBeforeUpdate)}>
            Update and restart
          </button>
          <span className="muted">Your game in progress is saved first.</span>
        </div>
      )}
    </section>
  );
}

/** Release notes as short paragraphs and bullets. */
export function Notes({ text }: { text: string }) {
  const lines = plainNotes(text);
  if (!lines.length) return null;
  return (
    <div className="notes">
      {lines.map((l, i) => (l.kind === 'li' ? <p key={i} className="li">{l.text}</p> : <p key={i}>{l.text}</p>))}
    </div>
  );
}

function Saves() {
  const [folder, setFolder] = useState<string | null>(null);
  useEffect(() => {
    void savesFolder().then(setFolder);
  }, []);
  const problem = saveProblem();
  return (
    <section className="set-group" aria-labelledby="set-saves">
      <h3 id="set-saves">Saves</h3>
      {savesAreFiles() ? (
        <Row title="Save files" why={<>Each slot is a file you can copy to another Mac: <code>{folder ?? '…'}</code></>}>
          <button className="btn" onClick={showSavesFolder}>
            Show in Finder
          </button>
        </Row>
      ) : (
        <Row title="Saves" why={inApp() ? 'Saves are kept inside the app.' : 'In a browser, saves are kept by this browser on this computer.'}>
          <span className="muted">4 slots</span>
        </Row>
      )}
      {problem && <p className="set-status warn">{problem}</p>}
    </section>
  );
}

export function Settings() {
  const { settings, setSetting, muted, toggleMute, pauseOnAttack, togglePauseOnAttack, pauseOnCard, togglePauseOnCard } = useGame();
  const [tips, setTips] = useState(tipState);
  const saveTips = (t: typeof tips) => {
    saveTipState(t);
    setTips(t);
  };
  const app = inApp();
  return (
    <Shell title="Settings">
      <div className="settings">
        <section className="set-group" aria-labelledby="set-sound">
          <h3 id="set-sound">Sound</h3>
          <Row title="Sound" why="The hum of the map room, clicks and alarms. Key M.">
            <Switch on={!muted} onChange={toggleMute} label="Sound" />
          </Row>
          <Row title="Volume">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(settings.volume * 100)}
              disabled={muted}
              aria-label="Volume"
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setSetting('volume', v);
                sound.setVolume(v);
              }}
              onPointerUp={() => sound.click()}
              onKeyUp={() => sound.click()}
            />
            <span className="set-value">{Math.round(settings.volume * 100)}%</span>
          </Row>
        </section>

        <section className="set-group" aria-labelledby="set-clock">
          <h3 id="set-clock">The clock</h3>
          <Row title="Pause when attacked" why="Stop the clock when an enemy attacks one of your provinces.">
            <Switch on={pauseOnAttack} onChange={togglePauseOnAttack} label="Pause when attacked" />
          </Row>
          <Row title="Pause for history cards" why="Stop the clock when a new history card arrives in Story mode.">
            <Switch on={pauseOnCard} onChange={togglePauseOnCard} label="Pause for history cards" />
          </Row>
        </section>

        <section className="set-group" aria-labelledby="set-help">
          <h3 id="set-help">Help</h3>
          <Row title="Advisor tips" why="A short note the first time you open each panel in a game.">
            <Switch on={tips.on} onChange={(on) => saveTips({ ...tips, on })} label="Advisor tips" />
          </Row>
          <Row title="Keyboard shortcuts" why="Every key in the game. Key ? at any time.">
            <button className="btn" onClick={() => useGame.getState().setOverlay('help')}>
              Show keys
            </button>
          </Row>
          {tips.seen.length > 0 && (
            <Row title="Tips you have read" why={`${tips.seen.length} so far. Show them all again from the start.`}>
              <button className="btn" onClick={() => saveTips({ on: true, seen: [] })}>
                Show again
              </button>
            </Row>
          )}
        </section>

        <section className="set-group" aria-labelledby="set-display">
          <h3 id="set-display">Display</h3>
          <Row title="Size of text and buttons" why={app ? 'Makes everything in the window bigger or smaller.' : 'In a browser, use ⌘ + and ⌘ − instead.'}>
            <div className="seg" role="group" aria-label="Size of text and buttons">
              {TEXT_SIZES.map((t) => (
                <button key={t.value} aria-pressed={settings.textSize === t.value} disabled={!app} onClick={() => setSetting('textSize', t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </Row>
          <Row title="Reduce motion" why="No moving or fading effects. Black Swan also follows Reduce motion in the Mac's Accessibility settings.">
            <Switch on={settings.reduceMotion} onChange={(v) => setSetting('reduceMotion', v)} label="Reduce motion" />
          </Row>
        </section>

        <Updates />
        <Saves />

        <section className="set-group" aria-labelledby="set-about">
          <h3 id="set-about">About</h3>
          <p className="muted">
            Black Swan {APP_VERSION}. A grand-strategy game set in Europe from 1936, built to teach the history and the economics as you play. Map from Natural Earth (public domain); type is Barlow (SIL Open Font License); every sound is made in code. Source: github.com/mauritswessels/black-swan.
          </p>
        </section>
      </div>
    </Shell>
  );
}
