/**
 * VaultDocs Design System - Premium SaaS Theme
 * Mobile-First | Zinc/Slate Palette | Blue/Indigo Primary
 */

import { Platform } from 'react-native';

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Primary - Blue/Indigo
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    DEFAULT: '#2563EB',
  },
  
  // Neutral - Zinc
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
  
  // Slate (for backgrounds and subtle elements)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  
  // Status Colors - Badges
  status: {
    active: {
      bg: '#DCFCE7',
      text: '#166534',
      dot: '#22C55E',
      label: 'Ativo',
    },
    expiring: {
      bg: '#FEF3C7',
      text: '#92400E',
      dot: '#F59E0B',
      label: 'Vencendo',
    },
    expired: {
      bg: '#FEE2E2',
      text: '#991B1B',
      dot: '#EF4444',
      label: 'Vencido',
    },
    archived: {
      bg: '#F3F4F6',
      text: '#374151',
      dot: '#6B7280',
      label: 'Arquivado',
    },
  },
  
  // Category Colors
  category: {
    cnh: '#3B82F6',
    rg: '#8B5CF6',
    boleto: '#F59E0B',
    contrato: '#10B981',
    garantia: '#EC4899',
    outros: '#6B7280',
  },
  
  // Semantic Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: '#2563EB',
  },
  
  // Border
  border: {
    default: '#E2E8F0',
    strong: '#CBD5E1',
    focus: '#2563EB',
  },
  
  // Interactive
  interactive: {
    hover: '#F1F5F9',
    pressed: '#E2E8F0',
    disabled: '#F1F5F9',
  },
  
  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
};

// ============================================
// SPACING TOKENS (4px base)
// ============================================

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  
  // Semantic
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================
// BORDER RADIUS TOKENS
// ============================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
  
  // Semantic
  button: 12,
  card: 16,
  input: 12,
  badge: 9999,
  modal: 24,
};

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  fontFamily: {
    regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    medium: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    semibold: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
  
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Text Styles
  textStyles: {
    h1: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    buttonSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
  },
};

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 12,
  },
};

// ============================================
// LAYOUT TOKENS
// ============================================

export const layout = {
  screen: {
    paddingH: spacing.lg,
  },
  header: {
    height: 56,
  },
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  bottomSheet: {
    borderRadius: borderRadius['2xl'],
  },
  card: {
    minHeight: 80,
  },
  input: {
    height: 52,
  },
  button: {
    height: 48,
    heightLg: 56,
  },
  avatar: {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  },
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
};

// ============================================
// ANIMATION TOKENS
// ============================================

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
};

// ============================================
// THEME EXPORT
// ============================================

const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  layout,
  animation,
  zIndex,
};

export type Theme = typeof theme;
export default theme;
