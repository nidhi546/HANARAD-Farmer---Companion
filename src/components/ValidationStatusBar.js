/**
 * ValidationStatusBar
 *
 * Animated one-line status pill shown above the drawing toolbar while the
 * user is placing corners.
 *
 * Props:
 *   status   {string}  — VS.IDLE | LOADING | VALID | WARNING | ERROR
 *   language {string}  — 'en' | 'hi' | 'gu'
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { VS } from '../hooks/useFarmValidation';

const CONFIG = {
  [VS.LOADING]: {
    bg:   '#EEF2FF',
    text: '#4338CA',
    icon: '⏳',
    label: { en: 'Checking land type…', hi: 'भूमि प्रकार जांचा जा रहा है…', gu: 'ભૂ-પ્રકાર તપાસાઈ રહ્યો છે…' },
  },
  [VS.VALID]: {
    bg:   '#ECFDF5',
    text: '#065F46',
    icon: '✓',
    label: { en: 'Looks like farmland', hi: 'कृषि भूमि लगती है', gu: 'ખેતી ભૂમિ જણાય છે' },
  },
  [VS.WARNING]: {
    bg:   '#FEF2F2',
    text: '#991B1B',
    icon: '⚠',
    label: { en: 'Non-agricultural area detected', hi: 'गैर-कृषि क्षेत्र मिला', gu: 'બિન-ખેતી ક્ષેત્ર મળ્યું' },
  },
  [VS.ERROR]: {
    bg:   '#FFFBEB',
    text: '#92400E',
    icon: '!',
    label: { en: 'Could not verify land type', hi: 'भूमि प्रकार सत्यापित नहीं हुआ', gu: 'ભૂ-પ્રકાર ચકાસી ન શક્યા' },
  },
};

export default function ValidationStatusBar({ status, language = 'en' }) {
  const config  = CONFIG[status];
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue:         config ? 1 : 0,
      duration:        250,
      useNativeDriver: true,
    }).start();
  }, [status]);

  if (!config) return null;

  const label = config.label[language] ?? config.label.en;

  return (
    <Animated.View style={[styles.bar, { backgroundColor: config.bg, opacity }]}>
      <Text style={[styles.icon, { color: config.text }]}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    marginHorizontal: 14,
    marginBottom:     6,
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:     12,
    gap:              8,
  },
  icon:  { fontSize: 15, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', flex: 1 },
});
