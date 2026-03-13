'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import expressionEntriesData from '@/data/expression-entries-v2.json'

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

const LEVEL_THRESHOLDS = {
  beginner_to_intermediate: 150,
  intermediate_to_advanced: 400,
}

const MIN_EXPRESSIONS_FOR_LEVELUP = 10

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LevelEvent {
  timestamp: string
  from: 'beginner' | 'intermediate' | 'advanced'
  to: 'beginner' | 'intermediate' | 'advanced'
  trigger: 'auto' | 'manual'
  absorptionScoreAtChange: number
  expressionCountAtChange: number
}

interface VideoCompletionEntry {
  videoId: string
  completionRate: number
  watchedAt: string
}

interface LevelState {
  // Absorption Score (expression-based only)
  absorptionScore: number
  rawScore: number

  // Video watching XP (tracked separately, adds to rawScore)
  videoXP: Record<string, number>

  // Level history
  levelHistory: LevelEvent[]

  // Pending level-up
  pendingLevelUp: { from: 'beginner' | 'intermediate' | 'advanced'; to: 'beginner' | 'intermediate' | 'advanced' } | null

  // Video completion log (last 20, for level-up trigger condition)
  videoCompletionLog: VideoCompletionEntry[]

  // Hydration
  hydrated: boolean
  setHydrated: (h: boolean) => void

  // Actions
  recalculateScore: (familiarEntries: Record<string, { count: number }>) => void
  awardVideoXP: (videoId: string, completionRate: number) => number
  recordVideoCompletion: (videoId: string, completionRate: number) => void
  acceptLevelUp: (currentLevel: 'beginner' | 'intermediate' | 'advanced') => void
  declineLevelUp: () => void
  checkLevelUp: (currentLevel: 'beginner' | 'intermediate' | 'advanced') => void
  addManualLevelChange: (from: 'beginner' | 'intermediate' | 'advanced', to: 'beginner' | 'intermediate' | 'advanced', score: number, count: number) => void

  // Getters
  getVideoXPTotal: () => number
  getTotalAbsorptionXP: () => number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const expressionEntries = expressionEntriesData as Record<string, { cefr: string; category: string }>

function computeExpressionAbsorption(familiarEntries: Record<string, { count: number }>): number {
  let raw = 0

  for (const [exprId, entry] of Object.entries(familiarEntries)) {
    const exprData = expressionEntries[exprId]
    if (!exprData) continue

    const cefrWeight = CEFR_WEIGHTS[exprData.cefr?.toUpperCase()] ?? 1
    const catMultiplier = CATEGORY_MULTIPLIERS[exprData.category] ?? 1.0

    // swipe progress based on count
    let swipeProgress = 0
    if (entry.count >= 3) swipeProgress = 1.0
    else if (entry.count === 2) swipeProgress = 0.6
    else if (entry.count === 1) swipeProgress = 0.3

    raw += cefrWeight * catMultiplier * swipeProgress
  }

  return raw
}

/** @deprecated Use computeExpressionAbsorption instead — kept for backward compat */
const computeRawScore = computeExpressionAbsorption

function getRecentCompletionRate(log: VideoCompletionEntry[]): number {
  if (log.length === 0) return 0
  const sum = log.reduce((acc, e) => acc + e.completionRate, 0)
  return sum / log.length
}

function levelFloor(level: 'beginner' | 'intermediate' | 'advanced'): number {
  if (level === 'intermediate') return LEVEL_THRESHOLDS.beginner_to_intermediate
  if (level === 'advanced') return LEVEL_THRESHOLDS.intermediate_to_advanced
  return 0
}

function levelCeiling(level: 'beginner' | 'intermediate' | 'advanced'): number {
  if (level === 'beginner') return LEVEL_THRESHOLDS.beginner_to_intermediate
  if (level === 'intermediate') return LEVEL_THRESHOLDS.intermediate_to_advanced
  return Infinity
}

export function getLevelGaugeProgress(
  rawScore: number,
  level: 'beginner' | 'intermediate' | 'advanced',
): number {
  if (level === 'advanced') return 1

  const floor = levelFloor(level)
  const ceiling = levelCeiling(level)
  if (ceiling === Infinity) return 1

  const clamped = Math.max(floor, Math.min(rawScore, ceiling))
  return (clamped - floor) / (ceiling - floor)
}

export function computeXpForSwipe(
  exprId: string,
  newCount: number, // count AFTER this swipe
): number {
  const exprData = expressionEntries[exprId]
  if (!exprData) return 0

  const cefrWeight = CEFR_WEIGHTS[exprData.cefr?.toUpperCase()] ?? 1
  const catMultiplier = CATEGORY_MULTIPLIERS[exprData.category] ?? 1.0

  // XP delta for this specific swipe step
  let stepXP = 0
  if (newCount === 1) stepXP = 0.3
  else if (newCount === 2) stepXP = 0.3
  else if (newCount >= 3) stepXP = 0.4

  return Math.round(cefrWeight * catMultiplier * stepXP * 10) / 10
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
        const expressionAbsorption = computeExpressionAbsorption(familiarEntries)

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

        let nextLevel: 'beginner' | 'intermediate' | 'advanced' | null = null

        if (currentLevel === 'beginner' && rawScore >= LEVEL_THRESHOLDS.beginner_to_intermediate) {
          nextLevel = 'intermediate'
        } else if (currentLevel === 'intermediate' && rawScore >= LEVEL_THRESHOLDS.intermediate_to_advanced) {
          nextLevel = 'advanced'
        }

        if (!nextLevel) return

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
    },
  ),
)
