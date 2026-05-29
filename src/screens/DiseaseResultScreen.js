/**
 * DISEASE RESULT SCREEN
 * ─────────────────────────────────────────────────────────────────
 * Receives from navigation params:
 *   imageUri     — local URI of the scanned image (optional)
 *   selectedCrop — cropKey filter used in scan screen (optional)
 *   diseases     — full resolved disease list from useDiseases hook
 *   result       — pre-resolved disease object (optional, skips detection)
 *
 * If no result is passed:
 *   - Picks the first disease matching selectedCrop (or first overall)
 *   - In production: replace pickDisease() with a real AI API call
 *
 * Saves every scan to 'diseasescans' collection via saveScanApi().
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AuthStorage } from '../utils/storage';
import { saveScanApi } from '../api/diseaseApi';

// ── Pick a disease from the list (replace with real AI call) ─────────────────
function pickDisease(diseases, selectedCrop) {
  if (!diseases?.length) return null;
  const pool = selectedCrop && selectedCrop !== 'all'
    ? diseases.filter(d => d.cropKey === selectedCrop)
    : diseases;
  return pool.length > 0 ? pool[0] : diseases[0];
}

// ── Severity badge ───────────────────────────────────────────────────────────
const SEV_COLOR = {
  high:   '#EF4444',
  medium: '#F59E0B',
  low:    '#06B6D4',
};

function SeverityBadge({ severity }) {
  const color = SEV_COLOR[severity?.toLowerCase()] ?? '#6B7280';
  return (
    <View style={[badge.wrap, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[badge.text, { color }]}>
        {severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : '—'} Severity
      </Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 13, fontWeight: '800' },
});

// ── Treatment step card ───────────────────────────────────────────────────────
function StepCard({ stepNum, text, theme }) {
  return (
    <View style={[stepSt.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <View style={stepSt.bubble}>
        <Text style={stepSt.num}>{stepNum}</Text>
      </View>
      <Text style={[stepSt.text, { color: theme.text }]}>{text}</Text>
    </View>
  );
}
const stepSt = StyleSheet.create({
  card:   { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12, alignItems: 'flex-start' },
  bubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  num:    { color: '#fff', fontSize: 15, fontWeight: '900' },
  text:   { flex: 1, fontSize: 13, lineHeight: 20, marginTop: 7 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DiseaseResultScreen({ navigation, route }) {
  const insets    = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t }     = useLanguage();

  const {
    imageUri    = null,
    selectedCrop = 'all',
    diseases     = [],
    result: passedResult = null,   // pre-resolved disease (from future AI API)
  } = route?.params ?? {};

  const [activeTab,  setActiveTab]  = useState('treatment');
  const [saving,     setSaving]     = useState(false);
  const [scanSaved,  setScanSaved]  = useState(false);

  // Resolve which disease to display
  const disease = passedResult ?? pickDisease(diseases, selectedCrop);

  // Simulated confidence — replace with real AI confidence in production
  const confidence = passedResult?.confidence ?? Math.floor(Math.random() * 15) + 80;

  // Save scan to DB once on mount
  useEffect(() => {
    if (!disease) return;
    saveScan();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveScan() {
    setSaving(true);
    try {
      const user = await AuthStorage.getUser();
      if (!user?.id) return;

      await saveScanApi(user.id, {
        imageUrl:   imageUri ?? null,
        cropKey:    selectedCrop,
        detectedDisease: {
          diseaseId:  disease._id   ?? null,
          slug:       disease.slug  ?? null,
          name:       disease.name  ?? '',
          confidence,
          severity:   disease.severity ?? 'medium',
        },
      });
      setScanSaved(true);
    } catch {
      // Non-critical — scan still shows even if save fails
    } finally {
      setSaving(false);
    }
  }

  function speakResult() {
    if (!disease) return;
    Speech.stop();
    Speech.speak(
      `Disease detected: ${disease.name} on ${disease.cropKey}. Confidence: ${confidence} percent. Severity: ${disease.severity}.`,
      { language: 'en-IN', rate: 0.88 },
    );
  }

  // ── No disease found ─────────────────────────────────────────────────────
  if (!disease) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 48 }}>🦠</Text>
        <Text style={{ fontSize: 16, color: theme.text, marginTop: 12, fontWeight: '700' }}>No disease data available</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary, marginTop: 24 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#DC2626' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔬 Scan Result</Text>
          <TouchableOpacity style={styles.speakBtn} onPress={speakResult}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Result Hero */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroTop}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.cropImage} />
            ) : disease.imageUrl ? (
              <Image source={{ uri: disease.imageUrl }} style={styles.cropImage} />
            ) : (
              <View style={[styles.cropImagePlaceholder, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ fontSize: 48 }}>🦠</Text>
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={[styles.diseaseName, { color: '#DC2626' }]} numberOfLines={3}>
                {disease.name}
              </Text>
              <Text style={[styles.cropName, { color: theme.text }]}>
                Crop: {disease.cropKey}
              </Text>
              <SeverityBadge severity={disease.severity} />
            </View>
          </View>

          {/* Confidence bar */}
          <View style={styles.confRow}>
            <Text style={[styles.confLabel, { color: theme.subtext }]}>AI Confidence</Text>
            <Text style={[styles.confPct, { color: '#16A34A' }]}>{confidence}%</Text>
          </View>
          <View style={[styles.confTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.confFill, { width: `${confidence}%`, backgroundColor: '#16A34A' }]} />
          </View>

          {/* Scan save status */}
          {(saving || scanSaved) && (
            <View style={styles.saveRow}>
              {saving
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '600' }}>✅ Scan saved to history</Text>
              }
            </View>
          )}
        </View>

        {/* Medicines chips (always visible) */}
        {disease.medicines?.length > 0 && (
          <View style={[styles.medicineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionHead, { color: theme.text }]}>💊 Suggested Medicines</Text>
            <View style={styles.medicineRow}>
              {disease.medicines.map((m, i) => (
                <View key={i} style={[styles.medicineChip, { backgroundColor: theme.light }]}>
                  <Text style={[styles.medicineText, { color: theme.primary }]}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab switcher */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {[
            { key: 'treatment',  label: '💊 Treatment' },
            { key: 'symptoms',   label: '🔍 Symptoms' },
            { key: 'prevention', label: '🛡️ Prevention' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.key ? '#DC2626' : theme.subtext }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {/* Treatment tab */}
          {activeTab === 'treatment' && (
            <>
              <Text style={[styles.tabHeading, { color: theme.text }]}>Step-by-Step Treatment</Text>
              {disease.treatments?.length > 0
                ? disease.treatments.map((step, i) => (
                    <StepCard key={i} stepNum={i + 1} text={step} theme={theme} />
                  ))
                : <Text style={{ color: theme.subtext, fontSize: 14 }}>No treatment steps available.</Text>
              }
            </>
          )}

          {/* Symptoms tab */}
          {activeTab === 'symptoms' && (
            <>
              <Text style={[styles.tabHeading, { color: theme.text }]}>Symptoms</Text>
              <View style={[styles.bulletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.bulletText, { color: theme.text }]}>
                  {disease.symptoms || 'No symptom information available.'}
                </Text>
              </View>
            </>
          )}

          {/* Prevention tab */}
          {activeTab === 'prevention' && (
            <>
              <Text style={[styles.tabHeading, { color: theme.text }]}>How to Prevent</Text>
              <View style={[styles.bulletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.bulletText, { color: theme.text }]}>
                  {disease.prevention || 'No prevention information available.'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
            onPress={() => navigation.navigate('ExpertHelp')}
          >
            <Text style={styles.actionBtnText}>👨‍💼 Ask Expert</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('DiseaseScan')}
          >
            <Text style={styles.actionBtnText}>🔄 Scan Again</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#fff' },
  speakBtn:    { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  speakIcon:   { fontSize: 18 },

  heroCard:    { margin: 16, borderRadius: 20, borderWidth: 1.5, padding: 16 },
  heroTop:     { flexDirection: 'row', gap: 14, marginBottom: 14 },
  cropImage:   { width: 90, height: 90, borderRadius: 16 },
  cropImagePlaceholder: { width: 90, height: 90, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroInfo:    { flex: 1, gap: 6 },
  diseaseName: { fontSize: 18, fontWeight: '900', lineHeight: 24 },
  cropName:    { fontSize: 14, fontWeight: '600' },

  confRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confLabel: { fontSize: 12, fontWeight: '700' },
  confPct:   { fontSize: 13, fontWeight: '900' },
  confTrack: { height: 8, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  confFill:  { height: '100%', borderRadius: 4 },

  saveRow: { alignItems: 'center', marginTop: 6 },

  medicineCard:   { marginHorizontal: 16, marginBottom: 4, borderRadius: 16, borderWidth: 1, padding: 14 },
  sectionHead:    { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  medicineRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  medicineChip:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  medicineText:   { fontSize: 12, fontWeight: '600' },

  tabBar:     { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', marginBottom: 4 },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:  { borderBottomColor: '#DC2626' },
  tabText:    { fontSize: 12, fontWeight: '800' },

  tabContent: { paddingHorizontal: 16, paddingTop: 12 },
  tabHeading: { fontSize: 15, fontWeight: '900', marginBottom: 12 },

  bulletCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  bulletText: { fontSize: 14, lineHeight: 22 },

  actionRow:     { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  actionBtn:     { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
});
