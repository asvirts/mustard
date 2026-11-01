/** Input length limits, shared by UI inputs and storage sanitization. */
export const LIMITS = {
  PRAYER_TITLE: 120,
  PRAYER_DETAILS: 2000,
  NOTE: 1000,
  REFLECTION: 2000,
  REMINDER_LABEL: 40,
  REMINDER_MESSAGE: 160,
  USFM: 40,
  API_KEY: 256,
  BIBLE_ABBREV: 12,
  BIBLE_ID: 6,
  DATE: 10,
} as const;
