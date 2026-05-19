// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens — Farmer App
// Single source of truth for colors, spacing, radius, and typography
// ─────────────────────────────────────────────────────────────────────────────

// ── Type Scale ────────────────────────────────────────────────────────────────
export const TYPE_SCALE = {
  xs:   10,
  sm:   11,
  base: 13,
  md:   14,
  lg:   16,
  xl:   18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 34,
};

// ── Spacing Scale ─────────────────────────────────────────────────────────────
export const SPACING = {
  '0.5': 2,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  pill: 999,
};

// ── Line Heights ──────────────────────────────────────────────────────────────
export const LINE_HEIGHT = {
  tight:  1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// ── Light Theme ───────────────────────────────────────────────────────────────
export const THEME = {
  // Brand
  primary:   '#4F46E5',   // Deep Indigo
  secondary: '#8B5CF6',   // Soft Violet
  accent:    '#F59E0B',   // Amber

  // Surfaces
  background: '#F7F8FC',
  card:       '#FFFFFF',
  inputBg:    '#F4F4F8',
  drawerBg:   '#FFFFFF',
  white:      '#FFFFFF',

  // Text
  text:    '#18181B',
  subtext: '#71717A',
  inverse: '#FFFFFF',

  // Borders
  border:      '#E4E4E7',
  borderFocus: '#4F46E5',

  // Semantic
  success: '#10B981',
  danger:  '#EF4444',
  warning: '#F59E0B',
  info:    '#06B6D4',
  sky:     '#06B6D4',

  // Tints
  light:        '#EEF2FF',
  successLight: '#ECFDF5',
  dangerLight:  '#FEF2F2',
  warningLight: '#FFFBEB',
  infoLight:    '#ECFEFF',

  // Header
  headerBg:   '#4F46E5',
  headerText: '#FFFFFF',
};

// ── Dark Theme ────────────────────────────────────────────────────────────────
export const DARK_THEME = {
  // Brand
  primary:   '#818CF8',   // Indigo-400
  secondary: '#A78BFA',   // Violet-400
  accent:    '#FCD34D',   // Amber-300

  // Surfaces
  background: '#0F172A',
  card:       '#1E293B',
  inputBg:    '#1E293B',
  drawerBg:   '#0F172A',
  white:      '#1E293B',

  // Text
  text:    '#F1F5F9',
  subtext: '#94A3B8',
  inverse: '#0F172A',

  // Borders
  border:      '#334155',
  borderFocus: '#818CF8',

  // Semantic
  success: '#34D399',
  danger:  '#F87171',
  warning: '#FCD34D',
  info:    '#22D3EE',
  sky:     '#22D3EE',

  // Tints
  light:        '#1E1B4B',
  successLight: '#064E3B',
  dangerLight:  '#450A0A',
  warningLight: '#422006',
  infoLight:    '#083344',

  // Header
  headerBg:   '#1E293B',
  headerText: '#F1F5F9',
};
