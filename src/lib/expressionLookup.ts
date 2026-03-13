/**
 * expressionLookup.ts
 *
 * Efficient lookup of expressions from the pre-built expression index.
 *
 * Data files (v2):
 *   - expression-entries-v2.json  (~1MB) – expression metadata keyed by id
 *   - expression-index-v2.json   (~14MB) – videoId -> [{exprId, sentenceIdx, en, ko}]
 */

import expressionEntriesData from "../data/expression-entries-v2.json";
import expressionIndexData from "../data/expression-index-v2.json";
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
// Internal data (typed once at module level)
// ---------------------------------------------------------------------------

const entries = expressionEntriesData as Record<string, ExpressionEntry>;
const videoIndex = expressionIndexData as Record<string, IndexRow[]>;

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all expressions that appear in a specific video.
 *
 * Results are sorted by learner_value (essential first), then by category
 * priority, then by sentenceIdx for stable ordering.
 */
export function getExpressionsForVideo(videoId: string): VideoExpression[] {
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

/**
 * Get all expressions for a video filtered by CEFR level range.
 *
 * @param videoId   YouTube video ID
 * @param minLevel  Minimum CEFR level (inclusive), e.g. "A1"
 * @param maxLevel  Maximum CEFR level (inclusive), e.g. "B2"
 */
export function getExpressionsByLevel(
  videoId: string,
  minLevel: string = "A1",
  maxLevel: string = "C2",
): VideoExpression[] {
  const all = getExpressionsForVideo(videoId);
  const minOrder = CEFR_ORDER_MAP[minLevel.toUpperCase()] ?? 0;
  const maxOrder = CEFR_ORDER_MAP[maxLevel.toUpperCase()] ?? 5;

  return all.filter((ve) => {
    const order = CEFR_ORDER_MAP[ve.expression.cefr.toUpperCase()] ?? 0;
    return order >= minOrder && order <= maxOrder;
  });
}

/**
 * Get the top N "priming" expressions for a video — the best ones for a
 * preview card or pre-lesson primer.
 *
 * Priority:
 *   1. essential > useful > enrichment
 *   2. idiom > phrasal_verb > collocation > fixed_expression > rest
 *
 * Deduplication: when multiple expressions share the same sentence (same
 * sentenceIdx), only the highest-priority expression is kept.
 *
 * @param videoId  YouTube video ID
 * @param count    Maximum number of expressions to return (default 3)
 */
export function getPrimingExpressions(
  videoId: string,
  count: number = 3,
): VideoExpression[] {
  const all = getExpressionsForVideo(videoId);
  if (all.length === 0) return [];

  // Deduplicate by sentenceIdx: keep the best expression per sentence
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

  // Deduplicate by expression id: same expression in different sentences → keep first
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
 *
 * Expressions are scored (lower = higher priority):
 *   - Level match bonus:   -200 if expression CEFR falls within user's range (level +/- 1)
 *   - learner_value:       essential=0, useful=100, enrichment=200
 *   - category:            idiom=0 ... filler=8
 *   - Familiarity penalty: count >= 3 -> +1000, count 1-2 -> +300
 *   - Hard floor penalty:  CEFR distance >= 2 -> +500
 *
 * Deduplication: one expression per sentence (best score wins), then one
 * occurrence per expression id (first wins).
 *
 * @param videoId        YouTube video ID
 * @param userLevel      CefrLevel (A1-C2)
 * @param familiarExprs  Record<exprId, { count: number }> from familiarity store
 * @param count          Max expressions to return (default 3)
 */
export function getSmartPrimingExpressions(
  videoId: string,
  userLevel: CefrLevel,
  familiarExprs: Record<string, { count: number }>,
  count: number = 3,
): VideoExpression[] {
  const all = getExpressionsForVideo(videoId);
  if (all.length === 0) return [];

  const allowedCefr = getCefrRangeForLevel(userLevel);
  const userIdx = CEFR_ORDER.indexOf(userLevel);

  function smartScore(ve: VideoExpression): number {
    const entry = ve.expression;

    // Base: learner_value + category
    const valueRank = LEARNER_VALUE_ORDER[entry.learner_value] ?? 9;
    const categoryRank = CATEGORY_ORDER[entry.category] ?? 9;
    let score = valueRank * 100 + categoryRank;

    // Level match bonus
    if (allowedCefr.has(entry.cefr.toUpperCase())) {
      score -= 200;
    }

    // Hard floor penalty: CEFR distance >= 2
    const exprIdx = CEFR_ORDER_MAP[entry.cefr.toUpperCase()] ?? 0;
    const distance = Math.abs(exprIdx - userIdx);
    if (distance >= 2) {
      score += 500;
    }

    // Familiarity penalty
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

  // Deduplicate by sentenceIdx: keep the best-scored expression per sentence
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

  // Deduplicate by expression id: same expression in different sentences → keep first
  const seenExprIds = new Set<string>();
  const unique: VideoExpression[] = [];
  for (const { ve } of deduped) {
    if (seenExprIds.has(ve.expression.id)) continue;
    seenExprIds.add(ve.expression.id);
    unique.push(ve);
  }

  return unique.slice(0, count);
}
