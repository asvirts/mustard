import { Platform } from 'react-native';

import { ReminderItem } from '@/types/mustard';

export async function requestReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        return true;
      }
      const result = await window.Notification.requestPermission();
      return result === 'granted';
    }
    return false;
  }

  try {
    const Notifications = await import('expo-notifications');
    const settings = await Notifications.getPermissionsAsync();
    if (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted);
  } catch {
    return false;
  }
}

export async function syncScheduledReminders(
  reminders: ReminderItem[],
  notificationsEnabled: boolean
): Promise<number> {
  if (Platform.OS === 'web') {
    return reminders.filter((r) => r.enabled).length;
  }

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!notificationsEnabled) {
      return 0;
    }

    const granted = await requestReminderPermissions();
    if (!granted) {
      return 0;
    }

    let scheduledCount = 0;
    for (const reminder of reminders) {
      if (!reminder.enabled) {
        continue;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🌱 ${reminder.label}`,
          body: reminder.message,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: reminder.minute,
        },
      });
      scheduledCount += 1;
    }
    return scheduledCount;
  } catch {
    return reminders.filter((r) => r.enabled).length;
  }
}

export async function sendTestGentleNudge(message?: string): Promise<boolean> {
  const body =
    message ||
    'Pause for a quiet breath. Lift up one person on your Mustard prayer list right now.';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        new window.Notification('🌱 Mustard Prayer Nudge', { body });
        return true;
      }
    }
    return false;
  }

  try {
    const Notifications = await import('expo-notifications');
    const granted = await requestReminderPermissions();
    if (!granted) {
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Mustard Prayer Nudge',
        body,
        sound: true,
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

export function formatReminderTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const paddedMin = minute < 10 ? `0${minute}` : `${minute}`;
  return `${hour12}:${paddedMin} ${period}`;
}
