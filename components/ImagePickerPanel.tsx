import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SecondaryButton } from '@/components/ui/secondary-button';
import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useThemeColor } from '@/hooks/use-theme-color';

type ImagePickerPanelProps = {
  onImageSelected?: (uri: string | null) => void;
};

export function ImagePickerPanel({ onImageSelected }: ImagePickerPanelProps) {
  const border = useThemeColor({}, 'border');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const { imageUris, isProcessing, error, pickImage, takePhoto, clearImages } = useImagePicker();

  const handlePick = async () => {
    const uris = await pickImage();
    onImageSelected?.(uris[0] ?? null);
  };

  const handleTakePhoto = async () => {
    const uri = await takePhoto();
    onImageSelected?.(uri);
  };

  const handleClear = () => {
    clearImages();
    onImageSelected?.(null);
  };

  const previewUri = imageUris[imageUris.length - 1] ?? null;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.preview, { borderColor: border, backgroundColor: surfaceMuted }]}>
        {isProcessing ? (
          <ActivityIndicator />
        ) : previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.image} contentFit="cover" />
        ) : (
          <ThemedText tone="secondary" type="caption" style={{ color: textSecondary }}>
            Chưa có ảnh — chọn từ thư viện hoặc chụp mới
          </ThemedText>
        )}
      </View>

      <View style={styles.actions}>
        <SecondaryButton
          title="Chọn từ thư viện"
          onPress={handlePick}
          disabled={isProcessing}
          style={styles.actionButton}
        />
        <SecondaryButton
          title="Chụp ảnh"
          onPress={handleTakePhoto}
          disabled={isProcessing}
          style={styles.actionButton}
        />
      </View>

      {previewUri ? (
        <SecondaryButton title="Xóa ảnh" onPress={handleClear} disabled={isProcessing} />
      ) : null}

      {error ? (
        <ThemedText tone="danger" type="caption">
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  preview: {
    height: 200,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
