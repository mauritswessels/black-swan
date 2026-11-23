/**
 * The rest of the world (Stage M1), used by build-map.mjs.
 *
 * The map of Europe, North Africa and the Near East is built first, exactly as in version 1.6, so
 * its 280 provinces keep their numbers, shapes, neighbours and everything else. This file adds the
 * provinces of the rest of the world after them, from the Natural Earth regions that the European
 * map left out:
 *
 *   1. each region goes to the country that held it in 1936 (worldOwner),
 *   2. a few regions are cut along a line first, where a 1936 border ran through them (CLIPS),
 *   3. the regions of each zone are grouped into provinces (the same k-means as for Europe, with
 *      its own seeded random numbers so that the European map does not change),
 *   4. the biggest provinces near the fronts of the Chinese war are cut in two (SPLITS),
 *   5. every coordinate is snapped to the grid of the European map first, so that where the two
 *      maps meet (the Urals, Iran, Arabia, the Sahara) they share their borders point for point.
 *
 * The rest of the world uses the same rules as Europe, except that provinces that belonged to one
 * of the 31 countries of the 1.6 map (British India, Siberia, the colonies in Africa) count no
 * victory points yet: the colonial rules come in a later stage.
 */
import { merge, neighbors } from 'topojson-client';
import { topology } from 'topojson-server';
import { geoArea, geoCentroid, geoContains, geoDistance } from 'd3-geo';
import { makeCutter } from './map-cut.mjs';

/** Modern countries that were part of a 1936 one (Natural Earth "admin" name -> 1936 owner). */
const WORLD = {
  'United States of America': 'United States', 'Puerto Rico': 'United States', Guam: 'United States', Philippines: 'United States', 'American Samoa': 'United States',
  'United States Minor Outlying Islands': 'United States',
  Japan: 'Japan', 'North Korea': 'Japan', 'South Korea': 'Japan', Taiwan: 'Japan', Palau: 'Japan', 'Northern Mariana Islands': 'Japan', 'Federated States of Micronesia': 'Japan', 'Marshall Islands': 'Japan',
  China: 'China', Mongolia: 'Mongolia', Thailand: 'Siam',
  Kazakhstan: 'Soviet Union', Uzbekistan: 'Soviet Union', Turkmenistan: 'Soviet Union', Kyrgyzstan: 'Soviet Union', Tajikistan: 'Soviet Union', 'Baykonur Cosmodrome': 'Soviet Union',
  India: 'United Kingdom', Pakistan: 'United Kingdom', Bangladesh: 'United Kingdom', Bhutan: 'United Kingdom', 'Siachen Glacier': 'United Kingdom', Myanmar: 'United Kingdom', 'Sri Lanka': 'United Kingdom',
  Malaysia: 'United Kingdom', Singapore: 'United Kingdom', Brunei: 'United Kingdom', 'Hong Kong S.A.R.': 'United Kingdom', Kuwait: 'United Kingdom', Bahrain: 'United Kingdom', Qatar: 'United Kingdom',
  'United Arab Emirates': 'United Kingdom', Sudan: 'United Kingdom', 'S. Sudan': 'United Kingdom', Somaliland: 'United Kingdom', Kenya: 'United Kingdom', Uganda: 'United Kingdom',
  'United Republic of Tanzania': 'United Kingdom', Zambia: 'United Kingdom', Malawi: 'United Kingdom', Zimbabwe: 'United Kingdom', Botswana: 'United Kingdom', Lesotho: 'United Kingdom',
  Swaziland: 'United Kingdom', Nigeria: 'United Kingdom', Ghana: 'United Kingdom', 'Sierra Leone': 'United Kingdom', Gambia: 'United Kingdom', Guyana: 'United Kingdom', Belize: 'United Kingdom',
  Jamaica: 'United Kingdom', 'The Bahamas': 'United Kingdom', 'Trinidad and Tobago': 'United Kingdom', Bermuda: 'United Kingdom', 'Falkland Islands': 'United Kingdom', 'Solomon Islands': 'United Kingdom',
  Fiji: 'United Kingdom', Kiribati: 'United Kingdom', Vanuatu: 'United Kingdom', Tonga: 'United Kingdom',
  Vietnam: 'France', Laos: 'France', Cambodia: 'France', Senegal: 'France', Mauritania: 'France', Mali: 'France', Guinea: 'France', 'Ivory Coast': 'France', 'Burkina Faso': 'France', Niger: 'France',
  Benin: 'France', Togo: 'France', Chad: 'France', 'Central African Republic': 'France', 'Republic of the Congo': 'France', Gabon: 'France', Cameroon: 'France', Madagascar: 'France', Djibouti: 'France',
  'New Caledonia': 'France', 'French Polynesia': 'France',
  Indonesia: 'Netherlands', Suriname: 'Netherlands',
  'East Timor': 'Portugal', 'Macau S.A.R': 'Portugal', Angola: 'Portugal', Mozambique: 'Portugal', 'Guinea Bissau': 'Portugal',
  'Democratic Republic of the Congo': 'Belgium', Rwanda: 'Belgium', Burundi: 'Belgium',
  'Western Sahara': 'Spain', 'Equatorial Guinea': 'Spain', Eritrea: 'Italy', Somalia: 'Italy',
  Greenland: 'Denmark', 'Faroe Islands': 'Denmark', Iceland: 'Iceland',
  Canada: 'Canada', Australia: 'Australia', 'Papua New Guinea': 'Australia', Nauru: 'Australia', 'New Zealand': 'New Zealand', Samoa: 'New Zealand', 'South Africa': 'South Africa', Namibia: 'South Africa',
  Iran: 'Iran', Afghanistan: 'Afghanistan', 'Saudi Arabia': 'Saudi Arabia', Yemen: 'Yemen', Oman: 'Oman', Nepal: 'Nepal', Ethiopia: 'Ethiopia', Liberia: 'Liberia',
  Mexico: 'Mexico', Guatemala: 'Guatemala', Honduras: 'Honduras', 'El Salvador': 'El Salvador', Nicaragua: 'Nicaragua', 'Costa Rica': 'Costa Rica', Panama: 'Panama', Cuba: 'Cuba', Haiti: 'Haiti',
  'Dominican Republic': 'Dominican Republic', Colombia: 'Colombia', Venezuela: 'Venezuela', Ecuador: 'Ecuador', Peru: 'Peru', Bolivia: 'Bolivia', Paraguay: 'Paraguay', Uruguay: 'Uruguay', Chile: 'Chile',
  Argentina: 'Argentina', Brazil: 'Brazil',
};
/** Modern regions held by someone else in 1936: "Modern country/Region name" -> 1936 owner. */
const MOVED = {
  'Canada/Newfoundland and Labrador': 'United Kingdom',
  'China/Heilongjiang': 'Manchukuo', 'China/Jilin': 'Manchukuo', 'China/Liaoning': 'Manchukuo',
  'Morocco/Laâyoune - Boujdour - Sakia El Hamra': 'Spain', 'Morocco/Oued el Dahab': 'Spain',
  'Yemen/Hadramawt': 'United Kingdom', 'Yemen/Al Mahrah': 'United Kingdom', 'Yemen/Lahij': 'United Kingdom', 'Yemen/`Adan': 'United Kingdom', 'Yemen/Abyan': 'United Kingdom',
  'Yemen/Shabwah': 'United Kingdom', "Yemen/Al Dali'": 'United Kingdom',
};
/** Left off the map: Antarctica, the smallest islands, and the micro-states that the European map leaves out too. */
const DROP_ADMIN = new Set([
  'Antarctica', 'French Southern and Antarctic Lands', 'Heard Island and McDonald Islands', 'South Georgia and the Islands', 'Pitcairn Islands', 'Tuvalu', 'Niue', 'Cook Islands', 'Wallis and Futuna',
  'Norfolk Island', 'Coral Sea Islands', 'Ashmore and Cartier Islands', 'Spratly Is.', 'Clipperton Island', 'Indian Ocean Territories', 'British Indian Ocean Territory', 'Seychelles', 'Maldives',
  'Mauritius', 'Comoros', 'Cape Verde', 'Sao Tome and Principe', 'Saint Helena', 'Saint Pierre and Miquelon', 'Anguilla', 'Montserrat', 'Saint Kitts and Nevis', 'Antigua and Barbuda', 'Dominica',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Grenada', 'Barbados', 'United States Virgin Islands', 'British Virgin Islands', 'Saint Martin', 'Sint Maarten', 'Saint Barthelemy',
  'Caribbean Netherlands', 'Curaçao', 'Aruba', 'Turks and Caicos Islands', 'Cayman Islands', 'US Naval Base Guantanamo Bay', 'Liechtenstein', 'Andorra', 'Monaco', 'San Marino', 'Vatican',
]);
const DROP_REGION = new Set(['Norway/Svalbard', 'Norway/Bouvet Island', 'China/Paracel Islands', 'India/Lakshadweep', 'Australia/Macquarie Island', 'Australia/Lord Howe Island', 'Australia/Jervis Bay Territory',
  'France/Martinique', 'France/Guadeloupe', 'France/La Réunion', 'France/Mayotte']);
const KEEP_MINOR_ISLANDS = new Set(['Midway Islands', 'Wake Atoll']);

/** Pieces of a region to leave out: far islands (Easter Island, the Galápagos, the Chathams). [admin, test on the piece's centre]. */
const DROP_PART = [
  ['Chile', ([lon]) => lon < -80], ['Ecuador', ([lon]) => lon < -85], ['New Zealand', ([lon, lat]) => lon < 0 || lat < -47.5], ['South Africa', ([, lat]) => lat < -40],
  ['Brazil', ([lon]) => lon > -32],
];

/**
 * Regions cut by a 1936 border: [admin/name, axis (0 longitude, 1 latitude), value, [name and owner below the line], [name and owner above it]].
 * The Kuril Islands, which go with south Sakhalin, are taken out of Sakhalin first (pieces east of 144.5).
 */
const CLIPS = [
  ['Russia/Sakhalin', 1, 50, ['Karafuto', 'Japan'], ['North Sakhalin', 'Soviet Union']],
  ['China/Shaanxi', 1, 36, ['South Shaanxi', 'China'], ['North Shaanxi', 'Chinese Communists']],
  ['China/Inner Mongol', 0, 116.5, ['Suiyuan', 'China'], ['Hsingan', 'Manchukuo']],
];
/** Pieces split off a region whole: [admin/name, test on the piece's centre, new name, owner]. */
const PIECES = [
  ['Russia/Sakhalin', ([lon]) => lon > 144.5, 'Kuril Islands', 'Japan'],
  ['Japan/Tokyo', ([, lat]) => lat < 30, 'Bonin Islands', 'Japan'],
];

const A = (...names) => (p) => names.includes(p.admin);
const N = (admin, ...names) => (p) => p.admin === admin && names.includes(p.name);
const NAME = (...names) => (p) => names.includes(p.name);
/** [1936 owner, zone name, number of provinces, test]. A region goes to the first zone of its owner whose test passes. */
const ZONES = [
  // Japan and its empire
  ['Japan', 'Hokkaidō', 1, N('Japan', 'Hokkaidō')],
  ['Japan', 'Tōhoku', 1, N('Japan', 'Aomori', 'Iwate', 'Akita', 'Miyagi', 'Yamagata', 'Fukushima', 'Niigata')],
  ['Japan', 'Kantō', 1, N('Japan', 'Tokyo', 'Kanagawa', 'Chiba', 'Saitama', 'Ibaraki', 'Tochigi', 'Gunma', 'Yamanashi')],
  ['Japan', 'Chūbu', 1, N('Japan', 'Toyama', 'Ishikawa', 'Fukui', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi')],
  ['Japan', 'Kansai', 1, N('Japan', 'Ōsaka', 'Kyōto', 'Hyōgo', 'Nara', 'Wakayama', 'Mie', 'Shiga')],
  ['Japan', 'Chūgoku', 1, N('Japan', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Shimane', 'Tottori')],
  ['Japan', 'Shikoku', 1, N('Japan', 'Tokushima', 'Kagawa', 'Ehime', 'Kōchi')],
  ['Japan', 'Kyūshū', 1, N('Japan', 'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Ōita', 'Miyazaki', 'Kagoshima')],
  ['Japan', 'Okinawa', 1, N('Japan', 'Okinawa')], ['Japan', 'Bonin Islands', 1, NAME('Bonin Islands')],
  ['Japan', 'Karafuto', 1, NAME('Karafuto')], ['Japan', 'Kuril Islands', 1, NAME('Kuril Islands')],
  ['Japan', 'Formosa', 1, A('Taiwan')], ['Japan', 'Korea', 3, A('North Korea', 'South Korea')],
  ['Japan', 'Palau', 1, A('Palau')], ['Japan', 'Caroline Islands', 1, A('Federated States of Micronesia')], ['Japan', 'Marshall Islands', 1, A('Marshall Islands')],
  ['Japan', 'Mariana Islands', 1, A('Northern Mariana Islands')],
  // Manchukuo, China, the Chinese Communists, Mongolia
  ['Manchukuo', 'Heilungkiang', 1, N('China', 'Heilongjiang')], ['Manchukuo', 'Kirin', 1, N('China', 'Jilin')], ['Manchukuo', 'Fengtien', 1, N('China', 'Liaoning')],
  ['Manchukuo', 'Hsingan', 1, NAME('Hsingan')],
  ['Chinese Communists', 'Yenan', 1, NAME('North Shaanxi')],
  ['China', 'Shensi', 1, NAME('South Shaanxi')], ['China', 'Suiyuan', 1, NAME('Suiyuan')],
  ['China', 'Sinkiang', 1, N('China', 'Xinjiang')], ['China', 'Tibet', 1, N('China', 'Xizang')], ['China', 'Tsinghai', 1, N('China', 'Qinghai')], ['China', 'Kansu', 1, N('China', 'Gansu')],
  ['China', 'Ningsia', 1, N('China', 'Ningxia')], ['China', 'Shansi', 1, N('China', 'Shanxi')], ['China', 'Peiping', 1, N('China', 'Beijing', 'Tianjin')], ['China', 'Hopeh', 1, N('China', 'Hebei')],
  ['China', 'Shantung', 1, N('China', 'Shandong')], ['China', 'Honan', 1, N('China', 'Henan')], ['China', 'Hupeh', 1, N('China', 'Hubei')], ['China', 'Anhwei', 1, N('China', 'Anhui')],
  ['China', 'Kiangsu', 1, N('China', 'Jiangsu')], ['China', 'Shanghai', 1, N('China', 'Shanghai')], ['China', 'Chekiang', 1, N('China', 'Zhejiang')], ['China', 'Kiangsi', 1, N('China', 'Jiangxi')],
  ['China', 'Hunan', 1, N('China', 'Hunan')], ['China', 'Fukien', 1, N('China', 'Fujian')], ['China', 'Kwangtung', 1, N('China', 'Guangdong')], ['China', 'Hainan', 1, N('China', 'Hainan')],
  ['China', 'Kwangsi', 1, N('China', 'Guangxi')], ['China', 'Kweichow', 1, N('China', 'Guizhou')], ['China', 'Yunnan', 1, N('China', 'Yunnan')], ['China', 'Szechwan', 1, N('China', 'Sichuan')],
  ['China', 'Chungking', 1, N('China', 'Chongqing')],
  ['Mongolia', 'Mongolia', 3, A('Mongolia')],
  // The Soviet Union east of the Volga
  ['Soviet Union', 'North Sakhalin', 1, NAME('North Sakhalin')],
  ['Soviet Union', 'Volga and Urals', 7, (p) => p.admin === 'Russia' && p.longitude < 66],
  ['Soviet Union', 'Western Siberia', 4, (p) => p.admin === 'Russia' && p.longitude < 90],
  ['Soviet Union', 'Eastern Siberia', 5, (p) => p.admin === 'Russia' && (p.longitude < 125 || /Sakha/.test(p.name))],
  ['Soviet Union', 'Soviet Far East', 5, A('Russia')],
  ['Soviet Union', 'Kazakhstan', 4, A('Kazakhstan', 'Baykonur Cosmodrome')], ['Soviet Union', 'Uzbekistan', 1, A('Uzbekistan')], ['Soviet Union', 'Turkmenia', 1, A('Turkmenistan')],
  ['Soviet Union', 'Kirghizia', 1, A('Kyrgyzstan', 'Tajikistan')],
  // The British Empire
  ['United Kingdom', 'Andaman Islands', 1, N('India', 'Andaman and Nicobar')], 
  ['United Kingdom', 'Kashmir', 1, (p) => N('India', 'Jammu and Kashmir', 'Ladakh')(p) || N('Pakistan', 'Azad Kashmir', 'Northern Areas')(p) || A('Siachen Glacier')(p)],
  ['United Kingdom', 'North-West Frontier', 1, N('Pakistan', 'K.P.', 'F.A.T.A.')], ['United Kingdom', 'Sind and Baluchistan', 1, N('Pakistan', 'Sind', 'Baluchistan')],
  ['United Kingdom', 'Punjab', 1, (p) => A('Pakistan')(p) || N('India', 'Punjab', 'Haryana', 'Chandigarh', 'Himachal Pradesh')(p)],
  ['United Kingdom', 'Rajputana', 1, N('India', 'Rajasthan', 'Gujarat', 'Dadra and Nagar Haveli and Daman and Diu')],
  ['United Kingdom', 'United Provinces', 1, N('India', 'Uttar Pradesh', 'Uttarakhand', 'Delhi')], ['United Kingdom', 'Bihar and Orissa', 1, N('India', 'Bihar', 'Jharkhand', 'Odisha')],
  ['United Kingdom', 'Bengal', 1, (p) => A('Bangladesh', 'Bhutan')(p) || N('India', 'West Bengal', 'Sikkim', 'Tripura')(p)], ['United Kingdom', 'Central Provinces', 1, N('India', 'Madhya Pradesh', 'Chhattisgarh')],
  ['United Kingdom', 'Bombay', 1, N('India', 'Maharashtra', 'Goa')], ['United Kingdom', 'Hyderabad', 1, N('India', 'Telangana')], ['United Kingdom', 'Mysore', 1, N('India', 'Karnataka')],
  ['United Kingdom', 'Madras', 1, N('India', 'Andhra Pradesh', 'Tamil Nadu', 'Puducherry', 'Kerala')], ['United Kingdom', 'Assam', 1, A('India')],
  ['United Kingdom', 'Ceylon', 1, A('Sri Lanka')], ['United Kingdom', 'Burma', 2, A('Myanmar')], ['United Kingdom', 'Malaya', 2, A('Malaysia', 'Singapore', 'Brunei')], ['United Kingdom', 'Hong Kong', 1, A('Hong Kong S.A.R.')],
  ['United Kingdom', 'Kuwait', 1, A('Kuwait')], ['United Kingdom', 'Trucial Coast', 1, A('Bahrain', 'Qatar', 'United Arab Emirates')], ['United Kingdom', 'Aden', 1, A('Yemen')],
  ['United Kingdom', 'Sudan', 2, A('Sudan', 'S. Sudan')], ['United Kingdom', 'British Somaliland', 1, A('Somaliland')], ['United Kingdom', 'Kenya', 1, A('Kenya')], ['United Kingdom', 'Uganda', 1, A('Uganda')],
  ['United Kingdom', 'Tanganyika', 1, A('United Republic of Tanzania')], ['United Kingdom', 'Northern Rhodesia', 1, A('Zambia')], ['United Kingdom', 'Nyasaland', 1, A('Malawi')], ['United Kingdom', 'Southern Rhodesia', 1, A('Zimbabwe')], ['United Kingdom', 'Bechuanaland', 1, A('Botswana')],
  ['United Kingdom', 'Basutoland', 1, A('Lesotho')], ['United Kingdom', 'Swaziland', 1, A('Swaziland')], ['United Kingdom', 'Nigeria', 2, A('Nigeria')], ['United Kingdom', 'Gold Coast', 1, A('Ghana')],
  ['United Kingdom', 'Sierra Leone', 1, A('Sierra Leone')], ['United Kingdom', 'Gambia', 1, A('Gambia')],
  ['United Kingdom', 'Newfoundland', 1, A('Canada')], ['United Kingdom', 'British Guiana', 1, A('Guyana')], ['United Kingdom', 'British Honduras', 1, A('Belize')], ['United Kingdom', 'Jamaica', 1, A('Jamaica')],
  ['United Kingdom', 'Bahamas', 1, A('The Bahamas')], ['United Kingdom', 'Trinidad', 1, A('Trinidad and Tobago')], ['United Kingdom', 'Bermuda', 1, A('Bermuda')], ['United Kingdom', 'Falkland Islands', 1, A('Falkland Islands')],
  ['United Kingdom', 'Solomon Islands', 1, A('Solomon Islands')], ['United Kingdom', 'Fiji', 1, A('Fiji')], ['United Kingdom', 'Gilbert Islands', 1, A('Kiribati')], ['United Kingdom', 'New Hebrides', 1, A('Vanuatu')],
  ['United Kingdom', 'Tonga', 1, A('Tonga')],
  // France
  ['France', 'French Guiana', 1, A('France')], ['France', 'Southern Algeria', 2, A('Algeria')], ['France', 'Southern Morocco', 1, A('Morocco')],
  ['France', 'Mauritania', 1, A('Mauritania')], ['France', 'Senegal', 1, A('Senegal')], ['France', 'French Guinea', 1, A('Guinea')], ['France', 'French Sudan', 2, A('Mali')], ['France', 'Ivory Coast', 1, A('Ivory Coast')],
  ['France', 'Upper Volta', 1, A('Burkina Faso')], ['France', 'Niger', 1, A('Niger')], ['France', 'Dahomey and Togo', 1, A('Benin', 'Togo')], ['France', 'Chad', 1, A('Chad')],
  ['France', 'Ubangi-Shari', 1, A('Central African Republic')], ['France', 'French Congo', 1, A('Republic of the Congo', 'Gabon')], ['France', 'Cameroun', 1, A('Cameroon')], ['France', 'Madagascar', 1, A('Madagascar')],
  ['France', 'French Somaliland', 1, A('Djibouti')], ['France', 'Tonkin', 1, (p) => p.admin === 'Vietnam' && p.latitude >= 19.6], ['France', 'Annam', 1, (p) => p.admin === 'Vietnam' && p.latitude >= 11.6],
  ['France', 'Cochinchina', 1, A('Vietnam')], ['France', 'Cambodia', 1, A('Cambodia')], ['France', 'Laos', 1, A('Laos')], ['France', 'New Caledonia', 1, A('New Caledonia')], ['France', 'Tahiti', 1, A('French Polynesia')],
  // The other colonial empires
  ['Netherlands', 'Northern Sumatra', 1, N('Indonesia', 'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau')],
  ['Netherlands', 'Southern Sumatra', 1, N('Indonesia', 'Jambi', 'Sumatera Selatan', 'Lampung', 'Bengkulu', 'Bangka-Belitung')], ['Netherlands', 'Western Java', 1, N('Indonesia', 'Jakarta Raya', 'Banten', 'Jawa Barat')],
  ['Netherlands', 'Eastern Java', 1, N('Indonesia', 'Jawa Tengah', 'Yogyakarta', 'Jawa Timur')], ['Netherlands', 'Lesser Sunda Islands', 1, N('Indonesia', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur')],
  ['Netherlands', 'Western Borneo', 1, N('Indonesia', 'Kalimantan Barat', 'Kalimantan Tengah')], ['Netherlands', 'Eastern Borneo', 1, N('Indonesia', 'Kalimantan Timur', 'Kalimantan Selatan')],
  ['Netherlands', 'Moluccas', 1, N('Indonesia', 'Maluku', 'Maluku Utara')], ['Netherlands', 'Dutch New Guinea', 1, N('Indonesia', 'Papua', 'Papua Barat')], ['Netherlands', 'Celebes', 1, A('Indonesia')], ['Netherlands', 'Dutch Guiana', 1, A('Suriname')],
  ['Portugal', 'Azores', 1, N('Portugal', 'Azores')], ['Portugal', 'Madeira', 1, N('Portugal', 'Madeira')], ['Portugal', 'Portuguese Timor', 1, A('East Timor')], ['Portugal', 'Macau', 1, A('Macau S.A.R')],
  ['Portugal', 'Angola', 2, A('Angola')], ['Portugal', 'Mozambique', 2, A('Mozambique')], ['Portugal', 'Portuguese Guinea', 1, A('Guinea Bissau')],
  ['Belgium', 'Belgian Congo', 3, A('Democratic Republic of the Congo', 'Rwanda', 'Burundi')],
  ['Spain', 'Canary Islands', 1, A('Spain')], ['Spain', 'Rio de Oro', 1, A('Western Sahara', 'Morocco')], ['Spain', 'Spanish Guinea', 1, A('Equatorial Guinea')],
  ['Italy', 'Eritrea', 1, A('Eritrea')], ['Italy', 'Italian Somaliland', 1, A('Somalia')], ['Italy', 'Fezzan', 2, A('Libya')],
  ['Egypt', 'Upper Egypt', 3, A('Egypt')],
  ['Denmark', 'Greenland', 1, A('Greenland')], ['Denmark', 'Faroe Islands', 1, A('Faroe Islands')], ['Iceland', 'Iceland', 1, () => true],
  // The United States
  ['United States', 'Alaska', 1, N('United States of America', 'Alaska')], ['United States', 'Hawaii', 1, N('United States of America', 'Hawaii')],
  ['United States', 'New England', 1, N('United States of America', 'Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut')],
  ['United States', 'New York', 1, N('United States of America', 'New York', 'New Jersey')],
  ['United States', 'Pennsylvania', 1, N('United States of America', 'Pennsylvania', 'Delaware')],
  ['United States', 'Virginia', 1, N('United States of America', 'Virginia', 'Maryland', 'District of Columbia', 'West Virginia')],
  ['United States', 'Carolinas', 1, N('United States of America', 'North Carolina', 'South Carolina')],
  ['United States', 'Florida', 1, N('United States of America', 'Florida', 'Georgia')],
  ['United States', 'Alabama', 1, N('United States of America', 'Alabama', 'Mississippi')],
  ['United States', 'Tennessee', 1, N('United States of America', 'Tennessee', 'Kentucky')],
  ['United States', 'Ohio', 1, N('United States of America', 'Ohio', 'Indiana')],
  ['United States', 'Michigan', 1, N('United States of America', 'Michigan', 'Wisconsin')],
  ['United States', 'Illinois', 1, N('United States of America', 'Illinois', 'Iowa')],
  ['United States', 'Missouri', 1, N('United States of America', 'Missouri', 'Arkansas')],
  ['United States', 'Louisiana', 1, N('United States of America', 'Louisiana')],
  ['United States', 'Texas', 1, N('United States of America', 'Texas')],
  ['United States', 'Minnesota', 1, N('United States of America', 'Minnesota', 'North Dakota', 'South Dakota')],
  ['United States', 'Kansas', 1, N('United States of America', 'Kansas', 'Nebraska', 'Oklahoma')],
  ['United States', 'Montana', 1, N('United States of America', 'Montana', 'Wyoming', 'Idaho')],
  ['United States', 'Colorado', 1, N('United States of America', 'Colorado', 'Utah')],
  ['United States', 'Southwest', 1, N('United States of America', 'Arizona', 'New Mexico', 'Nevada')],
  ['United States', 'California', 1, N('United States of America', 'California')],
  ['United States', 'Pacific Northwest', 1, N('United States of America', 'Washington', 'Oregon')],
  ['United States', 'Luzon', 1, (p) => p.admin === 'Philippines' && p.latitude >= 12.6 && p.longitude > 119.5], ['United States', 'Mindanao', 1, (p) => p.admin === 'Philippines' && p.latitude < 9.9 && p.longitude > 121.5],
  ['United States', 'Visayas', 1, A('Philippines')], ['United States', 'Guam', 1, A('Guam')], ['United States', 'Puerto Rico', 1, A('Puerto Rico')],
  ['United States', 'Midway', 1, NAME('Midway Islands')], ['United States', 'Wake Island', 1, NAME('Wake Atoll')], ['United States', 'American Samoa', 1, A('American Samoa')],
  // The dominions
  ['Canada', 'Maritimes', 1, N('Canada', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island')], ['Canada', 'Quebec', 1, N('Canada', 'Québec')], ['Canada', 'Ontario', 1, N('Canada', 'Ontario')], ['Canada', 'Manitoba', 1, N('Canada', 'Manitoba')], ['Canada', 'Saskatchewan', 1, N('Canada', 'Saskatchewan')], ['Canada', 'Alberta', 1, N('Canada', 'Alberta')], ['Canada', 'British Columbia', 1, N('Canada', 'British Columbia')], ['Canada', 'Northwest Territories', 1, N('Canada', 'Yukon', 'Northwest Territories', 'Nunavut')],
  ['Australia', 'Western Australia', 1, N('Australia', 'Western Australia')], ['Australia', 'Northern Territory', 1, N('Australia', 'Northern Territory')], ['Australia', 'South Australia', 1, N('Australia', 'South Australia')], ['Australia', 'Queensland', 1, N('Australia', 'Queensland')], ['Australia', 'New South Wales', 1, N('Australia', 'New South Wales', 'Australian Capital Territory')], ['Australia', 'Victoria', 1, N('Australia', 'Victoria')], ['Australia', 'Tasmania', 1, N('Australia', 'Tasmania')],
  ['Australia', 'Papua', 1, N('Papua New Guinea', 'Western', 'Gulf', 'Central', 'National Capital District', 'Northern', 'Milne Bay', 'Southern Highlands')],
  ['Australia', 'New Britain', 1, N('Papua New Guinea', 'East New Britain', 'West New Britain', 'New Ireland', 'Manus', 'North Solomons')], ['Australia', 'New Guinea', 1, A('Papua New Guinea')], ['Australia', 'Nauru', 1, A('Nauru')],
  ['New Zealand', 'New Zealand', 2, A('New Zealand')], ['New Zealand', 'Western Samoa', 1, A('Samoa')],
  ['South Africa', 'South West Africa', 1, A('Namibia')], ['South Africa', 'South Africa', 2, () => true],
  // Asia, Arabia and Africa
  ['Siam', 'Southern Siam', 1, (p) => p.latitude < 11.6], ['Siam', 'Isan', 1, (p) => p.longitude >= 101.6 && p.latitude >= 14], ['Siam', 'Northern Siam', 1, (p) => p.latitude >= 16.6], ['Siam', 'Central Siam', 1, () => true],
  ['Iran', 'Tabriz', 1, N('Iran', 'West Azarbaijan', 'East Azarbaijan', 'Ardebil', 'Zanjan', 'Kordestan', 'Kermanshah')],
  ['Iran', 'Khuzestan', 1, N('Iran', 'Khuzestan', 'Ilam', 'Lorestan', 'Kohgiluyeh and Buyer Ahmad', 'Bushehr', 'Chahar Mahall and Bakhtiari')],
  ['Iran', 'Khorasan', 1, N('Iran', 'North Khorasan', 'Razavi Khorasan', 'South Khorasan')], ['Iran', 'Kerman', 1, N('Iran', 'Kerman', 'Yazd', 'Fars', 'Hormozgan', 'Sistan and Baluchestan')],
  ['Iran', 'Tehran', 1, () => true], ['Afghanistan', 'Herat', 1, (p) => p.longitude < 65.5], ['Afghanistan', 'Kabul', 1, () => true],
  ['Saudi Arabia', 'Hasa', 1, N('Saudi Arabia', 'Ash Sharqiyah')], ['Saudi Arabia', 'Nejd', 1, N('Saudi Arabia', 'Ar Riyad', 'Al Quassim', "Ha'il", 'Al Jawf', 'Al Hudud ash Shamaliyah')],
  ['Saudi Arabia', 'Hejaz', 1, () => true], ['Yemen', 'Yemen', 1, () => true],
  ['Oman', 'Oman', 1, () => true], ['Nepal', 'Nepal', 1, () => true], ['Ethiopia', 'Ethiopia', 3, () => true], ['Liberia', 'Liberia', 1, () => true],
  // Latin America
  ['Mexico', 'Mexico', 4, () => true], ['Guatemala', 'Guatemala', 1, () => true], ['Honduras', 'Honduras', 1, () => true], ['El Salvador', 'El Salvador', 1, () => true], ['Nicaragua', 'Nicaragua', 1, () => true],
  ['Costa Rica', 'Costa Rica', 1, () => true], ['Panama', 'Panama', 1, () => true], ['Cuba', 'Cuba', 2, () => true], ['Haiti', 'Haiti', 1, () => true], ['Dominican Republic', 'Dominican Republic', 1, () => true],
  ['Colombia', 'Colombia', 2, () => true], ['Venezuela', 'Venezuela', 1, () => true], ['Ecuador', 'Ecuador', 1, () => true], ['Peru', 'Peru', 2, () => true], ['Bolivia', 'Bolivia', 1, () => true],
  ['Paraguay', 'Paraguay', 1, () => true], ['Uruguay', 'Uruguay', 1, () => true], ['Chile', 'Chilean Patagonia', 1, (p) => p.latitude < -41], ['Chile', 'Chile', 1, () => true], ['Argentina', 'Argentina', 3, () => true], ['Brazil', 'Brazil', 5, () => true],
];

/**
 * Provinces cut in two along a line (map-cut.mjs) because one modern region is too big for the
 * fronts of the war in China and Manchuria: [province name, parts].
 */
const SPLITS = [
  ['Hopeh', 2], ['Shantung', 2], ['Honan', 2], ['Hupeh', 2], ['Hunan', 2], ['Kiangsi', 2], ['Anhwei', 2], ['Shansi', 2], ['Kwangtung', 2], ['Szechwan', 2], ['Yunnan', 2], ['Kwangsi', 2],
  ['Heilungkiang', 2], ['Kiangsu', 2], ['Chekiang', 2], ['Kansu', 2], ['Suiyuan', 2],
];

/** Capitals of the countries new on this map: [country, city, lon, lat]. */
export const CAPITALS = {
  Japan: ['Tokyo', 139.69, 35.69], 'United States': ['Washington', -77.04, 38.9], China: ['Nanking', 118.78, 32.06], Manchukuo: ['Hsinking', 125.32, 43.82],
  'Chinese Communists': ["Yan'an", 109.49, 36.6], Mongolia: ['Ulan Bator', 106.92, 47.92], Canada: ['Ottawa', -75.7, 45.42], Australia: ['Canberra', 149.13, -35.28],
  'New Zealand': ['Wellington', 174.78, -41.29], 'South Africa': ['Pretoria', 28.19, -25.75], Siam: ['Bangkok', 100.5, 13.75], Iran: ['Tehran', 51.39, 35.69], Afghanistan: ['Kabul', 69.17, 34.53],
  'Saudi Arabia': ['Riyadh', 46.72, 24.69], Yemen: ["Sana'a", 44.2, 15.35], Oman: ['Muscat', 58.4, 23.6], Nepal: ['Kathmandu', 85.32, 27.7], Ethiopia: ['Addis Ababa', 38.75, 9.03],
  Liberia: ['Monrovia', -10.8, 6.3], Iceland: ['Reykjavík', -21.9, 64.14], Mexico: ['Mexico City', -99.13, 19.43], Guatemala: ['Guatemala City', -90.51, 14.64], Honduras: ['Tegucigalpa', -87.2, 14.1],
  'El Salvador': ['San Salvador', -89.19, 13.69], Nicaragua: ['Managua', -86.25, 12.13], 'Costa Rica': ['San José', -84.09, 9.93], Panama: ['Panama City', -79.52, 8.98], Cuba: ['Havana', -82.37, 23.11],
  Haiti: ['Port-au-Prince', -72.34, 18.54], 'Dominican Republic': ['Ciudad Trujillo', -69.9, 18.48], Colombia: ['Bogotá', -74.07, 4.71], Venezuela: ['Caracas', -66.9, 10.5], Ecuador: ['Quito', -78.47, -0.18],
  Peru: ['Lima', -77.04, -12.05], Bolivia: ['La Paz', -68.15, -16.5], Paraguay: ['Asunción', -57.58, -25.26], Uruguay: ['Montevideo', -56.16, -34.9], Chile: ['Santiago', -70.65, -33.45],
  Argentina: ['Buenos Aires', -58.38, -34.6], Brazil: ['Rio de Janeiro', -43.2, -22.9],
};
/** Other important cities: [name, lon, lat, victory points]. In provinces of a 1.6 country they are named but count no points yet. */
const CITIES = [
  ['Osaka', 135.5, 34.69, 10], ['Nagoya', 136.9, 35.18, 5], ['Kure', 132.57, 34.25, 3], ['Seoul', 126.98, 37.57, 6], ['Taipei', 121.56, 25.04, 3], ['Truk', 151.85, 7.45, 2], ['Saipan', 145.75, 15.18, 2],
  ['Mukden', 123.43, 41.8, 6], ['Harbin', 126.63, 45.75, 4], ['Shanghai', 121.47, 31.23, 10], ['Peiping', 116.4, 39.9, 10], ['Tientsin', 117.2, 39.13, 4], ['Hankow', 114.3, 30.6, 8], ['Canton', 113.26, 23.13, 6],
  ['Chungking', 106.55, 29.56, 5], ["Xi'an", 108.94, 34.34, 3], ['Tsingtao', 120.38, 36.07, 3],
  ['New York', -74.0, 40.71, 15], ['Chicago', -87.63, 41.88, 10], ['Detroit', -83.05, 42.33, 8], ['Pittsburgh', -79.99, 40.44, 6], ['Philadelphia', -75.16, 39.95, 6], ['Los Angeles', -118.24, 34.05, 8],
  ['San Francisco', -122.42, 37.77, 6], ['Seattle', -122.33, 47.61, 3], ['Pearl Harbor', -157.95, 21.35, 5], ['Manila', 120.98, 14.6, 8], ['Toronto', -79.38, 43.65, 5], ['Montreal', -73.57, 45.5, 5],
  ['Sydney', 151.21, -33.87, 6], ['Melbourne', 144.96, -37.81, 5], ['Auckland', 174.76, -36.85, 3], ['Johannesburg', 28.05, -26.2, 5], ['Cape Town', 18.42, -33.92, 4], ['São Paulo', -46.63, -23.55, 6],
  ['Abadan', 48.3, 30.35, 4], ['Rabaul', 152.17, -4.2, 3],
  // In the empires and the Soviet east: names only for now.
  ['Delhi', 77.21, 28.61, 0], ['Calcutta', 88.36, 22.57, 0], ['Bombay', 72.88, 19.08, 0], ['Madras', 80.27, 13.08, 0], ['Karachi', 67.0, 24.86, 0], ['Rangoon', 96.2, 16.84, 0], ['Singapore', 103.82, 1.35, 0],
  ['Colombo', 79.86, 6.93, 0], ['Batavia', 106.85, -6.21, 0], ['Palembang', 104.76, -2.99, 0], ['Saigon', 106.63, 10.82, 0], ['Hanoi', 105.85, 21.03, 0], ['Khartoum', 32.53, 15.5, 0], ['Dakar', -17.44, 14.69, 0],
  ['Lagos', 3.38, 6.52, 0], ['Léopoldville', 15.27, -4.44, 0], ['Asmara', 38.93, 15.33, 0], ['Aden', 45.03, 12.79, 0], ['Vladivostok', 131.89, 43.12, 0], ['Sverdlovsk', 60.6, 56.84, 0],
  ['Novosibirsk', 82.92, 55.03, 0], ['Kuibyshev', 50.1, 53.2, 0], ['Kazan', 49.12, 55.79, 0], ['Chelyabinsk', 61.4, 55.16, 0], ['Tashkent', 69.24, 41.3, 0], ['Magnitogorsk', 59.0, 53.4, 0],
];
/** Narrow sea crossings that armies can use without ships, as [lon, lat] on each shore: the Kanmon, Tsugaru and Naruto straits of Japan. */
const STRAITS = [[[130.95, 33.96], [130.88, 33.88]], [[140.74, 40.82], [140.73, 41.77]], [[134.6, 34.15], [134.8, 34.4]]];

/** Names of places for provinces made of several regions: [name, lon, lat]. A province takes the one nearest its centre. */
const PLACES = [
  ['Northern Korea', 127.8, 40.6], ['Central Korea', 126.9, 37.7], ['Southern Korea', 128.2, 35.6],
  ['Western Mongolia', 93, 48], ['Central Mongolia', 103.5, 47.5], ['Eastern Mongolia', 113, 47.5],
  ['Kazan', 49.12, 55.79], ['Kuibyshev', 50.1, 53.2], ['Molotov', 56.2, 58], ['Sverdlovsk', 60.6, 56.8], ['Chelyabinsk', 61.4, 55.2], ['Bashkiria', 56, 54.2], ['Orenburg', 55.1, 51.8], ['Kirov', 49.7, 58.6],
  ['Komi', 55, 63.5], ['Udmurtia', 53, 57], ['Pechora', 57, 67.5], ['Omsk', 73.4, 55], ['Novosibirsk', 82.9, 55], ['Tyumen', 65.5, 57.2], ['Tomsk', 85, 57.5], ['Altai', 84, 52], ['Kuzbass', 87, 54.5],
  ['Ob', 71, 64], ['Krasnoyarsk', 93, 56], ['Irkutsk', 104.3, 52.3], ['Buryatia', 109, 53], ['Chita', 113.5, 52], ['Yakutia', 129.7, 62], ['Taimyr', 95, 72], ['Tuva', 94.5, 51.7],
  ['Primorye', 134.5, 45], ['Khabarovsk', 135, 50], ['Amur', 128, 52], ['Kolyma', 150.8, 62], ['Kamchatka', 159, 55], ['Chukotka', 172, 66],
  ['Western Kazakhstan', 52, 48.5], ['Northern Kazakhstan', 68, 52], ['Karaganda', 73, 48.5], ['Alma-Ata', 78, 44.5], ['Aral', 62, 45.5],
  ['Turkmenia', 59, 39], ['Uzbekistan', 64, 41], ['Kirghizia', 75, 41.5], ['Tajikistan', 71, 38.5],
  ['Punjab', 73.5, 31], ['North-West Frontier', 71.5, 34], ['Sind', 68.5, 26], ['Baluchistan', 65.5, 28.5], ['Kashmir', 75.5, 34.5], ['Rajputana', 73.5, 26.5], ['United Provinces', 80.5, 27],
  ['Bihar', 85.5, 25.5], ['Bengal', 89, 23.5], ['Assam', 92.5, 26], ['Bombay', 73.5, 19.5], ['Central Provinces', 79.5, 22], ['Hyderabad', 78.5, 17.5], ['Madras', 79.5, 13], ['Mysore', 76, 13.5],
  ['Orissa', 85, 20.5], ['Travancore', 76.8, 9.5], ['Kathiawar', 71.5, 22.5], ['Delhi', 77.2, 28.6],
  ['Upper Burma', 96, 23], ['Lower Burma', 96, 17.5], ['Malaya', 102, 4], ['British Borneo', 115, 4],
  ['Northern Sudan', 30, 18], ['Southern Sudan', 30, 7], ['Northern Rhodesia', 27.5, -13.5], ['Southern Rhodesia', 30, -19], ['Northern Nigeria', 8, 11.5], ['Southern Nigeria', 6, 7],
  ['Hoggar', 5.5, 23], ['Touat', -0.5, 27.5], ['Timbuktu', -3, 16.8], ['Bamako', -8, 12.6],
  ['Tonkin', 105.5, 21.5], ['Annam', 107.5, 15], ['Cochinchina', 106.3, 10.5], ['Cambodia', 105, 12.5], ['Laos', 103, 19.5],
  ['Northern Sumatra', 98.5, 3], ['Southern Sumatra', 103, -3], ['Western Java', 107, -6.8], ['Eastern Java', 112, -7.5], ['Western Borneo', 111, 0], ['Eastern Borneo', 116, -1], ['Celebes', 121, -2],
  ['Moluccas', 128, -3], ['Dutch New Guinea', 137, -4], ['Lesser Sunda Islands', 120, -9],
  ['Northern Angola', 15, -8.5], ['Southern Angola', 17, -14], ['Northern Mozambique', 38, -14], ['Southern Mozambique', 33.5, -21], ['Lower Congo', 17, -4], ['Katanga', 26, -9], ['Kivu', 27.5, -1.5],
  ['Fezzan', 14, 26], ['Kufra', 22, 24.5], ['Middle Egypt', 30.8, 28.5], ['Upper Egypt Valley', 32.6, 25.7], ['New Valley', 28, 24.5], ['Red Sea Hills', 34, 25.5], ['South Sinai', 33.8, 28.6],
  ['Eastern Greenland', -35, 72], ['Western Greenland', -50, 68],
  ['New England', -71.5, 43.5], ['New York', -75, 43], ['Pennsylvania', -77.6, 40.9], ['Virginia', -78.5, 37.5], ['Carolinas', -80, 35], ['Florida', -81.7, 28.5], ['Alabama', -86.8, 32.8], ['Ohio', -82.8, 40.3],
  ['Michigan', -84.7, 43.6], ['Illinois', -89.2, 40], ['Wisconsin', -89.8, 44.6], ['Minnesota', -94.3, 46.3], ['Missouri', -92.5, 38.4], ['Tennessee', -86.3, 35.8], ['Louisiana', -92, 31], ['Texas', -99, 31.5],
  ['Oklahoma', -97.5, 35.5], ['Kansas', -98.4, 38.5], ['Nebraska', -99.8, 41.5], ['Dakotas', -100.5, 46], ['Montana', -109.6, 47], ['Colorado', -105.5, 39], ['New Mexico', -106, 34.4], ['Arizona', -111.7, 34.3],
  ['Utah', -111.7, 39.3], ['Nevada', -117, 39], ['California', -119.5, 37], ['Oregon', -120.5, 44], ['Pacific Northwest', -120.5, 47.4], ['Idaho', -114.6, 44.4], ['Iowa', -93.5, 42], ['Kentucky', -85.3, 37.5],
  ['Luzon', 121, 16], ['Visayas', 123.5, 11], ['Mindanao', 125, 7.5],
  ['British Columbia', -125, 54], ['Alberta', -115, 55], ['Saskatchewan', -106, 54], ['Manitoba', -97, 55], ['Ontario', -85, 50], ['Quebec', -72, 50], ['Maritimes', -64.5, 45.5], ['Yukon', -136, 64],
  ['Northwest Territories', -110, 64], ['Arctic Islands', -90, 75],
  ['Western Australia', 122, -26], ['Northern Territory', 134, -20], ['South Australia', 136, -30], ['Queensland', 145, -22], ['New South Wales', 147, -32], ['Victoria', 145, -37], ['Tasmania', 146.5, -42],
  ['Papua', 146, -8.5], ['New Guinea', 143.5, -5], ['New Britain', 151, -5],
  ['North Island', 175.5, -38.5], ['South Island', 171, -43.5], ['Transvaal', 28.5, -25.5], ['Cape Province', 21, -31.5],
  ['Northern Siam', 99.5, 18.5], ['Isan', 103, 15.8], ['Central Siam', 100.3, 14.5], ['Southern Siam', 100, 8],
  ['Tabriz', 46.3, 38.1], ['Tehran', 51.4, 35.7], ['Khuzestan', 49, 31.5], ['Fars', 53, 29.5], ['Khorasan', 58.5, 35.5], ['Kerman', 57, 30],
  ['Kabul', 69.2, 34.5], ['Herat', 62.2, 34.3], ['Kandahar', 65.7, 31.6], ['Nejd', 45, 24.5], ['Hejaz', 40, 22.5], ['Hasa', 49.5, 25], ['Shoa', 38.8, 9.3], ['Ogaden', 43.5, 7], ['Gojjam', 37, 11], ['Tigray', 39, 13.8],
  ['Northern Mexico', -106, 28], ['Central Mexico', -100, 21], ['Yucatán', -89, 19.5], ['Baja California', -114, 29], ['Havana', -82.4, 23], ['Oriente', -76.5, 20.5],
  ['Llanos', -71, 4.5], ['Cundinamarca', -74.5, 5], ['Northern Peru', -77, -7], ['Southern Peru', -72.5, -14], ['Atacama', -69.5, -24], ['Central Chile', -71.5, -36],
  ['Pampas', -61, -35], ['Gran Chaco', -62, -26], ['Patagonia', -68, -45], ['Amazonia', -61, -4], ['Northeast Brazil', -40, -8], ['Central Brazil', -51, -14], ['Southeast Brazil', -45, -21], ['Southern Brazil', -52, -27],
];

/** A first pass at terrain from where a province's centre lies: [terrain, west, east, south, north]. First match wins. */
const TERRAIN_BOXES = [
  ['marsh', 60, 180, 66, 80], ['marsh', 62, 85, 57, 66], ['mountains', 78, 100, 27, 37], ['mountains', 60, 78, 33, 40], ['mountains', 74, 90, 40, 45.5], ['mountains', 86, 100, 45, 53],
  ['mountains', -80, -66, -42, 10], ['mountains', -125, -104, 35, 60], ['mountains', 35, 42, 6, 15], ['mountains', 97, 108, 22, 29], ['hills', 129, 146, 30, 46], ['hills', 124, 130, 34, 43],
  ['hills', 44, 62, 25, 39], ['hills', -106, -95, 15, 26], ['hills', -85, -76, 34, 42], ['hills', 120, 122, 21.5, 25.5], ['hills', 117, 127, 5, 19], ['hills', 98, 112, 29, 35],
  ['desert', -17, 35, 15, 29.5], ['desert', 34, 60, 15, 30], ['desert', 62, 75, 24, 30], ['desert', 52, 70, 38, 47], ['desert', 75, 112, 37, 46], ['desert', 12, 26, -28, -17], ['desert', 115, 142, -32, -18],
  ['desert', -120, -103, 30, 40], ['desert', -72, -67, -28, -18], ['desert', 41, 51, 0, 12],
  ['forest', 49, 180, 50, 72], ['forest', -170, -55, 50, 72], ['forest', -76, -45, -14, 6], ['forest', 10, 32, -8, 5], ['forest', -15, 10, 4, 9], ['forest', 92, 110, 0, 23], ['forest', 95, 156, -11, 7],
  ['forest', -92, -76, 6, 18], ['forest', 120, 136, 44, 54],
];
const terrainAt = ([lon, lat]) => (TERRAIN_BOXES.find(([, w, e, s, n]) => lon >= w && lon <= e && lat >= s && lat <= n) ?? ['plains'])[0];

/** Sutherland-Hodgman: the part of a polygon on one side of a line. Both sides compute the same crossing points, so they share their cut. */
function clipPolygon(poly, axis, value, keepLow) {
  const inside = (pt) => (keepLow ? pt[axis] <= value : pt[axis] >= value);
  const cross = (a, b) => {
    const t = (value - a[axis]) / (b[axis] - a[axis]);
    const pt = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    pt[axis] = value;
    return pt;
  };
  const out = [];
  for (const ring of poly) {
    const res = [];
    const pts = ring.slice(0, -1);
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      if (inside(cur)) {
        if (!inside(prev)) res.push(cross(prev, cur));
        res.push(cur);
      } else if (inside(prev)) res.push(cross(prev, cur));
    }
    if (res.length >= 3) out.push([...res, res[0]]);
  }
  return out.length && out[0] ? out : null;
}
const polysOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const centreOf = (poly) => geoCentroid({ type: 'Polygon', coordinates: poly });

/**
 * Build the world beyond the European map.
 *   raw        every Natural Earth region
 *   keptRaw    indexes of the regions the European map uses
 *   euroTopo   the European regions' topology (its grid is what every point is snapped to)
 *   owner1936  the European map's own owner rules, used for the rest of its countries' land (the Soviet Union east of 49 degrees, the Sahara)
 *   rnd        seeded random numbers, separate from the European map's
 */
export function buildWorld({ raw, keptRaw, euroTopo, owner1936, rnd, europeNames }) {
  const [bx0, by0, bx1, by1] = euroTopo.bbox;
  const kx = (1e5 - 1) / (bx1 - bx0);
  const ky = (1e5 - 1) / (by1 - by0);
  const [sx, sy] = euroTopo.transform.scale;
  const [tx, ty] = euroTopo.transform.translate;
  // The same rounding as topojson-server's, so that a snapped point equals the European map's point exactly.
  const snap = ([x, y]) => [Math.round((x - bx0) * kx) * sx + tx, Math.round((y - by0) * ky) * sy + ty];
  const snapPoly = (poly) => poly.map((ring) => {
    const out = [];
    for (const pt of ring) {
      const s = snap(pt);
      const last = out[out.length - 1];
      if (!last || last[0] !== s[0] || last[1] !== s[1]) out.push(s);
    }
    return out;
  }).filter((ring) => ring.length >= 4);

  const worldOwner = (p) => MOVED[`${p.admin}/${p.name}`] ?? WORLD[p.admin] ?? owner1936(p);
  const regions = [];
  raw.forEach((f, ri) => {
    if (keptRaw.has(ri)) return;
    const p = f.properties;
    if (DROP_ADMIN.has(p.admin) || DROP_REGION.has(`${p.admin}/${p.name}`)) return;
    if (p.admin === 'United States Minor Outlying Islands' && !KEEP_MINOR_ISLANDS.has(p.name)) return;
    if (p.admin === 'Kiribati' && !(p.longitude > 0)) return;
    if (p.admin === 'New Zealand' && !['North Island', 'South Island'].includes(p.region)) return;
    const owner = worldOwner(p);
    if (!owner) throw new Error(`No 1936 owner for ${p.admin}/${p.name}`);
    let polys = polysOf(f.geometry);
    const drop = DROP_PART.filter(([a]) => a === p.admin);
    if (drop.length) polys = polys.filter((poly) => !drop.some(([, test]) => test(centreOf(poly))));
    if (!polys.length) return;
    const key = `${p.admin}/${p.name}`;
    const add = (name, own, ps, label = name) => regions.push({ name: label, admin: p.admin, owner: own, polys: ps, props: { ...p, name } });
    for (const [k, test, name, own] of PIECES.filter(([k]) => k === key)) {
      const piece = polys.filter((poly) => test(centreOf(poly)));
      polys = polys.filter((poly) => !test(centreOf(poly)));
      if (piece.length) add(name, own, piece);
    }
    const clip = CLIPS.find(([k]) => k === key);
    if (clip) {
      const [, axis, value, [lowName, lowOwner], [highName, highOwner]] = clip;
      const low = polys.map((poly) => clipPolygon(poly, axis, value, true)).filter(Boolean);
      const high = polys.map((poly) => clipPolygon(poly, axis, value, false)).filter(Boolean);
      add(lowName, lowOwner, low);
      add(highName, highOwner, high);
      return;
    }
    add(p.name, owner, polys, p.name_en || p.name);
  });
  for (const r of regions) {
    r.polys = r.polys.map(snapPoly).filter((poly) => poly.length && poly[0].length >= 4);
    r.geometry = { type: 'MultiPolygon', coordinates: r.polys };
    r.area = geoArea(r.geometry);
    r.c = geoCentroid(r.geometry);
    r.props.longitude ??= r.c[0];
    r.props.latitude ??= r.c[1];
    // A region's own label point decides its zone; for a piece cut from a region, its centre does.
    if (CLIPS.some(([, , , [l], [h]]) => r.name === l || r.name === h) || PIECES.some(([, , n]) => r.name === n)) [r.props.longitude, r.props.latitude] = r.c;
    const zone = ZONES.findIndex((z) => z[0] === r.owner && z[3](r.props));
    // A small island with no zone of its own (Saba, Bonaire) is left off.
    if (zone < 0 && r.area * 6371 ** 2 < 3000) { r.polys = []; continue; }
    if (zone < 0) throw new Error(`No zone for ${r.admin}/${r.name} (${r.owner})`);
    r.zone = zone;
  }
  const kept = regions.filter((r) => r.polys.length);

  /** k-means on the regions' centres, weighted by area (as in build-map.mjs). */
  function cluster(items, k) {
    if (k >= items.length) return items.map((_, i) => i);
    const flat = items.map((r) => [r.c[0] * Math.cos((r.c[1] * Math.PI) / 180), r.c[1]]);
    let best = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const centres = [flat[Math.floor(rnd() * flat.length)]];
      while (centres.length < k) {
        const d = flat.map((p) => Math.min(...centres.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2)));
        let r = rnd() * d.reduce((a, b) => a + b, 0), i = 0;
        while (i < d.length - 1 && (r -= d[i]) > 0) i++;
        centres.push(flat[i]);
      }
      let assign = [];
      for (let it = 0; it < 40; it++) {
        assign = flat.map((p) => { let bi = 0, bd = Infinity; centres.forEach((c, i) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (dd < bd) { bd = dd; bi = i; } }); return bi; });
        for (let i = 0; i < k; i++) {
          let w = 0, x = 0, y = 0;
          flat.forEach((p, j) => { if (assign[j] === i) { const a = items[j].area; w += a; x += p[0] * a; y += p[1] * a; } });
          if (w > 0) centres[i] = [x / w, y / w];
        }
      }
      const cost = flat.reduce((sum, p, j) => sum + items[j].area * ((p[0] - centres[assign[j]][0]) ** 2 + (p[1] - centres[assign[j]][1]) ** 2), 0);
      if (new Set(assign).size === k && (!best || cost < best.cost)) best = { cost, assign };
    }
    if (!best) throw new Error('clustering failed');
    return best.assign;
  }

  const groups = [];
  ZONES.forEach((z, zi) => {
    const items = kept.filter((r) => r.zone === zi);
    if (!items.length) return;
    const assign = cluster(items, z[2]);
    const ids = {};
    items.forEach((r, j) => {
      if (!(assign[j] in ids)) { ids[assign[j]] = groups.length; groups.push({ owner: z[0], zone: z[1], members: [] }); }
      groups[ids[assign[j]]].members.push(r);
    });
  });
  const zoneSize = (name) => groups.filter((g) => g.zone === name).length;

  // Merge each group's regions into one shape (a topology without quantising: the points are already on the grid).
  const rtopo = topology({ regions: { type: 'GeometryCollection', geometries: kept.map((r) => r.geometry) } });
  const index = new Map(kept.map((r, i) => [r, i]));
  const geoms = groups.map((g) => merge(rtopo, g.members.map((r) => rtopo.objects.regions.geometries[index.get(r)])).coordinates);

  // Names, before the splits.
  const used = new Set(europeNames);
  const nameOf = (gi, centre) => {
    const g = groups[gi];
    if (zoneSize(g.zone) === 1) return g.zone;
    const shape = { type: 'MultiPolygon', coordinates: geoms[gi] };
    const inside = PLACES.filter(([n, lon, lat]) => !used.has(n) && geoContains(shape, [lon, lat])).sort((a, b) => geoDistance(centre, [a[1], a[2]]) - geoDistance(centre, [b[1], b[2]]));
    if (inside.length) return inside[0][0];
    const biggest = [...g.members].sort((a, b) => b.area - a.area)[0];
    return biggest.name;
  };
  const names = groups.map((g, gi) => {
    const n = nameOf(gi, geoCentroid({ type: 'MultiPolygon', coordinates: geoms[gi] }));
    if (used.has(n)) throw new Error(`Duplicate province name ${n}`);
    used.add(n);
    return n;
  });

  // Split the big provinces near the Chinese fronts.
  const parentOf = groups.map((_, i) => i);
  const cutter = makeCutter(geoms, rnd);
  for (const [name, k] of SPLITS) {
    const i = names.indexOf(name);
    if (i < 0) throw new Error(`World split: no province called ${name}`);
    const before = geoms.length;
    const parts = cutter.cutInto(i, k, name);
    for (const part of parts) if (part !== i) parentOf[part] = i;
    for (let j = before; j < geoms.length; j++) parentOf[j] ??= i;
  }
  // The part of a split province that holds its capital or main city keeps the name; swap so it does.
  const anchors = [...Object.values(CAPITALS).map(([, lon, lat]) => [lon, lat]), ...CITIES.map(([, lon, lat]) => [lon, lat])];
  const holds = (g) => anchors.some((pt) => geoContains({ type: 'MultiPolygon', coordinates: g }, pt));
  for (let j = groups.length; j < geoms.length; j++) {
    const i = parentOf[j];
    if (!holds(geoms[i]) && holds(geoms[j])) [geoms[i], geoms[j]] = [geoms[j], geoms[i]];
  }
  // A new part is named for where it lies from the part that kept the name: "Southern Hopeh". Historical names where there is one.
  const HISTORICAL = { 'Western Szechwan': 'Sikang', 'Eastern Suiyuan': 'Chahar', 'Northern Suiyuan': 'Chahar' };
  for (let j = groups.length; j < geoms.length; j++) {
    const base = names[parentOf[j]];
    const [x0, y0] = geoCentroid({ type: 'MultiPolygon', coordinates: geoms[parentOf[j]] });
    const [x1, y1] = geoCentroid({ type: 'MultiPolygon', coordinates: geoms[j] });
    const dx = (x1 - x0) * Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
    const dy = y1 - y0;
    const way = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'Eastern' : 'Western') : dy > 0 ? 'Northern' : 'Southern';
    const n = HISTORICAL[`${way} ${base}`] ?? `${way} ${base}`;
    if (used.has(n)) throw new Error(`Duplicate province name ${n}`);
    used.add(n);
    names.push(n);
  }

  const owners = geoms.map((_, i) => groups[parentOf[i]].owner);
  const zones = geoms.map((_, i) => groups[parentOf[i]].zone);
  const provinces = geoms.map((g, i) => {
    const shape = { type: 'MultiPolygon', coordinates: g };
    const centre = geoCentroid(shape).map((v) => Math.round(v * 1000) / 1000);
    return { name: names[i], owner: owners[i], zone: zones[i], terrain: terrainAt(centre), centre, areaKm2: Math.round(geoArea(shape) * 6371 ** 2), victoryPoints: 1, city: null, capital: false, shape };
  });
  const findIn = (lon, lat, owner) => {
    let hit = provinces.findIndex((p) => (!owner || p.owner === owner) && geoContains(p.shape, [lon, lat]));
    if (hit < 0) {
      let bd = Infinity;
      provinces.forEach((p, i) => { if (owner && p.owner !== owner) return; const d = geoDistance(p.centre, [lon, lat]); if (d < bd) { bd = d; hit = i; } });
    }
    return hit;
  };
  for (const [country, [city, lon, lat]] of Object.entries(CAPITALS)) {
    const i = findIn(lon, lat, country);
    if (i < 0) throw new Error(`No province for the capital of ${country}`);
    Object.assign(provinces[i], { city, capital: true, victoryPoints: 20 });
  }
  for (const [city, lon, lat, vp] of CITIES) {
    const i = findIn(lon, lat, null);
    provinces[i].victoryPoints += vp;
    if (!provinces[i].city) provinces[i].city = city;
  }
  return { provinces, geoms, straits: STRAITS };
}

/** Places where the map's 1936 borders are approximate, beyond Europe. */
export const WORLD_GAPS = [
  'Tibet, Sinkiang and the provinces run by regional warlords are shown as part of Nationalist China.',
  'The Kwantung Leased Territory (Port Arthur and Dairen), held by Japan, is shown as part of Manchukuo; the line between Manchukuo and China follows modern regions.',
  'Tannu Tuva, a Soviet satellite, is shown as part of the Soviet Union; Bhutan and the Indian princely states as part of British India.',
  'The British parts of Cameroon and Togo are shown as French, the New Hebrides (ruled jointly by Britain and France) as British, and Ifni and Tarfaya as French Morocco.',
  'Iceland is shown as an independent country; it shared its king with Denmark, which ran its foreign affairs.',
  'The smallest islands (most of the West Indies and of the Indian Ocean) are left off the map.',
];
