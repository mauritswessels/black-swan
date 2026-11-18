/**
 * Commanders: real generals of the time who can lead the player's armies.
 *
 * Each has one trait that changes how the divisions of the army he leads fight:
 *
 *   bold      they attack 10% harder;
 *   careful   they defend 10% harder;
 *   supply    good at supply and staff work: they regain organisation 25% faster.
 *
 * The traits are a game's simplification of a whole career, chosen from what each was best
 * known for. Every commander has a codex entry (glossary.ts reads `COMMANDERS`); where a
 * general took part in or was tried for crimes, the entry says so plainly.
 */
export type Trait = 'bold' | 'careful' | 'supply';

export interface Commander {
  id: string;
  name: string;
  country: string;
  trait: Trait;
  /** Born and died. */
  life: string;
  /** What he did, in two or three sentences, for the codex. */
  story: string;
}

export const TRAIT_NAME: Record<Trait, string> = { bold: 'Bold', careful: 'Careful', supply: 'Good at supply' };
export const TRAIT_TEXT: Record<Trait, string> = {
  bold: 'Divisions attack 10% harder',
  careful: 'Divisions defend 10% harder',
  supply: 'Divisions regain organisation 25% faster',
};
/** What each trait multiplies. */
export const TRAIT_ATTACK: Record<Trait, number> = { bold: 1.1, careful: 1, supply: 1 };
export const TRAIT_DEFENCE: Record<Trait, number> = { bold: 1, careful: 1.1, supply: 1 };
export const TRAIT_RECOVERY: Record<Trait, number> = { bold: 1, careful: 1, supply: 1.25 };

export const COMMANDERS: Commander[] = [
  // Germany
  { id: 'guderian', name: 'Heinz Guderian', country: 'Germany', trait: 'bold', life: '1888 to 1954', story: 'The army’s leading thinker on tanks, he led the armoured corps that broke through at Sedan in May 1940 and raced to the Channel, and a panzer group in Russia in 1941. Hitler dismissed him in December 1941 for retreating without orders. He was never charged with war crimes.' },
  { id: 'manstein', name: 'Erich von Manstein', country: 'Germany', trait: 'bold', life: '1887 to 1973', story: 'He drew up the plan to attack through the Ardennes in 1940, took Sevastopol in 1942 and retook Kharkov in 1943. In November 1941 he issued an order to his army justifying the "harsh punishment of Jewry". A British military court convicted him of war crimes in 1949; he was released in 1953.' },
  { id: 'rundstedt', name: 'Gerd von Rundstedt', country: 'Germany', trait: 'careful', life: '1875 to 1953', story: 'The senior army group commander in Poland, France and Ukraine, and in the West in 1944. In 1941 he passed on to his armies an order calling for "harsh but just" measures against Jews. Held by the British as a war crimes suspect, he was released without trial in 1949 because of his health.' },
  { id: 'model', name: 'Walter Model', country: 'Germany', trait: 'careful', life: '1891 to 1945', story: 'Known for patching up collapsing fronts in the east in 1943 and 1944, and in the West at Arnhem. When his army group was trapped in the Ruhr in April 1945 he dissolved it and shot himself rather than surrender.' },
  { id: 'rommel', name: 'Erwin Rommel', country: 'Germany', trait: 'bold', life: '1891 to 1944', story: 'He led the 7th Panzer Division through France in 1940 and the Afrika Korps in North Africa from 1941 to 1943, where he was beaten at El Alamein. Linked to the plot against Hitler of July 1944, he was forced to take poison. His reputation as a clean soldier was built partly by propaganda and after the war.' },
  // Soviet Union
  { id: 'zhukov', name: 'Georgy Zhukov', country: 'Soviet Union', trait: 'bold', life: '1896 to 1974', story: 'He beat the Japanese at Khalkhin Gol in 1939, organised the defence of Moscow in 1941, helped plan the encirclement at Stalingrad and took Berlin in 1945. He was known for spending soldiers’ lives freely.' },
  { id: 'rokossovsky', name: 'Konstantin Rokossovsky', country: 'Soviet Union', trait: 'careful', life: '1896 to 1968', story: 'Arrested in the purges of 1937 and beaten in prison, he was freed in 1940. He commanded at Moscow and Stalingrad, held the northern face of the Kursk salient in 1943 and led the destruction of the German army group in Belarus in 1944.' },
  { id: 'konev', name: 'Ivan Konev', country: 'Soviet Union', trait: 'bold', life: '1897 to 1973', story: 'He led fronts in the great offensives of 1943 to 1945, through Ukraine and Poland to Berlin and Prague, and raced Zhukov for Berlin. His troops reached Auschwitz in January 1945.' },
  { id: 'vasilevsky', name: 'Aleksandr Vasilevsky', country: 'Soviet Union', trait: 'supply', life: '1895 to 1977', story: 'Chief of the General Staff from 1942, he planned the counter-offensive at Stalingrad with Zhukov and coordinated several fronts at once. In 1945 he led the campaign against Japan in Manchuria.' },
  // United Kingdom
  { id: 'montgomery', name: 'Bernard Montgomery', country: 'United Kingdom', trait: 'careful', life: '1887 to 1976', story: 'He beat Rommel at El Alamein in 1942 and commanded the Allied armies in Normandy in 1944. He attacked only when he had built up overwhelming strength, which saved lives but frustrated his allies.' },
  { id: 'wavell', name: 'Archibald Wavell', country: 'United Kingdom', trait: 'bold', life: '1883 to 1950', story: 'Commander in the Middle East from 1939. In Operation Compass, from December 1940, a force of about 30,000 destroyed an Italian army many times its size and took about 130,000 prisoners. Stretched over too many campaigns, he was replaced in 1941.' },
  { id: 'auchinleck', name: 'Claude Auchinleck', country: 'United Kingdom', trait: 'careful', life: '1884 to 1981', story: 'He took over in the Middle East in 1941 and stopped Rommel’s advance on Egypt at the first battle of El Alamein in July 1942, but was replaced weeks later.' },
  { id: 'alexander', name: 'Harold Alexander', country: 'United Kingdom', trait: 'supply', life: '1891 to 1969', story: 'He commanded the rearguard at Dunkirk in 1940, then the Allied armies in North Africa and in Italy, where he managed a coalition of many nations from 1943 to 1945.' },
  // France
  { id: 'gamelin', name: 'Maurice Gamelin', country: 'France', trait: 'careful', life: '1872 to 1958', story: 'Commander-in-chief of the French army in 1939 and 1940. He sent his best armies into Belgium and had no reserve left when the Germans broke through in the Ardennes. He was dismissed on 19 May 1940.' },
  { id: 'georges', name: 'Alphonse Georges', country: 'France', trait: 'careful', life: '1875 to 1951', story: 'Commander of the north-eastern front in 1940, the armies that faced the German attack. He never fully recovered from wounds taken in 1934, when King Alexander of Yugoslavia was assassinated beside him in Marseille, and his front was overwhelmed in May 1940.' },
  { id: 'degaulle', name: 'Charles de Gaulle', country: 'France', trait: 'bold', life: '1890 to 1970', story: 'He argued for armoured divisions in the 1930s and led one in counter-attacks at Montcornet and Abbeville in May 1940. From London he refused the armistice and led the Free French, and became head of the French government in 1944.' },
  { id: 'delattre', name: 'Jean de Lattre de Tassigny', country: 'France', trait: 'bold', life: '1889 to 1952', story: 'His division held at Rethel in 1940. He escaped from a Vichy prison in 1943, commanded the French First Army from the landings in Provence in 1944 to Germany, and signed the German surrender in Berlin for France.' },
  // Italy
  { id: 'badoglio', name: 'Pietro Badoglio', country: 'Italy', trait: 'careful', life: '1871 to 1956', story: 'He commanded the conquest of Ethiopia in 1936, where his forces used poison gas, and was chief of staff until the defeats in Greece in 1940. After Mussolini fell in 1943 he led the government that signed the armistice with the Allies.' },
  { id: 'graziani', name: 'Rodolfo Graziani', country: 'Italy', trait: 'careful', life: '1882 to 1955', story: 'He led brutal campaigns in Libya, with camps where tens of thousands died, and in Ethiopia, where his men killed thousands of people in Addis Ababa in 1937 after an attempt on his life. His invasion of Egypt in 1940 stopped after a few days, and he was driven out by Operation Compass.' },
  { id: 'messe', name: 'Giovanni Messe', country: 'Italy', trait: 'supply', life: '1883 to 1968', story: 'He led the Italian corps in Russia in 1941 and 1942, where he warned that his men were badly equipped, and the last Axis army in Tunisia, which surrendered in May 1943. Afterwards he served the Italian army fighting on the Allied side.' },
  // Poland
  { id: 'rydz', name: 'Edward Rydz-Śmigły', country: 'Poland', trait: 'careful', life: '1886 to 1941', story: 'Marshal of Poland and commander-in-chief in September 1939. He spread the army along the whole long border, where it was broken up, and left the country for Romania on 18 September.' },
  { id: 'kutrzeba', name: 'Tadeusz Kutrzeba', country: 'Poland', trait: 'bold', life: '1885 to 1947', story: 'He led the counter-attack on the Bzura in September 1939, the biggest battle of the campaign, which held up the German advance on Warsaw for days.' },
  { id: 'anders', name: 'Władysław Anders', country: 'Poland', trait: 'bold', life: '1892 to 1970', story: 'Wounded and taken prisoner by the Soviets in 1939, he was freed in 1941 to raise an army from Poles held in the Soviet Union. He led it out through Iran and commanded the Polish corps that took Monte Cassino in 1944.' },
  { id: 'maczek', name: 'Stanisław Maczek', country: 'Poland', trait: 'supply', life: '1892 to 1994', story: 'He led the 10th Motorised Cavalry Brigade in 1939, then the Polish 1st Armoured Division in Normandy, where it helped close the Falaise pocket, and on into the Netherlands.' },
];

const BY_ID = new Map(COMMANDERS.map((c) => [c.id, c]));
export const commanderById = (id: string | undefined): Commander | undefined => (id ? BY_ID.get(id) : undefined);
export const commandersOf = (country: string): Commander[] => COMMANDERS.filter((c) => c.country === country);
