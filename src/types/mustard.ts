export type PrayerCategory =
  | 'Family'
  | 'Friends'
  | 'Health'
  | 'Gratitude'
  | 'Guidance'
  | 'World'
  | 'Personal';

export interface PrayerNote {
  id: string;
  text: string;
  createdAt: string; // ISO date string
}

export interface PrayerRequest {
  id: string;
  title: string;
  details: string;
  category: PrayerCategory;
  createdAt: string; // ISO date string
  prayedCount: number;
  lastPrayedAt?: string; // ISO date string
  isAnswered: boolean;
  answeredAt?: string; // ISO date string
  answeredReflection?: string;
  notes: PrayerNote[];
}

export interface ReminderItem {
  id: string;
  label: string;
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  message: string;
  days: number[]; // 0=Sun .. 6=Sat
}

export interface EncouragingVerse {
  id: string;
  usfm: string; // e.g., 'MAT.17.20'
  reference: string;
  versionAbbreviation: string;
  bibleId: number;
  text: string;
  theme: string;
  isBookmarked?: boolean;
  source?: 'curated' | 'youversion-api';
}

export interface MustardSettings {
  youVersionAppKey: string;
  preferredBibleId: number;
  preferredBibleAbbrev: string;
  notificationsEnabled: boolean;
  dailyPrayerGoal: number;
}

export interface GrowthStage {
  stage: number; // 1 to 6
  name: string;
  subtitle: string;
  description: string;
  minAnswered: number;
  nextThreshold: number | null;
}
