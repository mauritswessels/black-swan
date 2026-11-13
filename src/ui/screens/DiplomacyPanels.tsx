/** Diplomacy in the sidebar: the Diplomacy panel, the decisions that wait for you, and what you can do with another country. All numbers and all answers come from the engine. */
import { COUNTRIES } from '../../sim/countries';
import {
  alive, allied, alliesOf, callAnswer, cannotDeclare, cannotGuarantee, cannotJustify, cannotUltimatum, causeFor, claimOf, CONTAIN_TENSION, GUARANTEE_TENSION, governmentOf, hasPact, JUSTIFY_DAYS, JUSTIFY_TENSION,
  missionCost, oddsAgainst, pactAnswer, peaceAnswer, protectorsOf, relation, relationReasons, restingRelation, sentence, standsFirm, warScore, YIELD_ODDS,
} from '../../sim/diplomacy';
import { PROVINCES } from '../../sim/map';
import type { Decision, Order, World } from '../../sim/types';
import { atWar, enemiesOf, warKey } from '../../sim/war';
import { dateLabel } from '../../sim/world';
import { Term } from '../components/bits';
import { useGame } from '../store';
import { money } from './EconomyPanels';
import { Frame, Link, Row } from './Sidebar';

const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');
const signed = (x: number) => `${x > 0 ? '+' : ''}${Math.round(x)}`;
const GOVERNMENT = { democracy: 'Democracy', authoritarian: 'Authoritarian government', fascist: 'Fascist dictatorship', communist: 'Communist dictatorship' };
/** Country names that take "the". */
export const the = (name: string) => sentence(`x ${name}`).slice(2);
const mood = (x: number) => (x >= 60 ? 'Friendly' : x >= 25 ? 'Warm' : x > -25 ? 'Cool' : x > -60 ? 'Hostile' : 'Bitter enemies');

function Why({ items }: { items: { text: string; points: number }[] }) {
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

/** A button for a diplomatic step, with the reason underneath when it is not possible. */
function Act({ order, label, blocked, danger, note }: { order: Order; label: string; blocked?: string | null; danger?: boolean; note?: string }) {
  const act = useGame((s) => s.act);
  return (
    <div className="sb-act">
      <button className={`sb-btn${danger ? ' danger' : ''}`} disabled={!!blocked} onClick={() => act(order)}>
        {label}
      </button>
      {(blocked || note) && <p className="sb-fine">{blocked ? `Not possible: ${blocked}.` : note}</p>}
    </div>
  );
}

/** The war with one enemy: the score, and what peace it would take. */
function PeaceBox({ w, me, enemy }: { w: World; me: string; enemy: string }) {
  const { score, reasons } = warScore(w, me, enemy);
  const months = Math.floor((w.day - (w.diplomacy.warStart[warKey(me, enemy)] ?? w.day)) / 30);
  const wait = (w.diplomacy.rebuffs[`${me}>${enemy}:peace`] ?? 0) - w.day;
  const white = peaceAnswer(w, me, enemy, 'white');
  const held = peaceAnswer(w, me, enemy, 'asHeld');
  return (
    <div className="sb-outlook">
      <h3>
        The war with {the(enemy)} · <Term id="war-score">war score</Term> {signed(score)}
      </h3>
      <p className={score >= 10 ? 'good' : score <= -10 ? 'bad' : ''}>
        <b>{score >= 25 ? 'You are winning.' : score >= 10 ? 'You have the upper hand.' : score > -10 ? 'Neither side is ahead.' : score > -25 ? 'You are behind.' : 'You are losing.'}</b> {months < 1 ? 'It has just begun.' : `It has lasted ${months} ${months === 1 ? 'month' : 'months'}.`}
      </p>
      <Why items={reasons} />
      {wait > 0 ? (
        <p className="sb-fine">They refused your last offer. They will listen again in {wait} days.</p>
      ) : (
        <div className="sb-actions">
          <Act order={{ type: 'offerPeace', by: me, to: enemy, terms: 'white' }} label="Offer peace: back to the old borders" note={`Our diplomats expect them to ${white.yes ? 'accept' : 'refuse'}: ${white.why}.`} />
          <Act order={{ type: 'offerPeace', by: me, to: enemy, terms: 'asHeld' }} label="Offer peace: each keeps what it holds" note={`Our diplomats expect them to ${held.yes ? 'accept' : 'refuse'}: ${held.why}.`} />
        </div>
      )}
    </div>
  );
}

export function DecisionView({ w, id }: { w: World; id: number }) {
  const act = useGame((s) => s.act);
  const d: Decision | undefined = w.diplomacy.decisions.find((x) => x.id === id);
  if (!d)
    return (
      <Frame kicker="Decision" title="Settled" sub="This decision has been taken.">
        <div className="sb-actions">
          <Link to={{ kind: 'diplomacy' }}>Diplomacy</Link>
        </div>
      </Frame>
    );
  const left = Math.max(0, d.deadline - w.day);
  return (
    <Frame wide kicker="Decision needed" title={d.title} sub={`Answer by ${dateLabel({ startDate: w.startDate, day: d.deadline })} (${left} ${left === 1 ? 'day' : 'days'})`}>
      <p className="sb-note">{d.text}</p>
      <div className="sb-actions">
        {d.options.map((o, i) => (
          <div className="sb-act" key={o.label}>
            <button className="sb-btn on" onClick={() => act({ type: 'decide', by: d.country, id: d.id, option: i })} autoFocus={i === 0}>
              {o.label}
            </button>
            <p className="sb-fine">{o.effect}</p>
          </div>
        ))}
      </div>
      <p className="sb-fine">
        The clock has stopped so that you can think. If you have not answered by the deadline, the answer is “{d.options[d.fallback].label}”.
      </p>
      <div className="sb-actions">
        <Link to={{ kind: 'country', name: d.from }}>{d.from}: details</Link>
        {d.about && <Link to={{ kind: 'country', name: d.about }}>{d.about}: details</Link>}
      </div>
    </Frame>
  );
}

export function DiplomacyPanel({ w, me }: { w: World; me: string }) {
  const dip = w.diplomacy;
  const gone = w.capitulated.includes(me);
  const wars = enemiesOf(w, me);
  const allies = alliesOf(dip, me);
  const given = dip.pacts.filter((p) => p.kind === 'guarantee' && p.a === me).map((p) => p.b);
  const received = dip.pacts.filter((p) => p.kind === 'guarantee' && p.b === me).map((p) => p.a);
  const pacts = dip.pacts.filter((p) => p.kind === 'nonAggression' && (p.a === me || p.b === me)).map((p) => (p.a === me ? p.b : p.a));
  const building = dip.justifying.filter((j) => j.by === me);
  const causes = dip.causes.filter((c) => c.by === me && c.until >= w.day && alive(w, c.on));
  const mine = dip.decisions.filter((d) => d.country === me);
  const conquered = Object.keys(dip.conquered).filter((c) => dip.conquered[c] === me && PROVINCES.some((p) => w.owner[p.id] === c && w.controller[p.id] === me));
  const others = COUNTRIES.map((c) => c.name)
    .filter((c) => c !== me && alive(w, c))
    .sort((a, b) => relation(dip, me, b) - relation(dip, me, a));
  const names = (xs: string[]) =>
    xs.length ? (
      <div className="sb-chips">
        {xs.map((x) => (
          <Link key={x} to={{ kind: 'country', name: x }}>
            {x}
          </Link>
        ))}
      </div>
    ) : (
      <p className="sb-fine">None.</p>
    );
  return (
    <Frame wide kicker="Diplomacy" title="Diplomacy" sub={`${GOVERNMENT[governmentOf(w, me)]} · world tension ${Math.round(dip.tension)}`}>
      {mine.length > 0 && (
        <>
          <h3>Waiting for your decision</h3>
          <div className="sb-actions">
            {mine.map((d) => (
              <Link key={d.id} to={{ kind: 'decision', id: d.id }}>
                ! {d.title} ({Math.max(0, d.deadline - w.day)} days left)
              </Link>
            ))}
          </div>
        </>
      )}
      <h3>
        <Term id="world-tension">World tension</Term>
      </h3>
      <div className="sb-rows">
        <Row label="Tension" value={`${Math.round(dip.tension)} of 100`} bar={dip.tension} warn={dip.tension >= CONTAIN_TENSION} />
      </div>
      <p className="sb-fine">
        Ultimatums, annexations and wars raise it; it eases by half a point a month while no great power is at war. A democracy can give guarantees from {GUARANTEE_TENSION} and build a case for war from {JUSTIFY_TENSION}. From {CONTAIN_TENSION} every
        government starts to rearm, and the democracies guarantee the countries an aggressor claims. Each point also adds 0.2 to war support in countries still at peace.
      </p>
      {!gone && wars.length > 0 && (
        <>
          <h3>Your wars</h3>
          {wars.map((x) => (
            <PeaceBox key={x} w={w} me={me} enemy={x} />
          ))}
        </>
      )}
      <h3>
        Your <Term id="alliance">allies</Term>
      </h3>
      {names(allies)}
      <h3>
        Countries you have <Term id="guarantee">guaranteed</Term>
      </h3>
      {names(given)}
      {received.length > 0 && (
        <>
          <h3>Countries that guarantee you</h3>
          {names(received)}
        </>
      )}
      <h3>
        <Term id="non-aggression-pact">Non-aggression pacts</Term>
      </h3>
      {names(pacts)}
      {(building.length > 0 || causes.length > 0) && (
        <>
          <h3>
            <Term id="cause-for-war">Causes for war</Term>
          </h3>
          <ul className="sb-why">
            {building.map((j) => (
              <li key={`b${j.on}`}>
                <span>Building a case against {the(j.on)}</span>
                <b>{j.daysLeft} days</b>
              </li>
            ))}
            {causes.map((c) => (
              <li key={`c${c.on}${c.until}`}>
                <span>
                  Against {the(c.on)}: {c.why}
                </span>
                <b>{c.until - w.day} days left</b>
              </li>
            ))}
          </ul>
        </>
      )}
      {conquered.length > 0 && (
        <>
          <h3>Countries you occupy</h3>
          {names(conquered)}
          <p className="sb-fine">Open one to annex it or to set up a friendly government.</p>
        </>
      )}
      <h3>Every country, friendliest first</h3>
      <ul className="sb-units">
        {others.map((c) => {
          const r = relation(dip, me, c);
          const tag = atWar(w, me, c) ? 'at war' : allied(dip, me, c) ? 'ally' : hasPact(dip, 'guarantee', me, c) ? 'guaranteed' : hasPact(dip, 'nonAggression', me, c) ? 'pact' : claimOf(c, me) ? 'claims your land' : claimOf(me, c) ? 'you have a claim' : '';
          return (
            <li key={c}>
              <button onClick={() => useGame.getState().select({ kind: 'country', name: c })} aria-label={`${c}: relations ${signed(r)}, ${mood(r).toLowerCase()}${tag ? `, ${tag}` : ''}`}>
                <span>{c}</span>
                <span>{signed(r)}</span>
                <span>{tag || mood(r)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <h3>Recent diplomatic news</h3>
      <ul className="sb-causes">
        {[...dip.log]
          .reverse()
          .slice(0, 8)
          .map((e) => (
            <li key={e.id}>
              <small>{dateLabel({ startDate: w.startDate, day: e.day })}:</small> {e.text}
            </li>
          ))}
        {!dip.log.length && <li>Nothing yet.</li>}
      </ul>
    </Frame>
  );
}

/** Everything diplomatic about one other country, and what you can do about it. Shown inside the country's details. */
export function CountryDiplomacy({ w, me, name }: { w: World; me: string; name: string }) {
  const dip = w.diplomacy;
  const r = relation(dip, me, name);
  const war = atWar(w, me, name);
  const ally = allied(dip, me, name);
  const protectors = protectorsOf(dip, name).filter((p) => p !== me && alive(w, p));
  const itsAllies = alliesOf(dip, name).filter((a) => alive(w, a));
  const myClaim = claimOf(me, name);
  const itsClaim = claimOf(name, me);
  const cause = causeFor(w, me, name);
  const building = dip.justifying.find((j) => j.by === me && j.on === name);
  const mission = dip.missions.includes(`${me}>${name}`);
  const myGuarantee = hasPact(dip, 'guarantee', me, name);
  const pact = hasPact(dip, 'nonAggression', me, name);
  const cooling = (what: string) => {
    const days = (dip.rebuffs[`${me}>${name}:${what}`] ?? 0) - w.day;
    return days > 0 ? `they said no ${90 - days} days ago and will listen again in ${days} days` : null;
  };
  const answer = (a: { yes: boolean; score: number; need: number; reasons: { text: string; points: number }[] }) => (
    <>
      <p className="sb-fine">
        Our diplomats expect them to {a.yes ? 'accept' : 'decline'}: their view adds up to {signed(a.score)}, and they sign at {a.need}.
      </p>
      <Why items={a.reasons} />
    </>
  );
  // What our diplomats expect an ultimatum to bring.
  const firm = protectors.filter((p) => atWar(w, p, me) || standsFirm(w, p));
  const wouldYield = !firm.length && oddsAgainst(w, me, name, 0) >= YIELD_ODDS;
  const joinable = ally ? enemiesOf(w, me).filter((x) => x !== name && !atWar(w, name, x) && !allied(dip, name, x)) : [];
  return (
    <>
      <h3>
        <Term id="relations">Relations</Term> with you
      </h3>
      <div className="sb-rows">
        <Row label="Relations" value={`${signed(r)} · ${mood(r)}`} bar={(r + 100) / 2} warn={r < -25} />
        {!war && <Row label="Heading for" value={signed(restingRelation(w, me, name))} />}
        {itsAllies.length > 0 && <Row label="Its allies" value={list(itsAllies)} />}
        {protectors.filter((p) => !itsAllies.includes(p)).length > 0 && <Row label="Guaranteed by" value={list(protectors.filter((p) => !itsAllies.includes(p)))} />}
      </div>
      {!war && <Why items={relationReasons(w, me, name)} />}
      {myClaim && <p className="sb-note">You claim {myClaim.what}. A claim is a standing cause for war.</p>}
      {itsClaim && <p className="sb-note warn">! {name} claims {itsClaim.what}.</p>}

      {war ? (
        <PeaceBox w={w} me={me} enemy={name} />
      ) : (
        <>
          <h3>Friendship</h3>
          <div className="sb-actions">
            <Act
              order={{ type: 'mission', by: me, to: name, on: !mission }}
              label={mission ? 'Recall the diplomatic mission' : 'Send a diplomatic mission'}
              note={`${mission ? 'Running now. ' : ''}Relations settle 30 points higher, moving 2 points a month. Costs ${money(missionCost(w, me))} a month.`}
            />
            {ally ? (
              <>
                <p className="sb-note">You are allies: each of you is asked to go to war if the other is attacked, and your divisions may march and be supplied through each other's land.</p>
                {joinable.map((x) => {
                  const a = callAnswer(w, me, name, x);
                  return (
                    <div key={x}>
                      <Act order={{ type: 'callAlly', by: me, ally: name, against: x }} label={`Ask it to join your war against ${the(x)}`} blocked={cooling(`call:${x}`)} />
                      {answer(a)}
                    </div>
                  );
                })}
                <Act order={{ type: 'endPact', by: me, other: name, pact: 'alliance' }} label="End the alliance" note="Relations fall by 40, and every other country trusts you 5 points less." />
              </>
            ) : (
              <>
                <div>
                  <Act order={{ type: 'propose', by: me, to: name, pact: 'alliance' }} label="Propose an alliance" blocked={cooling('alliance')} />
                  {answer(pactAnswer(w, me, name, 'alliance'))}
                </div>
                {pact ? (
                  <Act order={{ type: 'endPact', by: me, other: name, pact: 'nonAggression' }} label="Denounce the non-aggression pact" note="Relations fall by 25. Attacking without denouncing it first costs more." />
                ) : (
                  <div>
                    <Act order={{ type: 'propose', by: me, to: name, pact: 'nonAggression' }} label="Propose a non-aggression pact" blocked={cooling('nonAggression')} />
                    {answer(pactAnswer(w, me, name, 'nonAggression'))}
                  </div>
                )}
                {myGuarantee ? (
                  <Act order={{ type: 'endPact', by: me, other: name, pact: 'guarantee' }} label="Withdraw your guarantee" note="Relations fall by 25." />
                ) : (
                  <Act order={{ type: 'guarantee', by: me, on: name }} label={`Guarantee the independence of ${the(name)}`} blocked={cannotGuarantee(w, me, name)} note="A promise to go to war if it is attacked. It makes an aggressor think twice, and it can drag you into a war." />
                )}
              </>
            )}
          </div>

          <h3>Pressure and war</h3>
          <div className="sb-actions">
            {myClaim?.demand && (
              <Act
                order={{ type: 'ultimatum', by: me, on: name }}
                label="Send an ultimatum: demand your claim"
                blocked={cannotUltimatum(w, me, name)}
                danger
                note={`Our diplomats expect ${the(name)} to ${wouldYield ? 'give in: it stands alone and your army is far stronger' : firm.length ? `refuse, backed by ${list(firm)}` : 'refuse: your army is not strong enough to frighten it'}. A refusal gives you a cause for war. World tension rises either way.`}
              />
            )}
            {!cause && (
              <Act
                order={{ type: 'justify', by: me, on: name }}
                label={building ? `Building a case: ${building.daysLeft} days left` : 'Build a case for war'}
                blocked={building ? null : cannotJustify(w, me, name)}
                note={building ? undefined : `Takes ${JUSTIFY_DAYS[governmentOf(w, me)]} days under your kind of government. Relations fall by 20 and the world notices.`}
              />
            )}
            <Act
              order={{ type: 'declareWar', by: me, on: name }}
              label={`Declare war on ${the(name)}`}
              blocked={cannotDeclare(w, me, name)}
              danger
              note={`${cause ? `Your cause: ${cause}.` : 'You have no cause for war: stability falls twice as much, tension rises more and every country thinks 20 points less of you.'}${protectors.length ? ` ${list(protectors)} ${protectors.length > 1 ? 'have' : 'has'} promised to defend it.` : ' Nobody has promised to defend it.'}${pact ? ' You would be breaking a non-aggression pact.' : ''}`}
            />
          </div>
        </>
      )}
    </>
  );
}

/** What to do with a country you have conquered. */
export function Settlement({ w, me, name }: { w: World; me: string; name: string }) {
  if (w.diplomacy.conquered[name] !== me || !PROVINCES.some((p) => w.owner[p.id] === name && w.controller[p.id] === me)) return null;
  return (
    <>
      <h3>Its future is yours to decide</h3>
      <div className="sb-actions">
        <Act order={{ type: 'settle', by: me, target: name, how: 'friendly' }} label="Set up a friendly government" note={`${name} returns to the map under a government like yours, as your ally, with a small new army. You give back the land you hold.`} />
        <Act order={{ type: 'settle', by: me, target: name, how: 'annex' }} label={`Annex ${the(name)}`} danger note="Its land becomes yours: factories work at full speed instead of 30%, and its people count towards your manpower. World tension rises and every country thinks less of you." />
      </div>
      <p className="sb-fine">You can also leave it occupied. If you are ever defeated, it is restored.</p>
    </>
  );
}
