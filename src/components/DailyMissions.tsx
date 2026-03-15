'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  DAILY_VIDEO_XP_TARGET,
  getBenefitStatusLine,
  getTodayIsoDate,
} from '@/lib/learningDashboard'
import {
  formatWon,
  getMonthlyDiscountedPrice,
  getSavingsPercent,
  getYearlyRenewalPrice,
  MONTHLY_REFERENCE_PRICE,
  YEARLY_REFERENCE_PRICE,
} from '@/lib/billingPricing'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import {
  MONTHLY_ACTIVE_THRESHOLD,
  MONTHLY_PLAN_DISCOUNTS,
  TIER_NAMES,
  TIER_THRESHOLDS,
  YEARLY_PLAN_RENEWAL_DISCOUNTS,
  useTierStore,
} from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'

export function TodayDashboard() {
  const router = useRouter()
  const [showTierGuide, setShowTierGuide] = useState(false)
  const totalXP = useUserStore((state) => state.getTotalXP())
  const streakDays = useUserStore((state) => state.streakDays)
  const getDailyTotalGameXP = useGameProgressStore((state) => state.getDailyTotalGameXP)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyStreakBonusXP = useGameProgressStore((state) => state.dailyStreakBonusXP)
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)

  const today = getTodayIsoDate()
  const benefitSnapshot = getBenefitSnapshot()
  const gameXpToday = getDailyTotalGameXP()
  const streakTarget = streakDays > 0 ? getStreakBonusXP(streakDays) : 10
  const streakBonusToday = streakBonusDate === today ? dailyStreakBonusXP : 0
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusPct = streakTarget > 0 ? Math.min((streakBonusToday / streakTarget) * 100, 100) : 0

  const currentMonthlyPrice = getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount)
  const currentYearlyPrice = getYearlyRenewalPrice(
    benefitSnapshot.yearlyRenewalDiscount,
    benefitSnapshot.monthlyDiscount,
  )

  const tierRows = TIER_NAMES.map((tierName, index) => {
    const monthlyPrice = getMonthlyDiscountedPrice(MONTHLY_PLAN_DISCOUNTS[index])
    const yearlyPrice = getYearlyRenewalPrice(
      YEARLY_PLAN_RENEWAL_DISCOUNTS[index],
      MONTHLY_PLAN_DISCOUNTS[index],
    )

    return {
      tierName,
      threshold: TIER_THRESHOLDS[index],
      monthlyPrice,
      yearlyPrice,
      monthlySavings: getSavingsPercent(MONTHLY_REFERENCE_PRICE, monthlyPrice),
      yearlySavings: getSavingsPercent(YEARLY_REFERENCE_PRICE, yearlyPrice),
      isCurrent: index === benefitSnapshot.benefitTier,
    }
  })

  return (
    <div className="mb-8 min-w-0 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            MY XP
          </span>
          <button
            type="button"
            onClick={() => router.push('/learning/xp')}
            className="text-[11px] font-medium text-[var(--text-muted)]"
          >
            상세보기
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTierGuide(true)}
          className="mt-4 w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--text-secondary)]">등급 상태</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                {TIER_NAMES[benefitSnapshot.benefitTier]}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                {getBenefitStatusLine(benefitSnapshot)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--bg-primary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]">
              혜택 안내
            </span>
          </div>
        </button>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatCard
            label="총 XP"
            value={`${totalXP.toLocaleString()} XP`}
            detail="누적 학습 보상 XP"
          />
          <StatCard
            label="오늘 적립"
            value={`+${todayTotal} XP`}
            detail="오늘 실제로 적립된 XP"
          />
        </div>

        <div className="mt-5 space-y-3">
          <ProgressRow
            label="게임"
            value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
            progress={gameXpPct}
            detail="게임 완료 기준으로 적립됩니다."
          />
          <ProgressRow
            label="영상"
            value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
            progress={videoXpPct}
            detail="영상 완료 기준으로 적립됩니다."
          />
          <ProgressRow
            label="출석 · 연속 학습"
            value={`${streakBonusToday}/${streakTarget} XP`}
            progress={streakBonusPct}
            detail={
              streakDays > 0
                ? `오늘 첫 영상 또는 게임 완료 시 ${streakTarget} XP 적립 · 현재 ${streakDays}일 연속`
                : '오늘 첫 영상 또는 게임 완료 시 10 XP부터 시작됩니다.'
            }
          />
        </div>
      </div>

      {showTierGuide && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowTierGuide(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-primary)] shadow-[var(--card-shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-[var(--border-card)] bg-[var(--bg-primary)] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                    혜택 안내
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    누적 XP로 등급이 열리고, 이번 달 300 XP를 채우면 현재 잠금 등급 혜택을 유지하거나 바로 복구할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTierGuide(false)}
                  className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
                <p className="text-[11px] text-[var(--text-secondary)]">현재 적용 혜택</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {TIER_NAMES[benefitSnapshot.benefitTier]}
                  </p>
                  <div className="text-right">
                    <p className="text-[11px] text-[var(--text-muted)]">월간 최종가</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatWon(currentMonthlyPrice)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    연간 최종가 {formatWon(currentYearlyPrice)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    이번 달 {benefitSnapshot.currentMonthXp.toLocaleString()} / {MONTHLY_ACTIVE_THRESHOLD} XP
                  </p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-[var(--border-card)]">
                {tierRows.map((row) => (
                  <div
                    key={row.tierName}
                    className={`rounded-2xl px-3 py-3 ${
                      row.isCurrent
                        ? 'border border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {row.tierName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {row.threshold === 0 ? '가입 즉시 시작' : `${row.threshold.toLocaleString()} XP부터`}
                        </p>
                      </div>
                      {row.isCurrent ? (
                        <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-text)]">
                          현재
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                      <CompactPrice
                        label="월간 최종가"
                        original={formatWon(MONTHLY_REFERENCE_PRICE)}
                        current={formatWon(row.monthlyPrice)}
                        detail={`총 ${row.monthlySavings}% 할인`}
                      />
                      <CompactPrice
                        label="연간 최종가"
                        original={formatWon(YEARLY_REFERENCE_PRICE)}
                        current={formatWon(row.yearlyPrice)}
                        detail={`총 ${row.yearlySavings}% 할인`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
                완료된 달 기준으로 300 XP 미만이 2개월 연속 이어지면 적용 혜택이 1단계 내려갑니다. 이번 달 300 XP를 채우면 잠금된 최고 혜택으로 바로 돌아옵니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressRow({
  label,
  value,
  progress,
  detail,
}: {
  label: string
  value: string
  progress: number
  detail?: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-medium text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress, 0)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
        />
      </div>
      {detail ? <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p> : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
      <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

function CompactPrice({
  label,
  original,
  current,
  detail,
}: {
  label: string
  original: string
  current: string
  detail: string
}) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[10px] text-[var(--text-muted)] line-through">{original}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{current}</span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

export const DailyMissions = TodayDashboard
