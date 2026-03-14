'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useUserStore } from '@/stores/useUserStore'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'

export function TodayDashboard() {
  const router = useRouter()

  // XP data
  const streakDays = useUserStore((s) => s.streakDays)
  const dailySessionXP = useGameProgressStore((s) => s.dailySessionXP)
  const dailySessionXPDate = useGameProgressStore((s) => s.dailySessionXPDate)
  const streakBonusDate = useGameProgressStore((s) => s.streakBonusDate)
  const dailyVideoXP = useLevelStore((s) => s.getDailyVideoXP())

  // Compute today's XP breakdown
  const today = new Date().toISOString().slice(0, 10)
  const gameXpToday = dailySessionXPDate === today ? dailySessionXP : 0
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const streakBonusToday = streakBonusDate === today ? getStreakBonusXP(streakDays) : 0
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday

  return (
    <button
      onClick={() => router.push('/learning/xp')}
      className="mb-8 block w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)] transition-colors active:bg-[var(--bg-secondary)]/40"
    >
      {/* Section 1: TODAY'S XP */}
      <div className="px-5 pb-4 pt-5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
          TODAY&apos;S XP
        </span>

        <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
          +{todayTotal}{' '}
          <span className="text-sm font-medium text-[var(--text-muted)]">XP</span>
        </p>

        <div className="mt-4 space-y-3">
          {/* Games progress */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Games</span>
              <span className="font-medium text-[var(--text-primary)]">
                {gameXpToday}/{DAILY_SESSION_XP_CAP} XP
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(gameXpPct, 0)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
              />
            </div>
          </div>

          {/* Videos — show today's earned amount, no cap so no progress bar */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)]">Videos</span>
            <span className="font-medium text-[var(--text-primary)]">
              {dailyVideoXP > 0 ? `+${dailyVideoXP}` : '0'} XP
            </span>
          </div>

          {/* Streak bonus */}
          {streakBonusToday > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Streak Bonus</span>
              <span className="font-medium text-[var(--accent-text)]">
                +{streakBonusToday} XP
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

/** @deprecated Use TodayDashboard instead */
export const DailyMissions = TodayDashboard
