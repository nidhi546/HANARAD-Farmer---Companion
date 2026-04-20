import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_KEYS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getColor(key) {
  if (key.startsWith('vegtype')) return '#059669';
  if (key === 'openwater')        return '#3B82F6';
  if (key.includes('ice'))        return '#0EA5E9';
  return '#F59E0B';
}

export default function SurfaceRoughnessAllScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { theme }  = useTheme();
  const { params } = useRoute();
  const surfaceRaw = params?.surfaceRaw || {};

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Surface Roughness Types</Text>
          <Text style={styles.headerSub}>{Object.keys(surfaceRaw).length} surface types · NASA POWER</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {Object.entries(surfaceRaw).map(([key, val]) => {
          const r      = val?.Roughness || {};
          const annual = r.Annual ?? '—';
          const color  = getColor(key);
          return (
            <View key={key} style={[styles.card, { borderLeftColor: color }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardKey, { color }]}>{key}</Text>
                  <Text style={styles.cardName}>{val?.Long_Name || key}</Text>
                  {val?.IGBP_Type ? (
                    <Text style={styles.cardIgbp}>IGBP: {val.IGBP_Type}</Text>
                  ) : null}
                </View>
                <View style={[styles.annualBadge, { backgroundColor: color + '18' }]}>
                  <Text style={[styles.annualVal, { color }]}>{annual}</Text>
                  <Text style={[styles.annualLabel, { color }]}>annual</Text>
                </View>
              </View>
              <View style={styles.monthRow}>
                {MONTH_KEYS.map((mk, i) => (
                  <View key={mk} style={[styles.monthCell, { backgroundColor: theme.background }]}>
                    <Text style={styles.monthLabel}>{MONTHS[i]}</Text>
                    <Text style={[styles.monthVal, { color }]}>{r[mk] ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: theme.background },
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

    card: {
      backgroundColor: theme.card,
      borderRadius: 14, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: theme.border, borderLeftWidth: 4,
    },
    cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    cardKey:     { fontSize: 12, fontWeight: '800', marginBottom: 2 },
    cardName:    { fontSize: 13, color: theme.text, lineHeight: 18 },
    cardIgbp:    { fontSize: 11, color: theme.subtext, marginTop: 2 },
    annualBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', marginLeft: 12 },
    annualVal:   { fontSize: 22, fontWeight: '900' },
    annualLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

    monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    monthCell: { alignItems: 'center', minWidth: 38, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 4 },
    monthLabel: { fontSize: 9, color: theme.subtext, fontWeight: '600' },
    monthVal:   { fontSize: 12, fontWeight: '800', marginTop: 2 },
  });
}
