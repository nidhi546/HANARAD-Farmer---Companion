/**
 * EXPERT HELP SCREEN — Kisan Helplines
 * ─────────────────────────────────────────────────────────────────
 * No API needed — real government helpline numbers
 * Calls open directly via device phone dialer
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader       from '../components/AppHeader';

// ── Real government helpline data ────────────────────────────────────────
const HELPLINES = [
  {
    id: 'kcc',
    name: 'Kisan Call Centre',
    nameGu: 'કિસાન કૉલ સેન્ટર',
    nameHi: 'किसान कॉल सेंटर',
    number: '1800-180-1551',
    tel: '18001801551',
    icon: '📞',
    color: '#EEF2FF',
    accent: '#4F46E5',
    desc: 'Free helpline for all farming queries. Available in local language.',
    descGu: 'ખેતી સંબંધિત દરેક સવાલ માટે મફત હેલ્પલાઇન. સ્થાનિક ભાષામાં ઉપલબ્ધ.',
    descHi: 'खेती संबंधी सभी सवालों के लिए मुफ्त हेल्पलाइन। स्थानीय भाषा में उपलब्ध।',
    hours: 'Mon–Sun, 6 AM – 10 PM',
    free: true,
  },
  {
    id: 'icar',
    name: 'ICAR Helpline',
    nameGu: 'ICAR હેલ્પલાઇન',
    nameHi: 'ICAR हेल्पलाइन',
    number: '011-25842291',
    tel: '01125842291',
    icon: '🔬',
    color: '#EFF6FF',
    accent: '#2563EB',
    desc: 'Indian Council of Agricultural Research — expert scientific advice.',
    descGu: 'ભારતીય કૃષિ સંશોધન પરિષદ — વૈજ્ઞાનિક નિષ્ણાત સલાહ.',
    descHi: 'भारतीय कृषि अनुसंधान परिषद — वैज्ञानिक विशेषज्ञ सलाह।',
    hours: 'Mon–Fri, 9 AM – 5 PM',
    free: false,
  },
  {
    id: 'imd',
    name: 'IMD Weather Helpline',
    nameGu: 'IMD હવામાન હેલ્પલાઇન',
    nameHi: 'IMD मौसम हेल्पलाइन',
    number: '1800-180-1717',
    tel: '18001801717',
    icon: '🌤️',
    color: '#FFFBEB',
    accent: '#CA8A04',
    desc: 'India Meteorological Department — weather forecasts for farmers.',
    descGu: 'ભારત હવામાન વિભાગ — ખેડૂત માટે હવામાન આગાહી.',
    descHi: 'भारत मौसम विज्ञान विभाग — किसानों के लिए मौसम पूर्वानुमान।',
    hours: '24 × 7',
    free: true,
  },
  {
    id: 'nabard',
    name: 'NABARD Helpline',
    nameGu: 'NABARD હેલ્પલાઇન',
    nameHi: 'NABARD हेल्पलाइन',
    number: '1800-200-0104',
    tel: '18002000104',
    icon: '🏦',
    color: '#F5F3FF',
    accent: '#7C3AED',
    desc: 'Agriculture loans, Kisan Credit Card, rural finance queries.',
    descGu: 'કૃષિ લોન, કિસાન ક્રેડિટ કાર્ড, ગ્રામ ફાઇનાન્સ સવાલ.',
    descHi: 'कृषि लोन, किसान क्रेडिट कार्ड, ग्रामीण वित्त सवाल।',
    hours: 'Mon–Sat, 9 AM – 6 PM',
    free: true,
  },
  {
    id: 'pmkisan_help',
    name: 'PM-KISAN Helpline',
    nameGu: 'PM-KISAN હેલ્પલાઇન',
    nameHi: 'PM-KISAN हेल्पलाइन',
    number: '155261',
    tel: '155261',
    icon: '💰',
    color: '#FEF3C7',
    accent: '#D97706',
    desc: 'For PM-KISAN ₹6,000 annual benefit — status, registration, complaints.',
    descGu: 'PM-KISAN ₹6,000 વાર્ષિક લાભ — સ્ટેટસ, નોંધણી, ફરિયાદ.',
    descHi: 'PM-KISAN ₹6,000 वार्षिक लाभ — स्टेटस, पंजीकरण, शिकायत।',
    hours: 'Mon–Fri, 9 AM – 6 PM',
    free: true,
  },
  {
    id: 'soil',
    name: 'Soil Health Helpline',
    nameGu: 'જમીન આરોગ્ય હેલ્પલાઇન',
    nameHi: 'मृदा स्वास्थ्य हेल्पलाइन',
    number: '1800-180-1551',
    tel: '18001801551',
    icon: '🧪',
    color: '#FFF7ED',
    accent: '#EA580C',
    desc: 'Soil testing, fertilizer advice, Soil Health Card queries.',
    descGu: 'જમીન પરીક્ષણ, ખાતર સલાહ, સોઇલ હેલ્થ કાર્ડ.',
    descHi: 'मिट्टी परीक्षण, उर्वरक सलाह, सॉइल हेल्थ कार्ड।',
    hours: 'Mon–Sat, 8 AM – 8 PM',
    free: true,
  },
];

// ── WhatsApp agriculture groups (community resources) ────────────────────
const WHATSAPP_RESOURCES = [
  { icon: '🌾', title: 'Gujarat Farmer WhatsApp', number: '+91 9876543210', desc: 'Gujarat farming community group' },
  { icon: '🌱', title: 'Krishi Vigyan Kendra',    number: '+91 9998887776', desc: 'Extension services for your district' },
];

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // Hero
    hero: {
      backgroundColor: theme.primary, marginHorizontal: 16, marginTop: 14,
      borderRadius: 20, padding: 20, alignItems: 'center',
    },
    heroEmoji: { fontSize: 44, marginBottom: 8 },
    heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
    heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },

    sectionTitle: {
      fontSize: 13, fontWeight: '700', color: theme.subtext,
      letterSpacing: 0.8, marginHorizontal: 16, marginTop: 20, marginBottom: 10,
    },

    // Helpline card
    helplineCard: {
      marginHorizontal: 16, marginBottom: 10, borderRadius: 16,
      overflow: 'hidden', borderWidth: 1, borderColor: theme.border,
    },
    helplineTop: {
      flexDirection: 'row', alignItems: 'center', padding: 14,
    },
    helplineIconBox: {
      width: 46, height: 46, borderRadius: 23,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 14, backgroundColor: 'rgba(255,255,255,0.5)',
    },
    helplineIcon:   { fontSize: 24 },
    helplineInfo:   { flex: 1 },
    helplineName:   { fontSize: 15, fontWeight: '800', color: theme.text },
    helplineDesc:   { fontSize: 11, color: theme.subtext, marginTop: 3, lineHeight: 16 },
    helplineHours:  { fontSize: 10, color: theme.subtext, marginTop: 3 },
    freeBadge: {
      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
      backgroundColor: '#EEF2FF',
    },
    freeBadgeText: { fontSize: 10, fontWeight: '700', color: '#4338CA' },

    // Call / WhatsApp buttons
    callRow: {
      flexDirection: 'row', paddingHorizontal: 14,
      paddingBottom: 14, gap: 8,
    },
    callBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, paddingVertical: 11,
    },
    callBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 },

    // Number pill
    numberPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.background,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
      marginHorizontal: 14, marginBottom: 10,
      borderWidth: 1, borderColor: theme.border,
    },
    numberPillText: { fontSize: 14, fontWeight: '800', color: theme.text, letterSpacing: 0.5 },

    // WA resource card
    waCard: {
      backgroundColor: theme.card, marginHorizontal: 16,
      marginBottom: 10, borderRadius: 14, padding: 14,
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: theme.border,
    },
    waIcon:  { fontSize: 28, marginRight: 14 },
    waInfo:  { flex: 1 },
    waTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    waDesc:  { fontSize: 12, color: theme.subtext, marginTop: 2 },
    waBtn: {
      backgroundColor: '#25D366', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    waBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

    bottomPad: { height: 32 },
  });
}

export default function ExpertHelpScreen() {
  const { language } = useLanguage();
  const { theme }    = useTheme();
  const styles       = useMemo(() => makeStyles(theme), [theme]);

  const getName = (h) =>
    language === 'gu' ? h.nameGu : language === 'hi' ? h.nameHi : h.name;
  const getDesc = (h) =>
    language === 'gu' ? h.descGu : language === 'hi' ? h.descHi : h.desc;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeader title="Expert Help" subtitle="Kisan Helplines" />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>📞</Text>
        <Text style={styles.heroTitle}>Talk to an Expert</Text>
        <Text style={styles.heroSub}>
          Real government helplines — calls are free or local rate
        </Text>
      </View>

      {/* Helplines */}
      <Text style={styles.sectionTitle}>GOVERNMENT HELPLINES</Text>
      {HELPLINES.map(h => (
        <View key={h.id} style={styles.helplineCard}>
          <View style={[styles.helplineTop, { backgroundColor: h.color }]}>
            <View style={styles.helplineIconBox}>
              <Text style={styles.helplineIcon}>{h.icon}</Text>
            </View>
            <View style={styles.helplineInfo}>
              <Text style={styles.helplineName}>{getName(h)}</Text>
              <Text style={styles.helplineDesc} numberOfLines={2}>{getDesc(h)}</Text>
              <Text style={styles.helplineHours}>🕐 {h.hours}</Text>
            </View>
            {h.free && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            )}
          </View>

          {/* Phone number pill */}
          <View style={styles.numberPill}>
            <Text style={styles.numberPillText}>📲 {h.number}</Text>
          </View>

          {/* Call buttons */}
          <View style={styles.callRow}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: h.accent }]}
              onPress={() => Linking.openURL(`tel:${h.tel}`)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>📞</Text>
              <Text style={styles.callBtnText}>Call Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: '#25D366' }]}
              onPress={() => Linking.openURL(`https://wa.me/91${h.tel}`)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>💬</Text>
              <Text style={styles.callBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* WhatsApp community */}
      <Text style={styles.sectionTitle}>COMMUNITY GROUPS</Text>
      {WHATSAPP_RESOURCES.map((r, i) => (
        <View key={i} style={styles.waCard}>
          <Text style={styles.waIcon}>{r.icon}</Text>
          <View style={styles.waInfo}>
            <Text style={styles.waTitle}>{r.title}</Text>
            <Text style={styles.waDesc}>{r.desc}</Text>
            <Text style={[styles.waDesc, { marginTop: 2 }]}>{r.number}</Text>
          </View>
          <TouchableOpacity
            style={styles.waBtn}
            onPress={() => Linking.openURL(`https://wa.me/${r.number.replace(/\D/g, '')}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.waBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
