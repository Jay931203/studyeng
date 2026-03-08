import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 미션 달성 할인율 테이블:
 * 0~70%  달성 → 0% 할인
 * 70~90% 달성 → 10% 할인 (연간 플랜 추가 할인)
 * 90~100% 달성 → 15% 할인 (연간 플랜 추가 할인)
 * 3개월 연속 90%+ → 20% 할인 (연간 갱신 시)
 *
 * 최저 마진 라인: 연간 48,900원 이하 불가
 */

interface DiscountTier {
  minRate: number // 최소 달성률 (%)
  discount: number // 할인율 (%)
}

const DISCOUNT_TIERS: DiscountTier[] = [
  { minRate: 90, discount: 15 },
  { minRate: 70, discount: 10 },
  { minRate: 0, discount: 0 },
]

/** 3개월 연속 90%+ 달성 시 보너스 할인율 */
const CONSECUTIVE_BONUS_DISCOUNT = 20

interface DiscountState {
  completedDays: string[] // 미션 올클리어한 날짜들 (YYYY-MM-DD)
  currentMonth: string // YYYY-MM 형식
  /** 연속 90%+ 달성 월 수 (월 리셋 시 이전 달 달성률 체크 후 갱신) */
  consecutiveHighMonths: number

  recordDailyCompletion: () => void
  getCompletionRate: () => number
  getDiscountRate: () => number
  getCompletedCount: () => number
  getDaysInCurrentMonth: () => number
  getNextTierInfo: () => { daysNeeded: number; nextDiscount: number } | null
  checkAndResetMonthly: () => void
  /** 3개월 연속 90%+ 달성 여부 */
  hasConsecutiveBonus: () => boolean
  resetState: () => void
}

function getCurrentMonthString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getTodayDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

function calculateDiscountRate(completionRate: number): number {
  for (const tier of DISCOUNT_TIERS) {
    if (completionRate >= tier.minRate) {
      return tier.discount
    }
  }
  return 0
}

export const useDiscountStore = create<DiscountState>()(
  persist(
    (set, get) => ({
      completedDays: [],
      currentMonth: getCurrentMonthString(),
      consecutiveHighMonths: 0,

      checkAndResetMonthly: () => {
        const thisMonth = getCurrentMonthString()
        const { currentMonth, completedDays, consecutiveHighMonths } = get()

        if (currentMonth !== thisMonth) {
          // 이전 달 달성률 계산 후 연속 90%+ 카운터 갱신
          const prevMonthDays = getDaysInMonth(currentMonth)
          const prevRate = prevMonthDays > 0 ? (completedDays.length / prevMonthDays) * 100 : 0

          const newConsecutive = prevRate >= 90
            ? consecutiveHighMonths + 1
            : 0

          set({
            completedDays: [],
            currentMonth: thisMonth,
            consecutiveHighMonths: newConsecutive,
          })
        }
      },

      recordDailyCompletion: () => {
        const today = getTodayDateString()
        const { checkAndResetMonthly } = get()

        // 먼저 월 리셋 확인
        checkAndResetMonthly()

        const currentDays = get().completedDays
        if (!currentDays.includes(today)) {
          set({ completedDays: [...currentDays, today] })
        }
      },

      getCompletedCount: () => {
        return get().completedDays.length
      },

      getDaysInCurrentMonth: () => {
        return getDaysInMonth(get().currentMonth)
      },

      getCompletionRate: () => {
        const { completedDays, currentMonth } = get()
        const totalDays = getDaysInMonth(currentMonth)
        return totalDays > 0 ? (completedDays.length / totalDays) * 100 : 0
      },

      getDiscountRate: () => {
        const state = get()
        // 3개월 연속 90%+ 보너스가 있으면 20% 적용
        if (state.consecutiveHighMonths >= 3) {
          return CONSECUTIVE_BONUS_DISCOUNT
        }
        const rate = state.getCompletionRate()
        return calculateDiscountRate(rate)
      },

      hasConsecutiveBonus: () => {
        return get().consecutiveHighMonths >= 3
      },

      resetState: () => {
        set({
          completedDays: [],
          currentMonth: getCurrentMonthString(),
          consecutiveHighMonths: 0,
        })
      },

      getNextTierInfo: () => {
        const { completedDays, currentMonth } = get()
        const totalDays = getDaysInMonth(currentMonth)
        const currentRate = get().getCompletionRate()
        const currentDiscount = calculateDiscountRate(currentRate)

        // 이미 최고 티어(15%) 또는 연속 보너스(20%)에 도달
        if (currentDiscount >= 15) return null

        // 다음 티어 찾기
        const nextTier = [...DISCOUNT_TIERS]
          .reverse()
          .find((t) => t.discount > currentDiscount)

        if (!nextTier) return null

        // 다음 티어에 필요한 총 완료일 수
        const daysNeededTotal = Math.ceil((nextTier.minRate / 100) * totalDays)
        const daysMore = Math.max(0, daysNeededTotal - completedDays.length)

        return {
          daysNeeded: daysMore,
          nextDiscount: nextTier.discount,
        }
      },
    }),
    { name: 'studyeng-discount' }
  )
)

export { DISCOUNT_TIERS, CONSECUTIVE_BONUS_DISCOUNT }
