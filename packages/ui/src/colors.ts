/**
 * Seloma color system — single JS source of truth.
 * CSS mirrors these values in ./colors.css (imported by apps).
 *
 * Hierarchy: Purple (primary) → Blue (secondary) → Teal (accent, rare) → Neutral (UI foundation)
 * Semantic success/warning/error/info are independent of brand purple.
 */

export const seloma = {
  brand: {
    primary: '#6C4DFF',
    primaryHover: '#5840D9',
    primaryActive: '#4633B3',
    primarySoft: '#F4F1FF',
    primaryText: '#4633B3',
    secondary: '#3B6CB5',
    secondaryHover: '#2F5A99',
    secondarySoft: '#EEF3FA',
    accent: '#2A8A84',
    accentHover: '#22736E',
    accentSoft: '#E8F6F5',
  },
  primary: {
    50: '#F4F1FF',
    100: '#EBE4FF',
    200: '#D4C9FF',
    300: '#B5A3FF',
    400: '#8B6FFF',
    500: '#6C4DFF',
    600: '#5840D9',
    700: '#4633B3',
    800: '#342680',
    900: '#241A59',
    950: '#16103A',
  },
  secondary: {
    50: '#EEF3FA',
    100: '#D9E4F2',
    200: '#B7CDE5',
    300: '#86A8D1',
    400: '#5886BE',
    500: '#3B6CB5',
    600: '#2F5A99',
    700: '#2F4A73',
    800: '#24385A',
    900: '#1A2840',
  },
  accent: {
    50: '#E8F6F5',
    100: '#CDEAE8',
    200: '#9DD5D1',
    300: '#5FB8B1',
    400: '#3A9E97',
    500: '#2A8A84',
    600: '#22736E',
    700: '#1C5F5B',
    800: '#1A5551',
    900: '#133E3B',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F6FA',
    100: '#F0EEF5',
    200: '#E4E1EB',
    300: '#D0CBD6',
    400: '#A8A3B3',
    500: '#7A7488',
    600: '#5C5668',
    700: '#433E4D',
    800: '#2C2833',
    900: '#1A1625',
    950: '#121018',
  },
  semantic: {
    success: { fg: '#047857', bg: '#ECFDF5', icon: '#10B981' },
    warning: { fg: '#B45309', bg: '#FFFBEB', icon: '#D97706' },
    error: { fg: '#B91C1C', bg: '#FEF2F2', icon: '#DC2626' },
    info: { fg: '#1D4ED8', bg: '#EFF6FF', icon: '#2563EB' },
    neutral: { fg: '#5C5668', bg: '#F0EEF5', icon: '#7A7488' },
  },
  chart: {
    1: '#6C4DFF',
    2: '#3B6CB5',
    3: '#2A8A84',
    4: '#C4A35A',
    5: '#C46B8A',
  },
} as const;

export const chartPalette = [
  seloma.chart[1],
  seloma.chart[2],
  seloma.chart[3],
  seloma.chart[4],
  seloma.chart[5],
] as const;

export type SelomaColorTokens = typeof seloma;
