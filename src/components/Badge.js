/**
 * Badge — small label pill for status, category, count
 *
 * Usage:
 *   <Badge label="FARM" color={theme.success} />
 *   <Badge label="High" variant="danger" />
 *   <Badge label="3" variant="primary" dot />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, radius } from '../utils/ui';

const VARIANTS = {
  primary: (t) => ({ bg: t.light,         text: t.primary  }),
  success: (t) => ({ bg: t.successLight,  text: t.success  }),
  danger:  (t) => ({ bg: t.dangerLight,   text: t.danger   }),
  warning: (t) => ({ bg: t.warningLight,  text: t.warning  }),
  info:    (t) => ({ bg: t.infoLight,     text: t.info     }),
  neutral: (t) => ({ bg: t.border,        text: t.subtext  }),
};

export default function Badge({
  label,
  variant  = 'primary',
  color,     // override text+dot color directly
  bg,        // override background color directly
  dot = false,
  style,
}) {
  const { theme } = useTheme();
  const resolved  = (VARIANTS[variant] ?? VARIANTS.primary)(theme);
  const textColor = color ?? resolved.text;
  const bgColor   = bg    ?? resolved.bg;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: textColor }]} />}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
