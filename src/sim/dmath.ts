/**
 * Maths that gives exactly the same answer on every computer.
 *
 * Adding, subtracting, multiplying, dividing and square roots are exact to the last bit on
 * every computer and in every browser (the IEEE 754 standard requires it). Math.log, Math.exp,
 * Math.sin, Math.cos and the rest are not: each browser engine has its own way of working them
 * out, and two of them can disagree in the last digit. In a game where two computers each run
 * the same simulation and only swap orders (lockstep multiplayer), one digit is enough for the
 * two worlds to drift apart. So the engine uses these instead, built only from the exact steps.
 *
 * They are accurate to about 15 significant figures, which is far more than the game needs.
 */

export const LN2 = 0.6931471805599453;
export const PI = 3.141592653589793;
const SQRT_HALF = 0.7071067811865476;

/** Natural logarithm, ln(x), for x > 0. */
export function ln(x: number): number {
  if (!(x > 0)) return x === 0 ? -Infinity : NaN;
  if (x === Infinity) return Infinity;
  // Write x = m * 2^k with m between 0.707 and 1.414. Halving and doubling are exact.
  let k = 0;
  let m = x;
  while (m >= 2 * SQRT_HALF) {
    m /= 2;
    k++;
  }
  while (m < SQRT_HALF) {
    m *= 2;
    k--;
  }
  // ln(m) = 2 (s + s^3/3 + s^5/5 + ...) with s = (m - 1) / (m + 1), and |s| < 0.172.
  const s = (m - 1) / (m + 1);
  const s2 = s * s;
  let term = s;
  let sum = 0;
  for (let n = 1; n < 40; n += 2) {
    sum += term / n;
    term *= s2;
  }
  return 2 * sum + k * LN2;
}

/** e^x. */
export function exp(x: number): number {
  if (x !== x) return NaN;
  if (x > 709.8) return Infinity;
  if (x < -745.2) return 0;
  // e^x = 2^k * e^r with |r| <= ln(2) / 2.
  const k = Math.round(x / LN2);
  const r = x - k * LN2;
  let term = 1;
  let sum = 1;
  for (let n = 1; n < 30; n++) {
    term *= r / n;
    sum += term;
  }
  let p = 1;
  const base = k < 0 ? 0.5 : 2;
  for (let i = 0; i < Math.abs(k); i++) p *= base;
  return sum * p;
}

/** Bring an angle into -pi to pi. */
function wrap(x: number): number {
  const turns = Math.round(x / (2 * PI));
  return x - turns * 2 * PI;
}

/** Sine of an angle in radians. */
export function sin(x: number): number {
  const a = wrap(x);
  const a2 = a * a;
  let term = a;
  let sum = a;
  for (let n = 1; n < 25; n++) {
    term *= -a2 / ((2 * n) * (2 * n + 1));
    sum += term;
  }
  return sum;
}

/** Cosine of an angle in radians. */
export function cos(x: number): number {
  const a = wrap(x);
  const a2 = a * a;
  let term = 1;
  let sum = 1;
  for (let n = 1; n < 25; n++) {
    term *= -a2 / ((2 * n - 1) * (2 * n));
    sum += term;
  }
  return sum;
}

/** Arctangent, in radians. */
export function atan(x: number): number {
  if (x !== x) return NaN;
  if (x < 0) return -atan(-x);
  if (x > 1) return PI / 2 - atan(1 / x);
  // Halve the angle until it is small: atan(y) = 2 atan(y / (1 + sqrt(1 + y^2))).
  let y = x;
  let times = 1;
  while (y > 0.1) {
    y = y / (1 + Math.sqrt(1 + y * y));
    times *= 2;
  }
  const y2 = y * y;
  let term = y;
  let sum = 0;
  for (let n = 1; n < 40; n += 2) {
    sum += term / n;
    term *= -y2;
  }
  return sum * times;
}

/** Arcsine, in radians, for x from -1 to 1. */
export function asin(x: number): number {
  if (x > 1 || x < -1) return NaN;
  if (x === 1 || x === -1) return (x * PI) / 2;
  return atan(x / Math.sqrt(1 - x * x));
}

/** x to the power y, for x > 0 (and 0 to a positive power). */
export function pow(x: number, y: number): number {
  if (y === 0) return 1;
  if (x === 0) return y > 0 ? 0 : Infinity;
  return exp(y * ln(x));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A date in words, e.g. "7 March 1936", worked out without the computer's language settings. */
export function dateWords(startDate: string, day: number): string {
  const d = new Date(`${startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
