'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { YEARLY_BASE_SAVINGS_PERCENT } from '@/lib/billingPricing'
import { useUserStore } from '@/stores/useUserStore'

export const TIER_THRESHOLDS = [0, 350, 800, 1500, 2200, 3000] as const
export const TIER_NAMES = ['Explorer', 'Learner', 'Regular', 'Dedicated', 'Champion', 'Legend'] as const
export const MONTHLY_PLAN_DISCOUNTS = [0, 10, 20, 30, 40, 50] as const
export const YEARLY_PLAN_RENEWAL_DISCOUNTS = [0, 5, 8, 10, 12, 15] as const
export const TIER_DISCOUNTS = MONTHLY_PLAN_DISCOUNTS
export const MONTHLY_ACTIVE_THRESHOLD = 300

export type TierLevel = 0 | 1 | 2 | 3 | 4 | 5
export type TierName = (typeof TIER_NAMES)[number]
export type BillingBenefitPlan = 'monthly' | 'yearly'
export type BenefitStatus = 'safe' | 'warning' | 'reduced'

export interface BenefitSnapshot {
  unlockedTier: TierLevel
  benefitTier: TierLevel
  status: BenefitStatus
  currentMonthXp: number
  currentMonthActive: boolean
  completedInactiveMonths: number
  nextTier: TierLevel | null
  nextTierXp: number
  monthlyDiscount: number
  yearlyRenewalDiscount: number
  yearlyBaseSavingsPercent: number
}

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

function countCompletedInactiveMonths(
  monthlyXpHistory: Record<string, number>,
  currentMonth: string,
): number {
  let count = 0
  let month = getPrevMonth(currentMonth)

  for (let index = 0; index < 12; index += 1) {
    const xp = monthlyXpHistory[month] ?? 0
    if (xp >= MONTHLY_ACTIVE_THRESHOLD) break
    count += 1
    month = getPrevMonth(month)
  }

  return count
}

function getBenefitTier(
  unlockedTier: TierLevel,
  monthlyXpHistory: Record<string, number>,
  currentMonth: string,
): TierLevel {
  const currentMonthXp = monthlyXpHistory[currentMonth] ?? 0
  if (currentMonthXp >= MONTHLY_ACTIVE_THRESHOLD) {
    return unlockedTier
  }

  const completedInactiveMonths = countCompletedInactiveMonths(monthlyXpHistory, currentMonth)
  if (completedInactiveMonths <= 1) return unlockedTier

  const penalty = completedInactiveMonths - 1
  return Math.max(0, unlockedTier - penalty) as TierLevel
}

function buildBenefitSnapshot(
  unlockedTier: TierLevel,
  benefitTier: TierLevel,
  monthlyXpHistory: Record<string, number>,
): BenefitSnapshot {
  const currentMonth = getCurrentMonthString()
  const currentMonthXp = monthlyXpHistory[currentMonth] ?? 0
  const currentMonthActive = currentMonthXp >= MONTHLY_ACTIVE_THRESHOLD
  const completedInactiveMonths = countCompletedInactiveMonths(monthlyXpHistory, currentMonth)
  const nextTier = unlockedTier >= MAX_TIER ? null : ((unlockedTier + 1) as TierLevel)
  const totalXp = useUserStore.getState().getTotalXP()
  const nextTierXp =
    nextTier === null ? 0 : Math.max(0, TIER_THRESHOLDS[nextTier] - totalXp)

  let status: BenefitStatus = 'safe'
  if (benefitTier < unlockedTier) {
    status = 'reduced'
  } else if (
    (unlockedTier > 0 || Object.keys(monthlyXpHistory).length > 0) &&
    !currentMonthActive
  ) {
    status = 'warning'
  }

  return {
    unlockedTier,
    benefitTier,
    status,
    currentMonthXp,
    currentMonthActive,
    completedInactiveMonths,
    nextTier,
    nextTierXp,
    monthlyDiscount: MONTHLY_PLAN_DISCOUNTS[benefitTier],
    yearlyRenewalDiscount: YEARLY_PLAN_RENEWAL_DISCOUNTS[benefitTier],
    yearlyBaseSavingsPercent: YEARLY_BASE_SAVINGS_PERCENT,
  }
}

interface TierState {
  currentTier: TierLevel
  benefitTier: TierLevel
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
  getPlanDiscount: (plan: BillingBenefitPlan) => number
  getNextTierXp: () => number
  getTierProgress: () => { current: TierLevel; next: TierLevel | null; progress: number }
  getCurrentMonthXp: () => number
  getTierName: () => TierName
  getBenefitSnapshot: () => BenefitSnapshot
}

export const useTierStore = create<TierState>()(
  persist(
    (set, get) => ({
      currentTier: 0,
      benefitTier: 0,
      monthlyXpHistory: {},
      championMonths: 0,
      championLegacy: false,
      lastTierUpdateDate: '',
      tierAtMonthStart: 0,
      tierMonthStartMonth: '',

      recalculateTier: () => {
        const totalXp = useUserStore.getState().getTotalXP()
        const unlockedTier = tierFromXp(totalXp)
        const currentMonth = getCurrentMonthString()
        const monthlyXpHistory = get().monthlyXpHistory
        const benefitTier = getBenefitTier(unlockedTier, monthlyXpHistory, currentMonth)

        set({
          currentTier: unlockedTier,
          benefitTier,
          lastTierUpdateDate: new Date().toISOString().slice(0, 10),
          tierAtMonthStart: unlockedTier,
          tierMonthStartMonth: currentMonth,
          championMonths: unlockedTier === MAX_TIER ? Math.max(get().championMonths, 1) : 0,
          championLegacy: unlockedTier === MAX_TIER ? get().championLegacy : false,
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
        return MONTHLY_PLAN_DISCOUNTS[get().benefitTier]
      },

      getPlanDiscount: (plan) => {
        const tier = get().benefitTier
        return plan === 'yearly'
          ? YEARLY_PLAN_RENEWAL_DISCOUNTS[tier]
          : MONTHLY_PLAN_DISCOUNTS[tier]
      },

      getNextTierXp: () => {
        const currentTier = get().currentTier
        if (currentTier >= MAX_TIER) return 0

        const totalXp = useUserStore.getState().getTotalXP()
        const nextThreshold = TIER_THRESHOLDS[currentTier + 1]
        return Math.max(0, nextThreshold - totalXp)
      },

      getTierProgress: () => {
        const currentTier = get().currentTier
        if (currentTier >= MAX_TIER) {
          return { current: currentTier, next: null, progress: 1 }
        }

        const totalXp = useUserStore.getState().getTotalXP()
        const currentThreshold = TIER_THRESHOLDS[currentTier]
        const nextThreshold = TIER_THRESHOLDS[currentTier + 1]
        const range = nextThreshold - currentThreshold
        const progress =
          range > 0 ? Math.min(1, Math.max(0, (totalXp - currentThreshold) / range)) : 1

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

      getBenefitSnapshot: () => {
        const state = get()
        return buildBenefitSnapshot(state.currentTier, state.benefitTier, state.monthlyXpHistory)
      },
    }),
    { name: 'studyeng-tier' },
  ),
)
