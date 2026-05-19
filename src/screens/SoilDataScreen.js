/**
 * SoilDataScreen — Soil & surface metrics with visual gauges.
 * Dummy data until NASA POWER API integration is activated.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

// ── Dummy soil data ───────────────────────────────────────────────────────────
const SOIL = {
  moisture:    62,  // %
  temperature: 28,  // °C
  ph:          6.8,
  nitrogen:    45,  // kg/ha
  phosphorus:  22,
  potassium:   180,
  organicCarbon: 0.8, // %
  waterHolding: 55,   // %
  bulkDensity:  1.4,  // g/cm3
  electricalConductivity: 0.3, // dS/m
};

const NPK_DATA = [
  { label: 'N', icon: '🌿', value: SOIL.nitrogen,   unit: 'kg/ha', max: 100, color: '#10B981', status: 'Low',    statusColor: '#EF4444' },
  { label: 'P', icon: '🌸', value: SOIL.phosphorus,  unit: 'kg/ha', max: 50,  color: '#8B5CF6', status: 'Medium', statusColor: '#F59E0B' },
  { label: 'K', icon: '🌾', value: SOIL.potassium,   unit: 'kg/ha', max: 250, color: '#F59E0B', status: 'Good',   statusColor: '#10B981' },
];

// ── Circular gauge ────────────────────────────────────────────────────────────
function CircleGauge({ value, max, color, label, unit, emoji, size = 110 }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <View style={[gaugeStyles.wrap, { width: size, height: size + 28 }]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Track circle */}
        <View style={[gaugeStyles.track, { width: size, height: size, borderRadius: size / 2, borderColor: color + '22' }]} />
        {/* Value fill approximation using colored arc view */}
        <View
          style={[gaugeStyles.fillArc, {
            width: size - 12, height: size - 12, borderRadius: (size - 12) / 2,
            borderColor: color, borderWidth: 6,
            borderTopColor: pct > 0.75 ? color : 'transparent',
            borderRightColor: pct > 0.5 ? color : 'transparent',
            borderBottomColor: pct > 0.25 ? color : 'transparent',
            borderLeftColor: pct > 0 ? color : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }]}
        />
        <View style={gaugeStyles.center}>
          <Text style={gaugeStyles.emoji}>{emoji}</Text>
          <Text style={[gaugeStyles.value, { color }]}>{value}{unit}</Text>
        </View>
      </View>
      <Text style={gaugeStyles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap:     { alignItems: 'center', position: 'relative' },
  track:    { position: 'absolute', borderWidth: 8 },
  fillArc:  { position: 'absolute' },
  center:   { alignItems: 'center' },
  emoji:    { fontSize: 24 },
  value:    { fontSize: 15, fontWeight: '900', marginTop: 2 },
  label:    { fontSize: 11, color: '#6B7280', fontWeight: '700', marginTop: 6, textAlign: 'center' },
});

// ── Horizontal meter bar ──────────────────────────────────────────────────────
function MeterBar({ value, max, color, emoji, label, unit, status, statusColor, detail }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={meterStyles.wrap}>
      <View style={meterStyles.headerRow}>
        <Text style={meterStyles.emoji}>{emoji}</Text>
        <Text style={meterStyles.label}>{label}</Text>
        <View style={[meterStyles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[meterStyles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
        <Text style={meterStyles.value}>{value} <Text style={meterStyles.unit}>{unit}</Text></Text>
      </View>
      <View style={meterStyles.track}>
        <View style={[meterStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {detail && <Text style={meterStyles.detail}>{detail}</Text>}
    </View>
  );
}

const meterStyles = StyleSheet.create({
  wrap:        { marginBottom: 16 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  emoji:       { fontSize: 18 },
  label:       { flex: 1, fontSize: 14, fontWeight: '700', color: '#374151' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  value:       { fontSize: 15, fontWeight: '900', color: '#111' },
  unit:        { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  track:       { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  fill:        { height: '100%', borderRadius: 5 },
  detail:      { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
});

// ── Advice item ───────────────────────────────────────────────────────────────
function AdviceItem({ icon, text, priority }) {
  const colors = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
  return (
    <View style={[adviceStyles.row, { borderLeftColor: colors[priority] || '#10B981' }]}>
      <Text style={adviceStyles.icon}>{icon}</Text>
      <Text style={adviceStyles.text}>{text}</Text>
    </View>
  );
}

const adviceStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12 },
  icon: { fontSize: 20, marginTop: 1 },
  text: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20, fontWeight: '500' },
});

export default function SoilDataScreen({ navigation }) {
  const insets        = useSafeAreaInsets();
  const { theme }     = useTheme();
  const { location }  = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  function speakSoil() {
    Speech.stop();
    Speech.speak(
      `Soil report for your farm: Moisture is ${SOIL.moisture} percent, which is good for most crops. Temperature is ${SOIL.temperature} degrees. Nitrogen is low at ${SOIL.nitrogen} kilograms per hectare. Apply nitrogen fertilizer before sowing.`,
      { language: 'en-IN', rate: 0.9 },
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#92400E' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>🌍 Soil & Surface Data</Text>
            <Text style={styles.headerSub}>📍 {location?.city ?? 'Your Farm'}</Text>
          </View>
          <TouchableOpacity style={styles.speakBtn} onPress={speakSoil}>
            <Text style={{ fontSize: 20 }}>🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Overall score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>Soil Health Score</Text>
            <Text style={styles.scoreVal}>72</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: '72%' }]} />
          </View>
          <View style={styles.scoreRight}>
            <Text style={styles.scoreStatus}>GOOD</Text>
            <Text style={styles.scoreNote}>Some nutrients need attention</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'npk',      label: 'NPK' },
            { key: 'advice',   label: 'Advice' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <View>
            {/* Circular gauges */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Key Metrics</Text>
              <View style={styles.gaugeRow}>
                <CircleGauge value={SOIL.moisture}    max={100} color="#3B82F6" label="Moisture" unit="%" emoji="💧" />
                <CircleGauge value={SOIL.temperature} max={50}  color="#F59E0B" label="Soil Temp" unit="°C" emoji="🌡️" />
                <CircleGauge value={SOIL.ph * 10}     max={140} color="#10B981" label="pH Level" unit="" emoji="⚗️" size={100} />
              </View>
            </View>

            {/* Meter bars */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Soil Properties</Text>
              <MeterBar value={SOIL.waterHolding} max={100} color="#3B82F6" emoji="🌊" label="Water Holding"  unit="%" status="Good"   statusColor="#10B981" detail="Good for cotton and groundnut" />
              <MeterBar value={SOIL.organicCarbon * 10} max={20} color="#92400E" emoji="🍂" label="Organic Carbon" unit="%" status="Low" statusColor="#EF4444" detail="Add organic matter or compost" />
              <MeterBar value={(SOIL.electricalConductivity * 100)} max={100} color="#8B5CF6" emoji="⚡" label="Salinity (EC)" unit="dS/m" status="Normal" statusColor="#10B981" detail="Safe for most crops" />
            </View>

            {/* Last Updated */}
            <View style={[styles.updateNote, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.updateText, { color: theme.subtext }]}>
                📡 Data source: NASA POWER + Local sensors · Updated today at 6:00 AM
              </Text>
            </View>
          </View>
        )}

        {/* ── NPK TAB ── */}
        {activeTab === 'npk' && (
          <View>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>NPK Status</Text>
              {NPK_DATA.map((n, i) => (
                <View key={i} style={[styles.npkCard, { borderColor: n.color + '40', backgroundColor: n.color + '08' }]}>
                  <View style={[styles.npkBadge, { backgroundColor: n.color }]}>
                    <Text style={styles.npkBadgeText}>{n.label}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={styles.npkHeader}>
                      <Text style={styles.npkEmoji}>{n.icon}</Text>
                      <Text style={[styles.npkLabel, { color: theme.text }]}>
                        {n.label === 'N' ? 'Nitrogen' : n.label === 'P' ? 'Phosphorus' : 'Potassium'}
                      </Text>
                      <View style={[styles.npkStatus, { backgroundColor: n.statusColor + '20' }]}>
                        <Text style={[styles.npkStatusText, { color: n.statusColor }]}>{n.status}</Text>
                      </View>
                    </View>
                    <View style={styles.npkBar}>
                      <View style={[styles.npkBarFill, { width: `${(n.value / n.max) * 100}%`, backgroundColor: n.color }]} />
                    </View>
                    <Text style={styles.npkVal}>{n.value} {n.unit}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.cardTitle, { color: '#065F46' }]}>💡 Fertilizer Suggestion</Text>
              {[
                { text: 'Apply Urea (46-0-0) at 50 kg/acre to boost Nitrogen', dose: '50 kg/acre' },
                { text: 'Phosphorus is adequate — no additional needed this week', dose: '—' },
                { text: 'Potassium is good — apply Muriate of Potash only after harvest', dose: 'Post-harvest' },
              ].map((item, i) => (
                <View key={i} style={styles.fertRow}>
                  <Text style={styles.fertText}>{i + 1}. {item.text}</Text>
                  <View style={styles.fertDoseBadge}>
                    <Text style={styles.fertDoseText}>{item.dose}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ADVICE TAB ── */}
        {activeTab === 'advice' && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>🌾 Farm Advice Based on Soil</Text>
            <AdviceItem icon="⚠️" text="Nitrogen is LOW. Apply DAP or Urea fertilizer before sowing for better yield." priority="high" />
            <AdviceItem icon="💧" text="Soil moisture at 62% is good. Hold irrigation for 2 more days." priority="low" />
            <AdviceItem icon="🌡️" text="Soil temperature is 28°C — ideal for cotton and groundnut sowing." priority="low" />
            <AdviceItem icon="🍂" text="Organic carbon is low. Mix compost or farmyard manure before next planting." priority="medium" />
            <AdviceItem icon="⚗️" text="pH is 6.8 — slightly acidic. Suitable for most Gujarat crops. No lime needed." priority="low" />
            <AdviceItem icon="🌱" text="Water holding capacity is good. Reduce irrigation frequency by 20%." priority="low" />
            <AdviceItem icon="📅" text="Best planting window: next 5–7 days before forecast rain on Thursday." priority="medium" />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header:     { paddingBottom: 0 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:    { width: 36, alignItems: 'flex-start' },
  backText:   { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerTitle:{ fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  speakBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  scoreCard:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  scoreLeft:  { alignItems: 'center', minWidth: 60 },
  scoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  scoreVal:   { fontSize: 36, fontWeight: '900', color: '#fff' },
  scoreMax:   { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  scoreBar:   { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 5, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: '#34D399', borderRadius: 5 },
  scoreRight: { alignItems: 'flex-start', minWidth: 80 },
  scoreStatus:{ fontSize: 14, fontWeight: '900', color: '#34D399' },
  scoreNote:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  tabBar:      { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)' },
  tab:         { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive:   { borderBottomWidth: 3, borderBottomColor: '#FBBF24' },
  tabText:     { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabTextActive:{ color: '#fff' },

  scroll:     { paddingTop: 16 },
  card:       { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 18 },
  cardTitle:  { fontSize: 16, fontWeight: '900', marginBottom: 16 },

  gaugeRow:   { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },

  npkCard:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 12 },
  npkBadge:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  npkBadgeText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  npkHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  npkEmoji:   { fontSize: 16 },
  npkLabel:   { flex: 1, fontSize: 14, fontWeight: '700' },
  npkStatus:  { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  npkStatusText: { fontSize: 11, fontWeight: '700' },
  npkBar:     { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  npkBarFill: { height: '100%', borderRadius: 4 },
  npkVal:     { fontSize: 13, color: '#374151', fontWeight: '600' },

  fertRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  fertText:   { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 19, fontWeight: '500' },
  fertDoseBadge: { backgroundColor: '#10B981', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  fertDoseText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  updateNote: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 10 },
  updateText: { fontSize: 11, textAlign: 'center', lineHeight: 18 },
});
