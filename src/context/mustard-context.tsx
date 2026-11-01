import * as Crypto from 'expo-crypto';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CURATED_VERSES, getGrowthStage } from '@/constants/mustard-data';
import { LIMITS } from '@/constants/limits';
import { requestReminderPermissions, syncScheduledReminders } from '@/services/notifications';
import {
  DEFAULT_SETTINGS,
  loadInitialData,
  saveBookmarks,
  savePrayers,
  saveReminders,
  saveSettings,
} from '@/services/storage';
import {
  getDailyEncouragingVerse,
  hydrateVersesFromYouVersion,
  resolveYouVersionAppKey,
} from '@/services/youversion';
import {
  EncouragingVerse,
  GrowthStage,
  MustardSettings,
  PrayerCategory,
  PrayerRequest,
  ReminderItem,
} from '@/types/mustard';

interface MustardContextValue {
  isReady: boolean;
  prayers: PrayerRequest[];
  activePrayers: PrayerRequest[];
  answeredPrayers: PrayerRequest[];
  reminders: ReminderItem[];
  verses: EncouragingVerse[];
  dailyVerse: EncouragingVerse;
  bookmarkedVerseIds: string[];
  settings: MustardSettings;
  growthStage: GrowthStage;
  totalPrayedMoments: number;
  addPrayer: (input: {
    title: string;
    details: string;
    category: PrayerCategory;
  }) => void;
  updatePrayer: (
    id: string,
    updates: Partial<Pick<PrayerRequest, 'title' | 'details' | 'category'>>
  ) => void;
  deletePrayer: (id: string) => void;
  recordPrayedNow: (id: string) => void;
  addPrayerNote: (prayerId: string, text: string) => void;
  markPrayerAnswered: (
    id: string,
    reflection?: string,
    answeredAtIso?: string
  ) => void;
  reopenPrayer: (id: string) => void;
  addReminder: (input: {
    label: string;
    hour: number;
    minute: number;
    message: string;
    days?: number[];
  }) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  toggleBookmarkVerse: (verseId: string) => void;
  updateSettings: (partial: Partial<MustardSettings>) => void;
  refreshVersesFromYouVersion: () => Promise<number>;
  /** Prompts for notification permission (user-initiated only) and reschedules reminders. */
  enableReminderNotifications: () => Promise<boolean>;
}

const newId = (prefix: string) => `${prefix}-${Crypto.randomUUID()}`;

const MustardContext = createContext<MustardContextValue | null>(null);

export function MustardProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [bookmarkedVerseIds, setBookmarkedVerseIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<MustardSettings>(DEFAULT_SETTINGS);
  const [verses, setVerses] = useState<EncouragingVerse[]>(CURATED_VERSES);
  const [permissionVersion, setPermissionVersion] = useState(0);

  useEffect(() => {
    let mounted = true;
    loadInitialData().then((data) => {
      if (!mounted) return;
      setPrayers(data.prayers);
      setReminders(data.reminders);
      setBookmarkedVerseIds(data.bookmarkedVerseIds);
      setSettings(data.settings);
      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    syncScheduledReminders(reminders, settings.notificationsEnabled);
  }, [isReady, reminders, settings.notificationsEnabled, permissionVersion]);

  // Persistence lives in effects (not inside state updaters, which must stay pure).
  // Writes for each key are serialized in the storage layer.
  useEffect(() => {
    if (isReady) savePrayers(prayers);
  }, [isReady, prayers]);

  useEffect(() => {
    if (isReady) saveReminders(reminders);
  }, [isReady, reminders]);

  useEffect(() => {
    if (isReady) saveBookmarks(bookmarkedVerseIds);
  }, [isReady, bookmarkedVerseIds]);

  useEffect(() => {
    if (isReady) saveSettings(settings);
  }, [isReady, settings]);

  const enableReminderNotifications = useCallback(async () => {
    const granted = await requestReminderPermissions();
    setPermissionVersion((v) => v + 1);
    return granted;
  }, []);

  const activePrayers = useMemo(
    () =>
      prayers
        .filter((p) => !p.isAnswered)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [prayers]
  );

  const answeredPrayers = useMemo(
    () =>
      prayers
        .filter((p) => p.isAnswered)
        .sort(
          (a, b) =>
            new Date(b.answeredAt || b.createdAt).getTime() -
            new Date(a.answeredAt || a.createdAt).getTime()
        ),
    [prayers]
  );

  const growthStage = useMemo(
    () => getGrowthStage(answeredPrayers.length),
    [answeredPrayers.length]
  );

  const totalPrayedMoments = useMemo(
    () => prayers.reduce((sum, p) => sum + (p.prayedCount || 0), 0),
    [prayers]
  );

  const dailyVerse = useMemo(() => {
    const base = getDailyEncouragingVerse();
    const hydrated = verses.find((v) => v.id === base.id) || base;
    return {
      ...hydrated,
      isBookmarked: bookmarkedVerseIds.includes(hydrated.id),
    };
  }, [verses, bookmarkedVerseIds]);

  const enrichedVerses = useMemo(
    () =>
      verses.map((v) => ({
        ...v,
        isBookmarked: bookmarkedVerseIds.includes(v.id),
      })),
    [verses, bookmarkedVerseIds]
  );

  const persistPrayers = useCallback((updater: (prev: PrayerRequest[]) => PrayerRequest[]) => {
    setPrayers(updater);
  }, []);

  const addPrayer = useCallback(
    (input: { title: string; details: string; category: PrayerCategory }) => {
      const now = new Date().toISOString();
      const newPrayer: PrayerRequest = {
        id: newId('prayer'),
        title: input.title.trim().slice(0, LIMITS.PRAYER_TITLE),
        details: input.details.trim().slice(0, LIMITS.PRAYER_DETAILS),
        category: input.category,
        createdAt: now,
        prayedCount: 1,
        lastPrayedAt: now,
        isAnswered: false,
        notes: [],
      };
      persistPrayers((prev) => [newPrayer, ...prev]);
    },
    [persistPrayers]
  );

  const updatePrayer = useCallback(
    (
      id: string,
      updates: Partial<Pick<PrayerRequest, 'title' | 'details' | 'category'>>
    ) => {
      persistPrayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [persistPrayers]
  );

  const deletePrayer = useCallback(
    (id: string) => {
      persistPrayers((prev) => prev.filter((p) => p.id !== id));
    },
    [persistPrayers]
  );

  const recordPrayedNow = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      persistPrayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                prayedCount: (p.prayedCount || 0) + 1,
                lastPrayedAt: now,
              }
            : p
        )
      );
    },
    [persistPrayers]
  );

  const addPrayerNote = useCallback(
    (prayerId: string, text: string) => {
      const trimmed = text.trim().slice(0, LIMITS.NOTE);
      if (!trimmed) return;
      const newNote = {
        id: newId('note'),
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      persistPrayers((prev) =>
        prev.map((p) =>
          p.id === prayerId ? { ...p, notes: [newNote, ...p.notes] } : p
        )
      );
    },
    [persistPrayers]
  );

  const markPrayerAnswered = useCallback(
    (id: string, reflection?: string, answeredAtIso?: string) => {
      const answeredAt = answeredAtIso || new Date().toISOString();
      persistPrayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isAnswered: true,
                answeredAt,
                answeredReflection:
                  reflection?.trim().slice(0, LIMITS.REFLECTION) || p.answeredReflection,
              }
            : p
        )
      );
    },
    [persistPrayers]
  );

  const reopenPrayer = useCallback(
    (id: string) => {
      persistPrayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isAnswered: false,
                answeredAt: undefined,
              }
            : p
        )
      );
    },
    [persistPrayers]
  );

  const addReminder = useCallback(
    (input: {
      label: string;
      hour: number;
      minute: number;
      message: string;
      days?: number[];
    }) => {
      const newReminder: ReminderItem = {
        id: newId('rem'),
        label: input.label.trim().slice(0, LIMITS.REMINDER_LABEL) || 'Prayer Nudge',
        hour: input.hour,
        minute: input.minute,
        enabled: true,
        message:
          input.message.trim().slice(0, LIMITS.REMINDER_MESSAGE) ||
          'Pause for a quiet breath and lift up a prayer on your list.',
        days: input.days || [0, 1, 2, 3, 4, 5, 6],
      };
      setReminders((prev) =>
        [...prev, newReminder].sort(
          (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
        )
      );
    },
    []
  );

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleBookmarkVerse = useCallback((verseId: string) => {
    setBookmarkedVerseIds((prev) =>
      prev.includes(verseId) ? prev.filter((id) => id !== verseId) : [...prev, verseId]
    );
  }, []);

  const updateSettings = useCallback((partial: Partial<MustardSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const refreshVersesFromYouVersion = useCallback(async () => {
    const key = resolveYouVersionAppKey(settings.youVersionAppKey);
    if (!key) {
      return 0;
    }
    const nextVerses = await hydrateVersesFromYouVersion(
      CURATED_VERSES,
      key,
      settings.preferredBibleId,
      settings.preferredBibleAbbrev
    );
    setVerses(nextVerses);
    return nextVerses.filter((v) => v.source === 'youversion-api').length;
  }, [settings.youVersionAppKey, settings.preferredBibleId, settings.preferredBibleAbbrev]);

  const value = useMemo<MustardContextValue>(
    () => ({
      isReady,
      prayers,
      activePrayers,
      answeredPrayers,
      reminders,
      verses: enrichedVerses,
      dailyVerse,
      bookmarkedVerseIds,
      settings,
      growthStage,
      totalPrayedMoments,
      addPrayer,
      updatePrayer,
      deletePrayer,
      recordPrayedNow,
      addPrayerNote,
      markPrayerAnswered,
      reopenPrayer,
      addReminder,
      toggleReminder,
      deleteReminder,
      toggleBookmarkVerse,
      updateSettings,
      refreshVersesFromYouVersion,
      enableReminderNotifications,
    }),
    [
      isReady,
      prayers,
      activePrayers,
      answeredPrayers,
      reminders,
      enrichedVerses,
      dailyVerse,
      bookmarkedVerseIds,
      settings,
      growthStage,
      totalPrayedMoments,
      addPrayer,
      updatePrayer,
      deletePrayer,
      recordPrayedNow,
      addPrayerNote,
      markPrayerAnswered,
      reopenPrayer,
      addReminder,
      toggleReminder,
      deleteReminder,
      toggleBookmarkVerse,
      updateSettings,
      refreshVersesFromYouVersion,
      enableReminderNotifications,
    ]
  );

  return <MustardContext.Provider value={value}>{children}</MustardContext.Provider>;
}

export function useMustard(): MustardContextValue {
  const ctx = useContext(MustardContext);
  if (!ctx) {
    throw new Error('useMustard must be used inside a MustardProvider');
  }
  return ctx;
}
