import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type NotificationBellProps = {
  unreadCount: number;
  onPress: () => void;
};

/**
 * Chuông in-app dùng Reanimated (không cần rebuild native như Lottie).
 * - Có thông báo chưa đọc → lắc liên tục + badge đỏ
 * - Bấm chuông → parent markAllAsRead → dừng lắc + ẩn badge
 */
export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');
  const hasUnread = unreadCount > 0;
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (hasUnread) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(16, { duration: 90 }),
          withTiming(-16, { duration: 90 }),
          withTiming(12, { duration: 80 }),
          withTiming(-8, { duration: 80 }),
          withTiming(0, { duration: 70 }),
        ),
        -1,
        false,
      );
      return;
    }
    cancelAnimation(rotation);
    rotation.value = withTiming(0, { duration: 120 });
  }, [hasUnread, rotation]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Đánh dấu tất cả thông báo đã đọc"
      style={styles.hitArea}>
      <Animated.View style={bellStyle}>
        <MaterialIcons name="notifications" size={32} color={tint} />
      </Animated.View>
      {hasUnread ? (
        <View style={[styles.badge, { backgroundColor: danger }]}>
          <ThemedText style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
