/** Codex, save/load and keyboard help, shown on top of any screen. */
import { useEffect, useRef, useState } from 'react';
import { GLOSSARY, GROUPS, groupOf, type GroupId } from '../../content/glossary';
import { readSave, SLOTS, type Slot } from '../../save/storage';
import { useGame } from '../store';

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
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
  const first = useGame((s) => s.codexTerm);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<GroupId | 'all' | 'ap'>('all');
  const list = useRef<HTMLDListElement>(null);
  const words = q.toLowerCase();
  const terms = GLOSSARY.filter((t) => (group === 'all' || (group === 'ap' ? t.ap : groupOf(t) === group)) && (t.term + t.definition + t.why).toLowerCase().includes(words)).sort((a, b) => a.term.localeCompare(b.term));
  // Opened from a word on the screen: go straight to its entry.
  useEffect(() => {
    if (first) list.current?.querySelector(`[data-term="${first}"]`)?.scrollIntoView({ block: 'center' });
  }, [first]);
  return (
    <Shell title={`Codex · ${GLOSSARY.length} terms`}>
      <input className="search" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={!first} aria-label="Search the codex" />
      <div className="codex-groups" role="group" aria-label="Show terms about">
        {[{ id: 'all', name: 'All' }, ...GROUPS, { id: 'ap', name: 'AP Macro' }].map((g) => (
          <button key={g.id} aria-pressed={group === g.id} onClick={() => setGroup(g.id as typeof group)}>
            {g.name}
          </button>
        ))}
      </div>
      <dl className="codex" ref={list}>
        {terms.map((t) => (
          <div key={t.id} data-term={t.id} className={t.id === first ? 'picked' : ''}>
            <dt>
              {t.term} {t.ap && <span className="tag first">AP Macro</span>}
              {group === 'all' && <span className="codex-group">{GROUPS.find((g) => g.id === groupOf(t))?.name}</span>}
            </dt>
            <dd>
              {t.definition}
              <i>{t.why}</i>
            </dd>
          </div>
        ))}
        {!terms.length && <p className="muted">Nothing found. Try another word, or show all groups.</p>}
      </dl>
      <p className="muted codex-foot">New to the game? Learn to play (key L on the title screen) teaches all of this step by step on the map.</p>
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
                {world && screen === 'game' && slot !== 'auto' && !world.story.lesson && (
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
        {msg || (world?.story.lesson && screen === 'game' ? 'Lessons are not saved. You can load one of your own games here.' : '') || 'Saves stay on this computer. The game also autosaves on the first of each month and when you go back to the menu.'}
      </p>
    </Shell>
  );
}

export function Help() {
  const keys: [string, string][] = [
    ['Space', 'Pause or resume'],
    ['Shift + 1 to 5', 'Game speed'],
    ['.', 'Advance one day while paused'],
    ['Click', 'Select your divisions, or open details of a province, country, foreign army or battle'],
    ['Shift-click', 'Add another of your counters to the selection'],
    ['Shift-drag', 'Draw a box to select all your divisions inside it'],
    ['A', 'Form an army from the selected divisions (with none selected: your armies)'],
    ['1 to 9', 'Select an army; press again to look at it on the map'],
    ['Drag a flag', 'Give an army a new front: an enemy province to push, a border to hold, your own land to wait in reserve'],
    ['Right-click', 'Send the selected divisions there (attack if the enemy is there), or point the selected army there. On a trackpad: two-finger click'],
    ['G', 'Move or attack: then click the destination, or type its name'],
    ['H', 'Halt the selected divisions'],
    ['Tab', 'Step through your stacks of divisions (Shift+Tab goes back), while the map has the focus'],
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
    ['C', 'Chronicle: chapters, objectives and history cards (Standings in Free-for-all)'],
    ['O', 'Report: your game beside the real history'],
    ['V', 'War replay: the front week by week, in about a minute'],
    ['X', 'Codex'],
    ['S', 'Save and load'],
    ['M', 'Sound on or off'],
    ['⌘ ,', 'Settings (in the Mac app; or the Settings button)'],
    ['?', 'This help'],
    ['Esc', 'Close a panel or the sidebar'],
    ['N / F / C / L', 'On the title screen: Story, Free-for-all, Continue, Learn to play'],
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
