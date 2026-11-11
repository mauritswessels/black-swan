import { useMemo } from 'react';
import { committeeAdvice, committeeMedian } from '../../sim/committee';
import { releases } from '../../sim/data';
import { staffForecast } from '../../sim/forecast';
import { targetFor } from '../../sim/targets';
import type { Guidance } from '../../sim/types';
import { Chart } from '../components/Chart';
import { Gauge, Meter, Portrait, Term, Ticker } from '../components/bits';
import { quarterLabel, useGame } from '../store';

export const GUIDANCE: { id: Guidance; text: string; term: string }[] = [
  { id: 'dataDependent', text: 'We are data-dependent and will act as needed.', term: 'Safe. Moves markets little.' },
  { id: 'extended', text: 'Rates will stay at this level for an extended period.', term: 'A promise: breaking it within a year costs credibility.' },
  { id: 'readyToAct', text: 'We stand ready to act against inflation.', term: 'Hawkish. Pushes up bond yields. Cutting next quarter costs credibility.' },
  { id: 'fxReady', text: 'We are prepared to intervene in the currency market.', term: 'Calms a soaring thaler, more so with high credibility.' },
];
const FX_STEPS = [0, 2, 5];

const signed = (x: number, d = 1) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${Math.abs(x).toFixed(d)}`;

export function WarRoom() {
  const { game, draft, bumpRate, setGuidance, setFx, seal, speaker, setSpeaker, chains, headlines } = useGame();
  const s = game!;
  const tgt = targetFor(s.settings.targetMode);
  const rel = useMemo(() => releases(s), [s]);
  const forecast = useMemo(() => staffForecast(s), [s]);
  const advice = useMemo(() => committeeAdvice(s), [s]);
  const now = rel[rel.length - 1];
  const before = rel[rel.length - 2];
  const q = s.history[s.history.length - 1];
  const prevQ = s.history[s.history.length - 2];
  const median = committeeMedian(advice);
  const change = draft.rate - q.policyRate;
  const talker = advice.find((a) => a.member.id === speaker) ?? advice[2];

  // Fan chart: last 12 quarters of published data, then 8 quarters of forecast.
  const histN = Math.min(12, rel.length);
  const hist = rel.slice(-histN);
  const lead = histN - hist.length; // early in the game there is less history than slots
  const past = (f: (r: (typeof hist)[number]) => number) => [...Array<null>(lead).fill(null), ...hist.map(f)];
  const n = histN + forecast.horizon;
  const join = (arr: number[], first: number) => [first, ...arr];
  const fanFrom = histN - 1;
  const xLabels = hist
    .map((r, k) => ({ i: lead + k, t: r.t }))
    .concat(Array.from({ length: forecast.horizon }, (_, k) => ({ i: histN + k, t: s.t + k })))
    .filter((p) => ((p.t % 4) + 4) % 4 === 0)
    .map((p) => ({ i: p.i, text: quarterLabel(p.t).slice(0, 4) }));

  const expected = s.marketExpectedRate;
  const oddsHike = Math.max(0, Math.min(100, ((expected - q.policyRate) / 0.25) * 100));
  const oddsCut = Math.max(0, Math.min(100, ((q.policyRate - expected) / 0.25) * 100));
  const pressure = q.events.includes('ministerPressure');

  return (
    <div className="war">
      {/* ---------- Left: the situation ---------- */}
      <section className="col">
        <div className="glass">
          <h2 className="h4">
            Situation <small>{quarterLabel(now.t)} data</small>
          </h2>
          <Indicator id="headline-inflation" label="Inflation" sub={`core ${now.core.toFixed(1)}%`} value={now.headline} prev={before.headline} first alert={now.headline > tgt.high || now.headline < tgt.low} suffix="%" now={`Target ${tgt.low} to ${tgt.high}%. ${now.headline > tgt.high ? 'Above the band.' : now.headline < tgt.low ? 'Below the band.' : 'Inside the band.'}`} />
          <Indicator id="unemployment" label="Unemployment" sub="NAIRU about 3%" value={now.unemployment} prev={before.unemployment} first suffix="%" />
          <Indicator id="gdp" label="GDP growth" sub="year on year" value={now.gdpGrowth} prev={before.gdpGrowth} first suffix="%" />
          <Indicator id="output-gap" label="Output gap" sub="staff estimate" value={now.outputGap} prev={before.outputGap} first signedValue />
          <Indicator id="policy-rate" label="Policy rate" sub={`real ${(q.policyRate - q.expectedInflation).toFixed(2)}%`} value={q.policyRate} prev={prevQ.policyRate} decimals={2} suffix="%" />
          <Indicator id="exchange-rate" label="KST per aurel" sub={q.thaler > 0 ? `thaler ${q.thaler.toFixed(1)}% strong` : `thaler ${(-q.thaler).toFixed(1)}% weak`} value={q.kstPerAurel} prev={prevQ.kstPerAurel} decimals={3} />
        </div>
        <div className="glass grow">
          <h2 className="h4">
            Briefing <small>why did that happen?</small>
          </h2>
          {chains.length === 0 ? (
            <p className="muted">
              Your first meeting. The economy is calm, inflation is near target and the committee is waiting for your lead. Hover any underlined term
              for its meaning.
            </p>
          ) : (
            <ol className="chains">
              {chains.map((c, k) => (
                <li key={k} className="rise" style={{ animationDelay: `${k * 80}ms` }}>
                  {c.steps.map((st, j) => (
                    <span key={j}>
                      {j > 0 && <b aria-hidden="true"> → </b>}
                      {j === c.steps.length - 1 ? <em className={c.effect > 0 ? 'up' : 'down'}>{st}</em> : st}
                    </span>
                  ))}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ---------- Centre: outlook and committee ---------- */}
      <section className="col centre">
        <div className="glass chart-panel">
          <h2 className="h4">
            <span>
              <Term id="inflation">Inflation</Term> outlook
            </span>
            <small>published data · staff forecast with 50% and 90% ranges · target {tgt.low}–{tgt.high}%</small>
          </h2>
          <div className="legend">
            <span><i style={{ background: '#ffd2a6' }} />Headline</span>
            <span><i style={{ background: 'var(--ice)' }} />Core</span>
            <span><i className="band" />Target band</span>
          </div>
          <div className="chart-box">
            <Chart
              key={s.t}
              title="Inflation history and forecast"
              n={n}
              target={[tgt.low, tgt.high]}
              now={fanFrom}
              nowLabel="TODAY"
              xLabels={xLabels}
              bands={[
                { from: fanFrom, lo: join(forecast.headline.p5, now.headline), hi: join(forecast.headline.p95, now.headline), fill: 'rgba(255,106,61,.14)' },
                { from: fanFrom, lo: join(forecast.headline.p25, now.headline), hi: join(forecast.headline.p75, now.headline), fill: 'rgba(255,106,61,.30)' },
              ]}
              series={[
                { data: past((r) => r.core), color: 'var(--ice)', glow: true },
                { data: join(forecast.core.p50, now.core), from: fanFrom, color: 'var(--ice)', dash: true },
                { data: past((r) => r.headline), color: '#ffd2a6', width: 2.4, glow: true, dot: true },
                { data: join(forecast.headline.p50, now.headline), from: fanFrom, color: '#ffd2a6', dash: true },
              ]}
            />
          </div>
        </div>
        <div className="table" aria-label="Committee">
          <svg className="tb" viewBox="0 0 700 260" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <radialGradient id="tbl" cx="50%" cy="40%" r="60%">
                <stop offset="0" stopColor="#1f2d47" />
                <stop offset="1" stopColor="#0a0f19" />
              </radialGradient>
            </defs>
            <ellipse cx="350" cy="160" rx="250" ry="70" fill="url(#tbl)" stroke="rgba(156,200,255,.25)" />
            <ellipse cx="350" cy="160" rx="210" ry="50" fill="none" stroke="rgba(255,196,107,.18)" />
          </svg>
          {advice.map((a, k) => {
            const pos = [
              { left: '10%', top: 70 },
              { left: '29%', top: 6 },
              { left: '50%', top: -6 },
              { left: '71%', top: 6 },
              { left: '90%', top: 70 },
            ][k];
            return (
              <button
                key={a.member.id}
                className={`seat ${a.member.id === talker.member.id ? 'speaking' : ''}`}
                style={pos}
                onClick={() => setSpeaker(a.member.id)}
                aria-pressed={a.member.id === talker.member.id}
                title={a.member.bio}
              >
                <span className="av">
                  <Portrait id={a.member.id} />
                </span>
                <b>{a.member.short}</b>
                <small>{a.member.role}</small>
                <span className={`tag ${a.vote}`}>{a.vote === 'hold' ? 'HOLD' : `${a.vote === 'hike' ? '+' : '−'}${Math.abs(a.rate - q.policyRate).toFixed(2)}`}</span>
              </button>
            );
          })}
          <blockquote className="speech" key={talker.member.id + s.t} aria-live="polite">
            “{talker.text}”
            <cite>
              {talker.member.name} · {talker.member.role}
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ---------- Right: standing, news and the decision ---------- */}
      <section className="col">
        <div className="glass">
          <h2 className="h4">
            Standing <small>after {quarterLabel(s.t - 1)}</small>
          </h2>
          <div className="standing">
            <Term id="credibility" now={`${Math.round(q.credibility)}/100. Below 15 you are fired. High credibility anchors expectations.`}>
              <Gauge value={q.credibility} delta={q.credibility - prevQ.credibility} />
            </Term>
            <div className="meters">
              <Meter label="Public approval" value={q.approval} text={`${Math.round(q.approval)}%`} warm />
              <Meter label={<Term id="policy-rate">Markets expect</Term>} value={oddsHike || oddsCut} text={`${(Math.round(expected * 4) / 4).toFixed(2)}%`} />
              <Meter label={<Term id="macroprudential">Financial risk</Term>} value={(q.risk / 15) * 100} text={q.risk.toFixed(1)} warm />
            </div>
          </div>
        </div>
        <div className="glass news-panel">
          <h2 className="h4">
            Incoming <small>{quarterLabel(s.t - 1)}</small>
          </h2>
          <ul className="cables">
            {pressure && (
              <li className="u">
                <small>Urgent · Finance Ministry</small>Minister Halder publicly demands a rate cut at this meeting.
              </li>
            )}
            {headlines.length === 0 && !pressure && (
              <li>
                <small>Valden Ledger</small>New Governor takes office as markets wait for first decision.
              </li>
            )}
            {headlines.map((h, k) => (
              <li key={k} className={h.urgent ? 'u' : ''}>
                <small>{h.urgent ? `Urgent · ${h.source}` : h.source}</small>
                {h.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass decide">
          <h2 className="h4">
            Your call <small>committee median {median.toFixed(2)}%</small>
          </h2>
          <div className="dial">
            <button onClick={() => bumpRate(-1)} aria-label="Lower the rate by 0.25 (down arrow)">
              −
            </button>
            <div className="rv" aria-live="polite">
              {draft.rate.toFixed(2)}%
              <small>{change === 0 ? 'Hold' : `${change > 0 ? 'Raise' : 'Cut'} ${signed(change, 2)}`}</small>
            </div>
            <button onClick={() => bumpRate(1)} aria-label="Raise the rate by 0.25 (up arrow)">
              +
            </button>
          </div>
          <div className="stm" role="radiogroup" aria-label="Forward guidance">
            <div className="label">
              <Term id="forward-guidance">Statement</Term>
            </div>
            {GUIDANCE.map((g, k) => (
              <button key={g.id} role="radio" aria-checked={draft.guidance === g.id} className="opt" onClick={() => setGuidance(g.id)} title={g.term}>
                <kbd>{k + 1}</kbd> {g.text}
              </button>
            ))}
          </div>
          <div className="fx" role="radiogroup" aria-label="Currency intervention">
            <span className="label">
              <Term id="fx-intervention">Buy aurels</Term> <kbd>F</kbd>
            </span>
            {FX_STEPS.map((v) => (
              <button key={v} role="radio" aria-checked={draft.fxPurchases === v} className="chip" onClick={() => setFx(v)}>
                {v === 0 ? 'None' : `${v}% of GDP`}
              </button>
            ))}
          </div>
          <button className="btn primary seal" onClick={seal}>
            Seal the decision <kbd>↵</kbd>
          </button>
        </div>
      </section>
    </div>
  );
}

function Indicator(p: {
  id: string;
  label: string;
  sub: string;
  value: number;
  prev: number;
  suffix?: string;
  decimals?: number;
  first?: boolean;
  alert?: boolean;
  signedValue?: boolean;
  now?: string;
}) {
  const d = p.decimals ?? 1;
  const delta = p.value - p.prev;
  const arrow = Math.abs(delta) < 10 ** -d / 2 ? '' : delta > 0 ? '▲' : '▼';
  return (
    <div className={`ind ${p.alert ? 'alert' : ''}`}>
      <div>
        <div className="label">
          <Term id={p.id} now={p.now}>
            {p.label}
          </Term>{' '}
          {arrow && <span aria-label={delta > 0 ? 'up' : 'down'}>{arrow}</span>}
        </div>
        <div className="sub">
          {p.sub}
          {p.first && <span className="tag first" title="First estimate: may be revised next quarter">1st est.</span>}
        </div>
      </div>
      <div className="v">
        {p.signedValue && p.value > 0 ? '+' : ''}
        <Ticker value={p.value} decimals={d} suffix={p.suffix} />
      </div>
    </div>
  );
}

