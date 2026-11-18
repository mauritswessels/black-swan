/** The coach: the card that leads a lesson step by step, and the glow around what to click. */
import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LESSONS, lessonById, textOf, type Target } from '../../tutorial/lessons';
import { lessonView, useGame } from '../store';

/** Text with `K` in backticks shown as a key. */
export function Keyed({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) => (i % 2 ? <kbd key={i}>{part}</kbd> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function findTarget(t: Target): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>(t.sel)];
  const text = t.text?.toLowerCase();
  return all.find((el) => el.offsetParent !== null && (!text || (el.textContent ?? '').toLowerCase().includes(text))) ?? null;
}

/** A glowing frame around the element a step is about. It follows the element if it moves. */
function Spot({ target, step }: { target: Target; step: string }) {
  const [box, setBox] = useState<DOMRect | null>(null);
  useEffect(() => {
    let scrolled = false;
    const find = () => {
      const el = findTarget(target);
      if (el && !scrolled) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        scrolled = true;
      }
      const r = el?.getBoundingClientRect() ?? null;
      setBox((b) => (r && b && r.x === b.x && r.y === b.y && r.width === b.width && r.height === b.height ? b : r));
    };
    find();
    const timer = setInterval(find, 250);
    return () => clearInterval(timer);
  }, [target.sel, target.text, step]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!box) return null;
  const pad = 5;
  return <div className="coach-spot" aria-hidden="true" style={{ left: box.left - pad, top: box.top - pad, width: box.width + pad * 2, height: box.height + pad * 2 }} />;
}

/** The card lives on the page itself, so it can sit above the codex and other panels. */
export function Coach() {
  return createPortal(<CoachCard />, document.body);
}

function CoachCard() {
  const lesson = useGame((s) => s.lesson);
  // Over the codex or another panel, the card moves to a corner on top of it.
  const above = useGame((s) => !!s.overlay);
  const running = useGame((s) => s.running);
  // Re-render as the game changes, so text that depends on it stays right.
  useGame((s) => s.world);
  const { lessonNext, lessonShow, startLesson, go } = useGame.getState();
  const [hidden, setHidden] = useState(false);
  if (!lesson) return null;
  const l = lessonById(lesson.id);
  if (!l) return null;
  const n = LESSONS.indexOf(l);
  const following = LESSONS[n + 1];

  if (lesson.finished)
    return (
      <section className="coach glass rise" role="dialog" aria-label="Lesson complete">
        <div className="coach-kicker">
          Lesson {n + 1} of {LESSONS.length} · complete
        </div>
        <h2 className="coach-title">{l.title}: done</h2>
        <p className="coach-text">{l.next}</p>
        <div className="coach-actions">
          {following ? (
            <button className="btn primary" onClick={() => startLesson(following.id)} autoFocus>
              Lesson {n + 2}: {following.title}
            </button>
          ) : (
            <button className="btn primary" onClick={() => useGame.getState().chooseMode('story')} autoFocus>
              Start a Story game
            </button>
          )}
          <button className="btn" onClick={() => go('lessons')}>
            All lessons
          </button>
        </div>
      </section>
    );

  const step = l.steps[lesson.step];
  const text = textOf(step, lessonView(useGame.getState()));
  if (hidden)
    return (
      <button className="coach-tab btn" onClick={() => setHidden(false)} aria-label="Show the lesson card">
        Lesson {n + 1} · step {lesson.step + 1} of {l.steps.length}
      </button>
    );
  return (
    <>
      {step.target && <Spot target={step.target} step={`${lesson.id}:${lesson.step}`} />}
      <section className={`coach glass${above ? ' above' : ''}`} aria-label={`Lesson ${n + 1}: ${l.title}`}>
        <div className="coach-kicker">
          <span>
            Lesson {n + 1} of {LESSONS.length} · {l.title}
          </span>
          <button className="coach-x" onClick={() => setHidden(true)} aria-label="Hide the lesson card for a moment" title="Hide">
            –
          </button>
        </div>
        <div className="coach-progress" aria-hidden="true">
          {l.steps.map((_, i) => (
            <i key={i} className={i < lesson.step ? 'done' : i === lesson.step ? 'now' : ''} />
          ))}
        </div>
        <p className="coach-text" key={lesson.step} aria-live="polite">
          <Keyed text={text} />
        </p>
        {step.why && <p className="coach-why">{step.why}</p>}
        <div className="coach-actions">
          {step.done ? (
            <>
              <span className="coach-wait">{!step.days ? 'Waiting for you…' : running ? 'Waiting for the game…' : 'The clock is stopped: press Space'}</span>
              <button className="btn" onClick={lessonShow} title="Do this step for me">
                Show me
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={lessonNext} autoFocus>
              {lesson.step === l.steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          )}
          <button className="btn quiet" onClick={() => go('lessons')}>
            Leave
          </button>
        </div>
        <p className="coach-step">
          Step {lesson.step + 1} of {l.steps.length}
        </p>
      </section>
    </>
  );
}
