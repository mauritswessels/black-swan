/**
 * Research: six branches of four technologies each, 24 in all.
 *
 * A country works on one technology per research team: the six major powers have two teams,
 * everyone else has one. Inside a branch the technologies come in order. Every technology has
 * the year it really appeared; working on it before then is slower:
 *
 *   speed = 1 / (1 + 0.5 x years ahead of its time)
 *
 * so a 1940 technology started in January 1938 goes at half speed at first and speeds up as
 * 1940 comes closer. Progress is kept if a team is moved to something else.
 */
import { countryByName } from './countries';
import type { Effects } from './mods';
import type { ResearchState } from './types';

export type Branch = 'infantry' | 'armour' | 'navy' | 'air' | 'industry' | 'society';

export interface Tech {
  id: string;
  name: string;
  branch: Branch;
  /** 1 to 4: its place in the branch. */
  tier: number;
  /** The year it really came into use. */
  year: number;
  /** Days of work for one team, when it is not ahead of its time. */
  days: number;
  effects: Effects;
  /** What it is, in a sentence. */
  what: string;
  /** What really happened. */
  history: string;
}

export const BRANCHES: { id: Branch; name: string; note: string }[] = [
  { id: 'infantry', name: 'Infantry', note: 'Most of every army. Better weapons and transport for the foot soldier.' },
  { id: 'armour', name: 'Armour and artillery', note: 'Tanks to break through and guns to break up dug-in defenders.' },
  { id: 'navy', name: 'Navy', note: 'Control of the sea: convoys, submarines and landings.' },
  { id: 'air', name: 'Air', note: 'Control of the sky: fighters, bombers and radar.' },
  { id: 'industry', name: 'Industry', note: 'More equipment from the same factories.' },
  { id: 'society', name: 'Economy and society', note: 'Better ways to pay for a war and to run the home front.' },
];
/** Days of work by tier, and how much slower a team is for each year a technology is ahead of its time. */
export const TECH_DAYS = [135, 185, 240, 295];
export const AHEAD_PENALTY = 0.5;

const t = (id: string, branch: Branch, tier: number, year: number, name: string, effects: Effects, what: string, history: string): Tech => ({ id, name, branch, tier, year, days: TECH_DAYS[tier - 1], effects, what, history });

export const TECHS: Tech[] = [
  t('inf1', 'infantry', 1, 1936, 'Light machine guns', { defenceInfantry: 0.1 }, 'A machine gun light enough for every squad to carry, so that a few men can hold a wide front.',
    'Britain chose the Bren gun in 1935, and the German MG 34 reached the troops in 1936. Both stayed in service to the end of the war.'),
  t('inf2', 'infantry', 2, 1938, 'Mortars and anti-tank guns', { attackInfantry: 0.1 }, 'Infantry battalions get their own small mortars and guns, and no longer wait for the artillery.',
    'By 1939 most armies had given each battalion mortars and light anti-tank guns. Many of the anti-tank guns were already too weak for the tanks of 1941.'),
  t('inf3', 'infantry', 3, 1940, 'Motorised supply columns', { orgRecovery: 0.2 }, 'Lorries instead of horses bring up food and ammunition, so tired divisions recover sooner.',
    'The British army went to war fully motorised. Most German and Soviet infantry divisions still relied on horses throughout the war.'),
  t('inf4', 'infantry', 4, 1942, 'Submachine guns and assault tactics', { attackInfantry: 0.1, defenceInfantry: 0.1 }, 'Cheap automatic weapons for close fighting, and squads trained to use them.',
    'The Soviet PPSh-41 and the British Sten, both first made in 1941, were built in millions because they were simple enough for any workshop to make.'),

  t('arm1', 'armour', 1, 1936, 'Fast light tanks', { attackArmour: 0.1 }, 'Light, quick tanks that can get behind a defence once it is broken.',
    'The Soviet BT tanks and the German Panzer I and II of the mid-1930s were fast and thinly armoured. They taught their armies how to use tanks in large formations.'),
  t('arm2', 'armour', 2, 1938, 'Modern field howitzers', { attackArtillery: 0.1 }, 'Guns that lob heavier shells further, and can be towed by lorries.',
    'The Soviet M-30 122 mm howitzer appeared in 1938 and the British 25-pounder in 1940. Artillery caused more casualties in the war than any other weapon.'),
  t('arm3', 'armour', 3, 1940, 'Medium tanks', { attackArmour: 0.15, defenceArmour: 0.1 }, 'A tank with a real gun and armour that can fight other tanks, not only support infantry.',
    'The German Panzer IV, the Soviet T-34 (in production from 1940) and the American Sherman (1942) were the main tanks of the war.'),
  t('arm4', 'armour', 4, 1942, 'Radio fire control', { attackArtillery: 0.15, defenceArtillery: 0.1 }, 'Observers with radios bring the fire of many batteries onto one target within minutes.',
    'By 1942 and 1943 British and American gunners could mass the fire of dozens of batteries on a single map square at a few minutes notice.'),

  t('nav1', 'navy', 1, 1936, 'Sonar', { antiSub: 0.2 }, 'A sound pulse that echoes off a submerged submarine, so an escort can find it.',
    'The Royal Navy had fitted most of its destroyers with ASDIC, its name for sonar, by 1939. It worked, but not well enough on its own: submarines learned to attack on the surface at night.'),
  t('nav2', 'navy', 2, 1938, 'Ocean-going submarines', { subRaiding: 0.25 }, 'Submarines with the range to hunt merchant ships far out in the ocean, working in groups.',
    'The German Type VII, in service from 1936, sank more ships than any other submarine. From 1940 U-boats hunted in "wolf packs" directed by radio.'),
  t('nav3', 'navy', 3, 1940, 'Naval radar and fire control', { navalPower: 0.15, antiSub: 0.15 }, 'Radar finds ships at night and in fog, and aims the guns.',
    'In March 1941 British battleships used radar to surprise an Italian squadron at night off Cape Matapan and sank three cruisers. Radar on escorts and aircraft later turned the battle against the U-boats.'),
  t('nav4', 'navy', 4, 1942, 'Landing craft', { amphibious: 0.2, landingPrep: -0.3 }, 'Flat-bottomed boats that put men and tanks straight onto a beach.',
    'The landings in North Africa (1942), Sicily (1943) and Normandy (1944) depended on thousands of landing craft. The shortage of them set the timetable for the Allies more than once.'),

  t('air1', 'air', 1, 1936, 'Monoplane fighters', { fighterPower: 0.15 }, 'All-metal fighters with one wing, an enclosed cockpit and wheels that fold away.',
    'The Hurricane first flew in November 1935, the Bf 109 in May 1935 and the Spitfire in March 1936. Within four years the biplane fighter was obsolete.'),
  t('air2', 'air', 2, 1938, 'Fast medium bombers', { bomberPower: 0.15 }, 'Twin-engined bombers fast enough to support an advancing army.',
    'The German He 111 and Ju 88 and the Soviet SB were built for this. Germany never built a heavy bomber force; Britain and the United States did.'),
  t('air3', 'air', 3, 1940, 'Radar early warning', { airDefence: 0.3 }, 'A chain of radar stations sees raiders coming, so fighters can be sent up to meet them.',
    'The British Chain Home stations were working by 1939. In the Battle of Britain in 1940 they let a smaller fighter force be in the right place at the right time.'),
  t('air4', 'air', 4, 1942, 'Long-range aircraft', { airRange: 0.4, bomberPower: 0.1 }, 'Four-engined bombers, and escort fighters with drop tanks to go with them.',
    'The Lancaster flew its first raids in 1942. Bomber losses over Germany stayed heavy until long-range Mustang escorts arrived in early 1944.'),

  t('ind1', 'industry', 1, 1936, 'Machine tools', { lineOutput: 0.1 }, 'Better lathes, presses and gauges, so that parts fit without hand finishing.',
    'Machine tools were a bottleneck for every country that rearmed. Britain and France bought thousands from the United States in 1938 to 1940.'),
  t('ind2', 'industry', 2, 1938, 'Flow production', { lineGain: 0.5 }, 'Work moves along a line from one station to the next. New lines reach full speed sooner.',
    'Car makers brought the moving assembly line to weapons. American factories used it most fully: the Willow Run plant was built to turn out a heavy bomber every hour.'),
  t('ind3', 'industry', 3, 1940, 'Standardised construction', { buildSpeed: 0.2 }, 'Factories built from standard steel frames and ready-made parts go up faster.',
    'Wartime factories were often built in months from standard designs. Soviet plants moved east in 1941 were running again within weeks, some before they had roofs.'),
  t('ind4', 'industry', 4, 1942, 'Synthetic fuel and rubber', { resourceNeed: -0.2 }, 'Fuel made from coal and rubber made from chemicals replace some of what must be imported.',
    'Germany made much of its fuel from coal. The United States, cut off from Asian rubber in 1942, built a synthetic rubber industry in two years.'),

  t('soc1', 'society', 1, 1936, 'National income accounts', { taxRevenue: 0.04 }, 'The government measures what the whole economy produces, so the treasury knows what there is to tax.',
    'Simon Kuznets made the first official estimates of American national income in 1934. Britain published its first in 1941, by James Meade and Richard Stone at the urging of Keynes. This is where GDP comes from.'),
  t('soc2', 'society', 2, 1938, 'Savings campaigns', { bondAppetite: 0.25 }, 'Posters, savings stamps and street collections persuade ordinary people to lend to the state.',
    'Britain began its War Savings Campaign in November 1939, and the United States sold war bonds to tens of millions of people from 1941. Money lent to the state was also money not spent in the shops.'),
  t('soc3', 'society', 3, 1940, 'Ration books and price offices', { rationingCost: -0.5 }, 'A proper system of coupons and inspectors makes rationing fairer and leaves less for the black market.',
    'Britain began food rationing in January 1940. People largely accepted it because it was seen to be fair: everyone had the same book.'),
  t('soc4', 'society', 4, 1942, 'Women in the war industries', { conscriptionDrag: -0.5 }, 'Women take over factory jobs from the men who are called up.',
    'Britain conscripted women for war work from December 1941. In the Soviet Union women were more than half of the industrial workforce by 1943.'),
];

const BY_ID = new Map(TECHS.map((x) => [x.id, x]));
export const techById = (id: string): Tech | undefined => BY_ID.get(id);

/** Research teams a country has. */
export const researchSlots = (country: string): number => (countryByName(country).major ? 2 : 1);

export const emptyResearch = (slots: number): ResearchState => ({ slots: new Array<string | null>(slots).fill(null), progress: {}, done: [] });

/** The date as a year with a fraction, e.g. 1938.5 for the start of July 1938. */
export function yearAt(startDate: string, day: number): number {
  const d = new Date(`${startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day);
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  return y + (d.getTime() - start) / (Date.UTC(y + 1, 0, 1) - start);
}

/** How fast a team works on this technology today: 1 when its time has come, less before. */
export const researchSpeed = (tech: Tech, year: number): number => 1 / (1 + AHEAD_PENALTY * Math.max(0, tech.year - year));

/** Why this technology cannot be started, or null if it can. */
export function cannotResearch(r: ResearchState, tech: Tech): string | null {
  if (r.done.includes(tech.id)) return 'already known';
  const before = TECHS.find((x) => x.branch === tech.branch && x.tier === tech.tier - 1);
  if (before && !r.done.includes(before.id)) return `needs ${before.name} first`;
  return null;
}

/**
 * Days until a team working on this technology finishes, starting from the given date. It
 * allows for the team speeding up as the technology's year comes closer.
 */
export function daysToFinish(r: ResearchState, tech: Tech, year: number): number {
  let left = tech.days - (r.progress[tech.id] ?? 0);
  let days = 0;
  // Day by day while it is ahead of its time, then the rest at full speed.
  while (left > 0 && year < tech.year && days < 20000) {
    left -= researchSpeed(tech, year);
    days++;
    year += 1 / 365.25;
  }
  return days + Math.ceil(Math.max(0, left));
}

/** One day of research. Returns the ids of the technologies finished today. */
export function runResearch(r: ResearchState, year: number): string[] {
  const finished: string[] = [];
  r.slots.forEach((id, i) => {
    const tech = id ? BY_ID.get(id) : undefined;
    if (!tech || cannotResearch(r, tech)) {
      if (id) r.slots[i] = null;
      return;
    }
    const now = (r.progress[tech.id] ?? 0) + researchSpeed(tech, year);
    if (now >= tech.days) {
      r.done.push(tech.id);
      delete r.progress[tech.id];
      r.slots[i] = null;
      finished.push(tech.id);
    } else r.progress[tech.id] = now;
  });
  return finished;
}
