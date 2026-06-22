import Constants from 'expo-constants';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Platform } from 'react-native';

/**
 * Cấu hình Firebase đọc từ biến môi trường (.env → app.config.js → expo.extra).
 *
 * QUAN TRỌNG — hai lớp cấu hình FCM trên Expo Dev Client:
 *
 * 1) Native (bắt buộc cho FCM token trên Android/iOS):
 *    - Android: google-services.json  → app.json "android.googleServicesFile"
 *    - iOS:     GoogleService-Info.plist → app.json "ios.googleServicesFile"
 *    - Khởi tạo qua @react-native-firebase/app (xem config/firebase.ts)
 *
 * 2) JS env (file này — dùng cho Web SDK, gửi metadata lên backend, debug):
 *    - EXPO_PUBLIC_FIREBASE_* trong .env
 *    - Không thay thế google-services.json trên native!
 */
export type FirebaseEnvConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readFirebaseEnvConfig(): FirebaseEnvConfig {
  const extra = Constants.expoConfig?.extra?.firebase as Partial<FirebaseEnvConfig> | undefined;

  return {
    apiKey: extra?.apiKey ?? '',
    authDomain: extra?.authDomain ?? '',
    projectId: extra?.projectId ?? '',
    storageBucket: extra?.storageBucket ?? '',
    messagingSenderId: extra?.messagingSenderId ?? '',
    appId: extra?.appId ?? '',
  };
}

export const firebaseEnvConfig = readFirebaseEnvConfig();

export const firebaseOptions: FirebaseOptions = {
  apiKey: firebaseEnvConfig.apiKey,
  authDomain: firebaseEnvConfig.authDomain,
  projectId: firebaseEnvConfig.projectId,
  storageBucket: firebaseEnvConfig.storageBucket,
  messagingSenderId: firebaseEnvConfig.messagingSenderId,
  appId: firebaseEnvConfig.appId,
};

/**
 * Firebase Web SDK — chỉ khởi tạo trên web.
 * Trên Android/iOS dùng @react-native-firebase (native module).
 */
export function getFirebaseWebApp() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseOptions);
}
