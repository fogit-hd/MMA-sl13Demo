import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CHAT_MAX_ATTACHMENTS } from '@/components/chat/chat-constants';
import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type ChatImagePreviewProps = {
  uris: string[];
  isProcessing?: boolean;
  borderColor: string;
  surfaceColor: string;
  textColor: string;
  onRemove: (index: number) => void;
};

export function ChatImagePreview({
  uris,
  isProcessing,
  borderColor,
  surfaceColor,
  textColor,
  onRemove,
}: ChatImagePreviewProps) {
  if (uris.length === 0) return null;

  const caption =
    isProcessing
      ? 'Đang nén ảnh...'
      : uris.length === 1
        ? 'Ảnh sẽ gửi kèm tin nhắn'
        : `${uris.length}/${CHAT_MAX_ATTACHMENTS} ảnh sẽ gửi kèm tin nhắn`;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {uris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={[styles.thumbnailWrap, { borderColor }]}>
            <Image
              source={{ uri }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Ảnh đính kèm ${index + 1}`}
            />
            {isProcessing ? (
              <View style={styles.processingOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
            <Pressable
              style={[styles.removeButton, { backgroundColor: surfaceColor }]}
              onPress={() => onRemove(index)}
              hitSlop={8}
              accessibilityLabel={`Xóa ảnh ${index + 1}`}>
              <MaterialIcons name="close" size={16} color={textColor} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <ThemedText type="caption" tone="secondary">
        {caption}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  scrollContent: {
    gap: Spacing.sm,
  },
  thumbnailWrap: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});
