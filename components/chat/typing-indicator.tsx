import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import {
  CHAT_BUBBLE_RADIUS,
  CHAT_BUBBLE_TAIL_RADIUS,
} from '@/components/chat/chat-constants';
import { Radius, Spacing } from '@/constants/theme';

type TypingIndicatorProps = {
  dotColor: string;
  bubbleStyle?: ViewStyle;
};

const DOT_COUNT = 3;
const CYCLE_MS = 900;

function AnimatedDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -5,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(CYCLE_MS - delay),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color, opacity, transform: [{ translateY }] }]}
    />
  );
}

export function TypingIndicator({ dotColor, bubbleStyle }: TypingIndicatorProps) {
  return (
    <View style={[styles.bubble, bubbleStyle]}>
      <View style={styles.dotsRow}>
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <AnimatedDot key={index} delay={index * 160} color={dotColor} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: CHAT_BUBBLE_RADIUS,
    borderTopRightRadius: CHAT_BUBBLE_RADIUS,
    borderBottomRightRadius: CHAT_BUBBLE_RADIUS,
    borderBottomLeftRadius: CHAT_BUBBLE_TAIL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
});
