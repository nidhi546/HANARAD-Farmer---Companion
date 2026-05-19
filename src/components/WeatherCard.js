/**
 * WeatherCard — metric tile used on the weather and NASA screens
 *
 * Fixed: was using static THEME import (broke dark mode).
 * Now uses useTheme() hook and platform-correct shadow.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadow, typography, spacing, radius } from '../utils/ui';

export default function WeatherCard({ label, value, unit, icon, accent }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme, accent), [theme, accent]);

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
        <Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function makeStyles(theme, accent) {
  const accentColor = accent ?? theme.primary;
  return StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: radius.lg,
      padding: spacing[4],
      alignItems: 'center',
      width: '47%',
      marginBottom: spacing[3],
      ...shadow(2),
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: accentColor + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[2],
    },
    icon:  { fontSize: 24 },
    value: {
      ...typography.number,
      fontSize: Platform.select({ ios: 22, android: 20 }),
      color: theme.text,
      marginTop: spacing[1],
    },
    unit:  { ...typography.caption, color: theme.subtext, fontWeight: '500' },
    label: { ...typography.label, color: theme.subtext, marginTop: spacing[1], textAlign: 'center' },
  });
}
