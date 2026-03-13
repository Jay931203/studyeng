'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import expressionEntriesData from '@/data/expression-entries-v2.json'
import wordEntriesData from '@/data/word-entries.json'
import type { CefrLevel } from '@/types/level'
import { CEFR_ORDER, LEGACY_LEVEL_MIGRATION } from '@/types/level'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CEFR_WEIGHTS: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 5,
  C1: 8,
  C2: 13,
}

const CATEGORY_MULTIPLIERS: Record<string, number> = {
  idiom: 1.5,
  phrasal_verb: 1.4,
  collocation: 1.3,
  fixed_expression: 1.2,
  sentence_frame: 1.2,
  discourse_marker: 1.2,
  slang: 1.0,
  interjection: 1.0,
  exclamation: 1.0,
  filler: 0.8,
}

const POS_MULTIPLIERS: Record<string, number> = {
  verb: 1.3,
  adjective: 1.2,
  adverb: 1.1,
  noun: 1.0,
}

const LEVEL_THRESHOLDS: Record<string, number> = {
  A1_to_A2: 60,
  A2_to_B1: 150,
  B1_to_B2: 280,
  B2_to_C1: 400,
  C1_to_C2: 600,
}

const MIN_EXPRESSIONS_FOR_LEVELUP = 10

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LevelEvent {
  timestamp: string
  from: string // CefrLevel or legacy 3-level string for backward compat
  to: string   // CefrLevel or legacy 3-level string for backward compat
  trigger: 'auto' | 'manual' | 'challenge'
  absorptionScoreAtChange: number
  expressionCountAtChange: number
}

interface VideoCompletionEntry {
  videoId: string
  completionRate: number
  watchedAt: string
}

interface LevelState {
  // Absorption Score (expression + word based)
  absorptionScore: number
  rawScore: number

  // Video watching XP (tracked separately, adds to rawScore)
  videoXP: Record<string, number>

  // Level history
  levelHistory: LevelEvent[]

  // Pending level-up
  pendingLevelUp: { from: CefrLevel; to: CefrLevel } | null

  // Video completion log (last 20, for level-up trigger condition)
  videoCompletionLog: VideoCompletionEntry[]

  // Hydration
  hydrated: boolean
  setHydrated: (h: boolean) => void

  // Actions
  recalculateScore: (familiarEntries: Record<string, { count: number }>) => void
  awardVideoXP: (videoId: string, completionRate: number) => number
  recordVideoCompletion: (videoId: string, completionRate: number) => void
  acceptLevelUp: (currentLevel: CefrLevel) => void
  declineLevelUp: () => void
  checkLevelUp: (currentLevel: CefrLevel) => void
  addManualLevelChange: (from: CefrLevel, to: CefrLevel, score: number, count: number) => void

  // Getters
  getVideoXPTotal: () => number
  getTotalAbsorptionXP: () => number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const expressionEntries = expressionEntriesData as Record<string, { cefr: string; category: string }>
const wordEntries = wordEntriesData as Record<string, { cefr: string; pos: string }>

function computeAbsorption(familiarEntries: Record<string, { count: number }>): number {
  let raw = 0

  for (const [id, entry] of Object.entries(familiarEntries)) {
    let cefrWeight: number
    let multiplier: number

    if (id.startsWith('word:')) {
      const wordKey = id.slice(5) // strip 'word:' prefix
      const wordData = wordEntries[wordKey]
      if (!wordData) continue
      cefrWeight = CEFR_WEIGHTS[wordData.cefr?.toUpperCase()] ?? 1
      multiplier = POS_MULTIPLIERS[wordData.pos] ?? 0.9
    } else {
      const exprData = expressionEntries[id]
      if (!exprData) continue
      cefrWeight = CEFR_WEIGHTS[exprData.cefr?.toUpperCase()] ?? 1
      multiplier = CATEGORY_MULTIPLIERS[exprData.category] ?? 1.0
    }

    // swipe progress based on count
    let swipeProgress = 0
    if (entry.count >= 3) swipeProgress = 1.0
    else if (entry.count === 2) swipeProgress = 0.6
    else if (entry.count === 1) swipeProgress = 0.3

    raw += cefrWeight * multiplier * swipeProgress
  }

  return raw
}

/** @deprecated Alias kept for backward compat */
const computeExpressionAbsorption = computeAbsorption

/** @deprecated Use computeAbsorption instead — kept for backward compat */
const computeRawScore = computeAbsorption

function getRecentCompletionRate(log: VideoCompletionEntry[]): number {
  if (log.length === 0) return 0
  const sum = log.reduce((acc, e) => acc + e.completionRate, 0)
  return sum / log.length
}

function levelFloor(level: CefrLevel): number {
  const idx = CEFR_ORDER.indexOf(level)
  if (idx <= 0) return 0
  const prevLevel = CEFR_ORDER[idx - 1]
  const key = `${prevLevel}_to_${level}`
  return LEVEL_THRESHOLDS[key] ?? 0
}

function levelCeiling(level: CefrLevel): number {
  const idx = CEFR_ORDER.indexOf(level)
  if (idx >= CEFR_ORDER.length - 1) return Infinity // C2 has no ceiling
  const nextLevel = CEFR_ORDER[idx + 1]
  const key = `${level}_to_${nextLevel}`
  return LEVEL_THRESHOLDS[key] ?? Infinity
}

export function getLevelGaugeProgress(
  rawScore: number,
  level: CefrLevel,
): number {
  if (level === 'C2') return 1

  const floor = levelFloor(level)
  const ceiling = levelCeiling(level)
  if (ceiling === Infinity) return 1

  const clamped = Math.max(floor, Math.min(rawScore, ceiling))
  return (clamped - floor) / (ceiling - floor)
}

/**
 * @deprecated Swipe XP has been removed. Individual card swipes no longer award XP.
 * XP is now awarded per completed game session instead (see src/lib/xp/sessionXp.ts).
 * Kept for backward compatibility — always returns 0.
 */
export function computeXpForSwipe(
  _exprId: string,
  _newCount: number,
): number {
  return 0
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLevelStore = create<LevelState>()(
  persist(
    (set, get) => ({
      absorptionScore: 0,
      rawScore: 0,
      videoXP: {},
      levelHistory: [],
      pendingLevelUp: null,
      videoCompletionLog: [],
      hydrated: false,

      setHydrated: (h) => set({ hydrated: h }),

      recalculateScore: (familiarEntries) => {
        const expressionAbsorption = computeAbsorption(familiarEntries)

        // rawScore = expression absorption + cumulative video XP
        const videoXPTotal = get().getVideoXPTotal()
        const raw = expressionAbsorption + videoXPTotal

        const normalized = Math.min((raw / 500) * 100, 100)
        set({ rawScore: raw, absorptionScore: normalized })
      },

      awardVideoXP: (videoId, completionRate) => {
        const currentAwards = get().videoXP[videoId] ?? 0
        if (currentAwards >= 10) return 0

        // Base XP proportional to completion, full at >80%
        const xpGained = completionRate >= 0.8 ? 3 : Math.round(completionRate * 3 * 10) / 10
        if (xpGained <= 0) return 0

        set((state) => {
          const newVideoXP = {
            ...state.videoXP,
            [videoId]: currentAwards + 1,
          }
          // Recalculate rawScore with new video XP
          const videoXPTotal = Object.values(newVideoXP).reduce((sum, count) => sum + count * 3, 0)
          // We don't have familiarEntries here, so just add the delta to rawScore
          const newRawScore = state.rawScore + xpGained

          return {
            videoXP: newVideoXP,
            rawScore: newRawScore,
          }
        })

        return xpGained
      },

      recordVideoCompletion: (videoId, completionRate) => {
        const entry: VideoCompletionEntry = {
          videoId,
          completionRate,
          watchedAt: new Date().toISOString(),
        }
        set((state) => ({
          videoCompletionLog: [entry, ...state.videoCompletionLog].slice(0, 20),
        }))
      },

      checkLevelUp: (currentLevel) => {
        const { rawScore, pendingLevelUp, videoCompletionLog, levelHistory } = get()

        // Already pending
        if (pendingLevelUp) return

        // Must have watched at least 5 videos to level up
        if (videoCompletionLog.length < 5) return

        if (rawScore < 5) return // too early

        // Check completion rate condition
        const recentRate = getRecentCompletionRate(videoCompletionLog)
        // For MVP: skip completion rate check if no log yet (allow first level-up)
        const completionOk = videoCompletionLog.length < 3 || recentRate >= 0.8

        if (!completionOk) return

        // Find the next level
        const idx = CEFR_ORDER.indexOf(currentLevel)
        if (idx < 0 || idx >= CEFR_ORDER.length - 1) return // already max or unknown

        const nextLevel = CEFR_ORDER[idx + 1]
        const thresholdKey = `${currentLevel}_to_${nextLevel}`
        const threshold = LEVEL_THRESHOLDS[thresholdKey]
        if (!threshold || rawScore < threshold) return

        // Cooldown: don't trigger again within 60 seconds of last auto level-up
        const lastAuto = levelHistory.filter((e) => e.trigger === 'auto').at(-1)
        if (lastAuto) {
          const elapsed = Date.now() - new Date(lastAuto.timestamp).getTime()
          if (elapsed < 60_000) return
        }

        set({ pendingLevelUp: { from: currentLevel, to: nextLevel } })
      },

      acceptLevelUp: (currentLevel) => {
        const { pendingLevelUp, rawScore, levelHistory } = get()
        if (!pendingLevelUp) return

        const event: LevelEvent = {
          timestamp: new Date().toISOString(),
          from: pendingLevelUp.from,
          to: pendingLevelUp.to,
          trigger: 'auto',
          absorptionScoreAtChange: Math.min((rawScore / 500) * 100, 100),
          expressionCountAtChange: 0, // caller can update via addManualLevelChange if needed
        }

        set({
          pendingLevelUp: null,
          levelHistory: [...levelHistory, event],
        })
      },

      declineLevelUp: () => {
        set({ pendingLevelUp: null })
      },

      addManualLevelChange: (from, to, score, count) => {
        const event: LevelEvent = {
          timestamp: new Date().toISOString(),
          from,
          to,
          trigger: 'manual',
          absorptionScoreAtChange: score,
          expressionCountAtChange: count,
        }
        set((state) => ({
          levelHistory: [...state.levelHistory, event],
        }))
      },

      // Getters
      getVideoXPTotal: () => {
        const videoXP = get().videoXP
        return Object.values(videoXP).reduce((sum, count) => sum + count * 3, 0)
      },

      getTotalAbsorptionXP: () => {
        return get().rawScore
      },
    }),
    {
      name: 'studyeng-level-score',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
      // Migrate legacy pendingLevelUp values
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>
        if (state.pendingLevelUp && typeof state.pendingLevelUp === 'object') {
          const pending = state.pendingLevelUp as Record<string, string>
          if (pending.from && pending.from in LEGACY_LEVEL_MIGRATION) {
            pending.from = LEGACY_LEVEL_MIGRATION[pending.from]
          }
          if (pending.to && pending.to in LEGACY_LEVEL_MIGRATION) {
            pending.to = LEGACY_LEVEL_MIGRATION[pending.to]
          }
        }
        return state as unknown as LevelState
      },
      version: 1,
    },
  ),
)
