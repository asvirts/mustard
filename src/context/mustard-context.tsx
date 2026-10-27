import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { CURATED_VERSES, getGrowthStage } from '@/constants/mustard-data';
import { syncScheduledReminders } from '@/services/notifications';
import {
  DEFAULT_SETTINGS,
  loadInitialData,
  saveBookmarks,
  savePrayers,
  saveReminders,
  saveSettings,
} from '@/services/storage';
import { getDailyEncouragingVerse, hydrateVerseFromYouVersion } from '@/services/youversion';
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
}

const MustardContext = createContext<MustardContextValue | null>(null);

export function MustardProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [bookmarkedVerseIds, setBookmarkedVerseIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<MustardSettings>(DEFAULT_SETTINGS);
  const [verses, setVerses] = useState<EncouragingVerse[]>(CURATED_VERSES);

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
  }, [isReady, reminders, settings.notificationsEnabled]);

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
    setPrayers((prev) => {
      const next = updater(prev);
      savePrayers(next);
      return next;
    });
  }, []);

  const addPrayer = useCallback(
    (input: { title: string; details: string; category: PrayerCategory }) => {
      const now = new Date().toISOString();
      const newPrayer: PrayerRequest = {
        id: `prayer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: input.title.trim(),
        details: input.details.trim(),
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
      const trimmed = text.trim();
      if (!trimmed) return;
      const newNote = {
        id: `note-${Date.now()}`,
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
                answeredReflection: reflection?.trim() || p.answeredReflection,
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
        id: `rem-${Date.now()}`,
        label: input.label.trim() || 'Prayer Nudge',
        hour: input.hour,
        minute: input.minute,
        enabled: true,
        message:
          input.message.trim() ||
          'Pause for a quiet breath and lift up a prayer on your list.',
        days: input.days || [0, 1, 2, 3, 4, 5, 6],
      };
      setReminders((prev) => {
        const next = [...prev, newReminder].sort(
          (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
        );
        saveReminders(next);
        return next;
      });
    },
    []
  );

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      saveReminders(next);
      return next;
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveReminders(next);
      return next;
    });
  }, []);

  const toggleBookmarkVerse = useCallback((verseId: string) => {
    setBookmarkedVerseIds((prev) => {
      const exists = prev.includes(verseId);
      const next = exists ? prev.filter((id) => id !== verseId) : [...prev, verseId];
      saveBookmarks(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<MustardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const refreshVersesFromYouVersion = useCallback(async () => {
    const key = settings.youVersionAppKey.trim() || process.env.EXPO_PUBLIC_YVP_APP_KEY || '';
    if (!key) {
      return 0;
    }
    let updatedCount = 0;
    const nextVerses = await Promise.all(
      CURATED_VERSES.map(async (verse) => {
        const hydrated = await hydrateVerseFromYouVersion(
          verse,
          key,
          settings.preferredBibleId,
          settings.preferredBibleAbbrev
        );
        if (hydrated.source === 'youversion-api') {
          updatedCount += 1;
        }
        return hydrated;
      })
    );
    setVerses(nextVerses);
    return updatedCount;
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
