import type { PushNotificationPayload } from '@/services/pushNotificationService';

export type NotificationDisplayText = {
  title: string;
  body: string;
};

function normalizeText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

/**
 * Trích title/body từ FCM payload. Trả về null nếu không có nội dung hiển thị được
 * (data-only / silent / banner trống).
 */
export function getNotificationDisplayText(
  message: PushNotificationPayload,
): NotificationDisplayText | null {
  const title =
    normalizeText(message.notification?.title) ?? normalizeText(message.data?.title);
  const body =
    normalizeText(message.notification?.body) ?? normalizeText(message.data?.body);

  if (!title && !body) {
    return null;
  }

  return {
    title: title ?? 'Thông báo mới',
    body: body ?? '',
  };
}

export function hasDisplayableNotificationContent(message: PushNotificationPayload): boolean {
  return getNotificationDisplayText(message) !== null;
}

export function getExpoContentDisplayText(content: {
  title?: string | null;
  body?: string | null;
}): NotificationDisplayText | null {
  const title = normalizeText(content.title);
  const body = normalizeText(content.body);

  if (!title && !body) {
    return null;
  }

  return {
    title: title ?? 'Thông báo mới',
    body: body ?? '',
  };
}
