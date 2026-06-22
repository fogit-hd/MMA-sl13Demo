import { useCallback, useRef, useState } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { CHAT_SCROLL_BOTTOM_THRESHOLD } from '@/components/chat/chat-constants';

export function useSmartAutoScroll<T>(threshold = CHAT_SCROLL_BOTTOM_THRESHOLD) {
  const listRef = useRef<FlatList<T>>(null);
  const isUserScrollingUpRef = useRef(false);
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      const scrollingUp = distanceFromBottom > threshold;

      if (isUserScrollingUpRef.current !== scrollingUp) {
        isUserScrollingUpRef.current = scrollingUp;
        setIsUserScrollingUp(scrollingUp);
      }
    },
    [threshold],
  );

  const scrollToEnd = useCallback((options?: { force?: boolean; animated?: boolean }) => {
    const { force = false, animated = true } = options ?? {};
    if (!force && isUserScrollingUpRef.current) return;

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const stickToBottom = useCallback(() => {
    isUserScrollingUpRef.current = false;
    setIsUserScrollingUp(false);
    scrollToEnd({ force: true });
  }, [scrollToEnd]);

  return {
    listRef,
    handleScroll,
    scrollToEnd,
    stickToBottom,
    isUserScrollingUp,
    isUserScrollingUpRef,
  };
}
