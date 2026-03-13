import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CefrLevel, ChallengeTransition } from '@/types/level'
import { CEFR_ORDER, LEGACY_LEVEL_MIGRATION } from '@/types/level'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChallengeAttempt {
  date: string
  targetLevel: ChallengeTransition
  score: number // number of "알아요" answers
  passed: boolean
}

interface LevelChallengeState {
  challengeAttempts: ChallengeAttempt[]
  lastPassedLevel: CefrLevel | null

  // Hydration
  hydrated: boolean
  setHydrated: (h: boolean) => void

  // Actions
  recordAttempt: (attempt: Omit<ChallengeAttempt, 'date'>) => void
  canChallenge: (currentLevel: CefrLevel) => boolean
  getTargetLevel: (currentLevel: CefrLevel) => ChallengeTransition | null
  getAttemptCount: (targetLevel: ChallengeTransition) => number
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLevelChallengeStore = create<LevelChallengeState>()(
  persist(
    (set, get) => ({
      challengeAttempts: [],
      lastPassedLevel: null,
      hydrated: false,

      setHydrated: (h) => set({ hydrated: h }),

      recordAttempt: (attempt) => {
        const entry: ChallengeAttempt = {
          ...attempt,
          date: new Date().toISOString(),
        }
        set((state) => ({
          challengeAttempts: [...state.challengeAttempts, entry],
          lastPassedLevel: attempt.passed ? attempt.targetLevel : state.lastPassedLevel,
        }))
      },

      canChallenge: (currentLevel) => {
        // Can challenge if not already at max level (C2)
        return currentLevel !== 'C2'
      },

      getTargetLevel: (currentLevel) => {
        const idx = CEFR_ORDER.indexOf(currentLevel)
        if (idx < 0 || idx >= CEFR_ORDER.length - 1) return null
        return CEFR_ORDER[idx + 1] as ChallengeTransition
      },

      getAttemptCount: (targetLevel) => {
        return get().challengeAttempts.filter((a) => a.targetLevel === targetLevel).length
      },
    }),
    {
      name: 'studyeng-level-challenge',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
      // Migrate old 3-level target values
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>
        // Migrate lastPassedLevel
        if (state.lastPassedLevel && typeof state.lastPassedLevel === 'string' && state.lastPassedLevel in LEGACY_LEVEL_MIGRATION) {
          state.lastPassedLevel = LEGACY_LEVEL_MIGRATION[state.lastPassedLevel]
        }
        // Migrate challengeAttempts targetLevel
        if (Array.isArray(state.challengeAttempts)) {
          for (const attempt of state.challengeAttempts) {
            if (attempt.targetLevel && attempt.targetLevel in LEGACY_LEVEL_MIGRATION) {
              attempt.targetLevel = LEGACY_LEVEL_MIGRATION[attempt.targetLevel]
            }
          }
        }
        return state as unknown as LevelChallengeState
      },
      version: 1,
    },
  ),
)
