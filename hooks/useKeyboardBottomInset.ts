import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';

/**
 * Khoảng cách từ đáy window đến mép trên bàn phím.
 * Dùng screenY (vị trí thật trên màn hình) — ổn định hơn trên Samsung khi adjustResize chỉ co một phần.
 */
function measureKeyboardInset(event: KeyboardEvent): number {
  const windowHeight = Dimensions.get('window').height;
  const statusBarHeight = Constants.statusBarHeight ?? 0;
  const keyboardTopInWindow = event.endCoordinates.screenY - statusBarHeight;

  return Math.max(0, windowHeight - keyboardTopInWindow);
}

/** Đẩy composer lên sát mép trên bàn phím trên Android. */
export function useKeyboardBottomInset(enabled = Platform.OS === 'android') {
  const [inset, setInset] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const applyInset = (event: KeyboardEvent) => {
      setInset(measureKeyboardInset(event));
    };

    const onShow = (event: KeyboardEvent) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      applyInset(event);
      requestAnimationFrame(() => applyInset(event));
      setTimeout(() => applyInset(event), 50);
      setTimeout(() => applyInset(event), 150);
    };

    const onHide = () => {
      hideTimerRef.current = setTimeout(() => setInset(0), 50);
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [enabled]);

  return inset;
}
