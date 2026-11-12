/**
 * The Economy and Production panels, shown in the sidebar. They only display what the engine
 * (src/sim/economy.ts) works out and send orders back; no game maths happens here.
 */
import type { ReactNode } from 'react';
import {
  BUILD_COST, BUILDERS_PER_PROJECT, cannotRaise, CONSCRIPTION, economyView, FACTORY_COST, KIT_COST, MEN_PER_DIVISION, musterPoint, TAX_MAX, TAX_MIN, TAX_STABILITY, TRAINING_DAYS, UNIT_TYPES, UPKEEP, WAR_UPKEEP,
  type EconomyView, type Reason,
} from '../../sim/economy';
import { PROVINCES } from '../../sim/map';
import type { Economy, UnitType, World } from '../../sim/types';
import { Chart } from '../components/Chart';
import { Term } from '../components/bits';
import { useGame } from '../store';
import { Frame, Link, Row } from './Sidebar';

/** Money in millions, e.g. "1,240m" or "-3.5m". */
export const money = (x: number): string => {
  const a = Math.abs(x);
  const text = a >= 100 ? Math.round(a).toLocaleString('en-GB') : a.toFixed(1);
  return `${x < -0.05 ? '-' : ''}${text}m`;
};
const pct = (x: number, digits = 0) => `${x.toFixed(digits)}%`;
const signed = (x: number, digits = 1) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(digits)}`;
const men = (thousands: number) => `${(Math.round(thousands) * 1000).toLocaleString('en-GB')} men`;
const NAME: Record<UnitType, string> = { infantry: 'Infantry', armour: 'Armour', artillery: 'Artillery' };
const year = (w: World, day: number) => {
  const d = new Date(`${w.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day);
  return String(d.getUTCFullYear());
};

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="sb-stepper" role="group" aria-label={label}>
      <button onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${label}: one fewer`}>
        −
      </button>
      <b aria-live="polite">{value}</b>
      <button onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`${label}: one more`}>
        +
      </button>
    </div>
  );
}

function Why({ items }: { items: { text: string; points: number }[] }) {
  if (!items.length) return null;
  return (
    <ul className="sb-why">
      {items.map((r) => (
        <li key={r.text}>
          <span>{r.text}</span>
          <b>{signed(r.points)}</b>
        </li>
      ))}
    </ul>
  );
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <button className={`sb-btn${on ? ' on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      {children}: {on ? 'on' : 'off'}
    </button>
  );
}

function History({ w, e }: { w: World; e: Economy }) {
  const h = e.history;
  if (h.length < 3) return <p className="sb-fine">Charts of inflation and debt appear here after three months.</p>;
  const labels = [{ i: 0, text: year(w, h[0].day) }, { i: h.length - 1, text: year(w, h[h.length - 1].day) }];
  // Three round numbers on the side: bottom, middle and top.
  const scale = (data: number[], span: number) => {
    const lo = Math.floor(Math.min(...data) / span) * span;
    const hi = Math.max(lo + span, Math.ceil(Math.max(...data) / span) * span);
    return { min: lo - (hi - lo) * 0.06, max: hi + (hi - lo) * 0.06, ticks: [lo, (lo + hi) / 2, hi] };
  };
  const inflation = h.map((r) => r.inflation);
  const debt = h.map((r) => r.debtRatio * 100);
  return (
    <>
      <div className="sb-chart">
        <Chart n={h.length} title={`Inflation, per cent a year, over the last ${h.length} months. Now ${e.inflation.toFixed(1)}%.`} series={[{ data: inflation, color: '#ffc46b', dot: true }]} xLabels={labels} format={(v) => `${v.toFixed(0)}%`} {...scale(inflation, 10)} pad={{ l: 44, r: 16 }} />
      </div>
      <p className="sb-fine">Inflation, % a year</p>
      <div className="sb-chart">
        <Chart n={h.length} title={`Debt as a share of a year's output over the last ${h.length} months. Now ${debt[debt.length - 1].toFixed(0)}%.`} series={[{ data: debt, color: '#9cc8ff', dot: true }]} xLabels={labels} format={(v) => `${v.toFixed(0)}%`} {...scale(debt, 20)} pad={{ l: 44, r: 16 }} />
      </div>
      <p className="sb-fine">Debt, % of a year's output</p>
    </>
  );
}

function inflationCauses(e: Economy): Reason[] {
  const c = e.causes;
  return [
    { text: 'last month’s inflation carrying on', points: c.carry },
    { text: 'people expect prices to keep rising', points: c.expectations },
    { text: 'money printed to pay the bills', points: c.printing },
    { text: 'ordinary bank lending', points: c.credit },
    { text: 'the economy shrank: fewer goods to buy', points: c.growth },
    { text: 'shortages in the shops', points: c.shortage },
  ]
    .filter((r) => Math.abs(r.points) >= 0.05)
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
}

export function EconomyPanel({ w, me }: { w: World; me: string }) {
  const e = w.economies[me];
  const v = economyView(w, me);
  const order = useGame.getState().economy;
  const b = v.budget;
  const taxPoint = (v.nominalGDP * 0.01) / 1;
  const month = e.history[e.history.length - 1];
  const cover =
    b.balance >= 0
      ? 'You are in surplus. Whatever the treasury holds above one month of spending pays off debt.'
      : e.treasury > 0
        ? `The treasury covers the shortfall for about ${Math.max(1, Math.round(e.treasury / (-b.balance / 30)))} more days. After that you must borrow or print.`
        : `The treasury is empty. So far this month: ${money(e.borrowedThisMonth)} borrowed and ${money(e.printedThisMonth)} printed.`;
  const lines: [string, number, string?][] = [
    ['Taxes', b.taxes],
    ['Exports of steel and oil', b.exports],
    ['Civil government', -b.government, 'Schools, pensions, officials: 12% of output.'],
    [`Army upkeep${v.atWar ? ` (at war: x${WAR_UPKEEP})` : ''}`, -b.upkeep],
    ['Military factories', -b.military],
    ['Construction', -b.construction],
    ['Imports of steel and oil', -b.imports],
    ['Interest on the debt', -b.interest],
  ];
  return (
    <Frame wide kicker="Economy" title="The Treasury" sub={`${b.balance >= 0 ? 'Surplus' : 'Shortfall'} of ${money(Math.abs(b.balance))} a month · inflation ${pct(e.inflation, 1)}`}>
      <h3>
        <Term id="budget-deficit">Budget</Term>, per month
      </h3>
      <table className="sb-budget">
        <tbody>
          {lines
            .filter(([, x]) => Math.abs(x) >= 0.05)
            .map(([label, x, title]) => (
              <tr key={label} title={title}>
                <th scope="row">{label}</th>
                <td className={x < 0 ? 'neg' : 'pos'}>{x < 0 ? money(x) : `+${money(x)}`}</td>
              </tr>
            ))}
          <tr className="total">
            <th scope="row">Balance</th>
            <td className={b.balance < 0 ? 'neg' : 'pos'}>{b.balance < 0 ? money(b.balance) : `+${money(b.balance)}`}</td>
          </tr>
        </tbody>
      </table>
      <div className="sb-rows">
        <Row label="In the treasury" value={money(e.treasury)} />
        <Row label="Output a month (GDP)" value={money(v.nominalGDP)} />
      </div>
      <p className="sb-note">{cover}</p>

      <h3>
        <label htmlFor="tax">Taxes: {pct(e.taxRate * 100)} of output</label>
      </h3>
      <input id="tax" className="sb-range" type="range" min={TAX_MIN * 100} max={TAX_MAX * 100} step={1} value={Math.round(e.taxRate * 100)} onChange={(ev) => order({ type: 'setTax', rate: Number(ev.target.value) / 100 })} aria-valuetext={`${Math.round(e.taxRate * 100)} per cent`} />
      <p className="sb-fine">
        Each point brings in about {money(taxPoint)} a month. Above 25% stability falls{e.taxRate > 0.25 ? ` (now ${signed(-TAX_STABILITY * 100 * (e.taxRate - 0.25), 0)})` : ''}; above 30% factories slow down{e.taxRate > 0.3 ? ` (now -${pct((1 - v.factors.tax) * 100, 1)})` : ''}. Higher taxes
        also leave people less to spend, so the shops need fewer goods and prices rise less.
      </p>

      <h3>
        <label htmlFor="bonds">Covering a shortfall</label>
      </h3>
      <input id="bonds" className="sb-range" type="range" min={0} max={100} step={10} value={Math.round(e.bondShare * 100)} onChange={(ev) => order({ type: 'setBondShare', share: Number(ev.target.value) / 100 })} aria-valuetext={`${Math.round(e.bondShare * 100)} per cent bonds, ${100 - Math.round(e.bondShare * 100)} per cent printed money`} />
      <div className="sb-ends">
        <span>Print it all</span>
        <b>
          {Math.round(e.bondShare * 100)}% <Term id="war-bonds">bonds</Term>, {100 - Math.round(e.bondShare * 100)}% printed
        </b>
        <span>Borrow it all</span>
      </div>
      <p className="sb-fine">
        Lenders will buy up to {money(v.bondCapacity)} of bonds a month (confidence {pct(v.confidence * 100)}). Bonds nobody buys are paid for with printed money anyway. Bonds cost interest for years; printing costs nothing now and shows up
        as inflation a few months later.
      </p>
      <Toggle on={e.rationing} onChange={(on) => order({ type: 'setRationing', on })}>
        <Term id="rationing">Rationing</Term> and price controls
      </Toggle>
      <p className="sb-fine">People may buy a quarter less, and shortages and printed money push prices up less. It costs 5 stability, and a black market takes 5% of your taxes.</p>

      <h3>
        <Term id="inflation">Prices</Term>
      </h3>
      <div className="sb-rows">
        <Row label="Inflation, a year" value={pct(e.inflation, 1)} bar={Math.min(100, Math.max(0, e.inflation))} warn={e.inflation > 10} />
        <Row label="Inflation people expect" value={pct(e.expected, 1)} />
        <Row label="Prices since January 1936" value={`${signed(e.priceLevel - 100, 0)}%`} />
        {month && <Row label="Printed last month" value={`${money(month.printed)} (${pct(e.money > 0 ? (month.printed / e.money) * 100 : 0, 1)} of all money)`} />}
      </div>
      <p className="sb-note">Why inflation is {pct(e.inflation, 1)} (points, biggest first):</p>
      <Why items={inflationCauses(e)} />
      <p className="sb-fine">
        Each month: inflation = 0.8 x last month's + 0.2 x (money growth - economy growth) + shortages. Over 10% stability falls; over 30% factories slow and bonds stop selling; over 100% is hyperinflation.
      </p>
      <History w={w} e={e} />

      <h3>Debt</h3>
      <div className="sb-rows">
        <Row label="National debt" value={`${money(e.debt)} (${pct(v.debtRatio * 100)} of a year's output)`} bar={Math.min(100, v.debtRatio * 50)} warn={v.debtRatio > 1} />
        <Row label="Average interest on it" value={`${pct(e.debtRate, 1)} a year`} />
        <Row label="Interest on new bonds (i)" value={`${pct(v.marketRate, 1)} a year`} />
      </div>
      <p className="sb-note">
        Lenders ask for a <Term id="real-interest-rate">real rate</Term> plus the inflation they expect: i = r + expected inflation = {v.realRate.toFixed(1)} + {Math.max(0, e.expected).toFixed(1)} = {v.marketRate.toFixed(1)}%. The real rate r is made of:
      </p>
      <Why items={v.rateReasons} />
      <p className="sb-fine">
        After today's inflation a lender really earns r = i - pi = {v.marketRate.toFixed(1)} - {e.inflation.toFixed(1)} = {(v.marketRate - e.inflation).toFixed(1)}%. Inflation shrinks the real weight of old debt, which is why governments are tempted by it.
      </p>

      <h3>
        <Term id="stability">Stability</Term>
      </h3>
      <div className="sb-rows">
        <Row label="Stability" value={`${Math.round(e.stability)} of 100`} bar={e.stability} warn={e.stability < 50} />
        <Row label="Heading for" value={`${Math.round(v.stabilityTarget)}`} />
      </div>
      {v.stabilityReasons.length ? (
        <>
          <p className="sb-note">Starting from 75, what is pulling it down:</p>
          <Why items={v.stabilityReasons} />
        </>
      ) : (
        <p className="sb-note">Nothing is pulling it down. It settles at 75.</p>
      )}
      <p className="sb-fine">Stability moves a fifth of the way to where it is heading each month. Below 50, strikes slow every factory{v.factors.stability < 1 ? ` (now -${pct((1 - v.factors.stability) * 100, 1)})` : ''}. War support, and what else moves stability, arrive in Stage E.</p>
      <div className="sb-actions">
        <Link to={{ kind: 'production' }}>Production: factories, divisions and manpower</Link>
      </div>
    </Frame>
  );
}

function slowdowns(v: EconomyView): string[] {
  const out: string[] = [];
  const add = (factor: number, text: string) => factor < 0.999 && out.push(`${text} (-${pct((1 - factor) * 100, 1)})`);
  add(v.factors.conscription, 'workers called up');
  add(v.factors.stability, 'strikes (stability below 50)');
  add(v.factors.inflation, 'inflation above 30%');
  add(v.factors.tax, 'taxes above 30%');
  return out;
}

export function ProductionPanel({ w, me }: { w: World; me: string }) {
  const e = w.economies[me];
  const v = economyView(w, me);
  const order = useGame.getState().economy;
  const civ = Math.floor(v.civ + 1e-9);
  const mil = Math.floor(v.mil + 1e-9);
  const home = musterPoint(w.controller, me);
  const slow = slowdowns(v);
  const p = e.priceLevel / 100;
  // How long each project in the queue will take with the builders it gets.
  let builders = v.building;
  const jobs = e.construction.map((job) => {
    const crew = w.controller[job.province] === me ? Math.min(BUILDERS_PER_PROJECT, builders) : 0;
    builders -= crew;
    const left = BUILD_COST[job.kind] - job.done;
    return { ...job, crew, days: crew > 0 && v.outputFactor > 0 ? Math.ceil(left / (crew * v.outputFactor)) : null };
  });
  return (
    <Frame wide kicker="Production" title="Factories and the army" sub={`${civ} civilian and ${mil} military factories · ${men(e.manpower)} available`}>
      <h3>
        <Term id="consumer-goods">Civilian factories</Term>
      </h3>
      <div className="sb-rows">
        <Row label="Making consumer goods" value={`${v.consumer.toFixed(v.consumer % 1 ? 1 : 0)} (people need ${v.goodsNeed.toFixed(1)})`} bar={v.goodsNeed > 0 ? Math.min(100, (v.consumer / v.goodsNeed) * 50) : 100} warn={v.shortage > 0} />
        <Row label="Building" value={`${v.building} of ${e.constructionFactories} set aside`} />
      </div>
      {v.shortage > 0 ? (
        <p className="sb-note warn">Shortage of {pct(v.shortage * 100)}: too few factories make goods for the shops. Prices rise and stability falls. Build fewer things at once, ration, or raise taxes so people buy less.</p>
      ) : (
        <p className="sb-fine">
          This is the <Term id="guns-or-butter">guns or butter</Term> choice: every factory that builds or arms is one that does not fill the shops. You can take about {Math.max(0, Math.floor(v.civ - v.goodsNeed / CONSCRIPTION[e.conscription].output))} away before shortages
          start.
        </p>
      )}
      {slow.length > 0 && <p className="sb-note">All factories are working at {pct(v.outputFactor * 100)} of full speed, because of: {slow.join('; ')}.</p>}

      <h3>Construction</h3>
      <div className="sb-line">
        <span>Civilian factories set aside for building</span>
        <Stepper label="Factories set aside for building" value={e.constructionFactories} min={0} max={civ} onChange={(n) => order({ type: 'setConstruction', factories: n })} />
      </div>
      <p className="sb-fine">
        They only leave the shops while something is being built. Up to {BUILDERS_PER_PROJECT} work on one project, and each costs {money(FACTORY_COST * p)} a month while it does.
      </p>
      {jobs.length > 0 && (
        <ul className="sb-queue">
          {jobs.map((job, i) => (
            <li key={i}>
              <div>
                <b>{job.kind === 'civ' ? 'Civilian' : 'Military'} factory</b>
                <span>
                  {PROVINCES[job.province].name} · {pct((job.done / BUILD_COST[job.kind]) * 100)} · {job.days === null ? (w.controller[job.province] === me ? 'waiting for builders' : 'province lost') : `about ${job.days} days`}
                </span>
              </div>
              <button className="mt-icon" onClick={() => order({ type: 'cancelBuild', index: i })} aria-label={`Cancel the ${job.kind === 'civ' ? 'civilian' : 'military'} factory in ${PROVINCES[job.province].name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {home !== null && (
        <div className="sb-actions">
          <button className="sb-btn" onClick={() => order({ type: 'build', kind: 'mil', province: home })}>
            Build a military factory in {PROVINCES[home].name}
            <small>{BUILD_COST.mil} factory-days: {Math.ceil(BUILD_COST.mil / BUILDERS_PER_PROJECT)} days with 5 builders</small>
          </button>
          <button className="sb-btn" onClick={() => order({ type: 'build', kind: 'civ', province: home })}>
            Build a civilian factory in {PROVINCES[home].name}
            <small>{BUILD_COST.civ} factory-days: {Math.ceil(BUILD_COST.civ / BUILDERS_PER_PROJECT)} days with 5 builders</small>
          </button>
        </div>
      )}
      <p className="sb-fine">To build somewhere else, click one of your home provinces on the map. {e.construction.length > 0 && e.constructionFactories === 0 ? 'Nothing is being built yet: set some factories aside above.' : ''}</p>

      <h3>
        <Term id="production-line">Production lines</Term>
      </h3>
      <p className="sb-fine">
        {mil} military factories, {v.milFree} idle. Each working one costs {money(FACTORY_COST * p)} a month and needs 1 steel. A line starts at 50% speed and gains speed the longer it runs, so moving factories between lines has a price.
      </p>
      {UNIT_TYPES.map((k) => {
        const line = e.lines[k];
        const rate = v.lineRate[k];
        const blocked = cannotRaise(e, k);
        return (
          <div className="sb-prod" key={k}>
            <div className="sb-line">
              <b>{NAME[k]}</b>
              <Stepper label={`Factories on the ${k} line`} value={line.factories} min={0} max={line.factories + v.milFree} onChange={(n) => order({ type: 'setLine', unit: k, factories: n })} />
            </div>
            <p>
              {line.factories ? `Running at ${pct(line.efficiency * 100)} speed: equipment for one division every ${rate > 0 ? Math.round(1 / rate) : '∞'} days.` : 'No factories on this line.'} In store: enough for <b>{e.stock[k].toFixed(1)}</b>{' '}
              {e.stock[k] >= 1.95 || e.stock[k] < 0.95 ? 'divisions' : 'division'}.
            </p>
            <button className="sb-btn" disabled={!!blocked} onClick={() => order({ type: 'raise', unit: k })}>
              Raise an {k} division
              <small>
                {blocked ? `Not yet: ${blocked}.` : `${MEN_PER_DIVISION},000 men, ${TRAINING_DAYS[k]} days of training, then ${money(UPKEEP[k] * p)} a month (${money(UPKEEP[k] * WAR_UPKEEP * p)} at war).`}
              </small>
            </button>
          </div>
        );
      })}
      {e.training.length > 0 && (
        <>
          <h3>In training</h3>
          <ul className="sb-queue">
            {e.training.map((t, i) => (
              <li key={i}>
                <div>
                  <b>{NAME[t.type]} division</b>
                  <span>{t.daysLeft > 0 ? `${t.daysLeft} days left` : 'ready, waiting for somewhere to form up'}</span>
                </div>
              </li>
            ))}
          </ul>
          {home !== null && <p className="sb-fine">New divisions form up in {PROVINCES[home].name}, or in your least crowded home province once it is full, at 40% organisation. The news line tells you where.</p>}
        </>
      )}
      <p className="sb-fine">Resting divisions that are in supply refill by up to 0.5 strength a day, using equipment from the same stores and men from the pool below. Work to equip a division: infantry {KIT_COST.infantry} factory-days, artillery {KIT_COST.artillery}, armour {KIT_COST.armour}.</p>

      <h3>
        <Term id="manpower">Manpower</Term>
      </h3>
      <div className="sb-rows">
        <Row label="Available to recruit" value={`${men(e.manpower)} (${Math.floor(e.manpower / MEN_PER_DIVISION)} divisions)`} />
      </div>
      <div className="sb-laws" role="radiogroup" aria-label="Conscription law">
        {CONSCRIPTION.map((law, i) => (
          <button key={law.name} role="radio" aria-checked={e.conscription === i} className={e.conscription === i ? 'on' : ''} onClick={() => order({ type: 'setConscription', level: i })}>
            <b>{law.name}</b>
            <span>
              {pct(law.share * 100, 1)} of the people can serve{law.output < 1 ? ` · factories -${pct((1 - law.output) * 100)}` : ''}
            </span>
          </button>
        ))}
      </div>
      <p className="sb-fine">
        A wider <Term id="conscription">conscription</Term> law calls up more men at once but takes workers out of the factories. Each step up costs 2 stability on the day, and the two widest laws cost more for as long as they last.
      </p>

      <h3>Steel and oil</h3>
      <div className="sb-rows">
        <Row label="Steel: have / need" value={`${v.steel.have.toFixed(1)} / ${v.steel.need.toFixed(1)}`} bar={v.steel.need > 0 ? Math.min(100, (v.steel.have / v.steel.need) * 100) : 100} warn={v.steel.have < v.steel.need} />
        <Row label="Oil: have / need" value={`${v.oil.have.toFixed(1)} / ${v.oil.need.toFixed(1)}`} bar={v.oil.need > 0 ? Math.min(100, (v.oil.have / v.oil.need) * 100) : 100} warn={v.oil.have < v.oil.need} />
      </div>
      <Toggle on={e.imports} onChange={(on) => order({ type: 'setImports', on })}>
        Buy what is missing abroad
      </Toggle>
      <p className="sb-fine">
        {e.imports
          ? v.budget.imports > 0
            ? `Imports cost ${money(v.budget.imports)} a month.`
            : 'Nothing needs importing right now.'
          : v.steel.ratio < 1 || v.oil.ratio < 1
            ? `Without imports the lines run at ${pct(v.steel.ratio * 100)} speed${v.oil.ratio < 1 ? `, the armour line at ${pct(v.steel.ratio * v.oil.ratio * 100)}, and your armoured divisions go short of fuel` : ''}.`
            : 'You have all you need at home.'}{' '}
        Military factories need steel; armour needs oil. What you do not use is sold abroad at half price{v.budget.exports > 0 ? ` (${money(v.budget.exports)} a month)` : ''}. From Stage G imports come by sea and can be sunk.
      </p>
      <div className="sb-actions">
        <Link to={{ kind: 'economy' }}>Economy: budget, taxes, debt and inflation</Link>
      </div>
    </Frame>
  );
}
