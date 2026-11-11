/** After the decision: the next morning's front page, and the markets' instant reaction. */
import { eventById } from '../../sim/events';
import { quarterLabel, useGame } from '../store';

const f2 = (x: number) => x.toFixed(2);
const signed = (x: number, d = 2) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${Math.abs(x).toFixed(d)}`;

export function Reaction() {
  const { game, before, headlines, continueQuarter } = useGame();
  if (!game || !before) return null;
  const q = game.history[game.history.length - 1];
  const p = before.history[before.history.length - 1];
  const change = q.policyRate - p.policyRate;
  const event = q.events.map((id) => eventById(id)).find(Boolean);
  const decisionLine =
    change > 0 ? `Bank raises rates to ${f2(q.policyRate)}%` : change < 0 ? `Bank cuts rates to ${f2(q.policyRate)}%` : `Bank holds rates at ${f2(q.policyRate)}%`;
  const lead = event ? event.title : decisionLine;
  const others = headlines.filter((h) => h.text !== event?.title);
  const surprise = Math.abs(q.surprise) >= 0.2 ? (q.surprise > 0 ? 'a hawkish surprise' : 'a dovish surprise') : 'in line with expectations';

  return (
    <div className="reaction" role="dialog" aria-modal="true" aria-labelledby="fp-lead">
      <article className="frontpage rise">
        <header className="mast">
          <span>{quarterLabel(q.t)}</span>
          <span className="mast-title">The Valden Ledger</span>
          <span>Price 3.50 thalers</span>
        </header>
        <div className="fp-body">
          <div className="fp-main">
            <div className="kick">{event ? `Breaking · ${event.kind} shock` : 'Monetary policy'}</div>
            <h1 id="fp-lead">{lead}</h1>
            {event ? (
              <p className="deck">
                {event.lesson} Meanwhile: {decisionLine.toLowerCase()}, {surprise}.
              </p>
            ) : (
              <p className="deck">The decision came {surprise}. Here is how markets, politicians and the public reacted.</p>
            )}
            <ul className="fp-list">
              {others.map((h, k) => (
                <li key={k}>
                  <b>{h.source}.</b> {h.text}
                </li>
              ))}
            </ul>
          </div>
          <aside className="fp-markets" aria-label="Market reaction">
            <h3>Markets at the close</h3>
            <table>
              <tbody>
                <tr><td>Policy rate</td><td>{f2(q.policyRate)}%</td><td>{signed(change)}</td></tr>
                <tr><td>2-year yield</td><td>{f2(q.yield2)}%</td><td>{signed(q.yield2 - p.yield2)}</td></tr>
                <tr><td>10-year yield</td><td>{f2(q.yield10)}%</td><td>{signed(q.yield10 - p.yield10)}</td></tr>
                <tr><td>KST per aurel</td><td>{q.kstPerAurel.toFixed(3)}</td><td>{signed(q.kstPerAurel - p.kstPerAurel, 3)}</td></tr>
                <tr><td>Mortgage, 5-year</td><td>{f2(q.mortgageRate)}%</td><td>{signed(q.mortgageRate - p.mortgageRate)}</td></tr>
              </tbody>
            </table>
            <p className="note">
              Markets react at once. The real economy takes much longer: spending responds over the next 2 to 6 quarters, inflation over 4 to 8.
            </p>
          </aside>
        </div>
        <footer className="fp-foot">
          <button className="btn primary" onClick={continueQuarter} autoFocus>
            {game.gameOver || game.t >= game.settings.quarters ? 'See your report' : `Next quarter: ${quarterLabel(game.t)}`} <kbd>↵</kbd>
          </button>
        </footer>
      </article>
    </div>
  );
}
