import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const FREE_DAILY_VIEW_LIMIT = 10
const FREE_SAVED_PHRASES_LIMIT = 20

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface PremiumState {
  isPremium: boolean
  dailyViewCount: number
  lastViewDate: string | null
  savedPhrasesUsed: number

  incrementDailyView: () => boolean
  canViewMore: () => boolean
  canSaveMorePhrases: () => boolean
  setPremium: (value: boolean) => void
  resetDailyCount: () => void
  incrementSavedPhrases: () => void
  getDailyViewsRemaining: () => number
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      dailyViewCount: 0,
      lastViewDate: null,
      savedPhrasesUsed: 0,

      incrementDailyView: () => {
        const state = get()
        if (state.isPremium) return true

        const today = getTodayString()

        // Reset count if it's a new day
        if (state.lastViewDate !== today) {
          set({ dailyViewCount: 1, lastViewDate: today })
          return true
        }

        if (state.dailyViewCount >= FREE_DAILY_VIEW_LIMIT) {
          return false
        }

        set({ dailyViewCount: state.dailyViewCount + 1 })
        return true
      },

      canViewMore: () => {
        const state = get()
        if (state.isPremium) return true

        const today = getTodayString()
        if (state.lastViewDate !== today) return true

        return state.dailyViewCount < FREE_DAILY_VIEW_LIMIT
      },

      canSaveMorePhrases: () => {
        const state = get()
        if (state.isPremium) return true
        return state.savedPhrasesUsed < FREE_SAVED_PHRASES_LIMIT
      },

      setPremium: (value) => set({ isPremium: value }),

      resetDailyCount: () => set({ dailyViewCount: 0, lastViewDate: null }),

      incrementSavedPhrases: () => {
        set((state) => ({ savedPhrasesUsed: state.savedPhrasesUsed + 1 }))
      },

      getDailyViewsRemaining: () => {
        const state = get()
        if (state.isPremium) return Infinity

        const today = getTodayString()
        if (state.lastViewDate !== today) return FREE_DAILY_VIEW_LIMIT

        return Math.max(0, FREE_DAILY_VIEW_LIMIT - state.dailyViewCount)
      },
    }),
    { name: 'studyeng-premium' }
  )
)

export { FREE_DAILY_VIEW_LIMIT, FREE_SAVED_PHRASES_LIMIT }
