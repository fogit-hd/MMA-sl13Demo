import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { CHAT_MAX_ATTACHMENTS } from '@/components/chat/chat-constants';
import { compressImage } from '@/services/imageCompression';

type UseImagePickerResult = {
  imageUris: string[];
  isProcessing: boolean;
  error: string | null;
  pickImage: () => Promise<string[]>;
  takePhoto: () => Promise<string | null>;
  removeImageAt: (index: number) => void;
  clearImages: () => void;
};

export function useImagePicker(): UseImagePickerResult {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = Math.max(CHAT_MAX_ATTACHMENTS - imageUris.length, 0);

  const processAssets = useCallback(async (uris: string[]) => {
    if (uris.length === 0) return [];

    setImageUris((prev) => [...prev, ...uris]);
    setIsProcessing(true);
    setError(null);

    const compressedUris: string[] = [];

    try {
      for (const uri of uris) {
        const compressedUri = await compressImage(uri);
        compressedUris.push(compressedUri);
        setImageUris((prev) => {
          const index = prev.indexOf(uri);
          if (index === -1) return prev;
          const next = [...prev];
          next[index] = compressedUri;
          return next;
        });
      }
      return compressedUris;
    } catch (err) {
      setImageUris((prev) => prev.filter((uri) => !uris.includes(uri)));
      const message = err instanceof Error ? err.message : 'Không thể xử lý ảnh.';
      setError(message);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const pickImage = useCallback(async () => {
    if (remainingSlots === 0) {
      setError(`Tối đa ${CHAT_MAX_ATTACHMENTS} ảnh mỗi tin nhắn.`);
      return [];
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Cần quyền truy cập thư viện ảnh.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
      selectionLimit: remainingSlots,
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) {
      return [];
    }

    const uris = result.assets
      .map((asset) => asset.uri)
      .filter((uri): uri is string => !!uri)
      .slice(0, remainingSlots);

    return processAssets(uris);
  }, [processAssets, remainingSlots]);

  const takePhoto = useCallback(async () => {
    if (remainingSlots === 0) {
      setError(`Tối đa ${CHAT_MAX_ATTACHMENTS} ảnh mỗi tin nhắn.`);
      return null;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Cần quyền truy cập camera.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return null;
    }

    const compressed = await processAssets([result.assets[0].uri]);
    return compressed[0] ?? null;
  }, [processAssets, remainingSlots]);

  const removeImageAt = useCallback((index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const clearImages = useCallback(() => {
    setImageUris([]);
    setError(null);
  }, []);

  return {
    imageUris,
    isProcessing,
    error,
    pickImage,
    takePhoto,
    removeImageAt,
    clearImages,
  };
}
