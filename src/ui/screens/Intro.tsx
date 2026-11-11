import { useGame } from '../store';
import './screens.css';

export function Intro() {
  const { setupSeed, setupTarget, setSetup, startGame, go } = useGame();
  return (
    <main className="intro-screen">
      <article className="letter rise" aria-labelledby="letter-title">
        <header>
          <div className="crest" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="44" height="44">
              <path d="M14 44c8-2 14-8 16-18 1-6 6-10 11-9 4 1 6 4 6 7l5 2-5 2c-1 9-9 17-22 17-5 0-9-1-11-1z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="from">Federal Council of Kestria · Valden</div>
            <h2 id="letter-title">Letter of appointment</h2>
          </div>
        </header>
        <p>Dear Governor,</p>
        <p>
          The Federal Council has appointed you Governor of the <b>Kestrian National Bank</b> for a term of five years, beginning in the first
          quarter of 2027.
        </p>
        <p>
          Kestria is small, wealthy and open. Half of what we make is sold abroad, mostly to the <b>Continental Union</b>, whose currency is the
          aurel. In times of global fear, investors rush into our <b>thaler</b>. Our people have little patience for inflation and less for
          unemployment.
        </p>
        <p>
          Your mandate is <b>price stability</b>, while taking account of the economy. Every quarter you will meet your committee, set the
          policy rate, and tell the public what to expect. The law protects your independence. Use it wisely: it can be taken away.
        </p>
        <p className="sign">With our confidence,<br />The Federal Council</p>

        <fieldset className="setup">
          <legend>Before you begin</legend>
          <label>
            <span>Price stability means</span>
            <select value={setupTarget} onChange={(e) => setSetup(setupSeed, e.target.value as 'range' | 'point')}>
              <option value="range">Inflation between 0 and 2% (Swiss style)</option>
              <option value="point">Inflation of 2% (like the Fed and ECB)</option>
            </select>
          </label>
          <label>
            <span>Seed (the same seed gives the same luck)</span>
            <input value={setupSeed} onChange={(e) => setSetup(e.target.value, setupTarget)} spellCheck={false} />
          </label>
        </fieldset>
        <div className="letter-actions">
          <button className="btn" onClick={() => go('title')}>
            Back
          </button>
          <button className="btn primary" onClick={startGame}>
            Accept the appointment <kbd>↵</kbd>
          </button>
        </div>
      </article>
    </main>
  );
}
