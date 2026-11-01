import { CURATED_VERSES } from '@/constants/mustard-data';
import { EncouragingVerse } from '@/types/mustard';

const YOUVERSION_API_BASE = 'https://api.youversion.com/v1';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_REQUESTS = 3;
const USFM_PATTERN = /^[1-4]?[A-Z]{2,3}\.\d{1,3}(\.\d{1,3}(-\d{1,3})?)?$/;

export interface YouVersionPassageResponse {
  id: string;
  content: string;
  reference: string;
}

/**
 * Resolves the App Key to use. The user-entered key always wins.
 *
 * `EXPO_PUBLIC_*` variables are inlined into the JS bundle, so the env fallback is
 * restricted to development builds. In production `__DEV__` is `false` and the
 * minifier strips the inlined value from the bundle entirely.
 */
export function resolveYouVersionAppKey(userKey?: string): string {
  const trimmed = userKey?.trim();
  if (trimmed) return trimmed;
  if (__DEV__) {
    return process.env.EXPO_PUBLIC_YVP_APP_KEY?.trim() || '';
  }
  return '';
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
};

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function toPlainText(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidUsfm(usfm: string): boolean {
  return USFM_PATTERN.test(usfm);
}

/**
 * Fetches a single passage from the official YouVersion Platform REST API
 * (`GET /v1/bibles/{bible_id}/passages/{passage_id}`) when an X-YVP-App-Key is configured.
 */
export async function fetchYouVersionPassage(params: {
  appKey: string;
  bibleId: number;
  usfm: string;
}): Promise<YouVersionPassageResponse | null> {
  const { appKey, bibleId, usfm } = params;
  const trimmedKey = appKey.trim();
  if (!trimmedKey) {
    return null;
  }
  if (!Number.isInteger(bibleId) || bibleId <= 0) {
    throw new Error('Invalid Bible version ID.');
  }
  if (!isValidUsfm(usfm)) {
    throw new Error('Invalid USFM reference. Try a format like MAT.17.20.');
  }

  const url = `${YOUVERSION_API_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(
    usfm
  )}?format=text&include_headings=false&include_notes=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-YVP-App-Key': trimmedKey,
      },
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new Error('YouVersion API request timed out.');
    }
    throw new Error('Could not reach YouVersion API.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('YouVersion API rejected the App Key.');
    }
    if (response.status === 404) {
      throw new Error('Passage not found in this Bible version.');
    }
    throw new Error(`YouVersion API returned ${response.status}`);
  }

  const data: unknown = await response.json().catch(() => null);
  if (typeof data !== 'object' || data === null) {
    throw new Error('Unexpected response from YouVersion API.');
  }
  const record = data as Record<string, unknown>;
  const content = typeof record.content === 'string' ? record.content : '';
  return {
    id: typeof record.id === 'string' && record.id ? record.id : usfm,
    reference:
      typeof record.reference === 'string' && record.reference
        ? toPlainText(record.reference)
        : usfm,
    content: toPlainText(content),
  };
}

/**
 * Refreshes a curated encouraging verse with live text from the YouVersion Platform API
 * if an App Key is available (see `resolveYouVersionAppKey`).
 */
export async function hydrateVerseFromYouVersion(
  verse: EncouragingVerse,
  appKey?: string,
  bibleId = 111,
  versionAbbreviation = 'NIV'
): Promise<EncouragingVerse> {
  const effectiveKey = resolveYouVersionAppKey(appKey);
  if (!effectiveKey) {
    return verse;
  }

  try {
    const livePassage = await fetchYouVersionPassage({
      appKey: effectiveKey,
      bibleId,
      usfm: verse.usfm,
    });
    if (livePassage && livePassage.content) {
      return {
        ...verse,
        reference: livePassage.reference || verse.reference,
        text: livePassage.content,
        bibleId,
        versionAbbreviation,
        source: 'youversion-api',
      };
    }
  } catch {
    // Gracefully fall back to bundled Scripture text when offline or key is invalid
  }

  return verse;
}

/** Hydrates many verses with a small concurrency limit to avoid API rate limiting. */
export async function hydrateVersesFromYouVersion(
  verses: EncouragingVerse[],
  appKey: string,
  bibleId: number,
  versionAbbreviation: string
): Promise<EncouragingVerse[]> {
  const results: EncouragingVerse[] = new Array(verses.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < verses.length) {
      const index = nextIndex++;
      results[index] = await hydrateVerseFromYouVersion(
        verses[index],
        appKey,
        bibleId,
        versionAbbreviation
      );
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, verses.length) }, worker)
  );
  return results;
}

export function getDailyEncouragingVerse(date = new Date()): EncouragingVerse {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return CURATED_VERSES[dayOfYear % CURATED_VERSES.length];
}
