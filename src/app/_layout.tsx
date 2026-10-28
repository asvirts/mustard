import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';

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
            tabBarActiveTintColor: COLORS.text,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              borderTopWidth: StyleSheet.hairlineWidth,
              height: Platform.OS === 'ios' ? 84 : 64,
              paddingTop: 8,
              paddingBottom: Platform.OS === 'ios' ? 24 : 10,
              elevation: 0,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.1,
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Prayers',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'heart' : 'heart-outline'}
                  size={21}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="answered"
            options={{
              title: 'Answered',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'leaf' : 'leaf-outline'}
                  size={21}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="verses"
            options={{
              title: 'Verses',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'book' : 'book-outline'}
                  size={21}
                  color={typeof color === 'string' ? color : COLORS.textMuted}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="reminders"
            options={{
              title: 'Reminders',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'notifications' : 'notifications-outline'}
                  size={21}
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
