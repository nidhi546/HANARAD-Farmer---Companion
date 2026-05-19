/**
 * Analytics utility for HANARAD Farmer-Companion
 *
 * Wraps @react-native-firebase/analytics with a safe no-op fallback so the app
 * never crashes when Firebase is unavailable (e.g. Expo Go, CI builds).
 *
 * Usage:
 *   import Analytics from '../utils/analytics';
 *   Analytics.logScreenView('HomeScreen');
 *   Analytics.logEvent(Analytics.Events.LOGIN, { method: 'email' });
 */

let _analytics = null;

// Lazy-load Firebase Analytics — avoids bundler errors when the native module
// is not linked (Expo Go, web, unit tests).
const getAnalytics = () => {
  if (_analytics) return _analytics;
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    _analytics = require('@react-native-firebase/analytics').default();
  } catch (_) {
    // No-op stub so every call below is safe even without Firebase linked
    _analytics = {
      logScreenView: async () => {},
      logEvent:      async () => {},
      logLogin:      async () => {},
      logSignUp:     async () => {},
      setUserProperty: async () => {},
      setUserId:     async () => {},
    };
  }
  return _analytics;
};

// ── Event name constants ────────────────────────────────────────────────────
// Firebase Analytics allows up to 40 chars; snake_case convention.
const Events = {
  // Session
  APP_OPEN:             'app_open',
  // Auth
  LOGIN:                'login',
  REGISTER:             'sign_up',
  LOGOUT:               'logout',
  // Onboarding
  ONBOARDING_COMPLETE:  'onboarding_complete',
  // Language
  LANGUAGE_CHANGED:     'language_changed',
  // Weather
  WEATHER_CHECKED:      'weather_checked',
  FORECAST_VIEWED:      'forecast_viewed',
  ALERTS_VIEWED:        'alerts_viewed',
  // Crops
  CROP_ADVISOR_VIEWED:  'crop_advisor_viewed',
  CROP_SCAN_STARTED:    'crop_scan_started',
  CROP_SCAN_RESULT:     'crop_scan_result',
  // Marketplace / Mandi
  MANDI_VIEWED:         'mandi_viewed',
  MARKET_SELECTED:      'market_selected',
  // Farm
  FARM_DRAW_STARTED:    'farm_draw_started',
  FARM_SAVED:           'farm_saved',
  FARM_WALK_STARTED:    'farm_walk_started',
  // Tools
  SMART_TOOL_USED:      'smart_tool_used',
  // Schemes
  SCHEME_VIEWED:        'scheme_viewed',
  // Settings
  THEME_TOGGLED:        'theme_toggled',
  // Legal
  DISCLAIMER_ACCEPTED:  'disclaimer_accepted',
  PRIVACY_VIEWED:       'privacy_viewed',
  TERMS_VIEWED:         'terms_viewed',
  // General
  BUTTON_CLICK:         'button_click',
  SCREEN_VIEW:          'screen_view',
};

// ── Helper methods ──────────────────────────────────────────────────────────

/** Log a screen view (called from screen onFocus or useEffect). */
const logScreenView = async (screenName, screenClass) => {
  try {
    await getAnalytics().logScreenView({
      screen_name:  screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch (_) {}
};

/**
 * Log a named event with optional params.
 * Params must be a flat object of string/number/boolean values.
 */
const logEvent = async (eventName, params = {}) => {
  try {
    await getAnalytics().logEvent(eventName, params);
  } catch (_) {}
};

/** Convenience: track a login action. */
const logLogin = async (method = 'email') => {
  try {
    await getAnalytics().logLogin({ method });
  } catch (_) {}
};

/** Convenience: track a registration action. */
const logSignUp = async (method = 'email') => {
  try {
    await getAnalytics().logSignUp({ method });
  } catch (_) {}
};

/** Attach a non-PII user property (e.g. preferred language). */
const setUserProperty = async (name, value) => {
  try {
    await getAnalytics().setUserProperty(name, String(value));
  } catch (_) {}
};

/** Attach an anonymous user ID (do NOT pass real PII). */
const setUserId = async (userId) => {
  try {
    await getAnalytics().setUserId(String(userId));
  } catch (_) {}
};

// ── Convenience event helpers (named for call-site clarity) ────────────────

const logLanguageChange = (langCode) =>
  logEvent(Events.LANGUAGE_CHANGED, { language: langCode });

const logWeatherCheck = (lat, lon) =>
  logEvent(Events.WEATHER_CHECKED, { lat: String(lat), lon: String(lon) });

const logCropScanStarted = (source) =>
  logEvent(Events.CROP_SCAN_STARTED, { source }); // 'camera' | 'gallery'

const logCropScanResult = (disease, confidence) =>
  logEvent(Events.CROP_SCAN_RESULT, { disease, confidence: String(confidence) });

const logMandiViewed = () =>
  logEvent(Events.MANDI_VIEWED);

const logMarketSelected = (marketName) =>
  logEvent(Events.MARKET_SELECTED, { market: marketName });

const logFarmSaved = (method) =>
  logEvent(Events.FARM_SAVED, { method }); // 'draw' | 'walk'

const logSmartToolUsed = (toolName) =>
  logEvent(Events.SMART_TOOL_USED, { tool: toolName });

const logDisclaimerAccepted = () =>
  logEvent(Events.DISCLAIMER_ACCEPTED);

const logButtonClick = (buttonName, screenName) =>
  logEvent(Events.BUTTON_CLICK, { button: buttonName, screen: screenName });

// ── Default export ──────────────────────────────────────────────────────────
const Analytics = {
  Events,
  logScreenView,
  logEvent,
  logLogin,
  logSignUp,
  setUserProperty,
  setUserId,
  // Convenience
  logLanguageChange,
  logWeatherCheck,
  logCropScanStarted,
  logCropScanResult,
  logMandiViewed,
  logMarketSelected,
  logFarmSaved,
  logSmartToolUsed,
  logDisclaimerAccepted,
  logButtonClick,
};

export default Analytics;
