/**
 * firebaseTopics.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO SEND NOTIFICATIONS FROM FIREBASE CONSOLE (No Backend Needed)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * STEP 1: Go to https://console.firebase.google.com
 * STEP 2: Select your project
 * STEP 3: Left menu → Engage → Messaging
 * STEP 4: Click "New campaign" → "Firebase Notification messages"
 *
 * ── SEND TO SINGLE DEVICE ────────────────────────────────────────────────────
 * Target: "Single device"
 * FCM registration token: (paste the token shown in app console logs)
 *
 * ── SEND TO ALL FARMERS ──────────────────────────────────────────────────────
 * Target: "Topic"
 * Topic name: all_farmers
 *
 * ── SEND TO SPECIFIC USER ────────────────────────────────────────────────────
 * Target: "Topic"
 * Topic name: user_101   (replace 101 with actual userId)
 *
 * ── SEND TO COTTON FARMERS ───────────────────────────────────────────────────
 * Target: "Topic"
 * Topic name: crop_cotton
 *
 * ── SEND TO GUJARATI USERS ───────────────────────────────────────────────────
 * Target: "Topic"
 * Topic name: language_gujarati
 *
 * ── SEND TO RAJKOT VILLAGE ───────────────────────────────────────────────────
 * Target: "Topic"
 * Topic name: village_rajkot
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CUSTOM DATA PAYLOAD (for navigation on tap)
 * ─────────────────────────────────────────────────────────────────────────────
 * In Firebase Console → "Additional options" → "Custom data":
 *
 * Key: screen    Value: Weather       → opens WeatherScreen
 * Key: screen    Value: Mandi         → opens MandiScreen
 * Key: screen    Value: Notifications → opens NotificationsScreen
 * Key: type      Value: weather       → shows weather icon in banner
 * Key: type      Value: market        → shows market icon in banner
 * Key: type      Value: disease       → shows disease icon in banner
 * Key: type      Value: crop          → shows crop icon in banner
 * Key: image     Value: https://...   → shows image in notification card
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TOPIC NAMING CONVENTION
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const TOPICS = {
  ALL_FARMERS:  'all_farmers',
  user:         (id)       => `user_${id}`,
  village:      (name)     => `village_${name.toLowerCase().replace(/\s+/g, '_')}`,
  crop:         (cropName) => `crop_${cropName.toLowerCase().replace(/\s+/g, '_')}`,
  language:     (lang)     => `language_${lang.toLowerCase()}`,
};

export const NOTIFICATION_TYPES = {
  WEATHER:  'weather',
  MARKET:   'market',
  DISEASE:  'disease',
  SCHEME:   'scheme',
  RAIN:     'rain',
  CROP:     'crop',
  REMINDER: 'reminder',
  GENERAL:  'general',
};

export const SCREEN_ROUTES = {
  Weather:       'Weather',
  Mandi:         'Mandi',
  Notifications: 'Notifications',
  Irrigation:    'Irrigation',
  DiseaseScan:   'DiseaseScan',
  GovtSchemes:   'GovtSchemes',
  CropAdvisor:   'Crops',
  Home:          'Home',
};
