/**
 * File tối giản cho index.js — CHỈ import @react-native-firebase/messaging.
 * Không import expo-notifications ở đây để tránh lỗi "EventEmitter of undefined"
 * khi native runtime chưa sẵn sàng (trước expo-router/entry).
 */
import messaging from '@react-native-firebase/messaging';

function hasDisplayableContent(remoteMessage: {
  notification?: { title?: string; body?: string };
  data?: Record<string, unknown>;
}): boolean {
  const title = (
    remoteMessage.notification?.title ?? remoteMessage.data?.title
  )?.toString().trim();
  const body = (
    remoteMessage.notification?.body ?? remoteMessage.data?.body
  )?.toString().trim();
  return Boolean(title || body);
}

export function registerBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[FCM] Background/Killed headless handler:', JSON.stringify(remoteMessage));

    // Data-only / silent: xử lý ngầm, không schedule banner trống.
    if (!hasDisplayableContent(remoteMessage)) {
      console.log('[FCM] Silent data message — không hiển thị notification');
      return;
    }

    // Notification payload đã có title/body — hệ thống Android/iOS tự hiển thị.
    // Không tạo thêm local notification để tránh banner trùng / trống.
    if (remoteMessage.notification) {
      return;
    }

    const Notifications = await import('expo-notifications');
    const title = String(remoteMessage.data?.title ?? 'Thông báo mới').trim();
    const body = String(remoteMessage.data?.body ?? '').trim();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: remoteMessage.data ?? {},
        channelId: 'default',
      },
      trigger: null,
    });
  });
}
