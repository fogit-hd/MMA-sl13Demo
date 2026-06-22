import type { PushEventSource } from '@/hooks/usePushNotifications';

/** Một mục trong lịch sử thông báo in-app */
export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  source: PushEventSource;
  receivedAt: Date;
  isRead: boolean;
  data?: Record<string, unknown>;
};
