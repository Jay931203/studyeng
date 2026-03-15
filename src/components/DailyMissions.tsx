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
  formatDiscountText,
  formatWon,
  getMonthlyDiscountedPrice,
  getYearlyRenewalPrice,
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
  const streakTarget = getStreakBonusXP(Math.max(streakDays, 1))
  const streakBonusToday = streakBonusDate === today ? dailyStreakBonusXP : 0
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusPct = streakTarget > 0 ? Math.min((streakBonusToday / streakTarget) * 100, 100) : 0

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
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            상세 보기
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoBlock
            label="현재 총 XP"
            title={`${totalXP.toLocaleString()} XP`}
            detail="지금까지 누적된 전체 학습 XP"
          />
          <InfoBlock
            label="등급 상태"
            title={TIER_NAMES[benefitSnapshot.benefitTier]}
            detail={getBenefitStatusLine(benefitSnapshot)}
            titleClassName="text-[var(--accent-primary)]"
            onClick={() => setShowTierGuide(true)}
          />
        </div>

        <p className="mt-5 text-3xl font-bold text-[var(--text-primary)]">
          +{todayTotal}
          <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">XP</span>
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">오늘 실제로 적립된 XP만 합산해서 보여줍니다.</p>

        <div className="mt-4 space-y-3">
          <ProgressRow
            label="게임"
            value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
            progress={gameXpPct}
            detail="하루 최대 15 XP · 게임 세션 완료 기준으로 적립됩니다."
          />
          <ProgressRow
            label="영상"
            value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
            progress={videoXpPct}
            detail="하루 최대 15 XP · 영상 완료 기준으로 적립됩니다."
          />
          <ProgressRow
            label="연속 학습 보너스"
            value={
              streakBonusToday > 0
                ? `${streakBonusToday}/${streakTarget} XP`
                : streakDays > 0
                  ? `0/${streakTarget} XP`
                  : '잠김'
            }
            progress={streakBonusPct}
            detail={
              streakDays > 0
                ? `오늘 첫 영상 또는 게임 완료 시 10 XP · 현재 ${streakDays}일 연속 학습`
                : '오늘 첫 영상 또는 게임을 완료하면 연속 학습 보너스가 시작됩니다.'
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
            className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-primary)] p-5 shadow-[var(--card-shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                  혜택 안내
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  혜택은 누적 XP로 잠기고, 월간 활동이 부족하면 적용 혜택만 내려갑니다.
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

            <div className="mb-4 rounded-2xl border border-[var(--accent-primary)] bg-[var(--accent-glow)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                현재 적용 혜택
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--accent-primary)]">
                {TIER_NAMES[benefitSnapshot.benefitTier]}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {getBenefitStatusLine(benefitSnapshot)}
              </p>
            </div>

            <div className="space-y-2">
              {TIER_NAMES.map((tierName, index) => {
                const monthlyDiscount = MONTHLY_PLAN_DISCOUNTS[index]
                const yearlyDiscount = YEARLY_PLAN_RENEWAL_DISCOUNTS[index]
                const isCurrent = index === benefitSnapshot.benefitTier
                const isUnlocked = index <= benefitSnapshot.unlockedTier

                return (
                  <div
                    key={tierName}
                    className={`rounded-2xl border px-4 py-3 ${
                      isCurrent
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                        : 'border-[var(--border-card)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {tierName}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          {index === 0
                            ? '0 XP부터 시작'
                            : `${TIER_THRESHOLDS[index].toLocaleString()} XP 이상`}
                        </p>
                      </div>
                      {isCurrent ? (
                        <span className="rounded-full bg-[var(--accent-primary)] px-2 py-1 text-[10px] font-semibold text-white">
                          현재 혜택
                        </span>
                      ) : isUnlocked ? (
                        <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                          잠금 완료
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <GuidePrice
                        label="월간 예상가"
                        value={formatWon(getMonthlyDiscountedPrice(monthlyDiscount))}
                        detail={formatDiscountText('추가 할인', monthlyDiscount)}
                      />
                      <GuidePrice
                        label="연간 갱신가"
                        value={formatWon(getYearlyRenewalPrice(yearlyDiscount))}
                        detail={formatDiscountText('갱신 할인', yearlyDiscount)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
              완료된 월 기준으로 {MONTHLY_ACTIVE_THRESHOLD} XP 미만이 2개월 연속 이어지면 적용 혜택이 1단계 낮아집니다.
              이번 달 {MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 원래 잠금 등급 혜택으로 바로 복구됩니다.
            </p>
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
      {detail ? (
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
      ) : null}
    </div>
  )
}

function InfoBlock({
  label,
  title,
  detail,
  onClick,
  titleClassName,
}: {
  label: string
  title: string
  detail: string
  onClick?: () => void
  titleClassName?: string
}) {
  const Element = onClick ? 'button' : 'div'

  return (
    <Element
      {...(onClick ? { type: 'button', onClick } : {})}
      className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3 text-left"
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
        {onClick ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            안내
          </span>
        ) : null}
      </div>
      <p className={`text-sm font-semibold ${titleClassName ?? 'text-[var(--text-primary)]'}`}>{title}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
    </Element>
  )
}

function GuidePrice({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl bg-[var(--bg-primary)]/70 px-3 py-2">
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

export const DailyMissions = TodayDashboard
