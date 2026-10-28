import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { MotionProvider } from '@/components/delight';
import { COLORS } from '@/constants/mustard-data';
import { MustardProvider } from '@/context/mustard-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <MotionProvider>
      <MustardProvider>
        <StatusBar style="dark" />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.mustardDark,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 86 : 66,
              paddingTop: 6,
              paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Prayers',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="heart-outline"
                  size={size}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="answered"
            options={{
              title: 'Answered',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="leaf-outline"
                  size={size}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="verses"
            options={{
              title: 'Verses',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="book-outline"
                  size={size}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="reminders"
            options={{
              title: 'Reminders',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="notifications-outline"
                  size={size}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
        </Tabs>
      </MustardProvider>
    </MotionProvider>
  );
}
