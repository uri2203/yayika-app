export const colors = {
  primary: '#4E3470',
  primaryLight: '#D4B8F5',
  background: '#FAF7F2',
  turquoise: '#2DD4BF',
  gold: '#D4A843',
  rose: '#F472B6',
  text: '#1a1a2e',
  subtleText: '#6b7280',
  white: '#FFFFFF',
  black: '#000000',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  // Extended palette
  card: '#FFFFFF',
  textSecondary: '#6b7280',
  successBg: '#D1FAE5',
  errorBg: '#FEE2E2',
  warningBg: '#FEF3C7',
  warning: '#D97706',
  overlay: 'rgba(0,0,0,0.5)',
  assistantBubble: '#F3F0F7',
  // Cycle phase colors
  phaseMenstrual: '#C96B7A',
  phaseFollicular: '#3BAF7A',
  phaseOvulatory: '#1A9E8F',
  phaseLuteal: '#B8943A',
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const darkColors = {
  ...colors,
  background: '#1E1528',
  white: '#2A2035',
  text: '#F0E6F6',
  subtleText: '#B8A5C8',
  border: '#3D2E50',
  primaryLight: '#3A2555',
  primary: '#9B72CF',
  turquoise: '#5EEAD4',
  gold: '#E8C96A',
  rose: '#F9A8D4',
  error: '#FB7185',
  success: '#6EE7B7',
  // Extended palette - dark
  card: '#2A2035',
  textSecondary: '#B8A5C8',
  successBg: '#064E3B',
  errorBg: '#4C1D1D',
  warningBg: '#453518',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.7)',
  assistantBubble: '#3A2555',
  // Cycle phase colors - slightly brighter for dark mode contrast
  phaseMenstrual: '#E08898',
  phaseFollicular: '#5CCF9A',
  phaseOvulatory: '#3CC0B0',
  phaseLuteal: '#D4B05A',
};
