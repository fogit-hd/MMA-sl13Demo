import LottieView, { type AnimationObject } from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type LottieSource = string | AnimationObject | { uri: string };

type NotificationBellLottieProps = {
  /**
   * File JSON Lottie — ví dụ:
   * animationSource={require('@/assets/lottie/bell.json')}
   */
  animationSource: LottieSource;
  unreadCount: number;
  onPress: () => void;
};

/**
 * Chuông Lottie:
 * - Có thông báo chưa đọc → loop + autoPlay (lắc liên tục)
 * - Bấm chuông → parent đánh dấu đã đọc → dừng animation + ẩn badge
 *
 * Cài đặt: npx expo install lottie-react-native
 * Sau khi cài native module mới, rebuild dev client: npx expo run:android
 */
export function NotificationBellLottie({
  animationSource,
  unreadCount,
  onPress,
}: NotificationBellLottieProps) {
  const animationRef = useRef<LottieView>(null);
  const danger = useThemeColor({}, 'danger');
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    if (hasUnread) {
      animationRef.current?.play();
      return;
    }
    animationRef.current?.reset();
    animationRef.current?.pause();
  }, [hasUnread]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Đánh dấu tất cả thông báo đã đọc"
      style={styles.hitArea}>
      <LottieView
        ref={animationRef}
        source={animationSource}
        loop={hasUnread}
        autoPlay={hasUnread}
        style={styles.lottie}
      />
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
  lottie: {
    width: 40,
    height: 40,
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
