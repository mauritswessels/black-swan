/** Story mode in the sidebar and at the end: the chronicle, history cards and the end report. */
import { CARDS, cardById, type CardKind } from '../../content/history';
import { CHAPTERS } from '../../sim/chapters';
import { report } from '../../sim/report';
import { dayOf, effectsOn, SCENARIO_END, VE_DAY } from '../../sim/story';
import type { World } from '../../sim/types';
import { dateLabel } from '../../sim/world';
import { useGame } from '../store';
import { Shell } from './Overlays';
import { Frame, Link, Row } from './Sidebar';

const KIND: Record<CardKind, string> = { event: 'What really happened', economy: 'What really happened · the economy', atrocity: 'What really happened · a crime of the time' };
const dateOf = (w: World, day: number) => dateLabel({ startDate: w.startDate, day });
const pct = (x: number) => `${x >= 1 ? '+' : ''}${Math.round((x - 1) * 100)}%`;

/** A mark that does not rely on colour: met, missed or still open. */
function Mark({ met }: { met: boolean | null }) {
  return (
    <i className={`st-mark ${met === null ? 'open' : met ? 'met' : 'missed'}`} aria-hidden="true">
      {met === null ? '○' : met ? '✓' : '✕'}
    </i>
  );
}
const said = (met: boolean | null) => (met === null ? 'not decided yet' : met ? 'met' : 'not met');

export function CardView({ w, id }: { w: World; id: string }) {
  const select = useGame((s) => s.select);
  const card = cardById(id);
  const filed = w.story.cards;
  const i = filed.findIndex((c) => c.id === id);
  if (!card || i < 0)
    return (
      <Frame kicker="History card" title="Not filed yet" sub="This card has not come up in your game.">
        <div className="sb-actions">
          <Link to={{ kind: 'chronicle' }}>Chronicle</Link>
        </div>
      </Frame>
    );
  const rec = filed[i];
  return (
    <aside className="sb wide st-card-side" aria-label="History card">
      <div className="sb-head">
        <span className="sb-kicker">
          History card {i + 1} of {filed.length}
        </span>
        <button className="mt-icon" onClick={() => select(null)} aria-label="Close sidebar">
          ×
        </button>
      </div>
      <article className={`st-card ${card.kind}`} role="status">
        <small>{KIND[card.kind]}</small>
        <time>{dateOf(w, rec.day)}</time>
        <h2>{card.title}</h2>
        <p>{card.text}</p>
        <h3>Why it mattered</h3>
        <p>{card.why}</p>
        {card.note && <p className="st-card-note">{card.note}</p>}
      </article>
      {card.kind === 'atrocity' ? (
        <p className="sb-note">{rec.inGame}</p>
      ) : (
        <div className="st-yours">
          <h3>In your game, on that day</h3>
          <p className="sb-note">{rec.inGame}</p>
        </div>
      )}
      <div className="st-nav">
        <button className="sb-btn" disabled={i === 0} onClick={() => select({ kind: 'card', id: filed[i - 1].id })}>
          ← Earlier
        </button>
        <button className="sb-btn" disabled={i === filed.length - 1} onClick={() => select({ kind: 'card', id: filed[i + 1].id })}>
          Later →
        </button>
      </div>
      <p className="sb-fine">History cards come up on their real dates, whatever has happened in your game. Press Space to carry on.</p>
      <div className="sb-actions">
        <Link to={{ kind: 'chronicle' }}>Chronicle: chapters and all cards</Link>
      </div>
    </aside>
  );
}

function Effects({ w, me }: { w: World; me: string }) {
  const effects = effectsOn(w, me);
  if (!effects.length) return null;
  return (
    <>
      <h3>Your army, for now</h3>
      <ul className="st-list">
        {effects.map((x) => (
          <li key={x.id}>
            <b>
              Attack {pct(x.attack)}, defence {pct(x.defence)}
            </b>{' '}
            until {dateOf(w, x.until)}: {x.why}.
          </li>
        ))}
      </ul>
    </>
  );
}

function Standings({ w, limit }: { w: World; limit?: number }) {
  const rows = report(w).scores.filter((r) => r.points > 0 || !r.out);
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <table className="st-table">
      <caption className="sr-only">Countries by the victory points of the land they hold</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Country</th>
          <th scope="col">Points</th>
          <th scope="col">Since 1936</th>
          <th scope="col">Divisions</th>
        </tr>
      </thead>
      <tbody>
        {shown.map((r, i) => (
          <tr key={r.country} className={r.country === w.player ? 'me' : ''}>
            <td>{i + 1}</td>
            <th scope="row">
              {r.country}
              {r.country === w.player ? ' (you)' : ''}
              {r.out ? ' · surrendered' : ''}
            </th>
            <td>{r.points}</td>
            <td>{r.change > 0 ? `+${r.change}` : r.change}</td>
            <td>{r.divisions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ChroniclePanel({ w }: { w: World }) {
  const { select, setOverlay, togglePauseOnCard } = useGame.getState();
  const pauseOnCard = useGame((s) => s.pauseOnCard);
  const me = w.player;
  const s = w.story;
  if (w.mode !== 'story') {
    const left = Math.max(0, s.endDay - w.day);
    return (
      <Frame wide kicker="Free-for-all" title="Standings" sub={left ? `The game ends on ${dateOf(w, s.endDay)} (${Math.ceil(left / 30)} months left)` : 'The ten years are over. You may play on.'}>
        <p className="sb-note">No treaties and no timetable: every country looks after itself. The strong attack weak neighbours when they see a chance, and the threatened look for allies. The winner is whoever holds the most victory points at the end.</p>
        <Standings w={w} limit={14} />
        {me && <Effects w={w} me={me} />}
        <div className="sb-actions">
          <button className="sb-btn on" onClick={() => setOverlay('report')}>
            Report so far (O)
          </button>
        </div>
      </Frame>
    );
  }
  const today = w.day;
  const current = CHAPTERS.find((c) => today <= dayOf(w.startDate, c.to) && !s.chapters.some((x) => x.id === c.id));
  const endsOn = s.start === '1939' ? SCENARIO_END : VE_DAY;
  return (
    <Frame wide kicker="Story" title="Chronicle" sub={s.start === '1939' ? `September 1939 scenario · ends on ${dateOf(w, dayOf(w.startDate, endsOn))}` : `The campaign runs to ${dateOf(w, dayOf(w.startDate, endsOn))} at the latest`}>
      {current && me && (
        <>
          <h3>Chapter: {current.title}</h3>
          <p className="sb-note">{current.about}</p>
          <p className="sb-fine">
            Checked on {dateOf(w, dayOf(w.startDate, current.to))}. These were roughly the aims of {me}'s real leaders. They are a guide, not orders: the game goes on either way.
          </p>
          <ul className="st-goals">
            {(current.objectives[me] ?? []).map((o) => {
              const now = !w.capitulated.includes(me) && o.test(w);
              return (
                <li key={o.text}>
                  <Mark met={now ? true : null} />
                  <span>
                    {o.text}
                    {o.hard ? ' (harder than history)' : ''}
                    <span className="sr-only">: {now ? 'true today' : 'not true today'}</span>
                  </span>
                  <em>{now ? 'true today' : 'not yet'}</em>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {me &&
        s.chapters.map((rec) => {
          const ch = CHAPTERS.find((c) => c.id === rec.id);
          if (!ch) return null;
          return (
            <div key={rec.id}>
              <h3>
                Closed: {ch.title} ({rec.met.filter(Boolean).length} of {rec.met.length})
              </h3>
              <ul className="st-goals">
                {(ch.objectives[me] ?? []).map((o, i) => (
                  <li key={o.text}>
                    <Mark met={!!rec.met[i]} />
                    <span>
                      {o.text}
                      <span className="sr-only">: {said(!!rec.met[i])}</span>
                    </span>
                    <em>{said(!!rec.met[i])}</em>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      {me && <Effects w={w} me={me} />}
      <h3>
        History cards · {s.cards.length} of {CARDS.length}
      </h3>
      <button className="mt-toggle st-toggle" aria-pressed={pauseOnCard} onClick={togglePauseOnCard}>
        Stop the clock for a new card: {pauseOnCard ? 'on' : 'off'}
      </button>
      {s.cards.length ? (
        <ul className="st-cards">
          {[...s.cards].reverse().map((c) => {
            const card = cardById(c.id);
            return card ? (
              <li key={c.id}>
                <button onClick={() => select({ kind: 'card', id: c.id })}>
                  <small>{dateOf(w, c.day)}</small>
                  <b>{card.title}</b>
                </button>
              </li>
            ) : null;
          })}
        </ul>
      ) : (
        <p className="sb-fine">The first card comes up on 7 March 1936.</p>
      )}
      <div className="sb-actions">
        <button className="sb-btn on" onClick={() => setOverlay('report')}>
          Report so far (O)
        </button>
      </div>
      <Row label="AI governments" value={s.history === 'loose' ? 'Keep loosely to history' : 'Keep closely to history'} />
    </Frame>
  );
}

export function EndReport() {
  const w = useGame((s) => s.world);
  const { setOverlay, go } = useGame.getState();
  if (!w) return null;
  const r = report(w);
  const story = r.mode === 'story';
  return (
    <Shell title={r.ended ? (story ? 'The end of the story' : 'The end of the game') : 'Report so far'}>
      <div className="st-report">
        <p className="st-verdict">{r.verdict}</p>
        <p className="muted">
          {r.ended ? `${r.ended.why} The game ended on ${r.ended.date}.` : `Today is ${dateLabel(w)}. The game is still going.`}
          {r.player ? ` You led ${r.player}.` : ''}
        </p>
        {story && (
          <>
            <h3>Your game beside the real history</h3>
            <table className="st-table">
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">In history</th>
                  <th scope="col">In your game</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((row) => (
                  <tr key={row.what} className={row.what === r.player ? 'me' : ''}>
                    <th scope="row">{row.what}</th>
                    <td>{row.real}</td>
                    <td>{row.game}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {r.chapters.length > 0 && (
          <>
            <h3>Chapters</h3>
            {r.chapters.map((ch) => (
              <div key={ch.title}>
                <h4>
                  {ch.title}
                  {ch.done ? ` · ${ch.objectives.filter((o) => o.met).length} of ${ch.objectives.length} met` : ' · not reached'}
                </h4>
                {ch.done && (
                  <ul className="st-goals">
                    {ch.objectives.map((o) => (
                      <li key={o.text}>
                        <Mark met={o.met} />
                        <span>
                          {o.text}
                          {o.hard ? ' (harder than history)' : ''}
                        </span>
                        <em>{said(o.met)}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
        {r.economy && (
          <>
            <h3>What it cost {r.player}</h3>
            <p>
              Debt of {r.economy.debt}m, prices rising {r.economy.inflation}% a year, stability {r.economy.stability} and war support {r.economy.support} out of 100.
            </p>
          </>
        )}
        {r.losses.length > 0 && (
          <>
            <h3>Losses in battle</h3>
            <p className="muted">In divisions' worth of men and equipment. Each division stands for roughly 15,000 soldiers.</p>
            <ul className="st-losses">
              {r.losses.map((x) => (
                <li key={x.country}>
                  <span>{x.country}</span>
                  <i aria-hidden="true">
                    <b style={{ width: `${(100 * x.lost) / r.losses[0].lost}%` }} />
                  </i>
                  <em>{x.lost}</em>
                </li>
              ))}
            </ul>
          </>
        )}
        <h3>{story ? 'Who holds what' : 'Final standings'}</h3>
        <Standings w={w} limit={story ? 8 : undefined} />
        {story && r.timeline.length > 0 && (
          <>
            <h3>Timeline</h3>
            <ul className="st-timeline">
              {r.timeline.map((t) => (
                <li key={t.id}>
                  <small>{t.date}</small>
                  <b>{t.title}</b>
                  <span>
                    {t.same ? 'As in history. ' : ''}
                    {t.inGame}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {story && <p className="muted">The real war in Europe lasted from 1 September 1939 to 8 May 1945 and killed around 40 million people there, most of them civilians. This game models armies, factories and treaties. It cannot model that.</p>}
        <div className="st-report-actions">
          <button className="btn primary" onClick={() => setOverlay(null)} autoFocus>
            {r.ended ? 'Keep playing' : 'Back to the map'}
          </button>
          <button className="btn" onClick={() => go('title')}>
            Main menu
          </button>
        </div>
      </div>
    </Shell>
  );
}
