/**
 * Card — reusable surface component
 *
 * Handles platform shadow (iOS shadow props vs Android elevation) so
 * individual screens never need to duplicate shadow logic.
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card level={3} radius={20} style={...}>...</Card>
 *   <Card onPress={...}>...</Card>   ← tappable with ripple
 */

import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadow, ripple, radius as R } from '../utils/ui';

export default function Card({
  children,
  style,
  level      = 2,
  radius     = R.lg,        // 16
  onPress,
  onLongPress,
  disabled   = false,
  noPadding  = false,
  borderLeft,               // e.g. borderLeft="#4F46E5" for accent strip
}) {
  const { theme } = useTheme();

  const cardStyle = [
    styles.base,
    { backgroundColor: theme.card, borderRadius: radius },
    shadow(level),
    !noPadding && styles.padding,
    borderLeft && { borderLeftWidth: 4, borderLeftColor: borderLeft },
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && Platform.OS === 'ios' && { opacity: 0.93 },
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        {...ripple(theme.primary + '1A')}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  padding: {
    padding: 16,
  },
});
