import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }          from '../context/ThemeContext';
import { useLanguage }       from '../context/LanguageContext';
import { useNotifications }  from '../context/NotificationContext';
import { useNavigation }     from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  weather:  { color: '#06B6D4', bg: '#ECFEFF', icon: '⛅', label: 'Weather' },
  market:   { color: '#F59E0B', bg: '#FFFBEB', icon: '💰', label: 'Market' },
  disease:  { color: '#EF4444', bg: '#FEF2F2', icon: '🔬', label: 'Disease' },
  scheme:   { color: '#10B981', bg: '#ECFDF5', icon: '🏛️', label: 'Scheme' },
  rain:     { color: '#3B82F6', bg: '#EFF6FF', icon: '🌧️', label: 'Rain' },
  crop:     { color: '#059669', bg: '#ECFDF5', icon: '🌱', label: 'Crop' },
  reminder: { color: '#8B5CF6', bg: '#F5F3FF', icon: '⏰', label: 'Reminder' },
  general:  { color: '#4F46E5', bg: '#EEF2FF', icon: '🔔', label: 'General' },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loadHistory,
    markRead,
    markAllRead,
    deleteOne,
    clearAll,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleNotificationPress = async (notif) => {
    if (!notif.isRead) await markRead(notif.id);
    if (notif.screen) navigation.navigate(notif.screen);
  };

  const handleDelete = (id) => {
    Alert.alert(
      t('notifDeleteTitle'),
      t('notifDeleteMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteOne(id) },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('notifClearTitle'),
      t('notifClearMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('notifClearAll'), style: 'destructive', onPress: clearAll },
      ],
    );
  };

  const filteredNotifs = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('notificationsTitle')}</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} ${t('notifNew')}` : t('notifAllCaughtUp')}
          </Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Text style={styles.clearBtnText}>{t('notifClearAll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            {t('notifAll')} ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            {t('notifUnread')} ({unreadCount})
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>✓ {t('notifMarkAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {filteredNotifs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>{t('notifEmpty')}</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread' ? t('notifAllRead') : t('notifNoneYet')}
            </Text>
          </View>
        ) : (
          filteredNotifs.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  !notif.isRead && styles.notifCardUnread,
                  { borderLeftColor: config.color },
                ]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                  <Text style={styles.iconText}>{config.icon}</Text>
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={2}>
                      {notif.title}
                    </Text>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.notifBody, { color: theme.subtext }]} numberOfLines={3}>
                    {notif.message}
                  </Text>
                  {notif.image && (
                    <Image source={{ uri: notif.image }} style={styles.notifImage} />
                  )}
                  <View style={styles.notifFooter}>
                    <Text style={[styles.notifTime, { color: theme.subtext }]}>
                      {formatTime(notif.createdAt)}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(notif.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },

    // Header
    header: {
      backgroundColor: theme.primary,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 20,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
    headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    clearBtn: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    },
    clearBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    // Filter tabs
    filterRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: theme.card,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    filterTab: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, marginRight: 8,
      backgroundColor: theme.background,
    },
    filterTabActive: { backgroundColor: theme.primary + '18' },
    filterTabText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
    filterTabTextActive: { color: theme.primary, fontWeight: '700' },
    markAllBtn: {
      marginLeft: 'auto',
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 10, backgroundColor: theme.primary + '12',
    },
    markAllText: { fontSize: 12, fontWeight: '700', color: theme.primary },

    // Scroll content
    scrollContent: { padding: 16 },

    // Notification card
    notifCard: {
      backgroundColor: theme.card,
      borderRadius: 16, padding: 14,
      marginBottom: 12,
      flexDirection: 'row', alignItems: 'flex-start',
      borderWidth: 1, borderColor: theme.border,
      borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    notifCardUnread: {
      backgroundColor: theme.primary + '08',
      borderColor: theme.primary + '30',
    },
    iconBox: {
      width: 44, height: 44, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    iconText: { fontSize: 22 },
    notifContent: { flex: 1 },
    notifHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    notifTitle: { fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 19 },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: '#EF4444', marginLeft: 6, marginTop: 4,
    },
    notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
    notifImage: {
      width: '100%', height: 140, borderRadius: 12, marginBottom: 8,
      backgroundColor: theme.border,
    },
    notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    notifTime: { fontSize: 11, fontWeight: '600' },
    typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    typeBadgeText: { fontSize: 10, fontWeight: '700' },
    deleteBtn: {
      width: 28, height: 28, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.border, marginLeft: 8,
    },
    deleteText: { fontSize: 13, color: theme.subtext },

    // Empty state
    emptyBox: { alignItems: 'center', paddingVertical: 80 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 6 },
    emptyText: { fontSize: 14, color: theme.subtext, textAlign: 'center', paddingHorizontal: 32 },
  });
}
