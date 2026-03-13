import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChallengeAttempt {
  date: string
  targetLevel: 'intermediate' | 'advanced'
  score: number // number of "알아요" answers
  passed: boolean
}

interface LevelChallengeState {
  challengeAttempts: ChallengeAttempt[]
  lastPassedLevel: 'beginner' | 'intermediate' | 'advanced' | null

  // Hydration
  hydrated: boolean
  setHydrated: (h: boolean) => void

  // Actions
  recordAttempt: (attempt: Omit<ChallengeAttempt, 'date'>) => void
  canChallenge: (currentLevel: 'beginner' | 'intermediate' | 'advanced') => boolean
  getTargetLevel: (currentLevel: 'beginner' | 'intermediate' | 'advanced') => 'intermediate' | 'advanced' | null
  getAttemptCount: (targetLevel: 'intermediate' | 'advanced') => number
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
        // Can challenge if not already at max level
        return currentLevel !== 'advanced'
      },

      getTargetLevel: (currentLevel) => {
        if (currentLevel === 'beginner') return 'intermediate'
        if (currentLevel === 'intermediate') return 'advanced'
        return null
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
    },
  ),
)
