import * as Notifications from 'expo-notifications';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { PushEventSource } from '@/hooks/usePushNotifications';
import {
  ensureNotificationHandler,
  getInitialNotification,
  PushNotificationPayload,
  subscribeToForegroundMessages,
  subscribeToNotificationOpenedApp,
} from '@/services/pushNotificationService';
import type { InboxNotification } from '@/types/notification';
import { mapRemoteMessageToInbox } from '@/utils/map-remote-message';
import { getExpoContentDisplayText } from '@/utils/notification-content';

type NotificationHistoryContextValue = {
  notifications: InboxNotification[];
  unreadCount: number;
  addFromRemoteMessage: (message: PushNotificationPayload, source: PushEventSource) => void;
  markAllAsRead: () => void;
};

const NotificationHistoryContext = createContext<NotificationHistoryContextValue | null>(null);

function toRemoteMessageFromExpoNotification(
  notification: Notifications.Notification,
): PushNotificationPayload | null {
  const content = notification.request.content;
  const display = getExpoContentDisplayText(content);
  if (!display) return null;

  return {
    messageId: notification.request.identifier,
    notification: {
      title: display.title,
      body: display.body,
    },
    data: content.data as Record<string, string>,
  } as PushNotificationPayload;
}

/**
 * Đăng ký listener FCM/expo ở root — inbox cập nhật kể cả khi user chưa mở tab Dashboard.
 */
function useInboxPushListeners(
  addFromRemoteMessage: (message: PushNotificationPayload, source: PushEventSource) => void,
) {
  const addRef = useRef(addFromRemoteMessage);
  addRef.current = addFromRemoteMessage;

  useEffect(() => {
    const add = (message: PushNotificationPayload, source: PushEventSource) => {
      addRef.current(message, source);
    };

    void ensureNotificationHandler();

    // FOREGROUND: FCM onMessage
    const unsubForeground = subscribeToForegroundMessages((message) => {
      add(message, 'foreground');
    });

    // BACKGROUND: tap notification
    const unsubOpenedApp = subscribeToNotificationOpenedApp((message) => {
      add(message, 'opened-from-background');
    });

    // KILLED: cold start từ notification
    getInitialNotification().then((message) => {
      if (message) add(message, 'opened-from-killed');
    });

    // Tap banner local / notification trên status bar
    const unsubResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      const message = toRemoteMessageFromExpoNotification(response.notification);
      if (message) add(message, 'opened-from-background');
    });

    // Backup: khi app active lại sau khi nhận notification (background, chưa tap)
    const syncPresentedNotifications = async () => {
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const item of presented) {
        const message = toRemoteMessageFromExpoNotification(item);
        if (message) add(message, 'opened-from-background');
      }
    };

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        syncPresentedNotifications();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);
    syncPresentedNotifications();

    return () => {
      unsubForeground();
      unsubOpenedApp();
      unsubResponse.remove();
      appStateSub.remove();
    };
  }, []);
}

export function NotificationHistoryProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);

  const addFromRemoteMessage = useCallback(
    (message: PushNotificationPayload, source: PushEventSource) => {
      const item = mapRemoteMessageToInbox(message, source);
      if (!item) return;

      setNotifications((prev) => {
        if (prev.some((n) => n.id === item.id)) return prev;
        const duplicateContent = prev.some(
          (n) =>
            n.title === item.title &&
            n.body === item.body &&
            Date.now() - n.receivedAt.getTime() < 3000,
        );
        if (duplicateContent) return prev;
        return [item, ...prev];
      });
    },
    [],
  );

  useInboxPushListeners(addFromRemoteMessage);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addFromRemoteMessage,
      markAllAsRead,
    }),
    [notifications, unreadCount, addFromRemoteMessage, markAllAsRead],
  );

  return (
    <NotificationHistoryContext.Provider value={value}>
      {children}
    </NotificationHistoryContext.Provider>
  );
}

export function useNotificationHistory() {
  const ctx = useContext(NotificationHistoryContext);
  if (!ctx) {
    throw new Error('useNotificationHistory phải dùng trong NotificationHistoryProvider');
  }
  return ctx;
}
