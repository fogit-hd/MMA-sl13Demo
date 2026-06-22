import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { NotificationListItem } from '@/components/notifications/notification-list-item';
import { InfoCard } from '@/components/ui/info-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusChip } from '@/components/ui/status-chip';
import { Radius, Spacing } from '@/constants/theme';
import { useNotificationHistory } from '@/contexts/notification-history-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { displayForegroundNotification } from '@/services/pushNotificationService';
import { getFirebaseDiagnostics } from '@/utils/firebase-diagnostics';
import type { InboxNotification } from '@/types/notification';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tokenBoxBg = useThemeColor({}, 'surfaceMuted');
  const tokenBoxBorder = useThemeColor({}, 'border');

  const { notifications, unreadCount, addFromRemoteMessage, markAllAsRead } =
    useNotificationHistory();

  const { fcmToken, tokenError, permissionStatus, isLoading, register } = usePushNotifications({
    onTokenReceived: (token) => {
      console.log('[Home] FCM token ready:', token);
    },
  });

  const firebaseDiagnostics = useMemo(() => getFirebaseDiagnostics(), []);
  const firebaseProjectId = firebaseDiagnostics.jsProjectId || 'chưa cấu hình';
  const firebaseSenderId = firebaseDiagnostics.nativeSenderId || '';

  const permissionTone = useMemo(() => {
    if (permissionStatus === 'granted') return 'success';
    if (permissionStatus === 'denied') return 'danger';
    if (permissionStatus === 'unsupported') return 'warning';
    return 'neutral';
  }, [permissionStatus]);

  const permissionLabel = useMemo(() => {
    if (permissionStatus === 'granted') return 'Quyền thông báo: Đã cấp';
    if (permissionStatus === 'denied') return 'Quyền thông báo: Đã từ chối';
    if (permissionStatus === 'unsupported') return 'Môi trường không hỗ trợ Push';
    return 'Quyền thông báo: Chưa xác định';
  }, [permissionStatus]);

  const tokenDescription = useMemo(() => {
    if (fcmToken) return fcmToken;
    if (tokenError) return `Lỗi FCM: ${tokenError}`;
    if (permissionStatus === 'unsupported') return 'Push không hỗ trợ trên iOS Simulator.';
    if (permissionStatus === 'denied') return 'Bạn cần bật lại quyền thông báo trong Settings.';
    if (firebaseDiagnostics.needsRebuild) {
      return 'Native Firebase chưa khớp — chạy npm run build:debug (emulator) hoặc build:apk rồi cài lại app.';
    }
    return 'Chưa có FCM token. Nhấn "Xin quyền và lấy token mới".';
  }, [fcmToken, tokenError, permissionStatus, firebaseDiagnostics.needsRebuild]);

  const handleShareToken = async () => {
    if (!fcmToken) {
      Alert.alert('Chưa có token', 'Hãy xin quyền và lấy token trước.');
      return;
    }
    await Share.share({ message: fcmToken });
  };

  const handleLocalTest = async () => {
    const testMessage = {
      notification: {
        title: 'Test local notification',
        body: 'Nếu thấy banner này, foreground handler hoạt động đúng.',
      },
      data: { source: 'local-test' },
    };
    await displayForegroundNotification(testMessage);
    addFromRemoteMessage(testMessage, 'foreground');
  };

  const handleBellPress = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
  };

  const renderItem = ({ item }: { item: InboxNotification }) => (
    <NotificationListItem item={item} />
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <ThemedText type="title">Thông báo</ThemedText>
          <ThemedText tone="secondary">Lịch sử push từ FCM</ThemedText>
        </View>
        <NotificationBell unreadCount={unreadCount} onPress={handleBellPress} />
      </View>

      <InfoCard>
        <SectionHeader title="FCM Token" description="Dùng để gửi test từ Firebase Console." />
        <ThemedText type="caption" tone="secondary">
          JS config: {firebaseProjectId}
          {firebaseSenderId ? ` (sender ${firebaseSenderId})` : ''}
        </ThemedText>
        <ThemedText type="caption" tone={firebaseDiagnostics.configMismatch ? 'danger' : 'secondary'}>
          Native trong APK: {firebaseDiagnostics.nativeProjectId}
          {firebaseDiagnostics.configMismatch
            ? ' — KHÔNG KHỚP! Emulator: npm run build:debug rồi cài lại app.'
            : ''}
        </ThemedText>
        <ThemedText type="caption" tone="secondary">
          Gửi test: Firebase Console → project &quot;{firebaseProjectId}&quot; → Messaging →
          Send test message → dán token → nhập Title + Body.
        </ThemedText>
        <StatusChip label={permissionLabel} tone={permissionTone} />
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <ThemedText tone="secondary">Đang kiểm tra quyền và token...</ThemedText>
          </View>
        ) : (
          <ThemedText
            selectable
            type="caption"
            style={[styles.token, { backgroundColor: tokenBoxBg, borderColor: tokenBoxBorder }]}>
            {tokenDescription}
          </ThemedText>
        )}
        <PrimaryButton
          title="Xin quyền và lấy token mới"
          loading={isLoading}
          onPress={() => register({ forceRefresh: true })}
        />
        <View style={styles.actions}>
          <SecondaryButton
            title="Chia sẻ token"
            onPress={handleShareToken}
            disabled={!fcmToken}
            style={styles.actionButton}
          />
          <SecondaryButton title="Test local" onPress={handleLocalTest} style={styles.actionButton} />
        </View>
      </InfoCard>

      <SectionHeader
        title="Lịch sử thông báo"
        description={
          unreadCount > 0
            ? `${unreadCount} thông báo chưa đọc — bấm chuông để đánh dấu đã đọc`
            : 'Chưa có thông báo mới'
        }
      />
    </View>
  );

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={notifications}
        extraData={unreadCount}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <ThemedView variant="surfaceMuted" style={styles.emptyBox}>
            <ThemedText tone="secondary" type="caption">
              Chưa có thông báo. Gửi test từ Firebase hoặc nhấn Test local.
            </ThemedText>
          </ThemedView>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  headerBlock: {
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleText: {
    flex: 1,
    gap: Spacing.xs,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  token: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyBox: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
