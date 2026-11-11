/** End-of-term report card. */
import { useMemo } from 'react';
import { buildReport } from '../../sim/report';
import { Chart } from '../components/Chart';
import { quarterLabel, useGame } from '../store';

export function Report() {
  const { game, go } = useGame();
  const r = useMemo(() => buildReport(game!), [game]);
  const beat = r.score - r.taylorScore;
  return (
    <main className="report">
      <div className="report-inner rise">
        <div className="eyebrow">{r.gameOver ? 'Term ended early' : 'End of term'} · Kestrian National Bank</div>
        <h1>{r.gameOver ? 'Your term is over' : 'Five years at the helm'}</h1>
        <div className="report-top">
          <div className="glass big-grade">
            <span className="grade" aria-label={`Grade ${r.grade}`}>{r.grade}</span>
            <div>
              <div className="label">Term score</div>
              <div className="score">{r.score.toFixed(1)}</div>
              <div className="muted">
                Taylor rule on the same luck: {r.taylorScore.toFixed(1)} ({beat >= 0 ? 'you beat it by' : 'it beat you by'} {Math.abs(beat).toFixed(1)})
              </div>
            </div>
          </div>
          <div className="glass grades">
            {r.grades.map((g) => (
              <div key={g.label} className="grade-row">
                <span className="grade small">{g.grade}</span>
                <div>
                  <b>{g.label}</b>
                  <div className="muted">{g.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="report-mid">
          <div className="glass">
            <h2 className="h4">
              Points per quarter <small>100 = perfect</small>
            </h2>
            <div style={{ height: 160 }}>
              <Chart title="Points per quarter" n={r.points.length} min={0} max={100} ticks={[0, 50, 100]} series={[{ data: r.points, color: 'var(--gold)', dot: true }]} />
            </div>
          </div>
          <div className="glass">
            <h2 className="h4">What went right and wrong</h2>
            <ul className="wl">
              {r.wentWell.map((t) => (
                <li key={t} className="good">
                  <span aria-hidden="true">✓</span> {t}
                </li>
              ))}
              {r.wentBadly.map((t) => (
                <li key={t} className="bad">
                  <span aria-hidden="true">✗</span> {t}
                </li>
              ))}
              {r.wentWell.length + r.wentBadly.length === 0 && <li>A steady, unremarkable term. Central bankers consider that a compliment.</li>}
            </ul>
          </div>
        </div>
        <div className="glass">
          <h2 className="h4">
            Timeline <small>{r.quartersPlayed} quarters</small>
          </h2>
          <ol className="timeline">
            {r.timeline.map((it, k) => (
              <li key={k} className={it.kind}>
                <span className="when">{quarterLabel(it.t)}</span>
                <span>{it.text}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="report-actions">
          <button className="btn primary" onClick={() => go('intro')}>
            New term
          </button>
          <button className="btn" onClick={() => go('title')}>
            Title screen
          </button>
        </div>
      </div>
    </main>
  );
}
