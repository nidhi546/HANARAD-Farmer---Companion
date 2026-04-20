/**
 * IRRIGATION ADVISOR SCREEN
 * ─────────────────────────────────────────────────────────────────
 * Free API : Open-Meteo (already in app, no key needed)
 * Formula  : Hargreaves-Samani ETo  (simplified Penman-Monteith)
 * Data     : 7-day forecast → daily water requirement per crop
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLanguage }       from '../context/LanguageContext';
import { useTheme }          from '../context/ThemeContext';
import { useLocation }       from '../context/LocationContext';
import AppHeader             from '../components/AppHeader';
import { getOpenMeteoForecast } from '../api/powerApi';

// ── Crop water needs (mm/day peak) ────────────────────────────────────────
const CROP_KC = [
  { name: 'Cotton',    icon: '🌿', kc: 1.15, color: '#EEF2FF', accent: '#4F46E5' },
  { name: 'Groundnut', icon: '🥜', kc: 1.05, color: '#FEF9C3', accent: '#CA8A04' },
  { name: 'Wheat',     icon: '🌾', kc: 1.10, color: '#FFF7ED', accent: '#EA580C' },
  { name: 'Bajra',     icon: '🌾', kc: 0.95, color: '#F5F3FF', accent: '#8B5CF6' },
  { name: 'Castor',    icon: '🌾', kc: 1.00, color: '#F5F3FF', accent: '#7C3AED' },
  { name: 'Cumin',     icon: '🌱', kc: 0.85, color: '#ECFEFF', accent: '#06B6D4' },
  { name: 'Tomato',    icon: '🍅', kc: 1.15, color: '#FFF1F2', accent: '#E11D48' },
  { name: 'Onion',     icon: '🧅', kc: 1.05, color: '#FFFBEB', accent: '#D97706' },
];

/**
 * Hargreaves-Samani ETo formula
 * ETo (mm/day) = 0.0023 × Ra × (Tmean + 17.8) × (Tmax - Tmin)^0.5
 * Ra ≈ 9.5 MJ/m²/day (average for Gujarat latitude ~23°N)
 */
function calcETo(tMax, tMin) {
  const tMean = (tMax + tMin) / 2;
  const Ra    = 9.5;
  return 0.0023 * Ra * (tMean + 17.8) * Math.sqrt(Math.max(0, tMax - tMin));
}

function irrigationAdvice(netNeed) {
  if (netNeed <= 0)   return { label: 'No irrigation needed today', color: '#10B981', icon: '✅' };
  if (netNeed < 3)    return { label: `Light irrigation: ${netNeed.toFixed(1)} mm`, color: '#CA8A04', icon: '💧' };
  if (netNeed < 6)    return { label: `Moderate irrigation: ${netNeed.toFixed(1)} mm`, color: '#EA580C', icon: '💦' };
  return               { label: `Heavy irrigation needed: ${netNeed.toFixed(1)} mm`, color: '#DC2626', icon: '🚿' };
}

function makeStyles(theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, fontSize: 14, color: theme.subtext },

    // API badge
    apiBadge: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#EEF2FF', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    apiBadgeText: { fontSize: 12, fontWeight: '600', color: '#4338CA', flex: 1 },

    // Summary card
    summaryCard: {
      backgroundColor: theme.primary,
      marginHorizontal: 16, marginTop: 14,
      borderRadius: 20, padding: 20,
    },
    summaryTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    summaryEto:   { fontSize: 44, fontWeight: '900', color: '#FFFFFF', lineHeight: 52 },
    summaryUnit:  { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
    summaryStats: {
      flexDirection: 'row', marginTop: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12, paddingVertical: 10,
    },
    summaryStatItem: { flex: 1, alignItems: 'center' },
    summaryStatValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    summaryStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    summaryStatDiv:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Crop selector
    sectionTitle: {
      fontSize: 13, fontWeight: '700', color: theme.subtext,
      letterSpacing: 0.8, marginHorizontal: 16, marginTop: 20, marginBottom: 10,
    },
    cropRow:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
    cropBtn: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5, borderColor: theme.border,
      backgroundColor: theme.card,
    },
    cropBtnActive: { borderColor: theme.primary, backgroundColor: theme.light },
    cropBtnText:   { fontSize: 13, fontWeight: '600', color: theme.subtext, marginLeft: 6 },
    cropBtnTextActive: { color: theme.primary },

    // Crop advice card
    adviceCard: {
      marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: theme.border,
    },
    adviceTitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 4 },
    adviceKc:    { fontSize: 12, color: theme.subtext, marginBottom: 14 },
    adviceRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    adviceIcon:  { fontSize: 22, marginRight: 12 },
    adviceText:  { fontSize: 14, fontWeight: '600', flex: 1 },

    // Forecast list
    forecastCard: {
      backgroundColor: theme.card, marginHorizontal: 16,
      marginBottom: 8, borderRadius: 12, padding: 14,
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: theme.border,
    },
    forecastDate:  { width: 56, fontSize: 12, fontWeight: '700', color: theme.text },
    forecastRain:  { fontSize: 12, color: theme.sky, marginLeft: 4 },
    forecastEto:   { flex: 1, fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'center' },
    forecastBar:   { flex: 2, height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' },
    forecastFill:  { height: '100%', borderRadius: 4 },
    forecastNet:   { width: 60, textAlign: 'right', fontSize: 12, fontWeight: '700' },

    // Info card
    infoCard: {
      backgroundColor: theme.card, marginHorizontal: 16,
      marginTop: 20, marginBottom: 8, borderRadius: 14,
      padding: 14, borderWidth: 1, borderColor: theme.border,
    },
    infoTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 },
    infoText:  { fontSize: 12, color: theme.subtext, lineHeight: 20 },

    bottomPad: { height: 32 },
  });
}

export default function IrrigationScreen() {
  const { t }         = useLanguage();
  const { theme }     = useTheme();
  const { location }  = useLocation();
  const styles        = useMemo(() => makeStyles(theme), [theme]);

  const [forecast, setForecast]      = useState(null);
  const [loading, setLoading]        = useState(true);
  const [refreshing, setRefreshing]  = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(CROP_KC[0]);

  useEffect(() => { loadForecast(); }, [location]);

  const loadForecast = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getOpenMeteoForecast(location.lat, location.lon);
      setForecast(data);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadForecast(true); }, [location]);

  // Compute daily irrigation need from forecast
  const dailyData = useMemo(() => {
    if (!forecast?.daily) return [];
    const { time, temperature_2m_max: mx, temperature_2m_min: mn, precipitation_sum: rain } = forecast.daily;
    return time.map((date, i) => {
      const eto     = calcETo(mx[i] ?? 30, mn[i] ?? 20);
      const etc     = eto * selectedCrop.kc;         // crop-adjusted water need
      const rainDay = rain[i] ?? 0;
      const netNeed = Math.max(0, etc - rainDay);
      return {
        date: date.slice(5),           // MM-DD
        eto:  eto.toFixed(1),
        etc:  etc.toFixed(1),
        rain: rainDay.toFixed(1),
        net:  netNeed.toFixed(1),
        advice: irrigationAdvice(netNeed),
        isToday: i === 0,
      };
    });
  }, [forecast, selectedCrop]);

  const todayData = dailyData[0];
  const maxNet    = Math.max(...dailyData.map(d => parseFloat(d.net)), 1);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Calculating water needs…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          colors={[theme.primary]} tintColor={theme.primary} />
      }
    >
      <AppHeader title="Irrigation Advisor" subtitle={`📍 ${location.city}`} />

      {/* Free API badge */}
      <View style={styles.apiBadge}>
        <Text style={styles.apiBadgeText}>🟢 Live data — Open-Meteo (free, no key needed)</Text>
      </View>

      {/* Today summary */}
      {todayData && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Evapotranspiration</Text>
          <Text style={styles.summaryEto}>
            {todayData.eto}
            <Text style={styles.summaryUnit}> mm/day</Text>
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{todayData.rain} mm</Text>
              <Text style={styles.summaryStatLabel}>Rainfall</Text>
            </View>
            <View style={styles.summaryStatDiv} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{todayData.etc} mm</Text>
              <Text style={styles.summaryStatLabel}>Crop Need</Text>
            </View>
            <View style={styles.summaryStatDiv} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{todayData.net} mm</Text>
              <Text style={styles.summaryStatLabel}>Net Deficit</Text>
            </View>
          </View>
        </View>
      )}

      {/* Crop selector */}
      <Text style={styles.sectionTitle}>SELECT YOUR CROP</Text>
      <View style={styles.cropRow}>
        {CROP_KC.map(c => (
          <TouchableOpacity
            key={c.name}
            style={[styles.cropBtn, selectedCrop.name === c.name && styles.cropBtnActive]}
            onPress={() => setSelectedCrop(c)}
          >
            <Text>{c.icon}</Text>
            <Text style={[styles.cropBtnText, selectedCrop.name === c.name && styles.cropBtnTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's advice for selected crop */}
      {todayData && (
        <View style={[styles.adviceCard, { backgroundColor: selectedCrop.color }]}>
          <Text style={styles.adviceTitle}>{selectedCrop.icon} {selectedCrop.name}</Text>
          <Text style={styles.adviceKc}>Crop coefficient Kc = {selectedCrop.kc}</Text>
          <View style={styles.adviceRow}>
            <Text style={styles.adviceIcon}>{todayData.advice.icon}</Text>
            <Text style={[styles.adviceText, { color: todayData.advice.color }]}>
              {todayData.advice.label}
            </Text>
          </View>
        </View>
      )}

      {/* 7-day forecast */}
      <Text style={styles.sectionTitle}>7-DAY IRRIGATION FORECAST</Text>
      {dailyData.map((d, i) => (
        <View key={i} style={styles.forecastCard}>
          <Text style={styles.forecastDate}>{i === 0 ? 'Today' : d.date}</Text>
          <Text style={styles.forecastRain}>🌧{d.rain}</Text>
          <Text style={styles.forecastEto}>{d.etc} mm</Text>
          <View style={styles.forecastBar}>
            <View style={[styles.forecastFill, {
              width: `${(parseFloat(d.net) / maxNet) * 100}%`,
              backgroundColor: parseFloat(d.net) > 5 ? '#EF4444'
                : parseFloat(d.net) > 2 ? '#F59E0B' : '#10B981',
            }]} />
          </View>
          <Text style={[styles.forecastNet, {
            color: parseFloat(d.net) > 5 ? '#EF4444'
              : parseFloat(d.net) > 2 ? '#F59E0B' : '#10B981',
          }]}>{d.net} mm</Text>
        </View>
      ))}

      {/* Formula explanation */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How is this calculated?</Text>
        <Text style={styles.infoText}>
          Using the Hargreaves-Samani formula:{'\n'}
          ETo = 0.0023 × Ra × (Tmean + 17.8) × √(Tmax − Tmin){'\n\n'}
          Crop water need (ETc) = ETo × Kc (crop coefficient){'\n'}
          Net deficit = ETc − Rainfall{'\n\n'}
          Data source: Open-Meteo free API (no API key required)
        </Text>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
