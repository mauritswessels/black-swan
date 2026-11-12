/** Codex, save/load and keyboard help, shown on top of any screen. */
import { useState } from 'react';
import { GLOSSARY } from '../../content/glossary';
import { readSave, SLOTS, type Slot } from '../../save/storage';
import { useGame } from '../store';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const close = () => useGame.getState().setOverlay(null);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
      <div className="glass overlay-box rise" onClick={(e) => e.stopPropagation()}>
        <h2 className="h4">
          {title}
          <button className="btn" onClick={close} aria-label="Close">
            Close <kbd>Esc</kbd>
          </button>
        </h2>
        {children}
      </div>
    </div>
  );
}

export function Codex() {
  const [q, setQ] = useState('');
  const terms = GLOSSARY.filter((t) => (t.term + t.definition).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.term.localeCompare(b.term));
  return (
    <Shell title={`Codex · ${GLOSSARY.length} terms`}>
      <input className="search" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus aria-label="Search the codex" />
      <dl className="codex">
        {terms.map((t) => (
          <div key={t.id}>
            <dt>
              {t.term} {t.ap && <span className="tag first">AP Macro</span>}
            </dt>
            <dd>
              {t.definition}
              <i>{t.why}</i>
            </dd>
          </div>
        ))}
      </dl>
    </Shell>
  );
}

export function Saves() {
  const { world, save, load, screen } = useGame();
  const [msg, setMsg] = useState('');
  const label = (slot: Slot) => (slot === 'auto' ? 'Autosave' : `Slot ${slot}`);
  return (
    <Shell title="Save and load">
      <ul className="slots">
        {SLOTS.map((slot) => {
          const f = readSave(slot);
          return (
            <li key={slot}>
              <div>
                <b>{label(slot)}</b>
                <div className="muted">
                  {f ? `${f.summary} · saved ${new Date(f.savedAt).toLocaleString('en-GB')}` : 'Empty'}
                </div>
              </div>
              <div className="slot-actions">
                {world && screen === 'game' && slot !== 'auto' && (
                  <button className="btn" onClick={() => setMsg(save(slot) ? `Saved to ${label(slot)}.` : 'Saving failed: storage is blocked.')}>
                    Save here
                  </button>
                )}
                {f && (
                  <button className="btn" onClick={() => load(slot)}>
                    Load
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="muted" role="status">
        {msg || 'Saves stay on this computer. The game also autosaves when you start.'}
      </p>
    </Shell>
  );
}

export function Help() {
  const keys: [string, string][] = [
    ['N', 'New Story game (from the title screen)'],
    ['F', 'New Free-for-all game (from the title screen)'],
    ['C', 'Continue from the autosave (from the title screen)'],
    ['X', 'Codex'],
    ['S', 'Save and load'],
    ['M', 'Sound on or off'],
    ['?', 'This help'],
    ['Esc', 'Close a panel'],
  ];
  return (
    <Shell title="Keyboard shortcuts">
      <table className="keys">
        <tbody>
          {keys.map(([k, v]) => (
            <tr key={k}>
              <td>
                <kbd>{k}</kbd>
              </td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
