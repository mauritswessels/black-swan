/** Play one game with a simple rule and print the quarters. Usage: npm run sim -- <seed> */
import { initialState, step, isFinished, playedQuarters } from '../src/sim/model';
import { latestRelease } from '../src/sim/data';
import { taylorRate } from '../src/sim/rules';
import { targetFor } from '../src/sim/targets';

const seed = Number(process.argv[2] ?? 1);
let s = initialState({ seed });
const tgt = targetFor(s.settings.targetMode);
while (!isFinished(s)) {
  const r = latestRelease(s);
  s = step(s, { rate: taylorRate(r.headline, r.outputGap, tgt.centre), guidance: 'dataDependent', fxPurchases: 0 });
}
const f = (x: number) => x.toFixed(2).padStart(6);
console.log('  t    gap   core  headl   unem   rate  thalr   cred   appr   loss  events');
for (const q of playedQuarters(s)) console.log(String(q.t).padStart(3), f(q.outputGap), f(q.core), f(q.headline), f(q.unemployment), f(q.policyRate), f(q.thaler), f(q.credibility), f(q.approval), f(q.loss), q.events.join(','));
console.log('game over:', s.gameOver);
