import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import * as Speech from 'expo-speech';

// Mock AI results keyed by crop/disease index — in production, replace with real API response
const MOCK_RESULTS = [
  {
    disease:    'Leaf Blight',
    crop:       'Wheat',
    confidence: 94,
    severity:   'High',
    severityColor: '#EF4444',
    description: 'Helminthosporium leaf blight is a fungal disease caused by Bipolaris sorokiniana. It appears as oval to elliptical brown spots with light brown centers and dark borders.',
    causes: [
      'High humidity above 85%',
      'Temperature between 20–30°C',
      'Poor field drainage',
      'Dense crop canopy',
    ],
    treatment: [
      { step: '1', action: 'Remove infected leaves', detail: 'Collect and burn all infected plant material immediately to prevent spread.' },
      { step: '2', action: 'Apply fungicide', detail: 'Spray Mancozeb 75% WP @ 2g/litre or Propiconazole 25% EC @ 1ml/litre.' },
      { step: '3', action: 'Improve drainage', detail: 'Create drainage channels to reduce waterlogging in the field.' },
      { step: '4', action: 'Repeat spray', detail: 'Apply a second spray after 10–14 days if infection persists.' },
    ],
    prevention: [
      'Use disease-resistant wheat varieties',
      'Maintain proper plant spacing',
      'Avoid overhead irrigation',
      'Balanced fertilizer application',
    ],
    nearbyStores: ['Krishi Seva Kendra - 1.2 km', 'Agro Point - 2.8 km'],
    icon: '🌾',
  },
];

function SeverityBadge({ severity, color }) {
  return (
    <View style={[badge.wrap, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[badge.text, { color }]}>{severity} Severity</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 13, fontWeight: '800' },
});

function StepCard({ step, action, detail, theme }) {
  return (
    <View style={[stepStyles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <View style={stepStyles.stepBubble}>
        <Text style={stepStyles.stepNum}>{step}</Text>
      </View>
      <View style={stepStyles.stepBody}>
        <Text style={[stepStyles.action, { color: theme.text }]}>{action}</Text>
        <Text style={[stepStyles.detail, { color: theme.subtext }]}>{detail}</Text>
      </View>
    </View>
  );
}
const stepStyles = StyleSheet.create({
  card:       { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12 },
  stepBubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum:    { color: '#fff', fontSize: 15, fontWeight: '900' },
  stepBody:   { flex: 1 },
  action:     { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  detail:     { fontSize: 13, lineHeight: 19 },
});

export default function DiseaseResultScreen({ navigation, route }) {
  const insets    = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t }     = useLanguage();

  const [activeTab, setActiveTab] = useState('treatment');

  // In production, receive result from route.params.result
  const result = route?.params?.result ?? MOCK_RESULTS[0];
  const imageUri = route?.params?.imageUri ?? null;

  function speakResult() {
    Speech.stop();
    Speech.speak(
      `Disease detected: ${result.disease} on ${result.crop}. Confidence: ${result.confidence} percent. Severity: ${result.severity}. ${result.description}`,
      { language: 'en-IN', rate: 0.88 },
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
            ) : (
              <View style={[styles.cropImagePlaceholder, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ fontSize: 48 }}>{result.icon}</Text>
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={[styles.diseaseName, { color: '#DC2626' }]}>{result.disease}</Text>
              <Text style={[styles.cropName, { color: theme.text }]}>Crop: {result.crop}</Text>
              <SeverityBadge severity={result.severity} color={result.severityColor} />
            </View>
          </View>

          {/* Confidence bar */}
          <View style={styles.confRow}>
            <Text style={[styles.confLabel, { color: theme.subtext }]}>AI Confidence</Text>
            <Text style={[styles.confPct, { color: '#16A34A' }]}>{result.confidence}%</Text>
          </View>
          <View style={[styles.confTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.confFill, { width: `${result.confidence}%`, backgroundColor: '#16A34A' }]} />
          </View>

          <Text style={[styles.descText, { color: theme.subtext }]}>{result.description}</Text>
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {[
            { key: 'treatment',  label: '💊 Treatment' },
            { key: 'causes',     label: '⚠️ Causes' },
            { key: 'prevention', label: '🛡️ Prevention' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && [styles.tabActive, { borderBottomColor: '#DC2626' }]]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.key ? '#DC2626' : theme.subtext }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'treatment' && (
            <>
              <Text style={[styles.tabHeading, { color: theme.text }]}>Step-by-Step Treatment</Text>
              {result.treatment.map((s, i) => (
                <StepCard key={i} {...s} theme={theme} />
              ))}
            </>
          )}

          {activeTab === 'causes' && (
            <>
              <Text style={[styles.tabHeading, { color: theme.text }]}>Root Causes</Text>
              {result.causes.map((c, i) => (
                <View key={i} style={[styles.bulletRow, { borderColor: theme.border }]}>
                  <Text style={styles.bullet}>⚠️</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>{c}</Text>
                </View>
              ))}
            </>
          )}

          {activeTab === 'prevention' && (
            <>
              <Text style={[styles.tabHeading, { color: theme.text }]}>How to Prevent</Text>
              {result.prevention.map((p, i) => (
                <View key={i} style={[styles.bulletRow, { borderColor: theme.border }]}>
                  <Text style={styles.bullet}>✅</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>{p}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Nearby stores */}
        <View style={[styles.storeCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Text style={styles.storeTitle}>🏪 Nearby Agrochemical Stores</Text>
          {result.nearbyStores.map((s, i) => (
            <View key={i} style={styles.storeRow}>
              <Text style={styles.storeIcon}>📍</Text>
              <Text style={styles.storeText}>{s}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.storeBtn}
            onPress={() => navigation.navigate('NearbyStores')}
          >
            <Text style={styles.storeBtnText}>Find More Stores →</Text>
          </TouchableOpacity>
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

  header:    { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn:   { width: 36, alignItems: 'flex-start' },
  backText:  { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#fff' },
  speakBtn:  { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  speakIcon: { fontSize: 18 },

  heroCard: { margin: 16, borderRadius: 20, borderWidth: 1.5, padding: 16 },
  heroTop:  { flexDirection: 'row', gap: 14, marginBottom: 14 },
  cropImage: { width: 90, height: 90, borderRadius: 16 },
  cropImagePlaceholder: { width: 90, height: 90, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1, gap: 6 },
  diseaseName: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  cropName:    { fontSize: 14, fontWeight: '600' },

  confRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confLabel:{ fontSize: 12, fontWeight: '700' },
  confPct:  { fontSize: 13, fontWeight: '900' },
  confTrack:{ height: 8, borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 4 },
  descText: { fontSize: 13, lineHeight: 20 },

  tabBar:     { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', marginBottom: 4 },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:  {},
  tabText:    { fontSize: 12, fontWeight: '800' },

  tabContent: { paddingHorizontal: 16, paddingTop: 12 },
  tabHeading: { fontSize: 15, fontWeight: '900', marginBottom: 12 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  bullet:    { fontSize: 16, marginTop: 1 },
  bulletText:{ flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },

  storeCard:  { margin: 16, borderRadius: 18, borderWidth: 1.5, padding: 14 },
  storeTitle: { fontSize: 15, fontWeight: '900', color: '#1E40AF', marginBottom: 10 },
  storeRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  storeIcon:  { fontSize: 14 },
  storeText:  { fontSize: 13, color: '#1E40AF', fontWeight: '600' },
  storeBtn:   { marginTop: 8, alignSelf: 'flex-start' },
  storeBtnText: { fontSize: 13, fontWeight: '800', color: '#1E40AF' },

  actionRow:  { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 4 },
  actionBtn:  { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
});
