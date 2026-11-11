/**
 * Sound, made entirely in code with the Web Audio API (no audio files, so no licensing issues).
 * Hooks are named by moment, so real recordings can replace them later.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let drone: { stop: () => void } | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number) {
  const a = audio();
  if (!a || !master) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sound = {
  /** A soft tick for small controls. */
  click: () => tone(1400, 0.05, 'sine', 0.05),
  /** Rate stepper: higher pitch going up, lower going down. */
  step: (up: boolean) => tone(up ? 660 : 440, 0.09, 'triangle', 0.07),
  /** Sealing the decision: a low, heavy thud. */
  seal: () => {
    tone(110, 0.5, 'sine', 0.25, 0, 55);
    tone(220, 0.25, 'triangle', 0.06, 0.02);
  },
  /** Breaking news. */
  alert: () => {
    tone(880, 0.12, 'square', 0.04);
    tone(660, 0.18, 'square', 0.04, 0.14);
  },
  /** A page turning to the next quarter. */
  next: () => tone(300, 0.3, 'sine', 0.06, 0, 600),
  /** Quiet ambient hum for the committee room. */
  startAmbient: () => {
    const a = audio();
    if (!a || !master || drone) return;
    const g = a.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.025, a.currentTime + 3);
    const oscs = [55, 82.4, 110.3].map((f) => {
      const o = a.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g);
      o.start();
      return o;
    });
    g.connect(master);
    drone = {
      stop: () => {
        oscs.forEach((o) => o.stop());
        g.disconnect();
      },
    };
  },
  setMuted: (m: boolean) => {
    muted = m;
    if (m && drone) {
      drone.stop();
      drone = null;
    }
    if (!m) sound.startAmbient();
  },
};
