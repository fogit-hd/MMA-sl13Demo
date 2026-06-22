/**
 * Custom entry point — đăng ký background handler TRƯỚC khi React mount.
 * Bắt buộc cho @react-native-firebase/messaging (không chạy trong Expo Go).
 */
import { registerBackgroundMessageHandler } from './services/backgroundMessaging';

registerBackgroundMessageHandler();

import 'expo-router/entry';
