/**
 * Button — reusable pressable button with platform-correct ripple/opacity feedback
 *
 * Android: TouchableNativeFeedback-style ripple via Pressable android_ripple
 * iOS:     Opacity fade on press
 *
 * Usage:
 *   <Button onPress={fn}>Save</Button>
 *   <Button variant="outline" size="sm" onPress={fn}>Cancel</Button>
 *   <Button variant="danger" loading={saving} onPress={fn}>Delete</Button>
 *   <Button icon="🌾" onPress={fn}>My Crops</Button>
 *   <Button fullWidth onPress={fn}>Submit</Button>
 */

import React from 'react';
import {
  Pressable, Text, View, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { buttonStyle, buttonTextStyle, ripple, MIN_TOUCH } from '../utils/ui';

export default function Button({
  children,
  onPress,
  onLongPress,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon,                     // emoji or component to show left of label
  iconRight,                // emoji or component to show right of label
  fullWidth = false,
  style,
  textStyle: textStyleProp,
}) {
  const { theme } = useTheme();

  const isDisabled = disabled || loading;

  const containerStyle = [
    buttonStyle(theme, variant, size),
    fullWidth && { alignSelf: 'stretch' },
    isDisabled && styles.disabled,
    { minHeight: MIN_TOUCH },
    style,
  ];

  const labelStyle = [
    buttonTextStyle(theme, variant, size),
    textStyleProp,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && Platform.OS === 'ios' && { opacity: 0.8 },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isDisabled}
      {...ripple(
        variant === 'outline' || variant === 'ghost'
          ? theme.primary + '20'
          : 'rgba(255,255,255,0.2)',
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon ? (
            typeof icon === 'string'
              ? <Text style={styles.icon}>{icon}</Text>
              : icon
          ) : null}
          <Text style={labelStyle}>{children}</Text>
          {iconRight ? (
            typeof iconRight === 'string'
              ? <Text style={styles.icon}>{iconRight}</Text>
              : iconRight
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  icon: {
    fontSize: 16,
  },
});
