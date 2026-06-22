import type { PushEventSource } from '@/hooks/usePushNotifications';
import type { PushNotificationPayload } from '@/services/pushNotificationService';
import type { InboxNotification } from '@/types/notification';
import { getNotificationDisplayText } from '@/utils/notification-content';

/** Chuyển FCM RemoteMessage → item lưu trong inbox */
export function mapRemoteMessageToInbox(
  message: PushNotificationPayload,
  source: PushEventSource,
): InboxNotification | null {
  const display = getNotificationDisplayText(message);
  if (!display) {
    return null;
  }

  const { title, body } = display;

  return {
    id:
      message.messageId ??
      `${source}-${title}-${body}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    source,
    receivedAt: new Date(),
    isRead: false,
    data: message.data as Record<string, unknown> | undefined,
  };
}
