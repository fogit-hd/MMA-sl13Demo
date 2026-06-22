import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedView } from '@/components/themed-view';

type InfoCardProps = ViewProps;

export function InfoCard({ style, children, ...props }: InfoCardProps) {
  const borderColor = useThemeColor({}, 'border');

  return (
    <ThemedView variant="surface" style={[styles.card, { borderColor }, style]} {...props}>
      <View style={styles.content}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  content: {
    gap: Spacing.md,
  },
});
