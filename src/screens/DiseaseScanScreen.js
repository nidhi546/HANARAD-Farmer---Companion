/**
 * DISEASE SCAN SCREEN — Symptom-based Offline Checker
 * ─────────────────────────────────────────────────────────────────
 * No API needed — uses local diseasesData.js database
 * Works 100% offline after first app install
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, Alert, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage }   from '../context/LanguageContext';
import { useTheme }      from '../context/ThemeContext';
import AppHeader         from '../components/AppHeader';
import { DISEASES }      from '../constants/diseasesData';
import { useCropMaster } from '../hooks/useCropMaster';
import Analytics         from '../utils/analytics';

const { width } = Dimensions.get('window');

// "All Crops" is always the first filter option — added in-render, not in data
const ALL_OPTION = { key: 'all', icon: '🌍', label: 'All Crops' };

// Severity badge colours
const SEV_COLOR = {
  high:   { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  medium: { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  low:    { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4' },
};

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // AI scan card
    aiScanCard:   { margin: 16, borderRadius: 18, borderWidth: 1.5, padding: 16 },
    aiScanTitle:  { fontSize: 16, fontWeight: '900', color: '#DC2626', marginBottom: 4 },
    aiScanSub:    { fontSize: 13, color: '#7F1D1D', marginBottom: 14, lineHeight: 18 },
    aiScanBtns:   { flexDirection: 'row', gap: 8 },
    aiBtn:        { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 4 },
    aiBtnIcon:    { fontSize: 20 },
    aiBtnText:    { fontSize: 11, fontWeight: '800', color: '#fff' },

    // Offline badge
    offlineBadge: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#EEF2FF', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    offlineBadgeText: { fontSize: 12, fontWeight: '600', color: '#4338CA', flex: 1 },

    // Crop picker
    sectionTitle: {
      fontSize: 13, fontWeight: '700', color: theme.subtext,
      letterSpacing: 0.8, marginHorizontal: 16, marginTop: 18, marginBottom: 10,
    },
    cropGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: 12, gap: 8,
    },
    cropBtn: {
      alignItems: 'center', justifyContent: 'center',
      width: (width - 56) / 4,
      paddingVertical: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: theme.border,
      backgroundColor: theme.card,
    },
    cropBtnActive: { borderColor: theme.primary, backgroundColor: theme.light },
    cropBtnIcon:   { fontSize: 26 },
    cropBtnLabel:  { fontSize: 11, fontWeight: '600', color: theme.subtext, marginTop: 4, textAlign: 'center' },
    cropBtnLabelActive: { color: theme.primary },

    // Result count
    resultCount: {
      fontSize: 13, color: theme.subtext, fontWeight: '600',
      marginHorizontal: 16, marginBottom: 10,
    },

    // Disease card
    diseaseCard: {
      backgroundColor: theme.card, marginHorizontal: 16,
      marginBottom: 12, borderRadius: 16,
      borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
    },
    diseaseHeader: {
      flexDirection: 'row', alignItems: 'center', padding: 14,
    },
    diseaseIconBox: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: theme.light,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    diseaseEmoji: { fontSize: 22 },
    diseaseInfo:  { flex: 1 },
    diseaseName:  { fontSize: 15, fontWeight: '800', color: theme.text },
    diseaseCrop:  { fontSize: 11, color: theme.subtext, marginTop: 2 },
    severityBadge: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    severityDot:  { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
    severityText: { fontSize: 11, fontWeight: '700' },

    // Expandable content
    expandBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.border,
    },
    expandBtnText: { fontSize: 12, fontWeight: '700', color: theme.primary, marginRight: 4 },

    diseaseDetail: { paddingHorizontal: 14, paddingBottom: 14 },
    detailSection: { marginBottom: 12 },
    detailTitle:   { fontSize: 12, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, marginBottom: 6 },
    symptomText:   { fontSize: 13, color: theme.text, lineHeight: 20 },
    treatmentRow:  { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
    treatmentBullet:{ fontSize: 13, color: theme.primary, marginRight: 8, marginTop: 1 },
    treatmentText: { flex: 1, fontSize: 13, color: theme.text, lineHeight: 20 },

    // Medicine chips
    medicineRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    medicineChip: {
      backgroundColor: theme.light, borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    medicineText: { fontSize: 11, fontWeight: '600', color: theme.primary },

    // Prevention
    preventionText: { fontSize: 13, color: theme.text, lineHeight: 20 },

    bottomPad: { height: 32 },
  });
}

// ── Expandable Disease Card ──────────────────────────────────────────────
function DiseaseCard({ disease, styles, theme, language }) {
  const [open, setOpen] = useState(false);

  const sev    = SEV_COLOR[disease.severity] || SEV_COLOR.low;
  const name   = language === 'gu' ? (disease.nameGu || disease.name)
               : language === 'hi' ? (disease.nameHi || disease.name)
               : disease.name;
  const symptoms = language === 'gu' ? (disease.symptomsGu || disease.symptoms)
                 : language === 'hi' ? (disease.symptomsHi || disease.symptoms)
                 : disease.symptoms;
  const treatments = language === 'gu' ? (disease.treatmentsGu || disease.treatments)
                   : disease.treatments;

  return (
    <View style={styles.diseaseCard}>
      <View style={styles.diseaseHeader}>
        <View style={styles.diseaseIconBox}>
          <Text style={styles.diseaseEmoji}>🦠</Text>
        </View>
        <View style={styles.diseaseInfo}>
          <Text style={styles.diseaseName} numberOfLines={2}>{name}</Text>
          <Text style={styles.diseaseCrop}>🌱 {disease.crop}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
          <View style={[styles.severityDot, { backgroundColor: sev.dot }]} />
          <Text style={[styles.severityText, { color: sev.text }]}>
            {disease.severity}
          </Text>
        </View>
      </View>

      {/* Expand / Collapse */}
      <TouchableOpacity style={styles.expandBtn} onPress={() => setOpen(v => !v)}>
        <Text style={styles.expandBtnText}>{open ? 'Hide Details ▲' : 'See Details ▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.diseaseDetail}>
          {/* Symptoms */}
          <View style={styles.detailSection}>
            <Text style={styles.detailTitle}>SYMPTOMS</Text>
            <Text style={styles.symptomText}>{symptoms}</Text>
          </View>

          {/* Treatments */}
          {treatments && treatments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>TREATMENT</Text>
              {treatments.slice(0, 4).map((tr, i) => (
                <View key={i} style={styles.treatmentRow}>
                  <Text style={styles.treatmentBullet}>•</Text>
                  <Text style={styles.treatmentText}>{tr}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Medicines */}
          {disease.medicines && disease.medicines.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>MEDICINES</Text>
              <View style={styles.medicineRow}>
                {disease.medicines.map((m, i) => (
                  <View key={i} style={styles.medicineChip}>
                    <Text style={styles.medicineText}>💊 {m}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Prevention */}
          {disease.prevention && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>PREVENTION</Text>
              <Text style={styles.preventionText}>{disease.prevention}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Component ──────────────────────────────────────────────────────
export default function DiseaseScanScreen({ navigation }) {
  const { language } = useLanguage();
  const { theme }    = useTheme();
  const styles       = useMemo(() => makeStyles(theme), [theme]);

  const { crops: cropList } = useCropMaster();

  const [selectedCrop, setSelectedCrop] = useState('all');
  const [capturedImage, setCapturedImage] = useState(null);

  async function openCamera() {
    Analytics.logCropScanStarted('camera');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to scan disease.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets?.length > 0) {
      setCapturedImage(result.assets[0].uri);
      navigation.navigate('DiseaseResult', { imageUri: result.assets[0].uri });
    }
  }

  async function openGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to upload a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets?.length > 0) {
      setCapturedImage(result.assets[0].uri);
      navigation.navigate('DiseaseResult', { imageUri: result.assets[0].uri });
    }
  }

  const filtered = useMemo(() => {
    if (selectedCrop === 'all') return DISEASES;
    return DISEASES.filter(d => d.crop === selectedCrop);
  }, [selectedCrop]);

  const sevOrder = { high: 0, medium: 1, low: 2 };
  const sorted   = [...filtered].sort((a, b) =>
    (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3)
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeader title="Disease Scanner" subtitle="Symptom Identifier" />

      {/* AI Photo Scan section */}
      <View style={[styles.aiScanCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
        <Text style={styles.aiScanTitle}>📸 AI Photo Disease Scan</Text>
        <Text style={styles.aiScanSub}>Take or upload a leaf/crop photo for instant AI diagnosis</Text>
        <View style={styles.aiScanBtns}>
          <TouchableOpacity style={[styles.aiBtn, { backgroundColor: '#DC2626' }]} onPress={openCamera}>
            <Text style={styles.aiBtnIcon}>📷</Text>
            <Text style={styles.aiBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.aiBtn, { backgroundColor: '#7C3AED' }]} onPress={openGallery}>
            <Text style={styles.aiBtnIcon}>🖼️</Text>
            <Text style={styles.aiBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.aiBtn, { backgroundColor: '#059669' }]} onPress={() => navigation.navigate('DiseaseResult', {})}>
            <Text style={styles.aiBtnIcon}>🔬</Text>
            <Text style={styles.aiBtnText}>Demo Result</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline badge */}
      <View style={styles.offlineBadge}>
        <Text style={styles.offlineBadgeText}>
          📴 Works offline — no internet or API key needed
        </Text>
      </View>

      {/* Crop selector */}
      <Text style={styles.sectionTitle}>SELECT CROP</Text>
      <View style={styles.cropGrid}>
        {[ALL_OPTION, ...cropList.map(c => ({ key: c.name.toLowerCase(), icon: c.icon || '🌱', label: c.name }))].map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.cropBtn, selectedCrop === c.key && styles.cropBtnActive]}
            onPress={() => setSelectedCrop(c.key)}
          >
            <Text style={styles.cropBtnIcon}>{c.icon}</Text>
            <Text style={[styles.cropBtnLabel, selectedCrop === c.key && styles.cropBtnLabelActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result count */}
      <Text style={[styles.sectionTitle, { marginBottom: 2 }]}>DISEASES FOUND</Text>
      <Text style={styles.resultCount}>
        {sorted.length} disease{sorted.length !== 1 ? 's' : ''} — tap any card to see treatment
      </Text>

      {/* Disease cards */}
      {sorted.map(d => (
        <DiseaseCard
          key={d.id}
          disease={d}
          styles={styles}
          theme={theme}
          language={language}
        />
      ))}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
