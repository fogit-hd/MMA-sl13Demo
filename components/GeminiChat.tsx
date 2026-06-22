import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CHAT_HORIZONTAL_PADDING,
  CHAT_INPUT_RADIUS,
  CHAT_MESSAGE_GAP,
  CHAT_TYPEWRITER_CHAR_DELAY_MS,
} from '@/components/chat/chat-constants';
import { ChatImagePreview } from '@/components/chat/chat-image-preview';
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';
import { ChatSendButton } from '@/components/chat/chat-send-button';
import { ImageAttachmentSheet } from '@/components/chat/image-attachment-sheet';
import { ScalePressable } from '@/components/chat/scale-pressable';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useAssistantTypewriter } from '@/hooks/useAssistantTypewriter';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { useSmartAutoScroll } from '@/hooks/useSmartAutoScroll';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  GeminiServiceError,
  generateImagesAnalysis,
  generateTextResponse,
} from '@/services/geminiService';

type ChatRole = 'user' | 'gemini';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  imageUris?: string[];
  isStreaming?: boolean;
};

export function GeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'gemini',
      text: 'Xin chào! Tôi là Gemini. Hỏi tôi bất cứ điều gì, hoặc gửi ảnh để phân tích.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generationRef = useRef(0);

  const {
    imageUris,
    isProcessing,
    error: pickerError,
    pickImage,
    takePhoto,
    removeImageAt,
    clearImages,
  } = useImagePicker();

  const background = useThemeColor({}, 'background');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const tint = useThemeColor({}, 'tint');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const onTint = useThemeColor({ light: '#FFFFFF', dark: '#0B1220' }, 'background');

  const displayError = error ?? pickerError;

  const { listRef, handleScroll, scrollToEnd, stickToBottom } = useSmartAutoScroll<ChatMessage>();

  const { streamReply, isStreaming, cancelStream } = useAssistantTypewriter<ChatMessage>(
    setMessages,
    {
      charDelayMs: CHAT_TYPEWRITER_CHAR_DELAY_MS,
      onTick: () => scrollToEnd(),
    },
  );

  const isResponding = isLoading || isStreaming;
  const canSend = (input.trim().length > 0 || imageUris.length > 0) && !isProcessing;
  const keyboardBottomInset = useKeyboardBottomInset();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => scrollToEnd());
    return () => showSub.remove();
  }, [scrollToEnd]);

  const appendMessage = useCallback(
    (message: ChatMessage, options?: { forceScroll?: boolean }) => {
      setMessages((prev) => [...prev, message]);
      if (options?.forceScroll) {
        stickToBottom();
      } else {
        scrollToEnd();
      }
    },
    [scrollToEnd, stickToBottom],
  );

  useEffect(() => {
    if (isLoading) {
      scrollToEnd();
    }
  }, [isLoading, scrollToEnd]);

  const handlePickFromLibrary = async () => {
    setSheetVisible(false);
    const uris = await pickImage();
    if (uris.length > 0) setError(null);
  };

  const handleTakePhoto = async () => {
    setSheetVisible(false);
    const uri = await takePhoto();
    if (uri) setError(null);
  };

  const handleStop = useCallback(() => {
    generationRef.current += 1;
    setIsLoading(false);
    cancelStream();
  }, [cancelStream]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && imageUris.length === 0) return;
    if (isResponding || isProcessing) return;

    const generationId = generationRef.current + 1;
    generationRef.current = generationId;

    setError(null);
    setIsLoading(true);
    stickToBottom();

    const userText =
      trimmed ||
      (imageUris.length === 1 ? 'Phân tích hình ảnh này.' : 'Phân tích các hình ảnh này.');
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      imageUris: imageUris.length > 0 ? [...imageUris] : undefined,
    };
    appendMessage(userMessage, { forceScroll: true });
    setInput('');
    const imagesForRequest = [...imageUris];
    clearImages();

    try {
      const reply =
        imagesForRequest.length > 0
          ? await generateImagesAnalysis(imagesForRequest, userText)
          : await generateTextResponse(userText);

      if (generationRef.current !== generationId) return;

      setIsLoading(false);
      stickToBottom();
      streamReply(`gemini-${Date.now()}`, reply);
    } catch (err) {
      if (generationRef.current !== generationId) return;

      const message =
        err instanceof GeminiServiceError
          ? err.message
          : 'Không thể kết nối Gemini. Kiểm tra API key và mạng.';
      setError(message);
      console.error('[GeminiChat]', err);
    } finally {
      if (generationRef.current === generationId) {
        setIsLoading(false);
      }
    }
  };

  const handleComposerAction = () => {
    if (isResponding) {
      handleStop();
      return;
    }
    handleSend();
  };

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatMessageBubble
        role={item.role}
        text={item.text}
        imageUris={item.imageUris}
        isStreaming={item.isStreaming}
        userBubbleColor={tint}
        aiBubbleColor={surface}
        borderColor={border}
        userTextColor="#FFFFFF"
        aiTextColor={text}
      />
    ),
    [border, surface, text, tint],
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View style={styles.flex}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.messageListWrap}>
              <FlatList
                ref={listRef}
                style={styles.messageList}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={() => scrollToEnd()}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListFooterComponent={
                  isLoading ? (
                    <TypingIndicator
                      dotColor={textSecondary}
                      bubbleStyle={{
                        backgroundColor: surface,
                        borderColor: border,
                        marginTop: CHAT_MESSAGE_GAP,
                      }}
                    />
                  ) : null
                }
              />
            </View>
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.bottomStack,
              {
                backgroundColor: surface,
                borderTopColor: border,
                elevation: 8,
                paddingBottom: keyboardBottomInset,
              },
            ]}>
            {displayError ? (
              <View style={[styles.errorBox, { borderColor: border, backgroundColor: surfaceMuted }]}>
                <ThemedText tone="danger" type="caption">
                  {displayError}
                </ThemedText>
              </View>
            ) : null}

            {imageUris.length > 0 ? (
              <View style={styles.previewSection}>
                <ChatImagePreview
                  uris={imageUris}
                  isProcessing={isProcessing}
                  borderColor={border}
                  surfaceColor={surface}
                  textColor={text}
                  onRemove={removeImageAt}
                />
              </View>
            ) : null}

            <View style={styles.composer}>
              <View style={[styles.inputShell, { backgroundColor: surfaceMuted, borderColor: border }]}>
                <ScalePressable
                  style={[styles.attachButton, { backgroundColor: surface }]}
                  onPress={() => setSheetVisible(true)}
                  disabled={isResponding || isProcessing}
                  accessibilityLabel="Đính kèm ảnh">
                  <MaterialIcons name="add" size={24} color={textSecondary} />
                </ScalePressable>

                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor={textSecondary}
                  style={[styles.input, { color: text }]}
                  multiline
                  editable={!isResponding && !isProcessing}
                  onFocus={() => scrollToEnd()}
                />

                <ChatSendButton
                  mode={isResponding ? 'stop' : 'send'}
                  onPress={handleComposerAction}
                  disabled={isResponding ? false : !canSend}
                  tint={tint}
                  iconColor={onTint}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImageAttachmentSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPickLibrary={handlePickFromLibrary}
        onTakePhoto={handleTakePhoto}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  messageListWrap: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: CHAT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  separator: {
    height: CHAT_MESSAGE_GAP,
  },
  bottomStack: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  errorBox: {
    marginHorizontal: CHAT_HORIZONTAL_PADDING,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewSection: {
    paddingHorizontal: CHAT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
  },
  composer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingHorizontal: CHAT_HORIZONTAL_PADDING,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    borderRadius: CHAT_INPUT_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    elevation: 3,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 8,
    fontSize: 16,
    lineHeight: 22,
  },
});
