/** Sidebar panels for armies: one army and its orders, the list of all armies, and the army buttons on a selection of divisions. */
import { useState } from 'react';
import { frontsOf } from '../../sim/ai';
import { armiesOf, armyCentre, armyOfUnit, describeOrder, PACE_NAME, pincersOf, type AimKind } from '../../sim/armies';
import { commanderById, commandersOf, TRAIT_NAME, TRAIT_TEXT } from '../../sim/commanders';
import { PROVINCES } from '../../sim/map';
import type { Army, Pace, Unit, World } from '../../sim/types';
import { Term } from '../components/bits';
import { useGame } from '../store';
import { Frame, Link, Row } from './Sidebar';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const pct = (x: number) => `${Math.round(x)}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const PACES: Pace[] = ['careful', 'steady', 'allOut'];
const PACE_TEXT: Record<Pace, string> = {
  careful: 'attacks only at odds of 1.6 to 1 or better: slow, few losses',
  steady: 'attacks at 1.3 to 1, like the computer’s generals',
  allOut: 'attacks at even odds: fast, costly',
};
const AIMS: { kind: AimKind; label: string; help: string }[] = [
  { kind: 'hold', label: 'Hold a border', help: 'Click a country’s province, or your own border province facing it' },
  { kind: 'push', label: 'Push toward…', help: 'Click the province to take' },
  { kind: 'fallBack', label: 'Fall back to…', help: 'Click one of your own provinces to dig in at' },
  { kind: 'reserve', label: 'Reserve at…', help: 'Click one of your own provinces behind the front' },
];

function types(units: Unit[]): string {
  const n = { infantry: 0, armour: 0, artillery: 0 };
  for (const u of units) n[u.type]++;
  return (['infantry', 'armour', 'artillery'] as const).filter((t) => n[t]).map((t) => `${n[t]} ${t}`).join(', ') || 'none';
}

export function ArmyView({ w, id }: { w: World; id: number }) {
  const me = w.player;
  const a = me ? armiesOf(w, me).find((x) => x.id === id) : undefined;
  const aim = useGame((s) => s.aim);
  const notice = useGame((s) => s.notice);
  const [name, setName] = useState<string | null>(null);
  if (!me || !a) return null;
  const { command, setAim, select, focusOn } = useGame.getState();
  const units = w.units.filter((u) => a.units.includes(u.id));
  const centre = armyCentre(w, a);
  const provinces = new Set(units.map((u) => u.at)).size;
  const supply = avg(units.map((u) => u.supply)) * 100;
  const order = (o: Army['order']) => command({ type: 'armyOrder', country: me, army: a.id, order: o });
  const settings = (s: { name?: string; reinforce?: boolean; commander?: string | null }) => command({ type: 'armySettings', country: me, army: a.id, ...s });
  const boss = commanderById(a.commander);
  const leaders = commandersOf(me);
  const others = armiesOf(w, me);
  const fronts = frontsOf(w, me);
  const pincers = pincersOf(w, me).filter((p) => p.armies.includes(a.id));
  const partner = (p: (typeof pincers)[number]) => others.find((x) => x.id === (p.armies[0] === a.id ? p.armies[1] : p.armies[0]))?.name ?? 'another army';
  const aiming = AIMS.find((x) => x.kind === aim);
  return (
    <Frame kicker={a.slot ? `Army · key ${a.slot}` : 'Army'} title={a.name} sub={describeOrder(a.order)}>
      <div className="sb-rows">
        <Row label="Divisions" value={`${units.length}: ${types(units)}`} />
        <Row label="Where" value={centre === null ? 'Nowhere' : provinces > 1 ? `${provinces} provinces, most in ${PROVINCES[centre].name}` : PROVINCES[centre].name} />
        <Row label="Strength" value={pct(avg(units.map((u) => u.strength)))} bar={avg(units.map((u) => u.strength))} />
        <Row label="Organisation" value={pct(avg(units.map((u) => u.organisation)))} bar={avg(units.map((u) => u.organisation))} />
        <Row label="Supply" value={supply >= 99.5 ? 'Full' : supply < 0.5 ? 'Cut off' : pct(supply)} bar={supply} warn={supply < 70} />
      </div>

      {pincers.map((p) => (
        <div key={p.armies.join('|')} className={`sb-pincer${p.closing && p.cutOff ? ' closing' : ''}`} role="note">
          <b>
            <Term id="pincer">Pincer</Term> with {partner(p)}
          </b>
          <span>
            {p.cutOff
              ? `${p.closing ? 'The jaws are closing: taking' : 'Taking'} ${PROVINCES[p.targets[0]].name}${p.targets[1] !== p.targets[0] ? ` and ${PROVINCES[p.targets[1]].name}` : ''} would cut off ${plural(p.cutOff, 'division')} of ${p.foe} from supply.`
              : `Both push at ${PROVINCES[p.targets[0]].name} from different sides. Nothing would be cut off there yet: aim further behind the enemy.`}
          </span>
        </div>
      ))}

      <h3>
        <Term id="army-order">Order</Term>
      </h3>
      <p className="sb-notice" role="status">
        {aiming ? `${aiming.help}. Esc cancels.` : notice}
      </p>
      <div className="sb-actions">
        {AIMS.map((x) => (
          <button key={x.kind} className={`sb-btn${aim === x.kind ? ' on' : ''}${a.order.kind === x.kind ? ' current' : ''}`} aria-pressed={aim === x.kind} disabled={!units.length} onClick={() => setAim(aim === x.kind ? null : x.kind)}>
            {aim === x.kind ? 'Cancel' : x.label}
          </button>
        ))}
        {a.order.kind !== 'none' && (
          <button className="sb-btn" onClick={() => order({ kind: 'none' })}>
            No order: move its divisions by hand
          </button>
        )}
      </div>
      {fronts.length > 0 && (
        <div className="sb-chips" aria-label="Hold the border with">
          {fronts.map((f) => (
            <button key={f.foe} className={`sb-link${a.order.kind === 'hold' && a.order.foe === f.foe ? ' on' : ''}`} onClick={() => order({ kind: 'hold', foe: f.foe })}>
              Hold against {f.foe}
            </button>
          ))}
        </div>
      )}
      {a.order.kind === 'push' && (
        <>
          <h3>
            <Term id="pace">Pace</Term>
          </h3>
          <div className="sb-seg" role="radiogroup" aria-label="Pace of the push">
            {PACES.map((p) => {
              const o = a.order as Extract<Army['order'], { kind: 'push' }>;
              return (
                <button key={p} role="radio" aria-checked={o.pace === p} className={o.pace === p ? 'on' : ''} onClick={() => order({ ...o, pace: p })}>
                  {PACE_NAME[p].replace(/^./, (c) => c.toUpperCase())}
                </button>
              );
            })}
          </div>
          <p className="sb-fine">{PACE_TEXT[a.order.pace]}.</p>
        </>
      )}
      <p className="sb-fine">Or drag the army’s flag on the map: onto an enemy province to push, onto a border to hold it, onto your own land behind the front to wait in reserve.</p>

      <h3>
        <Term id="commander">Commander</Term>
      </h3>
      <label className="sb-goto">
        <span className="sr-only">Commander</span>
        <select value={a.commander ?? ''} onChange={(e) => settings({ commander: e.target.value || null })}>
          <option value="">No commander</option>
          {leaders.map((c) => {
            const busy = others.find((x) => x.commander === c.id && x.id !== a.id);
            return (
              <option key={c.id} value={c.id}>
                {c.name}: {TRAIT_NAME[c.trait].toLowerCase()}
                {busy ? ` (leads ${busy.name})` : ''}
              </option>
            );
          })}
        </select>
      </label>
      {boss ? (
        <p className="sb-note">
          <Term id={`commander-${boss.id}`}>{boss.name}</Term>, {TRAIT_NAME[boss.trait].toLowerCase()}: {TRAIT_TEXT[boss.trait].toLowerCase()}.
        </p>
      ) : (
        <p className="sb-fine">{leaders.length ? 'A commander gives the army one strength: attack, defence or supply.' : 'Your country has no commanders in this game.'}</p>
      )}

      <h3>Divisions</h3>
      <label className="sb-check">
        <input type="checkbox" checked={a.reinforce} onChange={(e) => settings({ reinforce: e.target.checked })} />
        <span>New divisions join this army (only one army at a time)</span>
      </label>
      <div className="sb-actions">
        <button className="sb-btn" disabled={!units.length} onClick={() => (select({ kind: 'units', ids: units.map((u) => u.id) }), centre !== null && focusOn(centre))}>
          Select its divisions
        </button>
      </div>
      <p className="sb-fine">To add divisions, select them (drag with Shift held to draw a box) and choose “Add to {a.name}”. Divisions you march by hand stay in the army; the army leaves them alone until its next order.</p>

      <h3>Name</h3>
      <form
        className="sb-goto"
        onSubmit={(e) => {
          e.preventDefault();
          if (name?.trim()) settings({ name: name.trim() });
          setName(null);
        }}
      >
        <div>
          <input aria-label="Army name" value={name ?? a.name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <button className="sb-btn" type="submit" disabled={!name?.trim() || name.trim() === a.name}>
            Rename
          </button>
        </div>
      </form>
      <div className="sb-actions">
        <button className="sb-btn danger" onClick={() => (command({ type: 'disbandArmy', country: me, army: a.id }), select({ kind: 'units', ids: units.map((u) => u.id) }))}>
          Disband the army (its divisions stay where they are)
        </button>
        <Link to={{ kind: 'armies' }}>All your armies</Link>
      </div>
    </Frame>
  );
}

export function ArmiesPanel({ w, me }: { w: World; me: string }) {
  const list = armiesOf(w, me);
  const loose = w.units.filter((u) => u.owner === me && !armyOfUnit(w, u.id)).length;
  return (
    <Frame kicker="Armies" title="Your armies" sub={list.length ? `${plural(list.length, 'army')} · ${plural(loose, 'division')} in none` : 'None yet'}>
      {list.length ? (
        <div className="sb-actions">
          {list.map((a) => {
            const at = armyCentre(w, a);
            return (
              <Link key={a.id} to={{ kind: 'army', id: a.id }} province={at ?? undefined}>
                {a.slot ? <kbd>{a.slot}</kbd> : null} {a.name} · {plural(a.units.length, 'division')} · {describeOrder(a.order)}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="sb-note">An army is a group of divisions that carries out one order: hold a border, or push toward a target. You stop moving every division by hand.</p>
      )}
      <p className="sb-fine">To form an army, drag with Shift held to draw a box around divisions on the map, then press A. Number keys 1 to 9 select an army; press the key again to look at it. Shift with 1 to 5 sets the game speed.</p>
    </Frame>
  );
}

/** The army buttons on the panel for a selection of divisions. */
export function ArmyButtons({ w, units }: { w: World; units: Unit[] }) {
  const me = w.player;
  if (!me || !units.length || units.some((u) => u.owner !== me)) return null;
  const { formArmy, command, select } = useGame.getState();
  const ids = units.map((u) => u.id);
  const theirs = [...new Set(units.map((u) => armyOfUnit(w, u.id)).filter((a): a is Army => !!a))];
  const list = armiesOf(w, me);
  return (
    <>
      <h3>
        <Term id="army">Army</Term>
      </h3>
      {theirs.length > 0 && (
        <p className="sb-note">
          {theirs.length === 1 && units.every((u) => theirs[0].units.includes(u.id)) ? 'Part of ' : 'Some are in '}
          {theirs.map((a, i) => (
            <span key={a.id}>
              {i ? ', ' : ''}
              <button className="sb-inline" onClick={() => select({ kind: 'army', id: a.id })}>
                {a.name}
              </button>
            </span>
          ))}
          .
        </p>
      )}
      <div className="sb-actions">
        <button className="sb-btn" onClick={formArmy}>
          Form a new army <kbd>A</kbd>
        </button>
        {theirs.length > 0 && (
          <button className="sb-btn" onClick={() => theirs.forEach((a) => command({ type: 'armyUnits', country: me, army: a.id, remove: ids }))}>
            Take {units.length > 1 ? 'them' : 'it'} out of {theirs.length > 1 ? 'their armies' : theirs[0].name}
          </button>
        )}
      </div>
      {list.some((a) => !ids.every((id) => a.units.includes(id))) && (
        <div className="sb-chips">
          {list
            .filter((a) => !ids.every((id) => a.units.includes(id)))
            .map((a) => (
              <button key={a.id} className="sb-link" onClick={() => (command({ type: 'armyUnits', country: me, army: a.id, add: ids }), select({ kind: 'army', id: a.id }))}>
                Add to {a.name}
              </button>
            ))}
        </div>
      )}
    </>
  );
}
