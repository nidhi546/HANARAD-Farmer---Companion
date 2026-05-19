// ─────────────────────────────────────────────────────────────────────────────
// ui.js — Platform-aware style utilities
//
// Usage:
//   import { shadow, card, ripple, typography, spacing, radius } from '../utils/ui';
//
// All shadow() calls replace the old mixed { shadowColor, elevation } pattern.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';

// ── Shadow Levels ─────────────────────────────────────────────────────────────
// iOS uses shadow props. Android uses elevation.
// Never mix both on the same view — iOS ignores elevation, Android ignores shadow*.
// (* Android API 28+ renders shadows but inconsistently — elevation is reliable)

const IOS_SHADOWS = {
  1: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3  },
  2: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8  },
  3: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 14 },
  4: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 20 },
  5: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 28 },
};

const ANDROID_ELEVATIONS = { 1: 2, 2: 4, 3: 6, 4: 10, 5: 16 };

/**
 * Returns platform-correct shadow style.
 * @param {1|2|3|4|5} level — 1=subtle, 2=card, 3=modal, 4=header, 5=fab
 */
export function shadow(level = 2) {
  if (Platform.OS === 'ios') return IOS_SHADOWS[level] ?? IOS_SHADOWS[2];
  return { elevation: ANDROID_ELEVATIONS[level] ?? 4 };
}

// ── Card Base Style ───────────────────────────────────────────────────────────
/**
 * Returns a complete card style including background, radius, and platform shadow.
 */
export function card(theme, level = 2) {
  return {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: Platform.OS === 'ios' ? 0 : 0,
    ...shadow(level),
  };
}

// ── Android Ripple ────────────────────────────────────────────────────────────
/**
 * Returns ripple props for <Pressable> on Android. No-op on iOS.
 * @param {string} color  — ripple color
 * @param {boolean} borderless — circular ripple when true
 */
export function ripple(color = 'rgba(79, 70, 229, 0.12)', borderless = false) {
  if (Platform.OS !== 'android') return {};
  return { android_ripple: { color, borderless } };
}

// ── Minimum Touch Target ──────────────────────────────────────────────────────
// Apple HIG: 44pt minimum. Android Material: 48dp minimum.
export const MIN_TOUCH = Platform.select({ ios: 44, android: 48, default: 44 });

// ── Typography Scale ──────────────────────────────────────────────────────────
// Android does not support fontWeight > 'bold' or fractional values reliably.
// iOS supports '100'–'900'. Use Platform.select for consistency.

function fw(iosWeight, fallback = 'bold') {
  return Platform.select({ ios: iosWeight, android: fallback, default: iosWeight });
}

export const typography = {
  h1:      { fontSize: 28, fontWeight: fw('800'), letterSpacing: -0.5, lineHeight: 34 },
  h2:      { fontSize: 22, fontWeight: fw('700'), letterSpacing: -0.3, lineHeight: 28 },
  h3:      { fontSize: 18, fontWeight: fw('700'), letterSpacing: -0.2, lineHeight: 24 },
  h4:      { fontSize: 16, fontWeight: fw('600'), letterSpacing: -0.1, lineHeight: 22 },
  h5:      { fontSize: 14, fontWeight: fw('600'), lineHeight: 20 },
  body:    { fontSize: 14, fontWeight: '400',      lineHeight: 22 },
  bodyBold:{ fontSize: 14, fontWeight: fw('600'), lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500',      lineHeight: 18 },
  label:   { fontSize: 11, fontWeight: fw('600'), letterSpacing: 0.5, lineHeight: 16 },
  tiny:    { fontSize: 10, fontWeight: '500',      lineHeight: 14 },
  mono:    { fontSize: 13, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
  number:  { fontSize: 24, fontWeight: fw('800'), letterSpacing: -0.5 },
};

// ── Spacing Scale ─────────────────────────────────────────────────────────────
export const spacing = {
  px:  1,
  0.5: 2,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
};

// ── Border Radius Scale ───────────────────────────────────────────────────────
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  pill: 999,
};

// ── Platform Layout Constants ─────────────────────────────────────────────────
export const HEADER_HEIGHT  = Platform.select({ ios: 44, android: 56, default: 56 });
export const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 56, default: 56 });

// ── Input Style Helper ────────────────────────────────────────────────────────
/**
 * Returns consistent input style for the given theme.
 */
export function inputStyle(theme, focused = false) {
  return {
    backgroundColor: theme.inputBg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: focused ? theme.borderFocus : theme.border,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.select({ ios: 13, android: 12 }),
    fontSize: 14,
    color: theme.text,
    ...Platform.select({
      ios:     { shadowColor: focused ? theme.primary : 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: {},
    }),
  };
}

// ── Button Style Helper ───────────────────────────────────────────────────────
const BTN_SIZES = {
  sm: { height: 36, paddingHorizontal: 14, fontSize: 13, radius: radius.md },
  md: { height: 46, paddingHorizontal: 20, fontSize: 14, radius: radius.md },
  lg: { height: 52, paddingHorizontal: 24, fontSize: 16, radius: radius.lg },
};

export function buttonStyle(theme, variant = 'primary', size = 'md') {
  const s = BTN_SIZES[size] ?? BTN_SIZES.md;
  const base = {
    height: s.height,
    paddingHorizontal: s.paddingHorizontal,
    borderRadius: s.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
  };
  const variants = {
    primary:  { ...base, backgroundColor: theme.primary,   ...shadow(2) },
    secondary:{ ...base, backgroundColor: theme.secondary, ...shadow(2) },
    outline:  { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
    ghost:    { ...base, backgroundColor: 'transparent' },
    danger:   { ...base, backgroundColor: theme.danger, ...shadow(2) },
    success:  { ...base, backgroundColor: theme.success, ...shadow(2) },
  };
  return variants[variant] ?? variants.primary;
}

export function buttonTextStyle(theme, variant = 'primary', size = 'md') {
  const s = BTN_SIZES[size] ?? BTN_SIZES.md;
  const solidColor = '#FFFFFF';
  const textColors = {
    primary:   solidColor,
    secondary: solidColor,
    outline:   theme.primary,
    ghost:     theme.primary,
    danger:    solidColor,
    success:   solidColor,
  };
  return {
    fontSize: s.fontSize,
    fontWeight: fw('700'),
    color: textColors[variant] ?? solidColor,
    letterSpacing: 0.2,
  };
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function divider(theme, horizontal = true) {
  return horizontal
    ? { height: 1, backgroundColor: theme.border }
    : { width: 1, backgroundColor: theme.border };
}

// ── Hit Slop ──────────────────────────────────────────────────────────────────
export const hitSlop = (size = 8) => ({ top: size, bottom: size, left: size, right: size });
