import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

type StatusChipProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusChip({ label, tone = 'neutral' }: StatusChipProps) {
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'border');
  const toneColor = {
    success: useThemeColor({}, 'success'),
    warning: useThemeColor({}, 'warning'),
    danger: useThemeColor({}, 'danger'),
    neutral: useThemeColor({}, 'textSecondary'),
  }[tone];

  return (
    <View style={[styles.container, { borderColor: tone === 'neutral' ? border : toneColor }]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: tone === 'neutral' ? tint : toneColor,
          },
        ]}
      />
      <ThemedText type="caption">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
});
