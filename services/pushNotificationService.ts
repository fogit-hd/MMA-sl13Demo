import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { firebaseMessaging } from '@/config/firebase';
import { formatFcmError } from '@/utils/firebase-diagnostics';
import {
  getExpoContentDisplayText,
  getNotificationDisplayText,
  hasDisplayableNotificationContent,
} from '@/utils/notification-content';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

let notificationHandlerReady = false;

const SUPPRESS_NOTIFICATION_BEHAVIOR = {
  shouldShowAlert: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
  shouldShowBanner: false,
  shouldShowList: false,
} as const;

const SHOW_NOTIFICATION_BEHAVIOR = {
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
  shouldShowBanner: true,
  shouldShowList: true,
} as const;

/** Gọi sau khi app mount — tránh import expo-notifications quá sớm trong index.js */
export async function ensureNotificationHandler() {
  if (notificationHandlerReady) return;
  notificationHandlerReady = true;

  await ensureAndroidNotificationChannel();

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const display = getExpoContentDisplayText(notification.request.content);
      if (!display) {
        console.log('[FCM] Bỏ qua banner trống (expo handler)');
        return SUPPRESS_NOTIFICATION_BEHAVIOR;
      }
      return SHOW_NOTIFICATION_BEHAVIOR;
    },
  });
}

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type PushNotificationPayload = FirebaseMessagingTypes.RemoteMessage;

export type FcmTokenResult = {
  token: string | null;
  error: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConfiguredSenderId(): string | undefined {
  const senderId = Constants.expoConfig?.extra?.firebase?.messagingSenderId;
  return senderId ? String(senderId) : undefined;
}

async function fetchFcmToken(senderId?: string): Promise<string> {
  if (senderId) {
    return firebaseMessaging.getToken({ senderId });
  }
  return firebaseMessaging.getToken();
}

/** Emulator Android có Play Services vẫn test được FCM; iOS Simulator không hỗ trợ push */
export function isPushSupported(): boolean {
  if (Device.isDevice) {
    return true;
  }
  return Platform.OS === 'android';
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E6F4FE',
  });
}

/**
 * Yêu cầu quyền thông báo:
 * - iOS: Firebase requestPermission (alert, badge, sound) + provisional optional
 * - Android 13+: POST_NOTIFICATIONS qua expo-notifications
 * - Android <13: tự động granted
 */
export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  await ensureNotificationHandler();

  if (!isPushSupported()) {
    console.warn('[FCM] Push không hỗ trợ trên nền tảng này (vd. iOS Simulator).');
    return 'unsupported';
  }

  await ensureAndroidNotificationChannel();

  if (Platform.OS === 'android') {
    try {
      await firebaseMessaging.requestPermission();
    } catch (error) {
      console.warn('[FCM] requestPermission (android) bỏ qua:', error);
    }
  } else {
    const authStatus = await firebaseMessaging.requestPermission();
    const iosGranted =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!iosGranted) {
      return 'denied';
    }
  }

  if (Platform.OS === 'android') {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  }

  return 'granted';
}

/**
 * Lấy FCM device token — gửi token này lên backend để push qua FCM HTTP v1 API.
 * Khác Expo Push Token (ExponentPushToken[...]); dùng FCM token khi tích hợp @react-native-firebase.
 */
export async function getFcmToken(options?: {
  skipPermissionCheck?: boolean;
  forceRefresh?: boolean;
}): Promise<FcmTokenResult> {
  if (!isPushSupported()) {
    return { token: null, error: 'Push không hỗ trợ trên môi trường này.' };
  }

  if (!options?.skipPermissionCheck) {
    const permission = await requestPushPermissions();
    if (permission !== 'granted') {
      const message = `Quyền thông báo: ${permission}`;
      console.warn('[FCM]', message);
      return { token: null, error: message };
    }
  }

  const senderId = getConfiguredSenderId();

  if (options?.forceRefresh) {
    try {
      await firebaseMessaging.deleteToken();
      await sleep(300);
      console.log('[FCM] Đã xóa token cũ');
    } catch (error) {
      console.warn('[FCM] deleteToken bỏ qua:', error);
    }
  }

  const attempts = 3;
  let lastError: unknown = null;

  for (let i = 0; i < attempts; i += 1) {
    try {
      const token = await fetchFcmToken(senderId);
      console.log('[FCM] Device token (copy để test):', token);
      return { token, error: null };
    } catch (error) {
      lastError = error;
      console.warn(`[FCM] getToken lần ${i + 1}/${attempts} thất bại:`, error);
      if (i < attempts - 1) {
        await sleep(600 * (i + 1));
      }
    }
  }

  const message = formatFcmError(lastError);
  console.error('[FCM] getToken thất bại:', message);
  return { token: null, error: message };
}

/** Foreground: FCM không hiện UI — tạo local notification qua expo-notifications */
export async function displayForegroundNotification(
  remoteMessage: PushNotificationPayload,
): Promise<boolean> {
  const display = getNotificationDisplayText(remoteMessage);
  if (!display) {
    console.log('[FCM] Bỏ qua foreground banner — payload không có title/body');
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: display.title,
      body: display.body,
      data: remoteMessage.data ?? {},
      ...(Platform.OS === 'android' ? { channelId: DEFAULT_NOTIFICATION_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
  return true;
}

/** FOREGROUND listener */
export function subscribeToForegroundMessages(
  onMessage: (message: PushNotificationPayload) => void,
) {
  return firebaseMessaging.onMessage(async (remoteMessage) => {
    console.log('[FCM] Foreground message:', JSON.stringify(remoteMessage));

    if (!hasDisplayableNotificationContent(remoteMessage)) {
      console.log('[FCM] Data-only / silent message — không hiển thị banner');
      return;
    }

    await displayForegroundNotification(remoteMessage);
    onMessage(remoteMessage);
  });
}

export function subscribeToTokenRefresh(onToken: (token: string) => void) {
  return firebaseMessaging.onTokenRefresh((token) => {
    console.log('[FCM] Token refreshed:', token);
    onToken(token);
  });
}

/** BACKGROUND: user tap notification khi app còn trong memory */
export function subscribeToNotificationOpenedApp(
  onOpened: (message: PushNotificationPayload) => void,
) {
  return firebaseMessaging.onNotificationOpenedApp((remoteMessage) => {
    console.log('[FCM] Opened from background (tap):', JSON.stringify(remoteMessage));
    if (!hasDisplayableNotificationContent(remoteMessage)) return;
    onOpened(remoteMessage);
  });
}

/** KILLED: user tap notification → cold start — gọi đúng 1 lần khi app khởi động */
export async function getInitialNotification(): Promise<PushNotificationPayload | null> {
  const remoteMessage = await firebaseMessaging.getInitialNotification();
  if (remoteMessage) {
    console.log('[FCM] Opened from quit/killed state (tap):', JSON.stringify(remoteMessage));
    if (!hasDisplayableNotificationContent(remoteMessage)) {
      return null;
    }
  }
  return remoteMessage;
}
