import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Dimensions, RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDailyData } from '../api/powerApi';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import { today, daysAgo } from '../utils/helpers';

const W = Dimensions.get('window').width;

function makeStyles(theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, color: theme.subtext, fontSize: 14 },
    chartCard: {
      backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, alignItems: 'center',
    },
    chartTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12, alignSelf: 'flex-start' },
    chart:      { borderRadius: 12 },
    tableCard: {
      backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16, marginBottom: 24,
      borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    tableHeader:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8, marginBottom: 4 },
    tableHead:     { fontWeight: '700', color: theme.text, fontSize: 12 },
    tableRow:      { flexDirection: 'row', paddingVertical: 8 },
    tableRowAlt:   { backgroundColor: theme.background, borderRadius: 6 },
    tableCell:     { flex: 1, fontSize: 12, color: theme.subtext, textAlign: 'center' },
  });
}

export default function HistoricalScreen() {
  const { location }   = useLocation();
  const { t }          = useLanguage();
  const { theme }      = useTheme();
  const styles         = useMemo(() => makeStyles(theme), [theme]);

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [location]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await getDailyData(location.lat, location.lon, daysAgo(14), today());
      const params = res.properties.parameter;
      const dates  = Object.keys(params.T2M).sort().slice(-10);
      setData({
        labels: dates.map(d => d.slice(5).replace('-', '/')),
        temps:  dates.map(d => parseFloat(params.T2M[d]?.toFixed(1) || 0)),
        rain:   dates.map(d => parseFloat(params.PRECTOTCORR[d]?.toFixed(1) || 0)),
        raw:    dates.map(d => ({
          date:     d.replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3'),
          temp:     params.T2M[d]?.toFixed(1),
          rain:     params.PRECTOTCORR[d]?.toFixed(1),
          humidity: params.RH2M[d]?.toFixed(0),
        })),
      });
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); loadData(true); };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo:   theme.card,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: () => theme.subtext,
    strokeWidth: 2,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.primary },
    propsForBackgroundLines: { stroke: theme.border },
    decimalPlaces: 1,
  };

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
      <AppHeader title={t('historicalData')} subtitle={`${t('last10Days')} — ${location.city}`} />

      {/* Temperature Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>🌡️ {t('temperature')}</Text>
        {data && (
          <LineChart
            data={{ labels: data.labels, datasets: [{ data: data.temps }] }}
            width={W - 64}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
          />
        )}
      </View>

      {/* Rainfall Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>🌧️ {t('rainChart')}</Text>
        {data && (
          <LineChart
            data={{
              labels: data.labels,
              datasets: [{ data: data.rain, color: (o = 1) => `rgba(59, 130, 246, ${o})` }],
            }}
            width={W - 64}
            height={180}
            chartConfig={{ ...chartConfig, color: (o = 1) => `rgba(59, 130, 246, ${o})` }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
          />
        )}
      </View>

      {/* Data Table */}
      <View style={styles.tableCard}>
        <Text style={styles.chartTitle}>📋 {t('dailySummary')}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHead]}>{t('date')}</Text>
          <Text style={[styles.tableCell, styles.tableHead]}>{t('temp')}</Text>
          <Text style={[styles.tableCell, styles.tableHead]}>{t('rain')}</Text>
          <Text style={[styles.tableCell, styles.tableHead]}>{t('hum')}</Text>
        </View>
        {data?.raw?.map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
            <Text style={styles.tableCell}>{row.date}</Text>
            <Text style={styles.tableCell}>{row.temp}</Text>
            <Text style={styles.tableCell}>{row.rain}</Text>
            <Text style={styles.tableCell}>{row.humidity}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
