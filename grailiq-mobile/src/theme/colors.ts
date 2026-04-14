/** GrailIQ brand colors and design tokens */
export const colors = {
  // Brand
  primary: '#7F77DD',
  primaryLight: '#9B94E8',
  primaryDark: '#6259C4',

  // Signals
  buy: '#059669',
  hold: '#D97706',
  watch: '#6B7280',
  avoid: '#DC2626',

  // Semantic
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#3B82F6',

  // Neutrals
  background: '#0F0F14',
  surface: '#1A1A24',
  surfaceLight: '#252536',
  border: '#2E2E42',
  borderLight: '#3A3A52',

  // Text
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Card gradients
  cardGradientStart: '#1E1E2E',
  cardGradientEnd: '#16161F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;
