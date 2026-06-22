import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ChatMessageText } from '@/components/chat/chat-message-text';
import {
  CHAT_BUBBLE_MAX_WIDTH,
  CHAT_BUBBLE_RADIUS,
  CHAT_BUBBLE_TAIL_RADIUS,
  CHAT_MESSAGE_IMAGE_HEIGHT,
  CHAT_MESSAGE_IMAGE_WIDTH,
} from '@/components/chat/chat-constants';
import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type ChatMessageBubbleProps = {
  role: 'user' | 'gemini';
  text: string;
  imageUris?: string[];
  isStreaming?: boolean;
  userBubbleColor: string;
  aiBubbleColor: string;
  borderColor: string;
  userTextColor: string;
  aiTextColor: string;
};

export function ChatMessageBubble({
  role,
  text,
  imageUris = [],
  isStreaming,
  userBubbleColor,
  aiBubbleColor,
  borderColor,
  userTextColor,
  aiTextColor,
}: ChatMessageBubbleProps) {
  const isUser = role === 'user';
  const hasImages = imageUris.length > 0;
  const displayText = hasImages ? text.replace(/\s*📷\s*$/, '').trim() : text;
  const hasText = displayText.length > 0;

  return (
    <View style={[styles.messageGroup, isUser ? styles.userGroup : styles.aiGroup]}>
      {hasImages ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          contentContainerStyle={[
            styles.imageRow,
            isUser ? styles.imageRowUser : styles.imageRowAi,
          ]}>
          {imageUris.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={[styles.messageImage, { borderColor }]}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Ảnh ${index + 1} trong tin nhắn`}
            />
          ))}
        </ScrollView>
      ) : null}

      {hasText ? (
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            {
              backgroundColor: isUser ? userBubbleColor : aiBubbleColor,
              borderColor,
            },
          ]}>
          {isUser ? (
            <ThemedText style={[styles.messageText, { color: userTextColor }]}>{displayText}</ThemedText>
          ) : (
            <ChatMessageText
              text={displayText}
              color={aiTextColor}
              isStreaming={isStreaming}
              style={styles.messageText}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  messageGroup: {
    maxWidth: CHAT_BUBBLE_MAX_WIDTH,
    gap: Spacing.sm,
    flexShrink: 1,
  },
  userGroup: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  aiGroup: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  imageScroll: {
    height: CHAT_MESSAGE_IMAGE_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '100%',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imageRowUser: {
    justifyContent: 'flex-end',
  },
  imageRowAi: {
    justifyContent: 'flex-start',
  },
  messageImage: {
    width: CHAT_MESSAGE_IMAGE_WIDTH,
    height: CHAT_MESSAGE_IMAGE_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#1E293B',
  },
  bubble: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  userBubble: {
    borderTopLeftRadius: CHAT_BUBBLE_RADIUS,
    borderTopRightRadius: CHAT_BUBBLE_RADIUS,
    borderBottomLeftRadius: CHAT_BUBBLE_RADIUS,
    borderBottomRightRadius: CHAT_BUBBLE_TAIL_RADIUS,
  },
  aiBubble: {
    borderTopLeftRadius: CHAT_BUBBLE_RADIUS,
    borderTopRightRadius: CHAT_BUBBLE_RADIUS,
    borderBottomRightRadius: CHAT_BUBBLE_RADIUS,
    borderBottomLeftRadius: CHAT_BUBBLE_TAIL_RADIUS,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
});
