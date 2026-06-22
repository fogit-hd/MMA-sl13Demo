import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet } from 'react-native';

import { ScalePressable } from '@/components/chat/scale-pressable';
import { Radius } from '@/constants/theme';

type ChatSendButtonProps = {
  mode: 'send' | 'stop';
  onPress: () => void;
  disabled?: boolean;
  tint: string;
  iconColor: string;
};

export function ChatSendButton({ mode, onPress, disabled, tint, iconColor }: ChatSendButtonProps) {
  const isStop = mode === 'stop';

  return (
    <ScalePressable
      style={[
        styles.button,
        {
          backgroundColor: tint,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={isStop ? 'Dừng phản hồi' : 'Gửi tin nhắn'}>
      {isStop ? (
        <MaterialIcons name="stop" size={20} color={iconColor} />
      ) : (
        <Ionicons name="arrow-up" size={22} color={iconColor} />
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
