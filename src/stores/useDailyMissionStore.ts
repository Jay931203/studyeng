import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useOnboardingStore } from './useOnboardingStore'
import { useDiscountStore } from './useDiscountStore'

export interface DailyMission {
  id: string
  title: string
  description: string
  target: number
  current: number
  completed: boolean
  xpReward: number
}

interface DailyMissionState {
  missions: DailyMission[]
  lastResetDate: string | null
  allCompleteBonus: boolean

  checkAndResetDaily: () => void
  incrementMission: (id: string, amount?: number) => void
  getMissions: () => DailyMission[]
  resetState: () => void
}

function getDefaultMissions(): DailyMission[] {
  const dailyGoal = useOnboardingStore.getState().dailyGoal || 5
  return [
    {
      id: 'watch-videos',
      title: '영상 시청',
      description: `오늘 영상 ${dailyGoal}개 보기`,
      target: dailyGoal,
      current: 0,
      completed: false,
      xpReward: 0,
    },
    {
      id: 'play-game',
      title: '게임 도전',
      description: '게임 1판 하기',
      target: 1,
      current: 0,
      completed: false,
      xpReward: 0,
    },
    {
      id: 'save-phrase',
      title: '표현 저장',
      description: '표현 1개 저장하기',
      target: 1,
      current: 0,
      completed: false,
      xpReward: 0,
    },
  ]
}

function getTodayDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export const useDailyMissionStore = create<DailyMissionState>()(
  persist(
    (set, get) => ({
      missions: getDefaultMissions(),
      lastResetDate: null,
      allCompleteBonus: false,

      checkAndResetDaily: () => {
        const today = getTodayDateString()
        const { lastResetDate } = get()

        if (lastResetDate !== today) {
          set({
            missions: getDefaultMissions(),
            lastResetDate: today,
            allCompleteBonus: false,
          })
        }
      },

      incrementMission: (id: string, amount: number = 1) => {
        get().checkAndResetDaily()
        const { missions, allCompleteBonus } = get()

        const updatedMissions = missions.map((mission) => {
          if (mission.id !== id) return mission
          if (mission.completed) return mission

          const newCurrent = Math.min(mission.current + amount, mission.target)
          const justCompleted = newCurrent >= mission.target && !mission.completed

          return {
            ...mission,
            current: newCurrent,
            completed: justCompleted ? true : mission.completed,
          }
        })

        // Check if all missions are now complete for bonus
        const allDone = updatedMissions.every((m) => m.completed)
        if (allDone && !allCompleteBonus) {
          useDiscountStore.getState().recordDailyCompletion()
          set({ missions: updatedMissions, allCompleteBonus: true })
        } else {
          set({ missions: updatedMissions })
        }
      },

      getMissions: () => {
        return get().missions
      },

      resetState: () => {
        set({
          missions: getDefaultMissions(),
          lastResetDate: null,
          allCompleteBonus: false,
        })
      },
    }),
    { name: 'studyeng-daily-missions' }
  )
)
