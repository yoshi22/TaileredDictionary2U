// TD2U Color Palette - Matching web app
export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutral/gray colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic colors
  success: {
    light: '#86efac',
    DEFAULT: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fde047',
    DEFAULT: '#eab308',
    dark: '#a16207',
  },
  error: {
    light: '#fca5a5',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },

  // Background colors
  background: {
    light: '#ffffff',
    dark: '#111827',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    muted: '#9ca3af',
    inverse: '#ffffff',
  },
} as const

// Light theme
export const lightTheme = {
  background: colors.background.light,
  card: colors.gray[50],
  border: colors.gray[200],
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.muted,
  primary: colors.primary[500],
  primaryLight: colors.primary[100],
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,
  error: colors.error.DEFAULT,
}

// Dark theme
export const darkTheme = {
  background: colors.background.dark,
  card: colors.gray[800],
  border: colors.gray[700],
  text: colors.text.inverse,
  textSecondary: colors.gray[400],
  textMuted: colors.gray[500],
  primary: colors.primary[400],
  primaryLight: colors.primary[900],
  success: colors.success.light,
  warning: colors.warning.light,
  error: colors.error.light,
}

export type Theme = typeof lightTheme
