/**
 * Builds the sea zones of the game map: the 17 seas around Europe of version 1.6, unchanged,
 * then the oceans of the rest of the world (Stage M1).
 *
 *   npm run build:sea
 *
 * Each zone is a rough outline drawn by hand in [longitude, latitude]. The outlines may run
 * over land (the map draws land on top of them); what matters is where they meet at sea.
 * A province touches a zone when a stretch of its coastline lies inside the zone's outline.
 * Coastline = the edges of a province that no other province shares. The result goes to
 * src/content/map/sea.json.
 *
 * Not modelled: the Caspian Sea, the Great Lakes and other inland water, and the narrow straits
 * (Gibraltar, the Bosporus, Suez, Panama), which anyone may pass.
 *
 * The coasts of the 280 provinces of the 1.6 map are worked out from the 1.6 drawing, against the
 * 17 European zones only, so they are exactly as before (the Red Sea and Gulf coasts of Egypt and
 * Iraq join those seas in a later stage). The new provinces' coasts come from the world drawing.
 *
 * Crossing times: a fleet takes 2 days from one European zone to the next, as in 1.6. Out on
 * the oceans, a crossing takes the distance between the two zones' centres at 450 km a day, and
 * never less than 2 days: San Diego to Pearl Harbor is about 4,000 km.
 */
import fs from 'node:fs';

const ZONES = [
  { id: 'barents', name: 'Barents Sea', label: [38, 71.5], outline: [[20, 69.3], [28, 69.3], [31, 63.5], [46, 63.5], [46, 76], [20, 76]] },
  { id: 'norwegian', name: 'Norwegian Sea', label: [3, 66], outline: [[-30, 62], [5, 62], [20, 69.3], [20, 76], [-30, 76]] },
  { id: 'north', name: 'North Sea', label: [3, 56.5], outline: [[-4, 62], [5, 62], [7, 61], [9.5, 60.5], [11.3, 60], [11.2, 58.9], [10.6, 57.75], [9.5, 56.5], [9.3, 54.3], [9, 53], [5, 52], [3.0, 51.0], [1.9, 50.95], [1.4, 51.1], [0, 51.3], [-1, 52.5], [-2.5, 55], [-4, 57.5]] },
  { id: 'channel', name: 'English Channel', label: [-2.2, 49.9], outline: [[1.4, 51.1], [1.9, 50.95], [1.5, 49], [-1.5, 48.2], [-4.8, 48.3], [-5.7, 50.05], [-3, 51], [0, 51.3]] },
  { id: 'approaches', name: 'Western Approaches', label: [-11.5, 53], outline: [[-30, 62], [-4, 62], [-4, 57.5], [-2.5, 55], [-1, 52.5], [0, 51.3], [-3, 51], [-5.7, 50.05], [-4.8, 48.3], [-30, 48.3]] },
  { id: 'biscay', name: 'Bay of Biscay', label: [-6, 45.6], outline: [[-30, 48.3], [-4.8, 48.3], [-1.5, 48.2], [0, 45], [-1, 43], [-5, 42.5], [-9.3, 43], [-30, 43]] },
  { id: 'iberian', name: 'Iberian Coast', label: [-12, 38], outline: [[-30, 43], [-9.3, 43], [-8, 40], [-7.5, 37.8], [-5.6, 36.05], [-5.6, 35.8], [-6, 33], [-9, 29], [-9, 22], [-30, 22]] },
  { id: 'westmed', name: 'Western Mediterranean', label: [4.5, 38.6], outline: [[-5.6, 36.05], [-5.6, 35.8], [-4, 34], [3, 35], [8.5, 36], [9.8, 37.35], [9, 38.9], [9.1, 41], [9.2, 42.5], [9.45, 43], [10.5, 42.95], [10.5, 44.5], [7, 45], [3, 44.5], [0, 42.5], [-1, 40], [-3, 37.8], [-5.2, 36.9]] },
  { id: 'tyrrhenian', name: 'Tyrrhenian Sea', label: [12, 39.8], outline: [[9.45, 43], [10.5, 42.95], [12.5, 42.5], [15, 40.8], [16.2, 39.3], [15.65, 38.25], [14, 37.7], [12.4, 37.85], [11.05, 37.1], [10.2, 36.4], [9.5, 36.9], [9.8, 37.35], [9, 38.9], [9.1, 41], [9.2, 42.5]] },
  { id: 'centralmed', name: 'Central Mediterranean', label: [17.5, 34.5], outline: [[11.05, 37.1], [12.4, 37.85], [14, 37.7], [15.65, 38.25], [16.2, 39.3], [16.6, 40.9], [18, 40.7], [18.5, 40.15], [19.4, 40.25], [20.8, 39.5], [22, 38.6], [22.2, 37.6], [22.5, 36.4], [23.6, 35.25], [25.15, 31.6], [25, 24], [10, 24], [9.5, 33], [10.2, 36.4]] },
  { id: 'adriatic', name: 'Adriatic Sea', label: [15.6, 43], outline: [[18.5, 40.15], [18, 40.7], [16.6, 40.9], [15, 41.4], [13, 43], [11.8, 44.5], [12, 46], [14.3, 45.9], [16, 44.6], [18, 43.4], [19.8, 42], [20, 41], [19.4, 40.25]] },
  { id: 'aegean', name: 'Aegean Sea', label: [25, 38.2], outline: [[22.5, 36.4], [22.2, 37.6], [22, 38.6], [21.5, 39.5], [22, 40.8], [24, 41.5], [26.5, 41.3], [28.6, 41.3], [29.1, 41.15], [30.1, 40.9], [30, 40.2], [27.5, 39.5], [28.5, 37.5], [28.2, 36.7], [27.9, 35.9], [26.3, 35.2], [23.6, 35.25]] },
  { id: 'eastmed', name: 'Eastern Mediterranean', label: [30.5, 33.3], outline: [[23.6, 35.25], [26.3, 35.2], [27.9, 35.9], [28.2, 36.7], [30, 37.5], [34, 37.4], [36.6, 37.2], [36.6, 34], [35.4, 31.5], [34.3, 30.6], [32, 30.3], [29, 30.2], [25.15, 30.8], [25.15, 31.6]] },
  { id: 'black', name: 'Black Sea', label: [34, 43.3], outline: [[29.1, 41.15], [28.6, 41.3], [27.3, 41.5], [27.3, 43.5], [28, 45.5], [30, 47], [33, 47], [35, 47.5], [40.5, 47.5], [40.5, 45], [40.3, 43.8], [42.3, 42.3], [42, 41.3], [40, 40.6], [36, 40.8], [33, 41.2], [30.1, 40.9]] },
  { id: 'kattegat', name: 'Danish Straits', label: [11.4, 56.6], outline: [[10.6, 57.75], [11.2, 58.9], [12.6, 58.3], [13.3, 56.3], [12.9, 55.4], [12.5, 54.4], [11.5, 53.6], [9.6, 53.9], [9.3, 54.3], [9.5, 56.5]] },
  { id: 'baltic', name: 'Baltic Sea', label: [18.6, 56.3], outline: [[12.5, 54.4], [12.9, 55.4], [13.3, 56.3], [15, 57.5], [17, 59.6], [18.9, 59.95], [22.5, 59], [23.6, 58.9], [24.3, 59], [25.5, 58], [25, 56.5], [22, 55.3], [21, 54.2], [18.5, 53.8], [14.5, 53.3], [12.8, 53.8]] },
  { id: 'bothnia', name: 'Gulfs of Finland and Bothnia', label: [20, 62], outline: [[18.9, 59.95], [17, 59.6], [16.5, 61], [17.5, 63], [20, 64.5], [22, 66.2], [25, 66.2], [26.5, 65], [24, 63], [23, 61.5], [24, 60.8], [26, 60.9], [29, 61], [30.8, 60.3], [30.5, 59.5], [28, 59.1], [24.3, 59], [23.6, 58.9], [22.5, 59]] },
];
/** Which zones a ship can sail between directly. */
const LINKS = [
  ['barents', 'norwegian'], ['norwegian', 'north'], ['norwegian', 'approaches'], ['north', 'approaches'], ['north', 'channel'], ['north', 'kattegat'],
  ['channel', 'approaches'], ['approaches', 'biscay'], ['biscay', 'iberian'], ['iberian', 'westmed'], ['westmed', 'tyrrhenian'], ['tyrrhenian', 'centralmed'],
  ['centralmed', 'adriatic'], ['centralmed', 'aegean'], ['centralmed', 'eastmed'], ['aegean', 'eastmed'], ['aegean', 'black'], ['kattegat', 'baltic'], ['baltic', 'bothnia'],
];


/** The oceans of the rest of the world. Outlines may run over land, and may run past 180 degrees east (they wrap). */
const WORLD_ZONES = [
  { id: 'northatlantic', name: 'North Atlantic', label: [-40, 52], outline: [[-55, 40], [-30, 40], [-30, 62], [-45, 62], [-52, 55], [-52, 47]] },
  { id: 'greenland', name: 'Greenland Sea', label: [-22, 72], outline: [[-46, 59], [-30, 62], [-10, 70], [-10, 84], [-75, 84], [-75, 74], [-58, 70], [-50, 62]] },
  { id: 'labrador', name: 'Labrador Sea and Hudson Bay', label: [-58, 58], outline: [[-95, 50], [-66, 50], [-60, 46], [-52, 47], [-52, 55], [-45, 62], [-50, 62], [-58, 70], [-75, 74], [-95, 70]] },
  { id: 'eastcoast', name: 'American Atlantic Coast', label: [-68, 37], outline: [[-81.5, 24], [-72, 24], [-60, 36], [-55, 40], [-52, 47], [-60, 46], [-66, 50], [-71, 46], [-80, 35], [-82, 30]] },
  { id: 'gulf', name: 'Gulf of Mexico', label: [-90, 25], outline: [[-98, 18], [-86.5, 21], [-80.5, 22.5], [-80.5, 31], [-98, 31]] },
  { id: 'caribbean', name: 'Caribbean Sea', label: [-75, 15], outline: [[-89, 8], [-77, 8], [-60, 8], [-58, 14], [-62, 19], [-70, 21], [-74, 23], [-80.5, 23.6], [-86.5, 21], [-89, 17]] },
  { id: 'centralatlantic', name: 'Central Atlantic', label: [-45, 27], outline: [[-66, 18], [-66, 40], [-30, 40], [-30, 18], [-50, 8], [-58, 8]] },
  { id: 'westafrica', name: 'West African Coast', label: [-20, 8], outline: [[-30, 23], [-13, 23], [-15, 16], [-11, 10.5], [-7, 6.5], [-2, 6.5], [3, 7.5], [7, 6], [10, 4.5], [12.5, -2], [14, -9], [-30, -9]] },
  { id: 'brazil', name: 'Brazilian Coast', label: [-30, -14], outline: [[-62, 11], [-50, 9], [-30, 1], [-25, -9], [-25, -36], [-58, -36], [-50, -27], [-40, -20], [-38, -12], [-35, -6], [-50, -1], [-60, 7]] },
  { id: 'southatlantic', name: 'South Atlantic', label: [-8, -32], outline: [[-25, -9], [14, -9], [14.5, -18], [20, -34], [20, -50], [-70, -58], [-66, -52], [-62, -40], [-58, -36], [-25, -36]] },
  { id: 'redsea', name: 'Red Sea', label: [38, 20], outline: [[32.2, 30.2], [35.2, 29.7], [35.2, 28], [39, 21], [43.5, 12.6], [45.5, 11], [51.5, 12], [51.5, 10], [43, 10.5], [41.5, 13], [38, 17], [33.5, 24], [32.2, 28.5]] },
  { id: 'persiangulf', name: 'Persian Gulf', label: [52, 27], outline: [[47.8, 30.6], [50.5, 30.4], [53, 27.5], [56.2, 27.4], [57.5, 25.6], [56, 24], [51.5, 23.5], [49.5, 25], [48, 28]] },
  { id: 'arabian', name: 'Arabian Sea', label: [63, 15], outline: [[45.5, 11], [51.5, 12], [56, 18], [59, 22], [57.5, 25.6], [62, 25.5], [69, 24.5], [73.5, 20], [75, 12], [76.5, 11], [77.8, 8], [77, 7.5], [73, 0], [52, -2], [51.5, 10]] },
  { id: 'bengal', name: 'Bay of Bengal', label: [88, 14], outline: [[77, 7.5], [80, 14], [82, 17], [87, 21.5], [91.5, 22.5], [94.5, 17], [98.5, 16], [98.5, 8], [95, 5], [90, 1], [78, 1]] },
  { id: 'eastafrica', name: 'East African Coast', label: [52, -12], outline: [[52, -2], [52, 12], [51.5, 12], [51.5, 10], [48, 6], [41, -2], [39, -8], [40.5, -15], [35, -24], [32, -29], [27, -34], [20, -36], [20, -40], [60, -40], [60, -2]] },
  { id: 'indian', name: 'Indian Ocean', label: [95, -20], outline: [[60, -2], [78, 1], [90, 1], [95, 5], [100, -4], [106, -7.5], [115, -9.2], [125, -10.5], [129, -13.5], [122, -18], [113, -22], [114, -35], [118, -35.5], [125, -33], [132, -32], [138, -36], [141, -38.5], [146, -39.5], [148, -44], [60, -44]] },
  { id: 'tasman', name: 'Tasman Sea', label: [162, -38], outline: [[146, -39.5], [150, -37], [153.5, -28], [160, -25], [175, -30], [182, -33], [182, -50], [146, -50], [148, -44]] },
  { id: 'coral', name: 'Coral Sea', label: [155, -18], outline: [[142.5, -10.7], [150, -10.5], [163, -11], [170, -20], [160, -25], [153.5, -28], [150, -23], [146, -19], [143, -14]] },
  { id: 'solomon', name: 'Solomon Sea', label: [155, -8], outline: [[146.5, -6.5], [150, -4.5], [155, -4], [160, -6], [164, -9], [163, -11], [150, -10.5], [146.5, -8.5]] },
  { id: 'bismarck', name: 'Bismarck Sea', label: [146, -2], outline: [[134, -1], [140, -1.5], [146, -1], [152, 0], [156, -2], [155, -4], [150, -4.5], [146.5, -6.5], [144, -4], [138, -2.5]] },
  { id: 'southchina', name: 'South China Sea', label: [114, 14], outline: [[105, 22], [109, 21.5], [113, 22.5], [117, 23.5], [120.3, 22.4], [120.8, 19], [120.5, 14], [119.5, 10], [117, 6], [113.5, 2], [109, 1.5], [104.3, 1.4], [103.5, 5], [101.5, 6.5], [99.5, 8], [99, 10.5], [99.5, 13.7], [101, 13.5], [103, 11.5], [105, 10.5], [106.5, 10], [109.5, 12], [108.5, 16], [106.5, 19]] },
  { id: 'malacca', name: 'Strait of Malacca', label: [99, 4], outline: [[95, 5.5], [98.5, 8], [100.3, 6], [101, 3.5], [103.5, 1.4], [104.3, 1.4], [104.3, 0], [101, 0.5], [97, 4], [95, 5]] },
  { id: 'java', name: 'Java Sea', label: [112, -5], outline: [[104.3, 1.4], [109, 1.5], [110.5, -1.5], [114, -3.8], [117.5, -2], [118, -4.5], [120.5, -5.5], [120.5, -8.5], [115, -9.2], [106, -7.5], [104, -3], [104.3, 0]] },
  { id: 'celebes', name: 'Celebes and Banda Seas', label: [124, -4], outline: [[117, 6], [119.5, 10], [123, 10], [126, 7.5], [128, 3], [131, -1], [133, -4], [132, -8.5], [125, -10.5], [120.5, -8.5], [120.5, -5.5], [118, -4.5], [117.5, -2], [118.5, 1], [117.5, 4]] },
  { id: 'arafura', name: 'Timor and Arafura Seas', label: [132, -10], outline: [[120.5, -8.5], [125, -10.5], [132, -8.5], [138, -8], [142.5, -10.7], [143, -14], [136, -16], [130, -15], [129, -13.5], [125, -10.5]] },
  { id: 'philippine', name: 'Philippine Sea', label: [131, 15], outline: [[121.5, 18.5], [122.5, 12], [126, 7.5], [128, 3], [134, 2], [140, 8], [140, 26], [131, 30], [125, 25.5], [122, 22]] },
  { id: 'marianas', name: 'Mariana Islands', label: [145, 18], outline: [[140, 8], [150, 10], [151, 24], [148, 31], [140, 31], [140, 26]] },
  { id: 'eastchina', name: 'East China and Yellow Seas', label: [124, 31], outline: [[117, 23.5], [120.3, 22.4], [122, 22], [125, 25.5], [131, 30], [130.2, 31.5], [130.3, 33.6], [129, 34.8], [126.5, 34.2], [126, 37.5], [124.5, 40], [122, 41.5], [117, 40], [117, 38], [120, 34], [121.5, 31], [121, 28]] },
  { id: 'japansea', name: 'Sea of Japan', label: [135, 40], outline: [[129, 34.8], [130.3, 33.6], [131.5, 34.5], [133, 35.6], [136, 36], [139.8, 40], [140, 42.5], [141.2, 45.5], [141.8, 46], [142, 52], [140.5, 52], [138, 47], [133, 42.5], [129.7, 40.5], [129.5, 36]] },
  { id: 'okhotsk', name: 'Sea of Okhotsk', label: [149, 53], outline: [[140.5, 52], [142, 52], [143.5, 50], [143.5, 46], [145.3, 44], [146, 44], [151, 46], [157, 51], [156.5, 58], [151, 60], [143, 59.5], [137, 55]] },
  { id: 'japanwaters', name: 'Pacific Coast of Japan', label: [141, 33], outline: [[130.2, 31.5], [131, 30], [140, 26], [140, 31], [148, 31], [150, 38], [148, 44], [146, 44], [145.3, 44], [143.5, 42], [141.5, 41.5], [141.8, 39], [141, 36], [139.5, 34.7], [136.5, 33.8], [135, 34.4], [133, 34.6], [132, 34], [131.5, 33.5], [131, 32]] },
  { id: 'bering', name: 'Bering Sea', label: [180, 58], outline: [[162, 56], [163, 60], [172, 66.5], [192, 66.5], [196, 63], [200, 59], [197, 55], [188, 51.5], [176, 52], [168, 54]] },
  { id: 'northpacific', name: 'North Pacific', label: [182, 45], outline: [[148, 31], [150, 38], [148, 44], [151, 46], [157, 51], [162, 56], [168, 54], [176, 52], [188, 51.5], [197, 55], [210, 59.5], [222, 59.5], [226, 56], [226, 45], [208, 31]] },
  { id: 'westcoast', name: 'American Pacific Coast', label: [-128, 32], outline: [[-134, 45], [-136, 59.5], [-130, 55], [-123, 48.5], [-124, 40], [-117, 32.5], [-110, 23], [-105, 19.5], [-96, 15.5], [-92, 14.5], [-110, 12], [-130, 25]] },
  { id: 'hawaii', name: 'Hawaiian Waters', label: [200, 24], outline: [[176, 15], [208, 15], [208, 31], [176, 31]] },
  { id: 'centralpacific', name: 'Central Pacific', label: [166, 8], outline: [[150, 10], [140, 8], [134, 2], [152, 0], [156, -2], [160, -6], [164, -9], [176, -6], [188, -6], [188, 15], [176, 15], [176, 31], [151, 24]] },
  { id: 'southpacific', name: 'South Pacific', label: [190, -18], outline: [[164, -9], [176, -6], [188, -6], [232, -6], [232, -32], [182, -33], [175, -30], [170, -20], [163, -11]] },
  { id: 'eastpacific', name: 'Eastern Pacific', label: [-95, -15], outline: [[-110, 12], [-92, 14.5], [-87, 12.5], [-83, 8.5], [-79.5, 7.5], [-77.5, 4], [-80.5, -1], [-81.5, -6], [-76, -14.5], [-70.5, -18], [-70.5, -28], [-72, -37], [-74, -44], [-75.5, -51], [-70, -58], [-128, -58], [-128, 12]] },
  { id: 'arctic', name: 'Arctic Ocean', label: [100, 78], outline: [[46, 66.5], [46, 81], [192, 81], [192, 66.5], [172, 66.5], [140, 71], [110, 73.5], [80, 72], [70, 66.5], [60, 68]] },
];
/** Which of the new zones a ship can sail between, and the old zones they open onto. */
const WORLD_LINKS = [
  ['approaches', 'northatlantic'], ['iberian', 'centralatlantic'], ['iberian', 'westafrica'], ['norwegian', 'greenland'], ['barents', 'arctic'], ['eastmed', 'redsea'],
  ['northatlantic', 'greenland'], ['northatlantic', 'labrador'], ['northatlantic', 'eastcoast'], ['northatlantic', 'centralatlantic'], ['labrador', 'greenland'],
  ['eastcoast', 'centralatlantic'], ['eastcoast', 'gulf'], ['eastcoast', 'caribbean'], ['gulf', 'caribbean'], ['caribbean', 'centralatlantic'], ['caribbean', 'brazil'], ['caribbean', 'eastpacific'],
  ['centralatlantic', 'westafrica'], ['centralatlantic', 'brazil'], ['westafrica', 'brazil'], ['westafrica', 'southatlantic'], ['brazil', 'southatlantic'], ['southatlantic', 'eastpacific'],
  ['southatlantic', 'eastafrica'], ['redsea', 'arabian'], ['arabian', 'persiangulf'], ['arabian', 'eastafrica'], ['arabian', 'bengal'], ['arabian', 'indian'], ['eastafrica', 'indian'],
  ['bengal', 'indian'], ['bengal', 'malacca'], ['malacca', 'southchina'], ['malacca', 'java'], ['malacca', 'indian'], ['java', 'indian'], ['java', 'celebes'], ['java', 'southchina'],
  ['celebes', 'southchina'], ['celebes', 'philippine'], ['celebes', 'arafura'], ['celebes', 'bismarck'], ['arafura', 'indian'], ['arafura', 'coral'], ['indian', 'tasman'], ['tasman', 'coral'],
  ['tasman', 'southpacific'], ['coral', 'solomon'], ['coral', 'southpacific'], ['solomon', 'bismarck'], ['solomon', 'centralpacific'], ['solomon', 'southpacific'], ['bismarck', 'philippine'],
  ['bismarck', 'centralpacific'], ['philippine', 'southchina'], ['philippine', 'eastchina'], ['philippine', 'marianas'], ['philippine', 'centralpacific'], ['philippine', 'japanwaters'],
  ['marianas', 'centralpacific'], ['marianas', 'japanwaters'], ['marianas', 'northpacific'], ['eastchina', 'japansea'], ['eastchina', 'japanwaters'], ['eastchina', 'southchina'],
  ['japansea', 'okhotsk'], ['japansea', 'japanwaters'], ['okhotsk', 'northpacific'], ['japanwaters', 'northpacific'], ['northpacific', 'bering'], ['northpacific', 'hawaii'],
  ['northpacific', 'westcoast'], ['northpacific', 'centralpacific'], ['hawaii', 'centralpacific'], ['hawaii', 'westcoast'], ['hawaii', 'southpacific'], ['westcoast', 'eastpacific'],
  ['centralpacific', 'southpacific'], ['southpacific', 'eastpacific'], ['bering', 'arctic'],
];
/** Days to sail from one zone to a neighbour: 2 around Europe, otherwise the distance between their centres at 450 km a day. */
const KM_PER_DAY = 450;
const distanceKm = (a, b) => {
  const r = Math.PI / 180;
  const h = Math.sin(((b[1] - a[1]) * r) / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(((b[0] - a[0]) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const ALL = [...ZONES, ...WORLD_ZONES];
const OLD = ZONES.length;
const linkDays = (a, b) => (a < OLD && b < OLD ? 2 : Math.max(2, Math.round(distanceKm(ALL[a].label, ALL[b].label) / KM_PER_DAY)));

const inside = ([x, y], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
/** Inside an outline that may run past 180 degrees: try the point a turn east and west as well. */
const insideWrapped = ([x, y], poly) => inside([x, y], poly) || inside([x + 360, y], poly) || inside([x - 360, y], poly);

/** For each province of a drawing, the zones its coastline lies in. Coastline = the arcs no other province shares. */
function coastsOf(topo, zones, wanted) {
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => [(x += dx) * scale[0] + translate[0], (y += dy) * scale[1] + translate[1]]);
  });
  const users = new Map();
  topo.objects.provinces.geometries.forEach((g, id) => {
    const walk = (a) => (Array.isArray(a) ? a.forEach(walk) : (users.get(a < 0 ? ~a : a) ?? users.set(a < 0 ? ~a : a, new Set()).get(a < 0 ? ~a : a)).add(id));
    walk(g.arcs);
  });
  const coast = {};
  for (const [arc, ids] of users) {
    if (ids.size !== 1) continue;
    const [id] = ids;
    if (!wanted(id)) continue;
    const found = new Map();
    for (const point of arcs[arc]) for (let z = 0; z < zones.length; z++) if (insideWrapped(point, zones[z].outline)) found.set(z, (found.get(z) ?? 0) + 1);
    // A tiny island may have only a point or two of coastline after simplification.
    const small = arcs[arc].length <= 6;
    for (const [n, z] of [...found].map(([z, n]) => [n, z])) if (n >= 2 || small) (coast[id] ??= new Set()).add(z);
  }
  return coast;
}
const provinces = JSON.parse(fs.readFileSync('src/content/map/world1936.json', 'utf8'));
const EUROPE = provinces.europe;
// The 1.6 map: its own drawing, its own 17 zones.
const coast = coastsOf(JSON.parse(fs.readFileSync('.cache/europe1936.topo.json', 'utf8')), ZONES, (id) => id < EUROPE);
// The rest of the world: the world drawing, every zone.
Object.assign(coast, coastsOf(JSON.parse(fs.readFileSync('src/content/map/world1936.topo.json', 'utf8')), ALL, (id) => id >= EUROPE));

const allLinks = [...LINKS, ...WORLD_LINKS].map(([a, b]) => [ALL.findIndex((z) => z.id === a), ALL.findIndex((z) => z.id === b)]);
for (const [a, b] of allLinks) if (a < 0 || b < 0) throw new Error(`Bad sea link ${a} ${b}`);
const out = {
  zones: ALL.map((z, i) => {
    const near = allLinks.filter((l) => l.includes(i)).map((l) => (l[0] === i ? l[1] : l[0])).sort((a, b) => a - b);
    return { ...z, neighbours: near, days: near.map((n) => linkDays(i, n)) };
  }),
  europe: OLD,
  coast: Object.fromEntries(Object.entries(coast).map(([id, set]) => [id, [...set].sort((a, b) => a - b)])),
};
fs.writeFileSync('src/content/map/sea.json', JSON.stringify(out));
const P = provinces.provinces;
for (let z = 0; z < ALL.length; z++) console.log(`${ALL[z].name}: ${Object.keys(out.coast).filter((id) => out.coast[id].includes(z)).map((id) => P[id].name).join(', ')}`);
console.log(`${Object.keys(out.coast).length} of ${P.length} provinces have a coast.`);
const islands = P.filter((p) => !p.neighbours.length && !out.coast[p.id]?.length);
if (islands.length) console.log('ISLANDS WITH NO SEA ZONE:', islands.map((p) => p.name).join(', '));
for (const z of out.zones) if (z.days.some((d) => d > 2)) console.log(`${z.name}: ${z.neighbours.map((n, i) => `${ALL[n].name} ${z.days[i]}d`).join(', ')}`);
