import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Analytics       from '../utils/analytics';

const SECTIONS = [
  { icon: '✅', titleKey: 'tc_acceptance_title',  bodyKey: 'tc_acceptance_body'  },
  { icon: '📱', titleKey: 'tc_use_title',         bodyKey: 'tc_use_body'         },
  { icon: '🌦️', titleKey: 'tc_weather_title',     bodyKey: 'tc_weather_body'     },
  { icon: '🌾', titleKey: 'tc_agri_title',        bodyKey: 'tc_agri_body'        },
  { icon: '🛒', titleKey: 'tc_market_title',      bodyKey: 'tc_market_body'      },
  { icon: '©️', titleKey: 'tc_ip_title',          bodyKey: 'tc_ip_body'          },
  { icon: '⚠️', titleKey: 'tc_liability_title',   bodyKey: 'tc_liability_body'   },
  { icon: '🔄', titleKey: 'tc_changes_title',     bodyKey: 'tc_changes_body'     },
  { icon: '⚖️', titleKey: 'tc_governing_title',   bodyKey: 'tc_governing_body'   },
];

export default function TermsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t }     = useLanguage();

  useEffect(() => {
    Analytics.logScreenView('TermsScreen');
    Analytics.logEvent(Analytics.Events.TERMS_VIEWED);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#4A148C" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>📜</Text>
          <Text style={styles.headerTitle}>{t('termsTitle')}</Text>
          <Text style={styles.headerSub}>{t('lastUpdated')}: 2026-01-01</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.introBox, { backgroundColor: '#F3E5F5', borderColor: '#CE93D8' }]}>
          <Text style={[styles.introText, { color: '#4A148C' }]}>{t('tc_intro')}</Text>
        </View>

        {SECTIONS.map((s) => (
          <View key={s.titleKey} style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{s.icon}</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(s.titleKey)}</Text>
            </View>
            <Text style={[styles.sectionBody, { color: theme.subtext }]}>{t(s.bodyKey)}</Text>
          </View>
        ))}

        <View style={[styles.contactBox, { backgroundColor: '#EDE7F6', borderColor: '#B39DDB' }]}>
          <Text style={styles.contactTitle}>Questions about our Terms?</Text>
          <Text style={styles.contactEmail}>legal@hanarad.app</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: '#4A148C',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn:   { width: 40, alignItems: 'flex-start' },
  backText:  { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEmoji: { fontSize: 30, marginBottom: 4 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff', textAlign: 'center' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },

  introBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  introText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  sectionIcon:   { fontSize: 24 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', flex: 1 },
  sectionBody:   { fontSize: 13, lineHeight: 21 },

  contactBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  contactTitle: { fontSize: 15, fontWeight: '800', color: '#4A148C', marginBottom: 4 },
  contactEmail: { fontSize: 14, color: '#6A1B9A', fontWeight: '600' },
});
