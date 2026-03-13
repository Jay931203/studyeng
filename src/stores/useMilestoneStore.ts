import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Milestone definitions
// ---------------------------------------------------------------------------

export interface MilestoneDefinition {
  id: string
  xp: number
  label: string
}

export const MILESTONES: MilestoneDefinition[] = [
  { id: 'first_video_complete', xp: 20, label: 'First video completed' },
  { id: 'videos_10', xp: 30, label: '10 videos completed' },
  { id: 'videos_50', xp: 50, label: '50 videos completed' },
  { id: 'videos_100', xp: 80, label: '100 videos completed' },
  { id: 'first_game_complete', xp: 15, label: 'First game completed' },
  { id: 'games_20', xp: 30, label: '20 games completed' },
  { id: 'streak_7', xp: 25, label: '7-day streak' },
  { id: 'streak_30', xp: 60, label: '30-day streak' },
  { id: 'first_level_challenge_pass', xp: 40, label: 'First Level Challenge passed' },
  { id: 'tier_learner', xp: 20, label: 'Learner tier reached' },
  { id: 'tier_regular', xp: 30, label: 'Regular tier reached' },
  { id: 'tier_dedicated', xp: 40, label: 'Dedicated tier reached' },
]

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface AchievedEntry {
  achievedAt: number
  xpAwarded: number
}

interface MilestoneState {
  achieved: Record<string, AchievedEntry>
  hydrated: boolean
  setHydrated: (h: boolean) => void

  /**
   * Check a milestone condition and award XP if not already achieved.
   * Returns the XP awarded (0 if already achieved or milestone not found).
   */
  checkAndAward: (milestoneId: string, condition: boolean) => number

  /** Check if a milestone has been achieved */
  isAchieved: (milestoneId: string) => boolean
}

export const useMilestoneStore = create<MilestoneState>()(
  persist(
    (set, get) => ({
      achieved: {},
      hydrated: false,
      setHydrated: (h) => set({ hydrated: h }),

      checkAndAward: (milestoneId, condition) => {
        if (!condition) return 0
        if (get().achieved[milestoneId]) return 0

        const def = MILESTONES.find((m) => m.id === milestoneId)
        if (!def) return 0

        const entry: AchievedEntry = {
          achievedAt: Date.now(),
          xpAwarded: def.xp,
        }

        set((state) => ({
          achieved: {
            ...state.achieved,
            [milestoneId]: entry,
          },
        }))

        // Award XP via useUserStore (lazy import to avoid circular deps)
        const { useUserStore } = require('./useUserStore')
        useUserStore.getState().gainXp(def.xp)

        return def.xp
      },

      isAchieved: (milestoneId) => {
        return !!get().achieved[milestoneId]
      },
    }),
    {
      name: 'studyeng-milestones',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

// ---------------------------------------------------------------------------
// Convenience: check multiple milestones after an activity
// ---------------------------------------------------------------------------

/**
 * Check video-related milestones based on total video completion count.
 */
export function checkVideoMilestones(totalVideosCompleted: number): void {
  const store = useMilestoneStore.getState()
  store.checkAndAward('first_video_complete', totalVideosCompleted >= 1)
  store.checkAndAward('videos_10', totalVideosCompleted >= 10)
  store.checkAndAward('videos_50', totalVideosCompleted >= 50)
  store.checkAndAward('videos_100', totalVideosCompleted >= 100)
}

/**
 * Check game-related milestones based on total game session count.
 */
export function checkGameMilestones(totalGameSessions: number): void {
  const store = useMilestoneStore.getState()
  store.checkAndAward('first_game_complete', totalGameSessions >= 1)
  store.checkAndAward('games_20', totalGameSessions >= 20)
}

/**
 * Check streak-related milestones.
 */
export function checkStreakMilestones(streakDays: number): void {
  const store = useMilestoneStore.getState()
  store.checkAndAward('streak_7', streakDays >= 7)
  store.checkAndAward('streak_30', streakDays >= 30)
}
