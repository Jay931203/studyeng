import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isPremiumEnforcementEnabled } from '@/lib/billing'
import { usePhraseStore } from '@/stores/usePhraseStore'

const FREE_DAILY_VIEW_LIMIT = 5
const FREE_SAVED_PHRASES_LIMIT = 20

export type PremiumOverride = 'inherit' | 'premium' | 'free'

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getSavedPhraseCount() {
  return usePhraseStore.getState().phrases.length
}

interface PremiumState {
  isPremium: boolean
  entitlementPremium: boolean
  premiumOverride: PremiumOverride
  dailyViewCount: number
  lastViewDate: string | null
  savedPhrasesUsed: number

  incrementDailyView: () => boolean
  canViewMore: () => boolean
  canSaveMorePhrases: () => boolean
  setPremiumEntitlement: (value: boolean) => void
  setPremiumOverride: (value: PremiumOverride) => void
  resetDailyCount: () => void
  resetState: () => void
  incrementSavedPhrases: () => void
  getDailyViewsRemaining: () => number
}

function resolvePremiumAccess(
  entitlementPremium: boolean,
  premiumOverride: PremiumOverride,
) {
  if (premiumOverride === 'premium') return true
  if (premiumOverride === 'free') return false
  return entitlementPremium
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      entitlementPremium: false,
      premiumOverride: 'inherit',
      dailyViewCount: 0,
      lastViewDate: null,
      savedPhrasesUsed: 0,

      incrementDailyView: () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return true

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
        if (!isPremiumEnforcementEnabled() || state.isPremium) return true

        const today = getTodayString()
        if (state.lastViewDate !== today) return true

        return state.dailyViewCount < FREE_DAILY_VIEW_LIMIT
      },

      canSaveMorePhrases: () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return true
        return getSavedPhraseCount() < FREE_SAVED_PHRASES_LIMIT
      },

      setPremiumEntitlement: (value) =>
        set((state) => ({
          entitlementPremium: value,
          isPremium: resolvePremiumAccess(value, state.premiumOverride),
        })),

      setPremiumOverride: (value) =>
        set((state) => ({
          premiumOverride: value,
          isPremium: resolvePremiumAccess(state.entitlementPremium, value),
        })),

      resetDailyCount: () => set({ dailyViewCount: 0, lastViewDate: null }),

      resetState: () =>
        set({
          isPremium: false,
          entitlementPremium: false,
          premiumOverride: 'inherit',
          dailyViewCount: 0,
          lastViewDate: null,
          savedPhrasesUsed: 0,
        }),

      incrementSavedPhrases: () => {
        set((state) => ({
          savedPhrasesUsed: Math.max(state.savedPhrasesUsed, getSavedPhraseCount()),
        }))
      },

      getDailyViewsRemaining: () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return Infinity

        const today = getTodayString()
        if (state.lastViewDate !== today) return FREE_DAILY_VIEW_LIMIT

        return Math.max(0, FREE_DAILY_VIEW_LIMIT - state.dailyViewCount)
      },
    }),
    { name: 'studyeng-premium' }
  )
)

export { FREE_DAILY_VIEW_LIMIT, FREE_SAVED_PHRASES_LIMIT }
