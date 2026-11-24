/**
 * America and the Atlantic (version 1.9): the United States and the British Dominions in Story mode.
 *
 *   Neutrality       Most Americans wanted to stay out of Europe's war. The United States may not
 *                    declare war until its war support reaches AMERICAN_WAR_OPINION (diplomacy.ts
 *                    neutralAmerica), and in peacetime its people pull war support down
 *                    (economy.ts ISOLATION). Pearl Harbor changes that.
 *   Cash and Carry   From November 1939 Britain and France may buy American arms, if they pay in
 *                    cash and carry them in their own ships.
 *   Destroyers       September 1940: fifty old American destroyers for leases on British bases.
 *   The draft        September 1940: the first peacetime call-up in American history.
 *   Lend-Lease       From March 1941 the United States sets aside a share of what its arms
 *                    factories make (Economy.lendLease) and ships it, free, to the countries
 *                    fighting the Axis: Britain across the Atlantic, the Soviet Union by the Arctic
 *                    convoys, across the Pacific to Vladivostok and through Iran, and China over the
 *                    Burma Road or "the Hump". Every convoy crosses real sea zones, and raiders at
 *                    war with the country it sails for sink their share (navy.ts convoyRoute).
 *   Pearl Harbor     7 December 1941. The Pacific war itself comes in a later version: here it moves
 *                    American opinion, and four days later Germany and Italy declare war on America.
 *   Torch            8 November 1942: American troops land in French North Africa, which changes
 *                    sides, and Germany occupies the rest of France (Case Anton).
 *   The Dominions    Canada, Australia, New Zealand and South Africa go to war beside Britain and
 *                    send divisions to Britain and Egypt (operations.ts).
 *
 * All of this is for Story mode only, and none of it happens to a country the player leads: a
 * player is asked instead (story.ts events), or decides for themselves. A game saved before 1.9
 * keeps the United States and the Dominions asleep, and with them the Lend-Lease of 1.8 (story.ts).
 *
 * Pure TypeScript with no UI.
 */
import { ATLANTIC, DOMINIONS } from './countries';
import { addPact, alive, allied, endWar, governmentOf, note, shift, startWar, type DipDraft } from './diplomacy';
import { KIT_COST, LEND_LEASE_MAX, LINE_KINDS } from './economy';
import { EUROPEAN, partsOf, PROVINCES } from './map';
import { convoyRoute } from './navy';
import { EUROPE_ZONES, ZONE_INDEX, zonePath, type SeaPicture } from './sea';
import type { Economy, Fleet, LineKind, Order, Shipment, World } from './types';
import { warKey } from './war';

export const US = 'United States';

/** The real dates. */
export const AMERICA = {
  cashAndCarry: '1939-11-04',
  destroyers: '1940-09-02',
  draft: '1940-09-16',
  lendLease: '1941-03-11',
  /** China's Lend-Lease began in May 1941, the Soviet Union's with the First Protocol of October 1941. */
  china: '1941-05-06',
  soviet: '1941-10-01',
  /** The USS Greer, fired on by a U-boat: from now on American escorts shoot on sight. */
  shootOnSight: '1941-09-04',
  pearlHarbor: '1941-12-07',
  germanyDeclares: '1941-12-11',
  /** The Persian Corridor: the railway through Iran, open to American cargo from 1942. */
  persia: '1942-01-01',
  torch: '1942-11-08',
  /** The last day an AI America still carries out Torch. */
  torchUntil: '1943-12-31',
};

/** Lend-Lease in 1.8, before the United States was on the map: the dates it began, kept for games saved then (story.ts). */
export const LEND_LEASE = { britain: '1941-03-11', soviet: '1941-10-01' };
/** Sets of equipment, wings of aircraft and ships a month: what 1.8 handed over off the map, and the mix each country asks for in 1.9. */
export const LEND_LEASE_GOODS: Record<string, Partial<Record<LineKind, number>>> = {
  'United Kingdom': { infantry: 0.6, artillery: 0.2, armour: 0.2, fighter: 0.3, bomber: 0.15, escort: 0.3 },
  'Soviet Union': { infantry: 0.6, armour: 0.3, fighter: 0.3 },
  /** China (1.8 CHINA_AID): rifles, guns and fighters. */
  China: { infantry: 1.2, artillery: 0.3, fighter: 0.2 },
  /** France bought aircraft above all (Cash and Carry). */
  France: { fighter: 0.3, bomber: 0.1, infantry: 0.2 },
};
/** A month's wish list in factory-days of equipment (KIT_COST). */
export const wantOf = (country: string): number => Object.entries(LEND_LEASE_GOODS[country] ?? {}).reduce((a, [k, n]) => a + n * KIT_COST[k as LineKind], 0);
/** Under Cash and Carry the buyers had to pay in gold and dollars, and bought about half as much. */
export const CASH_SHARE = 0.5;
/** Money per factory-day of equipment under Cash and Carry, at American prices of 1936 (a factory makes OUTPUT_PER_FACTORY a month). */
export const PRICE_PER_DAY = 10 / 30;
/** Share of China's Lend-Lease that can be flown over the Hump once the Burma Road is cut. The rest waits in America. */
export const HUMP = 0.25;

/** One route for American cargo: the zones it crosses, and what must hold for it to be open. */
export interface AidRoute {
  id: string;
  name: string;
  to: string;
  zones: number[];
  /** Share of the country's cargo that goes this way, among the open routes. */
  weight: number;
  open: (w: AidView) => boolean;
  /** Share that arrives when the route goes by air rather than by sea (the Hump). */
  air?: number;
}
type AidView = Pick<World, 'day' | 'startDate' | 'controller' | 'wars' | 'capitulated' | 'economies' | 'mode' | 'player'> & { asleep?: string[]; story: World['story'] };

const Z = (id: string): number => ZONE_INDEX[id];
const P = (name: string): number => PROVINCES.find((p) => p.name === name)!.id;
/** Round the Cape: the long way, by the open oceans, keeping clear of the Mediterranean. */
const ocean = (from: string, to: string): number[] => zonePath(Z(from), Z(to), (z) => z >= EUROPE_ZONES || z === Z(to)) ?? [Z(from), Z(to)];
const path = (from: string, to: string, avoid: string[] = []): number[] => zonePath(Z(from), Z(to), (z) => !avoid.map(Z).includes(z)) ?? [Z(from), Z(to)];
export const dayOf = (startDate: string, date: string): number => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000);
const since = (w: Pick<World, 'day' | 'startDate'>, date: string): boolean => w.day >= dayOf(w.startDate, date);
const fighting = (w: Pick<World, 'wars'>, a: string, b: string): boolean => w.wars.includes(warKey(a, b));
const holds = (w: AidView, country: string, ...names: string[]): boolean => names.some((n) => partsOf(P(n)).some((p) => w.controller[p] === country));

/** Waters off Japan and its empire, which cargo for China kept clear of: it went by way of the South Pacific and India. */
const JAPAN_SEAS = ['japanwaters', 'eastchina', 'southchina', 'japansea', 'okhotsk', 'philippine', 'marianas', 'northpacific'];

export const AID_ROUTES: AidRoute[] = [
  { id: 'atlantic', name: 'the North Atlantic convoys', to: 'United Kingdom', zones: path('eastcoast', 'approaches'), weight: 1, open: () => true },
  { id: 'france', name: 'the Atlantic to France', to: 'France', zones: path('eastcoast', 'biscay'), weight: 1, open: () => true },
  // The Soviet Union: about half of all its Lend-Lease came across the Pacific in Soviet ships, which Japan let pass;
  // a quarter through Iran; and a quarter by the Arctic convoys to Murmansk and Archangel, the most dangerous of all.
  { id: 'pacific', name: 'the Pacific to Vladivostok', to: 'Soviet Union', zones: ocean('westcoast', 'japansea'), weight: 0.5, open: (w) => holds(w, 'Soviet Union', 'Primorye') && !fighting(w, 'Japan', 'Soviet Union') },
  { id: 'persia', name: 'the Persian Corridor', to: 'Soviet Union', zones: ocean('eastcoast', 'persiangulf'), weight: 0.25, open: (w) => since(w, AMERICA.persia) && holds(w, 'Soviet Union', 'Azerbaijan') },
  { id: 'arctic', name: 'the Arctic convoys', to: 'Soviet Union', zones: path('eastcoast', 'barents', ['approaches', 'north']), weight: 0.25, open: (w) => holds(w, 'Soviet Union', 'Murmansk', 'Arkhangelsk') },
  { id: 'burma', name: 'the Burma Road', to: 'China', zones: path('westcoast', 'bengal', JAPAN_SEAS), weight: 1, open: (w) => holds(w, 'United Kingdom', 'Lower Burma') && holds(w, 'United Kingdom', 'Upper Burma') },
  { id: 'hump', name: 'the Hump, by air from India', to: 'China', zones: path('westcoast', 'bengal', JAPAN_SEAS), weight: 1, air: HUMP, open: (w) => !(holds(w, 'United Kingdom', 'Lower Burma') && holds(w, 'United Kingdom', 'Upper Burma')) },
];

/** Is the American story running in this game? Not outside Story mode, in a lesson, or in a game saved before 1.9 (America asleep). */
export const americaAwake = (w: Pick<World, 'mode'> & { asleep?: string[]; capitulated: string[]; story: World['story'] }): boolean =>
  w.mode === 'story' && !w.story.lesson && !w.asleep?.includes(US) && !w.capitulated.includes(US);

const fired = (w: { story: World['story'] }, id: string): boolean => w.story.fired.includes(id);
const fire = (d: DipDraft, id: string): void => {
  if (!d.story.fired.includes(id)) d.story.fired = [...d.story.fired, id];
};
const live = (w: Pick<World, 'capitulated'> & { asleep?: string[] }, name: string): boolean => !w.capitulated.includes(name) && !w.asleep?.includes(name);
const AXIS_FOES = ['Germany', 'Italy'];
const list = (xs: string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');

/**
 * Who receives American arms this month, and on what terms: free under Lend-Lease, or paid for
 * under Cash and Carry. Lend-Lease goes to the countries fighting Germany or Italy (and China,
 * fighting Japan) from its real dates; Cash and Carry to Britain and France while they fight Germany.
 */
export function recipients(w: AidView): { to: string; pays: boolean }[] {
  if (!americaAwake(w)) return [];
  const out: { to: string; pays: boolean }[] = [];
  const lendLease = fired(w, 'lend-lease-act');
  const cash = fired(w, 'cash-and-carry');
  const ok = (name: string) => live(w, name) && !fighting(w, US, name) && !w.story.armistice.includes(name);
  for (const name of ['United Kingdom', 'France']) {
    if (!ok(name) || !AXIS_FOES.some((x) => fighting(w, name, x))) continue;
    if (lendLease) out.push({ to: name, pays: false });
    else if (cash) out.push({ to: name, pays: true });
  }
  if (lendLease && since(w, AMERICA.soviet) && ok('Soviet Union') && AXIS_FOES.some((x) => fighting(w, 'Soviet Union', x))) out.push({ to: 'Soviet Union', pays: false });
  if (lendLease && since(w, AMERICA.china) && ok('China') && fighting(w, 'China', 'Japan')) out.push({ to: 'China', pays: false });
  return out;
}

/** What America's military factories make in a month, in factory-days of the kinds its friends ask for. */
function monthlyOutput(e: Economy, lineRate: Record<LineKind, number>, wanted: Set<LineKind>): number {
  let out = 0;
  for (const k of LINE_KINDS) if (wanted.has(k) && e.lines[k].factories) out += lineRate[k] * 30 * KIT_COST[k];
  return out;
}

/**
 * The share of its arms an AI America sets aside each month: enough for what its friends ask for
 * (LEND_LEASE_GOODS, half of it under Cash and Carry), up to LEND_LEASE_MAX.
 */
export function aiLendLeaseOrder(w: World, lineRate: Record<LineKind, number>): Order | null {
  const e = w.economies[US];
  if (!e || w.player === US || !americaAwake(w)) return null;
  const list = recipients(w);
  const wanted = new Set<LineKind>(list.flatMap((r) => Object.keys(LEND_LEASE_GOODS[r.to] ?? {}) as LineKind[]));
  const target = list.reduce((a, r) => a + wantOf(r.to) * (r.pays ? CASH_SHARE : 1), 0);
  const output = monthlyOutput(e, lineRate, wanted);
  const share = output > 0 ? Math.min(LEND_LEASE_MAX, Math.round((20 * target) / output) / 20) : 0;
  return Math.abs(share - (e.lendLease ?? 0)) > 0.01 ? { type: 'setLendLease', country: US, share } : null;
}

/**
 * The month's convoys. What America set aside (Economy.aid) is split between the countries that
 * receive it, by what each asks for; each share crosses the sea by the open routes, and raiders
 * at war with the receiving country sink their part on the way. Equipment nobody asks for, or that
 * cannot get through, goes back to America's own stock.
 */
export function shipAid(d: DipDraft & Pick<World, 'fleets'>, sea: SeaPicture, friends: Map<string, Set<string>>): void {
  const us = d.economies[US];
  if (!us?.aid || !americaAwake(d)) return;
  const aid = us.aid;
  us.aid = {};
  const list = recipients(d);
  const shipments = new Map<string, Shipment>();
  const total = { ...(d.story.lendLease?.total ?? {}) };
  const view = { fleets: d.fleets, wars: d.wars, day: d.day, economies: d.economies };
  const losses = new Map<string, number>();
  const routesOf = (to: string) => {
    const open = AID_ROUTES.filter((r) => r.to === to && r.open(d));
    const sum = open.reduce((a, r) => a + r.weight, 0);
    return open.map((r) => ({ r, share: r.weight / sum }));
  };
  let sunkByU = 0;
  for (const k of LINE_KINDS) {
    const amount = aid[k] ?? 0;
    if (amount <= 0) continue;
    const wants = list.map((x) => ({ x, n: LEND_LEASE_GOODS[x.to]?.[k] ?? 0 })).filter((y) => y.n > 0);
    const sum = wants.reduce((a, y) => a + y.n, 0);
    if (!sum) {
      us.stock[k] += amount;
      continue;
    }
    for (const { x, n } of wants) {
      const part = (amount * n) / sum;
      const e = d.economies[x.to];
      const routes = routesOf(x.to);
      if (!e || !routes.length) {
        us.stock[k] += part;
        continue;
      }
      for (const { r, share } of routes) {
        const cargo = part * share;
        let lost = losses.get(r.id);
        if (lost === undefined) losses.set(r.id, (lost = convoyRoute(view, sea, friends, x.to, r.zones).lost));
        const flown = r.air ?? 1;
        const arrives = cargo * flown * (1 - lost);
        e.stock[k] += arrives;
        us.stock[k] += cargo * (1 - flown);
        const s = shipments.get(r.id) ?? { to: x.to, route: r.id, sent: 0, sunk: 0 };
        s.sent += cargo * flown * KIT_COST[k];
        s.sunk += cargo * flown * lost * KIT_COST[k];
        if (x.pays) {
          const price = cargo * flown * KIT_COST[k] * PRICE_PER_DAY * (us.priceLevel / 100);
          e.treasury -= price;
          us.treasury += price;
          s.paid = (s.paid ?? 0) + price;
        }
        shipments.set(r.id, s);
        const t = (total[x.to] = { ...(total[x.to] ?? { sent: 0, sunk: 0 }) });
        t.sent += cargo * flown * KIT_COST[k];
        t.sunk += cargo * flown * lost * KIT_COST[k];
        if (x.to !== 'China') sunkByU += cargo * flown * lost * KIT_COST[k];
      }
    }
  }
  const list2 = [...shipments.values()].map((s) => ({ ...s, sent: Math.round(s.sent), sunk: Math.round(s.sunk), ...(s.paid !== undefined ? { paid: Math.round(s.paid) } : {}) }));
  d.story.lendLease = { day: d.day, shipments: list2, total };
  for (const s of list2) {
    const key = `${s.paid !== undefined ? 'cash-and-carry' : 'lend-lease'}:${s.to}`;
    if (fired(d, key)) continue;
    fire(d, key);
    const how = AID_ROUTES.find((r) => r.id === s.route)?.name ?? 'the sea';
    note(d, 'info', s.paid !== undefined ? `Cash and Carry: ${s.to} buys American arms and carries them home across ${how}` : `Lend-Lease: American equipment begins to reach ${s.to} by ${how}`, [US, s.to]);
  }
  // American cargo sunk by U-boats, once American escorts shoot on sight: a cause for war, and anger at home.
  if (sunkByU > 0 && fired(d, 'lend-lease-act') && since(d, AMERICA.shootOnSight) && alive(d, 'Germany') && !fighting(d, US, 'Germany')) {
    d.diplomacy.causes.push({ by: US, on: 'Germany', until: d.day + 365, why: 'German submarines sink American ships and fire on American destroyers' });
    if (!fired(d, 'shoot-on-sight')) {
      fire(d, 'shoot-on-sight');
      note(d, 'crisis', 'A U-boat fires on the American destroyer Greer. President Roosevelt orders the navy to "shoot on sight": an undeclared war in the Atlantic', [US, 'Germany']);
    }
  }
}

// ---------- the American story, one day at a time ----------

/** Cash and Carry: Britain and France may buy American arms for cash. */
export function cashAndCarry(d: DipDraft): void {
  if (fired(d, 'cash-and-carry')) return;
  fire(d, 'cash-and-carry');
  for (const x of ['United Kingdom', 'France']) shift(d.diplomacy, US, x, 5);
  shift(d.diplomacy, US, 'Germany', -5);
  note(d, 'info', 'Congress changes the Neutrality Act: Britain and France may now buy American arms, if they pay cash and carry them in their own ships', [US]);
}

/** Destroyers for Bases: three escort flotillas from the Atlantic Squadron go to Britain's Western Approaches. */
export const DESTROYERS = 3;
export function destroyersForBases(d: DipDraft & Partial<Pick<World, 'fleets' | 'nextForceId'>>): void {
  if (fired(d, 'destroyers-for-bases')) return;
  fire(d, 'destroyers-for-bases');
  shift(d.diplomacy, US, 'United Kingdom', 10);
  shift(d.diplomacy, US, 'Germany', -10);
  const from = d.fleets?.find((f) => f.owner === US && f.zone === 'eastcoast' && f.ships.escort >= 1) ?? d.fleets?.find((f) => f.owner === US && f.ships.escort >= 1);
  if (d.fleets && d.nextForceId !== undefined && from && live(d, 'United Kingdom')) {
    const n = Math.min(DESTROYERS, Math.floor(from.ships.escort));
    from.ships = { ...from.ships, escort: from.ships.escort - n };
    const fleet: Fleet = { id: d.nextForceId, owner: 'United Kingdom', name: 'Town-class destroyers', zone: 'approaches', mission: 'escort', ships: { capital: 0, escort: n, submarine: 0 }, arrives: d.day + 30 };
    d.fleets.push(fleet);
    d.nextForceId++;
  }
  note(d, 'pact', 'Destroyers for Bases: the United States gives Britain fifty old destroyers in return for leases on British bases from Newfoundland to the Caribbean', [US, 'United Kingdom']);
}

/** The Selective Training and Service Act: America's first peacetime call-up. */
export function selectiveService(d: DipDraft): void {
  if (fired(d, 'selective-service')) return;
  fire(d, 'selective-service');
  const e = d.economies[US];
  if (e && e.conscription < 1) e.conscription = 1;
  note(d, 'government', 'The Selective Service Act: for the first time in peace, American men are called up for a year of training', [US]);
}

/** The Lend-Lease Act: arms for the countries fighting the Axis, to be paid back "in kind" after the war. */
export function lendLeaseAct(d: DipDraft): void {
  if (fired(d, 'lend-lease-act')) return;
  fire(d, 'lend-lease-act');
  shift(d.diplomacy, US, 'United Kingdom', 10);
  shift(d.diplomacy, US, 'Germany', -10);
  const e = d.economies[US];
  if (e && d.player === US && !e.lendLease) e.lendLease = 0.2;
  note(d, 'info', 'The Lend-Lease Act: "the arsenal of democracy" will lend arms to the countries fighting the Axis, without payment in cash', [US]);
}

/** Germany (and Italy beside it) declares war on the United States. */
export function axisDeclares(d: DipDraft, by: string): void {
  if (!alive(d, by) || !alive(d, US) || fighting(d, by, US)) return;
  d.diplomacy.causes.push({ by, on: US, until: d.day + 30, why: 'America arms its enemies, and its warships hunt its submarines' });
  startWar(d, by, US, 'attack');
}

/** The United States declares war itself, and joins hands with those already fighting its enemy. */
function americaDeclares(d: DipDraft, on: string): void {
  startWar(d, US, on, 'attack');
  joinTheAllies(d, on);
}

/** The United Nations: an AI America and the great powers fighting the same enemy become allies. */
function joinTheAllies(d: DipDraft, foe: string): void {
  for (const x of ['United Kingdom', 'Soviet Union', ...DOMINIONS]) {
    if (x === d.player || d.player === US || !alive(d, x) || !fighting(d, x, foe) || allied(d.diplomacy, US, x) || fighting(d, x, US)) continue;
    addPact(d, 'alliance', US, x);
    note(d, 'pact', `${US} and ${x} become allies against ${foe}`, [US, x]);
  }
}

/** French North Africa in Torch, and the troops that land there. */
export const TORCH = {
  landing: ['Oran', 'Rabat', 'Constantine'],
  /** Algeria and Morocco, which changed sides three days after the landings. */
  north: ['Fez', 'Marrakech', 'Oran', 'Constantine'],
  /** Tunisia, where Germany and Italy rushed in troops by air and sea. */
  tunisia: ['Tunisia'],
  /** American divisions in the first landings. */
  divisions: 6,
  /** German divisions flown and shipped to Tunisia. */
  axis: 4,
};
/** The rest of France, which Germany occupied on 11 November 1942 (Case Anton); Corsica went to Italy. */
const VICHY_MAINLAND = ['Provence', 'Burgundy', 'Languedoc', 'Roussillon', 'Limousin', 'Guyenne'];

/** Can Torch go ahead today? Returns why not, or null. */
export function torchBlocked(w: Pick<World, 'wars' | 'capitulated' | 'controller' | 'units'> & { asleep?: string[]; story: World['story'] }): string | null {
  if (!w.story.armistice.includes('France')) return 'French North Africa is not under the government at Vichy';
  if (!fighting(w, US, 'Germany') && !fighting(w, US, 'Italy')) return 'America is not at war with the Axis';
  if (!TORCH.north.some((n) => partsOf(P(n)).some((p) => w.controller[p] === 'France'))) return 'French North Africa is no longer in French hands';
  if (!w.units.some((u) => u.owner === US && PROVINCES[u.at].owner === US && !u.path.length)) return 'no American divisions are ready';
  return null;
}

/** Operation Torch and Case Anton. */
export function torch(d: DipDraft & Partial<Pick<World, 'fleets'>>): void {
  if (fired(d, 'torch') || torchBlocked(d)) return;
  fire(d, 'torch');
  const north = new Set(TORCH.north.flatMap((n) => partsOf(P(n))));
  for (const p of north) if (d.owner[p] === 'France' && d.controller[p] === 'France') d.controller[p] = US;
  // The French troops there joined the Allies; in the game they leave the map.
  d.units = d.units.filter((u) => !(u.owner === 'France' && north.has(u.at)));
  // The landing force: the American divisions most ready at home.
  const ready = d.units.filter((u) => u.owner === US && PROVINCES[u.at].owner === US && !u.path.length && !u.sea && !u.landing).sort((a, b) => b.organisation - a.organisation || a.id - b.id).slice(0, TORCH.divisions);
  const beaches = TORCH.landing.map(P).filter((p) => d.controller[p] === US);
  ready.forEach((u, i) => {
    if (!beaches.length) return;
    u.at = beaches[i % beaches.length];
    u.organisation = Math.min(u.organisation, 60);
    u.dugIn = 0;
    u.progress = 0;
    u.via = undefined;
  });
  note(d, 'war', `Operation Torch: American and British troops land in Morocco and Algeria. After three days of fighting the French there change sides`, [US, 'France', 'United Kingdom']);
  // Tunisia: the Axis gets there first.
  const axis = ['Germany', 'Italy'].find((x) => alive(d, x) && x !== d.player && (fighting(d, x, US) || fighting(d, x, 'United Kingdom')));
  const tunisia = TORCH.tunisia.flatMap((n) => partsOf(P(n)));
  if (axis) {
    for (const p of tunisia) if (d.controller[p] === 'France') d.controller[p] = axis;
    d.units = d.units.filter((u) => !(u.owner === 'France' && tunisia.includes(u.at)));
    const sent = d.units
      .filter((u) => u.owner === axis && PROVINCES[u.at].owner === axis && !u.path.length && !u.sea && !u.landing && u.type !== 'airborne' && !PROVINCES[u.at].neighbours.some((n) => d.wars.includes(warKey(axis, d.controller[n]))))
      .sort((a, b) => b.organisation - a.organisation || a.id - b.id)
      .slice(0, TORCH.axis);
    for (const u of sent) {
      u.at = P('Tunisia');
      u.dugIn = 0;
      u.progress = 0;
    }
    note(d, 'war', `${axis === 'Germany' ? 'German' : 'Italian'} troops are flown and shipped into Tunisia, ${sent.length} divisions within weeks`, [axis, 'France']);
  }
  // Case Anton: Germany occupies the rest of France, and the French fleet scuttles itself at Toulon.
  const de = 'Germany';
  if (!alive(d, de) || d.player === de || governmentOf(d, de) !== 'fascist') return;
  const zone = new Set(VICHY_MAINLAND.flatMap((n) => partsOf(P(n))));
  for (const p of zone) if (d.controller[p] === 'France') d.controller[p] = de;
  const italy = alive(d, 'Italy') && allied(d.diplomacy, de, 'Italy') && d.player !== 'Italy' ? 'Italy' : de;
  for (const p of partsOf(P('Corsica'))) if (d.controller[p] === 'France') d.controller[p] = italy;
  d.units = d.units.filter((u) => !(u.owner === 'France' && (zone.has(u.at) || PROVINCES[u.at].name === 'Corsica')));
  if (d.fleets) for (const f of d.fleets) if (f.owner === 'France') f.ships = { capital: 0, escort: 0, submarine: 0 };
  note(d, 'war', 'Case Anton: Germany occupies the rest of France. At Toulon the French fleet scuttles itself rather than fall into German hands', [de, 'France']);
}

/**
 * The day's American story for countries the AI leads: the dates of 1939 to 1942, the Dominions
 * going to war beside Britain, and America going to war. Story decisions for a player are in story.ts.
 */
export function runAmerica(d: DipDraft & Partial<Pick<World, 'fleets' | 'nextForceId'>>, monthEnd: boolean): void {
  if (!americaAwake(d)) return;
  const me = d.player;
  const ai = me !== US && alive(d, US) && governmentOf(d, US) === 'democracy';
  const uk = 'United Kingdom';
  const ukFights = (x: string) => fighting(d, uk, x);

  // The Dominions: at war beside Britain against every country of Europe it fights (they did, from
  // September 1939 to Finland, Hungary and Romania in December 1941), and at peace when it is.
  const joined = new Map<string, string[]>();
  for (const dom of DOMINIONS) {
    if (dom === me || !alive(d, dom) || !alive(d, uk) || !allied(d.diplomacy, uk, dom)) continue;
    for (const key of [...d.wars]) {
      const [a, b] = key.split('|');
      const foe = a === uk ? b : b === uk ? a : null;
      if (!foe || foe === dom || !EUROPEAN.has(foe) || fighting(d, dom, foe)) continue;
      // One line in the news for all of them (startWar writes one each).
      // (By id, not position: the log keeps only its last 80 entries.)
      const first = d.diplomacy.nextId;
      startWar(d, dom, foe, 'honour', uk);
      d.diplomacy.log = d.diplomacy.log.filter((x) => !(x.id >= first && x.kind === 'war' && x.countries[0] === dom && x.countries[1] === foe));
      joined.set(foe, [...(joined.get(foe) ?? []), dom]);
      // The 1936 treaty let the forces of the Empire use Egypt: Dominion divisions fought in its Western Desert.
      for (const host of ['Egypt']) if (alive(d, host) && allied(d.diplomacy, uk, host) && !allied(d.diplomacy, dom, host)) addPact(d, 'alliance', dom, host);
    }
    for (const key of [...d.wars]) {
      const [a, b] = key.split('|');
      const foe = a === dom ? b : b === dom ? a : null;
      if (foe && !ukFights(foe) && !fighting(d, US, foe) && d.diplomacy.honour.includes(key)) endWar(d, dom, foe, 'white');
    }
  }
  for (const [foe, doms] of joined) note(d, 'war', `${list(doms)} ${doms.length > 1 ? 'declare' : 'declares'} war on ${foe} beside the United Kingdom`, [...doms, foe]);

  if (!ai) return;
  const on = (date: string): boolean => since(d, date);
  const axisAtWar = AXIS_FOES.some((x) => ukFights(x) || fighting(d, 'France', x));
  if (on(AMERICA.cashAndCarry) && axisAtWar) cashAndCarry(d);
  if (on(AMERICA.destroyers) && alive(d, uk) && AXIS_FOES.some(ukFights)) destroyersForBases(d);
  if (on(AMERICA.draft) && AXIS_FOES.some((x) => ukFights(x) || fighting(d, 'Soviet Union', x))) selectiveService(d);
  if (on(AMERICA.lendLease) && AXIS_FOES.some((x) => ukFights(x) || fighting(d, 'Soviet Union', x))) lendLeaseAct(d);
  // An AI America goes to war once its people are ready and it has a cause.
  if (monthEnd && on(AMERICA.pearlHarbor)) {
    for (const foe of AXIS_FOES) {
      if (!alive(d, foe) || fighting(d, US, foe) || (d.economies[US]?.warSupport ?? 0) < 60 || !d.diplomacy.causes.some((c) => c.by === US && c.on === foe && c.until >= d.day)) continue;
      americaDeclares(d, foe);
    }
  }
  for (const foe of AXIS_FOES) if (fighting(d, US, foe)) joinTheAllies(d, foe);
  if (on(AMERICA.torch) && d.day <= dayOf(d.startDate, AMERICA.torchUntil)) torch(d);
}

/**
 * Pearl Harbor (7 December 1941), and Germany's answer four days later, for countries the AI leads.
 * Runs in Story mode whoever leads America, since Japan's attack is not America's choice.
 */
export function pearlHarbor(d: DipDraft): void {
  if (!americaAwake(d)) return;
  const jp = 'Japan';
  if (!fired(d, 'pearl-harbor') && since(d, AMERICA.pearlHarbor) && alive(d, jp) && alive(d, US) && governmentOf(d, jp) === 'authoritarian' && !fighting(d, jp, US)) {
    fire(d, 'pearl-harbor');
    shift(d.diplomacy, US, jp, -60);
    note(d, 'crisis', 'Japan attacks the American fleet at Pearl Harbor. The Pacific war is not fought on the map in this version, but America is united: its war support jumps', [US, jp]);
  }
  if (!fired(d, 'pearl-harbor') || fired(d, 'axis-declares') || !since(d, AMERICA.germanyDeclares)) return;
  const de = 'Germany';
  if (d.player === de) return; // a German player is asked (story.ts)
  fire(d, 'axis-declares');
  if (!alive(d, de) || governmentOf(d, de) !== 'fascist' || !fighting(d, de, 'United Kingdom') || fighting(d, de, US)) return;
  axisDeclares(d, de);
  const it = 'Italy';
  if (it !== d.player && alive(d, it) && governmentOf(d, it) === 'fascist' && allied(d.diplomacy, de, it) && !fighting(d, it, US)) axisDeclares(d, it);
}

/** For the screens: a month of American aid in words. */
export const routeName = (id: string): string => AID_ROUTES.find((r) => r.id === id)?.name ?? id;
export const isAtlantic = (name: string): boolean => ATLANTIC.includes(name);
