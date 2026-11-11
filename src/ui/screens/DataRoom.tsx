/** The Data Room: every series in detail, as published, with revisions. */
import { useMemo, type ReactNode } from 'react';
import { releases } from '../../sim/data';
import { targetFor } from '../../sim/targets';
import { Chart, type Series } from '../components/Chart';
import { Term } from '../components/bits';
import { quarterLabel, useGame } from '../store';

export function DataRoom() {
  const s = useGame((st) => st.game)!;
  const rel = useMemo(() => releases(s), [s]);
  const tgt = targetFor(s.settings.targetMode);
  const h = s.history;
  const n = h.length;
  const xl = h.map((q, i) => ({ i, t: q.t })).filter((p) => ((p.t % 4) + 4) % 4 === 0).map((p) => ({ i: p.i, text: quarterLabel(p.t).slice(0, 4) }));
  const nowIdx = h.findIndex((q) => q.t === 0);
  const common = { n, xLabels: xl, now: nowIdx >= 0 ? nowIdx : undefined, nowLabel: 'TERM STARTS' };
  const prevQ = h[n - 2];
  const q = h[n - 1];

  const panel = (title: ReactNode, sub: string, series: Series[], extra: Partial<Parameters<typeof Chart>[0]> = {}) => (
    <div className="glass dr-panel">
      <h2 className="h4">
        <span>{title}</span>
        <small>{sub}</small>
      </h2>
      <div className="legend">
        {series.filter((x) => x.label).map((x) => (
          <span key={x.label}>
            <i style={{ background: x.color }} />
            {x.label}
          </span>
        ))}
      </div>
      <div className="chart-box">
        <Chart key={s.t} title={typeof title === 'string' ? title : sub} {...common} {...extra} series={series.map((x) => ({ ...x, label: undefined }))} />
      </div>
    </div>
  );

  const recent = rel.slice(-3);
  return (
    <div className="dataroom">
      {panel(<Term id="inflation">Inflation</Term>, `published, % · target ${tgt.low}–${tgt.high}%`, [
        { data: rel.map((r) => r.headline), color: '#ffd2a6', label: 'Headline', dot: true },
        { data: rel.map((r) => r.core), color: 'var(--ice)', label: 'Core' },
      ], { target: [tgt.low, tgt.high] })}
      {panel(<Term id="output-gap">Output gap and unemployment</Term>, 'published, %', [
        { data: rel.map((r) => r.outputGap), color: '#ffd2a6', label: 'Output gap', dot: true },
        { data: rel.map((r) => r.unemployment), color: 'var(--ice)', label: 'Unemployment' },
      ])}
      {panel(<Term id="gdp">GDP growth</Term>, 'published, year on year %', [{ data: rel.map((r) => r.gdpGrowth), color: 'var(--ok)', label: 'GDP growth', dot: true }])}
      {panel(<Term id="yield-curve">Rates and bond yields</Term>, '%', [
        { data: h.map((x) => x.policyRate), color: 'var(--gold)', label: 'Policy rate', dot: true },
        { data: h.map((x) => x.yield2), color: 'var(--ice)', label: '2-year' },
        { data: h.map((x) => x.yield10), color: '#b48cff', label: '10-year' },
      ])}
      {panel(<Term id="exchange-rate">Thaler per aurel</Term>, 'lower = stronger thaler', [{ data: h.map((x) => x.kstPerAurel), color: 'var(--ice)', label: 'KST per aurel', dot: true }], { format: (v) => v.toFixed(2) })}
      {panel(<Term id="macroprudential">Housing and credit</Term>, 'growth, % per year', [
        { data: h.map((x) => x.houseGrowth), color: '#ffd2a6', label: 'House prices', dot: true },
        { data: h.map((x) => x.creditGrowth), color: 'var(--ice)', label: 'Credit' },
      ])}
      {panel(<Term id="credibility">Credibility and approval</Term>, '0 to 100', [
        { data: h.map((x) => x.credibility), color: 'var(--ice)', label: 'Credibility', dot: true },
        { data: h.map((x) => x.approval), color: 'var(--gold)', label: 'Approval' },
      ], { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] })}
      <div className="glass dr-panel">
        <h2 className="h4">
          <Term id="yield-curve">Yield curve</Term>
          <small>now vs last quarter</small>
        </h2>
        <div className="legend">
          <span><i style={{ background: 'var(--gold)' }} />Now</span>
          <span><i style={{ background: 'var(--dim)' }} />Last quarter</span>
        </div>
        <div className="chart-box">
          <Chart
            key={s.t}
            title="Yield curve"
            n={4}
            categories={['Policy', '2Y', '5Y', '10Y']}
            series={[
              { data: [prevQ.policyRate, prevQ.yield2, prevQ.yield5, prevQ.yield10], color: 'var(--dim)', dash: true },
              { data: [q.policyRate, q.yield2, q.yield5, q.yield10], color: 'var(--gold)', dot: true },
            ]}
            format={(v) => v.toFixed(1)}
          />
        </div>
      </div>
      <div className="glass dr-panel wide">
        <h2 className="h4">
          <Term id="revision">Releases and revisions</Term>
          <small>first estimates change as better data arrives</small>
        </h2>
        <div className="table-wrap">
          <table className="rev">
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Status</th>
                <th>Inflation</th>
                <th>Core</th>
                <th>GDP growth</th>
                <th>Unemployment</th>
                <th>Output gap</th>
              </tr>
            </thead>
            <tbody>
              {recent.reverse().map((r) => (
                <tr key={r.t}>
                  <td>{quarterLabel(r.t)}</td>
                  <td>{r.vintage === 0 ? <span className="tag first">1st estimate</span> : r.vintage === 1 ? 'Revised once' : 'Final'}</td>
                  <td>{r.headline.toFixed(1)}%</td>
                  <td>{r.core.toFixed(1)}%</td>
                  <td>{r.gdpGrowth.toFixed(1)}%</td>
                  <td>{r.unemployment.toFixed(1)}%</td>
                  <td>{r.outputGap.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
