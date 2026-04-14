/** GrailIQ brand colors and design tokens */
export const colors = {
  // Brand
  primary: '#7F77DD',
  primaryLight: '#9B94E8',
  primaryDark: '#6259C4',

  // Premium gold accent — used for "grail moments", pro tier, score highlights
  gold: '#F4C430',
  goldLight: '#FFDB6E',
  goldDark: '#C99A14',

  // Signals
  buy: '#22C55E',
  buyDim: '#14532D',
  hold: '#F59E0B',
  holdDim: '#78350F',
  watch: '#64748B',
  watchDim: '#334155',
  avoid: '#EF4444',
  avoidDim: '#7F1D1D',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutrals — deeper, richer
  background: '#0B0B18',
  backgroundElevated: '#12121F',
  surface: '#1A1A2E',
  surfaceLight: '#242444',
  surfaceLighter: '#2E2E50',
  border: '#2E2E4A',
  borderLight: '#3A3A5A',

  // Text
  text: '#F9FAFB',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B85',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Card gradients
  cardGradientStart: '#1E1E33',
  cardGradientEnd: '#12121F',

  // Overlay for glass cards
  overlay05: 'rgba(255,255,255,0.05)',
  overlay10: 'rgba(255,255,255,0.10)',
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
