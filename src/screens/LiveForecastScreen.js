/**
 * LiveForecastScreen — Hourly forecast + 7-day outlook.
 * Uses dummy data until APIs are connected.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

// ── Dummy hourly data (24 hrs) ────────────────────────────────────────────────
const HOURLY = [
  { time: 'Now',  temp: 32, rain: 0,  wind: 8,  icon: '☀️',  humidity: 48 },
  { time: '1pm',  temp: 34, rain: 0,  wind: 10, icon: '🌤️', humidity: 45 },
  { time: '2pm',  temp: 35, rain: 0,  wind: 12, icon: '⛅', humidity: 43 },
  { time: '3pm',  temp: 36, rain: 5,  wind: 14, icon: '🌦️', humidity: 55 },
  { time: '4pm',  temp: 33, rain: 15, wind: 18, icon: '🌧️', humidity: 70 },
  { time: '5pm',  temp: 31, rain: 20, wind: 20, icon: '⛈️', humidity: 78 },
  { time: '6pm',  temp: 29, rain: 10, wind: 16, icon: '🌦️', humidity: 72 },
  { time: '7pm',  temp: 28, rain: 2,  wind: 12, icon: '🌤️', humidity: 64 },
  { time: '8pm',  temp: 27, rain: 0,  wind: 9,  icon: '🌙', humidity: 62 },
  { time: '9pm',  temp: 26, rain: 0,  wind: 7,  icon: '🌙', humidity: 60 },
  { time: '10pm', temp: 25, rain: 0,  wind: 6,  icon: '⭐', humidity: 58 },
  { time: '11pm', temp: 24, rain: 0,  wind: 5,  icon: '⭐', humidity: 56 },
  { time: '12am', temp: 23, rain: 0,  wind: 5,  icon: '⭐', humidity: 55 },
  { time: '6am',  temp: 24, rain: 0,  wind: 6,  icon: '🌅', humidity: 60 },
];

// ── Dummy 7-day forecast ──────────────────────────────────────────────────────
const WEEKLY = [
  { day: 'Today',     icon: '🌦️', max: 35, min: 24, rain: 40, wind: 18, desc: 'Partly cloudy with evening rain' },
  { day: 'Tomorrow',  icon: '⛈️', max: 31, min: 22, rain: 75, wind: 24, desc: 'Heavy thunderstorm expected' },
  { day: 'Wednesday', icon: '🌧️', max: 29, min: 21, rain: 60, wind: 20, desc: 'Moderate rainfall' },
  { day: 'Thursday',  icon: '🌤️', max: 33, min: 23, rain: 10, wind: 12, desc: 'Mostly sunny' },
  { day: 'Friday',    icon: '☀️', max: 36, min: 25, rain: 5,  wind: 10, desc: 'Clear sky all day' },
  { day: 'Saturday',  icon: '⛅', max: 34, min: 24, rain: 20, wind: 14, desc: 'Partly cloudy' },
  { day: 'Sunday',    icon: '🌦️', max: 32, min: 22, rain: 35, wind: 16, desc: 'Light showers afternoon' },
];

// ── Rain probability bar ──────────────────────────────────────────────────────
function RainBar({ percent, color }) {
  return (
    <View style={rainBarStyles.track}>
      <View style={[rainBarStyles.fill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}
const rainBarStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, flex: 1, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
});

export default function LiveForecastScreen({ navigation }) {
  const insets        = useSafeAreaInsets();
  const { theme }     = useTheme();
  const { t }         = useLanguage();
  const { location }  = useLocation();

  const [activeTab, setActiveTab] = useState('hourly');

  function speakForecast() {
    Speech.stop();
    Speech.speak(
      `Today's forecast for ${location?.city ?? 'your area'}: Maximum temperature 35 degrees, minimum 24 degrees. Rain chance is 40 percent in the evening. Take care of your crops.`,
      { language: 'en-IN', rate: 0.9 },
    );
  }

  const rainColor = (pct) => pct >= 60 ? '#3B82F6' : pct >= 30 ? '#F59E0B' : '#10B981';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#1E40AF' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Live Forecast</Text>
            <Text style={styles.headerSub}>📍 {location?.city ?? 'Your Location'}</Text>
          </View>
          <TouchableOpacity style={styles.speakBtn} onPress={speakForecast}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Current weather hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌦️</Text>
          <View>
            <Text style={styles.heroTemp}>32°C</Text>
            <Text style={styles.heroDesc}>Partly Cloudy · Feels like 36°C</Text>
          </View>
        </View>

        {/* Quick stats strip */}
        <View style={styles.statsStrip}>
          {[
            { icon: '💧', val: '48%', lbl: 'Humidity' },
            { icon: '💨', val: '18 km/h', lbl: 'Wind' },
            { icon: '🌧️', val: '5mm', lbl: 'Rain today' },
            { icon: '👁️', val: '8 km', lbl: 'Visibility' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          {[
            { key: 'hourly', label: '24-Hour' },
            { key: 'weekly', label: '7-Day' },
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HOURLY TAB ── */}
        {activeTab === 'hourly' && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScroll}
            >
              {HOURLY.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.hourCard,
                    { backgroundColor: i === 0 ? '#1E40AF' : theme.card, borderColor: i === 0 ? '#1E40AF' : theme.border },
                  ]}
                >
                  <Text style={[styles.hourTime, { color: i === 0 ? '#BAE6FD' : theme.subtext }]}>{h.time}</Text>
                  <Text style={styles.hourIcon}>{h.icon}</Text>
                  <Text style={[styles.hourTemp, { color: i === 0 ? '#fff' : theme.text }]}>{h.temp}°</Text>
                  {h.rain > 0 && (
                    <View style={styles.hourRainRow}>
                      <Text style={styles.hourRainText}>💧{h.rain}mm</Text>
                    </View>
                  )}
                  <Text style={[styles.hourWind, { color: i === 0 ? '#BAE6FD' : theme.subtext }]}>{h.wind}km/h</Text>
                </View>
              ))}
            </ScrollView>

            {/* Humidity chart (simple bar) */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>💧 Humidity Trend</Text>
              <View style={styles.humidityBars}>
                {HOURLY.slice(0, 8).map((h, i) => (
                  <View key={i} style={styles.humBar}>
                    <View style={[styles.humBarFill, { height: h.humidity * 0.8, backgroundColor: '#3B82F6' + (i === 0 ? 'FF' : 'AA') }]} />
                    <Text style={[styles.humBarLabel, { color: theme.subtext }]}>{h.time}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── WEEKLY TAB ── */}
        {activeTab === 'weekly' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {WEEKLY.map((w, i) => (
              <View
                key={i}
                style={[
                  styles.weekRow,
                  {
                    backgroundColor: i === 0 ? '#EFF6FF' : theme.card,
                    borderColor: i === 0 ? '#BFDBFE' : theme.border,
                  },
                ]}
              >
                <View style={styles.weekLeft}>
                  <Text style={[styles.weekDay, { color: i === 0 ? '#1E40AF' : theme.text }]}>{w.day}</Text>
                  <Text style={[styles.weekDesc, { color: theme.subtext }]} numberOfLines={1}>{w.desc}</Text>
                </View>
                <Text style={styles.weekIcon}>{w.icon}</Text>
                <View style={styles.weekRight}>
                  <Text style={[styles.weekTemp, { color: theme.text }]}>{w.max}° / {w.min}°</Text>
                  <View style={styles.weekRainRow}>
                    <Text style={[styles.weekRainPct, { color: rainColor(w.rain) }]}>
                      💧{w.rain}%
                    </Text>
                    <RainBar percent={w.rain} color={rainColor(w.rain)} />
                  </View>
                </View>
              </View>
            ))}

            {/* Agricultural advice */}
            <View style={[styles.agriCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={styles.agriTitle}>🌾 Farming Advice</Text>
              {[
                '⛈️ Heavy rain tomorrow — avoid pesticide spray',
                '💧 Skip irrigation for next 2 days',
                '☀️ Friday–Saturday best for fertilizer application',
                '🌱 Good soil moisture this week for sowing',
              ].map((tip, i) => (
                <Text key={i} style={styles.agriTip}>{tip}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header:      { paddingBottom: 0 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backText:    { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  speakBtn:    { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  speakIcon:   { fontSize: 18 },

  hero:       { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingBottom: 20 },
  heroEmoji:  { fontSize: 64 },
  heroTemp:   { fontSize: 52, fontWeight: '900', color: '#fff' },
  heroDesc:   { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 12, paddingHorizontal: 8 },
  statItem:   { flex: 1, alignItems: 'center' },
  statIcon:   { fontSize: 18, marginBottom: 2 },
  statVal:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  statLbl:    { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  tabBar:     { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)' },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabActive:  { borderBottomWidth: 3, borderBottomColor: '#fff' },
  tabText:    { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  tabTextActive: { color: '#fff' },

  hourlyScroll: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  hourCard:     { width: 80, borderRadius: 18, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 4 },
  hourTime:     { fontSize: 11, fontWeight: '700' },
  hourIcon:     { fontSize: 26, marginVertical: 4 },
  hourTemp:     { fontSize: 18, fontWeight: '900' },
  hourRainRow:  { alignItems: 'center' },
  hourRainText: { fontSize: 10, color: '#3B82F6', fontWeight: '700' },
  hourWind:     { fontSize: 10, fontWeight: '600' },

  section:      { margin: 16, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  humidityBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
  humBar:       { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  humBarFill:   { width: '100%', borderRadius: 4, minHeight: 6 },
  humBarLabel:  { fontSize: 8, marginTop: 4, fontWeight: '600' },

  weekRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  weekLeft: { flex: 1 },
  weekDay:  { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  weekDesc: { fontSize: 12, fontWeight: '500' },
  weekIcon: { fontSize: 32, marginHorizontal: 12 },
  weekRight:{ alignItems: 'flex-end', minWidth: 110 },
  weekTemp: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  weekRainRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekRainPct: { fontSize: 12, fontWeight: '700' },

  agriCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, marginTop: 8, marginBottom: 8 },
  agriTitle:{ fontSize: 16, fontWeight: '900', color: '#065F46', marginBottom: 12 },
  agriTip:  { fontSize: 13, color: '#065F46', lineHeight: 22, marginBottom: 4 },
});
