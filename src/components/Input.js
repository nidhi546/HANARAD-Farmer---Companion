/**
 * Input — reusable text input with consistent cross-platform styling
 *
 * iOS:     Subtle focus shadow + border color transition
 * Android: Border color change on focus (elevation unchanged)
 *
 * Usage:
 *   <Input
 *     label="Farm Name"
 *     placeholder="Enter name"
 *     value={name}
 *     onChangeText={setName}
 *   />
 *   <Input label="Password" secureTextEntry icon="🔒" />
 *   <Input label="Amount" keyboardType="numeric" suffix="₹" />
 *   <Input error="Required field" ... />
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography } from '../utils/ui';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  hint,
  icon,           // emoji shown on left
  suffix,         // text shown on right (e.g. "kg", "₹")
  secureTextEntry = false,
  keyboardType    = 'default',
  returnKeyType   = 'done',
  autoCapitalize  = 'sentences',
  editable        = true,
  multiline       = false,
  numberOfLines   = 1,
  maxLength,
  style,
  inputStyle: inputStyleProp,
  ...rest
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [secure,  setSecure]  = useState(secureTextEntry);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e) => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [error ? theme.danger : theme.border, error ? theme.danger : theme.primary],
  });

  const iosShadow = focused
    ? { shadowColor: error ? theme.danger : theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.18, shadowRadius: 5 }
    : {};

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={[styles.label, { color: focused ? theme.primary : theme.subtext }]}>
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputRow,
          {
            backgroundColor: editable ? theme.inputBg : theme.border,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor,
          },
          Platform.OS === 'ios' && iosShadow,
          multiline && { height: 'auto', minHeight: 80, alignItems: 'flex-start' },
        ]}
      >
        {icon ? <Text style={styles.iconLeft}>{icon}</Text> : null}

        <TextInput
          style={[
            styles.input,
            { color: theme.text, flex: 1 },
            multiline && { textAlignVertical: 'top', paddingTop: spacing[3] },
            inputStyleProp,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext + '80'}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          maxLength={maxLength}
          selectionColor={theme.primary}
          underlineColorAndroid="transparent"
          {...rest}
        />

        {suffix ? (
          <Text style={[styles.suffix, { color: theme.subtext }]}>{suffix}</Text>
        ) : null}

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeIcon}>{secure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.subtext }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.label,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    minHeight: Platform.select({ ios: 48, android: 52 }),
    overflow: 'hidden',
  },
  input: {
    ...typography.body,
    paddingVertical: Platform.select({ ios: 13, android: 11 }),
    paddingHorizontal: 2,
  },
  iconLeft: {
    fontSize: 16,
    marginRight: spacing[2],
  },
  suffix: {
    ...typography.body,
    marginLeft: spacing[2],
  },
  eyeBtn: {
    padding: spacing[2],
  },
  eyeIcon: {
    fontSize: 16,
  },
  error: {
    ...typography.caption,
    marginTop: spacing[1],
  },
  hint: {
    ...typography.caption,
    marginTop: spacing[1],
    opacity: 0.8,
  },
});
