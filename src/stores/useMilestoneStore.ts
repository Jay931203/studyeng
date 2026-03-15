import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocaleStrings } from '@/locales/index'
import { useLocaleStore } from './useLocaleStore'
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
    label: '첫 영상 완주',
    description: '영상 1개를 끝까지 시청하세요.',
    target: 1,
    metric: 'videos',
  },
  {
    id: 'videos_10',
    xp: 30,
    label: '영상 10개 완주',
    description: '서로 다른 영상 10개를 끝까지 시청하세요.',
    target: 10,
    metric: 'videos',
  },
  {
    id: 'videos_50',
    xp: 50,
    label: '영상 50개 완주',
    description: '서로 다른 영상 50개를 끝까지 시청하세요.',
    target: 50,
    metric: 'videos',
  },
  {
    id: 'videos_100',
    xp: 80,
    label: '영상 100개 완주',
    description: '서로 다른 영상 100개를 끝까지 시청하세요.',
    target: 100,
    metric: 'videos',
  },
  {
    id: 'first_game_complete',
    xp: 15,
    label: '첫 게임 완료',
    description: '학습 게임을 처음으로 완료하세요.',
    target: 1,
    metric: 'games',
  },
  {
    id: 'games_20',
    xp: 30,
    label: '게임 20회 완료',
    description: '학습 게임 세션을 20회 완료하세요.',
    target: 20,
    metric: 'games',
  },
  {
    id: 'streak_7',
    xp: 25,
    label: '7일 연속 학습',
    description: '7일 연속으로 학습을 이어가세요.',
    target: 7,
    metric: 'streak',
  },
  {
    id: 'streak_30',
    xp: 60,
    label: '30일 연속 학습',
    description: '30일 연속으로 학습을 이어가세요.',
    target: 30,
    metric: 'streak',
  },
  {
    id: 'first_level_challenge_pass',
    xp: 40,
    label: '첫 레벨 챌린지 통과',
    description: '레벨 챌린지를 1회 통과하세요.',
    target: 1,
    metric: 'challenge',
  },
  {
    id: 'tier_learner',
    xp: 20,
    label: 'Learner 등급 달성',
    description: 'Learner 등급에 도달하세요.',
    target: 1,
    metric: 'tier',
  },
  {
    id: 'tier_regular',
    xp: 30,
    label: 'Regular 등급 달성',
    description: 'Regular 등급에 도달하세요.',
    target: 2,
    metric: 'tier',
  },
  {
    id: 'tier_dedicated',
    xp: 40,
    label: 'Dedicated 등급 달성',
    description: 'Dedicated 등급에 도달하세요.',
    target: 3,
    metric: 'tier',
  },
  {
    id: 'tier_champion',
    xp: 50,
    label: 'Champion 등급 달성',
    description: 'Champion 등급에 도달하세요.',
    target: 4,
    metric: 'tier',
  },
  {
    id: 'tier_legend',
    xp: 60,
    label: 'Legend 등급 달성',
    description: 'Legend 등급에 도달하세요.',
    target: 5,
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

        const strings = getLocaleStrings(useLocaleStore.getState().locale)
        const milestoneLabel = strings.milestones[def.id]?.label ?? def.label
        useUserStore.getState().gainXp(def.xp, strings.xpReasons.milestoneClaim(milestoneLabel))

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
