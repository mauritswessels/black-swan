/**
 * Learn to play: eleven short lessons, each a prepared situation on the real map.
 *
 * A lesson is a world (built here, from the real 1936 world) and a list of steps. Each step
 * tells the player one thing, may point at a button or a province, and is done when a check on
 * the game says so: a panel is open, divisions are marching, a battle is won. A step with no
 * check is read and then passed with Next.
 *
 * Every step that asks for something also says how to do it for the player ("Show me"). The
 * tests use exactly that to play every lesson from start to finish, so a change to the game
 * that breaks a lesson fails the tests.
 *
 * Pure TypeScript, like src/sim: no screen code. The screen reads the steps and the checks.
 * Lesson worlds carry `story.lesson`, which switches off history cards, story events, random
 * events and the end of the game, so nothing happens in them but what the lesson set up. The
 * historical agenda and the treaties are off too (quiet). The player is France throughout.
 */
import { quiet } from '../sim/agenda';
import { cannotResearch, TECHS } from '../sim/research';
import { cannotStartPlan, plansFor } from '../sim/plans';
import type { Order, Unit, UnitType, World } from '../sim/types';
import { newWorld, step as stepWorld } from '../sim/world';
import { provinceByName } from '../sim/map';
import { attackMenu, type OptionKind } from '../sim/strike';

/** What the sidebar shows, in the shape the screen uses (see src/ui/store.ts). */
export interface Sel {
  kind: string;
  ids?: number[];
  name?: string;
  id?: number | string;
  province?: number;
  owner?: string;
}

/** Everything a step may look at: the world, and the parts of the screen that matter. */
export interface LessonView {
  world: World;
  selection: Sel | null;
  mapMode: string;
  overlay: string | null;
  running: boolean;
  speed: number;
  ordering: boolean;
  bySea: boolean;
  /** How often the map has been dragged or zoomed so far. */
  moves: number;
  /** The province the attack menu is open over, if it is open. */
  menu: number | null;
}

/** What "Show me" does: the same things the player would do with the mouse and the keys. */
export interface Action {
  select?: Sel | null;
  orders?: Order[];
  mapMode?: string;
  overlay?: string | null;
  /** Start (true) or stop (false) the clock. */
  run?: boolean;
  speed?: number;
  /** Advance this many days at once (only with the clock stopped). */
  days?: number;
  /** Move the map to this province. */
  look?: number;
  /** Open the attack menu over this province (null closes it). */
  menu?: number | null;
}

/** Something on the screen to point at: a CSS selector, and optionally text the element must contain. */
export interface Target {
  sel: string;
  text?: string;
}

export interface Step {
  /** What to do or what to notice. `K` in backticks is shown as a key. */
  text: string | ((v: LessonView) => string);
  /** A line on why it matters. */
  why?: string;
  target?: Target;
  /** A province to ring on the map. */
  province?: number;
  /** Done when this is true. Without it, the step is read and passed with Next. */
  done?: (v: LessonView, start: LessonView) => boolean;
  show?: (v: LessonView) => Action;
  /** Leave the clock as it is when the step begins. Otherwise it is stopped, so there is time to read. */
  keepClock?: boolean;
  /** For the tests: how many days the clock may need to run before the step is done. */
  days?: number;
}

export interface Lesson {
  id: string;
  title: string;
  /** One line for the list of lessons. */
  summary: string;
  minutes: number;
  build: () => World;
  steps: Step[];
  /** What to try next, shown when the lesson is finished. */
  next: string;
}

export const ME = 'France';

/** Provinces the lessons use, by id (see src/content/map). */
export const P = {
  paris: 23, lorraine: 24, provence: 25, burgundy: 26, languedoc: 30, normandy: 33, corsica: 15,
  palatinate: 3, wurttemberg: 8, alsace: provinceByName('Alsace').id, rhineland: 7, hesse: 12, eastPrussia: 0, pomerania: 9, silesia: 5, brandenburg: 10,
  brussels: 163, wallonia: 164, piedmont: 54, lombardy: 55, emilia: 58,
} as const;

// ---------------------------------------------------------------- building the lesson worlds

/** The real world of 1 January 1936 with France as the player, on a lesson's date, with nothing scripted. */
function base(id: string, date: string): World {
  const w = quiet(newWorld('story', `lesson-${id}`, date, ME));
  return { ...w, story: { ...w.story, lesson: id } };
}

/** Replace a country's army with divisions standing where a lesson wants them: [province, type, how many]. */
function army(w: World, country: string, layout: [number, UnitType, number][]): World {
  const units = w.units.filter((u) => u.owner !== country);
  let next = w.nextUnitId;
  for (const [at, type, n] of layout)
    for (let i = 0; i < n; i++) units.push({ id: next++, owner: country, type, at, strength: 100, organisation: 100, path: [], progress: 0, dugIn: 0, supply: 1 } satisfies Unit);
  return { ...w, units, nextUnitId: next };
}

/** Base all of a country's air wings at one province: the Luftwaffe was over Poland in September 1939. */
function wingsAt(w: World, country: string, province: number): World {
  return { ...w, wings: w.wings.map((x) => (x.owner === country ? { ...x, base: province, target: undefined } : x)) };
}

/** A war in a lesson world: `by` declares it today, and nobody else joins. `news` replaces the headline. */
function war(w: World, by: string, on: string, news: string): World {
  // Declared as in Free-for-all, so no cause for war is needed, then back to the Story rules.
  const fought = stepWorld({ ...w, mode: 'freeForAll' }, [{ type: 'declareWar', by, on }]);
  const log = fought.diplomacy.log.map((e, i, all) => (i === all.length - 1 ? { ...e, text: news } : e));
  // No surprise bonus or penalty: the lesson should show the plain rules.
  return { ...fought, mode: 'story', diplomacy: { ...fought.diplomacy, log }, story: { ...fought.story, effects: [] } };
}

/** France's home army as it stood in 1936, put where the lessons can find it. */
const FRENCH_HOME: [number, UnitType, number][] = [
  [P.paris, 'infantry', 4], [P.paris, 'armour', 1],
  [P.lorraine, 'infantry', 3],
  [P.burgundy, 'infantry', 3], [P.burgundy, 'artillery', 1],
  [P.provence, 'infantry', 3], [P.provence, 'artillery', 1],
  [P.languedoc, 'infantry', 2],
  [28, 'infantry', 3], [29, 'infantry', 3], [27, 'infantry', 2],
];

// ---------------------------------------------------------------- small checks

const mine = (v: LessonView) => v.world.units.filter((u) => u.owner === ME);
const at = (v: LessonView, province: number, owner = ME) => v.world.units.filter((u) => u.owner === owner && u.at === province);
const selectedUnits = (v: LessonView): Unit[] => (v.selection?.kind === 'units' ? v.world.units.filter((u) => v.selection!.ids!.includes(u.id)) : []);
const selectUnitsAt = (v: LessonView, ...provinces: number[]): Action => ({ select: { kind: 'units', ids: mine(v).filter((u) => provinces.includes(u.at)).map((u) => u.id) } });
const moveAll = (units: Unit[], to: number): Order[] => units.map((u) => ({ type: 'move', unit: u.id, to }));
const econ = (v: LessonView) => v.world.economies[ME];
const sel = (kind: string): ((v: LessonView) => boolean) => (v) => v.selection?.kind === kind;
const open = (kind: string): ((v: LessonView) => Action) => () => ({ select: { kind } });
const monthsOf = (v: LessonView) => econ(v).history.length;

// ---------------------------------------------------------------- the lessons

const mapTable: Lesson = {
  id: 'map',
  title: 'The map table',
  summary: 'Find your way around: the map, the sidebar, the top bar and the codex.',
  minutes: 3,
  build: () => army(base('map', '1936-01-01'), ME, FRENCH_HOME),
  next: 'Next, learn how time works: the clock, the speeds and the news.',
  steps: [
    {
      text: 'Welcome to the map table. You lead France, in blue, on 1 January 1936. Europe is at peace, for now.',
      why: 'Every lesson is a small prepared situation. You can leave at any time from the card, and come back to the same lesson from the main menu.',
    },
    {
      text: 'Move the map: drag it with the mouse, or use the arrow keys. Scroll, pinch or press `+` and `-` to zoom.',
      done: (v, s) => v.moves > s.moves,
      show: () => ({ look: P.paris }),
    },
    {
      text: 'Click Île-de-France, the province around Paris, to open it in the sidebar.',
      province: P.paris,
      done: (v) => v.selection?.kind === 'province',
      show: () => ({ select: { kind: 'province', id: P.paris } }),
    },
    {
      text: 'The sidebar on the right shows everything about what you clicked: who owns it, its terrain, its factories and its victory points.',
      why: 'Victory points measure what a province is worth. Take enough of an enemy’s and it surrenders, so capitals and big cities matter most.',
      target: { sel: '.sb' },
    },
    {
      text: 'Now click the word GERMANY on the map to open a country.',
      done: (v) => v.selection?.kind === 'country' && v.selection.name !== ME,
      show: () => ({ select: { kind: 'country', name: 'Germany' } }),
    },
    {
      text: 'Switch the map to Terrain with the buttons at the bottom left.',
      why: 'Each map mode colours the map in a different way. Terrain shows where attacks are hard: hills, forests, marshes and mountains all help the defender.',
      target: { sel: '.mt-modes' },
      done: (v) => v.mapMode === 'terrain',
      show: () => ({ mapMode: 'terrain' }),
    },
    {
      text: 'Go back to the Political map.',
      target: { sel: '.mt-modes' },
      done: (v) => v.mapMode === 'political',
      show: () => ({ mapMode: 'political' }),
    },
    {
      text: 'The top bar shows your country at a glance. Hover over a number to see why it is what it is, and click it to open its panel.',
      why: 'A number with ! in front of it needs your attention.',
      target: { sel: '.mt-stats' },
    },
    {
      text: 'Words with a dotted line under them have an entry in the codex: hover over one to read it, click it to open the codex there. Now press `X` to open the whole codex.',
      target: { sel: '[data-tut="rail-codex"]' },
      done: (v) => v.overlay === 'codex',
      show: () => ({ overlay: 'codex' }),
    },
    {
      text: 'Search for any term, for example “supply”. When you are done, close the codex with `Esc`.',
      done: (v) => v.overlay === null,
      show: () => ({ overlay: null }),
    },
  ],
};

const time: Lesson = {
  id: 'time',
  title: 'Time',
  summary: 'Start and stop the clock, change the speed and read the news.',
  minutes: 3,
  build: () => army(base('time', '1936-01-01'), ME, FRENCH_HOME),
  next: 'Next, learn to move your divisions.',
  steps: [
    {
      text: 'The game runs day by day, and it starts paused, so you can look around first. The date and the clock are at the top right.',
      target: { sel: '.mt-clock' },
    },
    {
      text: 'Press `Space`, or the play button, to start the clock.',
      target: { sel: '.mt-play' },
      done: (v) => v.running,
      show: () => ({ run: true }),
    },
    {
      text: 'Speed it up: hold `Shift` and press `3`, or click the third bar.',
      target: { sel: '.mt-speed' },
      keepClock: true,
      done: (v) => v.speed >= 3,
      show: () => ({ speed: 3 }),
    },
    {
      text: 'Pause again with `Space`.',
      keepClock: true,
      target: { sel: '.mt-play' },
      done: (v) => !v.running,
      show: () => ({ run: false }),
    },
    {
      text: 'While paused, press `.` (the full stop) to go forward exactly one day.',
      target: { sel: '[aria-label^="Advance one day"]' },
      done: (v, s) => !v.running && v.world.day > s.world.day,
      show: () => ({ days: 1 }),
    },
    {
      text: 'Headlines appear along the bottom. Click one to open it and to move the map to where it happened.',
      why: '“Pause when attacked” stops the clock when an enemy attacks one of your provinces. Decisions with a deadline and history cards stop it too.',
      target: { sel: '.mt-ticker' },
    },
    {
      text: 'Let a month go by: start the clock and wait for 1 February. On the first of each month your economy closes its books.',
      done: (v) => v.world.day >= 31,
      show: () => ({ run: true, speed: 5 }),
      days: 40,
    },
    {
      text: 'You can save at any time with `S`. Real games also save themselves on the first of each month. (Lessons never touch your saves.)',
    },
  ],
};

const moving: Lesson = {
  id: 'moving',
  title: 'Moving divisions',
  summary: 'Select your divisions, march them and keep them supplied.',
  minutes: 4,
  build: () => army(base('moving', '1936-01-01'), ME, FRENCH_HOME),
  next: 'Next, fight a battle.',
  steps: [
    {
      text: 'Each box on the map is a counter: FRA 5 means five French divisions in that province. A division is about 15,000 soldiers. Click your counter in Paris.',
      province: P.paris,
      done: (v) => selectedUnits(v).some((u) => u.owner === ME),
      show: (v) => selectUnitsAt(v, P.paris),
    },
    {
      text: 'The sidebar lists the divisions you selected. Strength is how many men and weapons are left. Organisation is how ready they are to fight: it falls in battle and comes back at rest.',
      target: { sel: '.sb' },
    },
    {
      text: 'Right-click Lorraine to march there (on a trackpad, click with two fingers).',
      province: P.lorraine,
      done: (v) => mine(v).some((u) => u.path[u.path.length - 1] === P.lorraine),
      show: (v) => ({ orders: moveAll(selectedUnits(v).length ? selectedUnits(v) : at(v, P.paris), P.lorraine) }),
    },
    {
      text: 'The arrow shows where they are going, and the sidebar says how long it takes. Start the clock and watch them march.',
      province: P.lorraine,
      done: (v, s) => at(v, P.lorraine).length > at(s, P.lorraine).length && !mine(v).some((u) => u.path[u.path.length - 1] === P.lorraine),
      show: () => ({ run: true, speed: 4 }),
      days: 30,
    },
    {
      text: 'Select the counter in Lorraine, then hold Shift and click the counter in Burgundy to add it.',
      why: 'Shift-click adds counters to what you have selected, so you can send several armies at once.',
      done: (v) => new Set(selectedUnits(v).map((u) => u.at)).size >= 2,
      show: (v) => selectUnitsAt(v, P.lorraine, P.burgundy),
    },
    {
      text: 'Switch the map to Supply. Brighter provinces can feed more divisions. Brown ones are overcrowded, and hatched ones are cut off from your depots.',
      why: 'A division without enough supply loses organisation, and one that is cut off starts losing men. Do not pile too many into one province.',
      target: { sel: '.mt-modes' },
      done: (v) => v.mapMode === 'supply',
      show: () => ({ mapMode: 'supply' }),
    },
    {
      text: 'Two more tricks: `H` halts the selected divisions where they are, and `Tab` jumps from one of your counters to the next. Press `Esc` to drop the selection.',
      done: (v) => v.selection === null,
      show: () => ({ select: null, mapMode: 'political' }),
    },
  ],
};

const battle: Lesson = {
  id: 'battle',
  title: 'Battle',
  summary: 'The Saar, September 1939: read the outlook, attack and win.',
  minutes: 5,
  build: () => {
    let w = base('battle', '1939-09-07');
    // The French build-up on the Saar, and a few German divisions holding the West Wall. The rest of the German army is fighting in Poland.
    w = army(w, ME, [[P.lorraine, 'infantry', 7], [P.lorraine, 'artillery', 3], [P.lorraine, 'armour', 1], [P.alsace, 'infantry', 4], [P.burgundy, 'infantry', 2], [P.paris, 'infantry', 4], [P.provence, 'infantry', 3]]);
    w = army(w, 'Germany', [[P.palatinate, 'infantry', 2], [P.wurttemberg, 'infantry', 2], [P.rhineland, 'infantry', 2], [P.eastPrussia, 'infantry', 8], [P.pomerania, 'infantry', 8], [P.pomerania, 'armour', 3], [P.silesia, 'infantry', 8], [P.silesia, 'armour', 3]]);
    w = wingsAt(w, 'Germany', P.silesia);
    return war(w, ME, 'Germany', 'France declares war on Germany after the invasion of Poland');
  },
  next: 'Next, let armies take whole fronts off your hands.',
  steps: [
    {
      text: 'It is 7 September 1939. Germany has invaded Poland, and France has declared war on Germany. Most of the German army is far away in Poland. This is your chance: the Saar offensive.',
      why: 'In real history France advanced a few miles into the Saar, then stopped and went back. Here you decide.',
    },
    {
      text: 'Click the German counter in the Palatinate to see what you face. Enemy counters have a dashed orange edge.',
      province: P.palatinate,
      done: (v) => v.selection?.kind === 'stack' && v.selection.owner === 'Germany',
      show: () => ({ select: { kind: 'stack', province: P.palatinate, owner: 'Germany' } }),
    },
    {
      text: 'Now select your army in Lorraine.',
      province: P.lorraine,
      done: (v) => selectedUnits(v).some((u) => u.at === P.lorraine),
      show: (v) => selectUnitsAt(v, P.lorraine),
    },
    {
      text: 'Right-click the Palatinate. The attack menu lists every way to hit it, with a preview of each. Choose Attack by land.',
      province: P.palatinate,
      done: (v) => mine(v).some((u) => u.path[0] === P.palatinate),
      show: (v) => ({ orders: moveAll(selectedUnits(v).filter((u) => u.at === P.lorraine).length ? selectedUnits(v).filter((u) => u.at === P.lorraine) : at(v, P.lorraine), P.palatinate) }),
    },
    {
      text: 'The sidebar now shows the outlook: how much damage each side does a day, and how many days each can keep going. An attack usually needs about twice the defenders’ strength.',
      why: 'Artillery helps most against defenders who have dug in. Each day standing still adds 2% to a division’s defence, up to 20%.',
      target: { sel: '.sb-outlook' },
    },
    {
      text: 'Let one day pass (press `.` while the clock is stopped), then click the crossed swords over the Palatinate to open the battle.',
      province: P.palatinate,
      done: (v) => v.selection?.kind === 'battle',
      show: (v) => ({ days: 1, select: { kind: 'battle', id: v.world.nextBattleId } }),
    },
    {
      text: 'The bar is the front line: how far your divisions have got into the Palatinate, from the border to the far side. On the map it is the band in your colour growing from the border. The province is yours only when the band reaches the far side.',
      why: 'Each day the line moves by how the fighting went: forward when you deal more damage than you take, back when you take more. When the defenders break, it jumps forward as they fall back.',
      target: { sel: '.sb-front' },
    },
    {
      text: 'Start the clock and watch the battle.',
      province: P.palatinate,
      done: (v) => v.world.controller[P.palatinate] === ME,
      show: () => ({ run: true, speed: 3 }),
      days: 40,
    },
    {
      text: 'The Palatinate is yours. Press `R` for the battle reports, and open the report of the battle.',
      done: (v) => v.selection?.kind === 'report',
      show: (v) => ({ select: { kind: 'report', id: v.world.reports.find((r) => r.province === P.palatinate)?.id ?? v.world.reports[v.world.reports.length - 1]?.id ?? 0 } }),
    },
    {
      text: 'Every report says why the battle went the way it did, the biggest reason first. Read them when an attack fails: they tell you what to bring next time.',
    },
    {
      text: 'Now attack Württemberg from two sides at once. Select your counters in Alsace and in the Palatinate (Shift-click), then right-click Württemberg and choose Attack by land.',
      why: 'Each extra direction lets 4 more of your divisions into the fight, and the defenders cannot face every way at once.',
      province: P.wurttemberg,
      done: (v) => new Set(mine(v).filter((u) => u.path[0] === P.wurttemberg).map((u) => u.at)).size >= 2,
      show: (v) => {
        const from = mine(v).filter((u) => u.at === P.alsace || u.at === P.palatinate);
        return { select: { kind: 'units', ids: from.map((u) => u.id) }, orders: moveAll(from, P.wurttemberg) };
      },
    },
    {
      text: 'Start the clock and take Württemberg. Both ways in cross the Rhine, the blue line on the map: watch the band stall at the river until your divisions win a bridgehead.',
      why: 'Attacking across a great river, divisions hit 15% less hard, and the line moves at half pace until it is 20 points in. Mud in the autumn and spring, and snow in the winter, slow the front in the east in the same way.',
      province: P.wurttemberg,
      done: (v) => v.world.controller[P.wurttemberg] === ME,
      show: () => ({ run: true, speed: 3 }),
      days: 90,
    },
    {
      text: 'The strongest move of all is encirclement: cut an enemy army off from its depots. The map rings a pocket of trapped divisions with a count. Surrounded divisions that lose a battle surrender completely instead of retreating.',
      why: 'A country gives up when its enemies hold 60% of its victory points, or 40% once its capital has fallen (the capital and 10% more, if that is higher).',
    },
    {
      text: 'Click the word GERMANY on the map. Its sidebar shows the war score and lets you offer peace.',
      done: (v) => v.selection?.kind === 'country' && v.selection.name === 'Germany',
      show: () => ({ select: { kind: 'country', name: 'Germany' } }),
    },
    {
      text: 'Peace can put the old borders back, or let each side keep what it holds. The sidebar says whether they are likely to accept, and why.',
      target: { sel: '.sb-outlook' },
    },
  ],
};

const armyOf = (v: LessonView) => (v.world.armies ?? []).find((a) => a.owner === ME);
const armyOrder = (v: LessonView, order: NonNullable<World['armies']>[number]['order']): Action => {
  const a = armyOf(v);
  return a ? { select: { kind: 'army', id: a.id }, orders: [{ type: 'armyOrder', country: ME, army: a.id, order }] } : {};
};

const armies: Lesson = {
  id: 'armies',
  title: 'Armies',
  summary: 'Group divisions into an army, then let it hold a border or push.',
  minutes: 5,
  build: () => {
    let w = base('armies', '1939-09-07');
    w = army(w, ME, [[P.lorraine, 'infantry', 6], [P.lorraine, 'artillery', 2], [P.burgundy, 'infantry', 5], [P.burgundy, 'armour', 1], [P.paris, 'infantry', 4], [P.provence, 'infantry', 3]]);
    w = army(w, 'Germany', [[P.palatinate, 'infantry', 2], [P.wurttemberg, 'infantry', 2], [P.rhineland, 'infantry', 3], [P.eastPrussia, 'infantry', 8], [P.pomerania, 'infantry', 8], [P.silesia, 'infantry', 8]]);
    w = wingsAt(w, 'Germany', P.silesia);
    return war(w, ME, 'Germany', 'France declares war on Germany after the invasion of Poland');
  },
  next: 'Next, learn where new divisions come from: factories and production.',
  steps: [
    {
      text: 'A real war has too many divisions to move one by one. An army is a group of divisions that carries out one order between them: hold a border, or push toward a target.',
      why: 'Generals commanded armies, not divisions. You decide where the effort goes; the army works out which division goes where.',
    },
    {
      text: 'Hold `Shift` and drag a box around your counters in Lorraine and Burgundy.',
      why: 'Shift-drag selects every one of your divisions inside the box. Plain dragging still moves the map.',
      province: P.lorraine,
      done: (v) => new Set(selectedUnits(v).map((u) => u.at)).size >= 2,
      show: (v) => selectUnitsAt(v, P.lorraine, P.burgundy),
    },
    {
      text: 'Press `A`, or click Form a new army in the sidebar.',
      done: (v) => !!armyOf(v),
      show: (v) => ({ orders: [{ type: 'formArmy', country: ME, units: (selectedUnits(v).length ? selectedUnits(v) : mine(v).filter((u) => u.at === P.lorraine || u.at === P.burgundy)).map((u) => u.id) }], select: { kind: 'army', id: v.world.nextArmyId ?? 0 } }),
    },
    {
      text: 'Your 1st Army has a flag on the map, in its own colour, and the number key `1`. Press `1` to select it (press it again to look at it). Its divisions are ringed in gold.',
      done: (v) => v.selection?.kind === 'army',
      show: (v) => ({ select: { kind: 'army', id: armyOf(v)?.id ?? 0 } }),
    },
    {
      text: 'Click Hold against Germany.',
      why: 'Holding, the army spreads along the whole border with that country: more divisions where more enemies stand, and some behind the line. It keeps the line filled as divisions come and go.',
      target: { sel: '.sb-chips' },
      done: (v) => armyOf(v)?.order.kind === 'hold',
      show: (v) => armyOrder(v, { kind: 'hold', foe: 'Germany' }),
    },
    {
      text: 'Start the clock and watch the army spread out along the border.',
      done: (v, s) => v.world.day - s.world.day >= 6,
      show: () => ({ run: true, speed: 3 }),
      days: 10,
    },
    {
      text: 'Now attack. Drag the army’s flag onto the Palatinate (or click Push toward…, then the Palatinate).',
      why: 'Dragging the flag onto an enemy province means push; onto a border, hold it; onto your own land behind the front, wait there in reserve.',
      province: P.palatinate,
      done: (v) => armyOf(v)?.order.kind === 'push',
      show: (v) => armyOrder(v, { kind: 'push', target: P.palatinate, foe: 'Germany', pace: 'steady' }),
    },
    {
      text: 'The thick arrow is the push. Its pace sets the odds it waits for before each attack: careful (1.6 to 1), steady (1.3 to 1) or all-out (even odds). All-out is fast and costly.',
      target: { sel: '.sb-seg' },
    },
    {
      text: 'Start the clock. The army attacks on its own, and when the Palatinate is taken it holds the ground around it.',
      province: P.palatinate,
      done: (v) => v.world.controller[P.palatinate] === ME,
      show: () => ({ run: true, speed: 3 }),
      days: 60,
    },
    {
      text: 'Give the army a commander: pick one from the list in the sidebar. Each has one strength: bold ones attack 10% harder, careful ones defend 10% harder, and good organisers get their divisions back in shape faster.',
      why: 'The commanders are real generals of the time. Hover over a name for who they were, and what they did.',
      target: { sel: '.sb select' },
      done: (v) => !!armyOf(v)?.commander,
      show: (v) => {
        const a = armyOf(v);
        return a ? { select: { kind: 'army', id: a.id }, orders: [{ type: 'armySettings', country: ME, army: a.id, commander: 'degaulle' }] } : {};
      },
    },
    {
      text: 'Two more orders. Fall back: the army stops attacking, goes back to a province you pick and digs in twice as fast. Reserve: it waits behind the front and goes to help where the enemy breaks in.',
      why: 'Two armies pushing at the same place from different sides make a pincer. The map labels it, and warns when the jaws are closing on enemy divisions that would be cut off.',
    },
  ],
};

const production: Lesson = {
  id: 'production',
  title: 'Factories and production',
  summary: 'Production lines, raising divisions and building factories.',
  minutes: 4,
  build: () => {
    const w = army(base('production', '1936-01-01'), ME, FRENCH_HOME);
    // Enough equipment on the infantry line for one new division.
    const e = w.economies[ME];
    return { ...w, economies: { ...w.economies, [ME]: { ...e, stock: { ...e.stock, infantry: 1.2 } } } };
  },
  next: 'Next, find out how a country pays for all this: the economy.',
  steps: [
    {
      text: 'Press `P`, or the Production button on the left, to open Production.',
      target: { sel: '[data-tut="rail-production"]' },
      done: sel('production'),
      show: open('production'),
    },
    {
      text: 'Civilian factories make goods for the shops and do all the building. Military factories make equipment on production lines, one line for each kind of division, aircraft or ship.',
      why: 'Every factory you turn to war is one that is not making what people buy. Empty shops cost stability.',
      target: { sel: '.sb' },
    },
    {
      text: 'Move one military factory from the infantry line to the artillery line: press − on infantry, then + on artillery.',
      target: { sel: '.sb-stepper[aria-label*="artillery line"]' },
      done: (v, s) => econ(v).lines.artillery.factories > econ(s).lines.artillery.factories,
      show: (v) => ({ orders: [{ type: 'setLine', country: ME, unit: 'infantry', factories: econ(v).lines.infantry.factories - 1 }, { type: 'setLine', country: ME, unit: 'artillery', factories: econ(v).lines.artillery.factories + 1 }] }),
    },
    {
      text: 'The infantry line has finished enough equipment for a division. Press “Raise an infantry division”.',
      target: { sel: 'button', text: 'Raise an infantry division' },
      done: (v, s) => econ(v).training.length > econ(s).training.length,
      show: () => ({ orders: [{ type: 'raise', country: ME, unit: 'infantry' }] }),
    },
    {
      text: 'The new division trains for a while, then appears on the map. It also takes men from your manpower, shown in the top bar.',
      why: 'A wider conscription law gives more men, but every man in uniform is a worker less in the factories.',
    },
    {
      text: 'Now build a new military factory. Under Construction, set at least one civilian factory aside for building with +.',
      target: { sel: '.sb-stepper[aria-label*="set aside"]' },
      done: (v) => econ(v).constructionFactories > 0,
      show: () => ({ orders: [{ type: 'setConstruction', country: ME, factories: 2 }] }),
    },
    {
      text: 'Press “Build a military factory”.',
      target: { sel: 'button', text: 'military factory' },
      done: (v, s) => econ(v).construction.length > econ(s).construction.length,
      show: () => ({ orders: [{ type: 'build', country: ME, kind: 'mil', province: P.paris }] }),
    },
    {
      text: 'Building takes months. When it is finished, the news line tells you and the new factory waits for a production line. A gold “!” in the top bar means idle factories.',
    },
  ],
};

const money: Lesson = {
  id: 'money',
  title: 'Money',
  summary: 'The budget, taxes, bonds, printing money and inflation.',
  minutes: 4,
  build: () => army(base('money', '1936-01-01'), ME, FRENCH_HOME),
  next: 'Next: research, national plans and the home front.',
  steps: [
    {
      text: 'Press `E`, or the Economy button, to open the Economy.',
      target: { sel: '[data-tut="rail-economy"]' },
      done: sel('economy'),
      show: open('economy'),
    },
    {
      text: 'The budget shows a month of income and spending. Income is mostly tax. Spending is the army, the factories and interest on the debt. The difference is the balance.',
      target: { sel: '.sb' },
    },
    {
      text: 'Raise taxes by 5 points with the tax slider.',
      why: 'Above 25% of output, taxes start to cost stability. In wartime people accept more, depending on war support.',
      target: { sel: '#tax' },
      done: (v, s) => econ(v).taxRate >= econ(s).taxRate + 0.049,
      show: (v) => ({ orders: [{ type: 'setTax', country: ME, rate: Math.round((econ(v).taxRate + 0.05) * 100) / 100 }] }),
    },
    {
      text: 'When income does not cover spending, the gap is paid by selling bonds (borrowing) or by printing money. The bonds slider sets the mix.',
      why: 'Bonds are painless until the debt and its interest pile up. Printing is painless for about three months, then prices take off.',
      target: { sel: '#bonds' },
    },
    {
      text: 'Inflation is how fast prices rise, in per cent a year. Printing money adds to it, and once people expect inflation it keeps going on its own.',
      why: 'The real interest rate is the rate on bonds minus inflation: r = i - pi. High inflation lowers the real burden of old debt, but it ruins savers and angers everyone else.',
    },
    {
      text: 'Start the clock and let a month go by. Then look at the chart: it gains a point for each month.',
      done: (v, s) => monthsOf(v) > monthsOf(s),
      show: () => ({ run: true, speed: 5 }),
      days: 40,
    },
    {
      text: 'Click Inflation in the top bar to see what made up last month’s figure.',
      target: { sel: '.mt-stats' },
      done: sel('economy'),
      show: open('economy'),
    },
    {
      text: 'There is no free way to pay for a war. A mix of taxes, bonds and rationing usually hurts least.',
    },
  ],
};

const homeFront: Lesson = {
  id: 'home',
  title: 'Research, plans and the home front',
  summary: 'Technologies, national plans, stability and war support.',
  minutes: 4,
  build: () => army(base('home', '1936-01-01'), ME, FRENCH_HOME),
  next: 'Next, deal with other countries: diplomacy.',
  steps: [
    {
      text: 'Press `T`, or the Research button, to open Research.',
      target: { sel: '[data-tut="rail-research"]' },
      done: sel('research'),
      show: open('research'),
    },
    {
      text: 'Click any technology to read what it does and what really happened.',
      target: { sel: '.sb-pick' },
      done: sel('tech'),
      show: () => ({ select: { kind: 'tech', id: TECHS.find((t) => t.tier === 1)!.id } }),
    },
    {
      text: 'Put a research team on it with the button for team 1 or team 2. (If it needs another technology first, pick one that does not.)',
      done: (v) => econ(v).research.slots.some((x) => x !== null),
      show: (v) => {
        const r = econ(v).research;
        const picked = v.selection?.kind === 'tech' ? TECHS.find((t) => t.id === v.selection!.id) : undefined;
        const tech = picked && !cannotResearch(r, picked) ? picked : TECHS.find((t) => !cannotResearch(r, t))!;
        return { orders: [{ type: 'setResearch', country: ME, slot: 0, tech: tech.id }] };
      },
    },
    {
      text: 'Each technology has the year it really appeared. Working on it earlier is slower: speed = 1 / (1 + 0.5 x years ahead). Research what is due now, and come back for the rest.',
      why: 'A gold dot on the left means a research team is idle.',
    },
    {
      text: 'Press `N` for the National plan.',
      target: { sel: '[data-tut="rail-plan"]' },
      done: sel('plans'),
      show: open('plans'),
    },
    {
      text: 'Click a plan, then start it. A plan runs for months and costs money every day, and you can run only one at a time.',
      done: (v) => econ(v).plan.active !== null,
      show: (v) => {
        const year = 1936 + Math.floor(v.world.day / 365);
        const plan = plansFor(ME).find((p) => !cannotStartPlan(econ(v).plan, p, ME, year, false))!;
        return { select: { kind: 'plan', id: plan.id }, orders: [{ type: 'startPlan', country: ME, plan: plan.id }] };
      },
    },
    {
      text: 'Press `W` for the Home front.',
      target: { sel: '[data-tut="rail-home"]' },
      done: sel('politics'),
      show: open('politics'),
    },
    {
      text: 'Stability is how well the country holds together. Below 50, strikes slow the factories; below 20 for three months, the government falls. War support is how willing people are to fight.',
      why: 'In 1936 French war support is low: after 1918 few people wanted another war. A country that is attacked rallies; one that starts a war does not.',
      target: { sel: '.sb' },
    },
  ],
};

const diplomacy: Lesson = {
  id: 'diplomacy',
  title: 'Diplomacy',
  summary: 'Relations, missions, guarantees, causes for war and peace.',
  minutes: 4,
  build: () => {
    const w = army(base('diplomacy', '1938-10-01'), ME, FRENCH_HOME);
    // After Munich: tension is high enough for a democracy to hand out guarantees.
    return { ...w, diplomacy: { ...w.diplomacy, tension: 40 } };
  },
  next: 'Last lesson: the navy and the air force.',
  steps: [
    {
      text: 'Press `D`, or the Diplomacy button, to open Diplomacy.',
      target: { sel: '[data-tut="rail-diplomacy"]' },
      done: sel('diplomacy'),
      show: open('diplomacy'),
    },
    {
      text: 'World tension, from 0 to 100, is how close Europe feels to a general war. Every aggressive move raises it, and tension makes every country arm faster.',
      target: { sel: '.sb' },
    },
    {
      text: 'Click Belgium, your neighbour to the north, on the map or in the list.',
      province: P.brussels,
      done: (v) => v.selection?.kind === 'country' && v.selection.name === 'Belgium',
      show: () => ({ select: { kind: 'country', name: 'Belgium' } }),
    },
    {
      text: 'The sidebar shows how Belgium sees you, and why. Send a diplomatic mission to improve relations.',
      target: { sel: 'button', text: 'mission' },
      done: (v) => v.world.diplomacy.missions.includes(`${ME}>Belgium`),
      show: () => ({ orders: [{ type: 'mission', by: ME, to: 'Belgium', on: true }] }),
    },
    {
      text: 'Now guarantee Belgium’s independence: a promise to fight for it if it is attacked.',
      why: 'A democracy can only give guarantees once world tension reaches 25: voters will not accept the risk before. A guarantee from a country that looks ready to fight makes an aggressor think twice.',
      target: { sel: 'button', text: 'Guarantee' },
      done: (v) => v.world.diplomacy.pacts.some((p) => p.kind === 'guarantee' && p.a === ME && p.b === 'Belgium'),
      show: () => ({ orders: [{ type: 'guarantee', by: ME, on: 'Belgium' }] }),
    },
    {
      text: 'Now click Germany.',
      done: (v) => v.selection?.kind === 'country' && v.selection.name === 'Germany',
      show: () => ({ select: { kind: 'country', name: 'Germany' } }),
    },
    {
      text: 'You cannot simply declare war. In Story mode you need a cause for war: a claim, a case you have built, a refused ultimatum, or a promise to keep. Each grey button says why it is blocked.',
      why: 'A democracy can build a case only against a country that has already broken the peace, or once world tension reaches 50. That is why Britain and France were slow in the 1930s.',
      target: { sel: '.sb' },
    },
    {
      text: 'When another country needs an answer from you, such as an ally under attack or an offer of peace, the clock stops and the question opens in the sidebar. You have seven days to decide.',
    },
  ],
};

const forces: Lesson = {
  id: 'forces',
  title: 'Navy and air force',
  summary: 'Fleet missions, air wings, and taking divisions across the sea.',
  minutes: 5,
  build: () => {
    let w = base('forces', '1940-06-11');
    w = army(w, ME, [[P.languedoc, 'infantry', 2], [P.provence, 'infantry', 4], [P.burgundy, 'infantry', 4], [P.paris, 'infantry', 4], [P.lorraine, 'infantry', 4]]);
    w = army(w, 'Italy', [[P.piedmont, 'infantry', 6], [55, 'infantry', 4], [59, 'infantry', 3], [52, 'infantry', 1]]);
    return war(w, 'Italy', ME, 'Italy declares war on France');
  },
  next: 'Next, put land, sea and air together with the attack menu.',
  steps: [
    {
      text: 'It is 11 June 1940. Yesterday Italy declared war on France. Press `F`, or the Forces button, for the navy and the air force.',
      target: { sel: '[data-tut="rail-forces"]' },
      done: sel('forces'),
      show: open('forces'),
    },
    {
      text: 'Switch the map to Air and sea. You do not steer ships or aircraft: you give each fleet a sea zone and a mission, and each air wing a base and a mission.',
      target: { sel: '.mt-modes' },
      done: (v) => v.mapMode === 'airsea',
      show: () => ({ mapMode: 'airsea' }),
    },
    {
      text: 'Click your Mediterranean Fleet, the ship counter south of Marseille.',
      done: (v) => v.selection?.kind === 'fleet' && v.world.fleets.some((f) => f.id === v.selection!.id && f.owner === ME),
      show: (v) => ({ select: { kind: 'fleet', id: v.world.fleets.find((f) => f.owner === ME && f.zone === 'westmed')!.id } }),
    },
    {
      text: 'Patrol fights enemy fleets and holds the zone. Escort guards your convoys. Raid sinks enemy merchant ships. Give the fleet the Escort mission.',
      why: 'Whoever has twice the other side’s naval strength in a zone controls it. Control lets you land troops there and cuts the enemy’s trade through it.',
      target: { sel: '[aria-label="Mission"]' },
      done: (v) => v.world.fleets.some((f) => f.owner === ME && f.mission === 'escort'),
      show: (v) => ({ orders: [{ type: 'fleet', fleet: v.world.fleets.find((f) => f.owner === ME && f.zone === 'westmed')!.id, mission: 'escort' }] }),
    },
    {
      text: 'Now click one of your air bases: the round badges marked F (fighters) and B (bombers), for example near Lyon in Burgundy.',
      province: P.burgundy,
      done: sel('wings'),
      show: (v) => ({ select: { kind: 'wings', province: v.world.wings.find((x) => x.owner === ME)!.base } }),
    },
    {
      text: 'Fighters win control of the sky. Bombers help in battles, bomb factories or attack ships. Change the mission of the bombers or the fighters here.',
      why: 'The side with 1.5 times the other’s air strength over a battle hits 15% harder.',
      target: { sel: '.sb-actions[aria-label*="Mission for the"]' },
      done: (v, s) => v.world.wings.some((x) => x.owner === ME && s.world.wings.some((y) => y.id === x.id && y.mission !== x.mission)),
      show: (v) => {
        const wings = v.world.wings.filter((x) => x.owner === ME && (v.selection?.kind !== 'wings' || x.base === v.selection.province));
        const bomber = wings.find((x) => x.type === 'bomber') ?? v.world.wings.find((x) => x.owner === ME && x.type === 'bomber')!;
        return { orders: [{ type: 'wing', wing: bomber.id, mission: bomber.mission === 'ground' ? 'naval' : 'ground' }] };
      },
    },
    {
      text: 'To cross the sea, select divisions on a coast. Select your two divisions in Languedoc, around Marseille.',
      province: P.languedoc,
      done: (v) => selectedUnits(v).some((u) => u.at === P.languedoc),
      show: (v) => selectUnitsAt(v, P.languedoc),
    },
    {
      text: 'Press `B` (Go by sea), then click Corsica.',
      province: P.corsica,
      done: (v) => mine(v).some((u) => u.sea?.to === P.corsica || u.path.includes(P.corsica) || u.at === P.corsica),
      show: (v) => ({ orders: (selectedUnits(v).length ? selectedUnits(v) : at(v, P.languedoc)).map((u) => ({ type: 'ship', unit: u.id, to: P.corsica }) as Order) }),
    },
    {
      text: 'A friendly shore takes a few days. Start the clock and wait for them to land on Corsica.',
      province: P.corsica,
      done: (v) => at(v, P.corsica).length > 0,
      show: () => ({ run: true, speed: 3 }),
      days: 30,
    },
    {
      text: 'An enemy shore is a landing: two weeks to prepare, control of the sea zone off the beach, and the troops fight at 60% as they come ashore. Aircraft and ships are built on production lines like everything else.',
    },
  ],
};

/** The option of the attack menu over a province, as the player sees it (with the selected divisions first). */
const menuOption = (v: LessonView, province: number, kind: OptionKind) => {
  const ctx = v.selection?.kind === 'units' ? { units: v.selection.ids } : v.selection?.kind === 'army' ? { army: Number(v.selection.id) } : {};
  return attackMenu(v.world, ME, province, ctx).options.find((o) => o.kind === kind && !o.why);
};
/** "Show me" for choosing an option: open the menu if it is not open, and choose. */
const choose = (province: number, kind: OptionKind) => (v: LessonView): Action => {
  const o = menuOption(v, province, kind);
  return o ? { orders: o.orders, menu: null } : { menu: province };
};
const aimedAt = (v: LessonView, province: number, mission?: string) => v.world.wings.some((x) => x.owner === ME && x.target === province && (!mission || x.mission === mission));

const attack: Lesson = {
  id: 'attack',
  title: 'The attack menu',
  summary: 'Right-click an enemy province: land, sea and air together, scouting and paratroopers.',
  minutes: 6,
  build: () => {
    let w = base('attack', '1940-06-11');
    w = army(w, ME, [[P.provence, 'infantry', 6], [P.provence, 'artillery', 2], [P.burgundy, 'infantry', 4], [P.languedoc, 'airborne', 2], [P.languedoc, 'infantry', 1], [P.paris, 'infantry', 4], [P.lorraine, 'infantry', 4]]);
    w = army(w, 'Italy', [[P.piedmont, 'infantry', 3], [P.lombardy, 'infantry', 4], [59, 'infantry', 3], [52, 'infantry', 1]]);
    // France has trained paratroopers for the lesson (Airborne forces researched).
    const e = w.economies[ME];
    w = { ...w, economies: { ...w.economies, [ME]: { ...e, research: { ...e.research, done: [...e.research.done.filter((t) => t !== 'para'), 'inf1', 'para'].filter((t, i, all) => all.indexOf(t) === i) } } } };
    return war(w, 'Italy', ME, 'Italy declares war on France');
  },
  next: 'You have seen every way to attack. Try a joint landing next: divisions on a coast, a fleet to clear the sea, and bombers over the beach.',
  steps: [
    {
      text: 'It is 11 June 1940, and Italy has declared war on France. Three Italian divisions hold Piedmont, over the Alps from Provence. You will take it with everything you have: land, air and sea together.',
    },
    {
      text: 'Right-click Piedmont (on a trackpad, click with two fingers).',
      province: P.piedmont,
      done: (v) => v.menu === P.piedmont,
      show: () => ({ menu: P.piedmont }),
    },
    {
      text: 'The attack menu lists every way to hit Piedmont. Point at an option to see how it would go: how many days, and what it would cost each side. Options you cannot use are greyed, with the reason.',
      why: 'The preview is worked out by the same rules as the battle itself, from what you can see. It leaves out luck and any reinforcements.',
      target: { sel: '.mt-menu' },
    },
    {
      text: 'You only see enemy divisions next to your own. Close the menu (`Escape`), right-click Lombardy, behind Piedmont, and choose Scout.',
      why: 'A scout plane flies over the province every day and shows what is there and next to it. Enemy fighters shoot some scouts down.',
      province: P.lombardy,
      done: (v) => aimedAt(v, P.lombardy, 'scout'),
      show: choose(P.lombardy, 'scout'),
    },
    {
      text: 'Now right-click Piedmont again and choose Joint attack, the first option.',
      why: 'A joint attack times everything: the bombers and fighters are aimed at Piedmont, the fleet sails off its coast to shell it, and the divisions go in once the wings are ready and the ships are in place.',
      province: P.piedmont,
      done: (v) => (v.world.strikes ?? []).some((x) => x.owner === ME && x.province === P.piedmont) || mine(v).some((u) => u.path[0] === P.piedmont),
      show: choose(P.piedmont, 'joint'),
    },
    {
      text: 'The dashed lines on the map show where your wings and ships are aimed, and the badge over Piedmont says a joint attack is waiting. Start the clock and wait for the attack to go in.',
      province: P.piedmont,
      done: (v) => v.world.battles.some((b) => b.province === P.piedmont && b.attackers.includes(ME)),
      show: () => ({ run: true, speed: 3 }),
      days: 20,
    },
    {
      text: 'Click the crossed swords over Piedmont to open the battle.',
      province: P.piedmont,
      done: (v) => v.selection?.kind === 'battle',
      show: (v) => ({ select: { kind: 'battle', id: v.world.battles.find((b) => b.province === P.piedmont)?.id ?? 0 } }),
    },
    {
      text: 'The outlook now counts fire support: bombers aimed at the battle and warships shelling the coast add damage every day, and defenders under fire cannot dig in. That is "softening up".',
      target: { sel: '.sb-outlook' },
    },
    {
      text: 'Your two paratrooper divisions wait in Languedoc. Right-click Piedmont and choose Drop paratroopers: they land behind the Italians and join your attack from a new direction.',
      why: 'Paratroopers jump 3 days after the order and fight at 70% strength. Dropped onto an empty enemy province they take it at once. Cut off once down, they are captured if they break before help arrives.',
      province: P.piedmont,
      done: (v) => mine(v).some((u) => u.type === 'airborne' && (u.drop?.to === P.piedmont || u.at === P.piedmont || u.dropped)),
      show: choose(P.piedmont, 'drop'),
    },
    {
      text: 'Start the clock and take Piedmont.',
      province: P.piedmont,
      done: (v) => v.world.controller[P.piedmont] === ME,
      show: () => ({ run: true, speed: 3 }),
      days: 90,
    },
    {
      text: 'Piedmont is yours. Aimed wings stay on their target until you change it: open an air base (on the Air and sea map) to spread them out again. The same menu bombs factories, wins the sky over a battle, and lands divisions from the sea.',
      why: 'Paratroopers need the Airborne forces research (Infantry), then a production line. Germany, Britain, Italy and the Soviet Union all trained them in the 1930s.',
    },
  ],
};

export const LESSONS: Lesson[] = [mapTable, time, moving, battle, armies, production, money, homeFront, diplomacy, forces, attack];

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);

/** The text of a step for the view it is shown in. */
export const textOf = (s: Step, v: LessonView): string => (typeof s.text === 'function' ? s.text(v) : s.text);
