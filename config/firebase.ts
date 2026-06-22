import { getApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import Constants from 'expo-constants';

/**
 * React Native Firebase tự khởi tạo từ file native:
 * - Android: google-services.json (app.json → android.googleServicesFile)
 *
 * Không dùng firebase.initializeApp() như Web SDK.
 */
export const firebaseApp = getApp();
export const firebaseMessaging = messaging();

/** Đọc metadata từ app.json / eas.json (expo.extra) nếu cần gửi lên backend */
export const appConfig = {
  packageName: Constants.expoConfig?.android?.package ?? '',
  bundleIdentifier: Constants.expoConfig?.ios?.bundleIdentifier ?? '',
  easProjectId: Constants.expoConfig?.extra?.eas?.projectId ?? '',
};
