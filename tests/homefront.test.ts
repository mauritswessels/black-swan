import { describe, expect, it } from 'vitest';
import { quiet } from '../src/sim/agenda';
import { attackPower, defencePower, outlook } from '../src/sim/combat';
import { COUNTRIES } from '../src/sim/countries';
import { conscriptionBlocked, CRISIS_MONTHS, economyView, moraleOf, onBattleEnded, WAR_SUPPORT_BASE } from '../src/sim/economy';
import { advance } from '../src/sim/game';
import { PROVINCES, provinceByName } from '../src/sim/map';
import { combatEdges, describeEffects, modsOf } from '../src/sim/mods';
import { cannotStartPlan, planById, PLANS, plansFor } from '../src/sim/plans';
import { BRANCHES, cannotResearch, daysToFinish, researchSlots, researchSpeed, techById, TECHS, yearAt } from '../src/sim/research';
import { runWar } from '../src/sim/testwar';
import type { Economy, Order, Unit, World } from '../src/sim/types';
import { applyOrders, newWorld, step } from '../src/sim/world';

// A quiet world: no pacts and no historical agenda, so these tests see only the home front.
const as = (country: string, seed = 'stage-e') => quiet(newWorld('freeForAll', seed, '1936-01-01', country));
const give = (w: World, ...orders: Order[]): World => applyOrders(w, orders);
const days = (w: World, n: number): World => {
  for (let d = 0; d < n; d++) w = step(w);
  return w;
};
/** The same world with one country's record changed. */
const withEconomy = (w: World, country: string, change: Partial<Economy>): World => ({ ...w, economies: { ...w.economies, [country]: { ...w.economies[country], ...change } } });
const knowing = (w: World, country: string, ...ids: string[]): World => withEconomy(w, country, { research: { ...w.economies[country].research, done: ids } });
const unit = (owner: string, at: number, type: Unit['type'] = 'infantry'): Unit => ({ id: 9000 + at, owner, type, at, strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1 });

describe('the list of technologies', () => {
  it('has four branches of four technologies, in order of year, each with an effect and a history note', () => {
    expect(TECHS).toHaveLength(16);
    expect(new Set(TECHS.map((t) => t.id)).size).toBe(16);
    for (const b of BRANCHES) {
      const branch = TECHS.filter((t) => t.branch === b.id).sort((x, y) => x.tier - y.tier);
      expect(branch.map((t) => t.tier), b.name).toEqual([1, 2, 3, 4]);
      expect(branch.map((t) => t.year), b.name).toEqual([1936, 1938, 1940, 1942]);
    }
    for (const t of TECHS) {
      expect(describeEffects(t.effects).length, t.name).toBeGreaterThan(0);
      expect(t.history.length, t.name).toBeGreaterThan(40);
      expect(t.what.length, t.name).toBeGreaterThan(20);
    }
  });

  it('gives the six major powers two research teams and everyone else one', () => {
    const w = as('France');
    for (const c of COUNTRIES) {
      expect(researchSlots(c.name), c.name).toBe(c.major ? 2 : 1);
      expect(w.economies[c.name].research.slots, c.name).toHaveLength(c.major ? 2 : 1);
    }
  });
});

describe('research', () => {
  it('finishes a technology of its own year in its listed number of days', () => {
    const tech = techById('ind1')!;
    let w = give(as('France'), { type: 'setResearch', country: 'France', slot: 0, tech: 'ind1' });
    w = days(w, tech.days - 1);
    expect(w.economies.France.research.done).toEqual([]);
    expect(w.economies.France.research.progress.ind1).toBeCloseTo(tech.days - 1, 6);
    w = step(w);
    expect(w.economies.France.research.done).toEqual(['ind1']);
    expect(w.economies.France.research.slots[0]).toBeNull();
  });

  it('is slower ahead of its time: speed = 1 / (1 + 0.5 x years ahead)', () => {
    const tech = techById('arm3')!; // 1940
    expect(researchSpeed(tech, 1936)).toBeCloseTo(1 / 3, 9);
    expect(researchSpeed(tech, 1939)).toBeCloseTo(1 / 1.5, 9);
    expect(researchSpeed(tech, 1940)).toBe(1);
    expect(researchSpeed(tech, 1944)).toBe(1);
    expect(yearAt('1936-01-01', 0)).toBe(1936);
    expect(yearAt('1936-01-01', 183)).toBeCloseTo(1936.5, 2);
  });

  it('predicts the finishing day, allowing for the team speeding up as the year comes closer', () => {
    // A 1938 technology started on 1 January 1936.
    const start = knowing(as('France'), 'France', 'inf1');
    const guess = daysToFinish(start.economies.France.research, techById('inf2')!, 1936);
    expect(guess).toBeGreaterThan(techById('inf2')!.days * 1.3);
    let w = give(start, { type: 'setResearch', country: 'France', slot: 0, tech: 'inf2' });
    let took = 0;
    while (!w.economies.France.research.done.includes('inf2') && took < 2000) {
      w = step(w);
      took++;
    }
    expect(Math.abs(took - guess)).toBeLessThanOrEqual(3);
  });

  it('takes a branch in order, and never puts one technology on two teams', () => {
    const w = as('France');
    expect(cannotResearch(w.economies.France.research, techById('inf2')!)).toMatch(/Light machine guns/);
    expect(give(w, { type: 'setResearch', country: 'France', slot: 0, tech: 'inf2' }).economies.France.research.slots).toEqual([null, null]);
    const both = give(w, { type: 'setResearch', country: 'France', slot: 0, tech: 'inf1' }, { type: 'setResearch', country: 'France', slot: 1, tech: 'inf1' });
    expect(both.economies.France.research.slots).toEqual([null, 'inf1']);
    // A minor power has no second team, and nonsense is ignored.
    const odd = give(w, { type: 'setResearch', country: 'Belgium', slot: 1, tech: 'inf1' }, { type: 'setResearch', country: 'France', slot: 0, tech: 'death-ray' }, { type: 'setResearch', country: 'France', slot: 7, tech: 'inf1' });
    expect(odd.economies.Belgium.research.slots).toEqual([null]);
    expect(odd.economies.France.research.slots).toEqual([null, null]);
  });

  it('keeps the work done when a team is moved to something else', () => {
    let w = give(as('France'), { type: 'setResearch', country: 'France', slot: 0, tech: 'ind1' });
    w = days(w, 50);
    w = give(w, { type: 'setResearch', country: 'France', slot: 0, tech: 'soc1' });
    w = days(w, 10);
    expect(w.economies.France.research.progress.ind1).toBeCloseTo(50, 6);
    expect(w.economies.France.research.progress.soc1).toBeCloseTo(10, 6);
  });

  it('changes the game: machine tools raise output, light machine guns help infantry defend', () => {
    const w = as('France');
    const tooled = knowing(w, 'France', 'ind1');
    expect(economyView(tooled, 'France').lineRate.infantry / economyView(w, 'France').lineRate.infantry).toBeCloseTo(1.1, 9);
    const armed = knowing(w, 'France', 'inf1', 'arm1');
    const edges = combatEdges(armed.economies);
    const paris = provinceByName('Paris').id;
    expect(edges.defence(unit('France', paris), paris)).toBeCloseTo(1.1, 9);
    expect(edges.attack(unit('France', paris))).toBe(1);
    expect(edges.attack(unit('France', paris, 'armour'))).toBeCloseTo(1.1, 9);
    expect(edges.defence(unit('Germany', paris), paris)).toBe(1);
    expect(defencePower(unit('France', paris), 1, 1.1)).toBeCloseTo(15 * 1.1, 9);
    expect(attackPower(unit('France', paris, 'armour'), paris, 1.1)).toBeCloseTo(22 * 1.1, 9);
  });

  it('shows in the outlook and wins battles that were even', () => {
    const plains = PROVINCES.find((p) => p.terrain === 'plains' && p.owner === 'Germany' && p.neighbours.some((n) => PROVINCES[n].owner === 'France'))!;
    const from = plains.neighbours.find((n) => PROVINCES[n].owner === 'France')!;
    const attackers = Array.from({ length: 8 }, (_, i) => ({ ...unit('France', from), id: i, path: [plains.id] }));
    const defenders = Array.from({ length: 8 }, (_, i) => ({ ...unit('Germany', plains.id), id: 20 + i }));
    const w = as('France');
    const plain = outlook(attackers, defenders, plains.id, combatEdges(w.economies))!;
    const better = outlook(attackers, defenders, plains.id, combatEdges(knowing(w, 'France', 'inf1', 'inf2').economies))!;
    expect(plain.attackerEdge).toBe(1);
    expect(better.attackerEdge).toBeCloseTo(1.1, 9);
    expect(better.attack / plain.attack).toBeCloseTo(1.1, 9);
    expect(better.defendersLast).toBeLessThan(plain.defendersLast);
  });
});

describe('the list of national plans', () => {
  it('has twelve plans open to all and two real programmes for each major power', () => {
    expect(PLANS.filter((p) => !p.country)).toHaveLength(12);
    for (const c of COUNTRIES) {
      const own = PLANS.filter((p) => p.country === c.name);
      expect(own.length, c.name).toBe(c.major ? 2 : 0);
      expect(plansFor(c.name).length, c.name).toBe(c.major ? 14 : 12);
    }
    for (const p of PLANS) {
      expect(p.days, p.name).toBeGreaterThanOrEqual(60);
      expect(p.days, p.name).toBeLessThanOrEqual(180);
      expect(describeEffects(p.effects).length + (p.grant ? 1 : 0), p.name).toBeGreaterThan(0);
      if (p.country) expect(p.history?.length ?? 0, p.name).toBeGreaterThan(60);
    }
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
  });
});

describe('national plans', () => {
  it('runs one plan at a time, costs a share of output each month, and pays out when it ends', () => {
    const w = as('United Kingdom');
    const plan = planById('shadow-factories')!;
    const london = provinceByName('London').id;
    const before = economyView(w, 'United Kingdom');
    let now = give(w, { type: 'startPlan', country: 'United Kingdom', plan: plan.id });
    const during = economyView(now, 'United Kingdom');
    expect(during.budget.plan).toBeCloseTo(plan.cost * during.nominalGDP, 6);
    expect(during.budget.balance).toBeCloseTo(before.budget.balance - during.budget.plan, 6);
    // A second plan has to wait.
    expect(give(now, { type: 'startPlan', country: 'United Kingdom', plan: 'industry' }).economies['United Kingdom'].plan.active).toBe(plan.id);
    now = days(now, plan.days - 1);
    expect(now.factories.mil[london]).toBe(w.factories.mil[london]);
    now = step(now);
    expect(now.factories.mil[london]).toBe(w.factories.mil[london] + 3);
    expect(now.economies['United Kingdom'].plan).toEqual({ active: null, daysDone: 0, done: [plan.id] });
    expect(economyView(now, 'United Kingdom').budget.plan).toBe(0);
    // Each plan can be carried out once.
    expect(give(now, { type: 'startPlan', country: 'United Kingdom', plan: plan.id }).economies['United Kingdom'].plan.active).toBeNull();
  });

  it('keeps real programmes to their country and their year, and the war economy to wartime', () => {
    const none = { active: null, daysDone: 0, done: [] };
    expect(cannotStartPlan(none, planById('maginot-extension')!, 'Germany', 1936, false)).toMatch(/only France/);
    expect(cannotStartPlan(none, planById('westwall')!, 'Germany', 1937.9, false)).toMatch(/1938/);
    expect(cannotStartPlan(none, planById('westwall')!, 'Germany', 1938, false)).toBeNull();
    expect(cannotStartPlan(none, planById('war-economy')!, 'France', 1936, false)).toMatch(/wartime/);
    expect(cannotStartPlan(none, planById('war-economy')!, 'France', 1936, true)).toBeNull();
    const w = as('Germany');
    expect(give(w, { type: 'startPlan', country: 'Germany', plan: 'maginot-extension' }).economies.Germany.plan.active).toBeNull();
    expect(give(w, { type: 'startPlan', country: 'Germany', plan: 'westwall' }).economies.Germany.plan.active).toBeNull();
    expect(give(w, { type: 'startPlan', country: 'Germany', plan: 'no-such-plan' }).economies.Germany.plan.active).toBeNull();
    expect(give(days(w, 366 * 2), { type: 'startPlan', country: 'Germany', plan: 'westwall' }).economies.Germany.plan.active).toBe('westwall');
  });

  it('loses the work done when a plan is cancelled', () => {
    let w = give(as('France'), { type: 'startPlan', country: 'France', plan: 'public-works' });
    w = days(w, 40);
    expect(w.economies.France.plan.daysDone).toBe(40);
    w = give(w, { type: 'cancelPlan', country: 'France' });
    expect(w.economies.France.plan).toEqual({ active: null, daysDone: 0, done: [] });
    w = give(w, { type: 'startPlan', country: 'France', plan: 'public-works' });
    expect(w.economies.France.plan.daysDone).toBe(0);
  });

  it('gives lasting effects: forts help only on home soil, public works steady the country', () => {
    const w = withEconomy(as('France'), 'France', { plan: { active: null, daysDone: 0, done: ['maginot-extension', 'forts', 'public-works'] } });
    expect(modsOf(w.economies.France).homeDefence).toBeCloseTo(0.3, 9);
    const edges = combatEdges(w.economies);
    const paris = provinceByName('Paris').id;
    const abroad = provinceByName('Rhineland').id;
    expect(edges.defence(unit('France', paris), paris)).toBeCloseTo(1.3, 9);
    expect(edges.defence(unit('France', abroad), abroad)).toBe(1);
    const plain = as('France');
    expect(economyView(w, 'France').stabilityTarget).toBeCloseTo(economyView(plain, 'France').stabilityTarget + 5, 6);
  });

  it('hands over equipment and money as well as factories', () => {
    let w = give(as('Poland'), { type: 'startPlan', country: 'Poland', plan: 'national-defence-fund' });
    const plan = planById('national-defence-fund')!;
    w = days(w, plan.days - 1);
    const before = w.economies.Poland.treasury;
    const after = step(w);
    expect(after.economies.Poland.treasury - before).toBeGreaterThan(0.4 * economyView(w, 'Poland').nominalGDP);
    expect(modsOf(after.economies.Poland).warSupport).toBe(5);

    let f = give(as('France'), { type: 'startPlan', country: 'France', plan: 'reserve' });
    const stock = f.economies.France.stock.infantry;
    const made = economyView(f, 'France').lineRate.infantry * planById('reserve')!.days;
    f = days(f, planById('reserve')!.days);
    expect(f.economies.France.stock.infantry - stock - made).toBeGreaterThan(1.8);
  });
});

describe('war support', () => {
  it('starts where each kind of government rests in peacetime', () => {
    const w = as('France');
    for (const c of COUNTRIES) {
      expect(w.economies[c.name].warSupport, c.name).toBe(WAR_SUPPORT_BASE[c.government]);
      const v = economyView(w, c.name);
      expect(v.warSupportTarget, c.name).toBe(WAR_SUPPORT_BASE[c.government]);
      expect(v.warSupportReasons.reduce((a, r) => a + r.points, 0), c.name).toBeCloseTo(v.warSupportTarget, 9);
    }
  });

  it('rallies a country that is attacked, and not one that attacks', () => {
    const w = give(as('France'), { type: 'declareWar', by: 'Germany', on: 'France' });
    expect(w.declaredBy).toEqual({ 'France|Germany': 'Germany' });
    // The news of the attack is worth ten points on the day.
    expect(w.economies.France.warSupport).toBe(45);
    const fr = economyView(w, 'France');
    const de = economyView(w, 'Germany');
    expect(fr.attacked).toBe(true);
    expect(de.attacked).toBe(false);
    expect(fr.warSupportReasons.find((r) => /attacked/.test(r.text))?.points).toBe(30);
    expect(fr.warSupportTarget).toBe(65);
    expect(de.warSupportTarget).toBe(55);
    // A democracy that starts a war loses support for it.
    const aggressor = give(as('France'), { type: 'declareWar', by: 'France', on: 'Ireland' });
    expect(economyView(aggressor, 'France').warSupportTarget).toBe(25);
    // Peace forgets who started it.
    expect(give(w, { type: 'makePeace', a: 'France', b: 'Germany' }).declaredBy).toEqual({});
  });

  it('makes neutral countries uneasy about a war next door', () => {
    const w = give(as('France'), { type: 'declareWar', by: 'Germany', on: 'Poland' });
    const belgium = economyView(w, 'Belgium'); // borders Germany
    const spain = economyView(w, 'Spain'); // borders neither
    // An attack on a great power raises world tension by 20, worth 4 points of war support everywhere.
    expect(w.diplomacy.tension).toBe(20);
    expect(belgium.warSupportTarget).toBe(WAR_SUPPORT_BASE.democracy + 4 + 8 + 4);
    expect(spain.warSupportTarget).toBe(WAR_SUPPORT_BASE.democracy + 4 + 4);
  });

  it('charges stability for declaring a war people do not want, most of all in a democracy', () => {
    const w = as('France');
    const fr = give(w, { type: 'declareWar', by: 'France', on: 'Ireland' });
    // France has no cause for war against Ireland, so the cost is doubled.
    expect(fr.economies.France.stability).toBeCloseTo(w.economies.France.stability - 2 * 0.4 * (50 - 35), 9);
    const de = give(w, { type: 'declareWar', by: 'Germany', on: 'Ireland' });
    expect(de.economies.Germany.stability).toBe(w.economies.Germany.stability);
    const keen = give(withEconomy(w, 'France', { warSupport: 60 }), { type: 'declareWar', by: 'France', on: 'Ireland' });
    expect(keen.economies.France.stability).toBe(w.economies.France.stability);
  });

  it('decides how far conscription can go', () => {
    const w = as('France');
    expect(conscriptionBlocked(w.economies.France, 'France', 2)).toBeNull();
    expect(conscriptionBlocked(w.economies.France, 'France', 3)).toMatch(/55/);
    expect(give(w, { type: 'setConscription', country: 'France', level: 3 }).economies.France.conscription).toBe(1);
    // A dictatorship asks less of public opinion.
    expect(conscriptionBlocked(w.economies.Germany, 'Germany', 3)).toBeNull();
    expect(conscriptionBlocked(w.economies.Germany, 'Germany', 4)).toBeNull();
    expect(conscriptionBlocked({ ...w.economies.Germany, warSupport: 40 }, 'Germany', 4)).toMatch(/55/);
    // Narrowing the law is always allowed.
    expect(conscriptionBlocked({ ...w.economies.France, conscription: 4, warSupport: 0 }, 'France', 1)).toBeNull();
  });

  it('lets a country at war that believes in it bear higher taxes and buy more bonds', () => {
    const peace = give(as('France'), { type: 'setTax', country: 'France', rate: 0.4 });
    expect(economyView(peace, 'France').taxThreshold).toBe(0.25);
    const war = withEconomy(give(peace, { type: 'declareWar', by: 'Germany', on: 'France' }), 'France', { warSupport: 80 });
    const v = economyView(war, 'France');
    expect(v.taxThreshold).toBeCloseTo(0.25 + 0.15 * 0.8, 9);
    const taxPain = (x: ReturnType<typeof economyView>) => x.stabilityReasons.find((r) => /^taxes above/.test(r.text))?.points ?? 0;
    expect(taxPain(v)).toBeGreaterThan(taxPain(economyView(peace, 'France')));
    expect(v.patriotism).toBeCloseTo(0.7 + 0.6 * 0.8, 9);
    expect(v.stabilityReasons.some((r) => /united/.test(r.text) && r.points === 5)).toBe(true);
    const sullen = economyView(withEconomy(war, 'France', { warSupport: 20 }), 'France');
    expect(sullen.patriotism).toBeLessThan(1);
    expect(sullen.stabilityReasons.find((r) => /do not want this war/.test(r.text))?.points).toBe(-10);
    expect(sullen.morale).toBeCloseTo(0.85, 9);
    expect(moraleOf(20, false)).toBe(1);
  });

  it('follows the news from the front and wears down in a long war', () => {
    const w = as('France');
    const e = w.economies;
    const copy = { France: { ...e.France }, Germany: { ...e.Germany } };
    for (let i = 0; i < 10; i++) onBattleEnded(copy, ['France'], ['Germany']);
    expect(copy.France.mood).toBe(15);
    expect(copy.Germany.mood).toBe(-15);
    const cheered = economyView({ ...w, economies: { ...e, ...copy } }, 'France');
    expect(cheered.warSupportTarget).toBe(WAR_SUPPORT_BASE.democracy + 15);

    // Two years of a war nobody fights: weariness builds half a point a month.
    let war = give(w, { type: 'declareWar', by: 'Germany', on: 'Ireland' });
    war = days(war, 731); // to 1 January 1938: 24 months
    expect(war.economies.Germany.weariness).toBeCloseTo(12, 6);
    expect(war.economies.Ireland.weariness).toBeCloseTo(12, 6);
    expect(war.economies.France.weariness).toBe(0);
    expect(economyView(war, 'Germany').warSupportReasons.find((r) => /weariness/.test(r.text))?.points).toBeCloseTo(-12, 6);
    // A real war moves the mood on both sides.
    const fought = runWar('Germany', 'Belgium', 'mood', 120).world;
    expect(fought.economies.Germany.mood).not.toBe(0);
  });

  it('slows the recovery of an army whose country does not want the war', () => {
    const base = give(as('France'), { type: 'declareWar', by: 'France', on: 'Ireland' });
    const tire = (w: World): World => ({ ...w, units: w.units.map((u) => (u.owner === 'France' ? { ...u, organisation: 50 } : u)) });
    const org = (w: World) => w.units.find((u) => u.owner === 'France' && u.supply === 1)!.organisation;
    const willing = step(tire(withEconomy(base, 'France', { warSupport: 60 })));
    const unwilling = step(tire(withEconomy(base, 'France', { warSupport: 0 })));
    expect(org(willing)).toBe(53);
    expect(org(unwilling)).toBeCloseTo(50 + 3 * 0.7, 9);
  });

  it('brings the government down after three months of crisis', () => {
    // Taxes at 60% and empty shops: stability collapses.
    let w = give(as('France'), { type: 'setTax', country: 'France', rate: 0.6 }, { type: 'startPlan', country: 'France', plan: 'public-works' });
    w = withEconomy(w, 'France', { stability: 5, inflation: 80, expected: 80 });
    let fell = -1;
    for (let d = 0; d < 200 && fell < 0; d++) {
      w = step(w);
      if (w.economies.France.governmentsFallen) fell = d;
    }
    expect(fell).toBeGreaterThan(30 * (CRISIS_MONTHS - 1));
    expect(fell).toBeLessThan(31 * CRISIS_MONTHS + 1);
    expect(w.economies.France.stability).toBe(45);
    expect(w.economies.France.plan.active).toBeNull();
    expect(w.economies.France.crisisMonths).toBe(0);
  });
});

describe('four years of peace with research and plans (bot playtest)', () => {
  let w = quiet(newWorld('freeForAll', 'stage-e-peace'));
  for (let d = 0; d < 365 * 4; d++) w = advance(w);

  it('every country researches and plans, and nobody falls apart', () => {
    for (const c of COUNTRIES) {
      const e = w.economies[c.name];
      expect(e.research.done.length, c.name).toBeGreaterThanOrEqual(c.major ? 8 : 4);
      expect(e.research.done.length, c.name).toBeLessThanOrEqual(c.major ? 11 : 6);
      expect(e.governmentsFallen, c.name).toBe(0);
      expect(e.warSupport, c.name).toBeGreaterThanOrEqual(20);
      expect(e.warSupport, c.name).toBeLessThanOrEqual(100);
      if (c.major) expect(e.plan.done.length, c.name).toBeGreaterThanOrEqual(4);
    }
    // The real programmes get carried out.
    expect(w.economies.Germany.plan.done).toContain('four-year-plan');
    expect(w.economies.Poland.plan.done).toContain('central-industrial-region');
  });

  it('gives the same world from the same seed, and survives being saved and loaded', () => {
    let a = newWorld('freeForAll', 'twice');
    let b = newWorld('freeForAll', 'twice');
    for (let d = 0; d < 400; d++) {
      a = advance(a);
      b = advance(d === 200 ? (JSON.parse(JSON.stringify(b)) as World) : b);
    }
    expect(b).toEqual(a);
    expect(a.economies.Germany.research.done.length).toBeGreaterThan(0);
  });
});
