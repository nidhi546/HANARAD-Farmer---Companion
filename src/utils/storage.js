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
  AUTH_TOKEN: 'authToken',
  AUTH_USER: 'authUser',
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
};
