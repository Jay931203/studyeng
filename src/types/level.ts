// ---------------------------------------------------------------------------
// Central CEFR level type definitions
// All level-related code must import from this file — no distributed definitions.
// ---------------------------------------------------------------------------

import type { SupportedLocale } from '@/stores/useLocaleStore'

/** CEFR 6-level type */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/** Ordered CEFR levels for distance calculations */
export const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** Display labels for each CEFR level (Korean, kept for backward compatibility) */
export const LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: 'A1 입문',
  A2: 'A2 초급',
  B1: 'B1 중하급',
  B2: 'B2 중상급',
  C1: 'C1 고급',
  C2: 'C2 마스터',
}

/** Locale-aware display labels for each CEFR level */
export const LEVEL_LABELS_I18N: Record<string, Record<SupportedLocale, string>> = {
  A1: { ko: 'A1 입문', ja: 'A1 入門', 'zh-TW': 'A1 入門', vi: 'A1 So cap' },
  A2: { ko: 'A2 초급', ja: 'A2 初級', 'zh-TW': 'A2 初級', vi: 'A2 Co ban' },
  B1: { ko: 'B1 중하급', ja: 'B1 中級', 'zh-TW': 'B1 中級', vi: 'B1 Trung cap' },
  B2: { ko: 'B2 중상급', ja: 'B2 中上級', 'zh-TW': 'B2 中高級', vi: 'B2 Trung cao' },
  C1: { ko: 'C1 고급', ja: 'C1 上級', 'zh-TW': 'C1 高級', vi: 'C1 Cao cap' },
  C2: { ko: 'C2 마스터', ja: 'C2 最上級', 'zh-TW': 'C2 最高級', vi: 'C2 Thanh thao' },
}

/** Get a locale-aware level label, falling back to LEVEL_LABELS then raw level string */
export function getLevelLabel(level: string, locale: SupportedLocale): string {
  return LEVEL_LABELS_I18N[level]?.[locale] ?? LEVEL_LABELS[level as CefrLevel] ?? level
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
 * Accepts an optional locale for i18n-aware labels.
 */
export function displayLevelName(level: string, locale?: SupportedLocale): string {
  const loc = locale ?? 'ko'
  if (level in LEVEL_LABELS_I18N) return getLevelLabel(level, loc)
  if (level in LEGACY_LEVEL_MIGRATION) return getLevelLabel(LEGACY_LEVEL_MIGRATION[level], loc)
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
