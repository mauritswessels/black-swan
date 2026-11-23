/**
 * The attack menu and joint attacks (Stage K3).
 *
 * Right-click a province that is not yours and the screen shows every way to hit it, worked out
 * here so that it is the same on every computer and can be tested:
 *
 *   By land           divisions next to it (or the ones you selected) attack it;
 *   Push with an army an army pushes toward it (armies.ts);
 *   Land from the sea divisions on a coast sail and storm its beach (navy.ts);
 *   Drop paratroopers paratroopers jump onto it, or into an attack on it from behind (forces.ts);
 *   Support from the air  bomber wings in reach are aimed at it (air.ts);
 *   Win the sky       fighter wings in reach are aimed at it;
 *   Bomb the factories    bomber wings bomb its factories;
 *   Scout             one wing flies over it and reports what is there (intel.ts);
 *   Shell the coast   warships sail to the sea off it and shell it (navy.ts);
 *   Guard the sea     warships sail to the sea off it and patrol;
 *   Joint attack      all of it at once, timed so that the divisions go in when the fleets have
 *                     arrived and the wings are ready (and, for a landing, when the sea is yours).
 *
 * Options that cannot be used stay in the menu, greyed, with the reason. Each option that can
 * be used carries a preview (the outlook and forecast from combat.ts) and the orders it gives.
 *
 * A joint attack is kept in the world as a `Strike` until it goes in. Each morning `runStrikes`
 * looks at every one: once its fleets have arrived and its wings can fly, or after ten days in
 * any case, its divisions march (or jump). Divisions sailing for a joint landing start getting
 * ready at once, and wait at the end of their preparation until the sea off the beach is yours
 * (up to 45 days from the order). Nothing here is random.
 */
import { aimOf, airPicture, cannotAim, CAS_DAMAGE, km, wingRange, BOMB_DAMAGE, BOMB_MAX } from './air';
import { armiesOf, orderFor } from './armies';
import { forecast, outlook, type Outlook } from './combat';
import { allianceMap } from './diplomacy';
import { dropPlan, dropRange, fireSupport, pictures, type Pictures } from './forces';
import { visibleProvinces } from './intel';
import { findRoute, PROVINCES, routeDays } from './map';
import { combatEdges, modsOf } from './mods';
import { arrived, LANDING_BASE, logForce, SHELL_MAX, SHELL_POWER, shipPlan, type ForceDraft } from './navy';
import { COAST, isCoastal, SHIP_KINDS, ZONE_INDEX, zonePath, ZONES, sailDays, type SeaPicture } from './sea';
import { groundOn } from './seasons';
import type { Fleet, Order, Strike, Unit, Wing, World } from './types';
import { atWar, canEnter, enemiesOf } from './war';

/** Days a joint attack waits for its fleets and wings before its divisions go in anyway. */
export const STRIKE_WAIT = 10;

export type StrikeOrder = Extract<Order, { type: 'strike' }>;

// ---------------------------------------------------------------- joint attacks in the engine

/** The world as step() changes it, as far as joint attacks need it. */
export type StrikeDraft = ForceDraft & { strikes: Strike[]; nextStrikeId: number };

/** Take divisions out of any joint attack still waiting (they were given another order). */
export function leaveStrikes(d: Pick<StrikeDraft, 'strikes'>, units: number[]): void {
  if (!d.strikes.length) return;
  const gone = new Set(units);
  d.strikes = d.strikes.map((s) => (s.units.some((id) => gone.has(id)) ? { ...s, units: s.units.filter((id) => !gone.has(id)) } : s)).filter((s) => s.units.length);
}

/** Set up a joint attack. Orders that make no sense are ignored. */
export function giveStrikeOrder(d: StrikeDraft, o: StrikeOrder, friends: Map<string, Set<string>>, sea: () => SeaPicture): void {
  const p = PROVINCES[o.province];
  if (!p || d.capitulated.includes(o.country) || !['land', 'sea', 'drop'].includes(o.how)) return;
  const holder = d.controller[o.province];
  if (!atWar(d, o.country, holder)) return;
  const mates = friends.get(o.country);
  const mine = new Set(o.units);
  let units = d.units.filter((u) => u.owner === o.country && mine.has(u.id));
  if (o.how === 'land') units = units.filter((u) => !!findRoute(u.at, o.province, u.type, (q) => canEnter(d, o.country, q, mates)));
  if (o.how === 'drop') units = units.filter((u) => !('why' in dropPlan(d, friends, u, o.province)));
  if (o.how === 'sea') {
    const picture = sea();
    units = units.filter((u) => {
      const plan = shipPlan(d, picture, friends, { ...u, sea: undefined }, o.province, true);
      return !('why' in plan) && plan.landing;
    });
  }
  if (!units.length) return;
  leaveStrikes(d, units.map((u) => u.id));
  // One joint attack per province: a new one replaces the old.
  d.strikes = d.strikes.filter((s) => !(s.owner === o.country && s.province === o.province));
  const id = d.nextStrikeId++;
  if (o.how === 'sea') {
    const picture = sea();
    for (const u of units) {
      const plan = shipPlan(d, picture, friends, { ...u, sea: undefined }, o.province, true);
      if ('why' in plan) continue;
      u.path = [];
      u.progress = 0;
      u.landing = undefined;
      u.drop = undefined;
      u.sea = { to: o.province, daysLeft: plan.days, landing: true, strike: id };
    }
  } else {
    // They wait where they are until the attack goes in.
    for (const u of units) {
      u.path = [];
      u.progress = 0;
      u.sea = undefined;
      u.drop = undefined;
    }
  }
  const wings = d.wings.filter((x) => x.owner === o.country && o.wings.includes(x.id)).map((x) => x.id);
  const fleets = d.fleets.filter((f) => f.owner === o.country && o.fleets.includes(f.id)).map((f) => f.id);
  d.strikes.push({ id, owner: o.country, province: o.province, how: o.how, units: units.map((u) => u.id), wings, fleets, day: d.day });
}

/**
 * Each morning: joint attacks whose fleets have arrived and whose wings can fly (or that have
 * waited ten days) go in. Returns the orders for their divisions. Joint landings stay listed
 * until their last division has sailed.
 */
export function runStrikes(d: StrikeDraft): Order[] {
  if (!d.strikes.length) return [];
  const orders: Order[] = [];
  const keep: Strike[] = [];
  for (const s of d.strikes) {
    const units = d.units.filter((u) => u.owner === s.owner && s.units.includes(u.id));
    if (!units.length || d.capitulated.includes(s.owner)) continue;
    if (s.how === 'sea') {
      if (units.some((u) => u.sea?.strike === s.id)) keep.push(s);
      continue;
    }
    if (!atWar(d, s.owner, d.controller[s.province])) continue; // taken already, or peace
    const wings = d.wings.filter((x) => s.wings.includes(x.id));
    const fleets = d.fleets.filter((f) => s.fleets.includes(f.id));
    const ready = wings.every((x) => d.day >= x.ready) && fleets.every((f) => arrived(f, d.day));
    if (!ready && d.day - s.day < STRIKE_WAIT) {
      keep.push(s);
      continue;
    }
    for (const u of units) orders.push(s.how === 'drop' ? { type: 'drop', unit: u.id, to: s.province } : { type: 'move', unit: u.id, to: s.province });
    logForce(d, 'air', `${s.owner}: the joint attack on ${PROVINCES[s.province].name} goes in`, [s.owner, d.controller[s.province]], { province: s.province });
  }
  d.strikes = keep;
  return orders;
}

// ---------------------------------------------------------------- the menu

export type OptionKind = 'land' | 'army' | 'sea' | 'drop' | 'support' | 'sky' | 'bomb' | 'scout' | 'shell' | 'guard' | 'joint';

export interface MenuOption {
  kind: OptionKind;
  /** e.g. "Attack by land". */
  label: string;
  /** Who would do it, e.g. "6 divisions from Lorraine and Burgundy". */
  who: string;
  /** Why it cannot be used. Missing when it can. */
  why?: string;
  /** The preview: a few short lines on how it would go. */
  preview: string[];
  /** Whether the preview looks good for you. */
  tone?: 'good' | 'bad' | 'even';
  /** What choosing it does. Empty when it cannot be used. */
  orders: Order[];
  /** For an army option: which army. */
  army?: number;
}

export interface AttackMenu {
  province: number;
  holder: string;
  /** You can see the divisions there. */
  seen: boolean;
  /** You are at war with whoever holds it, or with divisions in it. */
  enemy: boolean;
  /** A line under the title, e.g. "At war with you · 4 divisions seen". */
  status: string;
  options: MenuOption[];
}

export interface MenuContext {
  /** Divisions the player has selected, if any: the land, sea and drop options use them first. */
  units?: number[];
  /** The army the player has selected, if any: listed first. */
  army?: number;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;
const list = (xs: string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');
const one = (x: number): string => (x >= 10 ? Math.round(x).toString() : x.toFixed(1));
const days = (n: number): string => (n <= 1 ? 'a day' : `${Math.round(n)} days`);
/** Province names for a set of divisions: "Lorraine and Burgundy", or "5 provinces". */
const fromWhere = (units: Unit[]): string => {
  const places = [...new Set(units.map((u) => u.at))];
  return places.length <= 3 ? list(places.map((p) => PROVINCES[p].name)) : `${places.length} provinces`;
};

/** Is the division free to be given a new job (not sailing, jumping, storming a beach or already attacking)? */
const free = (w: World, u: Unit): boolean => !u.sea && !u.drop && !u.landing && !(u.path.length && w.units.some((e) => e.at === u.path[0] && atWar(w, e.owner, u.owner)));

/** The preview lines of an attack, from its outlook. */
function attackPreview(o: Outlook, line: number, extraDays = 0): { lines: string[]; tone: MenuOption['tone'] } {
  const f = forecast(o, line);
  const lines: string[] = [];
  const total = f.days + extraDays;
  if (f.ends === 'win') lines.push(`${o.favours === 'even' ? 'Close, but should' : 'Should'} break through in about ${days(total)}`);
  else lines.push(`Unlikely to break through: the attack runs out of steam after about ${days(total)}`);
  lines.push(`Losses: yours about ${f.attackerLoss.toFixed(1)} divisions, theirs about ${f.defenderLoss.toFixed(1)}`);
  lines.push(`${o.attackers} against ${o.defenders}, front line ${o.push >= 0 ? '+' : ''}${o.push.toFixed(1)} points a day${o.attackFire > 0 ? `, fire support +${one(o.attackFire)}` : ''}`);
  return { lines, tone: f.ends === 'win' ? (o.favours === 'even' ? 'even' : 'good') : 'bad' };
}

/** Sky words, from one side's air score and the enemy's (the same rule as in a battle). */
function skyWords(mine: number, enemy: number): string {
  if (mine >= 0.5 && mine >= 1.5 * enemy) return 'yours';
  if (enemy >= 0.5 && enemy >= 1.5 * mine) return "the enemy's";
  if (mine > 0.05 || enemy > 0.05) return 'contested';
  return 'empty';
}

/** Every way this country could hit a province right now. */
export function attackMenu(w: World, country: string, province: number, ctx: MenuContext = {}, given?: Pictures): AttackMenu {
  const p = PROVINCES[province];
  const holder = w.controller[province];
  const friends = allianceMap(w.diplomacy);
  const mates = friends.get(country);
  const pics = given ?? pictures(w, friends);
  const seen = visibleProvinces(w, country)[province];
  const foes = enemiesOf(w, country);
  const defenders = w.units.filter((u) => u.at === province && atWar(w, country, u.owner));
  const seenDefenders = seen ? defenders : [];
  const enemy = atWar(w, country, holder) || seenDefenders.length > 0;
  const mineOrAlly = holder === country || !!mates?.has(holder);
  const notAtWar = mineOrAlly ? `${p.name} is ${holder === country ? 'yours' : `held by your ally ${holder}`}` : `you are not at war with ${holder}: declare war in Diplomacy first`;
  const edges = combatEdges(w.economies, { effects: w.story.effects, day: w.day, startDate: w.startDate, armies: w.armies });
  const ground = groundOn(province, w.startDate, w.day);
  const line = w.battles.find((b) => b.province === province)?.line ?? 0;
  const fire = fireSupport(w, pics, friends);
  const defenderSides = [...new Set(seenDefenders.map((u) => u.owner))];
  const firePlus = (extra = 0) => {
    const f = defenderSides.length ? fire(province, [country], defenderSides) : { attack: 0, defence: 0 };
    return { attack: f.attack + extra, defence: f.defence };
  };
  const air = (attackers: string[]) => (defenderSides.length ? pics.air.battle(attackers, defenderSides, province) : 1);
  const selected = new Set(ctx.units ?? []);
  const mine = w.units.filter((u) => u.owner === country);
  const options: MenuOption[] = [];
  const grey = (kind: OptionKind, label: string, why: string, who = ''): MenuOption => ({ kind, label, who, why, preview: [], orders: [] });
  const blind = `You cannot see what is in ${p.name}. Scout it first.`;

  // ---- By land
  let landUnits: Unit[] = [];
  {
    const label = 'Attack by land';
    if (!enemy) options.push(grey('land', label, notAtWar));
    else {
      const reach = (u: Unit) => !!findRoute(u.at, province, u.type, (q) => canEnter(w, country, q, mates));
      const chosen = mine.filter((u) => selected.has(u.id) && free(w, u) && reach(u));
      landUnits = chosen.length ? chosen : mine.filter((u) => free(w, u) && !u.path.length && p.neighbours.includes(u.at) && !w.battles.some((b) => b.province === u.at));
      if (!landUnits.length) options.push(grey('land', label, `no divisions of yours stand next to ${p.name}. Select some first, or use an army`));
      else {
        const next = landUnits.filter((u) => p.neighbours.includes(u.at));
        const who = `${plural(landUnits.length, 'division')} from ${fromWhere(landUnits)}`;
        let preview: string[];
        let tone: MenuOption['tone'];
        if (!seen) preview = [blind];
        else if (!seenDefenders.length) {
          const far = Math.max(...landUnits.map((u) => routeDays(u.at, findRoute(u.at, province, u.type, (q) => canEnter(w, country, q, mates)) ?? [], u.type)));
          preview = [`Nobody there: they walk in, about ${days(far)}`];
          tone = 'good';
        } else if (!next.length) preview = [`They have to march there first: no outlook until they arrive`];
        else {
          const o = outlook(next.map((u) => ({ ...u, path: [province] })), seenDefenders, province, edges, air([country]), ground, line, firePlus());
          ({ lines: preview, tone } = o ? attackPreview(o, line) : { lines: [], tone: undefined });
          if (next.length < landUnits.length) preview.push(`${plural(landUnits.length - next.length, 'more division')} on the way`);
        }
        options.push({ kind: 'land', label, who, preview, tone, orders: landUnits.map((u) => ({ type: 'move', unit: u.id, to: province })) });
      }
    }
  }

  // ---- Push with an army
  {
    const armies = armiesOf(w, country).filter((a) => a.units.length);
    const ordered = [...armies.filter((a) => a.id === ctx.army), ...armies.filter((a) => a.id !== ctx.army)].slice(0, 3);
    for (const a of ordered) {
      const label = `Push with ${a.name}`;
      const who = plural(a.units.length, 'division');
      if (!enemy) {
        options.push(grey('army', label, notAtWar, who));
        continue;
      }
      const got = orderFor(w, country, a, province, 'push');
      if ('why' in got) options.push({ ...grey('army', label, got.why, who), army: a.id });
      else options.push({ kind: 'army', label, who, army: a.id, preview: ['Attacks toward it on every province in the way, where the odds are good (steady pace unless you change it)'], orders: [{ type: 'armyOrder', country, army: a.id, order: got.order }] });
    }
  }

  // ---- Land from the sea
  let seaUnits: Unit[] = [];
  let seaPlanned = false;
  {
    const label = 'Land from the sea';
    if (!enemy) options.push(grey('sea', label, notAtWar));
    else if (!isCoastal(province)) options.push(grey('sea', label, `${p.name} has no coast`));
    else {
      const front = (u: Unit) => PROVINCES[u.at].neighbours.some((n) => atWar(w, country, w.controller[n]));
      const pool = mine.filter((u) => free(w, u) && !u.path.length && isCoastal(u.at) && (selected.size ? selected.has(u.id) : !front(u))).sort((a, b) => km(a.at, province) - km(b.at, province) || a.id - b.id);
      const pick = (planned: boolean) => {
        const ok: { u: Unit; days: number }[] = [];
        let why = '';
        let room = Infinity;
        for (const u of pool) {
          const plan = shipPlan(w, pics.sea, friends, { ...u, sea: undefined }, province, planned);
          if ('why' in plan) {
            why ||= plan.why;
            continue;
          }
          if (room === Infinity) {
            const zone = plan.zones[plan.zones.length - 1];
            let afloat = 0;
            for (const [name, n] of pics.sea.ships[zone]) if (name === country || mates?.has(name)) afloat += n;
            room = LANDING_BASE + Math.floor(afloat) + (planned ? 2 : 0);
          }
          if (ok.length < room) ok.push({ u, days: plan.days });
        }
        return { ok, why };
      };
      const now = pick(false);
      if (now.ok.length) {
        seaUnits = now.ok.map((x) => x.u);
        const prep = Math.max(...now.ok.map((x) => x.days));
        let preview: string[];
        let tone: MenuOption['tone'];
        if (!seen) preview = [`Ready to sail in ${days(prep)}`, blind];
        else if (!seenDefenders.length) {
          preview = [`Nobody seen there: they land and take it after ${days(prep)} of preparation`];
          tone = 'good';
        } else {
          const o = outlook(seaUnits.map((u) => ({ ...u, path: [province], landing: true })), seenDefenders, province, edges, air([country]), ground, line, firePlus());
          ({ lines: preview, tone } = o ? attackPreview(o, line, prep) : { lines: [], tone: undefined });
          preview.push(`${days(prep)} to get ready; they fight at 60% as they come ashore`);
        }
        options.push({ kind: 'sea', label, who: `${plural(seaUnits.length, 'division')} from ${fromWhere(seaUnits)}`, preview, tone, orders: seaUnits.map((u) => ({ type: 'ship', unit: u.id, to: province })) });
      } else {
        const later = pick(true);
        if (later.ok.length) {
          seaUnits = later.ok.map((x) => x.u);
          seaPlanned = true;
        }
        options.push(grey('sea', label, pool.length ? `${now.why}${later.ok.length ? '. Guard the sea first, or use a joint attack, which waits for the fleet' : ''}` : selected.size ? 'none of the divisions you selected stand on a coast, free to sail' : 'no divisions of yours on a coast away from the front are free to sail'));
      }
    }
  }

  // ---- Drop paratroopers
  let dropUnits: Unit[] = [];
  {
    const label = 'Drop paratroopers';
    const paras = mine.filter((u) => u.type === 'airborne');
    if (!enemy) options.push(grey('drop', label, notAtWar));
    else if (!paras.length) options.push(grey('drop', label, modsOf(w.economies[country]).airborne ? 'you have no paratroopers yet: build them in Production' : 'you have no paratroopers: research Airborne forces (Infantry), then build them in Production'));
    else {
      const pool = paras.filter((u) => free(w, u) && (!selected.size || selected.has(u.id) || !paras.some((x) => selected.has(x.id))));
      const plans = pool.map((u) => ({ u, plan: dropPlan(w, friends, u, province) }));
      dropUnits = plans.filter((x) => !('why' in x.plan)).map((x) => x.u);
      if (!dropUnits.length) {
        const first = plans.find((x) => 'why' in x.plan);
        options.push(grey('drop', label, first && 'why' in first.plan ? first.plan.why : 'your paratroopers are all busy'));
      } else {
        const mineSky = pics.air.side([country], province);
        const theirSky = foes.length ? pics.air.side(foes, province) : 0;
        const sky = skyWords(mineSky, theirSky);
        const vp = p.victoryPoints ? ` (${plural(p.victoryPoints, 'victory point')})` : '';
        const ours = w.battles.find((b) => b.province === province && b.attackers.includes(country));
        const preview = [
          !seenDefenders.length
            ? `They jump in 3 days and take ${p.name} at once${vp}`
            : ours
              ? `They jump in 3 days and join your attack on ${p.name} from behind, at 70% strength in the fight${vp}`
              : `They jump in 3 days and attack ${p.name} on their own, at 70% strength in the fight: alone they will likely be captured. Better to drop into a battle you are winning`,
          sky === 'yours' ? 'The sky is yours: a clean drop' : sky === "the enemy's" ? "The sky is the enemy's: about 30% of them lost on the way down" : sky === 'contested' ? 'The sky is contested: about 10% of them lost on the way down' : 'Nobody in the sky: a clean drop',
          'Cut off once down: send troops to join them within a week or two',
        ];
        if (!seen) preview.push(`${blind} If enemy divisions are there, the paratroopers land in a fight`);
        const alone = seenDefenders.length > 0 && !ours;
        options.push({ kind: 'drop', label, who: `${plural(dropUnits.length, 'paratrooper division')} from ${fromWhere(dropUnits)} (reach ${Math.round(dropRange(w, country))} km)`, preview, tone: sky === "the enemy's" || alone ? 'bad' : seen ? 'good' : 'even', orders: dropUnits.map((u) => ({ type: 'drop', unit: u.id, to: province })) });
      }
    }
  }

  // ---- Air wings in reach
  const myWings = w.wings.filter((x) => x.owner === country && x.strength > 0);
  // A wing scouting another province keeps doing that: the other options leave it alone.
  const inReach = (x: Wing) => !cannotAim(w, x, province) && !(x.mission === 'scout' && aimOf(x) !== undefined && aimOf(x) !== province);
  const bombers = myWings.filter((x) => x.type === 'bomber' && inReach(x));
  const fighters = myWings.filter((x) => x.type === 'fighter' && inReach(x));
  const wingWho = (xs: Wing[], kind: string) => `${plural(xs.length, `${kind} wing`)} from ${list([...new Set(xs.map((x) => PROVINCES[x.base].name))].slice(0, 3))}`;
  const noWings = (kind: 'bomber' | 'fighter') => (myWings.some((x) => x.type === kind) ? `no ${kind} wing of yours is within reach of ${p.name}. Move one closer (they reach ${Math.round(wingRange({ type: kind }, modsOf(w.economies[country])))} km)` : `you have no ${kind} wings`);
  /** Sky over the province now and if these wings were aimed at it. */
  const skyAfter = (xs: Wing[], mission: Wing['mission']) => {
    const before = skyWords(pics.air.side([country], province), foes.length ? pics.air.side(foes, province) : 0);
    const ids = new Set(xs.map((x) => x.id));
    const after = airPicture({ ...w, wings: w.wings.map((x) => (ids.has(x.id) ? { ...x, mission, target: province, ready: Math.min(x.ready, w.day) } : x)) }, friends);
    const now = skyWords(after.side([country], province), foes.length ? after.side(foes, province) : 0);
    return { before, now };
  };
  const enemyFighters = (() => {
    let x = 0;
    for (const [name, f] of pics.air.fighters) if (atWar(w, country, name)) x += f[province];
    return x;
  })();
  const aimOrders = (xs: Wing[], mission: Wing['mission']): Order[] => xs.map((x) => ({ type: 'wing', wing: x.id, mission, target: province }));

  // ---- Support from the air
  let cas = 0;
  {
    const label = 'Support from the air';
    if (!enemy) options.push(grey('support', label, notAtWar));
    else if (!bombers.length) options.push(grey('support', label, noWings('bomber')));
    else {
      const m = modsOf(w.economies[country]);
      cas = bombers.reduce((a, x) => a + CAS_DAMAGE * (x.strength / 100) * (1 + m.bomberPower), 0) / (1 + enemyFighters);
      const sky = skyAfter(bombers, 'ground');
      const already = bombers.every((x) => x.mission === 'ground' && aimOf(x) === province);
      const preview = [`Adds about ${one(cas)} damage a day to your side in a battle there${enemyFighters > 0.05 ? ' (less, with enemy fighters about)' : ''}`, `The sky over it: ${sky.before}${sky.now !== sky.before ? `, then ${sky.now}` : ''}`, 'Before a battle, they stop the defenders digging in'];
      if (already) preview.unshift('Already aimed here');
      options.push({ kind: 'support', label, who: wingWho(bombers, 'bomber'), preview, tone: sky.now === "the enemy's" ? 'bad' : 'good', orders: aimOrders(bombers, 'ground') });
    }
  }

  // ---- Win the sky
  {
    const label = 'Win the sky';
    if (!enemy) options.push(grey('sky', label, notAtWar));
    else if (!fighters.length) options.push(grey('sky', label, noWings('fighter')));
    else {
      const sky = skyAfter(fighters, 'superiority');
      options.push({ kind: 'sky', label, who: wingWho(fighters, 'fighter'), preview: [`The sky over ${p.name}: ${sky.before}${sky.now !== sky.before ? `, then ${sky.now}` : ', and still so'}`, 'They count 1.5 times there, and leave everywhere else in their reach'], tone: sky.now === 'yours' ? 'good' : sky.now === "the enemy's" ? 'bad' : 'even', orders: aimOrders(fighters, 'superiority') });
    }
  }

  // ---- Bomb the factories
  {
    const label = 'Bomb the factories';
    const factories = w.factories.civ[province] + w.factories.mil[province];
    if (!atWar(w, country, holder)) options.push(grey('bomb', label, mineOrAlly ? notAtWar : `you are not at war with ${holder}`));
    else if (!factories) options.push(grey('bomb', label, `there are no factories in ${p.name}`));
    else if (!bombers.length) options.push(grey('bomb', label, noWings('bomber')));
    else {
      const m = modsOf(w.economies[country]);
      const hit = bombers.reduce((a, x) => a + (BOMB_DAMAGE * (x.strength / 100) * (1 + m.bomberPower)) / (1 + enemyFighters), 0);
      const out = w.bombed[province] ?? 0;
      options.push({ kind: 'bomb', label, who: wingWho(bombers, 'bomber'), preview: [`${factories} ${factories === 1 ? 'factory' : 'factories'} there, ${Math.round(out * 100)}% already out of action`, `Knocks out about ${(hit * 100).toFixed(1)}% of them a day, up to ${Math.round(BOMB_MAX * 100)}%`, enemyFighters > 0.05 ? `Enemy fighters over it (${one(enemyFighters)}): heavier losses` : 'No enemy fighters over it'], tone: enemyFighters > 1 ? 'even' : 'good', orders: aimOrders(bombers, 'strategic') });
    }
  }

  // ---- Scout
  {
    const label = 'Scout';
    const any = [...fighters, ...bombers].sort((a, b) => Number(b.type === 'fighter') - Number(a.type === 'fighter') || km(a.base, province) - km(b.base, province) || a.id - b.id)[0];
    if (mineOrAlly) options.push(grey('scout', label, notAtWar));
    else if (!any) options.push(grey('scout', label, myWings.length ? `no wing of yours is within reach of ${p.name}` : 'you have no air wings'));
    else {
      const preview = [seen ? `You can already see ${p.name}: scouting shows the provinces around it too` : `Shows every division in ${p.name} and next to it, from now on while the wing flies there`];
      if (enemyFighters > 0.05) preview.push(`Enemy fighters over it (${one(enemyFighters)}): the wing loses a few aircraft a day`);
      options.push({ kind: 'scout', label, who: `${any.type === 'fighter' ? 'A fighter' : 'A bomber'} wing from ${PROVINCES[any.base].name}`, preview, tone: 'good', orders: [{ type: 'wing', wing: any.id, mission: 'scout', target: province }] });
    }
  }

  // ---- Ships: shell the coast, guard the sea
  let shellFleets: { f: Fleet; zone: number; days: number }[] = [];
  {
    const coastal = isCoastal(province);
    const warships = w.fleets.filter((f) => f.owner === country && f.ships.capital + f.ships.escort >= 0.5);
    // For each fleet: the zone off the province it can reach soonest.
    const reach = warships
      .map((f) => {
        let best: { zone: number; days: number } | null = null;
        for (const z of COAST[province]) {
          const path = zonePath(ZONE_INDEX[f.zone], z, (q) => q === z || pics.sea.status(country, q) !== 'enemy');
          if (!path) continue;
          const d = Math.max(0, f.arrives - w.day) + sailDays(path);
          if (!best || d < best.days) best = { zone: z, days: d };
        }
        return best ? { f, ...best } : null;
      })
      .filter((x): x is { f: Fleet; zone: number; days: number } => !!x && x.days <= 12)
      .sort((a, b) => a.days - b.days || a.f.id - b.f.id);
    const why = !coastal ? `${p.name} has no coast` : !warships.length ? 'you have no warships' : `none of your warships can reach the sea off ${p.name} soon`;
    const fleetWho = (xs: typeof reach) => `${list(xs.slice(0, 3).map((x) => x.f.name))}${xs.length > 3 ? ` and ${xs.length - 3} more` : ''}`;
    const zoneName = (xs: typeof reach) => list([...new Set(xs.map((x) => ZONES[x.zone].name))]);
    const status = (z: number) => {
      const s = pics.sea.status(country, z);
      return s === 'own' ? 'yours' : s === 'enemy' ? "the enemy's" : s === 'contested' ? 'contested' : 'empty';
    };
    if (!atWar(w, country, holder) && !seenDefenders.length) options.push(grey('shell', 'Shell the coast', notAtWar));
    else if (!coastal || !reach.length) options.push(grey('shell', 'Shell the coast', why));
    else {
      shellFleets = reach;
      const m = modsOf(w.economies[country]);
      const guns = Math.min(SHELL_MAX, reach.reduce((a, x) => a + SHIP_KINDS.reduce((b, k) => b + x.f.ships[k] * SHELL_POWER[k], 0), 0) * (1 + m.navalPower));
      options.push({
        kind: 'shell',
        label: 'Shell the coast',
        who: fleetWho(reach),
        preview: [`Adds about ${one(guns)} damage a day to your side in a battle there (half while the sea is contested)`, `In the ${zoneName(reach)} in ${days(Math.max(...reach.map((x) => x.days)))}; the sea there is ${status(reach[0].zone)} now`, 'Shore batteries hit back: a few ships damaged a week'],
        tone: pics.sea.status(country, reach[0].zone) === 'enemy' ? 'bad' : 'good',
        orders: reach.map((x) => ({ type: 'fleet', fleet: x.f.id, zone: ZONES[x.zone].id === x.f.zone ? undefined : ZONES[x.zone].id, mission: 'patrol', target: province })),
      });
    }
    if (!coastal || !reach.length) options.push(grey('guard', 'Guard the sea', why));
    else {
      const z = reach[0].zone;
      let mine = 0;
      let theirs = 0;
      for (const [name, x] of pics.sea.power[z]) {
        if (name === country || mates?.has(name)) mine += x;
        else if (atWar(w, country, name)) theirs += x;
      }
      const m = modsOf(w.economies[country]);
      const add = reach.filter((x) => x.zone === z && !(x.f.zone === ZONES[z].id && x.f.mission === 'patrol')).reduce((a, x) => a + SHIP_KINDS.reduce((b, k) => b + x.f.ships[k] * ({ capital: 10, escort: 3, submarine: 1 } as const)[k], 0) * (1 + m.navalPower), 0);
      const after = mine + add;
      const word = after >= 2 * theirs ? 'yours' : theirs >= 2 * after ? "the enemy's" : 'contested';
      options.push({ kind: 'guard', label: 'Guard the sea', who: fleetWho(reach), preview: [`The ${ZONES[z].name} is ${status(z)} now; with them on patrol it would be ${word}`, 'Control of the sea lets you land there, and keeps the enemy from landing'], tone: word === 'yours' ? 'good' : word === "the enemy's" ? 'bad' : 'even', orders: reach.map((x) => ({ type: 'fleet', fleet: x.f.id, zone: ZONES[x.zone].id === x.f.zone ? undefined : ZONES[x.zone].id, mission: 'patrol' })) });
    }
  }

  // ---- Joint attack: everything at once
  {
    const label = 'Joint attack';
    const how: 'land' | 'sea' | 'drop' | null = landUnits.length ? 'land' : seaUnits.length ? 'sea' : dropUnits.length ? 'drop' : null;
    const units = how === 'land' ? landUnits : how === 'sea' ? seaUnits : dropUnits;
    const ships = how === 'sea' || (how === 'land' && seenDefenders.length) ? shellFleets : [];
    const wingsUsed = [...bombers, ...fighters];
    if (!enemy) options.push(grey('joint', label, notAtWar));
    else if (!how) options.push(grey('joint', label, 'there is nobody to send in: no divisions next to it, none that can land there, and no paratroopers in reach'));
    else if (!wingsUsed.length && !ships.length) options.push(grey('joint', label, `nothing to time it with: no air wings in reach of ${p.name} and no warships that can reach its coast`));
    else {
      const wait = Math.max(0, ...wingsUsed.map((x) => x.ready - w.day), ...ships.map((x) => x.days));
      const parts = [plural(units.length, how === 'drop' ? 'paratrooper division' : 'division'), bombers.length ? plural(bombers.length, 'bomber wing') : '', fighters.length ? plural(fighters.length, 'fighter wing') : '', ships.length ? plural(ships.length, 'fleet') : ''].filter(Boolean);
      const preview: string[] = [];
      let tone: MenuOption['tone'];
      if (how === 'sea') {
        const prep = Math.max(...units.map((u) => {
          const plan = shipPlan(w, pics.sea, friends, { ...u, sea: undefined }, province, true);
          return 'why' in plan ? 0 : plan.days;
        }));
        preview.push(`The fleets clear the sea${ships.length ? ` (in place in ${days(Math.max(0, ...ships.map((x) => x.days)))})` : ''}, the bombers soften up the coast, and the divisions land when the sea is yours: no sooner than ${days(prep)}`);
      } else preview.push(wait > 0 ? `The ${how === 'drop' ? 'drop' : 'attack'} goes in when the ${ships.length ? 'fleets are in place and the ' : ''}wings are ready: in about ${days(wait)}` : `Everything is in place: the ${how === 'drop' ? 'drop' : 'attack'} goes in tomorrow`);
      if (how !== 'drop' && seen && seenDefenders.length) {
        const shellGuns = ships.length ? Math.min(SHELL_MAX, ships.reduce((a, x) => a + SHIP_KINDS.reduce((b, k) => b + x.f.ships[k] * SHELL_POWER[k], 0), 0)) : 0;
        const attackers = how === 'land' ? units.filter((u) => p.neighbours.includes(u.at)).map((u) => ({ ...u, path: [province] })) : units.map((u) => ({ ...u, path: [province], landing: true }));
        const after = airPicture({ ...w, wings: w.wings.map((x) => (wingsUsed.includes(x) ? { ...x, mission: x.type === 'bomber' ? 'ground' : 'superiority', target: province, ready: Math.min(x.ready, w.day) } : x)) }, friends);
        const o = attackers.length ? outlook(attackers, seenDefenders, province, edges, after.battle([country], defenderSides, province), ground, line, firePlus(cas + shellGuns)) : null;
        if (o) {
          const a = attackPreview(o, line);
          preview.push(...a.lines);
          tone = a.tone;
        }
      } else if (!seen) preview.push(blind);
      options.push({
        kind: 'joint',
        label,
        who: parts.join(', '),
        preview,
        tone,
        orders: [
          ...aimOrders(bombers, 'ground'),
          ...aimOrders(fighters, 'superiority'),
          ...ships.map((x) => ({ type: 'fleet', fleet: x.f.id, zone: ZONES[x.zone].id === x.f.zone ? undefined : ZONES[x.zone].id, mission: 'patrol', target: province }) as Order),
          { type: 'strike', country, province, how, units: units.map((u) => u.id), wings: wingsUsed.map((x) => x.id), fleets: ships.map((x) => x.f.id) },
        ],
      });
      if (seaPlanned && how === 'sea') options[options.length - 1].preview.push('The sea off the beach is not yours yet: the landing waits for the fleet, up to 45 days');
    }
  }

  // Joint attack first when it can be used; then the rest in a fixed order, usable ones first.
  const order: OptionKind[] = ['joint', 'land', 'army', 'sea', 'drop', 'support', 'sky', 'shell', 'guard', 'bomb', 'scout'];
  options.sort((a, b) => Number(!!a.why) - Number(!!b.why) || order.indexOf(a.kind) - order.indexOf(b.kind));
  const count = seenDefenders.length;
  const status = [mineOrAlly ? (holder === country ? 'Yours' : `Your ally ${holder}`) : atWar(w, country, holder) ? `${holder} · at war with you` : `${holder} · not at war with you`, seen ? (count ? `${plural(count, 'enemy division')} seen` : 'no enemy divisions seen') : 'nobody knows what is there'].join(' · ');
  return { province, holder, seen, enemy, status, options };
}

/** A strike's progress for the screen: what it is still waiting for. */
export function strikeStatus(w: World, s: Strike): string {
  const p = PROVINCES[s.province].name;
  if (s.how === 'sea') {
    const sailing = w.units.filter((u) => u.sea?.strike === s.id);
    const left = Math.max(0, ...sailing.map((u) => u.sea!.daysLeft));
    return left > 1 ? `Joint landing at ${p}: ${plural(sailing.length, 'division')} getting ready, ${days(left)} to go` : `Joint landing at ${p}: ready, waiting for the sea off the beach to be yours`;
  }
  const wings = w.wings.filter((x) => s.wings.includes(x.id) && w.day < x.ready).length;
  const fleets = w.fleets.filter((f) => s.fleets.includes(f.id) && !arrived(f, w.day)).length;
  const waiting = [wings ? plural(wings, 'wing') : '', fleets ? plural(fleets, 'fleet') : ''].filter(Boolean);
  return `Joint attack on ${p}: ${waiting.length ? `waiting for ${list(waiting)}` : 'goes in tomorrow'}`;
}

// ---------------------------------------------------------------- the AI's paratroopers

/** AI paratroopers jump only when this rested. */
export const AI_DROP_ORG = 80;
/** At most this many divisions jump together. */
export const AI_DROP_SIZE = 3;

/**
 * Orders for an AI country's paratroopers. Rested paratroopers drop on an empty enemy province
 * just behind the enemy's front (next to a province of the enemy's with divisions in it that the
 * country is attacking or faces with two divisions or more), or into a battle the country is
 * attacking and winning (its front line moving forward): whichever scores best on victory
 * points and enemy divisions nearby, where the enemy does not hold the sky. One drop a day.
 */
export function aiDropOrders(w: World, country: string, friends: Map<string, Set<string>>, pics: Pictures): Order[] {
  const paras = w.units.filter((u) => u.owner === country && u.type === 'airborne' && !u.path.length && !u.sea && !u.drop && !u.landing && u.organisation >= AI_DROP_ORG && u.strength >= 70);
  if (!paras.length) return [];
  const foes = enemiesOf(w, country);
  if (!foes.length) return [];
  const enemyAt = new Map<number, number>();
  for (const u of w.units) if (foes.includes(u.owner)) enemyAt.set(u.at, (enemyAt.get(u.at) ?? 0) + 1);
  // Not from a province the enemy is attacking.
  const ready = paras.filter((u) => !w.battles.some((b) => b.province === u.at));
  if (!ready.length) return [];
  // The enemy's front: provinces it holds with divisions in them, under attack or next to two or more of ours.
  const ours = new Map<number, number>();
  for (const u of w.units) if (u.owner === country) ours.set(u.at, (ours.get(u.at) ?? 0) + 1);
  const front = new Set(w.battles.filter((b) => b.attackers.includes(country)).map((b) => b.province));
  for (const [q, n] of enemyAt) if (n > 0 && PROVINCES[q].neighbours.some((x) => (ours.get(x) ?? 0) >= 2 && w.controller[x] === country)) front.add(q);
  let best = -1;
  let score = 0;
  for (const q of [...front].sort((a, b) => a - b)) {
    for (const p of PROVINCES[q].neighbours) {
      if (enemyAt.get(p) || !foes.includes(w.controller[p])) continue;
      const theirs = pics.air.side(foes, p);
      const mineSky = pics.air.side([country], p);
      if (theirs >= 0.5 && theirs >= 1.5 * mineSky) continue;
      const s = 2 * PROVINCES[p].victoryPoints + PROVINCES[p].neighbours.reduce((a, n) => a + (enemyAt.get(n) ?? 0), 0) + 1;
      if (s > score || (s === score && p < best)) {
        if (!ready.some((u) => !('why' in dropPlan(w, friends, u, p)))) continue;
        score = s;
        best = p;
      }
    }
  }
  // Or into a battle that is going well, to finish it from a new direction.
  for (const b of w.battles) {
    if (!b.attackers.includes(country) || b.push <= 0 || b.line < 20) continue;
    const p = b.province;
    const theirs = pics.air.side(foes, p);
    const mineSky = pics.air.side([country], p);
    if (theirs >= 0.5 && theirs >= 1.5 * mineSky) continue;
    const s = 2 * PROVINCES[p].victoryPoints + (enemyAt.get(p) ?? 0);
    if (s > score || (s === score && best >= 0 && p < best)) {
      if (!ready.some((u) => !('why' in dropPlan(w, friends, u, p)))) continue;
      score = s;
      best = p;
    }
  }
  if (best < 0) return [];
  return ready
    .filter((u) => !('why' in dropPlan(w, friends, u, best)))
    .sort((a, b) => km(a.at, best) - km(b.at, best) || a.id - b.id)
    .slice(0, AI_DROP_SIZE)
    .map((u) => ({ type: 'drop', unit: u.id, to: best }));
}
