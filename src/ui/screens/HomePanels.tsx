/**
 * The Research, National plan and Home front panels, and the detail views for one technology
 * and one plan. They only display what the engine works out (src/sim/research.ts, plans.ts,
 * economy.ts) and send orders back; no game maths happens here.
 */
import { CONSCRIPTION, CONSCRIPTION_SUPPORT, conscriptionBlocked, CRISIS_MONTHS, CRISIS_STABILITY, economyView, SUPPORT_LENIENCY, UNITED, UNWANTED_WAR } from '../../sim/economy';
import { countryByName } from '../../sim/countries';
import { describeEffects } from '../../sim/mods';
import { cannotStartPlan, describeGrant, planById, plansFor, type Plan } from '../../sim/plans';
import { AHEAD_PENALTY, BRANCHES, cannotResearch, daysToFinish, researchSpeed, techById, TECHS, yearAt, type Tech } from '../../sim/research';
import type { Economy, World } from '../../sim/types';
import { Chart } from '../components/Chart';
import { Term } from '../components/bits';
import { useGame } from '../store';
import { money } from './EconomyPanels';
import { Frame, Link, Row } from './Sidebar';

const signed = (x: number, digits = 0) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(digits)}`;
const dayCount = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

function Why({ items }: { items: { text: string; points: number }[] }) {
  return (
    <ul className="sb-why">
      {items.map((r) => (
        <li key={r.text}>
          <span>{r.text}</span>
          <b>{signed(r.points, 1)}</b>
        </li>
      ))}
    </ul>
  );
}

// ---------- research ----------

type TechState = 'known' | 'working' | 'open' | 'locked';
const techState = (e: Economy, tech: Tech): TechState => (e.research.done.includes(tech.id) ? 'known' : e.research.slots.includes(tech.id) ? 'working' : cannotResearch(e.research, tech) ? 'locked' : 'open');
const STATE_WORD: Record<TechState, string> = { known: 'Known', working: 'In progress', open: 'Can be researched', locked: 'Locked' };
const STATE_MARK: Record<TechState, string> = { known: '✓', working: '▸', open: '○', locked: '·' };

export function ResearchPanel({ w, me }: { w: World; me: string }) {
  const e = w.economies[me];
  const r = e.research;
  const year = yearAt(w.startDate, w.day);
  const order = useGame.getState().economy;
  const idle = r.slots.filter((x) => !x).length;
  return (
    <Frame wide kicker="Research" title="Research" sub={`${r.done.length} of ${TECHS.length} technologies known · ${r.slots.length === 1 ? 'one research team' : `${r.slots.length} research teams`}${idle ? ` · ${idle} idle` : ''}`}>
      <h3>Research teams</h3>
      {r.slots.map((id, slot) => {
        const tech = id ? techById(id) : undefined;
        if (!tech)
          return (
            <div className="sb-prod" key={slot}>
              <div className="sb-line">
                <b>Team {slot + 1}</b>
                <span className="warn-text">! Idle</span>
              </div>
              <p>Pick a technology below and put this team on it.</p>
            </div>
          );
        const done = r.progress[tech.id] ?? 0;
        const speed = researchSpeed(tech, year);
        return (
          <div className="sb-prod" key={slot}>
            <div className="sb-line">
              <b>Team {slot + 1}</b>
              <button className="sb-mini" onClick={() => order({ type: 'setResearch', slot, tech: null })} aria-label={`Stand team ${slot + 1} down from ${tech.name}`}>
                Stand down
              </button>
            </div>
            <button className="sb-pick working" onClick={() => useGame.getState().select({ kind: 'tech', id: tech.id })}>
              <b>{tech.name}</b>
              <span>
                {Math.round((done / tech.days) * 100)}% · about {dayCount(daysToFinish(r, tech, year))} left{speed < 0.995 ? ` · at ${Math.round(speed * 100)}% speed (ahead of ${tech.year})` : ''}
              </span>
            </button>
            <div className="sb-bar" aria-hidden="true">
              <i style={{ width: `${(done / tech.days) * 100}%` }} />
            </div>
          </div>
        );
      })}
      <p className="sb-fine">
        Each technology has the year it really appeared. A team working ahead of that year is slower: speed = 1 / (1 + {AHEAD_PENALTY} x years ahead). Work already done is kept if you move a team.
      </p>

      {BRANCHES.map((b) => (
        <div key={b.id} className="sb-branch">
          <h3>{b.name}</h3>
          <p className="sb-fine">{b.note}</p>
          <ol className="sb-picks">
            {TECHS.filter((t) => t.branch === b.id).map((t) => {
              const state = techState(e, t);
              return (
                <li key={t.id}>
                  <button className={`sb-pick ${state}`} onClick={() => useGame.getState().select({ kind: 'tech', id: t.id })} aria-label={`${t.name}, ${t.year}. ${STATE_WORD[state]}. ${describeEffects(t.effects).join('. ')}`}>
                    <i aria-hidden="true">{STATE_MARK[state]}</i>
                    <b>{t.name}</b>
                    <em>{t.year}</em>
                    <span>{describeEffects(t.effects).join(' · ')}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      <p className="sb-fine">✓ known · ▸ in progress · ○ can be researched · · needs the one before it</p>
    </Frame>
  );
}

export function TechView({ w, me, id }: { w: World; me: string; id: string }) {
  const tech = techById(id);
  const e = w.economies[me];
  if (!tech || !e) return null;
  const r = e.research;
  const year = yearAt(w.startDate, w.day);
  const state = techState(e, tech);
  const blocked = cannotResearch(r, tech);
  const speed = researchSpeed(tech, year);
  const branch = BRANCHES.find((b) => b.id === tech.branch)!;
  const order = useGame.getState().economy;
  const done = r.progress[tech.id] ?? 0;
  const left = daysToFinish(r, tech, year);
  return (
    <Frame wide kicker={`Technology · ${branch.name}`} title={tech.name} sub={`First used around ${tech.year} · ${STATE_WORD[state].toLowerCase()}`}>
      <p className="sb-note">{tech.what}</p>
      <h3>What it gives you</h3>
      <ul className="sb-effects">
        {describeEffects(tech.effects).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      {state !== 'known' && (
        <>
          <h3>The work</h3>
          <div className="sb-rows">
            <Row label="Work needed" value={`${tech.days} team-days`} />
            <Row label="Done so far" value={`${Math.round((done / tech.days) * 100)}%`} bar={(done / tech.days) * 100} />
            <Row label="A team's speed on it today" value={`${Math.round(speed * 100)}%`} />
            <Row label="Would be finished in" value={`about ${dayCount(left)}`} />
          </div>
          {speed < 0.995 ? (
            <p className="sb-fine">
              It is ahead of its time: {tech.year} is {(tech.year - year).toFixed(1)} years away, so a team works at 1 / (1 + {AHEAD_PENALTY} x {(tech.year - year).toFixed(1)}) = {Math.round(speed * 100)}% speed for now, and faster as {tech.year} comes closer.
            </p>
          ) : (
            <p className="sb-fine">Its time has come: a team works on it at full speed.</p>
          )}
          {blocked ? (
            <p className="sb-note warn">Not yet: {blocked}.</p>
          ) : (
            <div className="sb-actions">
              {r.slots.map((on, slot) => {
                const other = on && on !== tech.id ? techById(on) : undefined;
                return on === tech.id ? (
                  <button key={slot} className="sb-btn on" onClick={() => order({ type: 'setResearch', slot, tech: null })}>
                    Team {slot + 1} is working on this
                    <small>Click to stand the team down. The work done is kept.</small>
                  </button>
                ) : (
                  <button key={slot} className="sb-btn" onClick={() => order({ type: 'setResearch', slot, tech: tech.id })}>
                    Put team {slot + 1} on this
                    <small>{other ? `It stops work on ${other.name} (${Math.round(((r.progress[other.id] ?? 0) / other.days) * 100)}% done, kept).` : 'The team is idle.'}</small>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
      <h3>What really happened</h3>
      <p className="sb-note">{tech.history}</p>
      <div className="sb-actions">
        <Link to={{ kind: 'research' }}>All research</Link>
      </div>
    </Frame>
  );
}

// ---------- national plans ----------

const planCost = (plan: Plan, gdp: number) => (plan.cost > 0 ? `${money(plan.cost * gdp)} a month` : 'no money');
const months = (days: number) => `${days} days`;

export function PlansPanel({ w, me }: { w: World; me: string }) {
  const e = w.economies[me];
  const v = economyView(w, me);
  const year = yearAt(w.startDate, w.day);
  const active = e.plan.active ? planById(e.plan.active) : undefined;
  const all = plansFor(me);
  const own = all.filter((p) => p.country);
  const general = all.filter((p) => !p.country);
  const row = (p: Plan) => {
    const done = e.plan.done.includes(p.id);
    const running = e.plan.active === p.id;
    const blocked = cannotStartPlan(e.plan, p, me, year, v.atWar);
    const state = done ? 'known' : running ? 'working' : blocked && !e.plan.active ? 'locked' : 'open';
    const gives = [...describeGrant(p.grant), ...describeEffects(p.effects)];
    return (
      <li key={p.id}>
        <button className={`sb-pick ${state}`} onClick={() => useGame.getState().select({ kind: 'plan', id: p.id })} aria-label={`${p.name}. ${done ? 'Carried out' : running ? 'Under way' : blocked ?? 'Can be started'}. ${gives.join('. ')}`}>
          <i aria-hidden="true">{STATE_MARK[state]}</i>
          <b>{p.name}</b>
          <em>
            {p.days} d{p.cost > 0 ? ` · ${Math.round(p.cost * 100)}%` : ' · free'}
          </em>
          <span>{gives.join(' · ')}</span>
        </button>
      </li>
    );
  };
  return (
    <Frame wide kicker="National plan" title="National plan" sub={active ? `${active.name}: day ${e.plan.daysDone} of ${active.days}` : `No plan under way · ${e.plan.done.length} carried out`}>
      {active ? (
        <div className="sb-prod">
          <div className="sb-line">
            <b>{active.name}</b>
            <span>{dayCount(active.days - e.plan.daysDone)} left</span>
          </div>
          <div className="sb-bar" aria-hidden="true">
            <i style={{ width: `${(e.plan.daysDone / active.days) * 100}%` }} />
          </div>
          <p>
            Costing {planCost(active, v.nominalGDP)}. When it ends: {[...describeGrant(active.grant), ...describeEffects(active.effects)].join('; ').toLowerCase()}.
          </p>
          <div className="sb-actions">
            <Link to={{ kind: 'plan', id: active.id }}>Details</Link>
          </div>
        </div>
      ) : (
        <p className="sb-note warn">! No plan is under way. Pick one below.</p>
      )}
      <p className="sb-fine">
        You run one plan at a time, and each can be carried out once. The money is a line in the budget; the real price is the other plans you are not running meanwhile (<Term id="opportunity-cost">opportunity cost</Term>). The second figure on each line is
        its cost as a share of a month's output.
      </p>
      {own.length > 0 && (
        <>
          <h3>{countryByName(me).adjective} programmes of the 1930s</h3>
          <ol className="sb-picks">{own.map(row)}</ol>
        </>
      )}
      <h3>Open to every country</h3>
      <ol className="sb-picks">{general.map(row)}</ol>
      <p className="sb-fine">✓ carried out · ▸ under way · ○ can be started · · not available yet</p>
    </Frame>
  );
}

export function PlanView({ w, me, id }: { w: World; me: string; id: string }) {
  const plan = planById(id);
  const e = w.economies[me];
  if (!plan || !e) return null;
  const v = economyView(w, me);
  const year = yearAt(w.startDate, w.day);
  const done = e.plan.done.includes(plan.id);
  const running = e.plan.active === plan.id;
  const blocked = cannotStartPlan(e.plan, plan, me, year, v.atWar);
  const order = useGame.getState().economy;
  const gives = [...describeGrant(plan.grant), ...describeEffects(plan.effects)];
  const after = v.budget.balance - (running ? 0 : plan.cost * v.nominalGDP);
  return (
    <Frame wide kicker={plan.country ? `National plan · ${plan.country}` : 'National plan'} title={plan.name} sub={done ? 'Carried out' : running ? `Under way: day ${e.plan.daysDone} of ${plan.days}` : `${months(plan.days)} · ${planCost(plan, v.nominalGDP)}`}>
      <p className="sb-note">{plan.what}</p>
      <h3>{done ? 'What it gave you' : 'What it gives you when it ends'}</h3>
      <ul className="sb-effects">
        {gives.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      {!done && (
        <>
          <h3>What it costs</h3>
          <div className="sb-rows">
            <Row label="Time" value={running ? `${dayCount(plan.days - e.plan.daysDone)} left of ${plan.days}` : months(plan.days)} bar={running ? (e.plan.daysDone / plan.days) * 100 : undefined} />
            <Row label="Money" value={plan.cost > 0 ? `${money(plan.cost * v.nominalGDP)} a month (${Math.round(plan.cost * 100)}% of output)` : 'Nothing'} />
            <Row label={running ? 'Budget balance now' : 'Budget balance with it'} value={`${after >= 0 ? '+' : ''}${money(after)} a month`} />
          </div>
          <div className="sb-actions">
            {running ? (
              <button className="sb-btn danger" onClick={() => order({ type: 'cancelPlan' })}>
                Abandon this plan
                <small>The {dayCount(e.plan.daysDone)} of work done would be lost.</small>
              </button>
            ) : (
              <button className="sb-btn" disabled={!!blocked} onClick={() => order({ type: 'startPlan', plan: plan.id })}>
                Start this plan
                <small>{blocked ? `Not now: ${blocked}.` : `No other plan can run for ${plan.days} days.`}</small>
              </button>
            )}
          </div>
        </>
      )}
      {plan.history && (
        <>
          <h3>What really happened</h3>
          <p className="sb-note">{plan.history}</p>
        </>
      )}
      <div className="sb-actions">
        <Link to={{ kind: 'plans' }}>All national plans</Link>
      </div>
    </Frame>
  );
}

// ---------- the home front ----------

export function HomeFrontPanel({ w, me }: { w: World; me: string }) {
  const e = w.economies[me];
  const v = economyView(w, me);
  const government = e.government;
  const h = e.history;
  const yearOf = (day: number) => String(Math.floor(yearAt(w.startDate, day)));
  const stabilityDown = v.stabilityReasons.filter((r) => r.points < 0);
  const stabilityUp = v.stabilityReasons.filter((r) => r.points > 0);
  const nextLaw = e.conscription + 1 < CONSCRIPTION.length ? e.conscription + 1 : null;
  const lawBlocked = nextLaw === null ? null : conscriptionBlocked(e, me, nextLaw);
  return (
    <Frame wide kicker="Home front" title="The home front" sub={`Stability ${Math.round(e.stability)} · war support ${Math.round(e.warSupport)}${e.governmentsFallen ? ` · ${e.governmentsFallen} ${e.governmentsFallen === 1 ? 'government has' : 'governments have'} fallen` : ''}`}>
      <h3>
        <Term id="stability">Stability</Term>
      </h3>
      <div className="sb-rows">
        <Row label="Stability" value={`${Math.round(e.stability)} of 100`} bar={e.stability} warn={e.stability < 50} />
        <Row label="Heading for" value={`${Math.round(v.stabilityTarget)}`} />
      </div>
      <p className="sb-note">Starting from 75{v.stabilityReasons.length ? ', what moves it:' : ', nothing is moving it.'}</p>
      <Why items={[...stabilityDown, ...stabilityUp]} />
      {e.stability < CRISIS_STABILITY ? (
        <p className="sb-note warn">
          ! Crisis: stability has been below {CRISIS_STABILITY} for {e.crisisMonths} of {CRISIS_MONTHS} months. At {CRISIS_MONTHS} the government falls: the national plan is abandoned and war support drops by 10.
        </p>
      ) : (
        <p className="sb-fine">
          Stability moves a fifth of the way to where it is heading each month. Below 50, strikes slow every factory{v.factors.stability < 1 ? ` (now -${((1 - v.factors.stability) * 100).toFixed(1)}%)` : ''}. Below {CRISIS_STABILITY} for {CRISIS_MONTHS} months
          in a row, the government falls.
        </p>
      )}

      <h3>
        <Term id="war-support">War support</Term>
      </h3>
      <div className="sb-rows">
        <Row label="War support" value={`${Math.round(e.warSupport)} of 100`} bar={e.warSupport} warn={v.atWar && e.warSupport < UNWANTED_WAR} />
        <Row label="Heading for" value={`${Math.round(v.warSupportTarget)}`} />
      </div>
      <p className="sb-note">What it is made of:</p>
      <Why items={v.warSupportReasons} />
      <p className="sb-fine">
        It also moves a fifth of the way each month. Each battle won adds 2 to the mood at home and each one lost takes 2 away (within 15 either way); the mood fades by a fifth a month. <Term id="war-weariness">War weariness</Term> grows half a point for every
        month at war.
      </p>

      <h3>What war support decides</h3>
      <div className="sb-rows">
        <Row
          label="Conscription"
          value={nextLaw === null ? 'The widest law is in force' : lawBlocked ? `${CONSCRIPTION[nextLaw].name}: ${lawBlocked}` : `${CONSCRIPTION[nextLaw].name}: allowed`}
        />
        <Row label="Taxes without unrest" value={`up to ${Math.round(v.taxThreshold * 100)}% (now ${Math.round(e.taxRate * 100)}%)`} />
        <Row label="Bond sales in wartime" value={v.atWar ? `${signed((v.patriotism - 1) * 100)}%` : 'Only matters at war'} />
        <Row label="Army recovery" value={v.morale < 1 ? `${signed((v.morale - 1) * 100)}%: people do not want this war` : 'Full speed'} />
      </div>
      <p className="sb-fine">
        Wider conscription laws need war support of {CONSCRIPTION_SUPPORT.slice(2).map((n) => Math.max(0, n - SUPPORT_LENIENCY[government])).join(', ')} under your kind of government. At war, people accept taxes up to 25% plus 15 points x war support. Below{' '}
        {UNWANTED_WAR}, a war costs stability and your divisions recover more slowly; at {UNITED} or more the country is united and stability gains 5. Declaring war costs stability if war support is under 50
        {government === 'democracy' ? ', and most of all in a democracy' : ''}.
      </p>

      {h.length >= 3 && (
        <>
          <div className="sb-chart">
            <Chart
              n={h.length}
              title={`Stability and war support over the last ${h.length} months. Stability is now ${Math.round(e.stability)}, war support ${Math.round(e.warSupport)}.`}
              series={[
                { data: h.map((r) => r.stability), color: '#9cc8ff', label: 'Stability' },
                { data: h.map((r) => r.warSupport), color: '#ffc46b', dash: true, label: 'War support' },
              ]}
              xLabels={[{ i: 0, text: yearOf(h[0].day) }, { i: h.length - 1, text: yearOf(h[h.length - 1].day) }]}
              format={(x) => x.toFixed(0)}
              min={-6}
              max={106}
              ticks={[0, 50, 100]}
              pad={{ l: 44, r: 16 }}
            />
          </div>
          <p className="sb-fine">Solid blue: stability. Dashed gold: war support.</p>
        </>
      )}
      <div className="sb-actions">
        <Link to={{ kind: 'plans' }}>National plan</Link>
        <Link to={{ kind: 'economy' }}>Economy: budget, taxes, debt and inflation</Link>
      </div>
    </Frame>
  );
}
