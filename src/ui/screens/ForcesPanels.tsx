/** The navy and air force in the sidebar: the overview, a sea zone, a fleet, and the air wings at one base. All numbers come from the engine. */
import { bombTarget, flying, MEN_PER_WING, MISSIONS, RANGE_KM, REBASE_DAYS, WING_MISSION_NAME, WING_MISSION_NOTE, cannotRaiseWing, wingRange } from '../../sim/air';
import { PROVINCES } from '../../sim/map';
import { modsOf } from '../../sim/mods';
import { describeFleet, LANDING_BASE, LANDING_PREP_DAYS, MISSION_NAME, MISSION_NOTE, tradeRoute, TRANSPORT_DAYS } from '../../sim/navy';
import { DAYS_PER_ZONE, fleetPower, seaDependence, SHIP_KINDS, SHIP_POWER, shipCount, SHORES, ZONE_INDEX, zoneById, zonePath, ZONES, type SeaStatus } from '../../sim/sea';
import type { Fleet, FleetMission, PlaneKind, ShipKind, Wing, WingMission, World } from '../../sim/types';
import { atWar } from '../../sim/war';
import { picturesOf, skyOver } from '../forces';
import { useGame } from '../store';
import { Frame, Link, Row } from './Sidebar';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const pct = (x: number) => `${Math.round(x)}%`;
const SHIP_NAME: Record<ShipKind, string> = { capital: 'Capital ships', escort: 'Escort flotillas', submarine: 'Submarine flotillas' };
const SEA_WORDS: Record<SeaStatus, string> = { own: 'You control it', enemy: 'The enemy controls it', contested: 'Contested', open: 'Open sea: nobody holds it' };
const SKY_WORDS = { own: 'yours', enemy: "the enemy's", contested: 'contested', empty: 'empty' };
const FLEET_MISSIONS: FleetMission[] = ['patrol', 'escort', 'raid', 'port'];

const sailing = (w: World, f: Fleet) => (w.day < f.arrives ? `arrives in ${plural(f.arrives - w.day, 'day')}` : '');

/** The overview: every fleet and air base, the state of your sea trade, and new wings. Key F. */
export function ForcesPanel({ w, me }: { w: World; me: string }) {
  const { economy } = useGame.getState();
  const e = w.economies[me];
  const { sea, friends } = picturesOf(w);
  const fleets = w.fleets.filter((f) => f.owner === me);
  const wings = w.wings.filter((x) => x.owner === me);
  const bases = [...new Set(wings.map((x) => x.base))];
  const route = tradeRoute(w, sea, friends, me);
  const depends = seaDependence(me);
  return (
    <Frame kicker="Navy and air force" title="Navy and air force" sub={`${plural(fleets.length, 'fleet')} · ${plural(wings.length, 'air wing')}`} wide>
      <p className="sb-fine">You do not steer ships or aircraft. Give each fleet a sea zone and a mission, and each air wing a base and a mission; the game works out the fighting every day. The Air and sea map shows who holds what.</p>
      <h3>Fleets</h3>
      {fleets.length ? (
        <div className="sb-actions">
          {fleets.map((f) => (
            <Link key={f.id} to={{ kind: 'fleet', id: f.id }}>
              <b>{f.name}</b> · {zoneById(f.zone)?.name} · {MISSION_NAME[f.mission]}
              <small>
                {describeFleet(f)}
                {sailing(w, f) ? ` · ${sailing(w, f)}` : ''}
              </small>
            </Link>
          ))}
        </div>
      ) : (
        <p className="sb-note">You have no warships. Put military factories on a ship line in Production (P); new ships join a fleet off your home coast.</p>
      )}

      <h3>Your trade by sea</h3>
      {route.legs.length ? (
        <>
          <p className="sb-note">
            {pct(depends * 100)} of your imports come by sea, through {route.legs.map((l) => ZONES[l.zone].name).join(', then the ')}.{' '}
            {route.lost > 0.005 ? <b className="warn">{pct(route.lost * 100)} of the cargo is being sunk.</b> : 'Nothing is being sunk.'}
          </p>
          <div className="sb-rows">
            {route.legs.map((l) => (
              <Row key={l.zone} label={ZONES[l.zone].name} value={l.blockaded ? 'blockaded: 90% sunk' : l.sunk > 0.005 ? `${pct(l.sunk * 100)} sunk by raiders` : 'safe'} bar={100 - l.sunk * 100} warn={l.sunk > 0.1} />
            ))}
          </div>
          <p className="sb-fine">What is sunk never arrives: imported steel and oil, and goods for the shops. Fleets on Escort along the route cut the losses; a zone the enemy controls outright loses 90%.</p>
        </>
      ) : (
        <p className="sb-note">You have no coast, so none of your trade goes by sea.</p>
      )}

      <h3>Air bases</h3>
      {bases.length ? (
        <div className="sb-actions">
          {bases.map((b) => {
            const here = wings.filter((x) => x.base === b);
            const f = here.filter((x) => x.type === 'fighter').length;
            return (
              <Link key={b} to={{ kind: 'wings', province: b }} province={b}>
                <b>{PROVINCES[b].name}</b> · {[f ? plural(f, 'fighter wing') : '', here.length - f ? plural(here.length - f, 'bomber wing') : ''].filter(Boolean).join(', ')}
                <small>Average strength {pct(here.reduce((a, x) => a + x.strength, 0) / here.length)} · {[...new Set(here.map((x) => WING_MISSION_NAME[x.mission]))].join(', ')}</small>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="sb-note">You have no air wings yet.</p>
      )}
      <h3>New wings</h3>
      <div className="sb-actions">
        {(['fighter', 'bomber'] as PlaneKind[]).map((k) => {
          const blocked = cannotRaiseWing(e, k);
          return (
            <button key={k} className="sb-btn" disabled={!!blocked} onClick={() => economy({ type: 'raiseWing', plane: k })}>
              Form a {k} wing
              <small>{blocked ? `Not yet: ${blocked}. In store: aircraft for ${e.stock[k].toFixed(1)} wings.` : `Aircraft for ${e.stock[k].toFixed(1)} wings in store. Needs ${MEN_PER_WING},000 men. It forms at your capital.`}</small>
            </button>
          );
        })}
      </div>
      <p className="sb-fine">Aircraft in store also repair damaged wings, so keep the aircraft lines running in a war. Fighters reach {RANGE_KM.fighter} km from their base, bombers {RANGE_KM.bomber} km.</p>
    </Frame>
  );
}

export function ZoneView({ w, id }: { w: World; id: string }) {
  const zone = zoneById(id);
  if (!zone) return null;
  const i = ZONE_INDEX[id];
  const me = w.player;
  const { sea, friends } = picturesOf(w);
  const status = me ? sea.status(me, i) : 'open';
  const fleets = w.fleets.filter((f) => f.zone === id);
  const owners = [...new Set(fleets.map((f) => f.owner))].sort((a, b) => (a === me ? -1 : b === me ? 1 : a < b ? -1 : 1));
  const leg = me ? tradeRoute(w, sea, friends, me).legs.find((l) => l.zone === i) : undefined;
  const shores = SHORES[i];
  const mine = shores.filter((p) => w.controller[p] === me).length;
  const hostile = me ? shores.filter((p) => atWar(w, me, w.controller[p])).length : 0;
  return (
    <Frame kicker="Sea zone" title={zone.name} sub={me ? SEA_WORDS[status] : undefined}>
      <p className="sb-note">
        {status === 'own' && 'Your fleets hold this sea. You can land troops on any enemy shore here, and enemy shipping through it is blockaded.'}
        {status === 'enemy' && 'Your ships and transports cannot cross it, and ports that open only onto this sea get no supplies.'}
        {status === 'contested' && 'Both sides have ships here and neither has twice the strength of the other. You can still ship troops through, but you cannot land on an enemy shore.'}
        {status === 'open' && 'You can ship troops through it. To land on an enemy shore here you must control it: put a fleet here on Patrol.'}
      </p>
      <div className="sb-rows">
        {owners.map((o) => {
          const power = sea.power[i].get(o) ?? 0;
          const theirs = fleets.filter((f) => f.owner === o);
          return <Row key={o} label={`${o}${me && atWar(w, me, o) ? ' (enemy)' : ''}`} value={`${plural(Math.round(theirs.reduce((a, f) => a + shipCount(f), 0)), 'ship')}, strength ${Math.round(power)}`} />;
        })}
        {!owners.length && <Row label="Fleets" value="none" />}
        <Row label="Shores" value={`${shores.length} provinces${me ? `: ${mine} yours, ${hostile} enemy` : ''}`} />
        <Row label="Leads to" value={zone.neighbours.map((n) => ZONES[n].name).join(', ')} />
      </div>
      {leg && <p className="sb-note">Your imports pass through here. {leg.blockaded ? 'The enemy controls the zone: 90% of the cargo is sunk.' : leg.sunk > 0.005 ? `Raiders are sinking ${pct(leg.sunk * 100)} of it.` : 'Nothing is being sunk.'}</p>}
      {fleets.some((f) => f.owner === me) && (
        <>
          <h3>Your fleets here</h3>
          <div className="sb-actions">
            {fleets
              .filter((f) => f.owner === me)
              .map((f) => (
                <Link key={f.id} to={{ kind: 'fleet', id: f.id }}>
                  <b>{f.name}</b> · {MISSION_NAME[f.mission]}
                  <small>
                    {describeFleet(f)}
                    {sailing(w, f) ? ` · ${sailing(w, f)}` : ''}
                  </small>
                </Link>
              ))}
          </div>
        </>
      )}
      <p className="sb-fine">
        Strength: {SHIP_POWER.capital} for a capital ship, {SHIP_POWER.escort} for an escort flotilla, {SHIP_POWER.submarine} for a submarine flotilla, plus naval bombers in range. Fleets on Raid or in port do not count. Twice the enemy's strength gives control.
      </p>
      <div className="sb-actions">
        <Link to={{ kind: 'forces' }}>Navy and air force</Link>
      </div>
    </Frame>
  );
}

export function FleetView({ w, id }: { w: World; id: number }) {
  const { force, setOrdering, sailTo } = useGame.getState();
  const ordering = useGame((s) => s.ordering);
  const notice = useGame((s) => s.notice);
  const f = w.fleets.find((x) => x.id === id);
  if (!f) return null;
  const zone = zoneById(f.zone)!;
  const i = ZONE_INDEX[f.zone];
  const { sea } = picturesOf(w);
  const mine = f.owner === w.player;
  const others = w.fleets.filter((x) => x.owner === f.owner && x.zone === f.zone && x.id !== f.id);
  const atSea = w.day < f.arrives;
  return (
    <Frame kicker="Your fleet" title={f.name} sub={`${zone.name} · ${atSea ? `at sea, ${sailing(w, f)}` : MISSION_NAME[f.mission]}`}>
      <div className="sb-rows">
        {SHIP_KINDS.map((k) => (
          <Row key={k} label={SHIP_NAME[k]} value={f.ships[k].toFixed(1)} />
        ))}
        <Row label="Fighting strength" value={Math.round(fleetPower(f))} />
        <Row label={`The ${zone.name}`} value={SEA_WORDS[sea.status(f.owner, i)]} />
      </div>
      <p className="sb-fine">Half a ship is a damaged one. Damaged ships are not repaired: new ones from the ship lines join the fleet off your home coast.</p>
      <h3>Mission</h3>
      <div className="sb-actions" role="group" aria-label="Mission">
        {FLEET_MISSIONS.map((m) => (
          <button key={m} className={`sb-btn${f.mission === m ? ' on' : ''}`} aria-pressed={f.mission === m} disabled={!mine} onClick={() => force({ type: 'fleet', fleet: f.id, mission: m })}>
            {MISSION_NAME[m]}
            <small>{MISSION_NOTE[m]}</small>
          </button>
        ))}
      </div>
      <h3>Sail to another sea</h3>
      <p className="sb-notice" role="status">
        {ordering ? 'Now click a sea zone on the map.' : notice}
      </p>
      <div className="sb-actions">
        <button className={`sb-btn${ordering ? ' on' : ''}`} aria-pressed={ordering} disabled={!mine} onClick={() => setOrdering(!ordering)}>
          {ordering ? 'Cancel' : 'Choose a sea zone on the map'} <kbd>G</kbd>
        </button>
      </div>
      <label className="sb-goto">
        <span>Or pick one from the list</span>
        <select
          value=""
          disabled={!mine}
          onChange={(e) => {
            if (e.target.value) sailTo(e.target.value);
          }}
        >
          <option value="">Sea zone…</option>
          {ZONES.filter((z) => z.id !== f.zone).map((z) => {
            const path = zonePath(i, ZONE_INDEX[z.id]);
            return (
              <option key={z.id} value={z.id} disabled={!path}>
                {z.name}
                {path ? ` (${(path.length - 1) * DAYS_PER_ZONE} days)` : ' (no way)'}
              </option>
            );
          })}
        </select>
      </label>
      <p className="sb-fine">A fleet takes {DAYS_PER_ZONE} days to cross each zone and does nothing until it arrives.</p>
      <h3>Split and join</h3>
      <div className="sb-actions">
        {SHIP_KINDS.filter((k) => f.ships[k] >= 1 && shipCount(f) - f.ships[k] >= 1).map((k) => (
          <button key={k} className="sb-btn" disabled={!mine || atSea} onClick={() => force({ type: 'transfer', fleet: f.id, to: null, kind: k, count: f.ships[k] })}>
            Detach the {SHIP_NAME[k].toLowerCase()} as a new fleet
            <small>{k === 'submarine' ? 'Submarines raid best on their own.' : k === 'escort' ? 'Escorts can guard convoys while the big ships patrol.' : 'A battle squadron to hold another sea.'}</small>
          </button>
        ))}
        {others.map((o) => (
          <button
            key={o.id}
            className="sb-btn"
            disabled={!mine || atSea || w.day < o.arrives}
            onClick={() => {
              for (const k of SHIP_KINDS) if (f.ships[k] > 0) force({ type: 'transfer', fleet: f.id, to: o.id, kind: k, count: f.ships[k] });
              useGame.getState().select({ kind: 'fleet', id: o.id });
            }}
          >
            Join {o.name}
            <small>{describeFleet(o)}</small>
          </button>
        ))}
      </div>
      <div className="sb-actions">
        <Link to={{ kind: 'zone', id: f.zone }}>{zone.name}</Link>
        <Link to={{ kind: 'forces' }}>Navy and air force</Link>
      </div>
    </Frame>
  );
}

function WingGroup({ w, wings, kind }: { w: World; wings: Wing[]; kind: PlaneKind }) {
  const { force } = useGame.getState();
  if (!wings.length) return null;
  const current = new Set(wings.map((x) => x.mission));
  const target = kind === 'bomber' && current.has('strategic') ? bombTarget(w, wings.find((x) => x.mission === 'strategic')!) : -1;
  return (
    <>
      <h3>
        {plural(wings.length, `${kind} wing`)} · average strength {pct(wings.reduce((a, x) => a + x.strength, 0) / wings.length)}
      </h3>
      <div className="sb-actions" role="group" aria-label={`Mission for the ${kind} wings`}>
        {MISSIONS[kind].map((m: WingMission) => (
          <button key={m} className={`sb-btn${current.has(m) ? ' on' : ''}`} aria-pressed={current.size === 1 && current.has(m)} onClick={() => wings.forEach((x) => force({ type: 'wing', wing: x.id, mission: m }))}>
            {WING_MISSION_NAME[m]}
            <small>{WING_MISSION_NOTE[m]}</small>
          </button>
        ))}
      </div>
      {current.has('strategic') && <p className="sb-note">{target >= 0 ? `Tonight's target: the factories of ${PROVINCES[target].name} (${w.controller[target]}).` : 'No enemy factories in range.'}</p>}
    </>
  );
}

export function WingsView({ w, province }: { w: World; province: number }) {
  const { setOrdering } = useGame.getState();
  const ordering = useGame((s) => s.ordering);
  const notice = useGame((s) => s.notice);
  const me = w.player;
  const p = PROVINCES[province];
  const wings = w.wings.filter((x) => x.base === province && x.owner === me);
  if (!me || !wings.length)
    return (
      <Frame kicker="Air base" title={p.name}>
        <p className="sb-note">None of your air wings are based here.</p>
        <p className="sb-notice" role="status">
          {notice}
        </p>
        <div className="sb-actions">
          <Link to={{ kind: 'forces' }}>Navy and air force</Link>
          <Link to={{ kind: 'province', id: province }}>{p.name}</Link>
        </div>
      </Frame>
    );
  const mods = modsOf(w.economies[me]);
  const sky = skyOver(w, me, province);
  const grounded = wings.filter((x) => !flying(w, x, picturesOf(w).friends.get(me)) && x.mission !== 'rest');
  const moving = wings.filter((x) => w.day < x.ready);
  return (
    <Frame kicker="Your air base" title={p.name} sub={plural(wings.length, 'air wing')}>
      <div className="sb-rows">
        <Row label="Sky over the base" value={`${SKY_WORDS[sky.status]} (you ${sky.mine.toFixed(1)}, enemy ${sky.enemy.toFixed(1)})`} warn={sky.status === 'enemy'} />
        <Row label="Fighters reach" value={`${Math.round(wingRange({ type: 'fighter' }, mods))} km`} />
        <Row label="Bombers reach" value={`${Math.round(wingRange({ type: 'bomber' }, mods))} km`} />
      </div>
      {moving.length > 0 && <p className="sb-note warn">{plural(moving.length, 'wing')} just arrived: flying again in {plural(Math.max(...moving.map((x) => x.ready - w.day)), 'day')}.</p>}
      {grounded.length > moving.length && <p className="sb-note warn">The base is not in friendly hands, so the wings cannot fly. Move them.</p>}
      <p className="sb-fine">The provinces in reach are outlined on the map. Whoever has 1.5 times the other side's air score over a battle (and at least 0.5) hits 15% harder there, and the other side 15% less hard.</p>
      <WingGroup w={w} wings={wings.filter((x) => x.type === 'fighter')} kind="fighter" />
      <WingGroup w={w} wings={wings.filter((x) => x.type === 'bomber')} kind="bomber" />
      <h3>Move to another base</h3>
      <p className="sb-notice" role="status">
        {ordering ? "Now click a province in your hands or an ally's." : notice}
      </p>
      <div className="sb-actions">
        <button className={`sb-btn${ordering ? ' on' : ''}`} aria-pressed={ordering} onClick={() => setOrdering(!ordering)}>
          {ordering ? 'Cancel' : 'Choose the new base on the map'} <kbd>G</kbd>
          <small>All the wings here move together and cannot fly for {REBASE_DAYS} days. Or right-click the province.</small>
        </button>
      </div>
      <div className="sb-actions">
        <Link to={{ kind: 'forces' }}>Navy and air force</Link>
        <Link to={{ kind: 'province', id: province }}>{p.name}</Link>
      </div>
    </Frame>
  );
}

/** For a selection of divisions: the button and the note about going by sea. */
export function SeaOrders({ w, ids }: { w: World; ids: number[] }) {
  const { setBySea } = useGame.getState();
  const bySea = useGame((s) => s.bySea);
  const units = w.units.filter((u) => ids.includes(u.id));
  const waiting = units.filter((u) => u.sea);
  const landing = units.filter((u) => u.landing);
  return (
    <>
      {waiting.length > 0 && (
        <p className="sb-note">
          {plural(waiting.length, 'division')} {waiting[0].sea!.landing ? 'preparing to land at' : 'embarking for'} {PROVINCES[waiting[0].sea!.to].name}: {plural(Math.max(...waiting.map((u) => u.sea!.daysLeft)), 'day')} to go. Halt cancels it.
        </p>
      )}
      {landing.length > 0 && <p className="sb-note warn">{plural(landing.length, 'division')} storming the beach: they fight at 60% until they are ashore.</p>}
      <div className="sb-actions">
        <button className={`sb-btn${bySea ? ' on' : ''}`} aria-pressed={bySea} onClick={() => setBySea(!bySea)}>
          {bySea ? 'Cancel' : 'Go by sea'} <kbd>B</kbd>
          <small>
            From a coast to any other coast. A friendly shore takes {TRANSPORT_DAYS} days plus {DAYS_PER_ZONE} for each further sea zone. An enemy shore is a landing: {LANDING_PREP_DAYS} days to prepare, you must control the sea off the beach, and only {LANDING_BASE} divisions plus one for each of your ships there can land at once.
          </small>
        </button>
      </div>
    </>
  );
}
