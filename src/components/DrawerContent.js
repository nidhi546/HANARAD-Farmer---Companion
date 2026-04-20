import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }     from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';

// ── Language options ────────────────────────────────────────────────────────
const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'gu', label: 'ગુ' },
  { code: 'hi', label: 'हि' },
];

// ── Menu items ──────────────────────────────────────────────────────────────
function getMenuItems(t) {
  return [
    { name: 'Home',        icon: '🏠', label: t('home')        },
    { name: 'Weather',     icon: '🌤️', label: t('weather')     },
    { name: 'History',     icon: '📊', label: t('history')     },
    { name: 'Crops',       icon: '🌱', label: t('crops')       },
    { name: 'Alerts',      icon: '🔔', label: t('alerts')      },
    { name: 'Profile',     icon: '👤', label: t('profile')     },
    { name: 'HelpSupport', icon: '❓', label: t('helpSupport') },
    { name: 'NasaSurface', icon: '🛰️', label: t('nasaWeather') },
  ];
}

// ── Styles factory ──────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.drawerBg },

    // Profile header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 16 : 8,
      paddingBottom: 20,
      backgroundColor: theme.primary,
    },
    avatarCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    headerInfo: { flex: 1, marginLeft: 14 },
    userName:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    userEmail:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    editProfileBtn: {
      marginTop: 6,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    editProfileText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },

    // Location badge
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 12,
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    locationIcon: { fontSize: 14, marginRight: 8 },
    locationText: { flex: 1, fontSize: 13, color: theme.text, fontWeight: '500' },
    locationChange: { fontSize: 11, color: theme.primary, fontWeight: '700' },

    // Divider
    divider: { height: 1, backgroundColor: theme.border, marginHorizontal: 16 },

    // Language row
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    langRowLabel: { fontSize: 16, marginRight: 2 },
    langBtn: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    langBtnActive:     { backgroundColor: theme.light, borderColor: theme.primary },
    langBtnText:       { fontSize: 13, fontWeight: '600', color: theme.subtext },
    langBtnTextActive: { color: theme.primary },

    // Dark mode row
    darkModeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    darkModeIcon:  { fontSize: 18, marginRight: 10 },
    darkModeLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.text },

    // Menu
    menuScroll: { flex: 1, marginTop: 4 },
    menuSectionLabel: {
      fontSize: 10, fontWeight: '700', color: theme.subtext,
      letterSpacing: 1.2, marginLeft: 20, marginBottom: 4, marginTop: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
      marginVertical: 2,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 12,
      position: 'relative',
    },
    menuItemActive: { backgroundColor: theme.light },
    activeBar: {
      position: 'absolute', left: 0, top: 8, bottom: 8,
      width: 3, backgroundColor: theme.primary, borderRadius: 2,
    },
    menuIcon:           { fontSize: 20, width: 28, textAlign: 'center' },
    menuItemLabel:      { fontSize: 14, color: theme.subtext, fontWeight: '500', marginLeft: 14 },
    menuItemLabelActive: { color: theme.primary, fontWeight: '700' },

    // Bottom
    bottom: { paddingBottom: 8 },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
      marginVertical: 8,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: '#FEF2F2',
    },
    logoutIcon: { fontSize: 18, width: 28, textAlign: 'center' },
    logoutText: { fontSize: 14, color: '#EF4444', fontWeight: '700', marginLeft: 14 },

    // Footer
    footer:    { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
    footerText: { fontSize: 11, color: theme.subtext, fontWeight: '600' },
    footerSub:  { fontSize: 10, color: theme.subtext, marginTop: 2, textAlign: 'center', opacity: 0.6 },
  });
}

// ── Component ───────────────────────────────────────────────────────────────
export default function DrawerContent({ state, navigation }) {
  const { user, logout }           = useAuth();
  const { location }               = useLocation();
  const { t, language, changeLanguage } = useLanguage();
  const { isDark, toggleTheme, theme }  = useTheme();

  const styles    = useMemo(() => makeStyles(theme), [theme]);
  const menuItems = useMemo(() => getMenuItems(t), [t]);

  const activeRoute = state.routeNames[state.index];

  const getInitials = (name) => {
    if (!name) return 'FA';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ── Profile Header ── */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          {user?.photo
            ? <Image source={{ uri: user.photo }} style={{ width: 54, height: 54, borderRadius: 27 }} />
            : <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName} numberOfLines={1}>{user?.name || t('farmer')}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ''}</Text>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <Text style={styles.editProfileText}>✏️ {t('editProfile')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location Badge ── */}
      <TouchableOpacity
        style={styles.locationBadge}
        onPress={() => navigation.navigate('Location')}
        activeOpacity={0.7}
      >
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>{location.city}</Text>
        <Text style={styles.locationChange}>{t('change')} ›</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ── Language Switcher ── */}
      <View style={styles.langRow}>
        <Text style={styles.langRowLabel}>🌐</Text>
        {LANG_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.code}
            style={[styles.langBtn, language === opt.code && styles.langBtnActive]}
            onPress={() => changeLanguage(opt.code)}
          >
            <Text style={[styles.langBtnText, language === opt.code && styles.langBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Dark Mode Toggle ── */}
      <View style={styles.darkModeRow}>
        <Text style={styles.darkModeIcon}>{isDark ? '🌙' : '☀️'}</Text>
        <Text style={styles.darkModeLabel}>{isDark ? t('darkMode') : t('lightMode')}</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#CBD5E1', true: theme.primary }}
          thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
          ios_backgroundColor="#CBD5E1"
        />
      </View>

      <View style={styles.divider} />

      {/* ── Menu Items ── */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.menuSectionLabel}>{t('menu')}</Text>
        {menuItems.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeBar} />}
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Bottom: Logout + Footer ── */}
      <View style={styles.bottom}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('appVersion')}</Text>
          <Text style={styles.footerSub}>{t('poweredBy')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
