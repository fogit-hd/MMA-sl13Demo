import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

type PrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
};

export function PrimaryButton({ title, loading = false, disabled, style, ...props }: PrimaryButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({ light: '#FFFFFF', dark: '#0B1220' }, 'background');

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tint, opacity: pressed || disabled || loading ? 0.75 : 1 },
        style,
      ]}
      {...props}>
      <ThemedText style={[styles.label, { color: onTint }]}>
        {loading ? 'Đang xử lý...' : title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
