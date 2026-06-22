import { useCallback, useEffect, useState } from 'react';

import {
  getFcmToken,
  PushPermissionStatus,
  requestPushPermissions,
  subscribeToTokenRefresh,
} from '@/services/pushNotificationService';

type UsePushNotificationsOptions = {
  /** Gọi khi có FCM token — gửi lên backend của bạn */
  onTokenReceived?: (token: string) => void;
};

export type PushEventSource = 'foreground' | 'opened-from-background' | 'opened-from-killed';

/**
 * Hook tích hợp FCM push notifications.
 *
 * Yêu cầu Development Build (không chạy trên Expo Go).
 * Background handler đăng ký trong index.js (trước expo-router/entry).
 */
export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { onTokenReceived } = options;

  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PushPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const register = useCallback(async (options?: { forceRefresh?: boolean }) => {
    setIsLoading(true);
    setTokenError(null);
    try {
      const status = await requestPushPermissions();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setFcmToken(null);
        return null;
      }

      const result = await getFcmToken({
        skipPermissionCheck: true,
        forceRefresh: options?.forceRefresh ?? false,
      });
      setFcmToken(result.token);
      setTokenError(result.error);
      if (result.token) {
        onTokenReceived?.(result.token);
      }
      return result.token;
    } finally {
      setIsLoading(false);
    }
  }, [onTokenReceived]);

  useEffect(() => {
    register();

    const unsubTokenRefresh = subscribeToTokenRefresh((token) => {
      setFcmToken(token);
      onTokenReceived?.(token);
    });

    return () => {
      unsubTokenRefresh();
    };
  }, [register, onTokenReceived]);

  return {
    fcmToken,
    tokenError,
    permissionStatus,
    isLoading,
    register,
  };
}
