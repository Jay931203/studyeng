'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  DAILY_VIDEO_XP_TARGET,
  getStreakBonusProgress,
  getTierStatusDetail,
  getTodayIsoDate,
} from '@/lib/learningDashboard'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { TIER_NAMES, useTierStore } from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'

export function TodayDashboard() {
  const router = useRouter()
  const totalXP = useUserStore((state) => state.getTotalXP())
  const streakDays = useUserStore((state) => state.streakDays)
  const getDailyTotalGameXP = useGameProgressStore((state) => state.getDailyTotalGameXP)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyStreakBonusXP = useGameProgressStore((state) => state.dailyStreakBonusXP)
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())
  const currentTier = useTierStore((state) => state.currentTier)
  const getTierProgress = useTierStore((state) => state.getTierProgress)
  const getNextTierXp = useTierStore((state) => state.getNextTierXp)

  const today = getTodayIsoDate()
  const gameXpToday = getDailyTotalGameXP()
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusToday = streakBonusDate === today ? dailyStreakBonusXP : 0
  const streakBonusProgress = getStreakBonusProgress(streakDays, streakBonusDate === today)
  const tierProgress = getTierProgress()
  const nextTierXp = getNextTierXp()
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday

  return (
    <div className="mb-8 min-w-0 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            TODAY&apos;S XP
          </span>
          <button
            type="button"
            onClick={() => router.push('/learning/xp')}
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            DETAIL
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
            title={TIER_NAMES[currentTier]}
            detail={getTierStatusDetail(nextTierXp, tierProgress.next)}
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
          />
          <ProgressRow
            label="영상"
            value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
            progress={videoXpPct}
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
                ? `${streakDays}일 연속 학습 기준 보너스, 하루 1회만 적립`
                : '연속 학습을 시작하면 보너스가 열립니다.'
            }
          />
        </div>
      </div>
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
}: {
  label: string
  title: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

export const DailyMissions = TodayDashboard
