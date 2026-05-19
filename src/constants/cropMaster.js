/**
 * cropMaster.js — Enums and type constants for crop management.
 *
 * All actual crop catalogue data comes from the HANA Platform API:
 *   POST /mongo/getdata  { moduleName: 'cropmaster', filter: { isActive: true } }
 *
 * Use useCropMaster() or useCropSearch() hooks — never add static crop objects here.
 */

// ── Season enums ───────────────────────────────────────────────────────────
export const CROP_SEASONS = {
  KHARIF:    'Kharif',
  RABI:      'Rabi',
  ZAID:      'Zaid',
  PERENNIAL: 'Perennial',
};

// ── Crop categories ────────────────────────────────────────────────────────
export const CROP_CATEGORIES = [
  { key: 'cereal',    label: 'Cereal',    icon: '🌾' },
  { key: 'vegetable', label: 'Vegetable', icon: '🥦' },
  { key: 'fruit',     label: 'Fruit',     icon: '🍎' },
  { key: 'fiber',     label: 'Fiber',     icon: '🧵' },
  { key: 'oilseed',   label: 'Oilseed',  icon: '🫒' },
  { key: 'spice',     label: 'Spice',     icon: '🌶️' },
  { key: 'pulse',     label: 'Pulse',     icon: '🫘' },
  { key: 'fodder',    label: 'Fodder',    icon: '🌿' },
  { key: 'other',     label: 'Other',     icon: '🌱' },
];

// ── Category icon lookup (key → emoji) ────────────────────────────────────
export const CATEGORY_ICON = CROP_CATEGORIES.reduce((acc, c) => {
  acc[c.key] = c.icon;
  return acc;
}, {});

// ── Water requirements ─────────────────────────────────────────────────────
export const WATER_REQUIREMENTS = [
  { key: 'low',    label: 'Low'    },
  { key: 'medium', label: 'Medium' },
  { key: 'high',   label: 'High'   },
];

// ── Common Indian states for crop geography ────────────────────────────────
export const CROP_STATES = [
  'All India', 'Gujarat', 'Maharashtra', 'Punjab', 'Haryana',
  'UP', 'MP', 'Rajasthan', 'Bihar', 'Karnataka',
  'Andhra Pradesh', 'Tamil Nadu', 'Telangana', 'Kerala',
  'Odisha', 'Jharkhand', 'Assam', 'West Bengal',
];

// ── Form option lists (used by AddCropScreen) ──────────────────────────────
export const SOIL_TYPES = [
  { key: 'black',    label: 'Black Soil'    },
  { key: 'red',      label: 'Red Soil'      },
  { key: 'loamy',    label: 'Loamy Soil'    },
  { key: 'sandy',    label: 'Sandy Soil'    },
  { key: 'clay',     label: 'Clay Soil'     },
  { key: 'alluvial', label: 'Alluvial Soil' },
  { key: 'laterite', label: 'Laterite Soil' },
];

export const IRRIGATION_TYPES = [
  { key: 'drip',      label: 'Drip'      },
  { key: 'sprinkler', label: 'Sprinkler' },
  { key: 'flood',     label: 'Flood'     },
  { key: 'furrow',    label: 'Furrow'    },
  { key: 'rain_fed',  label: 'Rain-fed'  },
  { key: 'canal',     label: 'Canal'     },
];

export const CROP_STAGES = [
  { key: 'seedling',   label: 'Seedling'   },
  { key: 'vegetative', label: 'Vegetative' },
  { key: 'flowering',  label: 'Flowering'  },
  { key: 'fruiting',   label: 'Fruiting'   },
  { key: 'maturity',   label: 'Maturity'   },
  { key: 'harvest',    label: 'Harvest'    },
];

export const CROP_STATUS = {
  ACTIVE:    'active',
  HARVESTED: 'harvested',
  FAILED:    'failed',
  PLANNED:   'planned',
  DELETED:   'deleted',
};

export const LAND_UNITS = [
  { key: 'acre',    label: 'Acre'    },
  { key: 'hectare', label: 'Hectare' },
  { key: 'bigha',   label: 'Bigha'   },
  { key: 'guntha',  label: 'Guntha'  },
  { key: 'kanal',   label: 'Kanal'   },
];

// ── Empty — populated at runtime by useCropMaster() ───────────────────────
export const CROP_MASTER = [];
export const CROP_BY_ID  = {};
export const CROP_NAMES  = [];
