import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  get: async (key) => {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove: async (key) => {
    try { await AsyncStorage.removeItem(key); } catch {}
  },
  multiRemove: async (keys) => {
    try { await AsyncStorage.multiRemove(keys); } catch {}
  },
};

export const KEYS = {
  AUTH_TOKEN:    'authToken',
  REFRESH_TOKEN: 'refreshToken',
  AUTH_USER:     'authUser',
  USER_LOCATION: 'userLocation',
  ONBOARDING_DONE: 'onboardingDone',
  LANGUAGE: 'appLanguage',
  LANGUAGE_SELECTED: 'languageSelected',
  // New feature keys
  EXPENSES: 'farmExpenses',
  DIARY: 'farmDiary',
  CROP_CALENDAR: 'cropCalendar',
  MANDI_CACHE: 'mandiCache',
  WEATHER_CACHE: 'weatherCache',
  // Notifications
  NOTIFICATION_HISTORY: 'notificationHistory',
  FCM_TOKEN: 'fcmDeviceToken',
  // Permissions & first-launch
  PERMISSIONS_DONE: 'permissionsDone',
  PROFILE_SETUP_DONE: 'profileSetupDone',
  // Farm map & saved farms
  SAVED_FARMS: 'savedFarms',
  SELECTED_MAP_STYLE: 'selectedMapStyle', // 'street' | 'satellite'
  // Legal
  DISCLAIMER_ACCEPTED: 'disclaimerAccepted',
  // Crop advisor
  USER_CROPS:            'userCrops',
  CLIMATE_CACHE:         'climateCache',
  CROP_MASTER_CACHE:     'cropMasterCache',
  // Crop management
  RECENT_CROPS:          'recentCrops',          // [cropId, ...] last 10 selections
  PENDING_CROP_MASTERS:  'pendingCropMasters',   // user-submitted pending crops (local copy)
};

/**
 * AuthStorage — typed helpers for all authentication-related storage.
 * Use these instead of raw Storage.get/set for auth data so key names
 * are never scattered across the codebase.
 */
export const AuthStorage = {
  // Access token (JWT)
  saveAccessToken:   (token)  => Storage.set(KEYS.AUTH_TOKEN, token),
  getAccessToken:    ()       => Storage.get(KEYS.AUTH_TOKEN),
  removeAccessToken: ()       => Storage.remove(KEYS.AUTH_TOKEN),

  // Refresh token
  saveRefreshToken:   (token) => Storage.set(KEYS.REFRESH_TOKEN, token),
  getRefreshToken:    ()      => Storage.get(KEYS.REFRESH_TOKEN),
  removeRefreshToken: ()      => Storage.remove(KEYS.REFRESH_TOKEN),

  // User object
  saveUser:   (user) => Storage.set(KEYS.AUTH_USER, user),
  getUser:    ()     => Storage.get(KEYS.AUTH_USER),
  removeUser: ()     => Storage.remove(KEYS.AUTH_USER),

  // True when an access token exists in storage
  isLoggedIn: async () => {
    const token = await Storage.get(KEYS.AUTH_TOKEN);
    return Boolean(token);
  },

  // Wipe all auth data on logout or session expiry
  clearAll: () =>
    Storage.multiRemove([KEYS.AUTH_TOKEN, KEYS.REFRESH_TOKEN, KEYS.AUTH_USER]),
};
