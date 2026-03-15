import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocaleStrings } from '@/locales/index'
import { useLocaleStore } from './useLocaleStore'
import { useUserStore } from './useUserStore'

export type MilestoneMetric = 'videos' | 'games' | 'streak' | 'challenge' | 'tier'

export interface MilestoneDefinition {
  id: string
  xp: number
  target: number
  metric: MilestoneMetric
}

function getMilestoneStrings() {
  return getLocaleStrings(useLocaleStore.getState().locale)
}

/** Get localized label for a milestone by id */
export function getMilestoneLabel(id: string): string {
  const strings = getMilestoneStrings()
  const entry = strings.milestones[id]
  return entry?.label ?? id
}

/** Get localized description for a milestone by id */
export function getMilestoneDescription(id: string): string {
  const strings = getMilestoneStrings()
  const entry = strings.milestones[id]
  return entry?.description ?? ''
}

export const MILESTONES: MilestoneDefinition[] = [
  { id: 'first_video_complete', xp: 20, target: 1, metric: 'videos' },
  { id: 'videos_10', xp: 30, target: 10, metric: 'videos' },
  { id: 'videos_50', xp: 50, target: 50, metric: 'videos' },
  { id: 'videos_100', xp: 80, target: 100, metric: 'videos' },
  { id: 'first_game_complete', xp: 15, target: 1, metric: 'games' },
  { id: 'games_20', xp: 30, target: 20, metric: 'games' },
  { id: 'streak_7', xp: 25, target: 7, metric: 'streak' },
  { id: 'streak_30', xp: 60, target: 30, metric: 'streak' },
  { id: 'first_level_challenge_pass', xp: 40, target: 1, metric: 'challenge' },
  { id: 'tier_learner', xp: 20, target: 1, metric: 'tier' },
  { id: 'tier_regular', xp: 30, target: 2, metric: 'tier' },
  { id: 'tier_dedicated', xp: 40, target: 3, metric: 'tier' },
  { id: 'tier_champion', xp: 50, target: 4, metric: 'tier' },
  { id: 'tier_legend', xp: 60, target: 5, metric: 'tier' },
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

        const strings = getMilestoneStrings()
        const label = getMilestoneLabel(milestoneId)
        useUserStore.getState().gainXp(def.xp, strings.xpReasons.milestoneClaim(label))

        return def.xp
      },

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

export function checkVideoMilestones(totalVideosCompleted: number): void {
  void totalVideosCompleted
}

export function checkGameMilestones(totalGameSessions: number): void {
  void totalGameSessions
}

export function checkStreakMilestones(streakDays: number): void {
  void streakDays
}
