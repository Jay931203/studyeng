'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  DAILY_VIDEO_XP_TARGET,
  getStreakProgress,
  getTodayIsoDate,
  getTodayMilestoneSummary,
  MILESTONE_EXPLAINER,
} from '@/lib/learningDashboard'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { TIER_NAMES, useTierStore } from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'

export function TodayDashboard() {
  const router = useRouter()
  const streakDays = useUserStore((state) => state.streakDays)
  const dailySessionXP = useGameProgressStore((state) => state.dailySessionXP)
  const dailySessionXPDate = useGameProgressStore((state) => state.dailySessionXPDate)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())
  const achievedMilestones = useMilestoneStore((state) => state.achieved)
  const currentTier = useTierStore((state) => state.currentTier)
  const getTierProgress = useTierStore((state) => state.getTierProgress)
  const getNextTierXp = useTierStore((state) => state.getNextTierXp)

  const today = getTodayIsoDate()
  const gameXpToday = dailySessionXPDate === today ? dailySessionXP : 0
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusToday = streakBonusDate === today ? getStreakBonusXP(streakDays) : 0
  const todayMilestones = getTodayMilestoneSummary(achievedMilestones, today)
  const streak = getStreakProgress(streakDays)
  const tierProgress = getTierProgress()
  const nextTierXp = getNextTierXp()
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday + todayMilestones.xp

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

        <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
          +{todayTotal}
          <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">XP</span>
        </p>

        <div className="mt-4 space-y-3">
          <ProgressRow
            label="Games"
            value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
            progress={gameXpPct}
          />
          <ProgressRow
            label="Videos"
            value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
            progress={videoXpPct}
          />
          <InfoRow
            label="Milestones"
            value={
              todayMilestones.count > 0
                ? `${todayMilestones.count} unlocked - +${todayMilestones.xp} XP`
                : '0 unlocked - 0 XP'
            }
          />
          <InfoRow
            label="Streak Bonus"
            value={streakBonusToday > 0 ? `+${streakBonusToday} XP` : '0 XP'}
            accent={streakBonusToday > 0}
          />
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
          {MILESTONE_EXPLAINER}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatusBlock
            label="Tier Status"
            title={TIER_NAMES[currentTier]}
            detail={
              tierProgress.next !== null
                ? `${nextTierXp.toLocaleString()} XP to ${TIER_NAMES[tierProgress.next]}`
                : 'Max tier reached'
            }
            progress={tierProgress.next !== null ? tierProgress.progress : 1}
          />
          <StatusBlock
            label="Streak"
            title={`${streakDays} days`}
            detail={
              streak.remaining > 0
                ? `${streak.remaining} days to ${streak.target}-day milestone`
                : `${streak.target}-day milestone reached`
            }
            progress={streak.progress}
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
}: {
  label: string
  value: string
  progress: number
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
    </div>
  )
}

function InfoRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-medium ${accent ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
    </div>
  )
}

function StatusBlock({
  label,
  title,
  detail,
  progress,
}: {
  label: string
  title: string
  detail: string
  progress: number
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
        <span className="text-[11px] font-medium text-[var(--text-primary)]">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress, 0) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
        />
      </div>
    </div>
  )
}

export const DailyMissions = TodayDashboard
