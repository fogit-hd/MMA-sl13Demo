import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';

/** Model mặc định — gemini-1.5-flash đã retire; dùng 2.5 Flash (multimodal, free tier). */
export const GEMINI_MODEL =
  process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

const MAX_RETRIES = 3;
const BASE_RETRY_MS = 1500;

export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

function getApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiServiceError(
      'Thiếu EXPO_PUBLIC_GEMINI_API_KEY. Thêm vào file .env rồi restart Metro.',
      'MISSING_API_KEY',
    );
  }
  if (__DEV__) {
    console.log(`[Gemini] API key loaded (${apiKey.slice(0, 6)}…, len=${apiKey.length})`);
  }
  return apiKey;
}

function getClient() {
  return new GoogleGenerativeAI(getApiKey());
}

function parseRetrySeconds(message: string): number | null {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  const seconds = Math.ceil(Number.parseFloat(match[1]));
  return Number.isFinite(seconds) ? seconds : null;
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('resource_exhausted')
  );
}

function isServerOverloadError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    message.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('unavailable')
  );
}

function toGeminiError(error: unknown): GeminiServiceError {
  if (error instanceof GeminiServiceError) return error;

  const message = error instanceof Error ? error.message : String(error);

  if (isRateLimitError(error)) {
    const retrySeconds = parseRetrySeconds(message);
    const isFreeTierQuota = message.includes('free_tier') || message.includes('quota exceeded');

    console.warn('[Gemini] API quota/rate limit:', message.slice(0, 280));

    if (isFreeTierQuota) {
      return new GeminiServiceError(
        retrySeconds
          ? `Hết quota miễn phí Gemini (free tier). Thử lại sau ${retrySeconds} giây, hoặc tạo API key từ tài khoản Google khác / bật billing tại Google AI Studio.`
          : 'Hết quota miễn phí Gemini (free tier ~20 request/phút với gemini-2.5-flash). Đợi 1–2 phút, hoặc dùng API key từ tài khoản Google khác.',
        'QUOTA_EXCEEDED',
        false,
      );
    }

    return new GeminiServiceError(
      retrySeconds
        ? `Vượt giới hạn API. Thử lại sau ${retrySeconds} giây.`
        : 'Vượt giới hạn API (rate limit). Vui lòng thử lại sau 1–2 phút.',
      'RATE_LIMIT',
      false,
    );
  }

  if (message.toLowerCase().includes('api key')) {
    return new GeminiServiceError('API Key không hợp lệ. Kiểm tra EXPO_PUBLIC_GEMINI_API_KEY.', 'INVALID_API_KEY');
  }

  if (message.includes('404') && message.toLowerCase().includes('not found')) {
    return new GeminiServiceError(
      `Model "${GEMINI_MODEL}" không tồn tại hoặc đã ngừng hỗ trợ. Thử đặt EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash trong .env.`,
      'MODEL_NOT_FOUND',
    );
  }

  if (message.includes('gemini-1.5-flash')) {
    return new GeminiServiceError(
      'App đang dùng model cũ gemini-1.5-flash. Thêm EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash vào .env rồi build lại APK.',
      'OUTDATED_MODEL',
    );
  }

  if (isServerOverloadError(message)) {
    return new GeminiServiceError(
      'Gemini đang quá tải tạm thời (503). Đợi vài giây rồi gửi lại.',
      'SERVER_OVERLOAD',
      true,
    );
  }

  return new GeminiServiceError(message || 'Lỗi không xác định từ Gemini API.', 'UNKNOWN');
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: GeminiServiceError | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = toGeminiError(error);
      if (!lastError.retryable || attempt === MAX_RETRIES - 1) {
        throw lastError;
      }
      const delay = BASE_RETRY_MS * 2 ** attempt;
      console.log(`[Gemini] Retry ${attempt + 1}/${MAX_RETRIES} sau ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError ?? new GeminiServiceError('Gọi Gemini thất bại.');
}

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function imageUriToBase64(imageUri: string): Promise<{ base64: string; mimeType: string }> {
  if (!imageUri) {
    throw new GeminiServiceError('imageUri không hợp lệ.', 'INVALID_IMAGE_URI');
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { base64, mimeType: guessMimeType(imageUri) };
  } catch {
    throw new GeminiServiceError(
      'Không đọc được ảnh từ thiết bị. Thử chọn lại ảnh.',
      'IMAGE_READ_FAILED',
    );
  }
}

/** Gửi prompt text — trả về phản hồi văn bản */
export async function generateTextResponse(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new GeminiServiceError('Prompt không được để trống.', 'EMPTY_PROMPT');
  }

  return withRetry(async () => {
    const model = getClient().getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(trimmed);
    const text = result.response.text()?.trim();
    if (!text) {
      throw new GeminiServiceError('Gemini không trả về nội dung.', 'EMPTY_RESPONSE');
    }
    return text;
  });
}

/** Phân tích một hoặc nhiều ảnh cục bộ (multimodal) kèm prompt */
export async function generateImagesAnalysis(
  imageUris: string[],
  prompt: string,
): Promise<string> {
  const uris = imageUris.filter(Boolean);
  if (uris.length === 0) {
    throw new GeminiServiceError('Cần ít nhất một ảnh để phân tích.', 'INVALID_IMAGE_URI');
  }

  const trimmedPrompt =
    prompt.trim() ||
    (uris.length === 1
      ? 'Mô tả chi tiết nội dung hình ảnh này.'
      : 'Mô tả chi tiết nội dung các hình ảnh này.');

  const imageParts = await Promise.all(uris.map((uri) => imageUriToBase64(uri)));

  return withRetry(async () => {
    const model = getClient().getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent([
      { text: trimmedPrompt },
      ...imageParts.map(({ base64, mimeType }) => ({
        inlineData: { mimeType, data: base64 },
      })),
    ]);
    const text = result.response.text()?.trim();
    if (!text) {
      throw new GeminiServiceError('Gemini không trả về phân tích ảnh.', 'EMPTY_RESPONSE');
    }
    return text;
  });
}

/** Phân tích ảnh cục bộ (multimodal) kèm prompt — một ảnh */
export async function generateImageAnalysis(imageUri: string, prompt: string): Promise<string> {
  return generateImagesAnalysis([imageUri], prompt);
}
