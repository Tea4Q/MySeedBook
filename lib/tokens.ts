/**
 * Static design tokens — spacing, radius, typography weights/sizes, shadows.
 * Dynamic color tokens live in lib/theme.tsx via useTheme().
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontFamily = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  black: 'Poppins-Black',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Shadows — always include both iOS and Android (elevation) properties (R1).
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Weather condition semantic colors.
 * Intentionally distinct from the brand palette — they communicate weather state.
 */
export const weatherColors = {
  sunny: '#F5A623',
  partlyCloudy: '#A0B8C8',
  cloudy: '#8899AA',
  rainy: '#4A90D9',
  stormy: '#5B5EA6',
  snowy: '#A8D8EA',
  foggy: '#B0BEC5',
  hot: '#E74C3C',
  cold: '#2980B9',
  wind: '#7ECBA1',
} as const;

/**
 * Max content width for list/browse screens on tablets (R4).
 */
export const screenMaxWidth = 680;
