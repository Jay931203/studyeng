'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from '@/stores/useUserStore'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TIER_THRESHOLDS = [0, 300, 700, 1400, 2800] as const
export const TIER_NAMES = ['Explorer', 'Learner', 'Regular', 'Dedicated', 'Champion'] as const
export const TIER_DISCOUNTS = [0, 10, 20, 30, 40] as const
export const MONTHLY_ACTIVE_THRESHOLD = 150

export type TierLevel = 0 | 1 | 2 | 3 | 4
export type TierName = (typeof TIER_NAMES)[number]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentMonthString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get the previous month string (YYYY-MM) from a given month string.
 */
function getPrevMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year, m - 2, 1) // m-1 is current (0-based), m-2 is previous
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Determine tier from cumulative XP.
 */
function tierFromXp(totalXp: number): TierLevel {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= TIER_THRESHOLDS[i]) return i as TierLevel
  }
  return 0
}

/**
 * Count consecutive inactive months going back from `fromMonth` (exclusive).
 * An inactive month is one where monthlyXpHistory[month] < MONTHLY_ACTIVE_THRESHOLD.
 */
function countConsecutiveInactiveMonths(
  monthlyXpHistory: Record<string, number>,
  fromMonth: string,
): number {
  let count = 0
  let month = getPrevMonth(fromMonth)

  for (let i = 0; i < 12; i++) {
    const xp = monthlyXpHistory[month] ?? 0
    if (xp >= MONTHLY_ACTIVE_THRESHOLD) break
    count++
    month = getPrevMonth(month)
  }

  return count
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierState {
  currentTier: TierLevel
  monthlyXpHistory: Record<string, number> // e.g., "2026-03": 450
  championMonths: number // consecutive months at Champion tier
  championLegacy: boolean // 2+ months Champion -> 1 demotion grace
  lastTierUpdateDate: string // YYYY-MM-DD

  // Track the tier at month start to enforce same-month 2-tier jump prevention
  tierAtMonthStart: TierLevel
  tierMonthStartMonth: string // YYYY-MM

  // Actions
  recalculateTier: () => void
  recordMonthlyXp: (month: string, xp: number) => void
  addMonthlyXp: (xp: number) => void
  applyDecay: () => void
  getCurrentDiscount: () => number
  getNextTierXp: () => number
  getTierProgress: () => { current: TierLevel; next: TierLevel | null; progress: number }
  getCurrentMonthXp: () => number
  getTierName: () => TierName
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTierStore = create<TierState>()(
  persist(
    (set, get) => ({
      currentTier: 0 as TierLevel,
      monthlyXpHistory: {},
      championMonths: 0,
      championLegacy: false,
      lastTierUpdateDate: '',
      tierAtMonthStart: 0 as TierLevel,
      tierMonthStartMonth: '',

      recalculateTier: () => {
        const totalXp = useUserStore.getState().getTotalXP()
        const xpTier = tierFromXp(totalXp)
        const {
          currentTier,
          tierAtMonthStart,
          tierMonthStartMonth,
          championMonths,
        } = get()
        const currentMonth = getCurrentMonthString()

        // Initialize tierAtMonthStart if new month or never set
        let monthStart = tierAtMonthStart
        let monthStartMonth = tierMonthStartMonth
        if (tierMonthStartMonth !== currentMonth) {
          monthStart = currentTier
          monthStartMonth = currentMonth
        }

        // Same-month 2-tier jump prevention:
        // Cannot go more than 1 tier above tierAtMonthStart within the same month
        let cappedTier = xpTier
        if (monthStartMonth === currentMonth && xpTier > monthStart + 1) {
          cappedTier = Math.min(xpTier, monthStart + 1) as TierLevel
        }

        // Champion months tracking
        let newChampionMonths = championMonths
        let newChampionLegacy = get().championLegacy

        if (cappedTier === 4) {
          // Already Champion or becoming Champion
          if (currentTier === 4 && cappedTier === 4) {
            // Staying Champion — championMonths incremented in applyDecay (monthly)
          }
        } else {
          // Not Champion, reset counter (unless legacy applies — handled in applyDecay)
          if (currentTier !== 4) {
            newChampionMonths = 0
          }
        }

        // Check if Champion for 2+ months → grant legacy
        if (newChampionMonths >= 2) {
          newChampionLegacy = true
        }

        set({
          currentTier: cappedTier,
          lastTierUpdateDate: new Date().toISOString().slice(0, 10),
          tierAtMonthStart: monthStart,
          tierMonthStartMonth: monthStartMonth,
          championMonths: newChampionMonths,
          championLegacy: newChampionLegacy,
        })
      },

      recordMonthlyXp: (month, xp) => {
        set((state) => ({
          monthlyXpHistory: {
            ...state.monthlyXpHistory,
            [month]: xp,
          },
        }))
      },

      addMonthlyXp: (xp) => {
        const month = getCurrentMonthString()
        const currentXp = get().monthlyXpHistory[month] ?? 0
        set((state) => ({
          monthlyXpHistory: {
            ...state.monthlyXpHistory,
            [month]: currentXp + xp,
          },
        }))
      },

      applyDecay: () => {
        const {
          currentTier,
          monthlyXpHistory,
          championLegacy,
          championMonths,
        } = get()
        const currentMonth = getCurrentMonthString()
        const inactiveMonths = countConsecutiveInactiveMonths(monthlyXpHistory, currentMonth)

        if (inactiveMonths === 0) {
          // Active last month — no decay. If Champion, increment months.
          let newChampionMonths = currentTier === 4 ? championMonths + 1 : 0
          let newLegacy = championLegacy
          if (newChampionMonths >= 2) {
            newLegacy = true
          }
          set({
            championMonths: newChampionMonths,
            championLegacy: newLegacy,
          })
          return
        }

        // Champion Legacy: 1 grace period (absorbs first demotion)
        if (championLegacy && currentTier === 4 && inactiveMonths <= 1) {
          // Grace period used — consume legacy
          set({ championLegacy: false })
          return
        }

        // Apply decay
        let newTier: TierLevel

        if (inactiveMonths >= 3) {
          // 3+ months inactive → reset to Explorer
          newTier = 0
        } else {
          // Demote by number of inactive months, but don't go below 0
          const demotions = championLegacy && currentTier === 4 ? inactiveMonths - 1 : inactiveMonths
          newTier = Math.max(0, currentTier - demotions) as TierLevel
        }

        // However, if user's cumulative XP qualifies for a higher tier, they can recover
        // on next recalculateTier() call after becoming active again.
        // Decay only affects the currentTier, not the XP.

        set({
          currentTier: newTier,
          championMonths: 0,
          championLegacy: newTier === 4 ? championLegacy : false,
          lastTierUpdateDate: new Date().toISOString().slice(0, 10),
        })
      },

      getCurrentDiscount: () => {
        return TIER_DISCOUNTS[get().currentTier]
      },

      getNextTierXp: () => {
        const { currentTier } = get()
        if (currentTier >= 4) return 0 // Already at max

        const totalXp = useUserStore.getState().getTotalXP()
        const nextThreshold = TIER_THRESHOLDS[currentTier + 1]
        return Math.max(0, nextThreshold - totalXp)
      },

      getTierProgress: () => {
        const { currentTier } = get()
        if (currentTier >= 4) {
          return { current: currentTier, next: null, progress: 1 }
        }

        const totalXp = useUserStore.getState().getTotalXP()
        const currentThreshold = TIER_THRESHOLDS[currentTier]
        const nextThreshold = TIER_THRESHOLDS[currentTier + 1]
        const range = nextThreshold - currentThreshold

        const progress = range > 0
          ? Math.min(1, Math.max(0, (totalXp - currentThreshold) / range))
          : 1

        return {
          current: currentTier,
          next: (currentTier + 1) as TierLevel,
          progress,
        }
      },

      getCurrentMonthXp: () => {
        const month = getCurrentMonthString()
        return get().monthlyXpHistory[month] ?? 0
      },

      getTierName: () => {
        return TIER_NAMES[get().currentTier]
      },
    }),
    { name: 'studyeng-tier' },
  ),
)
