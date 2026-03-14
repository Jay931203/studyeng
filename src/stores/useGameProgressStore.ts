import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP, applyMonthlyStreakCap } from '@/lib/xp/streakBonus'
import { useUserStore } from './useUserStore'
import { useTierStore } from './useTierStore'

interface LeitnerEntry {
  box: 1 | 2 | 3
  lastSeenAt: number
  consecutiveCorrect: number
}

const DAILY_GAME_XP_CAP = DAILY_SESSION_XP_CAP

interface GameProgressState {
  leitner: { [exprId: string]: LeitnerEntry }
  bestStreak: number
  totalSessions: {
    expressionSwipe: number
    listenAndFill: number
  }
  dailyGameXP: number
  dailyGameXPDate: string

  // Session XP tracking (separate from per-card game XP)
  dailySessionXP: number
  dailySessionXPDate: string

  // Streak bonus tracking (once per day)
  streakBonusDate: string
  dailyStreakBonusXP: number
  monthlyStreakXP: number
  monthlyStreakXPMonth: string // YYYY-MM format

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

  /** Add session completion XP (capped at DAILY_SESSION_XP_CAP per day). Returns actual XP awarded. */
  addSessionXP: (amount: number) => number

  /** Record that streak bonus was awarded today. Returns actual XP awarded after monthly cap. */
  awardStreakBonus: (streakDays: number) => number

  /** Whether streak bonus has already been awarded today */
  isStreakBonusAwardedToday: () => boolean

  /** Get total game sessions across all types */
  getTotalSessions: () => number
  getDailyTotalGameXP: () => number
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
      dailySessionXP: 0,
      dailySessionXPDate: '',
      streakBonusDate: '',
      dailyStreakBonusXP: 0,
      monthlyStreakXP: 0,
      monthlyStreakXPMonth: '',
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
        const currentSession = state.dailySessionXPDate === today ? state.dailySessionXP : 0
        const remaining = Math.max(0, DAILY_GAME_XP_CAP - current - currentSession)
        const actual = Math.min(amount, remaining)

        if (actual > 0) {
          set({ dailyGameXP: current + actual, dailyGameXPDate: today })
        }

        // Feed capped amount into visible reward XP
        if (actual > 0) {
          useUserStore.getState().gainXp(Math.round(actual), '게임 숙련 XP')
        }

        return actual
      },

      getDailyGameXPRemaining: () => {
        const today = new Date().toISOString().slice(0, 10)
        const state = get()
        const masteryXp = state.dailyGameXPDate === today ? state.dailyGameXP : 0
        const sessionXp = state.dailySessionXPDate === today ? state.dailySessionXP : 0
        return Math.max(0, DAILY_GAME_XP_CAP - masteryXp - sessionXp)
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

      addSessionXP: (amount) => {
        const today = new Date().toISOString().slice(0, 10)
        const state = get()
        const current = state.dailySessionXPDate === today ? state.dailySessionXP : 0
        const currentMastery = state.dailyGameXPDate === today ? state.dailyGameXP : 0
        const remaining = Math.max(0, DAILY_SESSION_XP_CAP - current - currentMastery)
        const actual = Math.min(amount, remaining)

        if (actual > 0) {
          set({ dailySessionXP: current + actual, dailySessionXPDate: today })

          useUserStore.getState().gainXp(Math.round(actual), '게임 완료 XP')
        }

        return actual
      },

      awardStreakBonus: (streakDays) => {
        const today = new Date().toISOString().slice(0, 10)
        const currentMonth = today.slice(0, 7) // YYYY-MM
        const state = get()

        // Already awarded today
        if (state.streakBonusDate === today) return 0

        const proposed = getStreakBonusXP(streakDays)
        if (proposed <= 0) return 0

        const totalMonthlyXP = useTierStore.getState().getCurrentMonthXp()
        // Monthly streak XP tracking
        const monthlyStreakSoFar = state.monthlyStreakXPMonth === currentMonth
          ? state.monthlyStreakXP
          : 0

        const actual = applyMonthlyStreakCap(monthlyStreakSoFar, totalMonthlyXP, proposed)
        if (actual <= 0) {
          // Still mark as awarded today even if capped to 0
          set({ streakBonusDate: today, dailyStreakBonusXP: 0 })
          return 0
        }

        set({
          streakBonusDate: today,
          dailyStreakBonusXP: actual,
          monthlyStreakXP: monthlyStreakSoFar + actual,
          monthlyStreakXPMonth: currentMonth,
        })

        useUserStore.getState().gainXp(Math.round(actual), '연속 학습 보너스')

        return actual
      },

      isStreakBonusAwardedToday: () => {
        const today = new Date().toISOString().slice(0, 10)
        return get().streakBonusDate === today
      },

      getTotalSessions: () => {
        const sessions = get().totalSessions
        return sessions.expressionSwipe + sessions.listenAndFill
      },

      getDailyTotalGameXP: () => {
        const today = new Date().toISOString().slice(0, 10)
        const state = get()
        const sessionXp = state.dailySessionXPDate === today ? state.dailySessionXP : 0
        const masteryXp = state.dailyGameXPDate === today ? state.dailyGameXP : 0
        return sessionXp + masteryXp
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
