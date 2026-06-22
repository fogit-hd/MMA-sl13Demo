import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { NotificationHistoryProvider } from '@/contexts/notification-history-context';
import '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaProvider>
      <NotificationHistoryProvider>
        <ThemeProvider
        value={{
          ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
          colors: {
            ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
            background: palette.background,
            card: palette.surface,
            text: palette.text,
            border: palette.border,
            primary: palette.tint,
          },
        }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Push Debug Panel', headerBackTitle: 'Back' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </NotificationHistoryProvider>
    </SafeAreaProvider>
  );
}
