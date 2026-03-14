'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from '@/stores/useUserStore'

export const TIER_THRESHOLDS = [0, 350, 800, 1500, 2200, 3000] as const
export const TIER_NAMES = ['Explorer', 'Learner', 'Regular', 'Dedicated', 'Champion', 'Legend'] as const
export const TIER_DISCOUNTS = [0, 10, 20, 30, 40, 50] as const
export const MONTHLY_ACTIVE_THRESHOLD = 300

export type TierLevel = 0 | 1 | 2 | 3 | 4 | 5
export type TierName = (typeof TIER_NAMES)[number]

const MAX_TIER = (TIER_THRESHOLDS.length - 1) as TierLevel

function getCurrentMonthString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPrevMonth(month: string): string {
  const [year, value] = month.split('-').map(Number)
  const date = new Date(year, value - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function tierFromXp(totalXp: number): TierLevel {
  for (let index = TIER_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (totalXp >= TIER_THRESHOLDS[index]) {
      return index as TierLevel
    }
  }
  return 0
}

function countConsecutiveInactiveMonths(
  monthlyXpHistory: Record<string, number>,
  fromMonth: string,
): number {
  let count = 0
  let month = getPrevMonth(fromMonth)

  for (let index = 0; index < 12; index += 1) {
    const xp = monthlyXpHistory[month] ?? 0
    if (xp >= MONTHLY_ACTIVE_THRESHOLD) break
    count += 1
    month = getPrevMonth(month)
  }

  return count
}

interface TierState {
  currentTier: TierLevel
  monthlyXpHistory: Record<string, number>
  championMonths: number
  championLegacy: boolean
  lastTierUpdateDate: string
  tierAtMonthStart: TierLevel
  tierMonthStartMonth: string

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

function getUnlockedTier(totalXp: number) {
  return tierFromXp(totalXp)
}

function getEffectiveTier(
  unlockedTier: TierLevel,
  monthlyXpHistory: Record<string, number>,
  currentMonth: string,
) {
  const inactiveMonths = countConsecutiveInactiveMonths(monthlyXpHistory, currentMonth)
  if (inactiveMonths >= 3) return 0 as TierLevel
  if (inactiveMonths <= 0) return unlockedTier
  return Math.max(0, unlockedTier - inactiveMonths) as TierLevel
}

export const useTierStore = create<TierState>()(
  persist(
    (set, get) => ({
      currentTier: 0,
      monthlyXpHistory: {},
      championMonths: 0,
      championLegacy: false,
      lastTierUpdateDate: '',
      tierAtMonthStart: 0,
      tierMonthStartMonth: '',

      recalculateTier: () => {
        const totalXp = useUserStore.getState().getTotalXP()
        const unlockedTier = getUnlockedTier(totalXp)
        const {
          currentTier,
          monthlyXpHistory,
          tierAtMonthStart,
          tierMonthStartMonth,
        } = get()
        const currentMonth = getCurrentMonthString()

        let monthStartTier = tierAtMonthStart
        let monthStartMonth = tierMonthStartMonth

        if (monthStartMonth !== currentMonth) {
          monthStartTier = currentTier
          monthStartMonth = currentMonth
        }

        let effectiveTier = getEffectiveTier(unlockedTier, monthlyXpHistory, currentMonth)
        if (effectiveTier > monthStartTier + 1) {
          effectiveTier = Math.min(effectiveTier, monthStartTier + 1) as TierLevel
        }

        set({
          currentTier: effectiveTier,
          lastTierUpdateDate: new Date().toISOString().slice(0, 10),
          tierAtMonthStart: monthStartTier,
          tierMonthStartMonth: monthStartMonth,
          championMonths: effectiveTier === MAX_TIER ? 1 : 0,
          championLegacy: false,
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
        if (xp <= 0) return
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
        get().recalculateTier()
      },

      getCurrentDiscount: () => {
        return TIER_DISCOUNTS[get().currentTier]
      },

      getNextTierXp: () => {
        const { currentTier } = get()
        if (currentTier >= MAX_TIER) return 0

        const totalXp = useUserStore.getState().getTotalXP()
        const nextThreshold = TIER_THRESHOLDS[currentTier + 1]
        return Math.max(0, nextThreshold - totalXp)
      },

      getTierProgress: () => {
        const { currentTier } = get()
        if (currentTier >= MAX_TIER) {
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
