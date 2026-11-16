/**
 * History cards: what really happened, in plain words.
 *
 * Each card comes up in Story mode on its real date, whatever has happened in your game, and
 * the game adds a line comparing the two (story.ts). Dates and figures are the well-established
 * ones; where historians disagree or the numbers are estimates, the card says so in `note`.
 *
 * Three kinds:
 *   event     a political or military event;
 *   economy   how the war was paid for and what it did to ordinary life;
 *   atrocity  crimes of the regimes of the time. These are history to know about. The game
 *             never lets you order them, never models them and never rewards them.
 */
export type CardKind = 'event' | 'economy' | 'atrocity';

export interface HistoryCard {
  id: string;
  /** The real date, YYYY-MM-DD. */
  date: string;
  title: string;
  kind: CardKind;
  /** What really happened. */
  text: string;
  /** Why it mattered. */
  why: string;
  /** Where the figures are estimates or historians disagree. */
  note?: string;
}

export const CARDS: HistoryCard[] = [
  {
    id: 'rhineland', date: '1936-03-07', kind: 'event', title: 'German troops enter the Rhineland',
    text: 'About 20,000 German soldiers marched into the Rhineland, the part of Germany along the French border that the peace treaties had made a zone without troops. France and Britain protested and did nothing. The German commanders had orders to pull back if the French army moved.',
    why: 'It was the cheapest moment to stop Hitler, and it passed. He learned that the democracies would not fight over a broken treaty.',
  },
  {
    id: 'ethiopia', date: '1936-05-05', kind: 'atrocity', title: 'Italy conquers Ethiopia',
    text: 'Italian troops entered Addis Ababa, ending a seven-month invasion of Ethiopia, a member of the League of Nations. Italy bombed villages and used mustard gas, which it had promised by treaty never to use. The League voted for weak sanctions that left out oil, then dropped them.',
    why: 'The League of Nations was shown to be powerless, and Italy, shunned by Britain and France, moved towards Germany.',
    note: 'Ethiopia lies off this game\'s map. Estimates of Ethiopian dead vary widely, from tens of thousands to several hundred thousand.',
  },
  {
    id: 'matignon', date: '1936-06-07', kind: 'economy', title: 'France: the Matignon agreements',
    text: 'After a wave of strikes, the new Popular Front government of Léon Blum gave French workers a pay rise of about 12%, a 40-hour week and two weeks of paid holiday. Costs rose, money left the country, and in September France had to devalue the franc.',
    why: 'France spent 1936 arguing about wages and the franc while Germany rearmed. Higher pay with no more output pushed prices up: demand grew faster than supply.',
  },
  {
    id: 'spain', date: '1936-07-17', kind: 'event', title: 'The Spanish Civil War begins',
    text: 'Army officers rose against the elected government of the Spanish Republic. Germany and Italy sent aircraft, tanks and tens of thousands of men to the rebels under General Franco. The Soviet Union sold arms to the Republic. Britain and France promised not to intervene, and kept the promise.',
    why: 'Spain became a rehearsal: Germany tested its air force there, and the dictators saw again that the democracies would stand aside.',
    note: 'In this game the war in Spain is fought off the map. Who wins depends on which great powers send help.',
  },
  {
    id: 'four-year-plan', date: '1936-10-18', kind: 'economy', title: 'Germany: the Four Year Plan and the hidden bills',
    text: 'Hitler put Hermann Göring in charge of a plan to make the army and the economy ready for war in four years. Rearmament had been paid for since 1934 partly with "Mefo bills": IOUs from a shell company, which kept about 12 billion Reichsmarks of borrowing out of the official budget. Prices and wages were frozen by law to hide the inflation.',
    why: 'Germany was printing money in disguise. By 1938 it was short of foreign currency and raw materials, which is one reason the regime looked to its neighbours\' gold and factories.',
  },
  {
    id: 'axis', date: '1936-10-25', kind: 'event', title: 'The Rome-Berlin Axis',
    text: 'Germany and Italy signed an understanding in Berlin. A week later Mussolini called it an "axis" around which Europe would turn. Italy had protected Austria against Germany in 1934. Now it stopped.',
    why: 'Austria lost its only protector, and the two dictatorships began to act together.',
  },
  {
    id: 'guernica', date: '1937-04-26', kind: 'atrocity', title: 'The bombing of Guernica',
    text: 'On a market day, German and Italian aircraft fighting for Franco bombed the Basque town of Guernica for about three hours and destroyed most of it. Picasso painted his "Guernica" in the weeks that followed.',
    why: 'It showed the world what bombing a town from the air meant, three years before the Blitz.',
    note: 'The number killed is disputed: most historians now put it between about 150 and 300; the Basque government at the time reported more than 1,600.',
  },
  {
    id: 'terror', date: '1937-06-11', kind: 'atrocity', title: 'The Great Terror reaches the Red Army',
    text: 'Marshal Tukhachevsky and seven other senior Soviet commanders were tried in secret and shot. Over the next two years Stalin\'s secret police arrested about 1.5 million people across the Soviet Union and shot roughly 700,000 of them. Three of the five marshals and most senior commanders were killed, and tens of thousands of officers were dismissed.',
    why: 'Besides the human cost, the Red Army lost its most experienced leaders just before the war. It showed in Finland in 1939 and in the summer of 1941.',
    note: 'In this game the Terror is not something you can order or prevent. Its effect on the Red Army (a weaker officer corps until 1942) applies whoever leads the Soviet Union.',
  },
  {
    id: 'anschluss', date: '1938-03-12', kind: 'event', title: 'Germany annexes Austria',
    text: 'After weeks of threats, German troops crossed into Austria without a shot being fired. Austria was declared part of Germany the next day. Attacks on Austrian Jews, and the seizure of their property, began at once.',
    why: 'Germany gained seven million people, Austria\'s gold and its army, and now surrounded Czechoslovakia on three sides.',
  },
  {
    id: 'munich', date: '1938-09-30', kind: 'event', title: 'The Munich agreement',
    text: 'Britain, France, Italy and Germany agreed at Munich that Czechoslovakia must hand Germany the Sudetenland, its German-speaking border districts. Czechoslovakia was not invited. It lost its border forts and much of its industry. The British prime minister, Neville Chamberlain, came home promising "peace for our time".',
    why: 'This is what "appeasement" means: giving a dictator what he demands in the hope that he will then stop. Britain and France also bought a year to rearm. Historians still argue about who gained more from that year.',
  },
  {
    id: 'vienna-1', date: '1938-11-02', kind: 'event', title: 'The First Vienna Award',
    text: 'Germany and Italy, acting as judges, gave Hungary the southern edge of Slovakia and of Ruthenia, taken from a Czechoslovakia that could no longer refuse. Hungary took the rest of Ruthenia in March 1939.',
    why: 'The smaller countries learned that borders were now handed out in Berlin and Rome, and began to line up for their share.',
  },
  {
    id: 'kristallnacht', date: '1938-11-09', kind: 'atrocity', title: 'The November pogrom ("Kristallnacht")',
    text: 'In one night, organised by the Nazi party across Germany and Austria, mobs burned hundreds of synagogues and wrecked about 7,500 Jewish shops. At least 91 Jews were killed and about 30,000 Jewish men were sent to concentration camps. The Jewish community was then fined a billion Reichsmarks for the damage.',
    why: 'It was the turn from laws against Jews to open violence by the state. Many who could still leave Germany tried to; most countries would not take them.',
    note: 'The official count of 91 dead leaves out the many who died in the camps or by suicide in the following weeks.',
  },
  {
    id: 'prague', date: '1939-03-15', kind: 'event', title: 'Germany occupies Prague',
    text: 'German troops marched into what was left of the Czech lands, and Slovakia became a German client state. For the first time Hitler had taken land where no Germans lived, and broken a promise made to Britain and France only six months earlier.',
    why: 'It ended appeasement. Nobody in London or Paris could still believe that Hitler only wanted to bring Germans into Germany.',
  },
  {
    id: 'guarantee', date: '1939-03-31', kind: 'event', title: 'Britain guarantees Poland',
    text: 'Neville Chamberlain told the House of Commons that if Poland was attacked and fought back, Britain and France would give it "all support in their power". Similar promises to Romania and Greece followed in April.',
    why: 'A line had finally been drawn. But Britain had no means of reaching Poland, and Hitler did not believe the promise would be kept.',
  },
  {
    id: 'spain-end', date: '1939-04-01', kind: 'event', title: 'Franco wins the Spanish Civil War',
    text: 'General Franco announced that the war was over. Around half a million people had died, and about as many fled into exile. Franco\'s dictatorship executed tens of thousands of its opponents in the years that followed, and lasted until 1975. Spain stayed out of the world war.',
    why: 'A third dictatorship now stood on France\'s borders.',
    note: 'Estimates of the dead in the war and of the executions after it vary by source.',
  },
  {
    id: 'albania', date: '1939-04-07', kind: 'event', title: 'Italy invades Albania',
    text: 'Italian troops landed in Albania on Good Friday. King Zog fled and the country was joined to Italy within a week.',
    why: 'Mussolini wanted a conquest of his own after Hitler\'s. Albania became his base for attacking Greece the next year.',
  },
  {
    id: 'steel', date: '1939-05-22', kind: 'event', title: 'The Pact of Steel',
    text: 'Germany and Italy signed a full military alliance. Each promised to join any war the other was in. Mussolini told Hitler privately that Italy would not be ready to fight before 1943.',
    why: 'When war came three months later, Italy stayed out until France was almost beaten.',
  },
  {
    id: 'pact', date: '1939-08-23', kind: 'event', title: 'The German-Soviet pact',
    text: 'The foreign ministers of Germany and the Soviet Union, Ribbentrop and Molotov, signed a non-aggression pact in Moscow. A secret protocol divided Poland, the Baltic states, Finland and part of Romania between the two. Britain and France had been negotiating with Stalin all summer and were taken by surprise.',
    why: 'Hitler was now free to attack Poland without fearing a war on two fronts. Stalin gained land and, he hoped, time.',
  },
  {
    id: 'poland', date: '1939-09-01', kind: 'event', title: 'Germany invades Poland',
    text: 'About 1.5 million German soldiers, with most of Germany\'s tanks and aircraft, attacked Poland from the north, west and south. The German army used fast armoured columns with close air support, later nicknamed "Blitzkrieg".',
    why: 'This is the day the Second World War in Europe began.',
  },
  {
    id: 'declare', date: '1939-09-03', kind: 'event', title: 'Britain and France declare war',
    text: 'Germany ignored an ultimatum to leave Poland, and Britain and France declared war. But the French army hardly moved from its border, and no help reached Poland. The quiet months that followed in the west were called the "Phoney War".',
    why: 'The promise to Poland was kept on paper. A war for Poland became a long war to defeat Germany.',
  },
  {
    id: 'soviet-poland', date: '1939-09-17', kind: 'event', title: 'The Soviet Union invades Poland',
    text: 'With the Polish army already breaking, the Red Army crossed Poland\'s eastern border, as secretly agreed with Germany. The Polish government escaped abroad and never surrendered. Warsaw fell on 28 September and the last Polish field army gave up on 6 October.',
    why: 'Poland was divided between two dictatorships for the fourth time in its history. Polish soldiers, airmen and code-breakers fought on from exile.',
  },
  {
    id: 'occupied-poland', date: '1939-10-26', kind: 'atrocity', title: 'Occupied Poland',
    text: 'Germany annexed western Poland and ruled the rest as a colony. In the first months German police and SS units shot tens of thousands of Polish teachers, priests, officers and officials, to leave the nation without leaders. Jews were marked, robbed and forced into ghettos. In the east, the Soviet secret police deported hundreds of thousands of Polish citizens to Siberia and Central Asia.',
    why: 'Both occupiers set out to destroy Poland as a nation. About six million Polish citizens, half of them Jews, were dead by 1945.',
    note: 'Estimates of the Soviet deportations range from about 320,000 to more than a million.',
  },
  {
    id: 'winter-war', date: '1939-11-30', kind: 'event', title: 'The Winter War',
    text: 'The Soviet Union attacked Finland after it refused to give up land near Leningrad. A Finnish army a fraction of the size held the Red Army for 105 days in deep snow and bitter cold. In March 1940 Finland gave up about a tenth of its territory and kept its independence.',
    why: 'The Red Army\'s poor showing, after Stalin had killed so many of its officers, convinced Hitler that the Soviet Union would be easy to beat.',
    note: 'About 25,000 Finnish soldiers died. Soviet dead are usually put at well over 100,000.',
  },
  {
    id: 'rationing', date: '1940-01-08', kind: 'economy', title: 'Britain starts rationing food',
    text: 'Bacon, butter and sugar were rationed from 8 January 1940, and meat, tea, cheese and clothes followed. Every person had a ration book of coupons. Rationing lasted in part until 1954.',
    why: 'With factories making weapons and ships being sunk, there were fewer goods to buy. Rationing shared them out fairly and kept prices from running away, instead of letting the richest outbid everyone else.',
  },
  {
    id: 'keynes', date: '1940-02-27', kind: 'economy', title: 'Keynes: "How to Pay for the War"',
    text: 'The economist John Maynard Keynes published a short book on Britain\'s problem: workers were earning more, but there was less to buy, so prices would shoot up. His answer was higher taxes plus forced saving, to be paid back after the war. Britain\'s 1941 budget followed his method.',
    why: 'It is the choice you face in this game. A war is paid for by taxes, by borrowing or by printing money, and printing money is a tax through inflation that nobody voted for.',
  },
  {
    id: 'katyn', date: '1940-03-05', kind: 'atrocity', title: 'The Katyn massacre',
    text: 'Stalin and the Soviet leadership ordered the shooting of the Polish officers, police and officials they held prisoner. About 22,000 were killed in April and May 1940, in the Katyn forest and at other places. The Soviet Union blamed Germany and admitted the truth only in 1990.',
    why: 'It removed many of the people who would have led an independent Poland after the war.',
  },
  {
    id: 'norway', date: '1940-04-09', kind: 'event', title: 'Germany invades Denmark and Norway',
    text: 'Denmark was occupied in a few hours. On the same morning German ships and aircraft landed troops at Oslo and several other Norwegian ports at once. Britain and France sent a force but had to withdraw in June. The campaign cost the small German navy about half its destroyers.',
    why: 'Germany secured the route for Swedish iron ore and bases for the war against British shipping. In London, the failure brought down Chamberlain.',
  },
  {
    id: 'west', date: '1940-05-10', kind: 'event', title: 'Germany attacks in the west',
    text: 'Germany invaded the Netherlands, Belgium and Luxembourg. The best French and British divisions moved north into Belgium to meet it. The main German armoured force then came through the wooded Ardennes hills behind them, crossed the river Meuse at Sedan and reached the Channel in ten days. On the same day Winston Churchill became British prime minister.',
    why: 'France had more tanks than Germany, but spread them out. Germany massed its armour at one point, which is the lesson of concentrating your force.',
  },
  {
    id: 'dunkirk', date: '1940-05-26', kind: 'event', title: 'Dunkirk',
    text: 'Cut off against the sea, the British army and many French troops were taken off the beaches at Dunkirk by the navy and hundreds of small civilian boats. By 4 June about 338,000 soldiers had been brought to England. They left nearly all their heavy weapons behind.',
    why: 'Britain saved the trained core of its army, and with it the ability to keep fighting.',
  },
  {
    id: 'italy', date: '1940-06-10', kind: 'event', title: 'Italy enters the war',
    text: 'With France collapsing, Mussolini declared war on France and Britain. An Italian attack across the Alps gained almost nothing in two weeks.',
    why: 'The war spread to the Mediterranean and to Africa, where Italy\'s colonies bordered Britain\'s.',
  },
  {
    id: 'armistice', date: '1940-06-22', kind: 'event', title: 'France signs an armistice',
    text: 'France signed at Compiègne, in the same railway carriage where Germany had signed in 1918. Germany occupied the north and the Atlantic coast. A French government under Marshal Pétain, at the spa town of Vichy, kept the south and the colonies. From London, General de Gaulle called on the French to fight on.',
    why: 'In six weeks the strongest army in western Europe had been beaten. Britain now stood alone.',
    note: 'The Vichy government brought in its own laws against Jews in October 1940 and later helped to deport about 75,000 Jews from France. Few came back.',
  },
  {
    id: 'baltic', date: '1940-06-15', kind: 'event', title: 'The Soviet Union takes the Baltic states',
    text: 'While the world watched France, the Red Army occupied Lithuania, Latvia and Estonia. After rigged elections all three were annexed in August. Romania handed over Bessarabia to a Soviet ultimatum at the end of June.',
    why: 'Stalin collected what the secret protocol with Hitler had promised him. Mass arrests and deportations followed.',
  },
  {
    id: 'vienna-2', date: '1940-08-30', kind: 'event', title: 'The Second Vienna Award',
    text: 'Germany and Italy ordered Romania to give northern Transylvania to Hungary. A week later Romania also returned southern Dobruja to Bulgaria. Having lost a third of its land in one summer, Romania turned to Germany for protection.',
    why: 'Germany wanted Romania\'s oil and quiet in the Balkans. Both Hungary and Romania ended up as its allies.',
  },
  {
    id: 'britain', date: '1940-09-15', kind: 'event', title: 'The Battle of Britain',
    text: 'From July the German air force tried to destroy the Royal Air Force so that an invasion could cross the Channel. Radar and a system of ground control let Britain\'s smaller force of fighters meet each raid. After heavy losses on 15 September, Hitler put the invasion off for good. The night bombing of British cities, the Blitz, went on until May 1941.',
    why: 'It was Germany\'s first defeat, and it kept a base open in the west from which the continent could one day be invaded.',
    note: 'About 43,000 British civilians were killed in the Blitz.',
  },
  {
    id: 'tripartite', date: '1940-09-27', kind: 'event', title: 'The Tripartite Pact',
    text: 'Germany, Italy and Japan promised to help each other if any of them was attacked by a power not yet in the war, which meant the United States. Hungary, Romania and Slovakia joined in November, Bulgaria in March 1941.',
    why: 'The wars in Europe and in Asia were now tied together.',
    note: 'Japan and the war in Asia are not in this version of the game.',
  },
  {
    id: 'greece', date: '1940-10-28', kind: 'event', title: 'Italy invades Greece',
    text: 'Italy attacked Greece from Albania after the Greek leader answered its ultimatum with a refusal. Within weeks the Greek army had pushed the Italians back into Albania.',
    why: 'Mussolini\'s failure forced Hitler to send German troops to the Balkans in the spring of 1941.',
  },
  {
    id: 'compass', date: '1940-12-09', kind: 'event', title: 'The war in the desert',
    text: 'A British and Commonwealth force of about 36,000 attacked the Italian army that had crossed into Egypt. In two months it advanced 800 km and took about 130,000 prisoners. Germany then sent General Rommel and an armoured corps to Libya.',
    why: 'In open desert, supply and mobility counted for more than numbers.',
  },
  {
    id: 'lend-lease', date: '1941-03-11', kind: 'economy', title: 'Lend-Lease',
    text: 'Britain had almost run out of gold and dollars to pay for American weapons. The United States, still neutral, passed a law to lend or lease arms to any country whose defence it thought vital. By 1945 it had supplied about 50 billion dollars of goods, mostly to Britain and the Soviet Union.',
    why: 'It removed the money limit on Britain\'s war. President Roosevelt compared it to lending a neighbour your garden hose when his house is on fire.',
  },
  {
    id: 'balkans', date: '1941-04-06', kind: 'event', title: 'Germany invades Yugoslavia and Greece',
    text: 'After a coup in Belgrade against the government that had just joined the Axis, Germany attacked Yugoslavia and Greece on the same day. Yugoslavia gave up in eleven days. Athens fell on 27 April, and in May German paratroops took Crete.',
    why: 'Germany secured its southern flank before turning on the Soviet Union. The occupations that followed were brutal, and resistance in the mountains never stopped.',
  },
  {
    id: 'barbarossa', date: '1941-06-22', kind: 'event', title: 'Germany invades the Soviet Union',
    text: 'More than three million German and allied soldiers attacked along a front of 2,900 km: the largest invasion in history. Stalin had ignored many warnings, and the Red Army was caught by surprise. Hundreds of thousands of Soviet soldiers were surrounded in the first weeks.',
    why: 'Germany was now fighting on two fronts against an enemy with far more people and land. It had to win quickly, and it did not.',
    note: 'This was planned from the start as a war of destruction. Of about 5.7 million Soviet soldiers taken prisoner during the war, around 3 million died in German hands, most from deliberate starvation.',
  },
  {
    id: 'atlantic-charter', date: '1941-08-14', kind: 'event', title: 'The Atlantic Charter',
    text: 'Churchill and Roosevelt met on warships off Newfoundland and set out what they were fighting for: no gains of territory, the right of peoples to choose their own government, and free trade.',
    why: 'The United States was not yet at war, but had chosen its side. The Charter became the starting point for the United Nations.',
  },
  {
    id: 'leningrad', date: '1941-09-08', kind: 'atrocity', title: 'The siege of Leningrad',
    text: 'German and Finnish forces cut Leningrad off by land. Hitler ordered that the city should not be taken but starved. The siege lasted 872 days, until January 1944. Around 800,000 civilians died, most of them from hunger in the first winter.',
    why: 'More people died in this one city than Britain and the United States lost in the whole war.',
    note: 'Estimates of civilian deaths range from about 600,000 to more than a million.',
  },
  {
    id: 'babi-yar', date: '1941-09-29', kind: 'atrocity', title: 'The Holocaust: mass shootings',
    text: 'Behind the German army came special SS and police units ordered to kill Jews. At the Babi Yar ravine in Kyiv they shot 33,771 Jewish men, women and children in two days. By the end of 1941 such units, with the help of the army and local collaborators, had murdered more than half a million Jews in the occupied Soviet territories.',
    why: 'This was the beginning of the systematic murder of the Jews of Europe.',
    note: 'The game does not model these crimes. Nothing you do in it causes them or is rewarded for them.',
  },
  {
    id: 'moscow', date: '1941-12-05', kind: 'event', title: 'The Soviet counter-attack at Moscow',
    text: 'German troops had come within about 30 km of Moscow. Their supply lines were stretched, they had no winter clothing, and it was -30 degrees. Fresh Soviet divisions from Siberia attacked and drove them back up to 250 km.',
    why: 'The plan to beat the Soviet Union in one campaign had failed. Germany now faced the long war it could not afford.',
  },
  {
    id: 'usa', date: '1941-12-07', kind: 'event', title: 'The United States enters the war',
    text: 'Japan attacked the American fleet at Pearl Harbor in Hawaii. Four days later Hitler declared war on the United States, although his pact with Japan did not oblige him to.',
    why: 'The world\'s largest economy joined the war against Germany. From then on the Allies could out-produce the Axis several times over.',
    note: 'The United States and Japan are not on this game\'s map yet. American help reaches you as Lend-Lease.',
  },
  {
    id: 'wannsee', date: '1942-01-20', kind: 'atrocity', title: 'The Wannsee conference',
    text: 'Fifteen senior German officials met in a villa outside Berlin to organise what they called the "final solution": the deportation and murder of all the Jews of Europe. Death camps with gas chambers were already being built in occupied Poland. By 1945 about six million Jews had been murdered.',
    why: 'The Holocaust was not the work of a few fanatics. It was planned at a meeting, with minutes, by educated officials of a modern state.',
    note: 'The Nazi regime also murdered several hundred thousand Roma, about 250,000 disabled people, and millions of Polish and Soviet civilians and prisoners of war.',
  },
  {
    id: 'stalingrad', date: '1943-02-02', kind: 'event', title: 'Stalingrad',
    text: 'The German 6th Army, surrounded in the ruins of Stalingrad since November, surrendered. About 91,000 survivors went into captivity. Counting both sides and the city\'s civilians, well over a million people were killed, wounded or captured in the battle.',
    why: 'It was the turning point on the eastern front. After Stalingrad the German army in the east only retreated.',
  },
  {
    id: 'ghetto-uprising', date: '1943-04-19', kind: 'atrocity', title: 'The Warsaw ghetto uprising',
    text: 'When German forces came to deport the last 50,000 Jews of the Warsaw ghetto to the death camps, fewer than a thousand young fighters with pistols and home-made bombs held them off for nearly a month. The ghetto was burned down block by block.',
    why: 'They had no hope of winning and knew it. They chose how to die, and that they would be remembered.',
  },
  {
    id: 'italy-armistice', date: '1943-09-08', kind: 'event', title: 'Italy changes sides',
    text: 'After the Allies landed in Sicily, the Italian king dismissed and arrested Mussolini in July 1943. On 8 September Italy\'s armistice with the Allies was announced. Germany occupied the north and centre of the country and set Mussolini up again as a puppet.',
    why: 'The first Axis power had fallen, but the fighting in Italy went on until the last days of the war.',
  },
  {
    id: 'd-day', date: '1944-06-06', kind: 'event', title: 'D-Day',
    text: 'About 156,000 American, British and Canadian soldiers landed on five beaches in Normandy, with 7,000 ships and complete control of the air. It was the largest landing from the sea in history. Paris was freed on 25 August.',
    why: 'It took two years of preparation, and control of both the sea and the sky, to open the second front that Stalin had asked for since 1941.',
  },
  {
    id: 'warsaw-rising', date: '1944-08-01', kind: 'atrocity', title: 'The Warsaw Uprising',
    text: 'The Polish underground army rose against the Germans as the Red Army approached the city. The Soviet forces stopped on the other bank of the river and gave almost no help. After 63 days the rising was crushed. Between 150,000 and 200,000 civilians were killed, and the Germans then blew up most of what was left of Warsaw.',
    why: 'The Poles who could have led a free Poland were destroyed, and Stalin\'s own government was installed in their place.',
  },
  {
    id: 'auschwitz', date: '1945-01-27', kind: 'atrocity', title: 'The liberation of Auschwitz',
    text: 'Soviet soldiers reached the Auschwitz camp in southern Poland and found about 7,000 prisoners alive. Around 1.1 million people had been murdered there, about a million of them Jews. 27 January is now Holocaust Memorial Day.',
    why: 'As the camps were opened one after another, the world could no longer say that it did not know.',
  },
  {
    id: 've-day', date: '1945-05-08', kind: 'event', title: 'Victory in Europe',
    text: 'With Soviet troops in Berlin and Hitler dead by his own hand, Germany surrendered without conditions. The war in Europe had lasted five years and eight months and killed around 40 million people in Europe, more than half of them civilians.',
    why: 'Germany was occupied and divided. Europe east of the river Elbe passed under Soviet control for the next 45 years.',
    note: 'Estimates of the dead vary by source. The Soviet Union alone lost about 27 million people.',
  },
];

export const cardById = (id: string): HistoryCard | undefined => CARDS.find((c) => c.id === id);
