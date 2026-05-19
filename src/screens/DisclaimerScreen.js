import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Storage, KEYS } from '../utils/storage';
import Analytics from '../utils/analytics';

const SECTIONS = [
  {
    icon: '🌾',
    titleKey: 'disc_agri_title',
    bodyKey:  'disc_agri_body',
  },
  {
    icon: '🌦️',
    titleKey: 'disc_weather_title',
    bodyKey:  'disc_weather_body',
  },
  {
    icon: '🛒',
    titleKey: 'disc_market_title',
    bodyKey:  'disc_market_body',
  },
  {
    icon: '🔒',
    titleKey: 'disc_data_title',
    bodyKey:  'disc_data_body',
  },
];

export default function DisclaimerScreen({ navigation }) {
  const { theme }       = useTheme();
  const { t }           = useLanguage();
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await Storage.set(KEYS.DISCLAIMER_ACCEPTED, true);
    Analytics.logDisclaimerAccepted();
    setLoading(false);
    navigation.replace('Main');
  };

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (atBottom && !scrolled) setScrolled(true);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⚖️</Text>
        <Text style={styles.headerTitle}>{t('disclaimerTitle')}</Text>
        <Text style={styles.headerSub}>{t('disc_subtitle')}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        <View style={[styles.introBox, { backgroundColor: '#FFF8E1', borderColor: '#F9A825' }]}>
          <Text style={styles.introText}>{t('disc_intro')}</Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.titleKey} style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(section.titleKey)}</Text>
            </View>
            <Text style={[styles.sectionBody, { color: theme.subtext }]}>{t(section.bodyKey)}</Text>
          </View>
        ))}

        <View style={[styles.legalLinksRow]}>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={[styles.legalLink, { color: theme.primary }]}>{t('privacyPolicy')}</Text>
          </TouchableOpacity>
          <Text style={[styles.legalSep, { color: theme.subtext }]}>  |  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={[styles.legalLink, { color: theme.primary }]}>{t('termsConditions')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.lastUpdated, { color: theme.subtext }]}>
          {t('lastUpdated')}: 2026-01-01
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {!scrolled && (
          <Text style={[styles.scrollHint, { color: theme.subtext }]}>
            {t('disc_scroll_hint')}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.agreeBtn,
            { backgroundColor: scrolled ? '#2E7D32' : '#9E9E9E' },
          ]}
          onPress={handleAccept}
          disabled={!scrolled || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.agreeBtnText}>{t('agreeAndContinue')}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  header:  {
    backgroundColor: '#1B5E20',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },

  introBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  introText: { fontSize: 14, color: '#5D4037', lineHeight: 22 },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  sectionIcon:   { fontSize: 26 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', flex: 1 },
  sectionBody:   { fontSize: 13, lineHeight: 21 },

  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  legalLink:  { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  legalSep:   { fontSize: 13 },
  lastUpdated:{ textAlign: 'center', fontSize: 11, marginTop: 4 },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  scrollHint: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  agreeBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  agreeBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
