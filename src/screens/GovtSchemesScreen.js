/**
 * GOVT SCHEMES SCREEN
 * ─────────────────────────────────────────────────────────────────
 * No API needed — real Indian government scheme data with
 * official portal links that open in the device browser.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader       from '../components/AppHeader';
import { SCHEMES, SCHEME_CATEGORIES } from '../constants/schemesData';

const CATEGORY_LABELS = {
  all:       { label: 'All',        icon: '📋' },
  income:    { label: 'Income',     icon: '💰' },
  insurance: { label: 'Insurance',  icon: '🛡️' },
  credit:    { label: 'Credit',     icon: '💳' },
  irrigation:{ label: 'Irrigation', icon: '💧' },
  subsidy:   { label: 'Subsidy',    icon: '🧪' },
};

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // Info banner
    infoBanner: {
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#EFF6FF',
      borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center',
    },
    infoIcon: { fontSize: 20, marginRight: 10 },
    infoText: { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 18, fontWeight: '500' },

    // Category tabs
    tabsRow: {
      paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', gap: 8,
    },
    tab: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: theme.border, backgroundColor: theme.card,
    },
    tabActive:    { borderColor: theme.primary, backgroundColor: theme.light },
    tabIcon:      { fontSize: 14, marginRight: 4 },
    tabText:      { fontSize: 13, fontWeight: '600', color: theme.subtext },
    tabTextActive:{ color: theme.primary },

    // Count
    countText: {
      fontSize: 12, color: theme.subtext, fontWeight: '600',
      marginHorizontal: 16, marginBottom: 10,
    },

    // Scheme card
    schemeCard: {
      marginHorizontal: 16, marginBottom: 12,
      borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, borderColor: theme.border,
    },
    schemeTop: {
      flexDirection: 'row', alignItems: 'center', padding: 16,
    },
    schemeIconBox: {
      width: 50, height: 50, borderRadius: 25,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    schemeIcon: { fontSize: 26 },
    schemeInfo: { flex: 1 },
    schemeName: { fontSize: 15, fontWeight: '800', color: theme.text, lineHeight: 20 },
    schemeAmount: { fontSize: 13, fontWeight: '700', marginTop: 4 },

    // Expandable details
    expandBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: theme.border,
      backgroundColor: theme.card,
    },
    expandBtnText: { fontSize: 12, fontWeight: '700', color: theme.primary },

    schemeDetails: { padding: 16, paddingTop: 8, backgroundColor: theme.card },
    schemeDesc:    { fontSize: 13, color: theme.text, lineHeight: 20, marginBottom: 12 },

    eligTitle: { fontSize: 11, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, marginBottom: 6 },
    eligText:  { fontSize: 12, color: theme.text, lineHeight: 18 },

    // Apply button
    applyBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.primary, borderRadius: 12,
      paddingVertical: 12, marginTop: 12,
    },
    applyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    bottomPad: { height: 32 },
  });
}

// ── Scheme Card ────────────────────────────────────────────────────────────
function SchemeCard({ scheme, styles, theme, t }) {
  const [open, setOpen] = useState(false);

  const title       = t(scheme.titleKey)       || scheme.id;
  const description = t(scheme.descKey)        || '';
  const amount      = t(scheme.amountKey)      || '';
  const eligibility = t(scheme.eligibilityKey) || '';

  return (
    <View style={styles.schemeCard}>
      <View style={[styles.schemeTop, { backgroundColor: scheme.color }]}>
        <View style={[styles.schemeIconBox, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
          <Text style={styles.schemeIcon}>{scheme.icon}</Text>
        </View>
        <View style={styles.schemeInfo}>
          <Text style={styles.schemeName}>{title}</Text>
          {amount ? (
            <Text style={[styles.schemeAmount, { color: scheme.accent }]}>{amount}</Text>
          ) : null}
        </View>
      </View>

      <TouchableOpacity style={styles.expandBtn} onPress={() => setOpen(v => !v)}>
        <Text style={styles.expandBtnText}>
          {open ? 'Hide Details ▲' : 'Know More & Apply ▼'}
        </Text>
        <Text style={{ fontSize: 11, color: theme.subtext }}>
          {CATEGORY_LABELS[scheme.category]?.icon} {scheme.category}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.schemeDetails}>
          <Text style={styles.schemeDesc}>{description}</Text>

          {eligibility ? (
            <>
              <Text style={styles.eligTitle}>ELIGIBILITY</Text>
              <Text style={styles.eligText}>{eligibility}</Text>
            </>
          ) : null}

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => Linking.openURL(scheme.link)}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>🌐 Apply at Official Portal →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main Component ──────────────────────────────────────────────────────
export default function GovtSchemesScreen() {
  const { t }     = useLanguage();
  const { theme } = useTheme();
  const styles    = useMemo(() => makeStyles(theme), [theme]);

  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() =>
    activeCategory === 'all' ? SCHEMES : SCHEMES.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeader title="Govt. Schemes" subtitle="Agriculture Benefits" />

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>🏛️</Text>
        <Text style={styles.infoText}>
          All schemes are from official Indian Government portals.
          Tap "Apply at Official Portal" to go directly to the government website.
        </Text>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabsRow}>
          {SCHEME_CATEGORIES.map(cat => {
            const info = CATEGORY_LABELS[cat];
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, activeCategory === cat && styles.tabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={styles.tabIcon}>{info.icon}</Text>
                <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                  {info.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.countText}>{filtered.length} schemes available</Text>

      {/* Scheme list */}
      {filtered.map(scheme => (
        <SchemeCard key={scheme.id} scheme={scheme} styles={styles} theme={theme} t={t} />
      ))}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
