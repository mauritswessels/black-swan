/**
 * Advisor tips: the first time a panel opens in a real game, a short note on what it is for.
 * Each one can be dismissed, and all of them switched off. The lessons teach the same things
 * step by step; a tip names the lesson that covers its panel.
 */
export interface Tip {
  text: string;
  /** The lesson that teaches it (see lessons.ts). */
  lesson?: string;
}

export const TIPS: Record<string, Tip> = {
  units: { text: 'Right-click a province to march there, or onto enemy divisions to attack them. Shift-click another counter to add it. Watch organisation: a division at zero must retreat.', lesson: 'moving' },
  province: { text: 'A province’s victory points are what it is worth in a war. Take enough of an enemy’s and it surrenders, so capitals and big cities matter most.', lesson: 'map' },
  stack: { text: 'You only see foreign divisions on your own land, next to your divisions, or where your divisions stand. A province that looks empty may not be.', lesson: 'battle' },
  country: { text: 'Everything you can do with a country is here. A grey button always says why it is blocked, and the relations list says why they feel as they do.', lesson: 'diplomacy' },
  battle: { text: 'The bar is the front line: the province is yours when it reaches the far side. The outlook says how many days each side can keep going. If the defenders can outlast your attackers, bring more divisions, attack from another side, or add artillery.', lesson: 'battle' },
  report: { text: 'The causes are listed biggest first. When an attack fails, the top cause tells you what to bring next time.', lesson: 'battle' },
  reports: { text: 'Every battle your divisions fought, won or lost. Open one to see why it went that way.', lesson: 'battle' },
  production: { text: 'Military factories make equipment on lines; civilian factories make goods for the shops and do the building. Moving a factory between lines costs speed for a while.', lesson: 'production' },
  economy: { text: 'There is no free way to pay. Taxes above 25% cost stability, bonds pile up debt and interest, and printing money brings inflation after a few months.', lesson: 'money' },
  research: { text: 'Put every team to work: a gold dot on the left means one is idle. A technology ahead of its time is slow, so research what is due first.', lesson: 'home' },
  plans: { text: 'One plan at a time, and each costs money every day it runs. Its real price is the other plans you are not running.', lesson: 'home' },
  politics: { text: 'Below 50 stability, strikes slow every factory. War support decides how far conscription and wartime taxes can go. A country that is attacked rallies.', lesson: 'home' },
  diplomacy: { text: 'Every aggressive move raises world tension, and tension makes every country arm faster. In Story mode a war needs a cause.', lesson: 'diplomacy' },
  decision: { text: 'A decision has a deadline. If you do nothing, the answer marked as the default is given for you.', lesson: 'diplomacy' },
  forces: { text: 'You give fleets and air wings a place and a mission, and they do the rest. Switch the map to Air and sea to see who controls what.', lesson: 'forces' },
  fleet: { text: 'Twice the enemy’s naval strength in a zone gives you control of it: you can land troops there and cut their trade through it.', lesson: 'forces' },
  wings: { text: 'Fighters reach 400 km and bombers 800 km from their base. Move them forward as the front moves.', lesson: 'forces' },
  zone: { text: 'Control of a sea zone decides landings and trade. If you live by imports, keep a fleet on Escort along your trade route.', lesson: 'forces' },
  chronicle: { text: 'Your chapter’s objectives are your country’s real aims. History cards arrive on their real dates, with a line on how your game compares.' },
  card: { text: 'History cards record what really happened on this day. The “in your game” line shows how far your world has moved from it.' },
};
