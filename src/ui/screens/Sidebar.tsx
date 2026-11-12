/** The details sidebar: opens for whatever you click on the map. All numbers come from the engine. */
import { useRef, type ReactNode } from 'react';
import { DIG_IN_PER_DAY, outlook, outlookAt, type Outlook } from '../../sim/combat';
import { COUNTRIES, countryByName } from '../../sim/countries';
import { visibleProvinces } from '../../sim/intel';
import { daysToEnter, PROVINCES, routeDays } from '../../sim/map';
import { economyView, OIL, STEEL, tallies } from '../../sim/economy';
import { DEPOTS, infrastructure, linkedProvinces, supplyCapacity } from '../../sim/supply';
import type { BattleReport, Unit, World } from '../../sim/types';
import { atWar, enemiesOf } from '../../sim/war';
import { dateLabel } from '../../sim/world';
import { TERRAIN_NOTE } from '../map/colours';
import { useGame, type Selection } from '../store';
import { EconomyPanel, ProductionPanel } from './EconomyPanels';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');
const pct = (x: number) => `${Math.round(x)}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const days = (d: number) => (d === Infinity ? 'indefinitely' : d < 1.5 ? 'about a day' : `about ${Math.round(d)} days`);
const GOVERNMENT = { democracy: 'Democracy', authoritarian: 'Authoritarian government', fascist: 'Fascist dictatorship', communist: 'Communist dictatorship' };

function types(units: Unit[]): string {
  const n = { infantry: 0, armour: 0, artillery: 0 };
  for (const u of units) n[u.type]++;
  return (['infantry', 'armour', 'artillery'] as const).filter((t) => n[t]).map((t) => `${n[t]} ${t}`).join(', ');
}

export function Row({ label, value, bar, warn }: { label: string; value: ReactNode; bar?: number; warn?: boolean }) {
  return (
    <div className="sb-row">
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      {bar !== undefined && (
        <div className="sb-bar" aria-hidden="true">
          <i style={{ width: `${Math.max(0, Math.min(100, bar))}%` }} className={warn ? 'warn' : ''} />
        </div>
      )}
    </div>
  );
}

export function Frame({ kicker, title, sub, wide, children }: { kicker: string; title: string; sub?: ReactNode; wide?: boolean; children: ReactNode }) {
  const select = useGame((s) => s.select);
  return (
    <aside className={`sb${wide ? ' wide' : ''}`} aria-label="Details">
      <div className="sb-head">
        <span className="sb-kicker">{kicker}</span>
        <button className="mt-icon" onClick={() => select(null)} aria-label="Close sidebar">
          ×
        </button>
      </div>
      <div role="status">
        <h2>{title}</h2>
        {sub && <p className="sb-sub">{sub}</p>}
      </div>
      {children}
    </aside>
  );
}

export function Link({ to, province, children }: { to: Selection; province?: number; children: ReactNode }) {
  const select = useGame((s) => s.select);
  const focusOn = useGame((s) => s.focusOn);
  return (
    <button
      className="sb-link"
      onClick={() => {
        select(to);
        if (province !== undefined) focusOn(province);
      }}
    >
      {children}
    </button>
  );
}

function OutlookBox({ o, mine }: { o: Outlook; mine: 'attacker' | 'defender' | null }) {
  const verdict = o.favours === 'even' ? 'Too close to call' : o.favours === 'attacker' ? 'The attackers should break through' : 'The defenders should hold';
  const good = mine && o.favours !== 'even' ? o.favours === mine : null;
  const factors: string[] = [];
  if (o.terrain < 1) factors.push(`Terrain: attackers hit ${pct((1 - o.terrain) * 100)} less hard`);
  if (o.dugIn > 1.005) factors.push(`Defenders dug in: +${pct((o.dugIn - 1) * 100)} defence`);
  if (o.attackerSupply < 0.995) factors.push(`Attackers short of supply: ${pct((1 - o.attackerSupply) * 100)} weaker`);
  if (o.defenderSupply < 0.995) factors.push(`Defenders short of supply: ${pct((1 - o.defenderSupply) * 100)} weaker`);
  if (o.directions > 1) factors.push(`Attack from ${o.directions} directions: room for ${o.attackersFighting} attackers at once`);
  if (o.attackers > o.attackersFighting) factors.push(`${plural(o.attackers - o.attackersFighting, 'attacking division')} waiting in reserve (only ${o.attackersFighting} fit in the fight)`);
  if (o.defenders > o.defendersFighting) factors.push(`${plural(o.defenders - o.defendersFighting, 'defending division')} in reserve`);
  return (
    <div className="sb-outlook">
      <h3>Outlook today</h3>
      <p className={good === null ? '' : good ? 'good' : 'bad'}>
        <b>{verdict}.</b>
      </p>
      <Row label={`Attackers (${o.attackers}) deal per day`} value={o.attack.toFixed(0)} />
      <Row label={`Defenders (${o.defenders}) deal per day`} value={o.defence.toFixed(0)} />
      <Row label="Attackers can keep going for" value={days(o.attackersLast)} />
      <Row label="Defenders can hold for" value={days(o.defendersLast)} />
      {factors.length > 0 && (
        <ul>
          {factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <p className="sb-fine">A rough guide: it leaves out luck (10% either way) and any reinforcements.</p>
    </div>
  );
}

function Units({ w, ids }: { w: World; ids: number[] }) {
  const { select, marchTo, halt, setOrdering, focusOn } = useGame.getState();
  const ordering = useGame((s) => s.ordering);
  const notice = useGame((s) => s.notice);
  const input = useRef<HTMLInputElement>(null);
  const units = w.units.filter((u) => ids.includes(u.id));
  if (!units.length) return null;
  const places = [...new Set(units.map((u) => u.at))];
  const where = places.length === 1 ? PROVINCES[places[0]].name : `${places.length} provinces`;
  const moving = units.filter((u) => u.path.length);
  const targets = [...new Set(moving.map((u) => u.path[u.path.length - 1]))];
  const next = [...new Set(moving.map((u) => u.path[0]))];
  const attacking = next.filter((p) => w.units.some((e) => e.at === p && atWar(w, e.owner, units[0].owner)));
  const eta = moving.length ? Math.max(...moving.map((u) => routeDays(u.at, u.path, u.type) - u.progress * daysToEnter(u.at, u.path[0], u.type))) : 0;
  const dug = avg(units.filter((u) => !u.path.length).map((u) => u.dugIn));
  const order = !moving.length
    ? `Standing${dug > 0 ? `, dug in ${Math.round(dug)} days (+${pct(dug * DIG_IN_PER_DAY * 100)} defence)` : ''}`
    : `${attacking.length ? `Attacking ${list(attacking.map((p) => PROVINCES[p].name))}` : 'Marching'}${targets.length === 1 ? `${attacking.length && attacking[0] === targets[0] ? '' : ` to ${PROVINCES[targets[0]].name}`}` : ''}${attacking.length ? '' : `, ${days(eta)}`}${moving.length < units.length ? ` (${moving.length} of ${units.length})` : ''}`;
  const supply = avg(units.map((u) => u.supply)) * 100;
  const go = () => {
    const name = input.current?.value.trim().toLowerCase();
    const p = PROVINCES.find((q) => q.name.toLowerCase() === name || q.city?.toLowerCase() === name);
    if (p) {
      marchTo(p.id);
      focusOn(p.id);
      if (input.current) input.current.value = '';
    } else useGame.setState({ notice: 'No province or city with that name. Pick one from the list.' });
  };
  return (
    <Frame kicker="Your army" title={plural(units.length, 'division')} sub={`${where} · ${order}`}>
      <div className="sb-rows">
        <Row label="Divisions" value={types(units)} />
        <Row label="Strength" value={pct(avg(units.map((u) => u.strength)))} bar={avg(units.map((u) => u.strength))} />
        <Row label="Organisation" value={pct(avg(units.map((u) => u.organisation)))} bar={avg(units.map((u) => u.organisation))} />
        <Row label="Supply" value={supply >= 99.5 ? 'Full' : supply < 0.5 ? 'Cut off' : pct(supply)} bar={supply} warn={supply < 70} />
      </div>
      {supply < 99.5 && (
        <p className="sb-note">
          {supply < 0.5
            ? 'Cut off: no path through your own land back to a depot. Organisation falls to zero, then the divisions waste away.'
            : `Too many divisions in one province: it feeds ${places.map((p) => supplyCapacity(p)).join(' and ')}. Organisation cannot rise above the supply level. Spread out.`}
        </p>
      )}
      {attacking.map((p) => {
        const o = outlookAt(w, p);
        return o ? <OutlookBox key={p} o={o} mine="attacker" /> : null;
      })}
      <p className="sb-notice" role="status">
        {ordering ? 'Now click the destination on the map. Clicking a province with enemy divisions in it means attack.' : notice}
      </p>
      <div className="sb-actions">
        <button className={`sb-btn${ordering ? ' on' : ''}`} aria-pressed={ordering} onClick={() => setOrdering(!ordering)}>
          {ordering ? 'Cancel' : 'Move or attack'} <kbd>G</kbd>
        </button>
        <button className="sb-btn" onClick={halt} disabled={!moving.length}>
          Halt <kbd>H</kbd>
        </button>
        {units.length > 1 && (
          <button className="sb-btn" onClick={() => select({ kind: 'units', ids: [...units].sort((a, b) => b.organisation - a.organisation || a.id - b.id).slice(0, Math.ceil(units.length / 2)).map((u) => u.id) })}>
            Select the readiest half
          </button>
        )}
      </div>
      <form
        className="sb-goto"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <label htmlFor="goto">Or type a destination</label>
        <div>
          <input id="goto" ref={input} list="provinces" placeholder="Province or city" autoComplete="off" />
          <button className="sb-btn" type="submit">
            Go
          </button>
        </div>
        <datalist id="provinces">
          {PROVINCES.map((p) => (
            <option key={p.id} value={p.city && p.city !== p.name ? p.city : p.name}>
              {p.city && p.city !== p.name ? `${p.name}, ` : ''}
              {w.controller[p.id]}
            </option>
          ))}
        </datalist>
      </form>
      <h3>Divisions</h3>
      <ul className="sb-units">
        {units.map((u) => (
          <li key={u.id}>
            <button onClick={() => select({ kind: 'units', ids: [u.id] })} aria-label={`Select only this ${u.type} division, strength ${pct(u.strength)}, organisation ${pct(u.organisation)}`} disabled={units.length === 1}>
              <span>{u.type}</span>
              <span>str {pct(u.strength)}</span>
              <span>org {pct(u.organisation)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sb-fine">Shift-click another of your counters to add it. Click a division to select only that one.</p>
    </Frame>
  );
}

function Province({ w, id }: { w: World; id: number }) {
  const p = PROVINCES[id];
  const me = w.player;
  const holder = w.controller[id];
  const here = w.units.filter((u) => u.at === id);
  const seen = visibleProvinces(w, me)[id];
  const mine = here.filter((u) => u.owner === me);
  const others = [...new Set(here.filter((u) => u.owner !== me).map((u) => u.owner))];
  const infra = infrastructure(p);
  const depot = (DEPOTS[holder] ?? []).includes(id);
  const linked = me && holder === me ? linkedProvinces(w.controller, me)[id] : null;
  const battle = w.battles.find((b) => b.province === id);
  const civ = w.factories.civ[id];
  const mil = w.factories.mil[id];
  const canBuild = !!me && holder === me && p.owner === me && !w.capitulated.includes(me);
  const queued = me && w.economies[me] ? w.economies[me].construction.filter((c) => c.province === id).length : 0;
  const build = (kind: 'civ' | 'mil') => {
    useGame.getState().economy({ type: 'build', kind, province: id });
    useGame.getState().select({ kind: 'production' });
  };
  return (
    <Frame kicker="Province" title={p.name} sub={`${p.city && p.city !== p.name ? `${p.city} · ` : ''}${holder}${p.capital ? ' · capital' : ''}${holder !== p.owner ? ` · taken from ${p.owner}` : ''}`}>
      <div className="sb-rows">
        <Row label="Terrain" value={p.terrain} />
        <Row label="Infrastructure" value={`${infra} of 5`} bar={infra * 20} />
        <Row label="Feeds" value={`${plural(supplyCapacity(id), 'division')}${seen || holder === me ? `, ${here.length} here` : ''}`} />
        <Row label="Victory points" value={p.victoryPoints} />
        <Row label="Factories" value={civ + mil ? `${civ} civilian, ${mil} military` : 'None'} />
        {(STEEL[id] > 0 || OIL[id] > 0) && <Row label="Raw materials a month" value={[STEEL[id] > 0 ? `${STEEL[id].toFixed(1)} steel` : '', OIL[id] > 0 ? `${OIL[id].toFixed(1)} oil` : ''].filter(Boolean).join(', ')} />}
        {depot && <Row label="Supply depot" value={`for ${holder}`} />}
        {linked === false && <Row label="Supply" value="Cut off from your depots" />}
      </div>
      <p className="sb-note">{TERRAIN_NOTE[p.terrain]}</p>
      {holder !== p.owner && civ + mil > 0 && <p className="sb-fine">Occupied: its factories work at 30% for {holder}, and half its steel and oil is taken.</p>}
      {canBuild && (
        <>
          <h3>Build here</h3>
          <div className="sb-actions">
            <button className="sb-btn" onClick={() => build('mil')}>
              Military factory
            </button>
            <button className="sb-btn" onClick={() => build('civ')}>
              Civilian factory
            </button>
            <Link to={{ kind: 'production' }}>Production: the building queue{queued ? ` (${queued} here)` : ''}</Link>
          </div>
        </>
      )}
      {battle && (
        <div className="sb-actions">
          <Link to={{ kind: 'battle', id: battle.id }}>Battle in progress: see the outlook</Link>
        </div>
      )}
      <h3>Divisions here</h3>
      {mine.length > 0 && (
        <div className="sb-actions">
          <Link to={{ kind: 'units', ids: mine.map((u) => u.id) }}>
            Select your {plural(mine.length, 'division')} ({types(mine)})
          </Link>
        </div>
      )}
      {seen ? (
        others.length ? (
          <div className="sb-actions">
            {others.map((o) => (
              <Link key={o} to={{ kind: 'stack', province: id, owner: o }}>
                {plural(here.filter((u) => u.owner === o).length, `${countryByName(o).adjective} division`)}
              </Link>
            ))}
          </div>
        ) : (
          !mine.length && <p className="sb-note">None.</p>
        )
      ) : (
        <p className="sb-note">No reports. You only see foreign divisions on your own land, where your divisions stand, and in the provinces next to those.</p>
      )}
      <h3>Country</h3>
      <div className="sb-actions">
        <Link to={{ kind: 'country', name: holder }}>{holder}: details and diplomacy</Link>
      </div>
      <h3>Neighbouring provinces</h3>
      <div className="sb-chips">
        {p.neighbours.map((n) => (
          <Link key={n} to={{ kind: 'province', id: n }} province={n}>
            {PROVINCES[n].name}
          </Link>
        ))}
      </div>
    </Frame>
  );
}

function ForeignStack({ w, province, owner }: { w: World; province: number; owner: string }) {
  const me = w.player;
  const units = w.units.filter((u) => u.at === province && u.owner === owner);
  const enemy = !!me && atWar(w, me, owner);
  const c = countryByName(owner);
  // What it would look like if every division of yours next door attacked.
  const next = me ? w.units.filter((u) => u.owner === me && PROVINCES[province].neighbours.includes(u.at)) : [];
  const o = enemy ? outlook(next.map((u) => ({ ...u, path: [province] })), units, province) : null;
  if (!units.length) return <Frame kicker="Intelligence report" title="Nothing here now" sub={PROVINCES[province].name}>{null}</Frame>;
  return (
    <Frame kicker="Intelligence report" title={`${c.adjective} forces in ${PROVINCES[province].name}`} sub={enemy ? 'At war with you' : 'Neutral'}>
      <div className="sb-rows">
        <Row label="Strength" value={plural(units.length, 'division')} />
        <Row label="Type" value={types(units)} />
        <Row label="Condition" value={pct(avg(units.map((u) => u.strength)))} bar={avg(units.map((u) => u.strength))} />
        <Row label="Organisation" value={pct(avg(units.map((u) => u.organisation)))} bar={avg(units.map((u) => u.organisation))} />
        <Row label="Terrain" value={PROVINCES[province].terrain} />
      </div>
      {o ? (
        <>
          <p className="sb-note">If all {plural(next.length, 'division')} you have next door attacked now:</p>
          <OutlookBox o={o} mine="attacker" />
        </>
      ) : (
        enemy && <p className="sb-note">You have no divisions next to this province.</p>
      )}
      <p className="sb-fine">You see foreign divisions only next to your own land and troops. For now the count is exact; estimates that can be wrong arrive with air reconnaissance.</p>
      <div className="sb-actions">
        <Link to={{ kind: 'province', id: province }}>The province</Link>
        <Link to={{ kind: 'country', name: owner }}>{owner}: details and diplomacy</Link>
      </div>
    </Frame>
  );
}

function CountryView({ w, name }: { w: World; name: string }) {
  const { declareWar, makePeace } = useGame.getState();
  const c = COUNTRIES.find((k) => k.name === name);
  if (!c) return null;
  const me = w.player;
  const gone = w.capitulated.includes(name);
  const held = w.controller.filter((x) => x === name).length;
  const home = PROVINCES.filter((p) => p.owner === name);
  const vpHome = home.reduce((a, p) => a + p.victoryPoints, 0);
  const vpLost = home.filter((p) => w.controller[p.id] !== name).reduce((a, p) => a + p.victoryPoints, 0);
  const army = w.units.filter((u) => u.owner === name);
  const seen = me && me !== name ? visibleProvinces(w, me) : null;
  const visible = seen ? army.filter((u) => seen[u.at]) : army;
  const enemies = enemiesOf(w, name);
  const capital = home.find((p) => p.capital);
  const war = !!me && atWar(w, me, name);
  const industry = gone ? undefined : tallies(w).get(name);
  const economy = name === me && !gone && w.economies[name] ? economyView(w, name, industry) : undefined;
  return (
    <Frame kicker={name === me ? 'Your country' : 'Country'} title={name} sub={`${GOVERNMENT[c.government]}${capital ? ` · capital ${capital.city}` : ''}`}>
      {gone ? (
        <p className="sb-note">{name} has surrendered. Its army has left the map and its land is occupied.</p>
      ) : (
        <>
          <div className="sb-rows">
            <Row label="Status" value={name === me ? 'You lead it' : war ? 'At war with you' : 'At peace with you'} />
            <Row label="At war with" value={enemies.length ? list(enemies) : 'Nobody'} />
            <Row label={name === me ? 'Army' : 'Army you can see'} value={visible.length ? `${plural(visible.length, 'division')} (${types(visible)})` : 'None in sight'} />
            {name !== me && <Row label="Army in 1936" value={plural(c.startArmy[0] + c.startArmy[1] + c.startArmy[2], 'division')} />}
            <Row label="Provinces held" value={held} />
            {industry && <Row label="Factories" value={`${Math.floor(industry.civ + 1e-9)} civilian, ${Math.floor(industry.mil + 1e-9)} military`} />}
            {name === me && economy && <Row label="Output a month" value={`${Math.round(economy.nominalGDP)}m`} />}
            <Row label="Home victory points lost" value={`${vpLost} of ${vpHome}`} bar={vpHome ? (vpLost / vpHome) * 100 : 0} warn />
          </div>
          <p className="sb-note">A country surrenders when its enemies hold 60% of its home victory points ({Math.ceil(vpHome * 0.6)} for {name}).</p>
          {me && name !== me && !w.capitulated.includes(me) && (
            <div className="sb-actions">
              {war ? (
                <button className="sb-btn" onClick={() => makePeace(name)}>
                  Make peace
                </button>
              ) : (
                <button className="sb-btn danger" onClick={() => declareWar(name)}>
                  Declare war on {name}
                </button>
              )}
            </div>
          )}
          {me && name !== me && (
            <p className="sb-fine">
              For now war and peace are instant and nobody else joins in. Causes for war, public support, allies and peace terms arrive with diplomacy in Stage F.
            </p>
          )}
        </>
      )}
      {name === me && !gone && (
        <div className="sb-actions">
          <Link to={{ kind: 'economy' }}>Economy: budget, taxes, debt and inflation</Link>
          <Link to={{ kind: 'production' }}>Production: factories, divisions and manpower</Link>
        </div>
      )}
      {capital && (
        <div className="sb-actions">
          <Link to={{ kind: 'province', id: capital.id }} province={capital.id}>
            Show {capital.city} on the map
          </Link>
        </div>
      )}
    </Frame>
  );
}

function BattleView({ w, id }: { w: World; id: number }) {
  const b = w.battles.find((x) => x.id === id);
  if (!b) return null;
  const me = w.player;
  const o = outlookAt(w, b.province);
  const mine = me && b.attackers.includes(me) ? 'attacker' : me && b.defenders.includes(me) ? 'defender' : null;
  return (
    <Frame kicker="Battle" title={`Battle of ${PROVINCES[b.province].name}`} sub={`Since ${dateLabel({ startDate: w.startDate, day: b.startDay })} · day ${w.day - b.startDay + 1}`}>
      <div className="sb-rows">
        <Row label="Attacking" value={`${list(b.attackers)} (${plural(b.attackerUnits.length, 'division')} so far)`} />
        <Row label="Defending" value={`${list(b.defenders)} (${plural(b.defenderUnits.length, 'division')} so far)`} />
        <Row label="Attackers' losses" value={`${b.attackerLosses.toFixed(1)} divisions`} />
        <Row label="Defenders' losses" value={`${b.defenderLosses.toFixed(1)} divisions`} />
        <Row label="Terrain" value={PROVINCES[b.province].terrain} />
      </div>
      {o && <OutlookBox o={o} mine={mine} />}
      <div className="sb-actions">
        <Link to={{ kind: 'province', id: b.province }}>The province</Link>
      </div>
    </Frame>
  );
}

function ReportBody({ r, w }: { r: BattleReport; w: World }) {
  const date = (day: number) => dateLabel({ startDate: w.startDate, day });
  return (
    <>
      <div className="sb-rows">
        <Row label="Result" value={r.winner === 'attacker' ? `${list(r.attackers)} took it` : `${list(r.defenders)} held`} />
        <Row label="Fought" value={r.startDay === r.endDay ? date(r.startDay) : `${date(r.startDay)} to ${date(r.endDay)}`} />
        <Row label="Attacking" value={`${list(r.attackers)}, ${plural(r.attackerDivisions, 'division')}`} />
        <Row label="Defending" value={`${list(r.defenders)}, ${plural(r.defenderDivisions, 'division')}`} />
        <Row label="Losses" value={`${r.attackerLosses} attacking, ${r.defenderLosses} defending`} />
        {r.surrendered > 0 && <Row label="Surrendered" value={plural(r.surrendered, 'division')} />}
      </div>
      <h3>Why it ended this way</h3>
      <ol className="sb-causes">
        {r.causes.map((c) => (
          <li key={c.text}>{c.text}</li>
        ))}
      </ol>
    </>
  );
}

function ReportView({ w, id }: { w: World; id: number }) {
  const r = w.reports.find((x) => x.id === id);
  if (!r) return null;
  return (
    <Frame kicker="Battle report" title={`Battle of ${PROVINCES[r.province].name}`}>
      <ReportBody r={r} w={w} />
      <div className="sb-actions">
        <Link to={{ kind: 'province', id: r.province }} province={r.province}>
          Show on the map
        </Link>
        <Link to={{ kind: 'reports' }}>All battle reports</Link>
      </div>
    </Frame>
  );
}

function Reports({ w }: { w: World }) {
  const me = w.player;
  const mine = [...w.reports].reverse().filter((r) => !me || r.attackers.includes(me) || r.defenders.includes(me));
  return (
    <Frame kicker="Battle reports" title="Battle reports" sub="Newest first">
      {mine.length ? (
        <div className="sb-actions">
          {mine.slice(0, 30).map((r) => {
            const won = me ? (r.winner === 'attacker') === r.attackers.includes(me) : null;
            return (
              <Link key={r.id} to={{ kind: 'report', id: r.id }} province={r.province}>
                {PROVINCES[r.province].name}: {won === null ? (r.winner === 'attacker' ? 'taken' : 'held') : won ? 'won' : 'lost'} · {dateLabel({ startDate: w.startDate, day: r.endDay })}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="sb-note">No battle has ended yet.</p>
      )}
    </Frame>
  );
}

export function Sidebar() {
  const w = useGame((s) => s.world)!;
  const sel = useGame((s) => s.selection);
  if (!sel) return null;
  switch (sel.kind) {
    case 'units':
      return <Units w={w} ids={sel.ids} />;
    case 'province':
      return <Province w={w} id={sel.id} />;
    case 'stack':
      return <ForeignStack w={w} province={sel.province} owner={sel.owner} />;
    case 'country':
      return <CountryView w={w} name={sel.name} />;
    case 'battle':
      return <BattleView w={w} id={sel.id} />;
    case 'report':
      return <ReportView w={w} id={sel.id} />;
    case 'reports':
      return <Reports w={w} />;
    case 'economy':
      return w.player ? <EconomyPanel w={w} me={w.player} /> : null;
    case 'production':
      return w.player ? <ProductionPanel w={w} me={w.player} /> : null;
  }
}
