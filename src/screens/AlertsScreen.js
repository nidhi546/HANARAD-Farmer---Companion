import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getDailyData, getEonetAlerts } from '../api/powerApi';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import { checkAlerts, today, daysAgo } from '../utils/helpers';

function makeStyles(theme, isDark) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, color: theme.subtext, fontSize: 14 },
    content:     { padding: 16, paddingBottom: 32 },

    noAlertCard: {
      backgroundColor: theme.card,
      borderRadius: 20, padding: 40, alignItems: 'center', marginTop: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    noAlertEmoji: { fontSize: 56, marginBottom: 12 },
    noAlertTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
    noAlertText:  { fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 22 },

    summaryRow:  { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
    summaryText: { fontSize: 13, color: theme.subtext, fontWeight: '600' },
    summarySep:  { color: theme.border },

    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: theme.subtext,
      letterSpacing: 1, marginBottom: 8, marginTop: 4,
    },

    alertCard: {
      borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    alertTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    alertMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    alertDate:      { fontSize: 11, color: theme.subtext, fontWeight: '500' },
    alertSource:    { fontSize: 10, color: theme.subtext, fontWeight: '500', opacity: 0.7 },
    badgeRow:       { flexDirection: 'row', gap: 4 },
    alertBadge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    alertBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },
    eonetBadge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#7C3AED' },
    eonetBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },
    alertCategory:  { fontSize: 11, color: theme.subtext, marginBottom: 4, fontWeight: '500' },
    alertMsg:       { fontSize: 14, fontWeight: '600', lineHeight: 20 },

    apiBadge: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 12, marginBottom: 4,
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    },
    apiBadgeText: { fontSize: 12, fontWeight: '600', color: isDark ? '#A5B4FC' : '#4338CA', flex: 1 },
  });
}

export default function AlertsScreen() {
  const { location }      = useLocation();
  const { t }             = useLanguage();
  const { theme, isDark } = useTheme();
  const styles            = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);

  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAlerts(); }, [location]);

  const loadAlerts = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [powerRes, eonetEvents] = await Promise.all([
        getDailyData(location.lat, location.lon, daysAgo(7), today()),
        getEonetAlerts(location.lat, location.lon).catch(() => []),
      ]);

      const p = powerRes.properties.parameter;
      const dates = Object.keys(p.T2M).sort();
      const weatherAlerts = [];
      dates.forEach(date => {
        checkAlerts(p.T2M_MAX[date], p.PRECTOTCORR[date], p.WS10M[date], p.T2M_MIN[date])
          .forEach(a => weatherAlerts.push({ ...a, date, source: 'NASA POWER' }));
      });

      setAlerts([...eonetEvents, ...weatherAlerts]);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); loadAlerts(true); };

  const eonetAlerts   = alerts.filter(a => a.source === 'NASA EONET');
  const weatherAlerts = alerts.filter(a => a.source === 'NASA POWER');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t('checkingAlerts')}</Text>
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
      <AppHeader title={t('weatherAlerts')} subtitle={`${t('last7Days')} — ${location.city}`} />

      <View style={styles.apiBadge}>
        <Text style={styles.apiBadgeText}>
          🛰️ NASA POWER  ·  NASA EONET  ·  {t('last7Days')}
        </Text>
      </View>

      <View style={styles.content}>
        {alerts.length === 0 ? (
          <View style={styles.noAlertCard}>
            <Text style={styles.noAlertEmoji}>✅</Text>
            <Text style={styles.noAlertTitle}>{t('allClear')}</Text>
            <Text style={styles.noAlertText}>{t('allClearMsg')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {alerts.filter(a => a.type === 'danger').length} {t('danger').toLowerCase()}
              </Text>
              <Text style={styles.summarySep}> · </Text>
              <Text style={styles.summaryText}>
                {alerts.filter(a => a.type === 'warning').length} {t('warning').toLowerCase()}
              </Text>
              <Text style={styles.summarySep}> · </Text>
              <Text style={styles.summaryText}>{alerts.length} {t('total') || 'total'}</Text>
            </View>

            {/* ── EONET Disaster Events ── */}
            {eonetAlerts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>🛰️ {t('disasterAlerts')}</Text>
                {eonetAlerts.map((a, i) => (
                  <AlertCard key={`eo-${i}`} a={a} isDark={isDark} theme={theme} styles={styles} t={t} isEonet />
                ))}
              </>
            )}

            {/* ── NASA POWER Weather Alerts ── */}
            {weatherAlerts.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: eonetAlerts.length > 0 ? 12 : 0 }]}>
                  🌡️ {t('weatherAlerts')}
                </Text>
                {weatherAlerts.map((a, i) => (
                  <AlertCard key={`pw-${i}`} a={a} isDark={isDark} theme={theme} styles={styles} t={t} />
                ))}
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function AlertCard({ a, isDark, theme, styles, t, isEonet = false }) {
  const bgColor = a.type === 'danger'
    ? (isDark ? '#450A0A' : '#FEF2F2')
    : (isDark ? '#451A03' : '#FFFBEB');
  const borderColor = a.type === 'danger' ? theme.danger : theme.warning;
  const msgColor    = a.type === 'danger' ? theme.danger : (isDark ? '#FCD34D' : '#92400E');

  const dateStr = isEonet
    ? a.date
    : a.date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

  return (
    <View style={[styles.alertCard, { backgroundColor: bgColor, borderLeftColor: borderColor }]}>
      <View style={styles.alertTop}>
        <View style={styles.alertMeta}>
          <Text style={styles.alertDate}>{dateStr}</Text>
          {isEonet && <Text style={styles.alertSource}>· {a.category}</Text>}
        </View>
        <View style={styles.badgeRow}>
          {isEonet && (
            <View style={styles.eonetBadge}>
              <Text style={styles.eonetBadgeText}>EONET</Text>
            </View>
          )}
          <View style={[styles.alertBadge, { backgroundColor: a.type === 'danger' ? '#EF4444' : '#F59E0B' }]}>
            <Text style={styles.alertBadgeText}>
              {a.type === 'danger' ? t('danger') : t('warning')}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.alertMsg, { color: msgColor }]}>
        {a.key ? t(a.key) : a.msg}
      </Text>
    </View>
  );
}
