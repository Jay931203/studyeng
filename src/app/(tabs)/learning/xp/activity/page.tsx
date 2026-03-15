'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { buildMonthlyXpTrend, MONTHLY_ACTIVITY_EXPLAINER } from '@/lib/learningDashboard'
import { MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES, useTierStore } from '@/stores/useTierStore'

export default function MonthlyActivityPage() {
  const router = useRouter()
  const monthlyXpHistory = useTierStore((state) => state.monthlyXpHistory)
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)
  const benefitSnapshot = getBenefitSnapshot()
  const monthlyTrend = buildMonthlyXpTrend(monthlyXpHistory, 6)
  const currentMonthKey = new Date().toISOString().slice(0, 7)

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
            <p className="mt-1 text-base font-semibold text-[var(--accent-primary)]">
              {TIER_NAMES[benefitSnapshot.benefitTier]}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              이번 달 {MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 현재 잠금 등급 혜택을 유지하거나 복구할 수 있습니다.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            월별 기록
          </p>
          <div className="space-y-4">
            {monthlyTrend.map((point) => {
              const isCurrentMonth = point.key === currentMonthKey
              return (
                <div key={point.key} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{point.label}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {isCurrentMonth
                          ? '이번 달 진행 상황'
                          : point.active
                            ? '혜택 유지 기준을 채운 달'
                            : '혜택 유지 기준 아래로 내려간 달'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        point.active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {point.active ? '기준 충족' : '기준 미달'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">활동 XP</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {point.xp.toLocaleString()} / {MONTHLY_ACTIVE_THRESHOLD} XP
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${point.progress * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={`h-full rounded-full ${point.active ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
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
