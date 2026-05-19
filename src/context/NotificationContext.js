import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback,
} from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth }     from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useLocation } from './LocationContext';
import {
  getNotificationHistory,
  saveNotificationToHistory,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getDeviceToken,
  subscribeUserTopics,
  unsubscribeAllTopics,
  setBadgeCount,
  clearBadge,
  scheduleIrrigationReminder,
  scheduleDailyWeatherAlert,
} from '../services/notificationService';

const NotificationContext = createContext({});

export function NotificationProvider({ children, navigationRef }) {
  const { user }      = useAuth();
  const { language }  = useLanguage();
  const { location }  = useLocation();

  const [notifications, setNotifications]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const [inAppNotification, setInAppNotification] = useState(null);
  const [deviceToken, setDeviceToken]             = useState(null);

  const foregroundSub = useRef(null);
  const responseSub   = useRef(null);
  const lastNotifId   = useRef(null);

  // ── Reload history from AsyncStorage ───────────────────────────────────────
  const loadHistory = useCallback(async () => {
    const history = await getNotificationHistory();
    setNotifications(history);
    const unread = history.filter(n => !n.isRead).length;
    setUnreadCount(unread);
    await setBadgeCount(unread);
  }, []);

  // ── Init on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadHistory();
    initListeners();
    initToken();

    return () => {
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);

  // ── Subscribe to topics when user logs in ───────────────────────────────────
  useEffect(() => {
    if (user?.id && deviceToken) {
      subscribeUserTopics({
        userId:   user.id,
        village:  location.city,
        cropType: user.cropType || 'general',
        language: language || 'en',
      });
    }
  }, [user?.id, deviceToken, location.city, language]);

  async function initToken() {
    const token = await getDeviceToken();
    if (token) {
      setDeviceToken(token);
      console.log('📱 FCM Token ready:', token.slice(0, 20) + '...');
    }
  }

  async function initListeners() {
    // ── FOREGROUND: app open, notification arrives → show in-app banner ──────
    foregroundSub.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const entry = await saveNotificationToHistory(notification);
        await loadHistory();

        // Prevent duplicate in-app banners
        if (entry && entry.id !== lastNotifId.current) {
          lastNotifId.current = entry.id;
          setInAppNotification(entry);
        }
      },
    );

    // ── BACKGROUND/KILLED: user taps notification → navigate to screen ───────
    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const notification = response.notification;
        await saveNotificationToHistory(notification);
        await loadHistory();

        const screen = notification.request?.content?.data?.screen;
        if (screen && navigationRef?.current?.isReady()) {
          setTimeout(() => {
            navigationRef.current.navigate(screen);
          }, 300);
        }
      },
    );

    // ── KILLED STATE: last notification that opened the app ──────────────────
    const lastNotif = await Notifications.getLastNotificationResponseAsync();
    if (lastNotif) {
      await saveNotificationToHistory(lastNotif.notification);
      await loadHistory();

      const screen = lastNotif.notification.request?.content?.data?.screen;
      if (screen && navigationRef?.current?.isReady()) {
        setTimeout(() => {
          navigationRef.current.navigate(screen);
        }, 500);
      }
    }
  }

  // ── Actions exposed to consumers ──────────────────────────────────────────
  const dismissInApp = () => {
    setInAppNotification(null);
    lastNotifId.current = null;
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    await loadHistory();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadHistory();
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    await loadHistory();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    await loadHistory();
    await clearBadge();
  };

  const handleLogout = async () => {
    await unsubscribeAllTopics();
    await clearBadge();
  };

  // ── Schedule local reminders ──────────────────────────────────────────────
  const scheduleIrrigationAlert = async (hour = 6, minute = 0) => {
    await scheduleIrrigationReminder(hour, minute);
  };

  const scheduleWeatherAlert = async () => {
    await scheduleDailyWeatherAlert();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        inAppNotification,
        deviceToken,
        loadHistory,
        dismissInApp,
        markRead:    handleMarkRead,
        markAllRead: handleMarkAllRead,
        deleteOne:   handleDelete,
        clearAll:    handleClearAll,
        onLogout:    handleLogout,
        scheduleIrrigationAlert,
        scheduleWeatherAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
