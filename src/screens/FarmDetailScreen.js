import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
import { useTheme }    from '../context/ThemeContext';
import { Storage, KEYS } from '../utils/storage';
import MapTypeSelector from '../components/MapTypeSelector';
import * as Speech from 'expo-speech';

function InfoRow({ icon, label, value, theme }) {
  return (
    <View style={[rowStyles.row, { borderColor: theme.border }]}>
      <Text style={rowStyles.icon}>{icon}</Text>
      <Text style={[rowStyles.label, { color: theme.subtext }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  icon:  { fontSize: 20, width: 28 },
  label: { flex: 1, fontSize: 13, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '800', textAlign: 'right', maxWidth: '55%' },
});

function UnitPill({ label, value, color }) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: color + '18', borderColor: color }]}>
      <Text style={[pillStyles.val, { color }]}>{value}</Text>
      <Text style={[pillStyles.lbl, { color }]}>{label}</Text>
    </View>
  );
}
const pillStyles = StyleSheet.create({
  pill: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80 },
  val:  { fontSize: 16, fontWeight: '900' },
  lbl:  { fontSize: 11, fontWeight: '700', marginTop: 2 },
});

export default function FarmDetailScreen({ navigation, route }) {
  const insets    = useSafeAreaInsets();
  const { theme } = useTheme();
  const mapRef    = useRef(null);
  const [mapType, setMapType] = useState('standard');

  const farm = route?.params?.farm;

  if (!farm) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Farm not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coords   = farm.coords ?? [];
  const hasMap   = coords.length >= 3;
  const area     = farm.area ?? {};
  const savedDate = farm.savedAt ? new Date(farm.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown';

  const mapRegion = hasMap ? {
    latitude:      coords.reduce((s, c) => s + c.latitude,  0) / coords.length,
    longitude:     coords.reduce((s, c) => s + c.longitude, 0) / coords.length,
    latitudeDelta:  0.005,
    longitudeDelta: 0.005,
  } : null;

  function speakFarm() {
    Speech.stop();
    Speech.speak(
      `Farm: ${farm.name}. Location: ${farm.village || 'unknown'}. Crop: ${farm.crop || 'not set'}. Area: ${area.acres} acres, ${area.bigha} bigha.`,
      { language: 'en-IN', rate: 0.88 },
    );
  }

  async function deleteFarm() {
    Alert.alert(
      'Delete Farm',
      `Delete "${farm.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const all = (await Storage.get(KEYS.SAVED_FARMS)) ?? [];
            await Storage.set(KEYS.SAVED_FARMS, all.filter(f => f.id !== farm.id));
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#059669' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{farm.name}</Text>
            <Text style={styles.headerSub}>
              {farm.method === 'walk' ? '🚶 GPS Walk' : '✏️ Manual Draw'} · {savedDate}
            </Text>
          </View>
          <TouchableOpacity style={styles.speakBtn} onPress={speakFarm}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map preview */}
        {hasMap ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.mapPreview}
              provider={PROVIDER}
              initialRegion={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              mapType={mapType}
            >
              <Polygon
                coordinates={coords}
                fillColor="rgba(5,150,105,0.22)"
                strokeColor="#059669"
                strokeWidth={2.5}
              />
              {coords[0]?.latitude != null && (
                <Marker coordinate={coords[0]}>
                  <View style={styles.markerDot} />
                </Marker>
              )}
            </MapView>
            <MapTypeSelector
              mapType={mapType}
              onMapTypeChange={setMapType}
              mapRef={mapRef}
              style={{ top: 8 }}
            />
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => navigation.navigate('ManualDraw', { viewFarm: farm })}
            >
              <Text style={styles.expandBtnText}>⛶ Full Map</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.noMapBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.noMapIcon}>🗺️</Text>
            <Text style={[styles.noMapText, { color: theme.subtext }]}>No map data saved</Text>
          </View>
        )}

        {/* Area pills */}
        <View style={[styles.areaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.areaHeading, { color: theme.text }]}>📐 Farm Area</Text>
          <View style={styles.pillRow}>
            <UnitPill label="Acres"  value={area.acres  ?? '—'} color="#059669" />
            <UnitPill label="Bigha"  value={area.bigha  ?? '—'} color="#0284C7" />
            <UnitPill label="Sq Ft"  value={area.sqFt ? Number(area.sqFt).toLocaleString() : '—'} color="#7C3AED" />
          </View>
          <View style={[styles.pillRow, { marginTop: 10 }]}>
            <UnitPill label="Hectares" value={area.hectares ?? '—'} color="#D97706" />
            <UnitPill label="Vigha"    value={area.vigha    ?? '—'} color="#DC2626" />
            <UnitPill label="m²"       value={area.sqm ? Number(area.sqm).toLocaleString() : '—'} color="#6B7280" />
          </View>
        </View>

        {/* Farm info rows */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <InfoRow icon="🌾" label="Primary Crop" value={farm.crop || 'Not specified'} theme={theme} />
          <InfoRow icon="📍" label="Village / Location" value={farm.village || 'Not specified'} theme={theme} />
          <InfoRow icon="📏" label="Perimeter" value={farm.perimeterM ? `${farm.perimeterM.toFixed(0)} m · ${(farm.perimeterM * 3.281).toFixed(0)} ft` : '—'} theme={theme} />
          <InfoRow icon="📌" label="GPS Points" value={coords.length > 0 ? `${coords.length} points` : '—'} theme={theme} />
          <InfoRow icon="🗓️" label="Date Saved" value={savedDate} theme={theme} />
          <InfoRow icon="🔧" label="Method" value={farm.method === 'walk' ? 'GPS Walk' : 'Manual Draw'} theme={theme} />
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('FarmMap')}
          >
            <Text style={styles.actionBtnText}>📍 Re-Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
            onPress={() => navigation.navigate('Irrigation')}
          >
            <Text style={styles.actionBtnText}>💧 Irrigation</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.deleteBtn, { borderColor: '#FCA5A5' }]} onPress={deleteFarm}>
          <Text style={styles.deleteBtnText}>🗑️ Delete This Farm</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header:      { paddingBottom: 16 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backText:    { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  speakBtn:    { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  speakIcon:   { fontSize: 18 },

  mapContainer:  { height: 220, margin: 16, borderRadius: 18, overflow: 'hidden' },
  mapPreview:    { flex: 1 },
  expandBtn:     { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  expandBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  markerDot:     { width: 14, height: 14, borderRadius: 7, backgroundColor: '#DC2626', borderWidth: 2, borderColor: '#fff' },

  noMapBox:  { margin: 16, height: 100, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 8 },
  noMapIcon: { fontSize: 32 },
  noMapText: { fontSize: 14, fontWeight: '600' },

  areaCard:    { marginHorizontal: 16, borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  areaHeading: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  pillRow:     { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },

  infoCard:  { marginHorizontal: 16, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 16, marginBottom: 16 },

  actionRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  actionBtn:  { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },

  deleteBtn:     { marginHorizontal: 16, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FEF2F2' },
  deleteBtnText: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
});
