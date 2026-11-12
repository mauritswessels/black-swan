/**
 * Watch two AI countries fight a test war on the plain map. A stand-in for the real map
 * screen (Stage C): it shows that battles, supply and surrender work, and lets you read the
 * battle reports. It runs in its own world, separate from your saved game.
 */
import { useEffect, useState } from 'react';
import { PROVINCES } from '../../sim/map';
import { bothSides, SCENARIOS, startWar } from '../../sim/testwar';
import type { BattleReport, World } from '../../sim/types';
import { dateLabel, step } from '../../sim/world';
import { MapPreview } from '../components/MapPreview';

const SPEEDS = [
  { label: 'Slow', ms: 400 },
  { label: 'Normal', ms: 150 },
  { label: 'Fast', ms: 40 },
];
const names = (xs: string[]) => xs.join(' and ');
const dayLabel = (w: World, day: number) => dateLabel({ startDate: w.startDate, day });

function Report({ r, w }: { r: BattleReport; w: World }) {
  const won = r.winner === 'attacker';
  return (
    <li>
      <b>
        {PROVINCES[r.province].name}: {won ? `${names(r.attackers)} took it` : `${names(r.defenders)} held`}
      </b>{' '}
      <span className="muted-inline">
        {dayLabel(w, r.startDay)} to {dayLabel(w, r.endDay)} · {r.attackerDivisions} attacking, {r.defenderDivisions} defending · losses{' '}
        {r.attackerLosses} and {r.defenderLosses} divisions
      </span>
      <br />
      Why: {r.causes.map((c) => c.text).join('; ')}.
    </li>
  );
}

export function TestWar() {
  const [pick, setPick] = useState(0);
  const [world, setWorld] = useState<World | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const s = SCENARIOS[pick];
  const over = !!world && (world.capitulated.length > 0 || world.day >= 730);

  useEffect(() => {
    if (!running || over) return;
    const timer = setInterval(() => setWorld((w) => (w ? step(w, bothSides(w, s.attacker, s.defender)) : w)), SPEEDS[speed].ms);
    return () => clearInterval(timer);
  }, [running, over, speed, s]);

  const begin = () => {
    setWorld(startWar(s.attacker, s.defender, String(Date.now())));
    setRunning(true);
  };
  const count = (c: string) => world!.units.filter((u) => u.owner === c).length;

  return (
    <section className="glass shell-card rise test-war" aria-labelledby="test-war-h">
      <h2 id="test-war-h">Watch a test war</h2>
      <p className="muted">
        Both sides are led by the same simple AI, with their real armies of 1936. Numbers on the map are divisions; ⚔ marks a battle.
      </p>
      <div className="row">
        <label>
          War{' '}
          <select value={pick} onChange={(e) => { setPick(Number(e.target.value)); setWorld(null); setRunning(false); }}>
            {SCENARIOS.map((x, i) => (
              <option key={i} value={i}>
                {x.attacker} attacks {x.defender} ({x.start[0]} divisions against {x.start[1]})
              </option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={begin}>{world ? 'Start again' : 'Start'}</button>
        {world && !over && (
          <button className="btn" onClick={() => setRunning(!running)} aria-pressed={!running}>
            {running ? 'Pause' : 'Resume'}
          </button>
        )}
        {world && (
          <label>
            Speed{' '}
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              {SPEEDS.map((x, i) => (
                <option key={i} value={i}>{x.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="muted">In real history: {s.history}</p>
      {world && (
        <>
          <p role="status" className="war-status">
            <b>{dateLabel(world)}</b> · day {world.day} · {s.attacker} {world.capitulated.includes(s.attacker) ? 'has surrendered' : `${count(s.attacker)} divisions`} ·{' '}
            {s.defender} {world.capitulated.includes(s.defender) ? 'has surrendered' : `${count(s.defender)} divisions`} · {world.battles.length}{' '}
            {world.battles.length === 1 ? 'battle' : 'battles'} now
            {over && !world.capitulated.length ? ' · stalemate after two years' : ''}
          </p>
          <MapPreview world={world} showUnitsOf={[s.attacker, s.defender]} />
          <h3 className="h4">Battle reports, newest first</h3>
          {world.reports.length ? (
            <ol className="reports" reversed>
              {[...world.reports].reverse().slice(0, 8).map((r) => (
                <Report key={r.id} r={r} w={world} />
              ))}
            </ol>
          ) : (
            <p className="muted">No battle has ended yet.</p>
          )}
        </>
      )}
    </section>
  );
}
