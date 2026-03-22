/**
 * wordLookup.ts
 *
 * Efficient lookup of words from the pre-built word index.
 * Uses lazy loading to avoid bundling the large word-index.json (~16MB)
 * into the initial client bundle.
 *
 * Data files:
 *   - word-entries.json  – word metadata keyed by id
 *   - word-index.json    – videoId -> [{wordId, sentenceIdx, en, ko, surfaceForm}]
 */

import type { CefrLevel } from "@/types/level";
import { CEFR_ORDER } from "@/types/level";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WordEntry {
  id: string;
  canonical: string;
  pos: string;
  meaning_ko: string;
  cefr: string;
  theme: string[];
  register: string;
  learner_value: string;
  forms: string[];
  example_en: string;
  example_ko: string;
}

export interface VideoWord {
  word: WordEntry;
  sentence: { en: string; ko: string; sentenceIdx: number };
  surfaceForm: string;
}

/** Shape of each row stored in the index file */
interface IndexRow {
  wordId: string;
  sentenceIdx: number;
  en: string;
  ko: string;
  surfaceForm: string;
}

// ---------------------------------------------------------------------------
// Lazy-loaded data (loaded on first use, not at bundle time)
// ---------------------------------------------------------------------------

let _entries: Record<string, WordEntry> | null = null;
let _videoIndex: Record<string, IndexRow[]> | null = null;
let _entriesPromise: Promise<Record<string, WordEntry>> | null = null;
let _videoIndexPromise: Promise<Record<string, IndexRow[]>> | null = null;

async function loadEntries(): Promise<Record<string, WordEntry>> {
  if (_entries) return _entries;
  if (!_entriesPromise) {
    _entriesPromise = import("../data/word-entries.json").then((m) => {
      _entries = m.default as Record<string, WordEntry>;
      return _entries;
    });
  }
  return _entriesPromise;
}

async function loadVideoIndex(): Promise<Record<string, IndexRow[]>> {
  if (_videoIndex) return _videoIndex;
  if (!_videoIndexPromise) {
    _videoIndexPromise = import("../data/word-index.json").then((m) => {
      _videoIndex = m.default as Record<string, IndexRow[]>;
      return _videoIndex;
    });
  }
  return _videoIndexPromise;
}

/** Preload both data files. Call early if you know you'll need them. */
export async function preloadWordData(): Promise<void> {
  await Promise.all([loadEntries(), loadVideoIndex()]);
}

// Synchronous accessors (return null if not yet loaded)
function getEntriesSync(): Record<string, WordEntry> | null {
  return _entries;
}
function getVideoIndexSync(): Record<string, IndexRow[]> | null {
  return _videoIndex;
}

// ---------------------------------------------------------------------------
// CEFR helpers
// ---------------------------------------------------------------------------

const CEFR_ORDER_MAP: Record<string, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

// ---------------------------------------------------------------------------
// Level-to-CEFR range mapping (user level +/- 1)
// ---------------------------------------------------------------------------

function getCefrRangeForLevel(level: CefrLevel): Set<string> {
  const idx = CEFR_ORDER.indexOf(level);
  const result = new Set<string>();
  for (let i = Math.max(0, idx - 1); i <= Math.min(CEFR_ORDER.length - 1, idx + 1); i++) {
    result.add(CEFR_ORDER[i]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

const LEARNER_VALUE_ORDER: Record<string, number> = {
  essential: 0,
  useful: 1,
  supplementary: 2,
};

const POS_ORDER: Record<string, number> = {
  verb: 0,
  adjective: 1,
  noun: 2,
  adverb: 3,
};

/**
 * Numeric sort key for a word. Lower is better (higher priority).
 */
function sortKey(entry: WordEntry): number {
  const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
  const posRank = POS_ORDER[entry.pos] ?? 4;
  // Primary: learner_value, Secondary: POS
  return valueRank * 100 + posRank;
}

// ---------------------------------------------------------------------------
// Internal sync helpers (used after data is loaded)
// ---------------------------------------------------------------------------

function _getWordsForVideoSync(
  entries: Record<string, WordEntry>,
  videoIndex: Record<string, IndexRow[]>,
  videoId: string,
): VideoWord[] {
  const rows = videoIndex[videoId];
  if (!rows || rows.length === 0) return [];

  const results: VideoWord[] = [];

  for (const row of rows) {
    const entry = entries[row.wordId];
    if (!entry) continue;

    results.push({
      word: entry,
      sentence: {
        en: row.en,
        ko: row.ko,
        sentenceIdx: row.sentenceIdx,
      },
      surfaceForm: row.surfaceForm,
    });
  }

  results.sort((a, b) => {
    const keyDiff = sortKey(a.word) - sortKey(b.word);
    if (keyDiff !== 0) return keyDiff;
    return a.sentence.sentenceIdx - b.sentence.sentenceIdx;
  });

  return results;
}

// ---------------------------------------------------------------------------
// Public API (async — loads data on first call)
// ---------------------------------------------------------------------------

/**
 * Get all words that appear in a specific video.
 *
 * Results are sorted by learner_value (essential first), then by POS
 * priority (verb > adjective > noun > adverb > others), then by
 * sentenceIdx for stable ordering.
 */
export async function getWordsForVideo(videoId: string): Promise<VideoWord[]> {
  const [entries, videoIndex] = await Promise.all([loadEntries(), loadVideoIndex()]);
  return _getWordsForVideoSync(entries, videoIndex, videoId);
}

/**
 * Synchronous version — returns [] if data hasn't been loaded yet.
 * Use preloadWordData() to ensure data is available before calling this.
 */
export function getWordsForVideoSync(videoId: string): VideoWord[] {
  const entries = getEntriesSync();
  const videoIndex = getVideoIndexSync();
  if (!entries || !videoIndex) return [];
  return _getWordsForVideoSync(entries, videoIndex, videoId);
}

/**
 * Get all words for a video filtered by CEFR level range.
 */
export async function getWordsByLevel(
  videoId: string,
  minLevel: string = "A1",
  maxLevel: string = "C2",
): Promise<VideoWord[]> {
  const all = await getWordsForVideo(videoId);
  const minOrder = CEFR_ORDER_MAP[minLevel.toUpperCase()] ?? 0;
  const maxOrder = CEFR_ORDER_MAP[maxLevel.toUpperCase()] ?? 5;

  return all.filter((vw) => {
    const order = CEFR_ORDER_MAP[vw.word.cefr.toUpperCase()] ?? 0;
    return order >= minOrder && order <= maxOrder;
  });
}

// ---------------------------------------------------------------------------
// Smart priming (level-aware + familiarity-aware)
// ---------------------------------------------------------------------------

/**
 * Smart priming that considers user level and familiarity.
 *
 * Words are scored (lower = higher priority):
 *   - Level match bonus:   -200 if word CEFR falls within user's range (level +/- 1)
 *   - learner_value:       essential=0, useful=100, supplementary=200
 *   - POS priority:        verb=0, adjective=1, noun=2, adverb=3, others=4
 *   - Familiarity penalty: count >= 3 -> +1000, count 1-2 -> +300
 *   - Hard floor penalty:  CEFR distance >= 2 -> +500
 *
 * Deduplication: one word per sentence (best score wins), then one
 * occurrence per word id (first wins).
 */
export async function getSmartPrimingWords(
  videoId: string,
  userLevel: CefrLevel,
  familiarWords: Record<string, { count: number }>,
  count: number = 3,
): Promise<VideoWord[]> {
  const all = await getWordsForVideo(videoId);
  if (all.length === 0) return [];

  const allowedCefr = getCefrRangeForLevel(userLevel);
  const userIdx = CEFR_ORDER.indexOf(userLevel);

  function smartScore(vw: VideoWord): number {
    const entry = vw.word;

    // Base: learner_value + POS
    const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
    const posRank = POS_ORDER[entry.pos] ?? 4;
    let score = valueRank * 100 + posRank;

    // Level match bonus
    if (allowedCefr.has(entry.cefr.toUpperCase())) {
      score -= 200;
    }

    // Hard floor penalty: CEFR distance >= 2
    const wordIdx = CEFR_ORDER_MAP[entry.cefr.toUpperCase()] ?? 0;
    const distance = Math.abs(wordIdx - userIdx);
    if (distance >= 2) {
      score += 500;
    }

    // Familiarity penalty
    const familiar = familiarWords[entry.id];
    if (familiar) {
      if (familiar.count >= 3) {
        score += 1000;
      } else if (familiar.count >= 1) {
        score += 300;
      }
    }

    return score;
  }

  // Deduplicate by sentenceIdx: keep the best-scored word per sentence
  const bestBySentence = new Map<number, { vw: VideoWord; score: number }>();

  for (const vw of all) {
    const idx = vw.sentence.sentenceIdx;
    const score = smartScore(vw);
    const existing = bestBySentence.get(idx);
    if (!existing || score < existing.score) {
      bestBySentence.set(idx, { vw, score });
    }
  }

  const deduped = Array.from(bestBySentence.values());
  deduped.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.vw.sentence.sentenceIdx - b.vw.sentence.sentenceIdx;
  });

  // Deduplicate by word id: same word in different sentences → keep first
  const seenWordIds = new Set<string>();
  const unique: VideoWord[] = [];
  for (const { vw } of deduped) {
    if (seenWordIds.has(vw.word.id)) continue;
    seenWordIds.add(vw.word.id);
    unique.push(vw);
  }

  return unique.slice(0, count);
}

/**
 * Synchronous smart priming — returns [] if data hasn't been loaded yet.
 * Use preloadWordData() to ensure data is available.
 */
export function getSmartPrimingWordsSync(
  videoId: string,
  userLevel: CefrLevel,
  familiarWords: Record<string, { count: number }>,
  count: number = 3,
): VideoWord[] {
  const entries = getEntriesSync();
  const videoIndex = getVideoIndexSync();
  if (!entries || !videoIndex) return [];

  const all = _getWordsForVideoSync(entries, videoIndex, videoId);
  if (all.length === 0) return [];

  const allowedCefr = getCefrRangeForLevel(userLevel);
  const userIdx = CEFR_ORDER.indexOf(userLevel);

  function smartScore(vw: VideoWord): number {
    const entry = vw.word;
    const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
    const posRank = POS_ORDER[entry.pos] ?? 4;
    let score = valueRank * 100 + posRank;
    if (allowedCefr.has(entry.cefr.toUpperCase())) score -= 200;
    const wordIdx = CEFR_ORDER_MAP[entry.cefr.toUpperCase()] ?? 0;
    if (Math.abs(wordIdx - userIdx) >= 2) score += 500;
    const familiar = familiarWords[entry.id];
    if (familiar) {
      if (familiar.count >= 3) score += 1000;
      else if (familiar.count >= 1) score += 300;
    }
    return score;
  }

  const bestBySentence = new Map<number, { vw: VideoWord; score: number }>();
  for (const vw of all) {
    const idx = vw.sentence.sentenceIdx;
    const score = smartScore(vw);
    const existing = bestBySentence.get(idx);
    if (!existing || score < existing.score) {
      bestBySentence.set(idx, { vw, score });
    }
  }

  const deduped = Array.from(bestBySentence.values());
  deduped.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.vw.sentence.sentenceIdx - b.vw.sentence.sentenceIdx;
  });

  const seenWordIds = new Set<string>();
  const unique: VideoWord[] = [];
  for (const { vw } of deduped) {
    if (seenWordIds.has(vw.word.id)) continue;
    seenWordIds.add(vw.word.id);
    unique.push(vw);
  }

  return unique.slice(0, count);
}

/**
 * Look up a single word entry by its id.
 */
export async function getWordEntry(wordId: string): Promise<WordEntry | undefined> {
  const entries = await loadEntries();
  return entries[wordId];
}

/**
 * Synchronous word entry lookup — returns undefined if data not loaded.
 */
export function getWordEntrySync(wordId: string): WordEntry | undefined {
  return _entries?.[wordId];
}

/**
 * Get the full word dictionary (all entries keyed by id).
 */
export async function getAllWordEntries(): Promise<Record<string, WordEntry>> {
  return loadEntries();
}
