import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 14, padding: 14, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    iconCircle: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12, flexShrink: 0,
    },
    icon:    { fontSize: 26 },
    info:    { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    name:    { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
    badge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    season:  { fontSize: 11, color: theme.subtext, marginBottom: 4 },
    tip:     { fontSize: 11, color: theme.subtext, lineHeight: 16, opacity: 0.7 },
  });
}

export default function CropCard({ crop, suitable }) {
  const { t }     = useLanguage();
  const { theme, isDark } = useTheme();
  const styles    = useMemo(() => makeStyles(theme), [theme]);

  const suitableBg    = isDark ? '#1E1B4B' : '#EEF2FF';
  const unsuitableBg  = isDark ? '#374151' : '#F1F5F9';
  const suitableIconBg   = theme.light;
  const unsuitableIconBg = isDark ? '#374151' : '#F1F5F9';

  return (
    <View style={[styles.card, { borderLeftColor: suitable ? theme.primary : theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: suitable ? suitableIconBg : unsuitableIconBg }]}>
        <Text style={styles.icon}>{crop.icon}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{crop.name}</Text>
          <View style={[styles.badge, { backgroundColor: suitable ? suitableBg : unsuitableBg }]}>
            <Text style={[styles.badgeText, { color: suitable ? theme.primary : theme.subtext }]}>
              {suitable ? `✅ ${t('suitable')}` : `❌ ${t('notNow')}`}
            </Text>
          </View>
        </View>
        <Text style={styles.season}>{crop.season}</Text>
        <Text style={styles.tip} numberOfLines={2}>{crop.tip}</Text>
      </View>
    </View>
  );
}
