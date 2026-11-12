/** Choose the country you will lead. Story mode offers the six major powers; Free-for-all offers everyone. */
import { COUNTRIES } from '../../sim/countries';
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

export function Setup() {
  const mode = useGame((s) => s.setupMode);
  const { startGame, go } = useGame.getState();
  const choices = COUNTRIES.filter((c) => (mode === 'story' ? c.major : c.startArmy[0] > 0));
  return (
    <main className="setup">
      <div className="setup-inner rise">
        <div className="eyebrow">{mode === 'story' ? 'Story' : 'Free-for-all'} · 1 January 1936</div>
        <h1>Choose your country</h1>
        <p className="muted">
          {mode === 'story'
            ? 'The history cards and chapters of Story mode arrive in Stage H. For now both modes play the same: an open map on which you command the army.'
            : 'Any country with an army. The six major powers are listed first.'}
        </p>
        <ul className="setup-list">
          {choices.map((c, i) => {
            const n = c.startArmy[0] + c.startArmy[1] + c.startArmy[2];
            const provinces = PROVINCES.filter((p) => p.owner === c.name).length;
            return (
              <li key={c.name}>
                <button onClick={() => startGame(mode, c.name)} autoFocus={i === 0}>
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
