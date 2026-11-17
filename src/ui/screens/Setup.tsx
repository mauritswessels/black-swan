/** Choose the country you will lead. Story mode offers the six major powers; Free-for-all offers everyone. */
import { useState } from 'react';
import { COUNTRIES } from '../../sim/countries';
import type { StartId } from '../../sim/types';
import { PROVINCES } from '../../sim/map';
import { countryColour } from '../map/colours';
import { useGame } from '../store';

const GOVERNMENT = { democracy: 'Democracy', authoritarian: 'Authoritarian', fascist: 'Fascist dictatorship', communist: 'Communist dictatorship' };
const NOTE: Record<string, string> = {
  France: 'The largest army in the west, and long borders to guard.',
  Germany: 'In the centre, with strong armour and neighbours on every side.',
  'United Kingdom': 'A small army on an island. Hard to reach, hard to strike from.',
  Italy: 'A big infantry army behind the Alps.',
  'Soviet Union': 'By far the most divisions, spread over huge distances.',
  Poland: 'Flat country between two great powers.',
};

const STARTS: { id: StartId; title: string; text: string }[] = [
  { id: '1936', title: '1 January 1936', text: 'The full campaign. Three and a half years of peace to rearm, make friends and decide how much to give, then the war if it comes. Runs to May 1945 at the latest.' },
  { id: '1939', title: '1 September 1939', text: 'The short scenario. Germany attacks Poland this morning. The world is the one the AI countries built since 1936 by following real history. Runs to January 1942.' },
];
const HISTORY: { id: 'close' | 'loose'; title: string; text: string }[] = [
  { id: 'close', title: 'Closely', text: 'Other governments act on the real dates unless you change the situation.' },
  { id: 'loose', title: 'Loosely', text: 'The same aims, but each may come months early or late. Decided by the seed of the game.' },
];

function Choice<T extends string>({ legend, options, value, onChange }: { legend: string; options: { id: T; title: string; text: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="setup-choice">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.id} className={value === o.id ? 'on' : ''}>
          <input type="radio" name={legend} checked={value === o.id} onChange={() => onChange(o.id)} />
          <b>{o.title}</b>
          <span>{o.text}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Setup() {
  const mode = useGame((s) => s.setupMode);
  const preparing = useGame((s) => s.preparing);
  const { startGame, go } = useGame.getState();
  const [start, setStart] = useState<StartId>('1936');
  const [history, setHistory] = useState<'close' | 'loose'>('close');
  const story = mode === 'story';
  const choices = COUNTRIES.filter((c) => (story ? c.major : c.startArmy[0] > 0));
  if (preparing !== null)
    return (
      <main className="setup">
        <div className="setup-inner rise setup-wait" role="status" aria-live="polite">
          <div className="eyebrow">{start === '1939' ? 'Playing out 1936 to 1939' : 'Setting up'}</div>
          <h1>{start === '1939' ? `${1936 + Math.min(3, Math.floor(preparing * 3.67))}` : 'One moment'}</h1>
          <progress max={1} value={preparing} aria-label="Preparing the game" />
          <p className="muted">{start === '1939' ? 'The AI countries are living through the Rhineland, Spain, Vienna, Munich and Prague, day by day, so that September 1939 is a world the game itself produced. This takes a few seconds.' : ''}</p>
        </div>
      </main>
    );
  return (
    <main className="setup">
      <div className="setup-inner rise">
        <div className="eyebrow">
          {story ? 'Story' : 'Free-for-all'} · {STARTS.find((x) => x.id === start)!.title}
        </div>
        <h1>Choose your country</h1>
        <p className="muted">
          {story
            ? 'The other countries follow their real history unless you change it. History cards tell you what really happened on each date, and three chapters give you the aims your country\'s real leaders had. You need a cause to declare war.'
            : 'Every treaty is torn up and there is no timetable. Any country with an army; you may attack anyone without a cause, at a price. AI countries attack weak neighbours and band together against strong ones. Most victory points after ten years wins.'}
        </p>
        <div className="setup-choices">
          <Choice legend="Start" options={STARTS} value={start} onChange={setStart} />
          {story && start === '1936' && <Choice legend="AI governments keep to history" options={HISTORY} value={history} onChange={setHistory} />}
        </div>
        <ul className="setup-list">
          {choices.map((c, i) => {
            const n = c.startArmy[0] + c.startArmy[1] + c.startArmy[2];
            const provinces = PROVINCES.filter((p) => p.owner === c.name).length;
            return (
              <li key={c.name}>
                <button onClick={() => startGame({ mode, start, player: c.name, history })} autoFocus={i === 0}>
                  <i style={{ background: countryColour(c.name) }} aria-hidden="true" />
                  <b>{c.name}</b>
                  <span>
                    {GOVERNMENT[c.government]} · {n} {n === 1 ? 'division' : 'divisions'} · {provinces} {provinces === 1 ? 'province' : 'provinces'}
                  </span>
                  {NOTE[c.name] && <em>{NOTE[c.name]}</em>}
                </button>
              </li>
            );
          })}
        </ul>
        <button className="btn" onClick={() => go('title')}>
          Back <kbd>Esc</kbd>
        </button>
      </div>
    </main>
  );
}
