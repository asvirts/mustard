import { CURATED_VERSES } from '@/constants/mustard-data';
import { EncouragingVerse } from '@/types/mustard';

const YOUVERSION_API_BASE = 'https://api.youversion.com/v1';

export interface YouVersionPassageResponse {
  id: string;
  content: string;
  reference: string;
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

  const url = `${YOUVERSION_API_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(
    usfm
  )}?format=text&include_headings=false&include_notes=false`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-YVP-App-Key': trimmedKey,
    },
  });

  if (!response.ok) {
    throw new Error(`YouVersion API returned ${response.status}`);
  }

  const data = (await response.json()) as YouVersionPassageResponse;
  return {
    id: data.id || usfm,
    reference: data.reference || usfm,
    content: stripHtmlTags(data.content || ''),
  };
}

/**
 * Refreshes a curated encouraging verse with live text from the YouVersion Platform API
 * if the user has configured their `X-YVP-App-Key` (or `EXPO_PUBLIC_YVP_APP_KEY`).
 */
export async function hydrateVerseFromYouVersion(
  verse: EncouragingVerse,
  appKey?: string,
  bibleId = 3034,
  versionAbbreviation = 'BSB'
): Promise<EncouragingVerse> {
  const effectiveKey = appKey?.trim() || process.env.EXPO_PUBLIC_YVP_APP_KEY || '';
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

export function getDailyEncouragingVerse(date = new Date()): EncouragingVerse {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return CURATED_VERSES[dayOfYear % CURATED_VERSES.length];
}
