import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? Spacing.md : 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: Platform.OS === 'android' ? 0.5 : 0,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingTop: Spacing.sm,
          paddingBottom: bottomInset + Spacing.sm,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gemini"
        options={{
          title: 'Gemini',
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sparkles" color={color} />,
        }}
      />
    </Tabs>
  );
}
