import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ImageAttachmentSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPickLibrary: () => void;
  onTakePhoto: () => void;
};

export function ImageAttachmentSheet({
  visible,
  onClose,
  onPickLibrary,
  onTakePhoto,
}: ImageAttachmentSheetProps) {
  const insets = useSafeAreaInsets();
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              borderColor: border,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
          onPress={(event) => event.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: border }]} />

          <Pressable style={[styles.option, { borderBottomColor: border }]} onPress={onPickLibrary}>
            <MaterialIcons name="photo-library" size={22} color={text} />
            <ThemedText type="defaultSemiBold">Chọn từ thư viện</ThemedText>
          </Pressable>

          <Pressable style={[styles.option, { borderBottomColor: border }]} onPress={onTakePhoto}>
            <MaterialIcons name="photo-camera" size={22} color={text} />
            <ThemedText type="defaultSemiBold">Chụp ảnh</ThemedText>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <ThemedText style={{ color: textSecondary }}>Hủy</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xs,
  },
});
