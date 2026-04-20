// Gujarat APMC market prices — replace with live API in production.
// Prices in ₹ per quintal (100 kg).  `trend` = last 7 days (oldest → newest).

export const MANDI_DATA = [
  {
    id: 'rajkot',
    name: 'Rajkot APMC',
    nameGu: 'રાજકોટ APMC',
    nameHi: 'राजकोट APMC',
    district: 'Rajkot',
    crops: [
      { name: 'cotton',     icon: '🌿', price: 7350, prev: 7230, unit: 'quintal', trend: [7100,7150,7200,7180,7250,7230,7350] },
      { name: 'groundnut',  icon: '🥜', price: 6100, prev: 6050, unit: 'quintal', trend: [5900,5950,6000,6020,6080,6050,6100] },
      { name: 'castor',     icon: '🌾', price: 6420, prev: 6380, unit: 'quintal', trend: [6200,6250,6300,6350,6400,6380,6420] },
      { name: 'cumin',      icon: '🌱', price: 28500, prev: 27800, unit: 'quintal', trend: [27000,27200,27500,27800,28000,27800,28500] },
      { name: 'bajra',      icon: '🌾', price: 2350, prev: 2300, unit: 'quintal', trend: [2200,2220,2250,2280,2300,2300,2350] },
      { name: 'wheat',      icon: '🌾', price: 2380, prev: 2360, unit: 'quintal', trend: [2300,2320,2340,2360,2370,2360,2380] },
    ],
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad APMC',
    nameGu: 'અમદાવાદ APMC',
    nameHi: 'अहमदाबाद APMC',
    district: 'Ahmedabad',
    crops: [
      { name: 'cotton',    icon: '🌿', price: 7400, prev: 7280, unit: 'quintal', trend: [7120,7200,7240,7260,7300,7280,7400] },
      { name: 'groundnut', icon: '🥜', price: 6050, prev: 6100, unit: 'quintal', trend: [5880,5920,5980,6020,6080,6100,6050] },
      { name: 'castor',    icon: '🌾', price: 6380, prev: 6340, unit: 'quintal', trend: [6180,6220,6260,6300,6340,6340,6380] },
      { name: 'sesame',    icon: '🌰', price: 13500, prev: 13200, unit: 'quintal', trend: [12800,12900,13000,13100,13200,13200,13500] },
      { name: 'wheat',     icon: '🌾', price: 2400, prev: 2380, unit: 'quintal', trend: [2320,2340,2360,2370,2380,2380,2400] },
      { name: 'bajra',     icon: '🌾', price: 2330, prev: 2310, unit: 'quintal', trend: [2200,2220,2250,2270,2300,2310,2330] },
    ],
  },
  {
    id: 'junagadh',
    name: 'Junagadh APMC',
    nameGu: 'જૂનાગઢ APMC',
    nameHi: 'जूनागढ़ APMC',
    district: 'Junagadh',
    crops: [
      { name: 'groundnut', icon: '🥜', price: 6200, prev: 6080, unit: 'quintal', trend: [5950,6000,6050,6080,6120,6080,6200] },
      { name: 'castor',    icon: '🌾', price: 6500, prev: 6450, unit: 'quintal', trend: [6250,6300,6350,6400,6450,6450,6500] },
      { name: 'cotton',    icon: '🌿', price: 7280, prev: 7200, unit: 'quintal', trend: [7050,7100,7150,7180,7200,7200,7280] },
      { name: 'sesame',    icon: '🌰', price: 13200, prev: 13000, unit: 'quintal', trend: [12600,12700,12800,12900,13000,13000,13200] },
      { name: 'wheat',     icon: '🌾', price: 2360, prev: 2340, unit: 'quintal', trend: [2280,2300,2320,2330,2340,2340,2360] },
    ],
  },
  {
    id: 'amreli',
    name: 'Amreli APMC',
    nameGu: 'અમરેલી APMC',
    nameHi: 'अमरेली APMC',
    district: 'Amreli',
    crops: [
      { name: 'groundnut', icon: '🥜', price: 6150, prev: 6050, unit: 'quintal', trend: [5900,5950,6000,6050,6100,6050,6150] },
      { name: 'cotton',    icon: '🌿', price: 7300, prev: 7220, unit: 'quintal', trend: [7080,7120,7160,7200,7220,7220,7300] },
      { name: 'castor',    icon: '🌾', price: 6450, prev: 6400, unit: 'quintal', trend: [6200,6250,6300,6350,6400,6400,6450] },
      { name: 'bajra',     icon: '🌾', price: 2380, prev: 2350, unit: 'quintal', trend: [2210,2240,2270,2300,2330,2350,2380] },
    ],
  },
  {
    id: 'anand',
    name: 'Anand APMC',
    nameGu: 'આણંદ APMC',
    nameHi: 'आनंद APMC',
    district: 'Anand',
    crops: [
      { name: 'wheat',     icon: '🌾', price: 2420, prev: 2390, unit: 'quintal', trend: [2330,2350,2370,2380,2390,2390,2420] },
      { name: 'cotton',    icon: '🌿', price: 7320, prev: 7240, unit: 'quintal', trend: [7090,7140,7180,7210,7240,7240,7320] },
      { name: 'groundnut', icon: '🥜', price: 6080, prev: 6020, unit: 'quintal', trend: [5870,5920,5970,6000,6020,6020,6080] },
      { name: 'bajra',     icon: '🌾', price: 2310, prev: 2290, unit: 'quintal', trend: [2190,2210,2240,2260,2280,2290,2310] },
      { name: 'tur',       icon: '🟡', price: 8800, prev: 8600, unit: 'quintal', trend: [8400,8450,8500,8550,8600,8600,8800] },
    ],
  },
];

// Gujarati crop name map
export const CROP_NAME_MAP = {
  en: {
    cotton: 'Cotton', groundnut: 'Groundnut', castor: 'Castor',
    cumin: 'Cumin', bajra: 'Bajra / Millet', wheat: 'Wheat',
    sesame: 'Sesame', tur: 'Tur Dal',
  },
  gu: {
    cotton: 'કપાસ', groundnut: 'મગફળી', castor: 'રેઢ',
    cumin: 'જીરુ', bajra: 'બાજરો', wheat: 'ઘઉં',
    sesame: 'તલ', tur: 'તુવેર',
  },
  hi: {
    cotton: 'कपास', groundnut: 'मूंगफली', castor: 'अरंडी',
    cumin: 'जीरा', bajra: 'बाजरा', wheat: 'गेहूं',
    sesame: 'तिल', tur: 'तुअर दाल',
  },
};
