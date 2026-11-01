import { Platform } from 'react-native';

import { ReminderItem } from '@/types/mustard';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

type NotificationsModule = typeof import('expo-notifications');
let handlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule> {
  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    // Without a handler, notifications fired while the app is open are not shown.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }
  return Notifications;
}

async function hasReminderPermission(Notifications: NotificationsModule): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/**
 * Asks the user for notification permission. Only call this in response to a user
 * action (enabling reminders, adding a nudge, sending a test) — never on launch.
 */
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
    const Notifications = await loadNotifications();
    if (await hasReminderPermission(Notifications)) {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted);
  } catch {
    return false;
  }
}

async function scheduleAll(
  reminders: ReminderItem[],
  notificationsEnabled: boolean
): Promise<number> {
  if (Platform.OS === 'web') {
    // Web has no scheduled local notifications; nothing is actually scheduled.
    return 0;
  }

  try {
    const Notifications = await loadNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!notificationsEnabled) {
      return 0;
    }

    // Never prompt here: this runs automatically on launch and on every change.
    if (!(await hasReminderPermission(Notifications))) {
      return 0;
    }

    let scheduledCount = 0;
    for (const reminder of reminders) {
      if (!reminder.enabled) {
        continue;
      }
      const content = {
        title: `🌱 ${reminder.label}`,
        body: reminder.message,
        sound: true,
      };
      const days = Array.from(new Set(reminder.days?.length ? reminder.days : ALL_DAYS));

      if (days.length === 7) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: reminder.hour,
            minute: reminder.minute,
          },
        });
      } else {
        for (const day of days) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: day + 1, // expo-notifications: 1 = Sunday ... 7 = Saturday
              hour: reminder.hour,
              minute: reminder.minute,
            },
          });
        }
      }
      scheduledCount += 1;
    }
    return scheduledCount;
  } catch {
    return 0;
  }
}

// Serializes sync runs so overlapping cancel/schedule sequences can't interleave
// and leave duplicate notifications behind.
let syncQueue: Promise<number> = Promise.resolve(0);

export function syncScheduledReminders(
  reminders: ReminderItem[],
  notificationsEnabled: boolean
): Promise<number> {
  const run = syncQueue.then(() => scheduleAll(reminders, notificationsEnabled));
  syncQueue = run.catch(() => 0);
  return run;
}

export async function sendTestGentleNudge(message?: string): Promise<boolean> {
  const body =
    message ||
    'Pause for a quiet breath. Lift up one person on your Pip prayer list right now.';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        new window.Notification('🌱 Pip Prayer Nudge', { body });
        return true;
      }
    }
    return false;
  }

  try {
    const Notifications = await loadNotifications();
    const granted = await requestReminderPermissions();
    if (!granted) {
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Pip Prayer Nudge',
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
