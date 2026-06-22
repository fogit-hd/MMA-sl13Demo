import { StyleSheet, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ChatMessageTextProps = {
  text: string;
  color: string;
  isStreaming?: boolean;
  style?: TextStyle;
};

/**
 * Wrapper cho nội dung tin nhắn — hiện dùng ThemedText.
 * Khi thêm thư viện Markdown, chỉ cần đổi implementation tại đây;
 * typewriter vẫn cập nhật prop `text` từng ký tự như bình thường.
 */
export function ChatMessageText({ text, color, isStreaming, style }: ChatMessageTextProps) {
  return (
    <ThemedText style={[{ color }, style]}>
      {text}
      {isStreaming ? '▍' : null}
    </ThemedText>
  );
}
