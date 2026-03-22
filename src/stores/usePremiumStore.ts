import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isPremiumEnforcementEnabled } from '@/lib/billing'
import { usePhraseStore } from '@/stores/usePhraseStore'

const FREE_DAILY_VIEW_LIMIT = 10
const FREE_SAVED_PHRASES_LIMIT = 20
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000

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
  trialEndsAt: number | null

  /** Server-signed view count token (prevents localStorage tampering) */
  viewCountToken: string | null

  incrementDailyView: () => boolean
  canViewMore: () => boolean
  canSaveMorePhrases: () => boolean
  setPremiumEntitlement: (value: boolean) => void
  setPremiumOverride: (value: PremiumOverride) => void
  resetDailyCount: () => void
  resetState: () => void
  incrementSavedPhrases: () => void
  getDailyViewsRemaining: () => number
  isInTrial: () => boolean
  getTrialDaysRemaining: () => number
  initTrial: () => void

  /**
   * Server-enforced view increment for authenticated users.
   * Falls back to client-side if server is unreachable.
   * Returns true if the view is allowed.
   */
  serverIncrementView: () => Promise<boolean>

  /**
   * Server-enforced trial initialization for authenticated users.
   * Prevents trial reset by checking/creating server-side trial record.
   */
  serverInitTrial: () => Promise<void>
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
      trialEndsAt: null,
      viewCountToken: null,

      isInTrial: () => {
        const state = get()
        return state.trialEndsAt !== null && Date.now() < state.trialEndsAt
      },

      getTrialDaysRemaining: () => {
        const state = get()
        if (state.trialEndsAt === null) return 0
        const msLeft = state.trialEndsAt - Date.now()
        if (msLeft <= 0) return 0
        return Math.ceil(msLeft / (24 * 60 * 60 * 1000))
      },

      initTrial: () => {
        const state = get()
        if (state.trialEndsAt === null) {
          set({ trialEndsAt: Date.now() + TRIAL_DURATION_MS })
        }
      },

      serverInitTrial: async () => {
        try {
          const res = await fetch('/api/billing/init-trial', { method: 'POST' })
          if (!res.ok) {
            // Server unavailable — fall back to client-only
            get().initTrial()
            return
          }

          const data = await res.json()

          if (!data.serverEnforced) {
            // Server not configured — fall back to client-only
            get().initTrial()
            return
          }

          if (data.trialEndsAt) {
            set({ trialEndsAt: data.trialEndsAt })

            // If trial is still active, mark as premium via entitlement
            if (data.status === 'trialing' && data.trialEndsAt > Date.now()) {
              set((state) => ({
                entitlementPremium: true,
                isPremium: resolvePremiumAccess(true, state.premiumOverride),
              }))
            }
          } else {
            // Server said no trial — don't allow local-only trial
            // (trialEndsAt stays null or whatever it was)
          }
        } catch {
          // Network error — fall back to client-only trial
          get().initTrial()
        }
      },

      incrementDailyView: () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return true

        // Trial users pass
        if (state.trialEndsAt !== null && Date.now() < state.trialEndsAt) return true

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

      serverIncrementView: async () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return true

        // Trial users pass
        if (state.trialEndsAt !== null && Date.now() < state.trialEndsAt) return true

        try {
          const res = await fetch('/api/billing/view-count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.viewCountToken }),
          })

          if (!res.ok) {
            // Server error — fall back to client-side
            return get().incrementDailyView()
          }

          const data = await res.json()

          if (!data.serverEnforced) {
            // Server not configured (anonymous or no Supabase) — client-side fallback
            return get().incrementDailyView()
          }

          if (data.premium) {
            return true
          }

          // Update local state to match server
          if (data.token) {
            set({ viewCountToken: data.token })
          }
          set({
            dailyViewCount: data.count,
            lastViewDate: getTodayString(),
          })

          return data.canView
        } catch {
          // Network error — fall back to client-side
          return get().incrementDailyView()
        }
      },

      canViewMore: () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return true

        // Trial users can always watch
        if (state.trialEndsAt !== null && Date.now() < state.trialEndsAt) return true

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

      resetDailyCount: () => set({ dailyViewCount: 0, lastViewDate: null, viewCountToken: null }),

      resetState: () =>
        set((state) => ({
          isPremium: false,
          entitlementPremium: false,
          premiumOverride: 'inherit',
          dailyViewCount: 0,
          lastViewDate: null,
          savedPhrasesUsed: 0,
          trialEndsAt: state.trialEndsAt,
          viewCountToken: null,
        })),

      incrementSavedPhrases: () => {
        set((state) => ({
          savedPhrasesUsed: Math.max(state.savedPhrasesUsed, getSavedPhraseCount()),
        }))
      },

      getDailyViewsRemaining: () => {
        const state = get()
        if (!isPremiumEnforcementEnabled() || state.isPremium) return Infinity

        // Trial users have unlimited views
        if (state.trialEndsAt !== null && Date.now() < state.trialEndsAt) return Infinity

        const today = getTodayString()
        if (state.lastViewDate !== today) return FREE_DAILY_VIEW_LIMIT

        return Math.max(0, FREE_DAILY_VIEW_LIMIT - state.dailyViewCount)
      },
    }),
    {
      name: 'studyeng-premium',
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { premiumOverride, ...rest } = state
        return rest
      },
    }
  )
)

export { FREE_DAILY_VIEW_LIMIT, FREE_SAVED_PHRASES_LIMIT }
