/**
 * National plans: one long programme at a time, chosen from a short list.
 *
 * A plan runs for 60 to 180 days and costs a share of the country's output every month while
 * it runs (a line in the budget). When it finishes it gives its reward: new factories, a
 * lasting effect, or both. Each plan can be done once. Twelve are open to every country; the
 * six major powers also have two real programmes of the 1930s each.
 *
 * Only one plan runs at a time, so the real price of a plan is the other plans you are not
 * running meanwhile: opportunity cost.
 */
import type { Effects } from './mods';
import type { PlanState, UnitType } from './types';

/** What a plan hands over on the day it finishes. */
export interface Grant {
  /** New factories, built in the capital. */
  mil?: number;
  civ?: number;
  /** Finished equipment, in division-sets. */
  stock?: Partial<Record<UnitType, number>>;
  /** Money for the treasury, in months of the country's output. */
  treasury?: number;
  /** A one-off change to stability. */
  stability?: number;
}

export interface Plan {
  id: string;
  name: string;
  /** Only this country can run it; open to all when missing. */
  country?: string;
  days: number;
  /** Share of a month's output it costs each month while it runs. */
  cost: number;
  /** The first year it can be started. */
  fromYear?: number;
  /** Can only be started while at war. */
  needsWar?: boolean;
  effects?: Effects;
  grant?: Grant;
  what: string;
  /** For the real programmes: what happened. */
  history?: string;
}

export const PLANS: Plan[] = [
  // Open to everyone.
  { id: 'rearmament', name: 'Rearmament programme', days: 180, cost: 0.04, grant: { mil: 2 }, what: 'State orders and loans to the arms makers. Two new military factories in the capital.' },
  { id: 'industry', name: 'Industrial expansion', days: 180, cost: 0.04, grant: { civ: 2 }, what: 'Power stations, steelworks and machine shops. Two new civilian factories in the capital.' },
  { id: 'forts', name: 'Border fortifications', days: 180, cost: 0.03, effects: { homeDefence: 0.1 }, what: 'Bunkers, tank traps and prepared positions. Your divisions defend better anywhere on home soil.' },
  { id: 'export-drive', name: 'Export drive', days: 120, cost: 0.01, effects: { exportShare: 0.25 }, what: 'Trade offices and credit for exporters. Steel and oil you do not use sell for 75% of the world price instead of 50%.' },
  { id: 'staff', name: 'Army staff reform', days: 150, cost: 0.015, effects: { orgRecovery: 0.15, newDivisionOrg: 20 }, what: 'A staff college, exercises and a proper reserve of officers. Divisions recover faster and new ones arrive better prepared.' },
  { id: 'civil-defence', name: 'Civil defence', days: 120, cost: 0.02, effects: { warSupport: 8 }, what: 'Shelters, gas masks and drills. People who have prepared for a war are readier to face one.' },
  { id: 'public-works', name: 'Public works', days: 180, cost: 0.03, effects: { stability: 5 }, what: 'Roads, housing and jobs for the unemployed. A country that looks after its people holds together better.' },
  { id: 'tax-reform', name: 'Tax reform', days: 120, cost: 0.01, effects: { taxThreshold: 0.03 }, what: 'Taxes taken from wages as they are paid, with fewer loopholes. People accept three more points of tax before stability falls.' },
  { id: 'reserve', name: 'Equipment reserve', days: 90, cost: 0.03, grant: { stock: { infantry: 2, artillery: 1 } }, what: 'Buy rifles and guns for the depots now. Equipment for two infantry divisions and one artillery division.' },
  { id: 'training', name: 'Reserve training', days: 150, cost: 0.015, effects: { manpower: 0.1 }, what: 'Yearly training for men who have left the army. A tenth more men can be called up under any conscription law.' },
  { id: 'sound-money', name: 'Sound money pledge', days: 120, cost: 0, effects: { realRate: -1, bondAppetite: 0.15 }, what: 'The government promises lenders, in law, to keep the budget and the currency in order. It costs nothing except the time you could have spent on another plan.' },
  { id: 'war-economy', name: 'War economy', days: 60, cost: 0.01, needsWar: true, effects: { goodsNeed: -0.12, lineOutput: 0.05 }, what: 'Factories, labour and materials are directed by the state. People accept fewer goods in the shops while the fighting lasts.' },

  // Real programmes of the 1930s.
  { id: 'shadow-factories', name: 'Shadow factories', country: 'United Kingdom', days: 180, cost: 0.04, grant: { mil: 3 }, what: 'The state pays car makers to build and run arms factories. Three new military factories.',
    history: 'From 1936 the British government paid firms such as Austin, Rover and Standard to build "shadow" factories for aircraft engines next to their car plants. They gave Britain spare capacity before the war began.' },
  { id: 'ministry-of-supply', name: 'Ministry of Supply', country: 'United Kingdom', days: 90, cost: 0.01, fromYear: 1939, effects: { lineOutput: 0.08 }, what: 'One ministry buys everything the army needs and shares out materials between the factories.',
    history: 'Britain set up the Ministry of Supply in the summer of 1939, after years of argument that it would disturb normal trade.' },
  { id: 'maginot-extension', name: 'Extend the Maginot Line', country: 'France', days: 180, cost: 0.06, effects: { homeDefence: 0.2 }, what: 'Carry the forts on from the German border along the Belgian one, to the sea.',
    history: 'The real Maginot Line, built from 1930, stopped where the Belgian border began. Extending it to the sea was judged too expensive and an insult to Belgium, then an ally. In May 1940 the German attack came through the gap, by way of the Ardennes.' },
  { id: 'arms-nationalisation', name: 'Nationalise the arms industry', country: 'France', days: 120, cost: 0.02, grant: { mil: 2, stability: -4 }, what: 'The state takes over the main arms and aircraft makers and re-equips them. Two new military factories, and an angry argument at home.',
    history: 'The Popular Front government nationalised much of the French arms and aircraft industry by a law of August 1936. Production fell at first while the firms were reorganised, and rose strongly from 1938.' },
  { id: 'four-year-plan', name: 'Four Year Plan', country: 'Germany', days: 180, cost: 0.06, effects: { resourceNeed: -0.2 }, grant: { mil: 2 }, what: 'Make the country able to fight without imports: fuel from coal, artificial rubber, low-grade ore. Two new military factories.',
    history: 'Announced in 1936 to make Germany ready for war within four years. It cost a great deal and fell short: in 1939 Germany still imported most of its oil and iron ore. The plan was part of a rearmament that the regime intended for wars of conquest.' },
  { id: 'westwall', name: 'Westwall', country: 'Germany', days: 150, cost: 0.05, fromYear: 1938, effects: { homeDefence: 0.15 }, what: 'A belt of bunkers and tank obstacles along the western border.',
    history: 'Built in a hurry from 1938 opposite the Maginot Line, and more than 600 kilometres long. Propaganda made it sound stronger than it was. It let Germany leave few troops in the west while it attacked Poland.' },
  { id: 'autarky', name: 'Autarky campaign', country: 'Italy', days: 150, cost: 0.03, effects: { resourceNeed: -0.12 }, what: 'Substitutes and home production in place of imported materials.',
    history: 'After the League of Nations put sanctions on Italy for invading Ethiopia in 1935, the regime made self-sufficiency its policy. Italy still depended on imported coal and oil when it entered the war.' },
  { id: 'alpine-wall', name: 'Alpine Wall', country: 'Italy', days: 150, cost: 0.04, effects: { homeDefence: 0.12 }, what: 'Forts in the mountain passes of the northern border.',
    history: 'The Vallo Alpino was begun in 1931 along the whole of Italy\'s alpine border and was never finished.' },
  { id: 'third-five-year-plan', name: 'Third Five-Year Plan', country: 'Soviet Union', days: 180, cost: 0.06, fromYear: 1938, grant: { mil: 3, civ: 2 }, what: 'Arms works and heavy industry, much of it far from the western border. Three military and two civilian factories.',
    history: 'The plan ran from 1938 and was cut short by the German invasion of 1941. More and more of it went to arms, and to new plants in the Urals and Siberia. Soviet industry of these years was built at a terrible human cost, including forced labour.' },
  { id: 'military-duty-law', name: 'Universal military duty', country: 'Soviet Union', days: 60, cost: 0.01, fromYear: 1939, effects: { manpower: 0.15 }, what: 'A lower call-up age and longer service put far more men within the army\'s reach.',
    history: 'The Law on Universal Military Duty of September 1939 lowered the call-up age to 19. The Red Army more than doubled in size by the summer of 1941.' },
  { id: 'central-industrial-region', name: 'Central Industrial Region', country: 'Poland', days: 180, cost: 0.05, grant: { mil: 2, civ: 1 }, what: 'A new industrial district in the middle of the country, as far as possible from both borders. Two military factories and one civilian one.',
    history: 'Poland built the Centralny Okręg Przemysłowy between 1936 and 1939 under the finance minister Eugeniusz Kwiatkowski, with a new steelworks and town at Stalowa Wola. It was not finished when the war came.' },
  { id: 'national-defence-fund', name: 'National Defence Fund', country: 'Poland', days: 60, cost: 0, grant: { treasury: 0.5 }, effects: { warSupport: 5 }, what: 'Ask the public to give and lend for the army. Money for the treasury, and a country that feels the army is its own.',
    history: 'The Fundusz Obrony Narodowej was set up in 1936. People gave money, jewellery and even wedding rings, and schools and villages paid for machine guns and aircraft.' },
];

/** What a plan hands over, as lines of plain text. */
export function describeGrant(g: Grant | undefined): string[] {
  if (!g) return [];
  const n = (count: number, word: string) => `${count} new ${word} ${count === 1 ? 'factory' : 'factories'} in the capital`;
  const out: string[] = [];
  if (g.mil) out.push(n(g.mil, 'military'));
  if (g.civ) out.push(n(g.civ, 'civilian'));
  for (const k of ['infantry', 'armour', 'artillery'] as const) if (g.stock?.[k]) out.push(`Equipment for ${g.stock[k]} ${k} ${g.stock[k] === 1 ? 'division' : 'divisions'}`);
  if (g.treasury) out.push(`Money for the treasury: ${g.treasury === 0.5 ? 'half a month' : `${g.treasury} months`} of output`);
  if (g.stability) out.push(`Stability ${g.stability > 0 ? '+' : '-'}${Math.abs(g.stability)} on the day (it recovers)`);
  return out;
}

const BY_ID = new Map(PLANS.map((p) => [p.id, p]));
export const planById = (id: string): Plan | undefined => BY_ID.get(id);

export const emptyPlan = (): PlanState => ({ active: null, daysDone: 0, done: [] });

/** The plans a country could ever run: its own real programmes first, then the general ones. */
export const plansFor = (country: string): Plan[] => [...PLANS.filter((p) => p.country === country), ...PLANS.filter((p) => !p.country)];

/** Why this country cannot start this plan today, or null if it can. */
export function cannotStartPlan(state: PlanState, plan: Plan, country: string, year: number, atWar: boolean): string | null {
  if (plan.country && plan.country !== country) return `only ${plan.country} can run it`;
  if (state.done.includes(plan.id)) return 'already carried out';
  if (state.active === plan.id) return 'under way';
  if (state.active) return `${planById(state.active)?.name ?? 'another plan'} is still under way`;
  if (plan.fromYear && year < plan.fromYear) return `not before ${plan.fromYear}`;
  if (plan.needsWar && !atWar) return 'only in wartime';
  return null;
}
