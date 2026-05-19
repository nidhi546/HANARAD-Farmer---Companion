/**
 * DrawerContent — side navigation drawer
 *
 * Android: Pressable ripple on menu items + profile buttons
 * iOS:     Opacity feedback, no ripple
 * Both:    SafeAreaView edges, dark mode, language switch
 */

import React, { useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  ScrollView, Switch, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }          from '../context/AuthContext';
import { useLocation }      from '../context/LocationContext';
import { useLanguage }      from '../context/LanguageContext';
import { useTheme }         from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { shadow, ripple, typography, spacing, radius, MIN_TOUCH } from '../utils/ui';

const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'gu', label: 'ગુ' },
  { code: 'hi', label: 'हि' },
  { code: 'tl', label: 'FIL' },
];

// Screens that live inside BottomTabNavigator (nested under 'Tabs' drawer screen).
// These need navigate('Tabs', { screen: name }) from the drawer.
const TAB_SCREENS = new Set(['HomeTab', 'WeatherTab', 'FarmTab', 'CropsTab', 'ProfileTab']);

function getMenuItems(t) {
  return [
    { name: 'HomeTab',     icon: '🏠', label: t('home')           },
    { name: 'WeatherTab',  icon: '🌤️', label: t('weather')        },
    { name: 'History',     icon: '📊', label: t('history')        },
    { name: 'CropsTab',    icon: '🌱', label: t('crops')          },
    { name: 'Alerts',      icon: '🔔', label: t('alerts')         },
    { name: 'ProfileTab',  icon: '👤', label: t('profile')        },
    { name: 'HelpSupport', icon: '❓', label: t('helpSupport')    },
    { name: 'NasaSurface', icon: '🛰️', label: t('nasaWeather')    },
    { name: 'SmartTools',  icon: '🔧', label: t('smartToolsMenu') },
  ];
}

export default function DrawerContent({ state, navigation }) {
  const { user, logout }                = useAuth();
  const { location }                    = useLocation();
  const { t, language, changeLanguage } = useLanguage();
  const { isDark, toggleTheme, theme }  = useTheme();
  const { onLogout: notifLogout }       = useNotifications();

  const styles    = useMemo(() => makeStyles(theme), [theme]);
  const menuItems = useMemo(() => getMenuItems(t), [t]);

  // The drawer only has one route ('Tabs'). To know which tab is active we
  // look one level deeper into the nested tab state.
  const activeRoute = useMemo(() => {
    const tabsRoute = state.routes.find(r => r.name === 'Tabs');
    const tabState  = tabsRoute?.state;
    if (tabState) {
      return tabState.routeNames?.[tabState.index] ?? 'HomeTab';
    }
    return 'HomeTab';
  }, [state]);

  // Unified navigate: tab screens need the nested path; stack screens navigate directly.
  const goTo = (screenName) => {
    if (TAB_SCREENS.has(screenName)) {
      navigation.navigate('Tabs', { screen: screenName });
    } else {
      navigation.navigate(screenName);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'FA';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = async () => {
    await notifLogout().catch(() => {});
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ── Profile Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.avatarCircle}
          onPress={() => goTo('ProfileTab')}
          {...ripple('rgba(255,255,255,0.2)', true)}
          accessibilityRole="button"
          accessibilityLabel="View profile"
        >
          {user?.photo
            ? <Image source={{ uri: user.photo }} style={styles.avatarImage} />
            : <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>}
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.userName} numberOfLines={1}>{user?.name || t('farmer')}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ''}</Text>
          <Pressable
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
            {...ripple('rgba(255,255,255,0.15)')}
          >
            <Text style={styles.editProfileText}>✏️ {t('editProfile')}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Location Badge ───────────────────────────────────────── */}
      <Pressable
        style={styles.locationBadge}
        onPress={() => navigation.navigate('Location')}
        {...ripple(theme.primary + '15')}
        accessibilityRole="button"
      >
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>{location.city}</Text>
        <Text style={styles.locationChange}>{t('change')} ›</Text>
      </Pressable>

      <View style={styles.divider} />

      {/* ── Language Grid (2 × 2) + Dark Mode ───────────────────── */}
      <View style={styles.settingsBlock}>
        {/* Header row: globe icon + dark mode toggle */}
        <View style={styles.settingsTopRow}>
          <Text style={styles.langRowLabel}>🌐 Language</Text>
          <View style={styles.darkModeToggle}>
            <Text style={styles.darkModeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CBD5E1"
              style={Platform.OS === 'android' ? { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] } : {}}
            />
          </View>
        </View>

        {/* 2 × 2 language grid */}
        <View style={styles.langGrid}>
          {LANG_OPTIONS.map((opt) => {
            const isActive = language === opt.code;
            return (
              <Pressable
                key={opt.code}
                style={[styles.langBtn, isActive && styles.langBtnActive]}
                onPress={() => changeLanguage(opt.code)}
                {...ripple(theme.primary + '18')}
              >
                <Text style={[styles.langBtnText, isActive && styles.langBtnTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Menu Items ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.menuSectionLabel}>{t('menu')}</Text>

        {menuItems.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <Pressable
              key={item.name}
              style={({ pressed }) => [
                styles.menuItem,
                isActive && styles.menuItemActive,
                pressed && Platform.OS === 'ios' && { opacity: 0.75 },
              ]}
              onPress={() => goTo(item.name)}
              {...ripple(isActive ? theme.primary + '20' : theme.border + '80')}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isActive }}
            >
              {isActive && <View style={styles.activeBar} />}
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}>
                {item.label}
              </Text>
              {isActive && (
                <View style={styles.activeDot} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Bottom: Logout + Version ─────────────────────────────── */}
      <View style={styles.bottom}>
        <View style={styles.divider} />

        <Pressable
          style={styles.logoutBtn}
          onPress={handleLogout}
          {...ripple('#FCA5A5')}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('appVersion')}</Text>
          <Text style={styles.footerSub}>{t('poweredBy')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.drawerBg },

    // ── Header ────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[5],
      paddingTop: Platform.select({ ios: spacing[2], android: spacing[4] }),
      paddingBottom: spacing[5],
      backgroundColor: theme.primary,
    },
    avatarCircle: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.4)',
      overflow: 'hidden',
    },
    avatarImage: { width: 56, height: 56, borderRadius: radius.pill },
    avatarText: { ...typography.h3, color: '#FFFFFF' },
    headerInfo:   { flex: 1, marginLeft: spacing[3] },
    userName:     { ...typography.h5, color: '#FFFFFF' },
    userEmail:    { ...typography.caption, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
    editProfileBtn: {
      marginTop: spacing[2],
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.pill,
      paddingHorizontal: spacing[3],
      paddingVertical: 4,
      overflow: 'hidden',
    },
    editProfileText: { ...typography.tiny, color: '#FFFFFF', fontWeight: '600' },

    // ── Location ──────────────────────────────────────────────────
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing[4],
      marginVertical: spacing[3],
      backgroundColor: theme.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...shadow(1),
    },
    locationIcon:   { fontSize: 14, marginRight: spacing[2] },
    locationText:   { flex: 1, ...typography.bodyBold, color: theme.text },
    locationChange: { ...typography.label, color: theme.primary },

    // ── Divider ───────────────────────────────────────────────────
    divider: { height: 1, backgroundColor: theme.border, marginHorizontal: spacing[4] },

    // ── Settings Block (lang grid + dark mode) ───────────────────
    settingsBlock: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    settingsTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[2] + 2,
    },
    langRowLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.subtext,
    },
    langGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    langBtn: {
      width: '47%',
      paddingVertical: spacing[2],
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    langBtnActive:     { backgroundColor: theme.light, borderColor: theme.primary },
    langBtnText:       { ...typography.label, color: theme.subtext, fontWeight: '600' },
    langBtnTextActive: { color: theme.primary, fontWeight: '800' },
    darkModeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    darkModeIcon: { fontSize: 16 },

    // ── Menu ──────────────────────────────────────────────────────
    menuScroll: { flex: 1, marginTop: spacing[1] },
    menuSectionLabel: {
      ...typography.tiny,
      color: theme.subtext,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginLeft: spacing[5],
      marginBottom: spacing[1],
      marginTop: spacing[2],
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing[3],
      marginVertical: 1,
      paddingVertical: Platform.select({ ios: 13, android: 14 }),
      paddingHorizontal: spacing[3] + 1,
      borderRadius: radius.md,
      overflow: 'hidden',
      position: 'relative',
      minHeight: MIN_TOUCH,
    },
    menuItemActive: { backgroundColor: theme.light },
    activeBar: {
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      backgroundColor: theme.primary,
      borderRadius: 2,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: theme.primary,
    },
    menuIcon:            { fontSize: 20, width: 28, textAlign: 'center' },
    menuItemLabel:       { flex: 1, ...typography.bodyBold, color: theme.subtext, marginLeft: spacing[3] + 1, fontWeight: '500' },
    menuItemLabelActive: { color: theme.primary, fontWeight: '700' },

    // ── Bottom ────────────────────────────────────────────────────
    bottom: { paddingBottom: spacing[2] },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing[3],
      marginVertical: spacing[2],
      paddingVertical: Platform.select({ ios: 13, android: 14 }),
      paddingHorizontal: spacing[3] + 1,
      borderRadius: radius.md,
      backgroundColor: theme.dangerLight,
      overflow: 'hidden',
      minHeight: MIN_TOUCH,
    },
    logoutIcon: { fontSize: 18, width: 28, textAlign: 'center' },
    logoutText: { ...typography.bodyBold, color: theme.danger, marginLeft: spacing[3] + 1 },
    footer:     { alignItems: 'center', paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
    footerText: { ...typography.caption, color: theme.subtext, fontWeight: '600' },
    footerSub:  { ...typography.tiny, color: theme.subtext, marginTop: 2, textAlign: 'center', opacity: 0.6 },
  });
}
