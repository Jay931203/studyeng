'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  DAILY_VIDEO_XP_TARGET,
  getBenefitStatusLine,
  getStreakBonusProgress,
  getTodayIsoDate,
} from '@/lib/learningDashboard'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import {
  MONTHLY_ACTIVE_THRESHOLD,
  MONTHLY_PLAN_DISCOUNTS,
  TIER_NAMES,
  TIER_THRESHOLDS,
  YEARLY_BASE_SAVINGS_PERCENT,
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
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusToday = streakBonusDate === today ? dailyStreakBonusXP : 0
  const streakBonusProgress = getStreakBonusProgress(streakDays, streakBonusDate === today)
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday

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
            onClick={() => setShowTierGuide(true)}
          />
        </div>

        <p className="mt-5 text-3xl font-bold text-[var(--text-primary)]">
          +{todayTotal}
          <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">XP</span>
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">오늘 실제로 쌓인 XP만 합산해서 보여줍니다.</p>

        <div className="mt-4 space-y-3">
          <ProgressRow
            label="게임"
            value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
            progress={gameXpPct}
            detail="집중 학습 보상, 하루 최대 15 XP"
          />
          <ProgressRow
            label="영상"
            value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
            progress={videoXpPct}
            detail="시청 완료 보상, 하루 최대 15 XP"
          />
          <ProgressRow
            label="연속 학습 보너스"
            value={
              streakBonusToday > 0
                ? `${streakBonusToday}/${streakBonusToday} XP`
                : streakDays > 0
                  ? `0/${getStreakBonusXP(streakDays)} XP`
                  : '잠김'
            }
            progress={streakBonusProgress.progress * 100}
            detail={
              streakDays > 0
                ? `오늘 첫 영상 또는 게임 완료 시 1회 적립 · 현재 ${streakDays}일 기준`
                : '오늘 첫 영상 또는 게임을 완료하면 연속 학습이 시작됩니다.'
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
                  등급 잠금은 누적 XP로 결정되고, 실제 구독 혜택은 최근 월간 활동에 따라 적용됩니다.
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

            <div className="space-y-2">
              {TIER_NAMES.map((tierName, index) => (
                <div
                  key={tierName}
                  className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{tierName}</p>
                    <div className="text-right">
                      <p className="text-xs font-medium text-[var(--accent-text)]">
                        월간 {MONTHLY_PLAN_DISCOUNTS[index]}%
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        연간 갱신 {YEARLY_PLAN_RENEWAL_DISCOUNTS[index]}%
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    {index === 0
                      ? `${TIER_THRESHOLDS[0]} XP부터 시작`
                      : `${TIER_THRESHOLDS[index].toLocaleString()} XP 이상`}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
              연간 플랜은 기본가가 이미 월간 12회 대비 약 {YEARLY_BASE_SAVINGS_PERCENT}% 저렴합니다.
              완료된 월 기준으로 {MONTHLY_ACTIVE_THRESHOLD} XP 미만이 2개월 연속 이어지면 다음 달
              혜택 단계가 1단계 낮아집니다. 이번 달에 {MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 위험
              상태를 바로 해소할 수 있습니다.
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
}: {
  label: string
  title: string
  detail: string
  onClick?: () => void
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
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
    </Element>
  )
}

export const DailyMissions = TodayDashboard
