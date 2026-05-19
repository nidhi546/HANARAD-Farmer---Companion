import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }        from '../context/ThemeContext';
import { useLanguage }     from '../context/LanguageContext';
import { useAuth }         from '../context/AuthContext';
import { Storage, KEYS }  from '../utils/storage';
import { useCropMaster }  from '../hooks/useCropMaster';
import { saveFarmApi }    from '../api/farmApi';
import * as Speech from 'expo-speech';

// ── Unit conversion factors from sq metres ───────────────────────────────────
const TO_SQFT    = 10.7639;
const TO_ACRES   = 0.000247105;
const TO_HECTARE = 0.0001;
const TO_BIGHA   = 1 / 1011.7;
const TO_VIGHA   = 1 / 2023.4;

function formatArea(sqm) {
  return {
    sqFt:     (sqm * TO_SQFT).toFixed(0),
    acres:    (sqm * TO_ACRES).toFixed(3),
    hectares: (sqm * TO_HECTARE).toFixed(4),
    bigha:    (sqm * TO_BIGHA).toFixed(2),
    vigha:    (sqm * TO_VIGHA).toFixed(2),
    sqm:      sqm.toFixed(1),
  };
}

function UnitCard({ label, value, unit, highlight, theme }) {
  return (
    <View style={[
      unitStyles.card,
      {
        backgroundColor: highlight ? theme.primary + '14' : theme.card,
        borderColor:     highlight ? theme.primary : theme.border,
        borderWidth:     highlight ? 2 : 1.5,
      },
    ]}>
      <Text style={[unitStyles.value, { color: highlight ? theme.primary : theme.text }]}>{value}</Text>
      <Text style={[unitStyles.unit,  { color: theme.subtext }]}>{unit}</Text>
      <Text style={[unitStyles.label, { color: theme.subtext }]}>{label}</Text>
    </View>
  );
}
const unitStyles = StyleSheet.create({
  card:  { flex: 1, minWidth: '45%', borderRadius: 16, padding: 14, alignItems: 'center', marginBottom: 10 },
  value: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  unit:  { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

export default function FarmResultScreen({ navigation, route }) {
  const insets      = useSafeAreaInsets();
  const { theme }   = useTheme();
  const { t }       = useLanguage();
  const { user }    = useAuth();
  const { crops: cropList } = useCropMaster();

  const {
    areaSqm          = 2430,
    perimeterM       = 197,
    method           = 'manual',
    coords           = [],
    warningDetected  = false,
    warningTypes     = [],
  } = route?.params ?? {};

  const area = formatArea(areaSqm);

  const [farmName, setFarmName] = useState('');
  const [village,  setVillage]  = useState('');
  const [crop,     setCrop]     = useState('');
  const [saving,   setSaving]   = useState(false);

  function speakResult() {
    Speech.stop();
    Speech.speak(
      `Farm area measured. ${area.acres} acres, ${area.bigha} bigha, ${area.sqFt} square feet. Perimeter is ${(perimeterM * 3.281).toFixed(0)} feet.`,
      { language: 'en-IN', rate: 0.88 },
    );
  }

  async function saveFarm() {
    if (!farmName.trim()) {
      Alert.alert('', 'Please enter a farm name');
      return;
    }
    if (coords.length < 3) {
      Alert.alert('', 'Not enough boundary points to save this farm');
      return;
    }

    setSaving(true);

    // Build the payload once — reused for both the API call and the local cache
    const farmPayload = {
      farmName:           farmName.trim(),
      village:            village.trim(),
      primaryCrop:        crop,
      polygonCoordinates: coords,
      areaSqm,
      areaAcres:    parseFloat(area.acres),
      areaBigha:    parseFloat(area.bigha),
      areaHectares: parseFloat(area.hectares),
      areaVigha:    parseFloat(area.vigha),
      areaSqFt:     parseFloat(area.sqFt),
      perimeterM,
      method,
      warningDetected,
      warningTypes,
    };

    try {
      // ── PRIMARY: save to database via submitData API ─────────────────────
      let savedFarmId = null;
      if (user?.id) {
        const result  = await saveFarmApi(user.id, farmPayload);
        savedFarmId   = result?.farmId ?? null;
      }

      // ── SECONDARY: update AsyncStorage cache (always, even after API success)
      const cacheEntry = {
        id:             savedFarmId ?? `local_${Date.now()}`,
        name:           farmPayload.farmName,
        village:        farmPayload.village,
        crop:           farmPayload.primaryCrop,
        areaSqm,
        perimeterM,
        method,
        coords,
        warningDetected,
        warningTypes,
        savedAt:        new Date().toISOString(),
        area:           { ...area, perimeterM: perimeterM.toFixed(0) },
      };
      const existing = (await Storage.get(KEYS.SAVED_FARMS)) ?? [];
      await Storage.set(KEYS.SAVED_FARMS, [cacheEntry, ...existing]);

      Alert.alert(
        '✅ Farm Saved!',
        `"${farmPayload.farmName}" saved successfully${user?.id ? ' to your account' : ' on this device'}.`,
        [
          { text: 'View My Farms', onPress: () => navigation.navigate('Main') },
          { text: 'Map Again',     onPress: () => navigation.navigate('FarmMap') },
        ],
      );
    } catch (err) {
      // API failed — offer offline fallback so work is never lost
      Alert.alert(
        'Could Not Save Online',
        err.message || 'The farm could not be saved to your account. Save it locally instead?',
        [
          {
            text: 'Save on Device',
            onPress: async () => {
              try {
                const offlineEntry = {
                  id:             `local_${Date.now()}`,
                  name:           farmPayload.farmName,
                  village:        farmPayload.village,
                  crop:           farmPayload.primaryCrop,
                  areaSqm,
                  perimeterM,
                  method,
                  coords,
                  warningDetected,
                  warningTypes,
                  savedAt:        new Date().toISOString(),
                  area:           { ...area, perimeterM: perimeterM.toFixed(0) },
                };
                const existing = (await Storage.get(KEYS.SAVED_FARMS)) ?? [];
                await Storage.set(KEYS.SAVED_FARMS, [offlineEntry, ...existing]);
                navigation.navigate('Main');
              } catch {
                Alert.alert('Error', 'Could not save farm. Please try again.');
              }
            },
          },
          { text: 'Try Again', style: 'cancel' },
        ],
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#059669' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Farm Measurement</Text>
            <Text style={styles.headerSub}>
              {method === 'walk' ? '🚶 GPS Walk' : '✏️ Manual Draw'} · {new Date().toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.speakBtn} onPress={speakResult}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Warning banner ── */}
        {warningDetected && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>Non-Agricultural Area Detected</Text>
              <Text style={styles.warningBody}>
                This area appears to contain{' '}
                <Text style={styles.warningBold}>
                  {warningTypes.length
                    ? warningTypes.join(', ')
                    : 'non-agricultural structures'}
                </Text>
                . Verify this is your farmland before saving.
              </Text>
            </View>
          </View>
        )}

        {/* ── Hero area display ── */}
        <View style={[styles.heroCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <Text style={styles.heroEmoji}>🌾</Text>
          <Text style={styles.heroAcres}>{area.acres}</Text>
          <Text style={styles.heroUnit}>ACRES</Text>
          <Text style={[styles.heroBigha, { color: '#059669' }]}>{area.bigha} Bigha · {area.vigha} Vigha</Text>
        </View>

        {/* ── All units grid ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>All Measurements</Text>
        <View style={styles.unitGrid}>
          <UnitCard label="Square Feet"   value={Number(area.sqFt).toLocaleString()}    unit="sq ft"    highlight theme={theme} />
          <UnitCard label="Square Metres" value={Number(area.sqm).toLocaleString()}      unit="m²"       theme={theme} />
          <UnitCard label="Acres"         value={area.acres}                             unit="acres"    highlight theme={theme} />
          <UnitCard label="Hectares"      value={area.hectares}                          unit="ha"       theme={theme} />
          <UnitCard label="Bigha"         value={area.bigha}                             unit="bigha"    highlight theme={theme} />
          <UnitCard label="Vigha"         value={area.vigha}                             unit="vigha"    theme={theme} />
        </View>

        {/* ── Perimeter ── */}
        <View style={[styles.perimCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.perimTitle, { color: theme.text }]}>📏 Perimeter</Text>
          <View style={styles.perimRow}>
            <View style={styles.perimItem}>
              <Text style={[styles.perimVal, { color: theme.primary }]}>{perimeterM.toFixed(0)}</Text>
              <Text style={[styles.perimUnit, { color: theme.subtext }]}>metres</Text>
            </View>
            <View style={[styles.perimDivider, { backgroundColor: theme.border }]} />
            <View style={styles.perimItem}>
              <Text style={[styles.perimVal, { color: theme.primary }]}>{(perimeterM * 3.281).toFixed(0)}</Text>
              <Text style={[styles.perimUnit, { color: theme.subtext }]}>feet</Text>
            </View>
          </View>
        </View>

        {/* ── Save form ── */}
        <View style={[styles.saveCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.saveTitle, { color: theme.text }]}>💾 Save This Farm</Text>

          <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Farm Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
            placeholder="e.g. North Field, Mango Orchard"
            placeholderTextColor={theme.subtext}
            value={farmName}
            onChangeText={setFarmName}
          />

          <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Village / Location</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
            placeholder="e.g. Anand, Rajkot"
            placeholderTextColor={theme.subtext}
            value={village}
            onChangeText={setVillage}
          />

          <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Primary Crop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropRow}>
            {cropList.map(c => (
              <TouchableOpacity
                key={c.cropId}
                style={[
                  styles.cropChip,
                  {
                    backgroundColor: crop === c.name ? theme.primary + '18' : theme.background,
                    borderColor:     crop === c.name ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setCrop(c.name)}
              >
                <Text style={[styles.cropChipText, { color: crop === c.name ? theme.primary : theme.subtext }]}>
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Points count — disabled while < 4 */}
          {coords.length < 4 && (
            <Text style={[styles.pointsHint, { color: '#F59E0B' }]}>
              ⚠ Mark {4 - coords.length} more corner{4 - coords.length === 1 ? '' : 's'} for a precise boundary
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? theme.subtext : '#059669' }]}
            onPress={saveFarm}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '⏳ Saving…' : '✅ Save Farm'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Action links ── */}
        <View style={styles.linkRow}>
          <TouchableOpacity style={[styles.linkBtn, { borderColor: theme.border }]} onPress={() => navigation.navigate('FarmMap')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>📍 Map Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkBtn, { borderColor: theme.border }]} onPress={() => navigation.navigate('ExpertHelp')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>👨‍💼 Ask Expert</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 24 },

  header:       { paddingBottom: 16 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn:      { width: 36, alignItems: 'flex-start' },
  backText:     { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  speakBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  speakIcon:    { fontSize: 18 },

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    margin: 16, borderRadius: 16,
    backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#F59E0B',
    padding: 14, gap: 10,
  },
  warningIcon:  { fontSize: 22, marginTop: 1 },
  warningText:  { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  warningBody:  { fontSize: 13, color: '#78350F', lineHeight: 18 },
  warningBold:  { fontWeight: '800' },

  heroCard:  { margin: 16, borderRadius: 24, borderWidth: 1.5, paddingVertical: 28, alignItems: 'center' },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroAcres: { fontSize: 64, fontWeight: '900', color: '#059669', lineHeight: 68 },
  heroUnit:  { fontSize: 18, fontWeight: '900', color: '#065F46', letterSpacing: 4, marginBottom: 8 },
  heroBigha: { fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 15, fontWeight: '900', paddingHorizontal: 16, marginBottom: 10 },
  unitGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 8 },

  perimCard:    { marginHorizontal: 16, borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 16 },
  perimTitle:   { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  perimRow:     { flexDirection: 'row', alignItems: 'center' },
  perimItem:    { flex: 1, alignItems: 'center' },
  perimVal:     { fontSize: 28, fontWeight: '900' },
  perimUnit:    { fontSize: 12, fontWeight: '700', marginTop: 2 },
  perimDivider: { width: 1, height: 40, marginHorizontal: 16 },

  saveCard:    { marginHorizontal: 16, borderRadius: 20, borderWidth: 1.5, padding: 16, marginBottom: 16 },
  saveTitle:   { fontSize: 16, fontWeight: '900', marginBottom: 14 },
  fieldLabel:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input:       { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  cropRow:     { gap: 8, paddingVertical: 4, marginBottom: 4 },
  cropChip:    { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  cropChipText:{ fontSize: 13, fontWeight: '700' },
  pointsHint:  { fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  saveBtn:     { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },

  linkRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  linkBtn:   { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  linkText:  { fontSize: 14, fontWeight: '700' },
});
