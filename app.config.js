/**
 * Firebase extra ưu tiên đọc từ google-services.json (native source of truth).
 * .env dùng làm fallback / Gemini key.
 */
const fs = require('fs');
const path = require('path');
const { withAndroidManifest } = require('@expo/config-plugins');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const appJson = require('./app.json');

const FCM_CHANNEL_ID = 'default';

function withFcmNotificationChannel(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest.$ = {
      ...config.modResults.manifest.$,
      'xmlns:tools': 'http://schemas.android.com/tools',
    };

    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    application['meta-data'] ??= [];
    const metaData = application['meta-data'];
    const channelMetaName = 'com.google.firebase.messaging.default_notification_channel_id';
    const existing = metaData.find((item) => item.$?.['android:name'] === channelMetaName);

    if (existing) {
      existing.$['android:value'] = FCM_CHANNEL_ID;
      existing.$['tools:replace'] = 'android:value';
    } else {
      metaData.push({
        $: {
          'android:name': channelMetaName,
          'android:value': FCM_CHANNEL_ID,
          'tools:replace': 'android:value',
        },
      });
    }

    return config;
  });
}

function readFirebaseFromGoogleServices() {
  const filePath = path.resolve(__dirname, 'google-services.json');
  if (!fs.existsSync(filePath)) return null;

  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const client = json.client?.[0];
    const projectId = json.project_info?.project_id ?? '';

    return {
      apiKey: client?.api_key?.[0]?.current_key ?? '',
      authDomain: projectId ? `${projectId}.firebaseapp.com` : '',
      projectId,
      storageBucket: json.project_info?.storage_bucket ?? '',
      messagingSenderId: json.project_info?.project_number ?? '',
      appId: client?.client_info?.mobilesdk_app_id ?? '',
    };
  } catch (error) {
    console.warn('[app.config] Không đọc được google-services.json:', error);
    return null;
  }
}

function readFirebaseFromEnv() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  };
}

const firebaseFromGoogleServices = readFirebaseFromGoogleServices();
const firebaseFromEnv = readFirebaseFromEnv();
const firebase = firebaseFromGoogleServices ?? firebaseFromEnv;

if (
  firebaseFromGoogleServices &&
  firebaseFromEnv.projectId &&
  firebaseFromGoogleServices.projectId !== firebaseFromEnv.projectId
) {
  console.warn(
    `[app.config] .env project (${firebaseFromEnv.projectId}) khác google-services.json (${firebaseFromGoogleServices.projectId}). Dùng google-services.json.`,
  );
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [...appJson.expo.plugins, withFcmNotificationChannel],
    extra: {
      ...appJson.expo.extra,
      firebase,
    },
  },
};
