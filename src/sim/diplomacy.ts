/**
 * Diplomacy: how countries regard each other, the promises they make, and how wars start and end.
 *
 *   Relations   every pair of countries has a number from -100 to 100. It drifts towards a
 *               resting point set by their governments, their history, their pacts and their
 *               claims, and jumps when something happens (a war, a broken promise).
 *   Pacts       an alliance (each defends the other, and their armies may use each other's
 *               land), a guarantee (one promises to defend the other) and a non-aggression pact.
 *   Tension     one number for all of Europe, 0 to 100. Ultimatums, annexations and wars raise
 *               it. The democracies will not take risks until it is high.
 *   Causes      a country needs a cause to declare war: a claim, a promise to keep, or a case
 *               it has built. In Free-for-all a war without a cause is allowed, at a price.
 *   Ultimatums  a country with a claim can demand it. The target gives in only if it stands
 *               alone and is much weaker; its protectors decide whether to stand by it.
 *   Peace       an offer is accepted or refused on the war score: land held, armies left,
 *               and the mood at home. A country that surrenders is occupied; when its
 *               conqueror falls in turn, it is restored.
 *
 * Pure TypeScript with no UI. Everything here changes a draft of the world that step() made;
 * nothing uses random numbers, so the same orders always give the same diplomacy.
 */
import { COUNTRIES } from './countries';
import { DECLARATION_COST } from './economy';
import { PROVINCES } from './map';
import type { Decision, Demand, DipEvent, Diplomacy, Economy, Government, Mode, Order, Pact, PactKind, PeaceTerms, Ultimatum, Unit, UnitType, World } from './types';
import { warKey } from './war';

export type DiplomacyOrder = Extract<Order, { type: 'declareWar' | 'makePeace' | 'offerPeace' | 'propose' | 'guarantee' | 'endPact' | 'justify' | 'ultimatum' | 'mission' | 'callAlly' | 'decide' | 'settle' }>;
const DIPLOMACY_ORDERS = new Set(['declareWar', 'makePeace', 'offerPeace', 'propose', 'guarantee', 'endPact', 'justify', 'ultimatum', 'mission', 'callAlly', 'decide', 'settle']);
export const isDiplomacyOrder = (o: Order): o is DiplomacyOrder => DIPLOMACY_ORDERS.has(o.type);

/** The parts of the world diplomacy reads and changes during a day. */
export interface DipDraft {
  day: number;
  startDate: string;
  mode: Mode;
  player: string | null;
  units: Unit[];
  nextUnitId: number;
  controller: string[];
  owner: string[];
  wars: string[];
  declaredBy: Record<string, string>;
  capitulated: string[];
  economies: Record<string, Economy>;
  factories: World['factories'];
  diplomacy: Diplomacy;
}

type View = Pick<World, 'units' | 'controller' | 'owner' | 'wars' | 'capitulated' | 'economies' | 'diplomacy' | 'day' | 'mode' | 'player'> & { declaredBy: Record<string, string> };

// ---------- the numbers ----------

/** Where relations rest between two kinds of government. */
const IDEOLOGY: Record<Government, Record<Government, number>> = {
  democracy: { democracy: 25, authoritarian: -5, fascist: -30, communist: -25 },
  authoritarian: { democracy: -5, authoritarian: 5, fascist: 5, communist: -30 },
  fascist: { democracy: -30, authoritarian: 5, fascist: 20, communist: -45 },
  communist: { democracy: -25, authoritarian: -30, fascist: -45, communist: 20 },
};

/** Friendships and quarrels of 1936 that the kind of government does not explain. */
const HISTORY: [string, string, number][] = [
  ['United Kingdom', 'France', 35], ['France', 'Czechoslovakia', 30], ['France', 'Poland', 25], ['France', 'Soviet Union', 25], ['Czechoslovakia', 'Soviet Union', 25],
  ['Czechoslovakia', 'Romania', 25], ['Czechoslovakia', 'Yugoslavia', 25], ['Romania', 'Yugoslavia', 25], ['Poland', 'Romania', 30],
  ['Greece', 'Turkey', 20], ['Greece', 'Yugoslavia', 15], ['Romania', 'Turkey', 10], ['United Kingdom', 'Portugal', 30], ['United Kingdom', 'Egypt', 20], ['United Kingdom', 'Iraq', 20],
  ['United Kingdom', 'Greece', 15], ['United Kingdom', 'Belgium', 15], ['France', 'Belgium', 15], ['Germany', 'Hungary', 20], ['Germany', 'Bulgaria', 15], ['Italy', 'Hungary', 25], ['Italy', 'Austria', 25],
  ['Italy', 'Albania', 15], ['Germany', 'Austria', -15], ['Germany', 'Italy', -10], ['Poland', 'Lithuania', -30], ['Poland', 'Czechoslovakia', -20], ['Hungary', 'Yugoslavia', -20],
  ['Bulgaria', 'Yugoslavia', -15], ['France', 'Italy', -5], ['Sweden', 'Norway', 25], ['Sweden', 'Denmark', 25], ['Sweden', 'Finland', 25], ['Norway', 'Denmark', 25], ['Finland', 'Estonia', 20],
  ['Estonia', 'Latvia', 30], ['Latvia', 'Lithuania', 20], ['Belgium', 'Netherlands', 20], ['Belgium', 'Luxembourg', 25], ['Germany', 'Poland', 10],
];
const HISTORY_OF = new Map(HISTORY.map(([a, b, x]) => [warKey(a, b), x]));

export const PACT_RELATIONS: Record<PactKind, number> = { alliance: 40, guarantee: 20, nonAggression: 15 };
export const CLAIM_RELATIONS = -30;
export const MISSION_RELATIONS = 30;
/** A mission costs this share of a month's output each month. */
export const MISSION_COST = 0.002;
/** Relations move this many points a month towards where they rest. */
export const RELATIONS_DRIFT = 2;

/** Tension added by each kind of event. */
export const TENSION = { ultimatum: 5, gaveIn: 10, warOnMajor: 20, warOnMinor: 10, noCause: 10, honour: 5, justify: 3, annex: 5, monthlyDecay: 0.5 };
/** A democracy may guarantee another country only when tension is at least this, and build a case for war only above the second number. */
export const GUARANTEE_TENSION = 25;
export const JUSTIFY_TENSION = 50;
/** Days it takes to build a case for war. */
export const JUSTIFY_DAYS: Record<Government, number> = { democracy: 120, authoritarian: 75, fascist: 45, communist: 45 };
/** A built case lasts a year. A truce after a peace lasts half a year. */
export const CAUSE_DAYS = 365;
export const TRUCE_DAYS = 180;
/** How long the player has to answer a decision. */
export const DECISION_DAYS = 7;
/** A proposal that was refused cannot be made again for this long. */
export const REBUFF_DAYS = 90;
/** An AI protector stands by a threatened country when its war support is at least this, or tension is at least the second number. */
export const FIRM_SUPPORT = 50;
export const FIRM_TENSION = 60;
/** A country gives in to an ultimatum only if no protector stands firm and the one demanding is this many times stronger. */
export const YIELD_ODDS = 1.5;
/** The major democracies guarantee the countries an aggressor claims once it has broken the peace this often, or once at this tension. */
export const CONTAIN_AGGRESSION = 3;
export const CONTAIN_TENSION = 50;
/** An AI accepts a pact when its score reaches these. */
export const ACCEPT = { alliance: 60, nonAggression: 20, call: 40 };
/** A country surrenders when enemies hold this share of the victory points of its own land. */
export const SURRENDER_SHARE = 0.6;
/** Once its capital has fallen, a country gives up at this smaller share. France asked for an armistice eight days after Paris fell. */
export const SURRENDER_SHARE_NO_CAPITAL = 0.4;

/** A standing claim: a cause for war that never runs out, and (when it names a demand) the right to send an ultimatum. */
export interface Claim {
  demand?: Demand;
  what: string;
}

const P = (name: string): number => {
  const p = PROVINCES.find((q) => q.name === name);
  if (!p) throw new Error(`No province called ${name}`);
  return p.id;
};

/** Claims of 1936, by claimant and then target. */
export const CLAIMS: Record<string, Record<string, Claim>> = {
  Germany: {
    Austria: { demand: { kind: 'annex' }, what: 'union with Austria, which the peace treaties of 1919 forbade' },
    Czechoslovakia: { demand: { kind: 'cede', provinces: [], arms: true }, what: 'the German-speaking border districts (the Sudetenland), with their forts and arms works' },
    Poland: { demand: { kind: 'cede', provinces: [P('Poznań')] }, what: 'Danzig and the land lost to Poland in 1919' },
    France: { what: 'Alsace-Lorraine, lost in 1919' },
  },
  Italy: {
    Albania: { demand: { kind: 'annex' }, what: 'Albania, already tied to Italy by loans and treaties' },
    France: { demand: { kind: 'cede', provinces: [P('Corsica'), P('Tunisia')] }, what: 'Corsica and Tunisia' },
    Yugoslavia: { what: 'the Dalmatian coast' },
    Greece: { what: 'the Ionian islands and Epirus' },
  },
  'Soviet Union': {
    Estonia: { demand: { kind: 'annex' }, what: 'the Baltic coast, lost by Russia in 1918' },
    Latvia: { demand: { kind: 'annex' }, what: 'the Baltic coast, lost by Russia in 1918' },
    Lithuania: { demand: { kind: 'annex' }, what: 'the Baltic coast, lost by Russia in 1918' },
    Finland: { demand: { kind: 'cede', provinces: [P('Savonia')] }, what: 'the land around Lake Ladoga, to push the border away from Leningrad' },
    Romania: { demand: { kind: 'cede', provinces: [P('Bessarabia')] }, what: 'Bessarabia, taken by Romania in 1918' },
    Poland: { demand: { kind: 'cede', provinces: [P('Volhynia'), P('Polesie'), P('Nowogródek'), P('Stanisławów'), P('Białystok')] }, what: 'the eastern provinces Poland won in the war of 1920' },
  },
  Hungary: {
    Czechoslovakia: { demand: { kind: 'cede', provinces: [P('Ruthenia')] }, what: 'Ruthenia and the Hungarian-speaking south of Slovakia' },
    Romania: { demand: { kind: 'cede', provinces: [P('Crișana')] }, what: 'Transylvania, lost in 1920' },
    Yugoslavia: { what: 'the Vojvodina, lost in 1920' },
  },
  Bulgaria: {
    Romania: { demand: { kind: 'cede', provinces: [P('Dobruja')] }, what: 'southern Dobruja, lost in 1913' },
    Greece: { what: 'an outlet to the Aegean Sea' },
    Yugoslavia: { demand: { kind: 'cede', provinces: [P('Macedonia')] }, what: 'Macedonia' },
  },
};

export const claimOf = (by: string, on: string): Claim | undefined => CLAIMS[by]?.[on];

/** Pacts in force on 1 January 1936 (simplified: see MODEL.md). */
const START_PACTS: [PactKind, string, string][] = [
  ['alliance', 'United Kingdom', 'France'],
  ['alliance', 'France', 'Poland'],
  ['alliance', 'France', 'Czechoslovakia'],
  ['alliance', 'United Kingdom', 'Egypt'],
  ['alliance', 'United Kingdom', 'Iraq'],
  ['guarantee', 'United Kingdom', 'Belgium'],
  ['guarantee', 'France', 'Belgium'],
  ['nonAggression', 'Germany', 'Poland'],
  ['nonAggression', 'Soviet Union', 'Poland'],
  ['nonAggression', 'Soviet Union', 'Finland'],
];

const MAJORS = new Set(COUNTRIES.filter((c) => c.major).map((c) => c.name));
export const isMajor = (name: string): boolean => MAJORS.has(name);
const KNOWN = new Set(COUNTRIES.map((c) => c.name));
const NAMES = COUNTRIES.map((c) => c.name);
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));
const list = (xs: string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');

/** Countries that share a land border on the 1936 map. */
export const BORDERS: Map<string, Set<string>> = (() => {
  const out = new Map<string, Set<string>>();
  for (const p of PROVINCES) for (const n of p.neighbours) if (PROVINCES[n].owner !== p.owner) (out.get(p.owner) ?? out.set(p.owner, new Set()).get(p.owner)!).add(PROVINCES[n].owner);
  return out;
})();

// ---------- reading the state ----------

export const alive = (w: Pick<World, 'capitulated'>, name: string): boolean => KNOWN.has(name) && !w.capitulated.includes(name);
export const governmentOf = (w: Pick<World, 'economies'>, name: string): Government => w.economies[name]?.government ?? COUNTRIES.find((c) => c.name === name)?.government ?? 'authoritarian';
export const relation = (dip: Diplomacy, a: string, b: string): number => dip.relations[warKey(a, b)] ?? 0;
export const shift = (dip: Diplomacy, a: string, b: string, by: number): void => {
  if (a !== b) dip.relations[warKey(a, b)] = clamp(relation(dip, a, b) + by, -100, 100);
};

export const hasPact = (dip: Diplomacy, kind: PactKind, a: string, b: string): boolean =>
  dip.pacts.some((p) => p.kind === kind && ((p.a === a && p.b === b) || (kind !== 'guarantee' && p.a === b && p.b === a)));
export const allied = (dip: Diplomacy, a: string, b: string): boolean => hasPact(dip, 'alliance', a, b);
export const alliesOf = (dip: Diplomacy, name: string): string[] => dip.pacts.filter((p) => p.kind === 'alliance' && (p.a === name || p.b === name)).map((p) => (p.a === name ? p.b : p.a));
/** The countries that have promised to defend this one: its allies and its guarantors. */
export const protectorsOf = (dip: Diplomacy, name: string): string[] => [
  ...new Set([...alliesOf(dip, name), ...dip.pacts.filter((p) => p.kind === 'guarantee' && p.b === name).map((p) => p.a)]),
];
/** For each country, the set of its allies. Used for marching and supply through allied land. */
export function allianceMap(dip: Diplomacy): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const p of dip.pacts) {
    if (p.kind !== 'alliance') continue;
    (out.get(p.a) ?? out.set(p.a, new Set()).get(p.a)!).add(p.b);
    (out.get(p.b) ?? out.set(p.b, new Set()).get(p.b)!).add(p.a);
  }
  return out;
}

const fighting = (w: Pick<World, 'wars'>, a: string, b: string): boolean => w.wars.includes(warKey(a, b));
const enemies = (w: Pick<World, 'wars'>, name: string): string[] => {
  const out: string[] = [];
  for (const k of w.wars) {
    const [a, b] = k.split('|');
    if (a === name) out.push(b);
    else if (b === name) out.push(a);
  }
  return out;
};

const WEIGHT: Record<UnitType, number> = { infantry: 1, armour: 2.5, artillery: 1.5 };
/** A rough measure of each army: divisions weighted by type and by how much of their strength is left. */
export function strengths(units: Unit[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const u of units) out.set(u.owner, (out.get(u.owner) ?? 0) + (WEIGHT[u.type] * u.strength) / 100);
  return out;
}

export interface Reason {
  text: string;
  points: number;
}

/** Where relations between two countries are heading, and why. */
export function relationReasons(w: Pick<World, 'economies' | 'diplomacy' | 'wars'>, a: string, b: string): Reason[] {
  const dip = w.diplomacy;
  const out: Reason[] = [];
  const add = (text: string, points: number) => points && out.push({ text, points });
  if (fighting(w, a, b)) return [{ text: 'at war', points: -100 }];
  const ga = governmentOf(w, a);
  const gb = governmentOf(w, b);
  add(ga === gb ? `both are ${ga === 'democracy' ? 'democracies' : ga === 'authoritarian' ? 'authoritarian states' : `${ga} states`}` : `a ${ga} and a ${gb} government`, IDEOLOGY[ga][gb]);
  add('their history before 1936', HISTORY_OF.get(warKey(a, b)) ?? 0);
  for (const kind of ['alliance', 'guarantee', 'nonAggression'] as const) {
    if (hasPact(dip, kind, a, b) || hasPact(dip, kind, b, a)) add(kind === 'alliance' ? 'allies' : kind === 'guarantee' ? 'a guarantee' : 'a non-aggression pact', PACT_RELATIONS[kind]);
  }
  if (claimOf(a, b) || claimOf(b, a)) add('a claim on the other’s land', CLAIM_RELATIONS);
  if (dip.missions.includes(`${a}>${b}`) || dip.missions.includes(`${b}>${a}`)) add('a diplomatic mission', MISSION_RELATIONS);
  return out;
}
export const restingRelation = (w: Pick<World, 'economies' | 'diplomacy' | 'wars'>, a: string, b: string): number =>
  clamp(relationReasons(w, a, b).reduce((x, r) => x + r.points, 0), -100, 100);

/** Why `by` may declare war on `on`, or null if it has no cause. */
export function causeFor(w: Pick<World, 'wars' | 'diplomacy' | 'declaredBy' | 'day'>, by: string, on: string): string | null {
  const dip = w.diplomacy;
  const claim = claimOf(by, on);
  if (claim) return `a claim: ${claim.what}`;
  const built = dip.causes.find((c) => c.by === by && c.on === on && c.until >= w.day);
  if (built) return built.why;
  for (const friend of protegesOf(dip, by)) if (fighting(w, friend, on) && w.declaredBy[warKey(friend, on)] === on) return `${on} attacked ${friend}, which ${by} has promised to defend`;
  return null;
}
/** The countries this one has promised to defend. */
const protegesOf = (dip: Diplomacy, name: string): string[] => [...new Set([...alliesOf(dip, name), ...dip.pacts.filter((p) => p.kind === 'guarantee' && p.a === name).map((p) => p.b)])];

/** Why `by` cannot declare war on `on` right now, or null if it can. */
export function cannotDeclare(w: View, by: string, on: string): string | null {
  if (by === on || !alive(w, by) || !alive(w, on)) return 'no such country to fight';
  if (fighting(w, by, on)) return 'already at war';
  if (allied(w.diplomacy, by, on)) return 'you are allies: end the alliance first';
  const truce = w.diplomacy.truces[warKey(by, on)];
  if (truce !== undefined && truce > w.day) return `a truce holds for another ${truce - w.day} days`;
  if (w.mode === 'story' && !causeFor(w, by, on)) return 'no cause for war: build a case first';
  return null;
}

/** Why `by` cannot start building a case against `on`, or null if it can. */
export function cannotJustify(w: View, by: string, on: string): string | null {
  if (by === on || !alive(w, by) || !alive(w, on)) return 'no such country';
  if (fighting(w, by, on)) return 'already at war';
  if (causeFor(w, by, on)) return 'you already have a cause for war';
  if (w.diplomacy.justifying.some((j) => j.by === by && j.on === on)) return 'a case is already being built';
  if (allied(w.diplomacy, by, on)) return 'you are allies';
  if (governmentOf(w, by) === 'democracy' && w.diplomacy.tension < JUSTIFY_TENSION && !(w.diplomacy.aggression[on] > 0))
    return `a democracy can build a case only against a country that has broken the peace, or once world tension reaches ${JUSTIFY_TENSION}`;
  return null;
}

export function cannotGuarantee(w: View, by: string, on: string): string | null {
  if (by === on || !alive(w, by) || !alive(w, on)) return 'no such country';
  if (fighting(w, by, on)) return 'you are at war with it';
  if (hasPact(w.diplomacy, 'guarantee', by, on) || allied(w.diplomacy, by, on)) return 'you have already promised to defend it';
  if (governmentOf(w, by) === 'democracy' && w.diplomacy.tension < GUARANTEE_TENSION) return `your voters will not accept the risk until world tension reaches ${GUARANTEE_TENSION}`;
  return null;
}

export function cannotUltimatum(w: View, by: string, on: string): string | null {
  if (!claimOf(by, on)?.demand) return 'you have no claim you could demand';
  if (!alive(w, by) || !alive(w, on)) return 'no such country';
  if (fighting(w, by, on)) return 'already at war';
  if (allied(w.diplomacy, by, on)) return 'you are allies';
  if (w.diplomacy.ultimatums.some((u) => u.by === by && u.on === on)) return 'an ultimatum is already waiting for an answer';
  if ((w.diplomacy.rebuffs[`${by}>${on}:ultimatum`] ?? 0) > w.day) return 'your last ultimatum was refused: they will not listen again so soon';
  return null;
}

const demandText = (demand: Demand, on: string): string =>
  demand.kind === 'annex'
    ? `that ${on} join it`
    : demand.kind === 'submit'
      ? `that ${on} accept occupation`
      : demand.provinces.length
        ? `${list(demand.provinces.map((p) => PROVINCES[p].name))}`
        : `the border districts of ${on}, with their forts and arms works`;

/** A score for the war between two countries from the first one's side: above zero it is winning. */
export function warScore(w: Pick<World, 'units' | 'controller' | 'owner' | 'wars' | 'economies'>, a: string, b: string): { score: number; reasons: Reason[] } {
  const vp = { a: 0, b: 0, aLost: 0, bLost: 0 };
  for (const p of PROVINCES) {
    if (w.owner[p.id] === a) {
      vp.a += p.victoryPoints;
      if (w.controller[p.id] === b) vp.aLost += p.victoryPoints;
    } else if (w.owner[p.id] === b) {
      vp.b += p.victoryPoints;
      if (w.controller[p.id] === a) vp.bLost += p.victoryPoints;
    }
  }
  const s = strengths(w.units);
  const sa = s.get(a) ?? 0;
  const sb = s.get(b) ?? 0;
  const ea = w.economies[a];
  const eb = w.economies[b];
  const majorsAgainst = (x: string, other: string) => enemies(w, x).filter((e) => e !== other && isMajor(e)).length;
  const reasons: Reason[] = [];
  const add = (text: string, points: number) => Math.abs(points) >= 0.5 && reasons.push({ text, points: Math.round(points) });
  add(`land: ${a} holds ${Math.round((100 * vp.bLost) / (vp.b || 1))}% of ${b}'s victory points and has lost ${Math.round((100 * vp.aLost) / (vp.a || 1))}% of its own`, 100 * (vp.bLost / (vp.b || 1) - vp.aLost / (vp.a || 1)));
  add('the armies still in the field', sa + sb > 0 ? (20 * (sa - sb)) / (sa + sb) : 0);
  if (ea && eb) add('war support and weariness at home', clamp(0.3 * (ea.warSupport - eb.warSupport) + (eb.weariness - ea.weariness), -15, 15));
  add('other great powers each is fighting', 8 * (majorsAgainst(b, a) - majorsAgainst(a, b)));
  return { score: clamp(reasons.reduce((x, r) => x + r.points, 0), -100, 100), reasons };
}

/** A country this one had promised to defend and that `other` has conquered, if there is one. */
export const owedBy = (dip: Diplomacy, me: string, other: string): string | undefined => Object.keys(dip.conquered).find((x) => dip.conquered[x] === other && dip.owed[x]?.includes(me));

/** Would `to` accept this peace from `by`? */
export function peaceAnswer(w: View, by: string, to: string, terms: PeaceTerms): { yes: boolean; why: string; score: number } {
  // The score from the side of the country that has to answer.
  const { score } = warScore(w, to, by);
  const months = Math.floor((w.day - (w.diplomacy.warStart[warKey(by, to)] ?? w.day)) / 30);
  // A country that went to war to keep a promise does not leave while its friend still fights.
  const friend = protegesOf(w.diplomacy, to).find((f) => alive(w, f) && fighting(w, f, by) && f !== by);
  if (friend && w.diplomacy.honour.includes(warKey(by, to)) && score > -30) return { yes: false, why: `it will not abandon ${friend}`, score };
  const victim = owedBy(w.diplomacy, to, by);
  if (victim && score > -30) return { yes: false, why: `it will not make peace while ${victim} is occupied`, score };
  const held = PROVINCES.filter((p) => w.owner[p.id] === by && w.controller[p.id] === to).length;
  const lost = PROVINCES.filter((p) => w.owner[p.id] === to && w.controller[p.id] === by).length;
  if (terms === 'white') {
    if (score <= -10) return { yes: true, why: 'it is losing and glad to get its land back', score };
    if (score <= 10 && months >= 12) return { yes: true, why: 'a year of war has settled nothing', score };
    return { yes: false, why: score > 10 ? 'it believes it is winning' : 'it thinks the war can still be won', score };
  }
  if (lost === 0 && held > 0) return { yes: true, why: 'it keeps what it has taken', score };
  // A limited war: the attacker holds everything it came for, and the defender cannot take it back.
  const aim = w.diplomacy.aims[warKey(by, to)];
  if (aim && aim.by === by && score <= -8 && aim.provinces.every((p) => w.controller[p] === by)) return { yes: true, why: 'it gives up the provinces to end a war it cannot win', score };
  if (held >= lost && score >= 10 && months >= 12) return { yes: true, why: 'it has gained more than it lost', score };
  if (score <= -25) return { yes: true, why: 'it is badly beaten and wants to save what is left', score };
  return { yes: false, why: lost > 0 ? 'it will not sign away its land while it can still fight' : 'it believes it can win more', score };
}

/** Would `to` accept an alliance or a non-aggression pact from `by`? The reasons add up to the score. */
export function pactAnswer(w: View, by: string, to: string, pact: 'alliance' | 'nonAggression'): { yes: boolean; score: number; need: number; reasons: Reason[] } {
  const dip = w.diplomacy;
  const reasons: Reason[] = [];
  const add = (text: string, points: number) => points && reasons.push({ text, points: Math.round(points) });
  add('relations between you', relation(dip, by, to));
  const s = strengths(w.units);
  const gBy = governmentOf(w, by);
  const gTo = governmentOf(w, to);
  if (pact === 'nonAggression') {
    if ((s.get(by) ?? 0) > 2 * (s.get(to) ?? 0)) add('it fears your army', 20);
    if (claimOf(to, by)) add('it claims some of your land', -40);
    if (claimOf(by, to)) add('you claim some of its land', -15);
    if (alliesOf(dip, to).some((f) => fighting(w, f, by))) add('you are at war with its ally', -100);
  } else {
    // A common danger: a country that claims its land, or is at war with it, and that you are on bad terms with too.
    const dangers = NAMES.filter((x) => x !== by && x !== to && alive(w, x) && (claimOf(x, to) || fighting(w, x, to)) && (relation(dip, by, x) <= -20 || fighting(w, by, x)));
    if (dangers.length) add(`a common danger: ${list(dangers.slice(0, 2))}`, 30);
    const clash = IDEOLOGY[gBy][gTo];
    if (clash < 0) add('your governments distrust each other', clash);
    if (!isMajor(to) && !enemies(w, to).length && !dangers.length) add('it hopes to stay out of any war', -25);
    if (enemies(w, by).some((x) => w.declaredBy[warKey(by, x)] === by)) add('you are fighting a war you started', -30);
    if (claimOf(to, by) || claimOf(by, to)) add('a claim stands between you', -40);
    if (alliesOf(dip, to).some((f) => fighting(w, f, by))) add('you are at war with its ally', -100);
    if (isMajor(by) && !isMajor(to) && dangers.length) add('a great power’s protection', 15);
  }
  const score = reasons.reduce((x, r) => x + r.points, 0);
  return { yes: score >= ACCEPT[pact], score, need: ACCEPT[pact], reasons };
}

/** Would `ally` join `by`'s war against `against`? */
export function callAnswer(w: View, by: string, ally: string, against: string): { yes: boolean; score: number; need: number; reasons: Reason[] } {
  const dip = w.diplomacy;
  const reasons: Reason[] = [];
  const add = (text: string, points: number) => points && reasons.push({ text, points: Math.round(points) });
  const s = strengths(w.units);
  add(`its relations with ${against}`, -0.5 * relation(dip, ally, against));
  if (claimOf(ally, against)) add(`it claims land from ${against}`, 40);
  if (w.declaredBy[warKey(by, against)] === against) add(`${against} attacked you`, 40);
  else if (governmentOf(w, ally) === 'democracy') add('its voters will not join a war you started', -50);
  if ((s.get(against) ?? 0) > 2 * (s.get(ally) ?? 0) && BORDERS.get(ally)?.has(against)) add(`it fears ${against}'s army on its border`, -30);
  if (warScore(w, by, against).score >= 20) add('you are winning', 20);
  if (enemies(w, ally).some(isMajor)) add('it is already fighting a great power', -30);
  const score = reasons.reduce((x, r) => x + r.points, 0);
  return { yes: score >= ACCEPT.call, score, need: ACCEPT.call, reasons };
}

/** Will an AI protector fight for a country that has been sent an ultimatum? */
export function standsFirm(w: Pick<World, 'economies' | 'diplomacy'>, protector: string): boolean {
  const e = w.economies[protector];
  return !!e && (e.warSupport >= FIRM_SUPPORT || w.diplomacy.tension >= FIRM_TENSION);
}

/**
 * The odds a country sees before it acts: its own army against the target's, plus a share of
 * the armies of the target's protectors (the share says how seriously it takes them).
 */
export function oddsAgainst(w: Pick<World, 'units' | 'wars' | 'capitulated' | 'diplomacy'>, by: string, on: string, protectorShare = 1): number {
  const s = strengths(w.units);
  const mine = (s.get(by) ?? 0) + alliesOf(w.diplomacy, by).filter((a) => fighting(w, a, on)).reduce((x, a) => x + (s.get(a) ?? 0), 0);
  const protectors = protectorsOf(w.diplomacy, on).filter((p) => p !== by && alive(w, p) && !allied(w.diplomacy, p, by) && !fighting(w, p, by));
  const theirs = (s.get(on) ?? 0) + protectorShare * protectors.reduce((x, p) => x + (s.get(p) ?? 0), 0);
  return theirs > 0 ? mine / theirs : Infinity;
}

// ---------- the start of a game ----------

export function startDiplomacy(economies: Record<string, Economy>): Diplomacy {
  const dip: Diplomacy = {
    relations: {}, pacts: START_PACTS.map(([kind, a, b]) => ({ kind, a, b, since: 0 })), tension: 0, aggression: {}, causes: [], justifying: [], truces: {}, aims: {}, warStart: {}, honour: [],
    conquered: {}, owed: {}, missions: [], agenda: {}, rebuffs: {}, ultimatums: [], decisions: [], nextId: 0, log: [],
  };
  const w = { economies, diplomacy: dip, wars: [] };
  for (let i = 0; i < NAMES.length; i++) for (let j = i + 1; j < NAMES.length; j++) dip.relations[warKey(NAMES[i], NAMES[j])] = restingRelation(w, NAMES[i], NAMES[j]);
  return dip;
}

/**
 * The same world with no pacts and no historical agenda: nobody joins anyone's war and no AI
 * government starts one. Used for test duels and by the balance report.
 */
export function isolated<W extends Pick<World, 'diplomacy'>>(w: W, agenda: string[]): W {
  return { ...w, diplomacy: { ...w.diplomacy, pacts: [], agenda: Object.fromEntries(agenda.map((id) => [id, 'dropped' as const])) } };
}

export const cloneDiplomacy = (d: Diplomacy): Diplomacy => ({
  ...d,
  relations: { ...d.relations },
  pacts: [...d.pacts],
  aggression: { ...d.aggression },
  causes: [...d.causes],
  justifying: d.justifying.map((j) => ({ ...j })),
  truces: { ...d.truces },
  aims: { ...d.aims },
  warStart: { ...d.warStart },
  honour: [...d.honour],
  conquered: { ...d.conquered },
  owed: { ...d.owed },
  missions: [...d.missions],
  agenda: { ...d.agenda },
  rebuffs: { ...d.rebuffs },
  ultimatums: d.ultimatums.map((u) => ({ ...u, stances: { ...u.stances } })),
  decisions: [...d.decisions],
  log: [...d.log],
});

// ---------- changing the state ----------

/** "the Soviet Union", "the Netherlands": put the article in, and start the sentence with a capital. */
export function sentence(text: string): string {
  const t = text.replace(/(?<![Tt]he )(Soviet Union|United Kingdom|Netherlands)/g, 'the $1');
  return t[0].toUpperCase() + t.slice(1);
}

export function note(d: DipDraft, kind: DipEvent['kind'], text: string, countries: string[]): void {
  d.diplomacy.log.push({ id: d.diplomacy.nextId++, day: d.day, kind, text: sentence(text), countries });
  if (d.diplomacy.log.length > 80) d.diplomacy.log = d.diplomacy.log.slice(-80);
}
export const raiseTension = (d: DipDraft, by: number): void => {
  d.diplomacy.tension = clamp(d.diplomacy.tension + by, 0, 100);
};
const blame = (d: DipDraft, name: string, everyone: number): void => {
  d.diplomacy.aggression[name] = (d.diplomacy.aggression[name] ?? 0) + 1;
  // Everyone thinks less of a country that breaks the peace; the democracies most of all.
  for (const other of NAMES) if (other !== name && alive(d, other) && !allied(d.diplomacy, other, name)) shift(d.diplomacy, name, other, governmentOf(d, other) === 'democracy' ? 1.5 * everyone : everyone);
};
export const ask = (d: DipDraft, x: Omit<Decision, 'id' | 'deadline'>): void => {
  d.diplomacy.decisions.push({ ...x, title: sentence(x.title), text: sentence(x.text), options: x.options.map((o) => ({ label: sentence(o.label), effect: sentence(o.effect) })), id: d.diplomacy.nextId++, deadline: d.day + DECISION_DAYS });
};
export const addPact = (d: DipDraft, kind: PactKind, a: string, b: string): void => {
  if (hasPact(d.diplomacy, kind, a, b)) return;
  // An alliance replaces a guarantee or a non-aggression pact between the same two.
  if (kind === 'alliance') d.diplomacy.pacts = d.diplomacy.pacts.filter((p) => !((p.a === a && p.b === b) || (p.a === b && p.b === a)));
  d.diplomacy.pacts.push({ kind, a, b, since: d.day });
  shift(d.diplomacy, a, b, 10);
};
const dropPacts = (d: DipDraft, test: (p: Pact) => boolean): void => {
  d.diplomacy.pacts = d.diplomacy.pacts.filter((p) => !test(p));
};
const between = (a: string, b: string) => (p: Pact) => (p.a === a && p.b === b) || (p.a === b && p.b === a);

/** Divisions standing where they may no longer be (after a peace or the end of an alliance) go home by rail. */
export function sendHome(d: DipDraft): void {
  const friends = allianceMap(d.diplomacy);
  const home = new Map<string, number | null>();
  const homeOf = (name: string): number | null => {
    if (!home.has(name)) {
      let best: number | null = null;
      for (const p of PROVINCES) {
        if (d.controller[p.id] !== name || d.owner[p.id] !== name) continue;
        if (p.capital && p.owner === name) {
          best = p.id;
          break;
        }
        if (best === null || p.victoryPoints > PROVINCES[best].victoryPoints) best = p.id;
      }
      home.set(name, best);
    }
    return home.get(name)!;
  };
  const kept: Unit[] = [];
  for (const u of d.units) {
    const holder = d.controller[u.at];
    if (holder === u.owner || fighting(d, u.owner, holder) || friends.get(u.owner)?.has(holder)) {
      kept.push(u);
      continue;
    }
    const to = homeOf(u.owner);
    if (to === null) continue; // nowhere to go: the division is disbanded
    u.at = to;
    u.path = [];
    u.progress = 0;
    u.dugIn = 0;
    kept.push(u);
  }
  d.units = kept;
}

/** Start a war. `kind` says whether it is an attack or a promise being kept; `origin` is the aggressor the promise was about. */
export function startWar(d: DipDraft, by: string, on: string, kind: 'attack' | 'honour', friend?: string): void {
  const key = warKey(by, on);
  if (by === on || !alive(d, by) || !alive(d, on) || d.wars.includes(key)) return;
  const dip = d.diplomacy;
  const cause = kind === 'honour' ? 'honour' : causeFor(d, by, on);
  d.wars.push(key);
  dip.warStart[key] = d.day;
  // For the home front, the side that broke the peace is the one that "declared" the war.
  d.declaredBy[key] = kind === 'honour' ? on : by;
  const a = d.economies[by];
  const b = d.economies[on];
  if (kind === 'attack') {
    // The country that declares loses stability if its people are not behind it; twice as much with no cause.
    if (a) a.stability = clamp(a.stability - (cause ? 1 : 2) * DECLARATION_COST[a.government] * Math.max(0, 50 - a.warSupport), 0, 100);
    if (b) b.warSupport = clamp(b.warSupport + 10, 0, 100);
    raiseTension(d, (isMajor(on) ? TENSION.warOnMajor : TENSION.warOnMinor) + (cause ? 0 : TENSION.noCause));
    blame(d, by, cause ? -10 : -20);
    if (hasPact(dip, 'nonAggression', by, on)) {
      blame(d, by, -10);
      note(d, 'pact', `${by} breaks its non-aggression pact with ${on}`, [by, on]);
    }
    note(d, 'war', `${by} declares war on ${on}${cause ? '' : ' without a cause'}`, [by, on]);
  } else {
    dip.honour.push(key);
    raiseTension(d, TENSION.honour);
    if (a) a.warSupport = clamp(a.warSupport + 5, 0, 100);
    note(d, 'war', `${by} declares war on ${on} to keep its promise to ${friend ?? 'its ally'}`, [by, on]);
  }
  dropPacts(d, between(by, on));
  dip.relations[key] = -100;
  dip.justifying = dip.justifying.filter((j) => !((j.by === by && j.on === on) || (j.by === on && j.on === by)));

  if (kind !== 'attack') return;
  // Everyone who promised to defend the country attacked is now asked to keep that promise.
  for (const protector of protectorsOf(dip, on).sort()) {
    if (protector === by || !alive(d, protector) || fighting(d, protector, by)) continue;
    if (allied(dip, protector, by)) {
      // Allied to both sides: it stays out, and its promise to the victim is worth nothing now.
      dropPacts(d, (p) => between(protector, on)(p));
      shift(dip, protector, on, -30);
      note(d, 'pact', `${protector}, allied to ${by}, abandons ${on}`, [protector, on, by]);
      continue;
    }
    if (protector === d.player) {
      ask(d, {
        country: protector, kind: 'honour', from: by, about: on, title: `${by} has attacked ${on}`,
        text: `You promised to defend ${on}. ${by} has now declared war on it. Keeping your word means war with ${by}. Breaking it keeps you out, but nobody will trust your promises again.`,
        options: [
          { label: `Declare war on ${by}`, effect: `You are at war with ${by}, as an ally of ${on}. Your people see it as a just war.` },
          { label: 'Break your word', effect: `Your promise to ${on} ends. Stability -10, and every country thinks 15 points less of you.` },
        ],
        fallback: 0,
      });
      continue;
    }
    // An AI keeps its word, unless it is already fighting one great power and this would add a second, separate one.
    const busy = enemies(d, protector).filter(isMajor);
    const sameWar = busy.some((x) => allied(dip, x, by));
    if (busy.length && isMajor(by) && !sameWar) {
      note(d, 'pact', `${protector} is already at war with ${list(busy)} and does not declare war on ${by}`, [protector, by, on]);
      continue;
    }
    honour(d, protector, by, on);
  }
}

function honour(d: DipDraft, protector: string, aggressor: string, friend: string): void {
  startWar(d, protector, aggressor, 'honour', friend);
  // A guarantee that is called in becomes an alliance, so the two armies can work together.
  addPact(d, 'alliance', protector, friend);
}

/** Hand land back or over when two countries stop fighting, and call the armies home. */
function endWar(d: DipDraft, a: string, b: string, terms: PeaceTerms): void {
  const key = warKey(a, b);
  if (!d.wars.includes(key)) return;
  const dip = d.diplomacy;
  for (const p of PROVINCES) {
    const owner = d.owner[p.id];
    const holder = d.controller[p.id];
    if (!((owner === a && holder === b) || (owner === b && holder === a))) continue;
    if (terms === 'white') d.controller[p.id] = owner;
    else d.owner[p.id] = holder;
  }
  d.wars = d.wars.filter((k) => k !== key);
  delete d.declaredBy[key];
  delete dip.warStart[key];
  delete dip.aims[key];
  dip.honour = dip.honour.filter((k) => k !== key);
  dip.truces[key] = d.day + TRUCE_DAYS;
  dip.relations[key] = -40;
  sendHome(d);
  note(d, 'peace', terms === 'white' ? `Peace between ${a} and ${b}: both go back to their own borders` : `Peace between ${a} and ${b}: each keeps the land it holds`, [a, b]);
}

/** Bring a country that was conquered back onto the map, on whatever of its land is handed to it. */
export function restore(d: DipDraft, name: string, liberator: string | null): void {
  if (!d.capitulated.includes(name)) return;
  d.capitulated = d.capitulated.filter((c) => c !== name);
  delete d.diplomacy.conquered[name];
  delete d.diplomacy.owed[name];
  const capital = PROVINCES.find((p) => p.capital && p.owner === name && d.controller[p.id] === name) ?? PROVINCES.find((p) => d.controller[p.id] === name);
  const e = d.economies[name];
  if (e) {
    e.stability = 60;
    e.warSupport = 50;
    e.weariness = 0;
    e.crisisMonths = 0;
    e.training = [];
    e.construction = [];
  }
  // A small new army forms around the capital.
  const start = COUNTRIES.find((c) => c.name === name)?.startArmy ?? [0, 0, 0];
  const n = capital ? Math.max(1, Math.round((start[0] + start[1] + start[2]) / 5)) : 0;
  for (let i = 0; i < n && capital; i++) d.units.push({ id: d.nextUnitId++, owner: name, type: 'infantry', at: capital.id, strength: 60, organisation: 40, path: [], progress: 0, dugIn: 0, supply: 1 });
  for (const other of NAMES) if (other !== name) d.diplomacy.relations[warKey(name, other)] = restingRelation(d, name, other);
  if (liberator) shift(d.diplomacy, name, liberator, 40);
  note(d, 'government', liberator ? `${name} is restored by ${liberator}` : `${name} is restored`, liberator ? [name, liberator] : [name]);
}

/** Remove a country from play: its army, its pacts, its wars and any business it had pending. */
function remove(d: DipDraft, name: string, conqueror: string): void {
  const dip = d.diplomacy;
  if (!d.capitulated.includes(name)) d.capitulated = [...d.capitulated, name];
  dip.conquered[name] = conqueror;
  dip.owed[name] = protectorsOf(dip, name).filter((p) => p !== conqueror);
  d.units = d.units.filter((u) => u.owner !== name);
  for (const k of d.wars) {
    if (!k.split('|').includes(name)) continue;
    delete d.declaredBy[k];
    delete dip.warStart[k];
    delete dip.aims[k];
  }
  d.wars = d.wars.filter((k) => !k.split('|').includes(name));
  dip.honour = dip.honour.filter((k) => d.wars.includes(k));
  dropPacts(d, (p) => p.a === name || p.b === name);
  dip.missions = dip.missions.filter((m) => !m.split('>').includes(name));
  dip.justifying = dip.justifying.filter((j) => j.by !== name && j.on !== name);
  dip.ultimatums = dip.ultimatums.filter((u) => u.by !== name && u.on !== name);
  dip.decisions = dip.decisions.filter((x) => x.country !== name && x.from !== name && x.about !== name);
}

/**
 * A country surrenders. Its army leaves the map and the land it still held is occupied by the
 * main victor. Every country it had conquered, and every province it had annexed, goes back to
 * its 1936 owner.
 */
export function capitulate(d: DipDraft, loser: string, victor: string): void {
  const foes = new Set(enemies(d, loser));
  // First undo the loser's own conquests.
  const back = new Set<string>();
  for (const p of PROVINCES) {
    const first = p.owner;
    if (first === loser) continue;
    const annexed = d.owner[p.id] === loser;
    const occupied = d.diplomacy.conquered[first] === loser && d.owner[p.id] === first;
    if (!annexed && !occupied) continue;
    const holder = d.controller[p.id];
    if (holder !== loser && !foes.has(holder) && holder !== first) continue; // someone else's business now
    if (d.capitulated.includes(first) && d.diplomacy.conquered[first] !== loser) continue; // conquered by a third country since
    d.owner[p.id] = first;
    d.controller[p.id] = first;
    back.add(first);
  }
  // A country that fought the loser for a limited aim keeps the provinces it came for.
  for (const [key, aim] of Object.entries(d.diplomacy.aims)) {
    if (!key.split('|').includes(loser) || aim.by === loser) continue;
    for (const p of aim.provinces) if (d.owner[p] === loser && d.controller[p] === aim.by) d.owner[p] = aim.by;
  }
  remove(d, loser, victor);
  for (const p of PROVINCES) if (d.controller[p.id] === loser) d.controller[p.id] = victor;
  for (const name of [...back].sort()) if (d.capitulated.includes(name)) restore(d, name, victor);
  raiseTension(d, isMajor(loser) ? -10 : 0);
  note(d, 'peace', `${loser} surrenders to ${victor}`, [loser, victor]);
  sendHome(d);
}

/** Carry out what an ultimatum demanded. */
function giveIn(d: DipDraft, u: Ultimatum): void {
  const { by, on, demand } = u;
  const dip = d.diplomacy;
  raiseTension(d, TENSION.gaveIn);
  blame(d, by, -5);
  if (demand.kind === 'annex') {
    for (const p of PROVINCES) {
      if (d.owner[p.id] !== on && d.controller[p.id] !== on) continue;
      if (d.owner[p.id] === on) d.owner[p.id] = by;
      if (d.controller[p.id] === on) d.controller[p.id] = by;
    }
    remove(d, on, by);
    note(d, 'crisis', `${on} gives in: it is annexed by ${by}`, [by, on]);
  } else if (demand.kind === 'submit') {
    for (const p of PROVINCES) if (d.controller[p.id] === on) d.controller[p.id] = by;
    remove(d, on, by);
    note(d, 'crisis', `${on} gives in and is occupied by ${by} without a fight`, [by, on]);
  } else {
    for (const p of demand.provinces) {
      if (d.owner[p] !== on) continue;
      d.owner[p] = by;
      d.controller[p] = by;
    }
    if (demand.arms) {
      // A third of the army is disbanded, and up to two arms factories change hands.
      const theirs = d.units.filter((x) => x.owner === on).sort((x, y) => y.id - x.id);
      const gone = new Set(theirs.slice(0, Math.floor(theirs.length / 3)).map((x) => x.id));
      d.units = d.units.filter((x) => !gone.has(x.id));
      const to = PROVINCES.find((p) => p.capital && p.owner === by && d.controller[p.id] === by);
      let moved = 0;
      for (const p of PROVINCES) {
        if (!to || d.owner[p.id] !== on) continue;
        while (moved < 2 && d.factories.mil[p.id] > 0) {
          d.factories.mil[p.id]--;
          d.factories.mil[to.id]++;
          moved++;
        }
      }
    }
    const e = d.economies[on];
    if (e) e.stability = clamp(e.stability - 15, 0, 100);
    dip.rebuffs[`${by}>${on}:ultimatum`] = d.day + REBUFF_DAYS;
    note(d, 'crisis', `${on} gives in and hands ${demand.provinces.length ? list(demand.provinces.map((p) => PROVINCES[p].name)) : 'its border districts'} to ${by}`, [by, on]);
    sendHome(d);
  }
  // Protectors that advised giving in have shown what their promises are worth.
  for (const protector of Object.keys(u.stances)) {
    dropPacts(d, between(protector, on));
    if (alive(d, on)) shift(dip, protector, on, -30);
    note(d, 'pact', `${protector} did not stand by ${on}: its promise is at an end`, [protector, on]);
  }
  if (u.aim) dip.agenda[u.aim] = 'done';
}

/** Settle an ultimatum once every answer is in. Returns false while the player still has to answer. */
function resolveUltimatum(d: DipDraft, u: Ultimatum, targetAnswer?: boolean): boolean {
  const dip = d.diplomacy;
  if (!dip.ultimatums.includes(u)) return true;
  if (!alive(d, u.by) || !alive(d, u.on) || fighting(d, u.by, u.on)) {
    dip.ultimatums = dip.ultimatums.filter((x) => x !== u);
    return true;
  }
  if (Object.values(u.stances).some((s) => s === null)) return false;
  const firm = Object.keys(u.stances).filter((p) => u.stances[p]);
  let yields: boolean;
  if (u.on === d.player) {
    if (targetAnswer === undefined) {
      if (!dip.decisions.some((x) => x.kind === 'ultimatum' && x.ultimatum === u.id)) {
        const backers = firm.length ? `${list(firm)} will fight beside you.` : Object.keys(u.stances).length ? `${list(Object.keys(u.stances))} will not fight for you.` : 'You stand alone.';
        ask(d, {
          country: u.on, kind: 'ultimatum', from: u.by, ultimatum: u.id, title: `An ultimatum from ${u.by}`,
          text: `${u.by} demands ${demandText(u.demand, 'your country')}. ${backers} If you refuse, ${u.by} has a cause for war and may attack.`,
          options: [
            { label: 'Refuse', effect: `${u.by} gains a cause for war against you. It attacks if it likes its odds.` },
            { label: 'Give in', effect: u.demand.kind === 'cede' ? 'You hand over what is demanded. Stability -15.' : 'Your country comes under foreign rule. The game is over.' },
          ],
          fallback: 0,
        });
      }
      return false;
    }
    yields = targetAnswer;
  } else yields = firm.length === 0 && oddsAgainst(d, u.by, u.on, 0) >= YIELD_ODDS;
  dip.ultimatums = dip.ultimatums.filter((x) => x !== u);
  if (yields) {
    giveIn(d, u);
    return true;
  }
  // Refused. The one who made the demand now has a cause for war, and must choose between war and backing down.
  dip.causes.push({ by: u.by, on: u.on, until: d.day + CAUSE_DAYS, why: `${u.on} refused an ultimatum` });
  dip.rebuffs[`${u.by}>${u.on}:ultimatum`] = d.day + REBUFF_DAYS;
  note(d, 'crisis', `${u.on} refuses the ultimatum from ${u.by}${firm.length ? `, backed by ${list(firm)}` : ''}`, [u.on, u.by, ...firm]);
  if (u.by === d.player) return true;
  if (oddsAgainst(d, u.by, u.on, 1) >= u.warOdds) {
    startWar(d, u.by, u.on, 'attack');
    if (u.aim) dip.agenda[u.aim] = 'done';
  } else {
    const e = d.economies[u.by];
    if (e) e.stability = clamp(e.stability - 5, 0, 100);
    note(d, 'crisis', `${u.by} backs down: it does not like its odds`, [u.by, u.on]);
    if (u.aim) dip.agenda[u.aim] = d.day + 180;
  }
  return true;
}

export function sendUltimatum(d: DipDraft, by: string, on: string, demand: Demand, warOdds: number, aim?: string): void {
  const dip = d.diplomacy;
  if (!alive(d, by) || !alive(d, on) || fighting(d, by, on) || dip.ultimatums.some((u) => u.by === by && u.on === on)) return;
  raiseTension(d, TENSION.ultimatum);
  const u: Ultimatum = { id: dip.nextId++, by, on, demand, deadline: d.day + DECISION_DAYS, stances: {}, warOdds, aim };
  dip.ultimatums.push(u);
  note(d, 'crisis', `${by} sends ${on} an ultimatum: it demands ${demandText(demand, on)}`, [by, on]);
  for (const protector of protectorsOf(dip, on).sort()) {
    if (protector === by || !alive(d, protector) || allied(dip, protector, by)) continue;
    if (fighting(d, protector, by)) u.stances[protector] = true;
    else if (protector === d.player) {
      u.stances[protector] = null;
      ask(d, {
        country: protector, kind: 'backing', from: by, about: on, ultimatum: u.id, title: `${by} threatens ${on}`,
        text: `${by} demands ${demandText(demand, on)}. You have promised to defend ${on}. If you stand firm, ${on} refuses and ${by} must choose between backing down and a war with you. If you advise ${on} to give in, there is no war now, but ${by} grows stronger and your promise to ${on} ends.`,
        options: [
          { label: `Stand by ${on}`, effect: `${on} refuses. If ${by} attacks it, you are asked to declare war.` },
          { label: `Advise ${on} to give in`, effect: `No war now. Your promise to ${on} ends, relations with it fall by 30, and world tension still rises.` },
        ],
        fallback: 1,
      });
    } else u.stances[protector] = standsFirm(d, protector);
  }
  resolveUltimatum(d, u);
}

/** Carry out the answer to a decision. */
function resolveDecision(d: DipDraft, x: Decision, option: number): void {
  const dip = d.diplomacy;
  dip.decisions = dip.decisions.filter((y) => y.id !== x.id);
  const me = x.country;
  switch (x.kind) {
    case 'honour':
      if (option === 0 && x.about && alive(d, x.about) && alive(d, x.from)) honour(d, me, x.from, x.about);
      else if (x.about) {
        dropPacts(d, between(me, x.about));
        const e = d.economies[me];
        if (e) e.stability = clamp(e.stability - 10, 0, 100);
        for (const other of NAMES) if (other !== me) shift(dip, me, other, other === x.about ? -40 : -15);
        note(d, 'pact', `${me} breaks its promise to defend ${x.about}`, [me, x.about, x.from]);
      }
      break;
    case 'backing': {
      const u = dip.ultimatums.find((y) => y.id === x.ultimatum);
      if (!u) break;
      u.stances[me] = option === 0;
      resolveUltimatum(d, u);
      break;
    }
    case 'ultimatum': {
      const u = dip.ultimatums.find((y) => y.id === x.ultimatum);
      if (u) resolveUltimatum(d, u, option === 1);
      break;
    }
    case 'proposal':
      if (option === 0 && x.pact && alive(d, x.from)) {
        addPact(d, x.pact, x.from, me);
        note(d, 'pact', x.pact === 'alliance' ? `${x.from} and ${me} sign an alliance` : `${x.from} and ${me} sign a non-aggression pact`, [x.from, me]);
        if (x.aim) dip.agenda[x.aim] = 'done';
      } else {
        dip.rebuffs[`${x.from}>${me}:${x.pact}`] = d.day + REBUFF_DAYS;
        shift(dip, x.from, me, -5);
        if (x.aim) dip.agenda[x.aim] = 'dropped';
      }
      break;
    case 'peace':
      if (option === 0 && x.terms) endWar(d, x.from, me, x.terms);
      else dip.rebuffs[`${x.from}>${me}:peace`] = d.day + REBUFF_DAYS;
      break;
    case 'call':
      if (option === 0 && x.about && alive(d, x.about)) {
        startWar(d, me, x.about, 'honour', x.from);
      } else shift(dip, x.from, me, -10);
      break;
    case 'event':
      break;
  }
}

/** Carry out one diplomatic order. Orders that make no sense are ignored. */
export function giveDiplomacyOrder(d: DipDraft, o: DiplomacyOrder): void {
  const dip = d.diplomacy;
  switch (o.type) {
    case 'declareWar':
      if (!cannotDeclare(d, o.by, o.on)) startWar(d, o.by, o.on, 'attack');
      break;
    case 'makePeace':
      endWar(d, o.a, o.b, 'white');
      break;
    case 'offerPeace': {
      if (!fighting(d, o.by, o.to) || (dip.rebuffs[`${o.by}>${o.to}:peace`] ?? 0) > d.day) break;
      if (o.to === d.player) {
        if (dip.decisions.some((x) => x.kind === 'peace' && x.from === o.by)) break;
        ask(d, {
          country: o.to, kind: 'peace', from: o.by, terms: o.terms, title: `${o.by} offers peace`,
          text: o.terms === 'white' ? `${o.by} offers to end the war with both sides going back to their own borders.` : `${o.by} offers to end the war with each side keeping the land it holds today.`,
          options: [
            { label: 'Accept', effect: o.terms === 'white' ? 'The war ends. All occupied land goes back, and a truce holds for six months.' : 'The war ends. Occupied land changes owner for good, and a truce holds for six months.' },
            { label: 'Refuse', effect: 'The war goes on.' },
          ],
          fallback: 1,
        });
        break;
      }
      const answer = peaceAnswer(d, o.by, o.to, o.terms);
      if (answer.yes) endWar(d, o.by, o.to, o.terms);
      else {
        dip.rebuffs[`${o.by}>${o.to}:peace`] = d.day + REBUFF_DAYS;
        if (o.by === d.player) note(d, 'info', `${o.to} refuses your offer of peace: ${answer.why}`, [o.to, o.by]);
      }
      break;
    }
    case 'propose': {
      const { by, to, pact } = o;
      if (by === to || !alive(d, by) || !alive(d, to) || fighting(d, by, to) || hasPact(dip, pact, by, to) || allied(dip, by, to)) break;
      if ((dip.rebuffs[`${by}>${to}:${pact}`] ?? 0) > d.day) break;
      const words = pact === 'alliance' ? 'an alliance' : 'a non-aggression pact';
      if (to === d.player) {
        if (dip.decisions.some((x) => x.kind === 'proposal' && x.from === by && x.pact === pact)) break;
        ask(d, {
          country: to, kind: 'proposal', from: by, pact, title: `${by} proposes ${words}`,
          text: pact === 'alliance' ? `${by} proposes an alliance. Each of you promises to go to war if the other is attacked, and your armies may use each other's land.` : `${by} proposes a non-aggression pact: a promise not to attack each other. Breaking it later would cost the one who breaks it dearly in trust.`,
          options: [
            { label: 'Sign', effect: pact === 'alliance' ? `You are allies. If ${by} is attacked you will be asked to declare war.` : `Relations improve. Either of you can still break it, at a price.` },
            { label: 'Decline', effect: `Relations with ${by} fall by 5.` },
          ],
          fallback: 1,
        });
        break;
      }
      const yes = o.agreed && by !== d.player ? true : pactAnswer(d, by, to, pact).yes;
      if (yes) {
        addPact(d, pact, by, to);
        note(d, 'pact', pact === 'alliance' ? `${by} and ${to} sign an alliance` : `${by} and ${to} sign a non-aggression pact`, [by, to]);
      } else {
        dip.rebuffs[`${by}>${to}:${pact}`] = d.day + REBUFF_DAYS;
        if (by === d.player) note(d, 'info', `${to} declines ${words}`, [to, by]);
      }
      break;
    }
    case 'guarantee':
      if (cannotGuarantee(d, o.by, o.on)) break;
      addPact(d, 'guarantee', o.by, o.on);
      note(d, 'pact', `${o.by} guarantees the independence of ${o.on}`, [o.by, o.on]);
      break;
    case 'endPact': {
      const had = dip.pacts.some((p) => p.kind === o.pact && (o.pact === 'guarantee' ? p.a === o.by && p.b === o.other : between(o.by, o.other)(p)));
      if (!had) break;
      dropPacts(d, (p) => p.kind === o.pact && (o.pact === 'guarantee' ? p.a === o.by && p.b === o.other : between(o.by, o.other)(p)));
      shift(dip, o.by, o.other, o.pact === 'alliance' ? -40 : -25);
      for (const other of NAMES) if (other !== o.by && other !== o.other) shift(dip, o.by, other, -5);
      note(d, 'pact', o.pact === 'alliance' ? `${o.by} ends its alliance with ${o.other}` : o.pact === 'guarantee' ? `${o.by} withdraws its guarantee of ${o.other}` : `${o.by} denounces its non-aggression pact with ${o.other}`, [o.by, o.other]);
      sendHome(d);
      break;
    }
    case 'justify':
      if (cannotJustify(d, o.by, o.on)) break;
      dip.justifying.push({ by: o.by, on: o.on, daysLeft: JUSTIFY_DAYS[governmentOf(d, o.by)] });
      raiseTension(d, TENSION.justify);
      shift(dip, o.by, o.on, -20);
      note(d, 'crisis', `${o.by} begins a press campaign against ${o.on}`, [o.by, o.on]);
      break;
    case 'ultimatum': {
      // A player may only demand a standing claim. The AI's historical agenda can name its own demand.
      const demand = o.by === d.player || !o.demand ? claimOf(o.by, o.on)?.demand : o.demand;
      if (!demand || (o.by === d.player && cannotUltimatum(d, o.by, o.on))) break;
      sendUltimatum(d, o.by, o.on, demand, o.warOdds ?? 1, o.aim);
      break;
    }
    case 'mission': {
      const key = `${o.by}>${o.to}`;
      if (o.on && !dip.missions.includes(key) && alive(d, o.by) && alive(d, o.to) && o.by !== o.to && !fighting(d, o.by, o.to)) dip.missions.push(key);
      else if (!o.on) dip.missions = dip.missions.filter((m) => m !== key);
      break;
    }
    case 'callAlly': {
      const { by, ally, against } = o;
      if (!allied(dip, by, ally) || !fighting(d, by, against) || fighting(d, ally, against) || !alive(d, ally) || allied(dip, ally, against)) break;
      if ((dip.rebuffs[`${by}>${ally}:call:${against}`] ?? 0) > d.day) break;
      if (ally === d.player) {
        if (dip.decisions.some((x) => x.kind === 'call' && x.from === by && x.about === against)) break;
        ask(d, {
          country: ally, kind: 'call', from: by, about: against, title: `${by} asks you to join its war`,
          text: `Your ally ${by} is at war with ${against} and asks you to declare war too.`,
          options: [
            { label: `Declare war on ${against}`, effect: `You are at war with ${against}.` },
            { label: 'Stay out', effect: `Relations with ${by} fall by 10.` },
          ],
          fallback: 1,
        });
        break;
      }
      if (callAnswer(d, by, ally, against).yes) startWar(d, ally, against, 'honour', by);
      else {
        dip.rebuffs[`${by}>${ally}:call:${against}`] = d.day + REBUFF_DAYS;
        if (by === d.player) note(d, 'info', `${ally} will not join your war against ${against}`, [ally, by, against]);
      }
      break;
    }
    case 'decide': {
      const x = dip.decisions.find((y) => y.id === o.id && y.country === o.by);
      if (x && Number.isInteger(o.option) && o.option >= 0 && o.option < x.options.length) resolveDecision(d, x, o.option);
      break;
    }
    case 'settle': {
      const { by, target, how } = o;
      if (dip.conquered[target] !== by || !d.capitulated.includes(target) || !alive(d, by)) break;
      const land = PROVINCES.filter((p) => d.owner[p.id] === target && d.controller[p.id] === by);
      if (!land.length) break;
      if (how === 'annex') {
        for (const p of land) d.owner[p.id] = by;
        raiseTension(d, TENSION.annex);
        blame(d, by, -5);
        note(d, 'crisis', `${by} annexes ${target}`, [by, target]);
      } else {
        for (const p of land) d.controller[p.id] = target;
        const e = d.economies[target];
        if (e) e.government = governmentOf(d, by);
        restore(d, target, by);
        addPact(d, 'alliance', by, target);
        note(d, 'government', `${by} sets up a friendly government in ${target}`, [by, target]);
        sendHome(d);
      }
      break;
    }
  }
}

/** The daily business of diplomacy: cases being built, deadlines, and once a month the slow drift of relations. */
export function runDiplomacy(d: DipDraft, monthEnd: boolean): void {
  const dip = d.diplomacy;
  for (const j of dip.justifying) j.daysLeft--;
  for (const j of dip.justifying.filter((x) => x.daysLeft <= 0)) {
    dip.causes.push({ by: j.by, on: j.on, until: d.day + CAUSE_DAYS, why: 'a case built in the press and in parliament' });
    note(d, 'crisis', `${j.by} says it now has a cause for war against ${j.on}`, [j.by, j.on]);
  }
  dip.justifying = dip.justifying.filter((x) => x.daysLeft > 0 && alive(d, x.by) && alive(d, x.on));
  if (dip.causes.some((c) => c.until < d.day)) dip.causes = dip.causes.filter((c) => c.until >= d.day);
  for (const x of dip.decisions.filter((y) => y.deadline <= d.day)) resolveDecision(d, x, x.fallback);
  for (const u of dip.ultimatums.filter((y) => y.deadline < d.day)) {
    for (const p of Object.keys(u.stances)) if (u.stances[p] === null) u.stances[p] = false;
    if (!resolveUltimatum(d, u)) resolveUltimatum(d, u, false);
  }
  if (!monthEnd) return;
  for (let i = 0; i < NAMES.length; i++) {
    for (let j = i + 1; j < NAMES.length; j++) {
      const key = warKey(NAMES[i], NAMES[j]);
      if (d.wars.includes(key)) continue;
      const rest = restingRelation(d, NAMES[i], NAMES[j]);
      const now = dip.relations[key] ?? 0;
      dip.relations[key] = now + clamp(rest - now, -RELATIONS_DRIFT, RELATIONS_DRIFT);
    }
  }
  // Tension eases slowly while no great power is at war.
  if (!d.wars.some((k) => k.split('|').some(isMajor))) raiseTension(d, -TENSION.monthlyDecay);
  for (const m of dip.missions) {
    const [from] = m.split('>');
    const e = d.economies[from];
    if (e) e.treasury -= missionCost(d, from);
  }
  for (const k of Object.keys(dip.rebuffs)) if (dip.rebuffs[k] <= d.day) delete dip.rebuffs[k];
  for (const k of Object.keys(dip.truces)) if (dip.truces[k] <= d.day) delete dip.truces[k];
}

/** What one diplomatic mission costs this country a month: a share of its output, counted from its factories. */
export function missionCost(w: Pick<World, 'controller' | 'factories' | 'economies'>, name: string): number {
  let factories = 0;
  for (const p of PROVINCES) if (w.controller[p.id] === name) factories += w.factories.civ[p.id] + w.factories.mil[p.id];
  return MISSION_COST * factories * 10 * ((w.economies[name]?.priceLevel ?? 100) / 100);
}

/** A government has fallen: the news, and what the new one does about the country's promises. */
export function onGovernmentFell(d: DipDraft, name: string, was: Government): void {
  const now = governmentOf(d, name);
  const words: Record<Government, string> = { democracy: 'an elected government', authoritarian: 'an emergency government that rules by decree', fascist: 'a fascist government', communist: 'a communist government' };
  note(d, 'government', `The government of ${name} falls. ${words[now][0].toUpperCase()}${words[now].slice(1)} takes over${was !== now ? '' : ' in its place'}`, [name]);
  // The new government drops the old one's unfinished quarrels.
  d.diplomacy.justifying = d.diplomacy.justifying.filter((j) => j.by !== name);
}

/** Surrender: every country whose enemies hold enough of its land gives up, to whoever holds most of it. */
export function surrenders(d: DipDraft): void {
  for (const loser of [...new Set(d.wars.flatMap((k) => k.split('|')))].sort()) {
    if (!alive(d, loser)) continue;
    let total = 0;
    let capitalLost = false;
    const held = new Map<string, number>();
    for (const p of PROVINCES) {
      if (d.owner[p.id] !== loser) continue;
      total += p.victoryPoints;
      const holder = d.controller[p.id];
      if (!fighting(d, loser, holder)) continue;
      held.set(holder, (held.get(holder) ?? 0) + p.victoryPoints);
      if (p.capital && p.owner === loser) capitalLost = true;
    }
    const lost = [...held.values()].reduce((a, b) => a + b, 0);
    if (!total || lost / total < (capitalLost ? SURRENDER_SHARE_NO_CAPITAL : SURRENDER_SHARE)) continue;
    const victor = [...held.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0][0];
    capitulate(d, loser, victor);
  }
}
