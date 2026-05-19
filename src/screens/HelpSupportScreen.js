import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // Hero banner
    heroBanner: {
      backgroundColor: theme.primary,
      marginHorizontal: 16, marginTop: 16, borderRadius: 20,
      padding: 20, alignItems: 'center',
    },
    heroEmoji: { fontSize: 48, marginBottom: 8 },
    heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
    heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },

    // Section
    sectionTitle: {
      fontSize: 13, fontWeight: '700', color: theme.subtext,
      letterSpacing: 0.8, marginHorizontal: 16, marginTop: 24, marginBottom: 10,
    },

    // FAQ accordion
    faqItem: {
      backgroundColor: theme.card, borderRadius: 14, marginHorizontal: 16,
      marginBottom: 8, overflow: 'hidden',
      borderWidth: 1, borderColor: theme.border,
    },
    faqHeader: {
      flexDirection: 'row', alignItems: 'center',
      padding: 14,
    },
    faqIcon:     { fontSize: 18, width: 28, textAlign: 'center' },
    faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.text, marginLeft: 10 },
    faqChevron:  { fontSize: 18, color: theme.subtext },
    faqAnswer: {
      paddingHorizontal: 52, paddingBottom: 14,
      fontSize: 13, color: theme.subtext, lineHeight: 20,
    },

    // Contact cards
    contactGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: 16, gap: 10, marginBottom: 8,
    },
    contactCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: theme.card, borderRadius: 14,
      padding: 16, alignItems: 'center',
      borderWidth: 1, borderColor: theme.border,
    },
    contactEmoji: { fontSize: 30, marginBottom: 8 },
    contactLabel: { fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' },
    contactValue: { fontSize: 11, color: theme.subtext, marginTop: 4, textAlign: 'center' },

    // Info card
    infoCard: {
      backgroundColor: theme.card, marginHorizontal: 16, borderRadius: 14,
      padding: 16, marginBottom: 8, borderWidth: 1, borderColor: theme.border,
    },
    infoRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    infoKey:   { fontSize: 13, color: theme.subtext },
    infoValue: { fontSize: 13, fontWeight: '600', color: theme.text },

    // Tips list
    tipRow: {
      flexDirection: 'row', backgroundColor: theme.card,
      borderRadius: 12, marginHorizontal: 16, marginBottom: 8,
      padding: 14, alignItems: 'flex-start',
      borderWidth: 1, borderColor: theme.border,
    },
    tipBullet: { fontSize: 16, marginRight: 10, marginTop: 1 },
    tipText:   { flex: 1, fontSize: 13, color: theme.text, lineHeight: 20 },

    bottomPad: { height: 32 },
  });
}

// ── FAQ data ────────────────────────────────────────────────────────────────
function getFaqItems(t) {
  return [
    { icon: '🌤️', q: t('faqQ1'), a: t('faqA1') },
    { icon: '🌱', q: t('faqQ2'), a: t('faqA2') },
    { icon: '📍', q: t('faqQ3'), a: t('faqA3') },
    { icon: '🔔', q: t('faqQ4'), a: t('faqA4') },
    { icon: '🌐', q: t('faqQ5'), a: t('faqA5') },
    { icon: '🔒', q: t('faqQ6'), a: t('faqA6') },
  ];
}

// ── FAQ Accordion Item ──────────────────────────────────────────────────────
function FaqItem({ item, styles }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.faqIcon}>{item.icon}</Text>
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Text style={styles.faqChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
    </View>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function HelpSupportScreen() {
  const { t }     = useLanguage();
  const { theme } = useTheme();
  const styles    = useMemo(() => makeStyles(theme), [theme]);
  const faqItems  = useMemo(() => getFaqItems(t), [t]);

  const TIPS = [
    t('helpTip1'), t('helpTip2'), t('helpTip3'), t('helpTip4'),
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeader title={t('helpSupport')} />

      {/* Hero */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEmoji}>🌾</Text>
        <Text style={styles.heroTitle}>{t('helpHeroTitle')}</Text>
        <Text style={styles.heroSub}>{t('helpHeroSub')}</Text>
      </View>

      {/* FAQ Section */}
      <Text style={styles.sectionTitle}>{t('faqTitle').toUpperCase()}</Text>
      {faqItems.map((item, i) => (
        <FaqItem key={i} item={item} styles={styles} />
      ))}

      {/* Contact Section */}
      <Text style={styles.sectionTitle}>{t('contactUs').toUpperCase()}</Text>
      <View style={styles.contactGrid}>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('tel:+911800180000')}
          activeOpacity={0.7}
        >
          <Text style={styles.contactEmoji}>📞</Text>
          <Text style={styles.contactLabel}>{t('callSupport')}</Text>
          <Text style={styles.contactValue}>1800-180-0000</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('mailto:support@farmerapp.in')}
          activeOpacity={0.7}
        >
          <Text style={styles.contactEmoji}>📧</Text>
          <Text style={styles.contactLabel}>{t('emailSupport')}</Text>
          <Text style={styles.contactValue}>support@farmerapp.in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('https://wa.me/911234567890')}
          activeOpacity={0.7}
        >
          <Text style={styles.contactEmoji}>💬</Text>
          <Text style={styles.contactLabel}>WhatsApp</Text>
          <Text style={styles.contactValue}>+91 12345 67890</Text>
        </TouchableOpacity>

        <View style={styles.contactCard}>
          <Text style={styles.contactEmoji}>🕐</Text>
          <Text style={styles.contactLabel}>{t('supportHours')}</Text>
          <Text style={styles.contactValue}>{t('supportHoursValue')}</Text>
        </View>
      </View>

      {/* App Info */}
      <Text style={styles.sectionTitle}>{t('appInfo').toUpperCase()}</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>{t('appVersionLabel')}</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>{t('dataSources')}</Text>
          <Text style={styles.infoValue}>NASA POWER + Open-Meteo</Text>
        </View>
        <View style={[styles.infoRow, { marginBottom: 0 }]}>
          <Text style={styles.infoKey}>{t('developer')}</Text>
          <Text style={styles.infoValue}>HANARAD Team</Text>
        </View>
      </View>

      {/* Usage Tips */}
      <Text style={styles.sectionTitle}>{t('usageTips').toUpperCase()}</Text>
      {TIPS.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={styles.tipBullet}>💡</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
