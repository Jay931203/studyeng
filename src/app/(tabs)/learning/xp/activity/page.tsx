'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { MONTHLY_ACTIVITY_EXPLAINER } from '@/lib/learningDashboard'
import {
  MONTHLY_ACTIVE_THRESHOLD,
  TIER_NAMES,
  TIER_THRESHOLDS,
  type TierLevel,
  useTierStore,
} from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildVisibleMonths(monthlyXpHistory: Record<string, number>, joinedMonth?: string) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const historyMonths = Object.keys(monthlyXpHistory).sort()
  const startMonth = joinedMonth ?? historyMonths[0] ?? currentMonth

  const [startYear, startValue] = startMonth.split('-').map(Number)
  const [currentYear, currentValue] = currentMonth.split('-').map(Number)
  const months: string[] = []

  const cursor = new Date(currentYear, currentValue - 1, 1)
  const start = new Date(startYear, startValue - 1, 1)

  while (cursor >= start) {
    months.push(getMonthKey(cursor))
    cursor.setMonth(cursor.getMonth() - 1)
  }

  return months
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(date)
}

function tierFromTotalXp(totalXp: number): TierLevel {
  for (let index = TIER_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (totalXp >= TIER_THRESHOLDS[index]) {
      return index as TierLevel
    }
  }
  return 0
}

function getTierAtMonth(monthKey: string, xpHistory: { amount: number; createdAt: string }[]) {
  const [year, month] = monthKey.split('-').map(Number)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime()
  const totalXp = xpHistory.reduce((sum, event) => {
    return new Date(event.createdAt).getTime() <= endOfMonth ? sum + event.amount : sum
  }, 0)
  return tierFromTotalXp(totalXp)
}

export default function MonthlyActivityPage() {
  const router = useRouter()
  const monthlyXpHistory = useTierStore((state) => state.monthlyXpHistory)
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)
  const xpHistory = useUserStore((state) => state.xpHistory)
  const benefitSnapshot = getBenefitSnapshot()
  const currentMonthKey = new Date().toISOString().slice(0, 7)

  const joinedMonth =
    xpHistory.length > 0 ? xpHistory[xpHistory.length - 1].createdAt.slice(0, 7) : undefined
  const visibleMonths = buildVisibleMonths(monthlyXpHistory, joinedMonth)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning/xp')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            월간 활동
          </p>
        </div>

        <SurfaceCard className="p-5">
          <p className="text-sm text-[var(--text-secondary)]">{MONTHLY_ACTIVITY_EXPLAINER}</p>
          <div className="mt-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
            <p className="text-[11px] text-[var(--text-secondary)]">현재 적용 혜택</p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
              {TIER_NAMES[benefitSnapshot.benefitTier]}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              이번 달 {MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 잠금된 최고 혜택으로 바로 복구할 수 있습니다.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            월별 기록
          </p>
          <div className="space-y-4">
            {visibleMonths.map((monthKey) => {
              const xp = monthlyXpHistory[monthKey] ?? 0
              const progress = Math.min(xp / MONTHLY_ACTIVE_THRESHOLD, 1)
              const active = xp >= MONTHLY_ACTIVE_THRESHOLD
              const isCurrentMonth = monthKey === currentMonthKey
              const tierAtMonth = getTierAtMonth(monthKey, xpHistory)

              return (
                <div
                  key={monthKey}
                  className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatMonthLabel(monthKey)}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {isCurrentMonth
                          ? '이번 달 진행 상황'
                          : active
                            ? '혜택 유지 기준을 채운 달'
                            : '혜택 유지 기준 아래로 내려간 달'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {active ? '기준 충족' : '기준 미달'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)]">활동 XP</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {xp.toLocaleString()} / {MONTHLY_ACTIVE_THRESHOLD} XP
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress * 100}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className={`h-full rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[var(--bg-card)] px-3 py-2">
                      <p className="text-[10px] text-[var(--text-muted)]">당시 잠금 등급</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                        {TIER_NAMES[tierAtMonth]}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
