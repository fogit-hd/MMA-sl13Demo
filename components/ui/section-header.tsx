import { StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type SectionHeaderProps = ViewProps & {
  title: string;
  description?: string;
};

export function SectionHeader({ title, description, style, ...props }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {description ? (
        <ThemedText tone="secondary">{description}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
});
