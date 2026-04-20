/**
 * NasaWeatherHubScreen
 * Five-tab dashboard implementing all NASA POWER + Open-Meteo APIs:
 *   Daily  |  Monthly  |  Climate (30-yr)  |  Disasters (EONET)  |  Forecast
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useNavigation }       from '@react-navigation/native';
import { useSafeAreaInsets }   from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useLocation }         from '../context/LocationContext';
import { useTheme }            from '../context/ThemeContext';
import {
  getDailyData,
  getMonthlyData,
  getClimatology,
  getEonetAlerts,
  getOpenMeteoForecast,
} from '../api/powerApi';

const { width } = Dimensions.get('window');
const CHART_W   = width - 56;
const CURR_YEAR = new Date().getFullYear();

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'daily',       label: 'Daily',     icon: '📅', color: '#4F46E5' },
  { id: 'monthly',     label: 'Monthly',   icon: '🗓️',  color: '#059669' },
  { id: 'climatology', label: 'Climate',   icon: '📈', color: '#F59E0B' },
  { id: 'alerts',      label: 'Disasters', icon: '🚨', color: '#EF4444' },
  { id: 'forecast',    label: 'Forecast',  icon: '🌤️',  color: '#06B6D4' },
];

// ── WMO weather-code helpers ──────────────────────────────────────────────────
const WMO_DESC = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain',    63: 'Rain',    65: 'Heavy rain',
  71: 'Light snow',    73: 'Snow',    75: 'Heavy snow',
  80: 'Showers', 81: 'Rain showers', 82: 'Heavy showers',
  95: 'Thunderstorm',  96: 'Tstorm + hail', 99: 'Heavy Tstorm',
};

function wmoIcon(code) {
  if (code == null) return '🌤️';
  if (code <= 1)   return '☀️';
  if (code <= 3)   return '⛅';
  if (code <= 48)  return '🌫️';
  if (code <= 67)  return '🌧️';
  if (code <= 77)  return '❄️';
  if (code <= 82)  return '🌦️';
  return '⛈️';
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function nasaFmt(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function getDailyRange(days) {
  const end = new Date(); end.setDate(end.getDate() - 2);        // NASA 2-day lag
  const start = new Date(end); start.setDate(start.getDate() - (days - 1));
  return { start: nasaFmt(start), end: nasaFmt(end) };
}

function getYearRange(year) {
  return { start: `${year}0101`, end: `${year}1231` };
}

function fmtDay(s) { return `${s.slice(6, 8)}/${s.slice(4, 6)}`; }
function fmtMonth(s) {
  const m = parseInt(s.slice(4, 6), 10);
  return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] || '';
}

const CLIM_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                     'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// ── Data parsers ──────────────────────────────────────────────────────────────
function parseDailyChart(apiRes, paramId, maxPts) {
  const map = apiRes?.properties?.parameter?.[paramId] || {};
  const pts = Object.entries(map)
    .filter(([, v]) => v !== -999 && v !== null && !isNaN(v))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-maxPts);
  if (pts.length < 2) return null;
  const step = Math.max(1, Math.floor(pts.length / 6));
  return {
    labels: pts.map(([d], i) =>
      (i % step === 0 || i === pts.length - 1) ? fmtDay(d) : ''),
    data: pts.map(([, v]) => parseFloat(v)),
  };
}

function parseMonthlyChart(apiRes, paramId) {
  const map  = apiRes?.properties?.parameter?.[paramId] || {};
  const keys = Object.keys(map).filter(k => /^\d{6}$/.test(k)).sort();
  if (keys.length < 1) return null;
  return {
    labels: keys.map(k => fmtMonth(k)),
    data:   keys.map(k => parseFloat(map[k] === -999 ? 0 : map[k])),
  };
}

function parseClimatologyChart(apiRes, paramId) {
  const map     = apiRes?.properties?.parameter?.[paramId] || {};
  const entries = CLIM_MONTHS
    .map(m => [m, map[m] ?? map[m.toLowerCase()]])
    .filter(([, v]) => v != null && v !== -999);
  if (entries.length < 2) return null;
  return {
    labels: entries.map(([m]) => m.slice(0, 3)),
    data:   entries.map(([, v]) => parseFloat(v)),
  };
}

function latestVal(apiRes, paramId) {
  const map   = apiRes?.properties?.parameter?.[paramId] || {};
  const sorted = Object.keys(map).sort().reverse();
  for (const k of sorted) {
    if (map[k] !== -999 && !isNaN(map[k])) return parseFloat(map[k]).toFixed(1);
  }
  return '--';
}

// ── Chart config ──────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '0,0,0';
}

function mkCfg(color) {
  const rgb = hexToRgb(color);
  return {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo:   '#fff',
    decimalPlaces: 1,
    color: (o = 1) => `rgba(${rgb}, ${o})`,
    labelColor: () => '#6B7280',
    propsForDots: { r: '3', strokeWidth: '1', stroke: color },
    propsForBackgroundLines: { stroke: '#F3F4F6' },
  };
}

// ── Shared chart wrapper components ───────────────────────────────────────────
function LineCard({ title, chart, color, unit }) {
  return (
    <View style={cs.card}>
      <View style={cs.cardHeader}>
        <Text style={cs.cardTitle}>{title}</Text>
        {unit ? <Text style={cs.unit}>{unit}</Text> : null}
      </View>
      {chart ? (
        <LineChart
          data={{ labels: chart.labels, datasets: [{ data: chart.data }] }}
          width={CHART_W} height={170}
          chartConfig={mkCfg(color)}
          bezier
          style={{ borderRadius: 10, marginLeft: -12 }}
          withInnerLines withOuterLines={false}
        />
      ) : (
        <View style={cs.noData}><Text style={cs.noDataTxt}>No data available</Text></View>
      )}
    </View>
  );
}

function BarCard({ title, chart, color, unit }) {
  return (
    <View style={cs.card}>
      <View style={cs.cardHeader}>
        <Text style={cs.cardTitle}>{title}</Text>
        {unit ? <Text style={cs.unit}>{unit}</Text> : null}
      </View>
      {chart ? (
        <BarChart
          data={{ labels: chart.labels, datasets: [{ data: chart.data }] }}
          width={CHART_W} height={170}
          chartConfig={mkCfg(color)}
          style={{ borderRadius: 10, marginLeft: -12 }}
          fromZero withInnerLines showValuesOnTopOfBars={false}
          yAxisSuffix=""
        />
      ) : (
        <View style={cs.noData}><Text style={cs.noDataTxt}>No data available</Text></View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E4E4E7',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#18181B' },
  unit: { fontSize: 11, fontWeight: '600', color: '#71717A' },
  noData: { height: 80, alignItems: 'center', justifyContent: 'center' },
  noDataTxt: { color: '#71717A', fontSize: 12 },
});

// ── Shared utility components ─────────────────────────────────────────────────
function LoadingBox({ color, msg }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator size="large" color={color} />
      <Text style={{ fontSize: 13, color: '#71717A', marginTop: 16, textAlign: 'center' }}>{msg}</Text>
    </View>
  );
}

function ErrorBox({ msg, onRetry }) {
  return (
    <View style={{ margin: 20, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
      <Text style={{ fontSize: 14, fontWeight: '800', color: '#DC2626', marginBottom: 4 }}>Failed to load</Text>
      <Text style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 18, marginBottom: 12 }}>{msg}</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' }}
        onPress={onRetry}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const pill = StyleSheet.create({
  base:        { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E4E4E7', backgroundColor: '#F7F8FC' },
  active:      { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  activeGreen: { backgroundColor: '#059669', borderColor: '#059669' },
  txt:         { fontSize: 12, fontWeight: '700', color: '#71717A' },
  txtActive:   { color: '#FFFFFF' },
});

// ── TAB 1 — Daily ─────────────────────────────────────────────────────────────
function DailyTab({ data, loading, error, days, setDays, onRetry }) {
  if (loading) return <LoadingBox color="#4F46E5" msg="Loading daily weather data from NASA POWER…" />;
  if (error)   return <ErrorBox msg={error} onRetry={onRetry} />;
  if (!data)   return <LoadingBox color="#4F46E5" msg="Preparing…" />;

  const temp  = parseDailyChart(data, 'T2M',         days);
  const rain  = parseDailyChart(data, 'PRECTOTCORR', days);
  const humid = parseDailyChart(data, 'RH2M',        days);
  const wind  = parseDailyChart(data, 'WS10M',       days);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      {/* Source badge */}
      <View style={tabStyles.sourceBadge}>
        <Text style={tabStyles.sourceTxt}>🛰️ NASA POWER · Daily Point API · AG Community</Text>
      </View>

      {/* Date range selector */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[7, 14, 30].map(d => (
          <TouchableOpacity key={d} style={[pill.base, days === d && pill.active]} onPress={() => setDays(d)}>
            <Text style={[pill.txt, days === d && pill.txtActive]}>{d} Days</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary stat cards */}
      <View style={tabStyles.statRow}>
        {[
          { icon: '🌡️', val: `${latestVal(data, 'T2M')}°C`,   lbl: 'Avg Temp',   bg: '#FEF2F2', col: '#DC2626' },
          { icon: '🌧️', val: `${latestVal(data, 'PRECTOTCORR')} mm`, lbl: 'Rainfall', bg: '#EFF6FF', col: '#2563EB' },
          { icon: '💧', val: `${latestVal(data, 'RH2M')}%`,    lbl: 'Humidity',   bg: '#ECFEFF', col: '#0891B2' },
          { icon: '💨', val: `${latestVal(data, 'WS10M')} m/s`,lbl: 'Wind',       bg: '#F5F3FF', col: '#7C3AED' },
        ].map((s, i) => (
          <View key={i} style={[tabStyles.statCard, { backgroundColor: s.bg }]}>
            <Text style={{ fontSize: 18 }}>{s.icon}</Text>
            <Text style={[tabStyles.statVal, { color: s.col }]}>{s.val}</Text>
            <Text style={tabStyles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      <LineCard title="Temperature (Avg)"  chart={temp}  color="#EF4444" unit="°C" />
      <BarCard  title="Daily Rainfall"     chart={rain}  color="#3B82F6" unit="mm" />
      <LineCard title="Relative Humidity"  chart={humid} color="#06B6D4" unit="%" />
      <LineCard title="Wind Speed @ 10m"   chart={wind}  color="#8B5CF6" unit="m/s" />

      <View style={tabStyles.footNote}>
        <Text style={tabStyles.footNoteTxt}>
          ⏱ Data has a ~2 day processing lag. Values are NASA POWER AG-community daily averages.
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── TAB 2 — Monthly ───────────────────────────────────────────────────────────
function MonthlyTab({ data, loading, error, year, setYear, onRetry }) {
  if (loading) return <LoadingBox color="#059669" msg="Loading monthly aggregates from NASA POWER…" />;
  if (error)   return <ErrorBox msg={error} onRetry={onRetry} />;
  if (!data)   return <LoadingBox color="#059669" msg="Preparing…" />;

  const temp = parseMonthlyChart(data, 'T2M');
  const rain = parseMonthlyChart(data, 'PRECTOTCORR');
  const rh   = parseMonthlyChart(data, 'RH2M');

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <View style={tabStyles.sourceBadge}>
        <Text style={tabStyles.sourceTxt}>🛰️ NASA POWER · Monthly Point API · AG Community</Text>
      </View>

      {/* Year selector */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[CURR_YEAR - 2, CURR_YEAR - 1, CURR_YEAR].map(y => (
          <TouchableOpacity key={y} style={[pill.base, year === y && pill.activeGreen]} onPress={() => setYear(y)}>
            <Text style={[pill.txt, year === y && pill.txtActive]}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <BarCard  title={`Monthly Avg Temp · ${year}`}     chart={temp} color="#059669" unit="°C" />
      <BarCard  title={`Monthly Rainfall · ${year}`}     chart={rain} color="#3B82F6" unit="mm/day" />
      <LineCard title={`Monthly Avg Humidity · ${year}`} chart={rh}   color="#06B6D4" unit="%" />

      <View style={tabStyles.footNote}>
        <Text style={tabStyles.footNoteTxt}>
          Monthly data from NASA POWER is great for crop planning by season.
          Current-year data may be partial if the year is not complete.
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── TAB 3 — Climatology (30-yr averages) ─────────────────────────────────────
function ClimatologyTab({ data, loading, error, onRetry }) {
  if (loading) return <LoadingBox color="#F59E0B" msg="Loading 30-year climate normals from NASA POWER…" />;
  if (error)   return <ErrorBox msg={error} onRetry={onRetry} />;
  if (!data)   return <LoadingBox color="#F59E0B" msg="Preparing…" />;

  const temp = parseClimatologyChart(data, 'T2M');
  const rain = parseClimatologyChart(data, 'PRECTOTCORR');
  const rh   = parseClimatologyChart(data, 'RH2M');

  const annTemp = data?.properties?.parameter?.T2M?.ANN;
  const annRain = data?.properties?.parameter?.PRECTOTCORR?.ANN;
  const annRH   = data?.properties?.parameter?.RH2M?.ANN;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <View style={tabStyles.sourceBadge}>
        <Text style={tabStyles.sourceTxt}>🛰️ NASA POWER · Climatology API · 30-Year Normals</Text>
      </View>

      {/* Annual summary */}
      <View style={[cs.card, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#92400E', marginBottom: 8 }}>
          🌍 Annual Climate Summary
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { icon: '🌡️', lbl: 'Avg Temp',   val: annTemp != null ? `${parseFloat(annTemp).toFixed(1)}°C` : '--', col: '#DC2626' },
            { icon: '🌧️', lbl: 'Avg Rainfall',val: annRain != null ? `${parseFloat(annRain).toFixed(2)} mm/d` : '--', col: '#2563EB' },
            { icon: '💧', lbl: 'Avg Humidity', val: annRH   != null ? `${parseFloat(annRH).toFixed(1)}%` : '--', col: '#0891B2' },
          ].map((s, i) => (
            <View key={i} style={[tabStyles.statCard, { backgroundColor: '#FFFFFF', flex: 1, minWidth: '28%' }]}>
              <Text style={{ fontSize: 18 }}>{s.icon}</Text>
              <Text style={[tabStyles.statVal, { color: s.col, fontSize: 14 }]}>{s.val}</Text>
              <Text style={tabStyles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      <LineCard title="Monthly Avg Temp (30-yr)" chart={temp}  color="#F59E0B" unit="°C" />
      <BarCard  title="Monthly Rainfall (30-yr)" chart={rain}  color="#3B82F6" unit="mm/day" />
      <LineCard title="Monthly Humidity (30-yr)" chart={rh}    color="#06B6D4" unit="%" />

      {/* Farmer tip */}
      <View style={[cs.card, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#065F46', marginBottom: 6 }}>
          🌾 How Farmers Use This
        </Text>
        <Text style={{ fontSize: 12, color: '#064E3B', lineHeight: 18 }}>
          • Compare current season to 30-year normals to spot anomalies{'\n'}
          • Plan sowing dates based on typical first/last frost months{'\n'}
          • Estimate irrigation need from long-term rainfall patterns{'\n'}
          • Identify peak solar months for solar pump planning
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── TAB 4 — EONET Disaster Alerts ────────────────────────────────────────────
const ALERT_ICONS = {
  drought: '🏜️', floods: '🌊', wildfires: '🔥',
  severestorms: '⛈️', temperatureextremes: '🌡️', dusthaze: '🌫️',
};
const ALERT_COL  = { danger: '#EF4444', warning: '#F59E0B' };
const ALERT_BG   = { danger: '#FEF2F2', warning: '#FFFBEB' };

function AlertsTab({ data, loading, error, onRetry }) {
  if (loading) return <LoadingBox color="#EF4444" msg="Scanning NASA EONET for disasters near you…" />;
  if (error)   return <ErrorBox msg={error} onRetry={onRetry} />;

  if (!data || data.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#18181B', marginBottom: 8 }}>
          No Active Disasters
        </Text>
        <Text style={{ fontSize: 13, color: '#71717A', textAlign: 'center', lineHeight: 20 }}>
          No droughts, floods, wildfires, or severe storms found within 500 km of your location in the last 30 days.
        </Text>
        <View style={{ marginTop: 16, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 11, color: '#065F46', textAlign: 'center', fontWeight: '600' }}>
            🛰️ Source: NASA EONET · Updated in real-time
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <View style={tabStyles.sourceBadge}>
        <Text style={tabStyles.sourceTxt}>🛰️ NASA EONET · Real-time Natural Events</Text>
      </View>

      <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#DC2626', marginBottom: 3 }}>
          🚨 {data.length} Active Event{data.length !== 1 ? 's' : ''} Within 500 km
        </Text>
        <Text style={{ fontSize: 11, color: '#7F1D1D' }}>
          Covering: droughts, floods, wildfires, severe storms, temperature extremes, dust
        </Text>
      </View>

      {data.map((alert, i) => {
        const catKey = (alert.category || '').toLowerCase().replace(/\s/g, '');
        return (
          <View key={i} style={[alertSt.card, {
            backgroundColor: ALERT_BG[alert.type]  || '#F9FAFB',
            borderLeftColor: ALERT_COL[alert.type] || '#6B7280',
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Text style={{ fontSize: 26 }}>
                {ALERT_ICONS[catKey] || '⚠️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[alertSt.title, { color: ALERT_COL[alert.type] || '#374151' }]}>
                  {alert.msg}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                  <Text style={alertSt.meta}>📅 {alert.date}</Text>
                  <Text style={alertSt.meta}>🏷️ {alert.category}</Text>
                  <Text style={alertSt.meta}>🛰️ {alert.source}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}

      <View style={tabStyles.footNote}>
        <Text style={tabStyles.footNoteTxt}>
          Pull down to refresh · Events are sourced live from NASA's Earth Observatory Natural Event Tracker
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const alertSt = StyleSheet.create({
  card: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  title: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  meta:  { fontSize: 11, color: '#6B7280' },
});

// ── TAB 5 — Open-Meteo 7-Day Forecast ────────────────────────────────────────
function ForecastTab({ data, loading, error, onRetry }) {
  if (loading) return <LoadingBox color="#06B6D4" msg="Fetching 7-day forecast from Open-Meteo…" />;
  if (error)   return <ErrorBox msg={error} onRetry={onRetry} />;
  if (!data)   return <LoadingBox color="#06B6D4" msg="Preparing…" />;

  const cur   = data?.current;
  const daily = data?.daily;

  function dayLabel(dateStr, i) {
    if (i === 0) return 'Today';
    if (i === 1) return 'Tomorrow';
    return new Date(dateStr).toLocaleDateString('en', { weekday: 'short' });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <View style={tabStyles.sourceBadge}>
        <Text style={tabStyles.sourceTxt}>🌐 Open-Meteo · Free · No API Key · WMO Weather Codes</Text>
      </View>

      {/* Current conditions card */}
      {cur && (
        <View style={fcSt.currentCard}>
          <Text style={fcSt.currentTitle}>⚡ Current Conditions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {[
              { icon: '🌡️', val: `${cur.temperature_2m?.toFixed(1)}°C`, lbl: 'Temperature' },
              { icon: '💧', val: `${cur.relative_humidity_2m ?? '--'}%`, lbl: 'Humidity' },
              { icon: '💨', val: `${cur.wind_speed_10m?.toFixed(1) ?? '--'} m/s`, lbl: 'Wind Speed' },
              { icon: '🌧️', val: `${cur.precipitation ?? 0} mm`, lbl: 'Precipitation' },
            ].map((s, i) => (
              <View key={i} style={fcSt.curStat}>
                <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                <Text style={fcSt.curVal}>{s.val}</Text>
                <Text style={fcSt.curLbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 7-day cards */}
      {daily?.time?.length > 0 && (
        <>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#18181B', marginBottom: 10, marginTop: 4 }}>
            📅 7-Day Outlook
          </Text>
          {daily.time.map((date, i) => (
            <View key={i} style={[fcSt.dayCard, i === 0 && fcSt.dayCardToday]}>
              <View style={{ width: 72 }}>
                <Text style={[fcSt.dayName, i === 0 && { color: '#06B6D4' }]}>
                  {dayLabel(date, i)}
                </Text>
                <Text style={fcSt.dayDate}>{date?.slice(5)}</Text>
              </View>

              <Text style={{ fontSize: 26 }}>{wmoIcon(daily.weathercode?.[i])}</Text>

              <Text style={fcSt.dayDesc} numberOfLines={1}>
                {WMO_DESC[daily.weathercode?.[i]] || ''}
              </Text>

              <View style={fcSt.tempGroup}>
                <Text style={fcSt.tempHi}>{daily.temperature_2m_max?.[i]?.toFixed(0)}°</Text>
                <Text style={fcSt.tempLo}>{daily.temperature_2m_min?.[i]?.toFixed(0)}°</Text>
              </View>

              <View style={{ alignItems: 'flex-end', minWidth: 44 }}>
                <Text style={fcSt.rainVal}>{daily.precipitation_sum?.[i]?.toFixed(1)}</Text>
                <Text style={fcSt.rainUnit}>mm</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Farm advice */}
      {cur && (
        <View style={[cs.card, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: 8 }]}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534', marginBottom: 6 }}>
            🌾 Farm Advice for Today
          </Text>
          <Text style={{ fontSize: 12, color: '#14532D', lineHeight: 18 }}>
            {(cur.wind_speed_10m ?? 0) > 10
              ? '⚠️ Wind > 10 m/s — avoid pesticide / fertiliser spraying today.'
              : '✅ Wind is low — safe for spray operations.'}
            {'\n'}
            {(cur.relative_humidity_2m ?? 0) > 85
              ? '⚠️ High humidity — increased fungal disease risk. Monitor crops closely.'
              : '✅ Humidity levels are within normal range.'}
            {'\n'}
            {(cur.temperature_2m ?? 0) > 40
              ? '🔥 Heat stress alert — irrigate early morning or late evening.'
              : (cur.temperature_2m ?? 0) < 5
                ? '❄️ Near-frost conditions — protect sensitive crops overnight.'
                : '✅ Temperature is in a comfortable range for most crops.'}
          </Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const fcSt = StyleSheet.create({
  currentCard: {
    backgroundColor: '#EFF6FF', borderRadius: 18, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  currentTitle: { fontSize: 14, fontWeight: '800', color: '#1E40AF' },
  curStat: {
    flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4,
  },
  curVal: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  curLbl: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  dayCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E4E4E7',
  },
  dayCardToday: { borderColor: '#06B6D4', backgroundColor: '#ECFEFF' },
  dayName: { fontSize: 13, fontWeight: '800', color: '#18181B' },
  dayDate: { fontSize: 10, color: '#71717A', marginTop: 1 },
  dayDesc: { flex: 1, fontSize: 11, color: '#71717A' },
  tempGroup: { flexDirection: 'row', gap: 5, alignItems: 'baseline' },
  tempHi: { fontSize: 15, fontWeight: '900', color: '#EF4444' },
  tempLo: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  rainVal: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
  rainUnit: { fontSize: 9, color: '#71717A', fontWeight: '600' },
});

// ── Shared tab styles ─────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  sourceBadge: {
    backgroundColor: '#1E1B4B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  sourceTxt: { fontSize: 10, fontWeight: '700', color: '#A5B4FC', letterSpacing: 0.5 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: '44%', borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 3,
  },
  statVal: { fontSize: 15, fontWeight: '900', color: '#18181B' },
  statLbl: { fontSize: 10, color: '#71717A', fontWeight: '600', textAlign: 'center' },
  footNote: {
    backgroundColor: '#F7F8FC', borderRadius: 12, padding: 12, marginTop: 4,
  },
  footNoteTxt: { fontSize: 11, color: '#71717A', lineHeight: 16 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NasaWeatherHubScreen({ route }) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { location } = useLocation();
  const { theme }    = useTheme();

  // Allow deep-linking to a specific tab from route params
  const initialTab = route?.params?.tab || 'daily';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dailyDays,   setDailyDaysState]   = useState(14);
  const [monthlyYear, setMonthlyYearState] = useState(CURR_YEAR);

  // Per-tab data + loading + error state in flat maps
  const [tabData,    setTabData]    = useState({});
  const [tabLoading, setTabLoading] = useState({});
  const [tabError,   setTabError]   = useState({});

  // Generic loader — calls fetcher() and stores result under tabId
  const load = useCallback(async (tabId, fetcher) => {
    setTabLoading(p => ({ ...p, [tabId]: true }));
    setTabError(p => ({ ...p, [tabId]: null }));
    try {
      const res = await fetcher();
      setTabData(p => ({ ...p, [tabId]: res }));
    } catch (e) {
      setTabError(p => ({ ...p, [tabId]: e.message || 'Request failed. Check connection.' }));
    }
    setTabLoading(p => ({ ...p, [tabId]: false }));
  }, []);

  // Typed load helpers — each knows its fetcher & key
  const loadDailyFn = useCallback((days = dailyDays) => {
    const { start, end } = getDailyRange(days);
    return load('daily', () => getDailyData(location.lat, location.lon, start, end));
  }, [location.lat, location.lon, dailyDays, load]);

  const loadMonthlyFn = useCallback((year = monthlyYear) => {
    const { start, end } = getYearRange(year);
    return load('monthly', () => getMonthlyData(location.lat, location.lon, start, end));
  }, [location.lat, location.lon, monthlyYear, load]);

  const loadClimateFn = useCallback(() =>
    load('climatology', () => getClimatology(location.lat, location.lon)),
    [location.lat, location.lon, load]);

  const loadAlertsFn = useCallback(() =>
    load('alerts', () => getEonetAlerts(location.lat, location.lon)),
    [location.lat, location.lon, load]);

  const loadForecastFn = useCallback(() =>
    load('forecast', () => getOpenMeteoForecast(location.lat, location.lon)),
    [location.lat, location.lon, load]);

  // Load default tab on mount
  useEffect(() => { loadDailyFn(); }, []);

  // Lazy-load when switching tabs (only if not already loaded)
  useEffect(() => {
    if (activeTab === 'monthly'     && !tabData.monthly)     loadMonthlyFn();
    if (activeTab === 'climatology' && !tabData.climatology) loadClimateFn();
    if (activeTab === 'alerts'      && !tabData.alerts)      loadAlertsFn();
    if (activeTab === 'forecast'    && !tabData.forecast)    loadForecastFn();
  }, [activeTab]);

  // Date-range change handlers (clear old data → reload)
  const handleSetDays = (d) => {
    setDailyDaysState(d);
    setTabData(p => ({ ...p, daily: null }));
    const { start, end } = getDailyRange(d);
    load('daily', () => getDailyData(location.lat, location.lon, start, end));
  };

  const handleSetYear = (y) => {
    setMonthlyYearState(y);
    setTabData(p => ({ ...p, monthly: null }));
    const { start, end } = getYearRange(y);
    load('monthly', () => getMonthlyData(location.lat, location.lon, start, end));
  };

  const activeColor = TABS.find(t => t.id === activeTab)?.color || '#4F46E5';

  return (
    <View style={[mainSt.root, { backgroundColor: theme.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[mainSt.header, { paddingTop: insets.top + 14 }]}>
        <View style={mainSt.headerRow}>
          <TouchableOpacity style={mainSt.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={mainSt.title}>NASA Weather Hub</Text>
            <Text style={mainSt.subtitle}>
              📍 {location.city} · {parseFloat(location.lat).toFixed(2)}°N, {parseFloat(location.lon).toFixed(2)}°E
            </Text>
          </View>
          <View style={mainSt.badge}>
            <Text style={mainSt.badgeTxt}>NASA POWER</Text>
          </View>
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={mainSt.tabBar}
        >
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[mainSt.tabBtn, active && { backgroundColor: tab.color }]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
                <Text style={[mainSt.tabLabel, active && { color: '#FFFFFF' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'daily' && (
          <DailyTab
            data={tabData.daily}
            loading={!!tabLoading.daily}
            error={tabError.daily}
            days={dailyDays}
            setDays={handleSetDays}
            onRetry={() => handleSetDays(dailyDays)}
          />
        )}
        {activeTab === 'monthly' && (
          <MonthlyTab
            data={tabData.monthly}
            loading={!!tabLoading.monthly}
            error={tabError.monthly}
            year={monthlyYear}
            setYear={handleSetYear}
            onRetry={() => handleSetYear(monthlyYear)}
          />
        )}
        {activeTab === 'climatology' && (
          <ClimatologyTab
            data={tabData.climatology}
            loading={!!tabLoading.climatology}
            error={tabError.climatology}
            onRetry={loadClimateFn}
          />
        )}
        {activeTab === 'alerts' && (
          <AlertsTab
            data={tabData.alerts}
            loading={!!tabLoading.alerts}
            error={tabError.alerts}
            onRetry={loadAlertsFn}
          />
        )}
        {activeTab === 'forecast' && (
          <ForecastTab
            data={tabData.forecast}
            loading={!!tabLoading.forecast}
            error={tabError.forecast}
            onRetry={loadForecastFn}
          />
        )}
      </View>
    </View>
  );
}

const mainSt = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 0 },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  title:    { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeTxt: { fontSize: 10, fontWeight: '700', color: '#A5B4FC', letterSpacing: 0.8 },
  tabBar: { gap: 8, paddingBottom: 16 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
});
