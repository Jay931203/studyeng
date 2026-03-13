/**
 * wordLookup.ts
 *
 * Efficient lookup of words from the pre-built word index.
 *
 * Data files:
 *   - word-entries.json  – word metadata keyed by id
 *   - word-index.json    – videoId -> [{wordId, sentenceIdx, en, ko, surfaceForm}]
 */

import wordEntriesData from "../data/word-entries.json";
import wordIndexData from "../data/word-index.json";
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
// Internal data (typed once at module level)
// ---------------------------------------------------------------------------

const entries = wordEntriesData as Record<string, WordEntry>;
const videoIndex = wordIndexData as Record<string, IndexRow[]>;

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all words that appear in a specific video.
 *
 * Results are sorted by learner_value (essential first), then by POS
 * priority (verb > adjective > noun > adverb > others), then by
 * sentenceIdx for stable ordering.
 */
export function getWordsForVideo(videoId: string): VideoWord[] {
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

/**
 * Get all words for a video filtered by CEFR level range.
 *
 * @param videoId   YouTube video ID
 * @param minLevel  Minimum CEFR level (inclusive), e.g. "A1"
 * @param maxLevel  Maximum CEFR level (inclusive), e.g. "B2"
 */
export function getWordsByLevel(
  videoId: string,
  minLevel: string = "A1",
  maxLevel: string = "C2",
): VideoWord[] {
  const all = getWordsForVideo(videoId);
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
 *
 * @param videoId        YouTube video ID
 * @param userLevel      CefrLevel (A1-C2)
 * @param familiarWords  Record<wordId, { count: number }> from familiarity store
 * @param count          Max words to return (default 3)
 */
export function getSmartPrimingWords(
  videoId: string,
  userLevel: CefrLevel,
  familiarWords: Record<string, { count: number }>,
  count: number = 3,
): VideoWord[] {
  const all = getWordsForVideo(videoId);
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
 * Look up a single word entry by its id.
 */
export function getWordEntry(wordId: string): WordEntry | undefined {
  return entries[wordId];
}

/**
 * Get the full word dictionary (all entries keyed by id).
 */
export function getAllWordEntries(): Record<string, WordEntry> {
  return entries;
}
