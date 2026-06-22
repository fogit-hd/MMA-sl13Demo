import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_DIMENSION = 1280;
const TARGET_BYTES = 1024 * 1024;
const COMPRESS_STEPS = [0.8, 0.7, 0.6, 0.5];

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || !('size' in info) || typeof info.size !== 'number') {
    return 0;
  }
  return info.size;
}

/**
 * Nén và resize ảnh trước khi upload / gửi Gemini.
 * Mục tiêu: dưới 1MB, chất lượng ~0.7–0.8.
 */
export async function compressImage(uri: string): Promise<string> {
  const originalSize = await getFileSize(uri);
  if (originalSize > 0 && originalSize <= TARGET_BYTES) {
    return uri;
  }

  let bestUri = uri;

  for (const quality of COMPRESS_STEPS) {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      },
    );

    bestUri = result.uri;
    const size = await getFileSize(result.uri);
    if (size > 0 && size <= TARGET_BYTES) {
      console.log(`[compressImage] ${Math.round(size / 1024)}KB @ quality ${quality}`);
      return result.uri;
    }
  }

  const finalSize = await getFileSize(bestUri);
  console.log(`[compressImage] Kết quả cuối: ${Math.round(finalSize / 1024)}KB`);
  return bestUri;
}
