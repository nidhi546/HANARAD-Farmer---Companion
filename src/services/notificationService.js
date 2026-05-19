/**
 * NotificationService.js
 * Complete Firebase Push Notification service using expo-notifications.
 *
 * HOW FCM WORKS WITH EXPO:
 * expo-notifications uses Expo Push Token (EAS) OR raw FCM token.
 * For Firebase Console sending → use getDevicePushTokenAsync() to get raw FCM token.
 * For topic-based sending → use Firebase Admin SDK or REST API with topic subscriptions.
 *
 * TOPIC SUBSCRIPTION (no backend needed):
 * We simulate topics by storing them locally and using FCM HTTP v1 API
 * from Firebase Console → Cloud Messaging → Send to topic.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Storage, KEYS } from '../utils/storage';

// ─────────────────────────────────────────────────────────────────────────────
// FOREGROUND HANDLER — controls how notifications appear when app is open
// ─────────────────────────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,   // We show our own InAppNotification banner
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// ANDROID CHANNELS
// ─────────────────────────────────────────────────────────────────────────────
export async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;

  const channels = [
    {
      id: 'farmer-alerts',
      name: 'Farmer Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
      description: 'Important alerts for farmers',
    },
    {
      id: 'weather-alerts',
      name: 'Weather Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      description: 'Daily weather updates',
    },
    {
      id: 'market-alerts',
      name: 'Market Price Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Mandi price updates',
    },
    {
      id: 'crop-alerts',
      name: 'Crop & Disease Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      description: 'Crop disease and advisory alerts',
    },
    {
      id: 'reminders',
      name: 'Farm Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Irrigation and crop care reminders',
    },
  ];

  for (const ch of channels) {
    await Notifications.setNotificationChannelAsync(ch.id, ch);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION REQUEST
// ─────────────────────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return false;
  }

  await createAndroidChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  });

  return status === 'granted';
}

// ─────────────────────────────────────────────────────────────────────────────
// GET FCM DEVICE TOKEN
// Use this token in Firebase Console → Cloud Messaging → Send to device
// ─────────────────────────────────────────────────────────────────────────────
export async function getDeviceToken() {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    // getDevicePushTokenAsync() returns the raw FCM token (Android) or APNs token (iOS)
    // This is what you paste in Firebase Console to send to a specific device
    const pushToken = await Notifications.getDevicePushTokenAsync();
    const token = pushToken.data;

    await Storage.set(KEYS.FCM_TOKEN, token);
    console.log('📱 FCM Device Token:', token);
    return token;
  } catch (e) {
    console.log('getDeviceToken error:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC SUBSCRIPTIONS (stored locally — used for Firebase Console topic sends)
//
// HOW TO USE IN FIREBASE CONSOLE:
// 1. Go to Firebase Console → Cloud Messaging
// 2. Click "New notification"
// 3. In "Target" → choose "Topic"
// 4. Enter topic name e.g. "all_farmers" or "crop_cotton"
// 5. Send!
//
// Topics are managed via Firebase REST API. Since we have no backend,
// we store subscribed topics locally and call FCM REST API directly.
// ─────────────────────────────────────────────────────────────────────────────

const FCM_SUBSCRIBE_URL = 'https://iid.googleapis.com/iid/v1';

// Set this via environment config (.env) — never hardcode a real key here.
// Leave empty to skip server-side subscription (topics stored locally only).
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

export async function subscribeToTopic(topic) {
  try {
    const token = await Storage.get(KEYS.FCM_TOKEN);
    if (!token || !FCM_SERVER_KEY) {
      // No token or key — store locally so we remember the subscriptions
      await _saveLocalTopic(topic);
      return;
    }

    const res = await fetch(`${FCM_SUBSCRIBE_URL}/${token}/rel/topics/${topic}`, {
      method: 'POST',
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
        access_token_auth: 'true',
      },
    });

    if (res.ok) {
      await _saveLocalTopic(topic);
      console.log(`✅ Subscribed to topic: ${topic}`);
    }
  } catch (e) {
    console.log(`subscribeToTopic error (${topic}):`, e.message);
    await _saveLocalTopic(topic); // save locally anyway
  }
}

export async function unsubscribeFromTopic(topic) {
  try {
    const token = await Storage.get(KEYS.FCM_TOKEN);
    if (!token || !FCM_SERVER_KEY) {
      await _removeLocalTopic(topic);
      return;
    }

    await fetch(`${FCM_SUBSCRIBE_URL}/${token}/rel/topics/${topic}`, {
      method: 'DELETE',
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
        access_token_auth: 'true',
      },
    });

    await _removeLocalTopic(topic);
    console.log(`🚫 Unsubscribed from topic: ${topic}`);
  } catch (e) {
    console.log(`unsubscribeFromTopic error (${topic}):`, e.message);
    await _removeLocalTopic(topic);
  }
}

async function _saveLocalTopic(topic) {
  const topics = (await Storage.get('fcm_topics')) || [];
  if (!topics.includes(topic)) {
    await Storage.set('fcm_topics', [...topics, topic]);
  }
}

async function _removeLocalTopic(topic) {
  const topics = (await Storage.get('fcm_topics')) || [];
  await Storage.set('fcm_topics', topics.filter(t => t !== topic));
}

export async function getSubscribedTopics() {
  return (await Storage.get('fcm_topics')) || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBE USER TO ALL RELEVANT TOPICS ON LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export async function subscribeUserTopics({ userId, village, cropType, language }) {
  const topics = [
    'all_farmers',
    userId   ? `user_${userId}`           : null,
    village  ? `village_${village.toLowerCase().replace(/\s+/g, '_')}` : null,
    cropType ? `crop_${cropType.toLowerCase().replace(/\s+/g, '_')}`   : null,
    language ? `language_${language.toLowerCase()}`                    : null,
  ].filter(Boolean);

  for (const topic of topics) {
    await subscribeToTopic(topic);
  }

  console.log('📡 Subscribed to topics:', topics);
  return topics;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNSUBSCRIBE ALL TOPICS ON LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export async function unsubscribeAllTopics() {
  const topics = await getSubscribedTopics();
  for (const topic of topics) {
    await unsubscribeFromTopic(topic);
  }
  await Storage.set('fcm_topics', []);
  console.log('🚫 Unsubscribed from all topics');
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND TOKEN REGISTRATION (optional — for when backend is ready)
// ─────────────────────────────────────────────────────────────────────────────
const BACKEND_URL = 'http://YOUR_BACKEND_IP:3000';

export async function saveTokenToBackend(userId, token, language = 'en') {
  try {
    await fetch(`${BACKEND_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deviceToken: token, platform: Platform.OS, language }),
    });
  } catch (e) {
    // Silently fail — backend not ready yet
  }
}

export async function removeTokenFromBackend(userId) {
  try {
    const token = await Storage.get(KEYS.FCM_TOKEN);
    if (!token) return;
    await fetch(`${BACKEND_URL}/api/notifications/remove-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deviceToken: token }),
    });
  } catch (e) {
    // Silently fail
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION HISTORY (AsyncStorage)
// ─────────────────────────────────────────────────────────────────────────────
export async function getNotificationHistory() {
  return (await Storage.get(KEYS.NOTIFICATION_HISTORY)) || [];
}

export async function saveNotificationToHistory(notification) {
  try {
    const history = await getNotificationHistory();
    const content = notification.request?.content ?? notification;

    const entry = {
      id:          notification.request?.identifier ?? `notif_${Date.now()}`,
      title:       content.title  ?? 'Notification',
      message:     content.body   ?? '',
      image:       content.data?.image ?? null,
      data:        content.data   ?? {},
      type:        content.data?.type   ?? 'general',
      screen:      content.data?.screen ?? null,
      isRead:      false,
      createdAt:   new Date().toISOString(),
      receivedFromFirebase: true,
    };

    // Deduplicate by id
    if (history.find(h => h.id === entry.id)) return null;

    const updated = [entry, ...history].slice(0, 100); // keep last 100
    await Storage.set(KEYS.NOTIFICATION_HISTORY, updated);
    return entry;
  } catch (e) {
    console.log('saveNotificationToHistory error:', e);
    return null;
  }
}

export async function markNotificationRead(id) {
  const history = await getNotificationHistory();
  const updated = history.map(n => n.id === id ? { ...n, isRead: true } : n);
  await Storage.set(KEYS.NOTIFICATION_HISTORY, updated);
  return updated;
}

export async function markAllNotificationsRead() {
  const history = await getNotificationHistory();
  const updated = history.map(n => ({ ...n, isRead: true }));
  await Storage.set(KEYS.NOTIFICATION_HISTORY, updated);
  return updated;
}

export async function deleteNotification(id) {
  const history = await getNotificationHistory();
  const updated = history.filter(n => n.id !== id);
  await Storage.set(KEYS.NOTIFICATION_HISTORY, updated);
  return updated;
}

export async function clearAllNotifications() {
  await Storage.set(KEYS.NOTIFICATION_HISTORY, []);
}

export async function getUnreadCount() {
  const history = await getNotificationHistory();
  return history.filter(n => !n.isRead).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED LOCAL NOTIFICATIONS (no internet needed)
// ─────────────────────────────────────────────────────────────────────────────

/** Schedule a one-time local notification after `seconds` */
export async function scheduleLocalNotification({ title, body, data = {}, seconds = 1, channelId = 'farmer-alerts' }) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

/** Daily irrigation reminder at a specific hour:minute */
export async function scheduleIrrigationReminder(hour = 6, minute = 0) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 Irrigation Reminder / સિંચાઈ રીમાઇન્ડર',
      body: 'Time to water your crops! Check soil moisture levels.',
      data: { type: 'reminder', screen: 'Irrigation' },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** Daily weather alert placeholder at 7 AM */
export async function scheduleDailyWeatherAlert() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '⛅ Today\'s Weather / આજનું હવામાન',
      body: 'Check today\'s weather forecast for your farm.',
      data: { type: 'weather', screen: 'Weather' },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'weather-alerts' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 0,
    },
  });
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE COUNT
// ─────────────────────────────────────────────────────────────────────────────
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}
