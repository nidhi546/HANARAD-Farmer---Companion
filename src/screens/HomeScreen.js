/**
 * DASHBOARD — HomeScreen
 * Fully redesigned modern UI
 */
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
  Animated, TextInput, Linking,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOpenMeteoForecast } from '../api/powerApi';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import { useAuth }     from '../context/AuthContext';
import { getWeatherIcon, checkAlerts } from '../utils/helpers';

const { width } = Dimensions.get('window');
const CARD_W = (width - 54) / 2;   // two columns with 20+14+20 spacing

// ── Time-based greeting ───────────────────────────────────────────────────────
function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t('greetingMorning');
  if (h < 17) return t('greetingAfternoon');
  return t('greetingEvening');
}

// ── Formatted date string ─────────────────────────────────────────────────────
function getFormattedDate() {
  const d = new Date();
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Weather condition label ───────────────────────────────────────────────────
function getWeatherDesc(temp, rain) {
  if (rain > 10) return 'Heavy rainfall expected';
  if (rain > 3)  return 'Light showers likely';
  if (temp > 35) return 'Very hot and sunny';
  if (temp > 28) return 'Sunny and warm';
  if (temp < 15) return 'Cold conditions';
  return 'Partly cloudy';
}

// ── Feature modules ───────────────────────────────────────────────────────────
const MODULES = [
  { key: 'crops',    icon: '🌱', labelKey: 'myCrops',       screen: 'Crops',        color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'disease',  icon: '🔬', labelKey: 'diseasesScan',  screen: 'DiseaseScan',  color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'mandi',    icon: '💰', labelKey: 'mandiBhav',     screen: 'Mandi',        color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'water',    icon: '💧', labelKey: 'irrigation',    screen: 'Irrigation',   color: '#06B6D4', bg: '#ECFEFF' },
  { key: 'schemes',  icon: '🏛️', labelKey: 'govSchemes',    screen: 'GovtSchemes',  color: '#EC4899', bg: '#FDF4FF' },
  { key: 'expert',   icon: '📞', labelKey: 'expertHelp',    screen: 'ExpertHelp',   color: '#10B981', bg: '#F0FDF4' },
  { key: 'stores',   icon: '🏪', labelKey: 'nearbyStores',  screen: 'NearbyStores', color: '#F97316', bg: '#FFF7ED' },
  { key: 'alerts',   icon: '🔔', labelKey: 'notifications', screen: 'Alerts',          color: '#EF4444', bg: '#FFF1F2' },
  { key: 'sowing',   icon: '📅', labelKey: 'sowingAdvisor', screen: 'SowingCalendar',  color: '#059669', bg: '#ECFDF5' },
  { key: 'nasa',     icon: '🛰️', labelKey: 'nasaWeather',  screen: 'NasaSurface',     color: '#1E1B4B', bg: '#EEF2FF' },
];

// ── Styles factory ────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({

    root: { flex: 1, backgroundColor: theme.background },

    // ── Loading ────────────────────────────────────────────────────────────
    loadRoot: {
      flex: 1, backgroundColor: theme.background,
      alignItems: 'center', justifyContent: 'center',
    },
    loadBadge: {
      width: 90, height: 90, borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 24,
      shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
    },
    loadEmoji:  { fontSize: 44 },
    loadTitle:  { fontSize: 22, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
    loadSub:    { fontSize: 14, color: theme.subtext, marginTop: 8 },

    // ── Header ─────────────────────────────────────────────────────────────
    header: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    menuBtn: {
      width: 42, height: 42,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
      gap: 5,
    },
    menuBar: { height: 2.5, backgroundColor: '#FFFFFF', borderRadius: 2 },
    headerSpacer: { flex: 1 },
    headerIcons: { flexDirection: 'row', gap: 10 },
    headerIconBtn: {
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerIconText: { fontSize: 18 },
    avatarRing: {
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarLetter: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },

    greetingLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 4 },
    greetingName:  { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
    greetingDate:  { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

    locationRow: {
      flexDirection: 'row', alignItems: 'center',
      marginTop: 14, alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    locationPin:  { fontSize: 14, marginRight: 6 },
    locationCity: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
    locationArr:  { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 6 },

    // ── Curved cutout at bottom of header ─────────────────────────────────
    headerCurve: {
      height: 28,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },

    // ── Search bar ─────────────────────────────────────────────────────────
    searchOuter: {
      marginHorizontal: 20, marginTop: 20,
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 18,
      paddingHorizontal: 16, paddingVertical: 13,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
      borderWidth: 1, borderColor: theme.border,
    },
    searchIconText: { fontSize: 17, marginRight: 10, opacity: 0.45 },
    searchInput:    { flex: 1, fontSize: 14, color: theme.text, paddingVertical: 0 },
    searchClear:    { fontSize: 16, color: theme.subtext, paddingLeft: 8 },

    // ── Alert banners ───────────────────────────────────────────────────────
    alertBanner: {
      marginHorizontal: 20, marginTop: 12,
      borderRadius: 16, padding: 14,
      flexDirection: 'row', alignItems: 'center',
      borderLeftWidth: 4,
    },
    alertIcon:  { fontSize: 20, marginRight: 10 },
    alertText:  { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },

    // ── Section header ──────────────────────────────────────────────────────
    sectionRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20, marginTop: 28, marginBottom: 14,
    },
    sectionTitle:  { fontSize: 17, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },
    sectionAction: { fontSize: 13, fontWeight: '700', color: theme.primary },

    // ── Quick stats (horizontal scroll) ────────────────────────────────────
    statsScroll:   { paddingLeft: 20 },
    statCard: {
      width: 110, marginRight: 12,
      borderRadius: 20, padding: 16,
      alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    statIconRing: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 10,
    },
    statIcon:  { fontSize: 24 },
    statValue: { fontSize: 18, fontWeight: '900', color: theme.text },
    statUnit:  { fontSize: 10, fontWeight: '600', color: theme.subtext, marginTop: 1 },
    statLabel: { fontSize: 10, fontWeight: '600', color: theme.subtext, marginTop: 4, textAlign: 'center' },

    // ── Weather hero ────────────────────────────────────────────────────────
    weatherCard: {
      marginHorizontal: 20, borderRadius: 28,
      overflow: 'hidden',
      shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22, shadowRadius: 22, elevation: 10,
    },
    weatherBody: { backgroundColor: theme.primary, padding: 24 },
    weatherTopRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    weatherLeft: { flex: 1 },
    weatherTag:  {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
      marginBottom: 12,
    },
    weatherTagText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
    weatherTemp:    { fontSize: 72, fontWeight: '900', color: '#FFFFFF', lineHeight: 78 },
    weatherDegree:  { fontSize: 32, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
    weatherRange:   { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    weatherDesc:    { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    weatherEmoji:   { fontSize: 80, lineHeight: 88 },

    weatherDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
    weatherStats:   { flexDirection: 'row' },
    weatherStat:    { flex: 1, alignItems: 'center' },
    weatherStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
    weatherStatEmoji: { fontSize: 22, marginBottom: 8 },
    weatherStatVal:   { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
    weatherStatLbl:   { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 4, textAlign: 'center', fontWeight: '600' },

    weatherFooter: {
      backgroundColor: 'rgba(0,0,0,0.18)',
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', paddingVertical: 14,
      gap: 6,
    },
    weatherFooterText:  { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
    weatherFooterArrow: { fontSize: 16, color: 'rgba(255,255,255,0.65)' },

    // ── Module grid ─────────────────────────────────────────────────────────
    moduleGrid: { paddingHorizontal: 20, gap: 14 },
    moduleRow:  { flexDirection: 'row', gap: 14 },
    moduleCard: {
      flex: 1, borderRadius: 22, padding: 18,
      minHeight: 140,
      justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    },
    moduleTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    moduleIconBox: {
      width: 52, height: 52, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    moduleArrow:   { fontSize: 14, opacity: 0.35, marginTop: 4 },
    moduleIcon:    { fontSize: 26 },
    moduleLabel:   { fontSize: 14, fontWeight: '800', color: theme.text, lineHeight: 19 },

    // ── Helpline CTA card ────────────────────────────────────────────────────
    helperCard: {
      marginHorizontal: 20, borderRadius: 24,
      padding: 20, flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      shadowColor: theme.primary, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
    },
    helperLeft: { flex: 1, marginRight: 16 },
    helperTag:  {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
      marginBottom: 8,
    },
    helperTagText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.8 },
    helperTitle:   { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
    helperNum:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    helperBtn: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12,
      alignItems: 'center',
    },
    helperBtnEmoji: { fontSize: 20, marginBottom: 4 },
    helperBtnText:  { fontSize: 12, fontWeight: '800', color: theme.primary },

    // ── Tips card ─────────────────────────────────────────────────────────
    tipsCard: {
      marginHorizontal: 20,
      borderRadius: 22, padding: 18,
      backgroundColor: theme.card,
      borderWidth: 1, borderColor: theme.border,
      flexDirection: 'row', alignItems: 'flex-start',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    tipsIconCircle: {
      width: 48, height: 48, borderRadius: 16,
      backgroundColor: '#FFFBEB',
      alignItems: 'center', justifyContent: 'center',
      marginRight: 14,
    },
    tipsEmoji:  { fontSize: 24 },
    tipsRight:  { flex: 1 },
    tipsTitle:  { fontSize: 14, fontWeight: '800', color: theme.text, marginBottom: 6 },
    tipsBody:   { fontSize: 13, color: theme.subtext, lineHeight: 20 },

    // ── Quick nav strip ──────────────────────────────────────────────────────
    navStrip:     { flexDirection: 'row', marginHorizontal: 20, gap: 10 },
    navBtn: {
      flex: 1, borderRadius: 16, paddingVertical: 14,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.card,
      borderWidth: 1, borderColor: theme.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    navBtnPrimary: {
      backgroundColor: theme.light,
      borderColor: theme.primary + '40',
    },
    navBtnIcon:  { fontSize: 22, marginBottom: 5 },
    navBtnLabel: { fontSize: 11, fontWeight: '700', color: theme.subtext, textAlign: 'center' },
    navBtnLabelPrimary: { color: theme.primary },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation        = useNavigation();
  const insets            = useSafeAreaInsets();
  const { location }      = useLocation();
  const { t }             = useLanguage();
  const { theme, isDark } = useTheme();
  const { user }          = useAuth();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [weather, setWeather]         = useState(null);
  const [alerts, setAlerts]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [searchText, setSearchText]   = useState('');

  // Entrance animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => { loadData(); }, [location]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getOpenMeteoForecast(location.lat, location.lon);
      const c = data.current;
      const d = data.daily;
      const w = {
        temp:     c.temperature_2m?.toFixed(1),
        max:      d.temperature_2m_max[0]?.toFixed(1),
        min:      d.temperature_2m_min[0]?.toFixed(1),
        rain:     c.precipitation?.toFixed(1),
        humidity: c.relative_humidity_2m?.toFixed(0),
        wind:     c.wind_speed_10m?.toFixed(1),
        date:     d.time[0],
      };
      setWeather(w);
      setAlerts(checkAlerts(parseFloat(w.max), parseFloat(w.rain), parseFloat(w.wind)));
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
    // Animate content in
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [location]);

  // User details
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'F';
  const firstName    = user?.name ? user.name.split(' ')[0] : t('farmer');

  // Filtered modules (search)
  const visibleModules = useMemo(() => {
    if (!searchText.trim()) return MODULES;
    const q = searchText.toLowerCase();
    return MODULES.filter(m => t(m.labelKey).toLowerCase().includes(q));
  }, [searchText, t]);

  // Pair into rows
  const moduleRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < visibleModules.length; i += 2) {
      rows.push(visibleModules.slice(i, i + 2));
    }
    return rows;
  }, [visibleModules]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.loadRoot, { paddingTop: insets.top }]}>
        <View style={styles.loadBadge}>
          <Text style={styles.loadEmoji}>🌾</Text>
        </View>
        <Text style={styles.loadTitle}>FarmerApp</Text>
        <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadSub}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >

      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>

        {/* Top row: menu ── spacer ── notifications + avatar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.menuBar, { width: 20 }]} />
            <View style={[styles.menuBar, { width: 14 }]} />
            <View style={[styles.menuBar, { width: 9 }]} />
          </TouchableOpacity>

          <View style={styles.headerSpacer} />

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Alerts')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.headerIconText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarRing}
              onPress={() => navigation.navigate('Profile')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting block */}
        <Text style={styles.greetingLabel}>{getGreeting(t)}</Text>
        <Text style={styles.greetingName}>{firstName}! 🌾</Text>
        <Text style={styles.greetingDate}>{getFormattedDate()}</Text>

        {/* Location pill */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => navigation.navigate('Location')}
          activeOpacity={0.75}
        >
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationCity}>{location.city}</Text>
          <Text style={styles.locationArr}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Curved bottom of header */}
      <View style={styles.headerCurve} />

      {/* ══════════════════════════════════════════════════════
          SEARCH BAR
      ══════════════════════════════════════════════════════ */}
      <View style={styles.searchOuter}>
        <Text style={styles.searchIconText}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search features, crops, prices…"
          placeholderTextColor={theme.subtext}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════
          WEATHER ALERTS
      ══════════════════════════════════════════════════════ */}
      {alerts.map((a, i) => (
        <View
          key={i}
          style={[styles.alertBanner, {
            backgroundColor: a.type === 'danger' ? '#FEF2F2' : '#FFFBEB',
            borderLeftColor: a.type === 'danger' ? theme.danger : theme.warning,
          }]}
        >
          <Text style={styles.alertIcon}>{a.type === 'danger' ? '⛔' : '⚠️'}</Text>
          <Text style={[styles.alertText, {
            color: a.type === 'danger' ? theme.danger : '#92400E',
          }]}>
            {t(a.key)}
          </Text>
        </View>
      ))}

      {/* Animated content wrapper */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ════════════════════════════════════════════════════
            QUICK WEATHER STATS ROW
        ════════════════════════════════════════════════════ */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>📊 Today's Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Weather')}>
            <Text style={styles.sectionAction}>Details ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <StatCard
            icon="🌡️" value={`${weather?.max}°`} unit="C"
            label="Max Temp"
            bg="#FFF7ED" ringBg="#FED7AA"
            styles={styles}
          />
          <StatCard
            icon="💧" value={`${weather?.humidity}`} unit="%"
            label="Humidity"
            bg="#ECFEFF" ringBg="#A5F3FC"
            styles={styles}
          />
          <StatCard
            icon="🌧️" value={`${weather?.rain}`} unit="mm"
            label="Rainfall"
            bg="#EEF2FF" ringBg="#C7D2FE"
            styles={styles}
          />
          <StatCard
            icon="💨" value={`${weather?.wind}`} unit="m/s"
            label="Wind"
            bg="#F5F3FF" ringBg="#DDD6FE"
            styles={styles}
          />
          <StatCard
            icon="🌡️" value={`${weather?.min}°`} unit="C"
            label="Min Temp"
            bg="#F0FDF4" ringBg="#BBF7D0"
            styles={styles}
          />
        </ScrollView>

        {/* ════════════════════════════════════════════════════
            WEATHER HERO CARD
        ════════════════════════════════════════════════════ */}
        <View style={{ ...styles.sectionRow, marginTop: 24 }}>
          <Text style={styles.sectionTitle}>🌤️ {t('todayWeather')}</Text>
        </View>

        <TouchableOpacity
          style={styles.weatherCard}
          onPress={() => navigation.navigate('Weather')}
          activeOpacity={0.95}
        >
          <View style={styles.weatherBody}>
            {/* Top: temp + emoji */}
            <View style={styles.weatherTopRow}>
              <View style={styles.weatherLeft}>
                <View style={styles.weatherTag}>
                  <Text style={styles.weatherTagText}>LIVE FORECAST</Text>
                </View>
                <Text style={styles.weatherTemp}>
                  {weather?.temp}
                  <Text style={styles.weatherDegree}>°C</Text>
                </Text>
                <Text style={styles.weatherRange}>
                  ↑ {weather?.max}°C  ·  ↓ {weather?.min}°C
                </Text>
                <Text style={styles.weatherDesc}>
                  {getWeatherDesc(parseFloat(weather?.temp), parseFloat(weather?.rain))}
                </Text>
              </View>
              <Text style={styles.weatherEmoji}>
                {getWeatherIcon(parseFloat(weather?.temp), parseFloat(weather?.rain))}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.weatherDivider} />

            {/* Stat row */}
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>🌧️</Text>
                <Text style={styles.weatherStatVal}>{weather?.rain} mm</Text>
                <Text style={styles.weatherStatLbl}>{t('rainfall')}</Text>
              </View>
              <View style={styles.weatherStatDiv} />
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>💧</Text>
                <Text style={styles.weatherStatVal}>{weather?.humidity}%</Text>
                <Text style={styles.weatherStatLbl}>{t('humidity')}</Text>
              </View>
              <View style={styles.weatherStatDiv} />
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>💨</Text>
                <Text style={styles.weatherStatVal}>{weather?.wind} m/s</Text>
                <Text style={styles.weatherStatLbl}>{t('windSpeed')}</Text>
              </View>
            </View>
          </View>

          {/* Footer tap hint */}
          <View style={styles.weatherFooter}>
            <Text style={styles.weatherFooterText}>View 7-day forecast</Text>
            <Text style={styles.weatherFooterArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* ════════════════════════════════════════════════════
            QUICK NAV STRIP
        ════════════════════════════════════════════════════ */}
        <View style={{ ...styles.sectionRow }}>
          <Text style={styles.sectionTitle}>🔗 Quick Links</Text>
        </View>
        <View style={styles.navStrip}>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary]}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.navBtnIcon}>📈</Text>
            <Text style={[styles.navBtnLabel, styles.navBtnLabelPrimary]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate('Crops')}
          >
            <Text style={styles.navBtnIcon}>🌱</Text>
            <Text style={styles.navBtnLabel}>Crop{'\n'}Advisor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate('Mandi')}
          >
            <Text style={styles.navBtnIcon}>💰</Text>
            <Text style={styles.navBtnLabel}>Market{'\n'}Prices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.navBtnIcon}>👤</Text>
            <Text style={styles.navBtnLabel}>My{'\n'}Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════
            FEATURE MODULE GRID
        ════════════════════════════════════════════════════ */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>⚡ All Features</Text>
          {searchText.length > 0 && (
            <Text style={styles.sectionAction}>{visibleModules.length} found</Text>
          )}
        </View>

        <View style={styles.moduleGrid}>
          {moduleRows.map((row, ri) => (
            <View key={ri} style={styles.moduleRow}>
              {row.map(mod => (
                <TouchableOpacity
                  key={mod.key}
                  style={[styles.moduleCard, { backgroundColor: mod.bg }]}
                  onPress={() => navigation.navigate(mod.screen)}
                  activeOpacity={0.82}
                >
                  <View style={styles.moduleTopRow}>
                    <View style={[styles.moduleIconBox, { backgroundColor: mod.color + '25' }]}>
                      <Text style={styles.moduleIcon}>{mod.icon}</Text>
                    </View>
                    <Text style={[styles.moduleArrow, { color: mod.color }]}>›</Text>
                  </View>
                  <Text style={styles.moduleLabel}>{t(mod.labelKey)}</Text>
                </TouchableOpacity>
              ))}
              {/* Pad odd rows */}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
          {visibleModules.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 8 }}>
                No features match "{searchText}"
              </Text>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════════════════
            KISAN HELPLINE CTA
        ════════════════════════════════════════════════════ */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>📞 Expert Help</Text>
        </View>

        <View style={styles.helperCard}>
          <View style={styles.helperLeft}>
            <View style={styles.helperTag}>
              <Text style={styles.helperTagText}>FREE HELPLINE</Text>
            </View>
            <Text style={styles.helperTitle}>Kisan Call Centre</Text>
            <Text style={styles.helperNum}>1800-180-1551  ·  Mon–Sun 6AM–10PM</Text>
          </View>
          <TouchableOpacity
            style={styles.helperBtn}
            onPress={() => Linking.openURL('tel:18001801551')}
            activeOpacity={0.85}
          >
            <Text style={styles.helperBtnEmoji}>📞</Text>
            <Text style={styles.helperBtnText}>Call Now</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════
            FARM TIPS
        ════════════════════════════════════════════════════ */}
        <View style={{ ...styles.sectionRow }}>
          <Text style={styles.sectionTitle}>💡 Farm Tips</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.sectionAction}>More ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsIconCircle}>
            <Text style={styles.tipsEmoji}>💡</Text>
          </View>
          <View style={styles.tipsRight}>
            <Text style={styles.tipsTitle}>{t('expertHelp')}</Text>
            <Text style={styles.tipsBody}>{t('callExpert')}</Text>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </Animated.View>
    </ScrollView>
  );
}

// ── Stat Card sub-component ───────────────────────────────────────────────────
function StatCard({ icon, value, unit, label, bg, ringBg, styles }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIconRing, { backgroundColor: ringBg }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}<Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
