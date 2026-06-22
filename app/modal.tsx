import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { InfoCard } from '@/components/ui/info-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <SectionHeader
        title="Push Debug Panel"
        description="Checklist xử lý lỗi phổ biến khi token không lên hoặc notification không hiển thị."
      />

      <InfoCard>
        <ThemedText>{'\u2022'} Android 13+: bật quyền Notifications trong App Settings.</ThemedText>
        <ThemedText>{'\u2022'} Kiểm tra package name trùng trong Firebase project.</ThemedText>
        <ThemedText>{'\u2022'} Rebuild dev client sau khi đổi app.json hoặc firebase config.</ThemedText>
      </InfoCard>

      <Link href="/(tabs)" dismissTo asChild>
        <PrimaryButton title="Quay lại Home" />
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
});
