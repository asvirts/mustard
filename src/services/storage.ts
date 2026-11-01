import AsyncStorage from '@react-native-async-storage/async-storage';

import { INITIAL_PRAYERS, INITIAL_REMINDERS } from '@/constants/mustard-data';
import { LIMITS } from '@/constants/limits';
import { getSecret, setSecret } from '@/services/secure-store';
import { getPlatformDb } from '@/services/sqlite';
import {
  MustardSettings,
  PrayerCategory,
  PrayerNote,
  PrayerRequest,
  ReminderItem,
} from '@/types/mustard';

const STORAGE_KEYS = {
  PRAYERS: 'mustard_prayers_v1',
  REMINDERS: 'mustard_reminders_v1',
  BOOKMARKS: 'mustard_verse_bookmarks_v1',
  SETTINGS: 'mustard_settings_v1',
  INITIALIZED: 'mustard_initialized_v1',
};

const SECRET_KEYS = {
  YOUVERSION_APP_KEY: 'pip_youversion_app_key',
};

export const DEFAULT_SETTINGS: MustardSettings = {
  youVersionAppKey: '',
  preferredBibleId: 111, // New International Version (NIV)
  preferredBibleAbbrev: 'NIV',
  notificationsEnabled: true,
  dailyPrayerGoal: 3,
};

const PRAYER_CATEGORIES: readonly PrayerCategory[] = [
  'Family',
  'Friends',
  'Health',
  'Gratitude',
  'Guidance',
  'World',
  'Personal',
];

// ---------------------------------------------------------------------------
// Raw key/value access. Native uses SQLite only; web (or a SQLite failure)
// uses AsyncStorage. Data is never written to both stores.
// ---------------------------------------------------------------------------

async function readRaw(key: string): Promise<unknown> {
  try {
    const db = await getPlatformDb();
    if (db) {
      const row = (await db.getFirstAsync('SELECT value FROM kv_store WHERE key = ?', [
        key,
      ])) as { value?: string } | null;
      if (row && typeof row.value === 'string') {
        return JSON.parse(row.value);
      }
    }
    // Web, or legacy data written to AsyncStorage by older builds.
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage read / parse errors and fall back
  }
  return undefined;
}

// Per-key write chains so rapid successive saves can never land out of order.
const writeChains = new Map<string, Promise<void>>();

function writeJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  const run = (writeChains.get(key) ?? Promise.resolve()).then(() =>
    writeSerialized(key, serialized)
  );
  writeChains.set(key, run);
  return run;
}

async function writeSerialized(key: string, serialized: string): Promise<void> {
  try {
    const db = await getPlatformDb();
    if (db) {
      await db.runAsync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [
        key,
        serialized,
      ]);
      // Remove any legacy duplicate copy left in AsyncStorage by older builds.
      await AsyncStorage.removeItem(key).catch(() => undefined);
      return;
    }
    await AsyncStorage.setItem(key, serialized);
  } catch {
    // Ignore storage write errors
  }
}

// ---------------------------------------------------------------------------
// Validation / sanitization of persisted data
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return Number.isNaN(new Date(value).getTime()) ? undefined : value;
}

function int(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}

function sanitizeNote(value: unknown): PrayerNote | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const text = str(value.text, LIMITS.NOTE);
  if (!text) return null;
  return {
    id: value.id,
    text,
    createdAt: isoDate(value.createdAt) ?? new Date().toISOString(),
  };
}

function sanitizePrayer(value: unknown): PrayerRequest | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const title = str(value.title, LIMITS.PRAYER_TITLE);
  if (!title) return null;
  const category = PRAYER_CATEGORIES.includes(value.category as PrayerCategory)
    ? (value.category as PrayerCategory)
    : 'Personal';
  const isAnswered = value.isAnswered === true;
  return {
    id: value.id,
    title,
    details: str(value.details, LIMITS.PRAYER_DETAILS),
    category,
    createdAt: isoDate(value.createdAt) ?? new Date().toISOString(),
    prayedCount: int(value.prayedCount, 0, Number.MAX_SAFE_INTEGER, 0),
    lastPrayedAt: isoDate(value.lastPrayedAt),
    isAnswered,
    answeredAt: isAnswered ? isoDate(value.answeredAt) : undefined,
    answeredReflection:
      typeof value.answeredReflection === 'string'
        ? value.answeredReflection.slice(0, LIMITS.REFLECTION)
        : undefined,
    notes: Array.isArray(value.notes)
      ? value.notes.map(sanitizeNote).filter((n): n is PrayerNote => n !== null)
      : [],
  };
}

function sanitizeReminder(value: unknown): ReminderItem | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const days = Array.isArray(value.days)
    ? Array.from(
        new Set(value.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))
      ).sort()
    : [0, 1, 2, 3, 4, 5, 6];
  return {
    id: value.id,
    label: str(value.label, LIMITS.REMINDER_LABEL, 'Prayer Nudge') || 'Prayer Nudge',
    hour: int(value.hour, 0, 23, 8),
    minute: int(value.minute, 0, 59, 0),
    enabled: value.enabled === true,
    message: str(value.message, LIMITS.REMINDER_MESSAGE),
    days: days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6],
  };
}

function sanitizeList<T>(value: unknown, sanitize: (v: unknown) => T | null, fallback: T[]): T[] {
  if (!Array.isArray(value)) return fallback;
  return value.map(sanitize).filter((item): item is T => item !== null);
}

function sanitizeBookmarks(value: unknown): string[] {
  if (!Array.isArray(value)) return ['mat-17-20'];
  return Array.from(new Set(value.filter((v): v is string => typeof v === 'string')));
}

function sanitizeSettings(value: unknown): Omit<MustardSettings, 'youVersionAppKey'> {
  const s = isRecord(value) ? value : {};
  return {
    preferredBibleId: int(s.preferredBibleId, 1, 999999, DEFAULT_SETTINGS.preferredBibleId),
    preferredBibleAbbrev:
      str(s.preferredBibleAbbrev, LIMITS.BIBLE_ABBREV).trim() ||
      DEFAULT_SETTINGS.preferredBibleAbbrev,
    notificationsEnabled:
      typeof s.notificationsEnabled === 'boolean'
        ? s.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,
    dailyPrayerGoal: int(s.dailyPrayerGoal, 1, 100, DEFAULT_SETTINGS.dailyPrayerGoal),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loadInitialData(): Promise<{
  prayers: PrayerRequest[];
  reminders: ReminderItem[];
  bookmarkedVerseIds: string[];
  settings: MustardSettings;
}> {
  const initialized = (await readRaw(STORAGE_KEYS.INITIALIZED)) === true;

  if (!initialized) {
    await writeJson(STORAGE_KEYS.PRAYERS, INITIAL_PRAYERS);
    await writeJson(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS);
    await writeJson(STORAGE_KEYS.BOOKMARKS, ['mat-17-20']);
    await saveSettings(DEFAULT_SETTINGS);
    await writeJson(STORAGE_KEYS.INITIALIZED, true);

    return {
      prayers: INITIAL_PRAYERS,
      reminders: INITIAL_REMINDERS,
      bookmarkedVerseIds: ['mat-17-20'],
      settings: DEFAULT_SETTINGS,
    };
  }

  const [rawPrayers, rawReminders, rawBookmarks, rawSettings, storedKey] = await Promise.all([
    readRaw(STORAGE_KEYS.PRAYERS),
    readRaw(STORAGE_KEYS.REMINDERS),
    readRaw(STORAGE_KEYS.BOOKMARKS),
    readRaw(STORAGE_KEYS.SETTINGS),
    getSecret(SECRET_KEYS.YOUVERSION_APP_KEY),
  ]);

  // Older builds stored the API key in plain text alongside other settings.
  const legacyKey =
    isRecord(rawSettings) && typeof rawSettings.youVersionAppKey === 'string'
      ? rawSettings.youVersionAppKey.trim()
      : '';

  const settings: MustardSettings = {
    ...sanitizeSettings(rawSettings),
    youVersionAppKey: (storedKey || legacyKey).slice(0, LIMITS.API_KEY),
  };

  // Migrate previous default BSB (3034) settings to NIV (111)
  const migrateBsb =
    settings.preferredBibleId === 3034 && settings.preferredBibleAbbrev === 'BSB';
  if (migrateBsb) {
    settings.preferredBibleId = 111;
    settings.preferredBibleAbbrev = 'NIV';
  }
  if (migrateBsb || legacyKey) {
    // Re-saving moves the key into secure storage and strips it from plain storage.
    await saveSettings(settings);
  }

  const prayers = sanitizeList(rawPrayers, sanitizePrayer, INITIAL_PRAYERS);
  const reminders = sanitizeList(rawReminders, sanitizeReminder, INITIAL_REMINDERS);

  return {
    prayers,
    reminders,
    bookmarkedVerseIds: sanitizeBookmarks(rawBookmarks),
    settings,
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
  const { youVersionAppKey, ...publicSettings } = settings;
  await Promise.all([
    writeJson(STORAGE_KEYS.SETTINGS, publicSettings),
    setSecret(SECRET_KEYS.YOUVERSION_APP_KEY, youVersionAppKey.trim()),
  ]);
}
