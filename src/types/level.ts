// ---------------------------------------------------------------------------
// Central CEFR level type definitions
// All level-related code must import from this file — no distributed definitions.
// ---------------------------------------------------------------------------

/** CEFR 6-level type */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/** Ordered CEFR levels for distance calculations */
export const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** Display labels for each CEFR level */
export const LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: 'A1 입문',
  A2: 'A2 초급',
  B1: 'B1 중하급',
  B2: 'B2 중상급',
  C1: 'C1 고급',
  C2: 'C2 마스터',
}

/** Challenge target level (the level the user is trying to reach) */
export type ChallengeTransition = 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/**
 * Migration helper: map old 3-level strings to CEFR levels.
 * Used in persist store migrations for backward compatibility.
 */
export const LEGACY_LEVEL_MIGRATION: Record<string, CefrLevel> = {
  beginner: 'A1',
  intermediate: 'B1',
  advanced: 'C1',
}

/**
 * Display a level name with backward compatibility for legacy 3-level history entries.
 */
export function displayLevelName(level: string): string {
  if (level in LEVEL_LABELS) return LEVEL_LABELS[level as CefrLevel]
  if (level in LEGACY_LEVEL_MIGRATION) return LEVEL_LABELS[LEGACY_LEVEL_MIGRATION[level]]
  return level
}

/**
 * Map the app's 1-6 video difficulty scale to a CEFR level badge.
 */
export function difficultyToCefrLevel(difficulty: number): CefrLevel {
  if (difficulty <= 1) return 'A1'
  if (difficulty === 2) return 'A2'
  if (difficulty === 3) return 'B1'
  if (difficulty === 4) return 'B2'
  if (difficulty === 5) return 'C1'
  return 'C2'
}
