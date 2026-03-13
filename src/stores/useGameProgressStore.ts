import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LeitnerEntry {
  box: 1 | 2 | 3
  lastSeenAt: number
  consecutiveCorrect: number
}

const DAILY_GAME_XP_CAP = 30

interface GameProgressState {
  leitner: { [exprId: string]: LeitnerEntry }
  bestStreak: number
  totalSessions: {
    expressionSwipe: number
    listenAndFill: number
  }
  dailyGameXP: number
  dailyGameXPDate: string
  hydrated: boolean
  setHydrated: (h: boolean) => void
  updateLeitner: (exprId: string, correct: boolean) => void
  getLeitnerBox: (exprId: string) => 1 | 2 | 3
  updateBestStreak: (streak: number) => void
  incrementSessionCount: (game: 'expressionSwipe' | 'listenAndFill') => void
  addGameXP: (amount: number) => number
  getDailyGameXPRemaining: () => number
  getBox1Expressions: () => string[]
  getBox2Expressions: () => string[]
  getMasteredExpressions: () => string[]
}

export const useGameProgressStore = create<GameProgressState>()(
  persist(
    (set, get) => ({
      leitner: {},
      bestStreak: 0,
      totalSessions: {
        expressionSwipe: 0,
        listenAndFill: 0,
      },
      dailyGameXP: 0,
      dailyGameXPDate: '',
      hydrated: false,
      setHydrated: (h) => set({ hydrated: h }),

      updateLeitner: (exprId, correct) => {
        const current = get().leitner[exprId]
        const now = Date.now()

        let entry: LeitnerEntry

        if (!correct) {
          entry = { box: 1, lastSeenAt: now, consecutiveCorrect: 0 }
        } else if (!current || current.box === 1) {
          entry = { box: 2, lastSeenAt: now, consecutiveCorrect: 1 }
        } else if (current.box === 2) {
          const nextConsecutive = current.consecutiveCorrect + 1
          if (current.consecutiveCorrect >= 1) {
            entry = { box: 3, lastSeenAt: now, consecutiveCorrect: nextConsecutive }
          } else {
            entry = { box: 2, lastSeenAt: now, consecutiveCorrect: nextConsecutive }
          }
        } else {
          entry = { box: 3, lastSeenAt: now, consecutiveCorrect: current.consecutiveCorrect + 1 }
        }

        set({
          leitner: {
            ...get().leitner,
            [exprId]: entry,
          },
        })
      },

      getLeitnerBox: (exprId) => {
        return get().leitner[exprId]?.box ?? 1
      },

      updateBestStreak: (streak) => {
        if (streak > get().bestStreak) {
          set({ bestStreak: streak })
        }
      },

      incrementSessionCount: (game) => {
        const sessions = get().totalSessions
        set({
          totalSessions: {
            ...sessions,
            [game]: sessions[game] + 1,
          },
        })
      },

      addGameXP: (amount) => {
        const today = new Date().toISOString().slice(0, 10)
        const state = get()
        const current = state.dailyGameXPDate === today ? state.dailyGameXP : 0
        const remaining = Math.max(0, DAILY_GAME_XP_CAP - current)
        const actual = Math.min(amount, remaining)

        if (actual > 0) {
          set({ dailyGameXP: current + actual, dailyGameXPDate: today })
        }
        return actual
      },

      getDailyGameXPRemaining: () => {
        const today = new Date().toISOString().slice(0, 10)
        const state = get()
        if (state.dailyGameXPDate !== today) return DAILY_GAME_XP_CAP
        return Math.max(0, DAILY_GAME_XP_CAP - state.dailyGameXP)
      },

      getBox1Expressions: () => {
        const leitner = get().leitner
        return Object.keys(leitner).filter((id) => leitner[id].box === 1)
      },

      getBox2Expressions: () => {
        const leitner = get().leitner
        return Object.keys(leitner).filter((id) => leitner[id].box === 2)
      },

      getMasteredExpressions: () => {
        const leitner = get().leitner
        return Object.keys(leitner).filter((id) => leitner[id].box === 3)
      },
    }),
    {
      name: 'studyeng-game-progress',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
