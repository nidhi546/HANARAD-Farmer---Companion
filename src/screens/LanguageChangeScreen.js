import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Analytics       from '../utils/analytics';

const LANGUAGES = [
  {
    code:    'en',
    name:    'English',
    native:  'English',
    flag:    '🇬🇧',
    sample:  'Good morning, farmer! How is your crop today?',
    regions: 'All regions',
  },
  {
    code:    'hi',
    name:    'Hindi',
    native:  'हिंदी',
    flag:    '🇮🇳',
    sample:  'सुप्रभात किसान! आज आपकी फसल कैसी है?',
    regions: 'North & Central India',
  },
  {
    code:    'gu',
    name:    'Gujarati',
    native:  'ગુજરાતી',
    flag:    '🪔',
    sample:  'સુપ્રભાત ખેડૂત! આજ તમારો પાક કેવો છે?',
    regions: 'Gujarat, Saurashtra',
  },
  {
    code:    'tl',
    name:    'Filipino / Tagalog',
    native:  'Filipino',
    flag:    '🇵🇭',
    sample:  'Magandang umaga, magsasaka! Kumusta ang iyong pananim ngayon?',
    regions: 'Philippines',
  },
];

export default function LanguageChangeScreen({ navigation }) {
  const insets            = useSafeAreaInsets();
  const { theme }         = useTheme();
  const { language, changeLanguage } = useLanguage();

  function select(code) {
    changeLanguage(code);
    Analytics.logLanguageChange(code);
    Analytics.setUserProperty('preferred_language', code);
    navigation.goBack();
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.primary }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Language / ભાષા / भाषा</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSub}>Choose your preferred language</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.note, { color: theme.subtext }]}>
          The app will immediately switch to the selected language.
        </Text>

        {LANGUAGES.map(lang => {
          const isActive = language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.card,
                {
                  backgroundColor: isActive ? theme.primary + '14' : theme.card,
                  borderColor:     isActive ? theme.primary : theme.border,
                  borderWidth:     isActive ? 2 : 1.5,
                },
              ]}
              onPress={() => select(lang.code)}
              activeOpacity={0.82}
            >
              <View style={styles.cardTop}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.cardNames}>
                  <Text style={[styles.nativeName, { color: isActive ? theme.primary : theme.text }]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.engName, { color: theme.subtext }]}>{lang.name}</Text>
                </View>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.activeBadgeText}>✓ Active</Text>
                  </View>
                )}
              </View>

              <View style={[styles.sampleBox, { backgroundColor: isActive ? theme.primary + '0C' : theme.background }]}>
                <Text style={[styles.sampleText, { color: theme.subtext }]}>{lang.sample}</Text>
              </View>

              <View style={styles.regionRow}>
                <Text style={[styles.regionIcon, { color: theme.subtext }]}>📍</Text>
                <Text style={[styles.regionText, { color: theme.subtext }]}>{lang.regions}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={[styles.infoBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Text style={styles.infoTitle}>ℹ️ Note</Text>
          <Text style={styles.infoBody}>
            Some agricultural terms may not have direct translations and will remain in English.
            Voice guidance will also switch to the selected language.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  header:    { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  backBtn:   { width: 36, alignItems: 'flex-start' },
  backText:  { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#fff' },
  headerSub: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.75)', paddingBottom: 8 },

  note: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: 16, lineHeight: 19 },

  card:       { borderRadius: 20, padding: 16, marginBottom: 14 },
  cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  flag:       { fontSize: 38 },
  cardNames:  { flex: 1 },
  nativeName: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  engName:    { fontSize: 13, fontWeight: '600' },
  activeBadge:{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  activeBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  sampleBox:  { borderRadius: 12, padding: 12, marginBottom: 10 },
  sampleText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },

  regionRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regionIcon: { fontSize: 12 },
  regionText: { fontSize: 12, fontWeight: '600' },

  infoBox:   { borderRadius: 16, borderWidth: 1.5, padding: 16, marginTop: 4 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#92400E', marginBottom: 8 },
  infoBody:  { fontSize: 13, color: '#78350F', lineHeight: 20 },
});
