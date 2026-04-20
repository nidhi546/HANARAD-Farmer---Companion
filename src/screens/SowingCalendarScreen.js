/**
 * SOWING CALENDAR SCREEN
 * ─────────────────────────────────────────────────────────────────
 * API : NASA POWER climatology (already in powerApi.js — no new key)
 * Shows best sowing months per crop based on actual local climate
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { getClimatology } from '../api/powerApi';
import { useLocation }    from '../context/LocationContext';
import { useLanguage }    from '../context/LanguageContext';
import { useTheme }       from '../context/ThemeContext';
import AppHeader          from '../components/AppHeader';

const { width } = Dimensions.get('window');
const CELL_W    = Math.floor((width - 64) / 12);

// NASA POWER month key order
const NASA_MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const SHORT_MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

// Crops with sowing windows (1-indexed months)
const SOWING_CROPS = [
  { name: 'Cotton',    icon: '🌿', season: 'kharif', sowMonths: [5, 6],    minTemp: 21, maxTemp: 35, minRainMm: 2,  color: '#4F46E5', bg: '#EEF2FF' },
  { name: 'Groundnut', icon: '🥜', season: 'kharif', sowMonths: [6, 7],    minTemp: 20, maxTemp: 33, minRainMm: 2,  color: '#CA8A04', bg: '#FEFCE8' },
  { name: 'Bajra',     icon: '🌾', season: 'kharif', sowMonths: [6, 7],    minTemp: 25, maxTemp: 38, minRainMm: 1,  color: '#8B5CF6', bg: '#F5F3FF' },
  { name: 'Castor',    icon: '🌾', season: 'kharif', sowMonths: [6, 7],    minTemp: 20, maxTemp: 32, minRainMm: 1,  color: '#7C3AED', bg: '#EDE9FE' },
  { name: 'Rice',      icon: '🍚', season: 'kharif', sowMonths: [6, 7],    minTemp: 22, maxTemp: 35, minRainMm: 5,  color: '#059669', bg: '#ECFDF5' },
  { name: 'Wheat',     icon: '🌾', season: 'rabi',   sowMonths: [11, 12],  minTemp: 10, maxTemp: 25, minRainMm: 0,  color: '#EA580C', bg: '#FFF7ED' },
  { name: 'Mustard',   icon: '🌼', season: 'rabi',   sowMonths: [10, 11],  minTemp: 10, maxTemp: 25, minRainMm: 0,  color: '#D97706', bg: '#FFFBEB' },
  { name: 'Cumin',     icon: '🌱', season: 'rabi',   sowMonths: [11, 12],  minTemp: 10, maxTemp: 20, minRainMm: 0,  color: '#06B6D4', bg: '#ECFEFF' },
];

function getStatus(sowMonths, currentMonth) {
  if (sowMonths.includes(currentMonth)) return 'now';
  // Find next sowing month (wrap around year)
  const future = sowMonths.map(m => m >= currentMonth ? m - currentMonth : m + 12 - currentMonth);
  const minDiff = Math.min(...future);
  if (minDiff <= 2) return 'soon';
  return 'off';
}

function getMonthsAwayText(sowMonths, currentMonth) {
  const future = sowMonths.map(m => m >= currentMonth ? m - currentMonth : m + 12 - currentMonth);
  return Math.min(...future);
}

function avgForMonths(data, monthIndices) {
  if (!data) return null;
  const vals = monthIndices.map(m => data[NASA_MONTHS[m - 1]]).filter(v => v != null && v !== -999);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function isClimateMatch(crop, climatology, sowMonths) {
  if (!climatology) return null;
  const avgTemp = avgForMonths(climatology.T2M, sowMonths);
  if (avgTemp == null) return null;
  return avgTemp >= crop.minTemp && avgTemp <= crop.maxTemp;
}

function makeStyles(theme, isDark) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, color: theme.subtext, fontSize: 14 },

    apiBadge: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    },
    apiBadgeText: { fontSize: 12, fontWeight: '600', color: isDark ? '#A5B4FC' : '#4338CA', flex: 1 },

    tabRow:     { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 4, gap: 8 },
    tab:        { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.border },
    tabActive:  { backgroundColor: theme.primary, borderColor: theme.primary },
    tabText:    { fontSize: 12, fontWeight: '700', color: theme.subtext },
    tabTextActive: { color: '#FFFFFF' },

    list:       { padding: 16, paddingTop: 10, paddingBottom: 32 },

    card: {
      borderRadius: 16, padding: 14, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    cropIcon:    { fontSize: 28, marginRight: 10 },
    cropInfo:    { flex: 1 },
    cropName:    { fontSize: 16, fontWeight: '800', color: theme.text },
    seasonBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3, alignSelf: 'flex-start' },
    seasonText:  { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    statusText:  { fontSize: 11, fontWeight: '800' },

    monthBarRow:     { flexDirection: 'row', marginBottom: 8 },
    monthCell:       {
      width: CELL_W, height: 30, alignItems: 'center', justifyContent: 'center',
      borderRadius: 6, marginRight: 2,
    },
    monthCellText:   { fontSize: 9, fontWeight: '700' },

    climateRow:  { flexDirection: 'row', gap: 8, marginTop: 4 },
    climateStat: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    },
    climateEmoji: { fontSize: 14, marginRight: 5 },
    climateVal:   { fontSize: 12, fontWeight: '700', color: theme.text },
    climateLabel: { fontSize: 10, color: theme.subtext, marginLeft: 2 },
    climateBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    matchDot:     { width: 7, height: 7, borderRadius: 3.5, marginRight: 3 },
    matchText:    { fontSize: 10, fontWeight: '600' },
  });
}

export default function SowingCalendarScreen() {
  const { location }      = useLocation();
  const { t }             = useLanguage();
  const { theme, isDark } = useTheme();
  const styles            = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);

  const [climatology, setClimatology] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeTab, setActiveTab]     = useState('all');

  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  useEffect(() => { loadData(); }, [location]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await getClimatology(location.lat, location.lon);
      setClimatology(res.properties.parameter);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(true); }, [location]);

  const visibleCrops = useMemo(() => {
    if (activeTab === 'all') return SOWING_CROPS;
    return SOWING_CROPS.filter(c => c.season === activeTab);
  }, [activeTab]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t('loadingClimate')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
      }
    >
      <AppHeader title={t('sowingAdvisor')} subtitle={`📍 ${location.city}`} />

      <View style={styles.apiBadge}>
        <Text style={styles.apiBadgeText}>🛰️ NASA POWER Climatology · {t('sowingAdvisorSub')}</Text>
      </View>

      {/* ── Season Tabs ── */}
      <View style={styles.tabRow}>
        {[
          { key: 'all',    label: t('allCrops') },
          { key: 'kharif', label: t('kharifSeason') },
          { key: 'rabi',   label: t('rabiSeason') },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.list}>
        {visibleCrops.map(crop => {
          const status     = getStatus(crop.sowMonths, currentMonth);
          const monthsAway = getMonthsAwayText(crop.sowMonths, currentMonth);
          const climMatch  = isClimateMatch(crop, climatology, crop.sowMonths);
          const avgTemp    = climatology ? avgForMonths(climatology.T2M, crop.sowMonths) : null;
          const avgRain    = climatology ? avgForMonths(climatology.PRECTOTCORR, crop.sowMonths) : null;

          const statusCfg = {
            now:  { label: t('sowNow'),        bg: '#DCFCE7', color: '#15803D' },
            soon: { label: `${t('upcomingSowing')} (${monthsAway}mo)`, bg: '#FEF9C3', color: '#A16207' },
            off:  { label: t('offSeason'),     bg: isDark ? '#1E293B' : '#F1F5F9', color: theme.subtext },
          }[status];

          const seasonColor = crop.season === 'kharif' ? '#F97316' : '#3B82F6';

          return (
            <View key={crop.name} style={[styles.card, { backgroundColor: isDark ? theme.card : crop.bg }]}>

              {/* ── Crop header ── */}
              <View style={styles.cardTop}>
                <Text style={styles.cropIcon}>{crop.icon}</Text>
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <View style={[styles.seasonBadge, { backgroundColor: seasonColor }]}>
                    <Text style={styles.seasonText}>
                      {crop.season === 'kharif' ? t('kharifSeason') : t('rabiSeason')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
              </View>

              {/* ── Month bar ── */}
              <View style={styles.monthBarRow}>
                {Array.from({ length: 12 }, (_, i) => {
                  const m         = i + 1;
                  const isSow     = crop.sowMonths.includes(m);
                  const isCurrent = m === currentMonth;
                  return (
                    <View
                      key={m}
                      style={[
                        styles.monthCell,
                        {
                          backgroundColor: isSow
                            ? crop.color
                            : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                          borderWidth: isCurrent ? 2 : 0,
                          borderColor:  isCurrent ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[
                        styles.monthCellText,
                        { color: isSow ? '#FFFFFF' : isCurrent ? theme.primary : theme.subtext },
                      ]}>
                        {SHORT_MONTHS[i]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Climate stats ── */}
              <View style={styles.climateRow}>
                <View style={styles.climateStat}>
                  <Text style={styles.climateEmoji}>🌡️</Text>
                  <Text style={styles.climateVal}>{avgTemp != null ? `${avgTemp.toFixed(1)}°C` : '—'}</Text>
                  <Text style={styles.climateLabel}>avg</Text>
                  {climMatch != null && (
                    <View style={styles.climateBadge}>
                      <View style={[styles.matchDot, { backgroundColor: climMatch ? '#10B981' : '#EF4444' }]} />
                      <Text style={[styles.matchText, { color: climMatch ? '#10B981' : '#EF4444' }]}>
                        {climMatch ? t('tempOk') : 'Temp ⚠️'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.climateStat}>
                  <Text style={styles.climateEmoji}>🌧️</Text>
                  <Text style={styles.climateVal}>{avgRain != null ? `${avgRain.toFixed(1)}mm` : '—'}</Text>
                  <Text style={styles.climateLabel}>/day</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
