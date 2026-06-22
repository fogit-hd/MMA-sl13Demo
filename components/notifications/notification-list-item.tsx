import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { InboxNotification } from '@/types/notification';

type NotificationListItemProps = {
  item: InboxNotification;
};

const SOURCE_LABEL: Record<InboxNotification['source'], string> = {
  foreground: 'Foreground',
  'opened-from-background': 'Background',
  'opened-from-killed': 'Killed',
};

export function NotificationListItem({ item }: NotificationListItemProps) {
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'textSecondary');

  const timeLabel = item.receivedAt.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: border,
          backgroundColor: surface,
          opacity: item.isRead ? 0.65 : 1,
        },
      ]}>
      <View style={styles.row}>
        {!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: tint }]} /> : null}
        <View style={styles.content}>
          <ThemedText type="defaultSemiBold" style={item.isRead ? { color: muted } : undefined}>
            {item.title}
          </ThemedText>
          <ThemedText tone="secondary" type="caption">
            {item.body || '—'}
          </ThemedText>
          <ThemedText tone="secondary" type="caption">
            {SOURCE_LABEL[item.source]} · {timeLabel}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
});
