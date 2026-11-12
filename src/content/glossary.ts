/**
 * The codex: plain-English definitions of the terms used in the game.
 * `ap` marks terms that appear in AP Macroeconomics.
 * This is the starter set for the war game; every stage adds the terms it introduces.
 */

export interface Term {
  id: string;
  term: string;
  definition: string;
  /** Why it matters in the game, or a real-world note. */
  why: string;
  ap?: boolean;
}

export const GLOSSARY: Term[] = [
  { id: 'province', term: 'Province', definition: 'One piece of the map. Each has an owner, a type of terrain, roads, factories and a number of victory points.', why: 'Armies move and fight province by province.' },
  { id: 'division', term: 'Division', definition: 'The basic army unit, roughly 10,000 to 15,000 soldiers with their equipment.', why: 'You build, move and fight with divisions, grouped into armies.' },
  { id: 'strength', term: 'Strength', definition: 'How many of a division’s soldiers and weapons are still there, from 0 to 100%.', why: 'A division at half strength does about half the damage.' },
  { id: 'organisation', term: 'Organisation', definition: 'How ready a division is to keep fighting, from 0 to 100%. It falls in battle and recovers at rest.', why: 'A division at zero organisation must retreat, even if most of its soldiers are unhurt.' },
  { id: 'supply', term: 'Supply', definition: 'The food, fuel and ammunition an army needs every day, carried along roads and railways from home.', why: 'Divisions without supply lose organisation, then strength. Many real campaigns failed for this reason.' },
  { id: 'encirclement', term: 'Encirclement', definition: 'Surrounding enemy divisions so they cannot retreat or receive supply.', why: 'Surrounded divisions that lose a battle surrender completely, so encirclement is the strongest move in the game.' },
  { id: 'dig-in', term: 'Digging in', definition: 'Preparing trenches, gun positions and cover. A division that stands still gains 2% defence a day, up to 20%.', why: 'Attacking troops who have had time to dig in costs far more. Artillery is the answer: each artillery division in the attack removes a quarter of the bonus.' },
  { id: 'front-width', term: 'Front width', definition: 'How many divisions can fight in one battle at once: 8 on each side, plus 4 more attackers for each extra direction the attack comes from. The rest wait in reserve.', why: 'It is why attacking from two or three sides works, and why a huge army cannot simply swamp a narrow pass.' },
  { id: 'depot', term: 'Depot', definition: 'A place your supplies start from: your capital, or the biggest city of each separate piece of your territory.', why: 'A division needs an unbroken path of your own land back to a depot. Lose the path and it is cut off.' },
  { id: 'attrition', term: 'Attrition', definition: 'Losing fighting power without a battle, from hunger, cold, disease and breakdowns.', why: 'A division with too little supply cannot keep its organisation up, and one that is cut off starts losing soldiers.' },
  { id: 'retreat', term: 'Retreat', definition: 'Falling back to a neighbouring province of your own after losing a battle.', why: 'A retreating division lives to fight again once it has rested. If there is nowhere to go, it surrenders.' },
  { id: 'capitulation', term: 'Surrender of a country', definition: 'A country gives up when its enemies hold about 60% of its victory points.', why: 'You do not have to take every province: capitals and big cities matter most.' },
  { id: 'air-superiority', term: 'Air superiority', definition: 'Having enough fighters over an area that the enemy’s aircraft cannot operate freely there.', why: 'The side that controls the sky fights better on the ground below.' },
  { id: 'convoy', term: 'Convoy', definition: 'A group of cargo ships sailing together, usually protected by warships.', why: 'Imports arrive by convoy. Sunk convoys mean shortages at home.' },
  { id: 'conscription', term: 'Conscription', definition: 'A law that requires citizens to serve in the armed forces.', why: 'More conscription gives more soldiers but takes workers out of the factories.' },
  { id: 'stability', term: 'Stability', definition: 'How well the country holds together, from 0 to 100.', why: 'Low stability brings strikes and, at the extreme, a change of government.' },
  { id: 'war-support', term: 'War support', definition: 'How willing the public is to fight and to make sacrifices, from 0 to 100.', why: 'Democracies cannot go to war, or raise taxes far, without it.' },
  { id: 'appeasement', term: 'Appeasement', definition: 'Giving an aggressive country some of what it demands in the hope of avoiding war.', why: 'Britain and France followed this policy towards Germany in the 1930s, most famously at Munich in 1938.' },
  { id: 'demilitarised-zone', term: 'Demilitarised zone', definition: 'An area where a treaty forbids soldiers and fortifications.', why: 'The Treaty of Versailles made the German Rhineland one. Germany sent troops back in on 7 March 1936.' },
  { id: 'inflation', term: 'Inflation', definition: 'The rate at which the general level of prices rises, usually measured over 12 months.', why: 'Printing money to pay for a war pushes inflation up, which lowers stability and factory output.', ap: true },
  { id: 'war-bonds', term: 'War bonds', definition: 'Loans from the public to the government to pay for a war, repaid later with interest.', why: 'Bonds raise money without raising taxes today, but the debt and its interest build up.', ap: true },
  { id: 'budget-deficit', term: 'Budget deficit', definition: 'The amount by which a government’s spending is greater than its income in a period.', why: 'Wars cause large deficits. You cover them with taxes, bonds or printed money.', ap: true },
  { id: 'money-supply', term: 'Money supply', definition: 'The total amount of money in the economy.', why: 'If it grows much faster than the economy produces goods, prices rise.', ap: true },
  { id: 'rationing', term: 'Rationing', definition: 'Limiting how much of a scarce good each person may buy, usually with coupons.', why: 'It shares out shortages fairly and holds prices down, at a cost to public mood. Britain began food rationing in January 1940.' },
];

const BY_ID = new Map(GLOSSARY.map((t) => [t.id, t]));
export const termById = (id: string): Term | undefined => BY_ID.get(id);
