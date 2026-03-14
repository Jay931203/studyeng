'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useUserStore } from '@/stores/useUserStore'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'

const DAILY_VIDEO_XP_TARGET = 15

export function TodayDashboard() {
  const router = useRouter()

  const streakDays = useUserStore((state) => state.streakDays)
  const dailySessionXP = useGameProgressStore((state) => state.dailySessionXP)
  const dailySessionXPDate = useGameProgressStore((state) => state.dailySessionXPDate)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())

  const today = new Date().toISOString().slice(0, 10)
  const gameXpToday = dailySessionXPDate === today ? dailySessionXP : 0
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusToday = streakBonusDate === today ? getStreakBonusXP(streakDays) : 0
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday

  return (
    <button
      onClick={() => router.push('/learning/xp')}
      className="mb-8 block w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)] transition-colors active:bg-[var(--bg-secondary)]/40"
    >
      <div className="px-5 pb-4 pt-5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
          TODAY&apos;S XP
        </span>

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

          {streakBonusToday > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Streak Bonus</span>
              <span className="font-medium text-[var(--accent-text)]">+{streakBonusToday} XP</span>
            </div>
          )}
        </div>
      </div>
    </button>
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

export const DailyMissions = TodayDashboard
