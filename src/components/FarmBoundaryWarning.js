/**
 * FarmBoundaryWarning
 *
 * Bottom-sheet modal that fires when the drawn polygon overlaps a non-agricultural
 * zone by more than OVERLAP_THRESHOLD.
 *
 * Props:
 *   visible          {boolean}
 *   overlaps         {Array}    — from useFarmValidation
 *   totalOverlap     {number}   — 0–1 fraction
 *   language         {string}   — 'en' | 'hi' | 'gu'
 *   onEdit           {function} — user wants to fix the boundary
 *   onContinueAnyway {function} — user accepts the risk and continues
 */
import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NON_AG_LABEL, NON_AG_STYLE } from '../utils/farmValidation/landTypeConfig';

const STRINGS = {
  en: {
    title:    'Non-Agricultural Area Detected',
    subtitle: (pct) => `${pct}% of your boundary overlaps with land that may not be farmland.`,
    body:     'Farm subsidies, crop insurance, and government schemes typically apply only to agricultural land. Please review your boundary.',
    edit:     'Edit Boundary',
    skip:     'Continue Anyway',
  },
  hi: {
    title:    'गैर-कृषि क्षेत्र मिला',
    subtitle: (pct) => `आपकी सीमा का ${pct}% हिस्सा खेती योग्य नहीं लगता।`,
    body:     'सरकारी योजनाएं और फसल बीमा आमतौर पर केवल कृषि भूमि पर लागू होते हैं। कृपया अपनी सीमा जांचें।',
    edit:     'सीमा ठीक करें',
    skip:     'फिर भी जारी रखें',
  },
  gu: {
    title:    'બિન-ખેતી વિસ્તાર મળ્યો',
    subtitle: (pct) => `તમારી સીમાનો ${pct}% ભાગ ખેતી યોગ્ય ન હોઈ શકે.`,
    body:     'સરકારી યોજનાઓ અને પાક વીમો સામાન્ય રીતે ફક્ત ખેતી ભૂમિ પર લાગુ પડે છે. કૃપા કરી સીમા તપાસો.',
    edit:     'સીમા સુધારો',
    skip:     'છતાં આગળ વધો',
  },
};

export default function FarmBoundaryWarning({
  visible,
  overlaps      = [],
  totalOverlap  = 0,
  language      = 'en',
  onEdit,
  onContinueAnyway,
}) {
  const insets   = useSafeAreaInsets();
  const slideY   = useRef(new Animated.Value(300)).current;
  const lang     = STRINGS[language] ?? STRINGS.en;
  const pct      = Math.round(totalOverlap * 100);

  // Unique land types in this overlap set
  const uniqueTypes = [...new Set(overlaps.map(o => o.landuse))];

  useEffect(() => {
    Animated.spring(slideY, {
      toValue:         visible ? 0 : 300,
      useNativeDriver: true,
      damping:         18,
      stiffness:       200,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Icon */}
          <Text style={styles.icon}>⚠️</Text>

          {/* Title */}
          <Text style={styles.title}>{lang.title}</Text>

          {/* Subtitle with overlap % */}
          <Text style={styles.subtitle}>{lang.subtitle(pct)}</Text>

          {/* Land type tags */}
          {uniqueTypes.length > 0 && (
            <View style={styles.tagRow}>
              {uniqueTypes.map((type) => {
                const style  = NON_AG_STYLE[type] ?? NON_AG_STYLE._default;
                const labels = NON_AG_LABEL[type] ?? NON_AG_LABEL._default;
                const label  = labels[language] ?? labels.en;
                return (
                  <View
                    key={type}
                    style={[styles.tag, { borderColor: style.stroke, backgroundColor: style.fill }]}
                  >
                    <Text style={[styles.tagText, { color: style.stroke }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Body text */}
          <ScrollView style={styles.bodyBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.bodyText}>{lang.body}</Text>
          </ScrollView>

          {/* Edit button (primary) */}
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.82}>
            <Text style={styles.editTxt}>{lang.edit}</Text>
          </TouchableOpacity>

          {/* Continue anyway (ghost) */}
          <TouchableOpacity style={styles.skipBtn} onPress={onContinueAnyway} activeOpacity={0.7}>
            <Text style={styles.skipTxt}>{lang.skip}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor:   '#fff',
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop:        12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.14, shadowRadius: 14 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    alignSelf:       'center',
    width:           42,
    height:          5,
    borderRadius:    3,
    backgroundColor: '#D1D5DB',
    marginBottom:    16,
  },
  icon:     { textAlign: 'center', fontSize: 42, marginBottom: 10 },
  title:    { textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 14 },

  tagRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'center',
    gap:            8,
    marginBottom:   14,
  },
  tag: {
    borderWidth:      1.5,
    borderRadius:     20,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  tagText: { fontSize: 12, fontWeight: '700' },

  bodyBox:  { maxHeight: 72, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 20 },
  bodyText: { fontSize: 13, color: '#555', lineHeight: 19 },

  editBtn: {
    backgroundColor: '#F59E0B',
    borderRadius:    14,
    paddingVertical: 15,
    alignItems:      'center',
    marginBottom:    10,
  },
  editTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipTxt: { color: '#9CA3AF', fontSize: 14 },
});
