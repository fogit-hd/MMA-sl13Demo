import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#475569',
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    border: '#E2E8F0',
    tint: '#2563EB',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#2563EB',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
  },
  dark: {
    text: '#E5E7EB',
    textSecondary: '#94A3B8',
    background: '#0B1220',
    surface: '#111827',
    surfaceMuted: '#1F2937',
    border: '#334155',
    tint: '#60A5FA',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#60A5FA',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
} as const;
