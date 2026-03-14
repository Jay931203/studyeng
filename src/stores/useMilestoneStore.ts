import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from './useUserStore'

export type MilestoneMetric = 'videos' | 'games' | 'streak' | 'challenge' | 'tier'

export interface MilestoneDefinition {
  id: string
  xp: number
  label: string
  description: string
  target: number
  metric: MilestoneMetric
}

export const MILESTONES: MilestoneDefinition[] = [
  {
    id: 'first_video_complete',
    xp: 20,
    label: 'First video complete',
    description: 'Finish 1 video all the way through.',
    target: 1,
    metric: 'videos',
  },
  {
    id: 'videos_10',
    xp: 30,
    label: '10 videos complete',
    description: 'Finish 10 different videos.',
    target: 10,
    metric: 'videos',
  },
  {
    id: 'videos_50',
    xp: 50,
    label: '50 videos complete',
    description: 'Finish 50 different videos.',
    target: 50,
    metric: 'videos',
  },
  {
    id: 'videos_100',
    xp: 80,
    label: '100 videos complete',
    description: 'Finish 100 different videos.',
    target: 100,
    metric: 'videos',
  },
  {
    id: 'first_game_complete',
    xp: 15,
    label: 'First game clear',
    description: 'Complete your first learning game.',
    target: 1,
    metric: 'games',
  },
  {
    id: 'games_20',
    xp: 30,
    label: '20 games clear',
    description: 'Complete 20 learning game sessions.',
    target: 20,
    metric: 'games',
  },
  {
    id: 'streak_7',
    xp: 25,
    label: '7-day streak',
    description: 'Keep learning for 7 days in a row.',
    target: 7,
    metric: 'streak',
  },
  {
    id: 'streak_30',
    xp: 60,
    label: '30-day streak',
    description: 'Keep learning for 30 days in a row.',
    target: 30,
    metric: 'streak',
  },
  {
    id: 'first_level_challenge_pass',
    xp: 40,
    label: 'First level challenge pass',
    description: 'Pass a level challenge once.',
    target: 1,
    metric: 'challenge',
  },
  {
    id: 'tier_learner',
    xp: 20,
    label: 'Learner tier reached',
    description: 'Reach Learner tier in monthly XP.',
    target: 1,
    metric: 'tier',
  },
  {
    id: 'tier_regular',
    xp: 30,
    label: 'Regular tier reached',
    description: 'Reach Regular tier in monthly XP.',
    target: 2,
    metric: 'tier',
  },
  {
    id: 'tier_dedicated',
    xp: 40,
    label: 'Dedicated tier reached',
    description: 'Reach Dedicated tier in monthly XP.',
    target: 3,
    metric: 'tier',
  },
]

export interface AchievedEntry {
  achievedAt: number
  xpAwarded: number
}

interface MilestoneState {
  achieved: Record<string, AchievedEntry>
  hydrated: boolean
  setHydrated: (h: boolean) => void
  claimMilestone: (milestoneId: string, ready: boolean) => number
  checkAndAward: (milestoneId: string, condition: boolean) => number
  isAchieved: (milestoneId: string) => boolean
}

export const useMilestoneStore = create<MilestoneState>()(
  persist(
    (set, get) => ({
      achieved: {},
      hydrated: false,
      setHydrated: (h) => set({ hydrated: h }),

      claimMilestone: (milestoneId, ready) => {
        if (!ready) return 0
        if (get().achieved[milestoneId]) return 0

        const def = MILESTONES.find((milestone) => milestone.id === milestoneId)
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

        useUserStore
          .getState()
          .gainXp(def.xp, `Milestone claim: ${def.label}`)

        return def.xp
      },

      // Deprecated: milestone rewards are now claimed from the milestones page.
      checkAndAward: () => 0,

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

// Deprecated compatibility no-ops. Milestones are now claimed explicitly.
export function checkVideoMilestones(totalVideosCompleted: number): void {
  void totalVideosCompleted
}

export function checkGameMilestones(totalGameSessions: number): void {
  void totalGameSessions
}

export function checkStreakMilestones(streakDays: number): void {
  void streakDays
}
