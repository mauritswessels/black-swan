/** Learn to play: the list of lessons. */
import { LESSONS } from '../../tutorial/lessons';
import { lessonsDone } from '../lessonProgress';
import { useGame } from '../store';

export function Lessons() {
  const { startLesson, go, chooseMode } = useGame.getState();
  const done = lessonsDone();
  const next = LESSONS.find((l) => !done.includes(l.id));
  const minutes = LESSONS.reduce((a, l) => a + l.minutes, 0);
  return (
    <main className="setup lessons">
      <div className="setup-inner rise">
        <div className="eyebrow">Learn to play</div>
        <h1>Nine short lessons</h1>
        <p className="muted">
          Each lesson is a small prepared situation on the real map, with you leading France. A card tells you one thing at a time and lights up what to click. It moves on when you have done it, or press Show me and watch. About {minutes} minutes in all. Your saved games are never touched.
        </p>
        <ol className="lesson-list">
          {LESSONS.map((l, i) => {
            const finished = done.includes(l.id);
            return (
              <li key={l.id}>
                <button onClick={() => startLesson(l.id)} className={`${finished ? 'done' : ''}${l === next ? ' next' : ''}`} autoFocus={l === next} aria-label={`Lesson ${i + 1}: ${l.title}. ${l.summary} About ${l.minutes} minutes.${finished ? ' Finished.' : ''}`}>
                  <b>{i + 1}</b>
                  <span className="lesson-title">{l.title}</span>
                  <span className="lesson-sum">{l.summary}</span>
                  <span className="lesson-min">{finished ? '✓ done' : `${l.minutes} min`}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="title-actions left">
          {next ? (
            <button className="btn primary" onClick={() => startLesson(next.id)}>
              {done.length ? `Continue: lesson ${LESSONS.indexOf(next) + 1}` : 'Start with lesson 1'}
            </button>
          ) : (
            <button className="btn primary" onClick={() => chooseMode('story')}>
              All done: start a Story game
            </button>
          )}
          <button className="btn" onClick={() => go('title')}>
            Back <kbd>Esc</kbd>
          </button>
        </div>
      </div>
    </main>
  );
}
