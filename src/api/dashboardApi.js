/**
 * dashboardApi.js — Dynamic Home Screen configuration.
 *
 * Modules:
 *   dashboard_features    — feature cards grid (ordered, enable/disable per role)
 *   dashboard_config      — expert help helpline details
 *   farm_tips             — rotating agricultural tips (seasonal / tagged)
 *   crop_recommendations  — crop suggestions based on season / location
 *
 * All functions return hardcoded defaults on error so the UI is never blank.
 *
 * API response shapes (for backend reference):
 *
 * dashboard_features document:
 *   { id, icon, labelKey, screen, color, bg, enabled, order }
 *
 * dashboard_config document (configKey = 'expert_help'):
 *   { configKey, name, number, hours, tagline, telUrl }
 *
 * farm_tips document:
 *   { tipId, icon, title, body, season, tags[], active, order }
 *   season: 'kharif' | 'rabi' | 'zaid' | 'all'
 *
 * crop_recommendations document:
 *   { cropName, icon, reason, confidence, season, tags[], active }
 *   confidence: 0–100 integer
 */
import api from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME } from './baseUrl';

// ── Static fallbacks ──────────────────────────────────────────────────────────
// Mirrors the previous hardcoded MODULES array in HomeScreen so the grid is
// never empty while the backend config loads.

export const DEFAULT_FEATURES = [
  { id: 'crops',   icon: '🌱', labelKey: 'myCrops',      screen: 'CropsTab',       color: '#4F46E5', bg: '#EEF2FF', enabled: true, order: 1  },
  { id: 'disease', icon: '🔬', labelKey: 'diseasesScan',  screen: 'DiseaseScan',    color: '#8B5CF6', bg: '#F5F3FF', enabled: true, order: 2  },
  { id: 'mandi',   icon: '💰', labelKey: 'mandiBhav',     screen: 'Mandi',          color: '#F59E0B', bg: '#FFFBEB', enabled: true, order: 3  },
  { id: 'water',   icon: '💧', labelKey: 'irrigation',    screen: 'Irrigation',     color: '#06B6D4', bg: '#ECFEFF', enabled: true, order: 4  },
  { id: 'schemes', icon: '🏛️', labelKey: 'govSchemes',    screen: 'GovtSchemes',    color: '#EC4899', bg: '#FDF4FF', enabled: true, order: 5  },
  { id: 'expert',  icon: '📞', labelKey: 'expertHelp',    screen: 'ExpertHelp',     color: '#10B981', bg: '#F0FDF4', enabled: true, order: 6  },
  { id: 'stores',  icon: '🏪', labelKey: 'nearbyStores',  screen: 'NearbyStores',   color: '#F97316', bg: '#FFF7ED', enabled: true, order: 7  },
  { id: 'alerts',  icon: '🔔', labelKey: 'notifications', screen: 'Alerts',         color: '#EF4444', bg: '#FFF1F2', enabled: true, order: 8  },
  { id: 'sowing',  icon: '📅', labelKey: 'sowingAdvisor', screen: 'SowingCalendar', color: '#059669', bg: '#ECFDF5', enabled: true, order: 9  },
  { id: 'nasa',    icon: '🛰️', labelKey: 'nasaWeather',   screen: 'NasaSurface',    color: '#1E1B4B', bg: '#EEF2FF', enabled: true, order: 10 },
];

export const DEFAULT_EXPERT_CONFIG = {
  name:    'Kisan Call Centre',
  number:  '1800-180-1551',
  hours:   'Mon–Sun 6AM–10PM',
  tagline: 'FREE HELPLINE',
  telUrl:  'tel:18001801551',
};

export const DEFAULT_TIPS = [
  {
    _id:    'default_tip_1',
    icon:   '💡',
    title:  'Crop Rotation Tip',
    body:   'Rotate crops every season to restore soil nutrients and reduce pest pressure naturally.',
    season: 'all',
    tags:   ['general'],
  },
  {
    _id:    'default_tip_2',
    icon:   '💧',
    title:  'Save Water with Drip',
    body:   'Drip irrigation delivers water directly to roots and cuts water usage by up to 60%.',
    season: 'all',
    tags:   ['irrigation'],
  },
  {
    _id:    'default_tip_3',
    icon:   '🐛',
    title:  'Early Pest Detection',
    body:   'Inspect crops weekly. Catching pests early reduces chemical use and saves your yield.',
    season: 'all',
    tags:   ['pest', 'general'],
  },
];

// ── Fetchers ──────────────────────────────────────────────────────────────────

/**
 * Fetch enabled feature cards, ordered for display.
 * Falls back to DEFAULT_FEATURES if the API returns nothing or errors.
 */
export async function getDashboardFeatures() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'dashboard_features',
      filter:     { enabled: true },
      sort:       { order: 1 },
      limit:      30,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.length > 0 ? items : DEFAULT_FEATURES;
  } catch {
    return DEFAULT_FEATURES;
  }
}

/**
 * Fetch expert-help helpline configuration.
 * Falls back to DEFAULT_EXPERT_CONFIG on error.
 */
export async function getDashboardExpertConfig() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'dashboard_config',
      filter:     { configKey: 'expert_help' },
      limit:      1,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    return items[0] ?? DEFAULT_EXPERT_CONFIG;
  } catch {
    return DEFAULT_EXPERT_CONFIG;
  }
}

/**
 * Fetch rotating farm tips for the current season.
 * Uses $or to include season-specific AND 'all' tips.
 * Falls back to DEFAULT_TIPS on error or empty response.
 *
 * @param {object} options
 * @param {string} [options.season]  'kharif' | 'rabi' | 'zaid'
 * @param {number} [options.limit]   max tips to return (default 10)
 */
export async function getFarmTips({ season, limit = 10 } = {}) {
  try {
    const filter = { active: true };
    if (season) {
      filter['$or'] = [{ season }, { season: 'all' }];
    }
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'farm_tips',
      filter,
      sort:       { order: 1 },
      limit,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.length > 0 ? items : DEFAULT_TIPS;
  } catch {
    return DEFAULT_TIPS;
  }
}

/**
 * Fetch crop recommendations for the current season.
 * Returns [] on error or empty so the section is hidden when unavailable.
 *
 * @param {object} options
 * @param {string} [options.season]  'kharif' | 'rabi' | 'zaid'
 * @param {number} [options.limit]   max recommendations (default 6)
 */
export async function getCropRecommendations({ season, limit = 6 } = {}) {
  try {
    const filter = { active: true };
    if (season) {
      filter['$or'] = [{ season }, { season: 'all' }];
    }
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'crop_recommendations',
      filter,
      sort:       { confidence: -1 },
      limit,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}
