import AsyncStorage from '@react-native-async-storage/async-storage';

import { INITIAL_PRAYERS, INITIAL_REMINDERS } from '@/constants/mustard-data';
import { getPlatformDb } from '@/services/sqlite';
import { MustardSettings, PrayerRequest, ReminderItem } from '@/types/mustard';

const STORAGE_KEYS = {
  PRAYERS: 'mustard_prayers_v1',
  REMINDERS: 'mustard_reminders_v1',
  BOOKMARKS: 'mustard_verse_bookmarks_v1',
  SETTINGS: 'mustard_settings_v1',
  INITIALIZED: 'mustard_initialized_v1',
};

export const DEFAULT_SETTINGS: MustardSettings = {
  youVersionAppKey: '',
  preferredBibleId: 111, // New International Version (NIV)
  preferredBibleAbbrev: 'NIV',
  notificationsEnabled: true,
  dailyPrayerGoal: 3,
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await getPlatformDb();
    if (db) {
      const row = (await db.getFirstAsync(
        'SELECT value FROM kv_store WHERE key = ?',
        [key]
      )) as { value?: string } | null;
      if (row && typeof row.value === 'string') {
        return JSON.parse(row.value) as T;
      }
    }
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore storage read errors and fall back
  }
  return fallback;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    const db = await getPlatformDb();
    if (db) {
      await db.runAsync(
        'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
        [key, serialized]
      );
    }
    await AsyncStorage.setItem(key, serialized);
  } catch {
    // Ignore storage write errors
  }
}

export async function loadInitialData(): Promise<{
  prayers: PrayerRequest[];
  reminders: ReminderItem[];
  bookmarkedVerseIds: string[];
  settings: MustardSettings;
}> {
  const initialized = await readJson<boolean>(STORAGE_KEYS.INITIALIZED, false);

  if (!initialized) {
    await writeJson(STORAGE_KEYS.PRAYERS, INITIAL_PRAYERS);
    await writeJson(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS);
    await writeJson(STORAGE_KEYS.BOOKMARKS, ['mat-17-20']);
    await writeJson(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    await writeJson(STORAGE_KEYS.INITIALIZED, true);

    return {
      prayers: INITIAL_PRAYERS,
      reminders: INITIAL_REMINDERS,
      bookmarkedVerseIds: ['mat-17-20'],
      settings: DEFAULT_SETTINGS,
    };
  }

  const [prayers, reminders, bookmarkedVerseIds, savedSettings] = await Promise.all([
    readJson<PrayerRequest[]>(STORAGE_KEYS.PRAYERS, INITIAL_PRAYERS),
    readJson<ReminderItem[]>(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS),
    readJson<string[]>(STORAGE_KEYS.BOOKMARKS, ['mat-17-20']),
    readJson<MustardSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  ]);

  const mergedSettings: MustardSettings = {
    ...DEFAULT_SETTINGS,
    ...savedSettings,
  };

  // Migrate previous default BSB (3034) settings to NIV (111)
  if (
    mergedSettings.preferredBibleId === 3034 &&
    mergedSettings.preferredBibleAbbrev === 'BSB'
  ) {
    mergedSettings.preferredBibleId = 111;
    mergedSettings.preferredBibleAbbrev = 'NIV';
    await writeJson(STORAGE_KEYS.SETTINGS, mergedSettings);
  }

  return {
    prayers,
    reminders,
    bookmarkedVerseIds,
    settings: mergedSettings,
  };
}

export async function savePrayers(prayers: PrayerRequest[]): Promise<void> {
  await writeJson(STORAGE_KEYS.PRAYERS, prayers);
}

export async function saveReminders(reminders: ReminderItem[]): Promise<void> {
  await writeJson(STORAGE_KEYS.REMINDERS, reminders);
}

export async function saveBookmarks(bookmarkedVerseIds: string[]): Promise<void> {
  await writeJson(STORAGE_KEYS.BOOKMARKS, bookmarkedVerseIds);
}

export async function saveSettings(settings: MustardSettings): Promise<void> {
  await writeJson(STORAGE_KEYS.SETTINGS, settings);
}
