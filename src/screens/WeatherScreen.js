import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getOpenMeteoForecast } from '../api/powerApi';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import { formatDate } from '../utils/helpers';

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 51: '🌦️', 61: '🌧️', 71: '🌨️',
  80: '🌦️', 95: '⛈️',
};
const getIcon   = (code) => WMO_ICONS[code] || '🌡️';

const WMO_KEY_MAP = {
  0: 'wmo_0', 1: 'wmo_1', 2: 'wmo_2', 3: 'wmo_3',
  45: 'wmo_45', 51: 'wmo_51', 61: 'wmo_61', 71: 'wmo_71',
  80: 'wmo_80', 95: 'wmo_95',
};
const getWmoKey = (code) => WMO_KEY_MAP[code] || 'wmo_unknown';

function makeStyles(theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, color: theme.subtext, fontSize: 14 },
    listContainer: { padding: 16, paddingTop: 12 },
    row: {
      backgroundColor: theme.card,
      borderRadius: 16, padding: 16, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    rowToday: { borderWidth: 1.5, borderColor: theme.primary, backgroundColor: theme.light },
    iconCol:        { width: 52, alignItems: 'center' },
    icon:           { fontSize: 36 },
    infoCol:        { flex: 1, marginLeft: 8 },
    dateLabel:      { fontSize: 15, fontWeight: '700', color: theme.text },
    dateLabelToday: { color: theme.primary },
    condLabel:      { fontSize: 12, color: theme.subtext, marginTop: 2 },
    rainRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    rainIcon:       { fontSize: 12, marginRight: 4 },
    rainText:       { fontSize: 12, color: theme.sky, fontWeight: '500' },
    tempCol:        { alignItems: 'flex-end' },
    maxTemp:        { fontSize: 18, fontWeight: '800', color: theme.danger },
    minTemp:        { fontSize: 14, fontWeight: '600', color: theme.sky, marginTop: 4 },
  });
}

export default function WeatherScreen() {
  const { location }   = useLocation();
  const { t }          = useLanguage();
  const { theme }      = useTheme();
  const styles         = useMemo(() => makeStyles(theme), [theme]);

  const [forecast, setForecast]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadForecast(); }, [location]);

  const loadForecast = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getOpenMeteoForecast(location.lat, location.lon);
      setForecast(data.daily);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); loadForecast(true); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
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
      <AppHeader title={t('forecast')} subtitle={`📍 ${location.city}`} />

      <View style={styles.listContainer}>
        {forecast?.time?.map((date, i) => {
          const isToday = i === 0;
          return (
            <View key={date} style={[styles.row, isToday && styles.rowToday]}>
              <View style={styles.iconCol}>
                <Text style={styles.icon}>{getIcon(forecast.weathercode[i])}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={[styles.dateLabel, isToday && styles.dateLabelToday]}>
                  {isToday ? t('today') : formatDate(date)}
                </Text>
                <Text style={styles.condLabel}>{t(getWmoKey(forecast.weathercode[i]))}</Text>
                <View style={styles.rainRow}>
                  <Text style={styles.rainIcon}>🌧️</Text>
                  <Text style={styles.rainText}>{forecast.precipitation_sum[i]?.toFixed(1)} mm</Text>
                </View>
              </View>
              <View style={styles.tempCol}>
                <Text style={styles.maxTemp}>↑ {forecast.temperature_2m_max[i]?.toFixed(0)}°</Text>
                <Text style={styles.minTemp}>↓ {forecast.temperature_2m_min[i]?.toFixed(0)}°</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
