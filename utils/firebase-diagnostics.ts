import Constants from 'expo-constants';

import { firebaseApp } from '@/config/firebase';

export type FirebaseDiagnostics = {
  jsProjectId: string;
  nativeProjectId: string;
  nativeAppId: string;
  nativeSenderId: string;
  packageName: string;
  configMismatch: boolean;
  needsRebuild: boolean;
};

export function getFirebaseDiagnostics(): FirebaseDiagnostics {
  const js = (Constants.expoConfig?.extra?.firebase ?? {}) as Record<string, string>;
  const native = firebaseApp.options;

  const jsProjectId = String(js.projectId ?? '');
  const nativeProjectId = String(native.projectId ?? '');
  const nativeSenderId = String(native.messagingSenderId ?? '');

  const configMismatch = Boolean(
    jsProjectId && nativeProjectId && jsProjectId !== nativeProjectId,
  );
  const needsRebuild = Boolean(
    jsProjectId && (!nativeProjectId || nativeProjectId !== jsProjectId),
  );

  return {
    jsProjectId,
    nativeProjectId: nativeProjectId || '(trống — cần rebuild app)',
    nativeAppId: String(native.appId ?? ''),
    nativeSenderId,
    packageName: String(Constants.expoConfig?.android?.package ?? ''),
    configMismatch,
    needsRebuild,
  };
}

export function formatFcmError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const code = record.code ? String(record.code) : '';
    const message = record.message ? String(record.message) : '';
    if (code && message) return `${code}: ${message}`;
    if (message) return message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Không xác định được lỗi FCM';
  }
}
