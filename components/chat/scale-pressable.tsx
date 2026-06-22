import { type ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type ScalePressableProps = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScalePressable({ children, style, disabled, onPressIn, onPressOut, ...props }: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
    onPressOut?.(event);
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
