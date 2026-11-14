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
        {msg || 'Saves stay on this computer. The game also autosaves on the first of each month and when you go back to the menu.'}
      </p>
    </Shell>
  );
}

export function Help() {
  const keys: [string, string][] = [
    ['Space', 'Pause or resume'],
    ['1 to 5', 'Game speed'],
    ['.', 'Advance one day while paused'],
    ['Click', 'Select your divisions, or open details of a province, country, foreign army or battle'],
    ['Shift-click', 'Add another of your counters to the selection'],
    ['Right-click', 'Send the selected divisions there (attack if the enemy is there). On a trackpad: two-finger click'],
    ['G', 'Move or attack: then click the destination, or type its name'],
    ['H', 'Halt the selected divisions'],
    ['Tab', 'Step through your armies (Shift+Tab goes back), while the map has the focus'],
    ['Arrows', 'Move the map'],
    ['+ and -', 'Zoom in and out (or scroll, or pinch)'],
    ['R', 'Battle reports'],
    ['P', 'Production: factories, new divisions, manpower'],
    ['E', 'Economy: budget, taxes, debt and inflation'],
    ['T', 'Research: technologies and research teams'],
    ['N', 'National plan'],
    ['W', 'Home front: stability and war support'],
    ['D', 'Diplomacy: allies, promises, war and peace'],
    ['F', 'Navy and air force: fleets, air wings, your trade by sea'],
    ['B', 'Selected divisions: go by sea (then click a coast)'],
    ['X', 'Codex'],
    ['S', 'Save and load'],
    ['M', 'Sound on or off'],
    ['?', 'This help'],
    ['Esc', 'Close a panel or the sidebar'],
    ['N / F / C', 'On the title screen: Story, Free-for-all, Continue'],
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
