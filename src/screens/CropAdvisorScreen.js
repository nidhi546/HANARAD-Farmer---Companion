import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getClimatology } from '../api/powerApi';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import CropCard from '../components/CropCard';
import { CROPS } from '../constants/crops';

function makeStyles(theme) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: theme.background },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText:  { marginTop: 12, color: theme.subtext, fontSize: 14 },
    climateCard: {
      backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    climateTitle:   { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 14 },
    climateRow:     { flexDirection: 'row', alignItems: 'center' },
    climateStat:    { flex: 1, alignItems: 'center' },
    climateEmoji:   { fontSize: 24, marginBottom: 4 },
    climateValue:   { fontSize: 18, fontWeight: '800', color: theme.text },
    climateLabel:   { fontSize: 11, color: theme.subtext, marginTop: 2 },
    climateDivider: { width: 1, height: 48, backgroundColor: theme.border },
    section:        { padding: 16, paddingBottom: 4 },
    sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle:   { fontSize: 15, fontWeight: '700', color: theme.text },
    sectionTitleAlt:{ fontSize: 15, fontWeight: '700', color: theme.subtext },
    badge: {
      backgroundColor: theme.light, borderRadius: 12,
      paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
    },
    badgeAlt:     { backgroundColor: theme.border },
    badgeText:    { fontSize: 12, fontWeight: '700', color: theme.primary },
    badgeTextAlt: { color: theme.subtext },
    emptyText:    { fontSize: 13, color: theme.subtext, textAlign: 'center', paddingVertical: 16 },
  });
}

export default function CropAdvisorScreen() {
  const { location }  = useLocation();
  const { t }         = useLanguage();
  const { theme }     = useTheme();
  const styles        = useMemo(() => makeStyles(theme), [theme]);

  const [climate, setClimate]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadClimate(); }, [location]);

  const loadClimate = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await getClimatology(location.lat, location.lon);
      const p = res.properties.parameter;
      const months = Object.keys(p.T2M).filter(m => m !== 'ANN');
      const avgTemp = months.reduce((s, m) => s + p.T2M[m], 0) / months.length;
      const avgRain = months.reduce((s, m) => s + p.PRECTOTCORR[m], 0) / months.length;
      const avgHum  = months.reduce((s, m) => s + p.RH2M[m], 0) / months.length;
      setClimate({ temp: avgTemp, rain: avgRain, humidity: avgHum });
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); loadClimate(true); };

  const isSuitable = (crop) => {
    if (!climate) return false;
    return (
      climate.temp     >= crop.minTemp     && climate.temp     <= crop.maxTemp &&
      climate.rain     >= crop.minRain     && climate.rain     <= crop.maxRain &&
      climate.humidity >= crop.minHumidity
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t('analyzingClimate')}</Text>
      </View>
    );
  }

  const suitable = CROPS.filter(isSuitable);
  const others   = CROPS.filter(c => !isSuitable(c));

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
      }
    >
      <AppHeader title={t('crops')} subtitle={`📍 ${location.city}`} />

      {climate && (
        <View style={styles.climateCard}>
          <Text style={styles.climateTitle}>{t('climateProfle')}</Text>
          <View style={styles.climateRow}>
            <View style={styles.climateStat}>
              <Text style={styles.climateEmoji}>🌡️</Text>
              <Text style={styles.climateValue}>{climate.temp.toFixed(1)}°C</Text>
              <Text style={styles.climateLabel}>{t('avgTemp')}</Text>
            </View>
            <View style={styles.climateDivider} />
            <View style={styles.climateStat}>
              <Text style={styles.climateEmoji}>🌧️</Text>
              <Text style={styles.climateValue}>{climate.rain.toFixed(0)} mm</Text>
              <Text style={styles.climateLabel}>{t('monthlyRain')}</Text>
            </View>
            <View style={styles.climateDivider} />
            <View style={styles.climateStat}>
              <Text style={styles.climateEmoji}>💧</Text>
              <Text style={styles.climateValue}>{climate.humidity.toFixed(0)}%</Text>
              <Text style={styles.climateLabel}>{t('humidity')}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>✅ {t('recommended')}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{suitable.length}</Text>
          </View>
        </View>
        {suitable.length === 0 ? (
          <Text style={styles.emptyText}>{t('comingSoonMsg')}</Text>
        ) : (
          suitable.map(c => <CropCard key={c.name} crop={c} suitable={true} />)
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleAlt}>❌ {t('notIdeal')}</Text>
          <View style={[styles.badge, styles.badgeAlt]}>
            <Text style={[styles.badgeText, styles.badgeTextAlt]}>{others.length}</Text>
          </View>
        </View>
        {others.map(c => <CropCard key={c.name} crop={c} suitable={false} />)}
      </View>
    </ScrollView>
  );
}
