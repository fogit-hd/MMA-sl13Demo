/**
 * Đồng bộ EXPO_PUBLIC_FIREBASE_* trong .env từ google-services.json (root).
 * Chạy: npm run sync:firebase
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const googleServicesPath = path.join(root, 'google-services.json');
const androidGoogleServicesPath = path.join(root, 'android', 'app', 'google-services.json');
const envPath = path.join(root, '.env');

function readGoogleServices() {
  if (!fs.existsSync(googleServicesPath)) {
    console.error('Không tìm thấy google-services.json ở thư mục gốc project.');
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
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
}

function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const firebaseBlock = '# Firebase — tự động từ google-services.json (npm run sync:firebase)';
  if (content.includes(firebaseBlock)) {
    return content.replace(firebaseBlock, `${firebaseBlock}\n${line}`);
  }

  return `${firebaseBlock}\n${line}\n\n${content}`;
}

function main() {
  const firebase = readGoogleServices();
  const keys = {
    EXPO_PUBLIC_FIREBASE_API_KEY: firebase.apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: firebase.authDomain,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: firebase.projectId,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: firebase.storageBucket,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebase.messagingSenderId,
    EXPO_PUBLIC_FIREBASE_APP_ID: firebase.appId,
  };

  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  for (const [key, value] of Object.entries(keys)) {
    envContent = upsertEnvValue(envContent, key, value);
  }

  fs.writeFileSync(envPath, envContent.trimEnd() + '\n', 'utf8');

  if (fs.existsSync(path.join(root, 'android', 'app'))) {
    fs.copyFileSync(googleServicesPath, androidGoogleServicesPath);
    console.log('Đã copy google-services.json → android/app/google-services.json');
  } else {
    console.log('Chưa có thư mục android/app — chạy npx expo prebuild --platform android trước.');
  }

  console.log('\nĐã đồng bộ .env từ google-services.json:');
  console.log(`  project_id: ${firebase.projectId}`);
  console.log(`  sender_id:  ${firebase.messagingSenderId}`);
  console.log('\nTiếp theo:');
  console.log('  1. npm run sync:firebase   (đã chạy — đảm bảo android/app/google-services.json tồn tại)');
  console.log('  2. cd android && .\\gradlew :app:processReleaseGoogleServices assembleRelease');
  console.log('  3. adb install -r android\\app\\build\\outputs\\apk\\release\\app-release.apk');
}

main();
