/**
 * expressionLookup.ts
 *
 * Efficient lookup of expressions from the pre-built expression index.
 * Uses lazy loading to avoid bundling large JSON files into the initial bundle.
 *
 * Data files (v2):
 *   - expression-entries-v2.json  (~1MB) – expression metadata keyed by id
 *   - expression-index-v2.json   (~1MB) – videoId -> [{exprId, sentenceIdx, en, ko}]
 */

import type { CefrLevel } from "@/types/level";
import { CEFR_ORDER } from "@/types/level";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpressionEntry {
  id: string;
  canonical: string;
  meaning_ko: string;
  category: string;
  cefr: string;
  theme: string[];
  register: string;
  learner_value: string;
  videoCount: number;
}

export interface VideoExpression {
  expression: ExpressionEntry;
  sentence: { en: string; ko: string; sentenceIdx: number };
}

/** Shape of each row stored in the index file */
interface IndexRow {
  exprId: string;
  sentenceIdx: number;
  en: string;
  ko: string;
}

// ---------------------------------------------------------------------------
// Lazy-loaded data
// ---------------------------------------------------------------------------

let _entries: Record<string, ExpressionEntry> | null = null;
let _videoIndex: Record<string, IndexRow[]> | null = null;
let _entriesPromise: Promise<Record<string, ExpressionEntry>> | null = null;
let _videoIndexPromise: Promise<Record<string, IndexRow[]>> | null = null;

async function loadEntries(): Promise<Record<string, ExpressionEntry>> {
  if (_entries) return _entries;
  if (!_entriesPromise) {
    _entriesPromise = import("../data/expression-entries-v2.json").then((m) => {
      _entries = m.default as Record<string, ExpressionEntry>;
      return _entries;
    });
  }
  return _entriesPromise;
}

async function loadVideoIndex(): Promise<Record<string, IndexRow[]>> {
  if (_videoIndex) return _videoIndex;
  if (!_videoIndexPromise) {
    _videoIndexPromise = import("../data/expression-index-v2.json").then((m) => {
      _videoIndex = m.default as Record<string, IndexRow[]>;
      return _videoIndex;
    });
  }
  return _videoIndexPromise;
}

/** Preload both data files. */
export async function preloadExpressionData(): Promise<void> {
  await Promise.all([loadEntries(), loadVideoIndex()]);
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
  enrichment: 2,
};

const CATEGORY_ORDER: Record<string, number> = {
  idiom: 0,
  phrasal_verb: 1,
  collocation: 2,
  fixed_expression: 3,
  slang: 4,
  hedging: 5,
  discourse_marker: 6,
  exclamation: 7,
  filler: 8,
};

/**
 * Numeric sort key for an expression. Lower is better (higher priority).
 */
function sortKey(entry: ExpressionEntry): number {
  const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
  const categoryRank = CATEGORY_ORDER[entry.category] ?? 9;
  // Primary: learner_value, Secondary: category
  return valueRank * 100 + categoryRank;
}

// ---------------------------------------------------------------------------
// Internal sync helpers
// ---------------------------------------------------------------------------

function _getExpressionsForVideoSync(
  entries: Record<string, ExpressionEntry>,
  videoIndex: Record<string, IndexRow[]>,
  videoId: string,
): VideoExpression[] {
  const rows = videoIndex[videoId];
  if (!rows || rows.length === 0) return [];

  const results: VideoExpression[] = [];

  for (const row of rows) {
    const entry = entries[row.exprId];
    if (!entry) continue;

    results.push({
      expression: entry,
      sentence: {
        en: row.en,
        ko: row.ko,
        sentenceIdx: row.sentenceIdx,
      },
    });
  }

  results.sort((a, b) => {
    const keyDiff = sortKey(a.expression) - sortKey(b.expression);
    if (keyDiff !== 0) return keyDiff;
    return a.sentence.sentenceIdx - b.sentence.sentenceIdx;
  });

  return results;
}

// ---------------------------------------------------------------------------
// Public API (async)
// ---------------------------------------------------------------------------

/**
 * Get all expressions that appear in a specific video.
 */
export async function getExpressionsForVideo(videoId: string): Promise<VideoExpression[]> {
  const [entries, videoIndex] = await Promise.all([loadEntries(), loadVideoIndex()]);
  return _getExpressionsForVideoSync(entries, videoIndex, videoId);
}

/**
 * Synchronous version — returns [] if data not loaded yet.
 */
export function getExpressionsForVideoSync(videoId: string): VideoExpression[] {
  if (!_entries || !_videoIndex) return [];
  return _getExpressionsForVideoSync(_entries, _videoIndex, videoId);
}

/**
 * Get all expressions for a video filtered by CEFR level range.
 */
export async function getExpressionsByLevel(
  videoId: string,
  minLevel: string = "A1",
  maxLevel: string = "C2",
): Promise<VideoExpression[]> {
  const all = await getExpressionsForVideo(videoId);
  const minOrder = CEFR_ORDER_MAP[minLevel.toUpperCase()] ?? 0;
  const maxOrder = CEFR_ORDER_MAP[maxLevel.toUpperCase()] ?? 5;

  return all.filter((ve) => {
    const order = CEFR_ORDER_MAP[ve.expression.cefr.toUpperCase()] ?? 0;
    return order >= minOrder && order <= maxOrder;
  });
}

/**
 * Get the top N "priming" expressions for a video.
 */
export async function getPrimingExpressions(
  videoId: string,
  count: number = 3,
): Promise<VideoExpression[]> {
  const all = await getExpressionsForVideo(videoId);
  if (all.length === 0) return [];

  const bestBySentence = new Map<number, VideoExpression>();

  for (const ve of all) {
    const idx = ve.sentence.sentenceIdx;
    const existing = bestBySentence.get(idx);
    if (!existing || sortKey(ve.expression) < sortKey(existing.expression)) {
      bestBySentence.set(idx, ve);
    }
  }

  const deduped = Array.from(bestBySentence.values());
  deduped.sort((a, b) => {
    const keyDiff = sortKey(a.expression) - sortKey(b.expression);
    if (keyDiff !== 0) return keyDiff;
    return a.sentence.sentenceIdx - b.sentence.sentenceIdx;
  });

  const seenExprIds = new Set<string>();
  const unique: VideoExpression[] = [];
  for (const ve of deduped) {
    if (seenExprIds.has(ve.expression.id)) continue;
    seenExprIds.add(ve.expression.id);
    unique.push(ve);
  }

  return unique.slice(0, count);
}

// ---------------------------------------------------------------------------
// Smart priming (level-aware + familiarity-aware)
// ---------------------------------------------------------------------------

/**
 * Smart priming that considers user level and familiarity.
 */
export async function getSmartPrimingExpressions(
  videoId: string,
  userLevel: CefrLevel,
  familiarExprs: Record<string, { count: number }>,
  count: number = 3,
): Promise<VideoExpression[]> {
  const all = await getExpressionsForVideo(videoId);
  if (all.length === 0) return [];

  const allowedCefr = getCefrRangeForLevel(userLevel);
  const userIdx = CEFR_ORDER.indexOf(userLevel);

  function smartScore(ve: VideoExpression): number {
    const entry = ve.expression;

    const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
    const categoryRank = CATEGORY_ORDER[entry.category] ?? 9;
    let score = valueRank * 100 + categoryRank;

    if (allowedCefr.has(entry.cefr.toUpperCase())) {
      score -= 200;
    }

    const exprIdx = CEFR_ORDER_MAP[entry.cefr.toUpperCase()] ?? 0;
    const distance = Math.abs(exprIdx - userIdx);
    if (distance >= 2) {
      score += 500;
    }

    const familiar = familiarExprs[entry.id];
    if (familiar) {
      if (familiar.count >= 3) {
        score += 1000;
      } else if (familiar.count >= 1) {
        score += 300;
      }
    }

    return score;
  }

  const bestBySentence = new Map<number, { ve: VideoExpression; score: number }>();

  for (const ve of all) {
    const idx = ve.sentence.sentenceIdx;
    const score = smartScore(ve);
    const existing = bestBySentence.get(idx);
    if (!existing || score < existing.score) {
      bestBySentence.set(idx, { ve, score });
    }
  }

  const deduped = Array.from(bestBySentence.values());
  deduped.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.ve.sentence.sentenceIdx - b.ve.sentence.sentenceIdx;
  });

  const seenExprIds = new Set<string>();
  const unique: VideoExpression[] = [];
  for (const { ve } of deduped) {
    if (seenExprIds.has(ve.expression.id)) continue;
    seenExprIds.add(ve.expression.id);
    unique.push(ve);
  }

  return unique.slice(0, count);
}

/**
 * Synchronous smart priming — returns [] if data not loaded yet.
 */
export function getSmartPrimingExpressionsSync(
  videoId: string,
  userLevel: CefrLevel,
  familiarExprs: Record<string, { count: number }>,
  count: number = 3,
): VideoExpression[] {
  if (!_entries || !_videoIndex) return [];

  const all = _getExpressionsForVideoSync(_entries, _videoIndex, videoId);
  if (all.length === 0) return [];

  const allowedCefr = getCefrRangeForLevel(userLevel);
  const userIdx = CEFR_ORDER.indexOf(userLevel);

  function smartScore(ve: VideoExpression): number {
    const entry = ve.expression;
    const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
    const categoryRank = CATEGORY_ORDER[entry.category] ?? 9;
    let score = valueRank * 100 + categoryRank;
    if (allowedCefr.has(entry.cefr.toUpperCase())) score -= 200;
    const exprIdx = CEFR_ORDER_MAP[entry.cefr.toUpperCase()] ?? 0;
    if (Math.abs(exprIdx - userIdx) >= 2) score += 500;
    const familiar = familiarExprs[entry.id];
    if (familiar) {
      if (familiar.count >= 3) score += 1000;
      else if (familiar.count >= 1) score += 300;
    }
    return score;
  }

  const bestBySentence = new Map<number, { ve: VideoExpression; score: number }>();
  for (const ve of all) {
    const idx = ve.sentence.sentenceIdx;
    const score = smartScore(ve);
    const existing = bestBySentence.get(idx);
    if (!existing || score < existing.score) {
      bestBySentence.set(idx, { ve, score });
    }
  }

  const deduped = Array.from(bestBySentence.values());
  deduped.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.ve.sentence.sentenceIdx - b.ve.sentence.sentenceIdx;
  });

  const seenExprIds = new Set<string>();
  const unique: VideoExpression[] = [];
  for (const { ve } of deduped) {
    if (seenExprIds.has(ve.expression.id)) continue;
    seenExprIds.add(ve.expression.id);
    unique.push(ve);
  }

  return unique.slice(0, count);
}
