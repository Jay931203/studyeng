'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useUserStore } from '@/stores/useUserStore'
import { useTierStore, TIER_NAMES, TIER_DISCOUNTS, type TierLevel } from '@/stores/useTierStore'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'

// Tier color mapping
const TIER_COLORS: Record<TierLevel, { bg: string; text: string; bar: string }> = {
  0: { bg: 'bg-[var(--bg-secondary)]', text: 'text-[var(--text-secondary)]', bar: 'bg-[var(--text-muted)]' },
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  2: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
  3: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
  4: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
}

export function TodayDashboard() {
  const router = useRouter()

  // XP data
  const totalXP = useUserStore((s) => s.getTotalXP())
  const streakDays = useUserStore((s) => s.streakDays)
  const dailySessionXP = useGameProgressStore((s) => s.dailySessionXP)
  const dailySessionXPDate = useGameProgressStore((s) => s.dailySessionXPDate)
  const streakBonusDate = useGameProgressStore((s) => s.streakBonusDate)

  // Tier data
  const currentTier = useTierStore((s) => s.currentTier)
  const recalculateTier = useTierStore((s) => s.recalculateTier)
  const getTierProgress = useTierStore((s) => s.getTierProgress)
  const getNextTierXp = useTierStore((s) => s.getNextTierXp)
  const getCurrentMonthXp = useTierStore((s) => s.getCurrentMonthXp)
  const getCurrentDiscount = useTierStore((s) => s.getCurrentDiscount)

  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  // Compute today's XP breakdown
  const today = new Date().toISOString().slice(0, 10)
  const gameXpToday = dailySessionXPDate === today ? dailySessionXP : 0
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const streakBonusToday = streakBonusDate === today ? getStreakBonusXP(streakDays) : 0
  const todayTotal = gameXpToday + streakBonusToday

  // Tier calculations
  const { progress, next } = getTierProgress()
  const nextTierXp = getNextTierXp()
  const monthlyXp = getCurrentMonthXp()
  const discount = getCurrentDiscount()
  const tierName = TIER_NAMES[currentTier]
  const colors = TIER_COLORS[currentTier]
  const isChampion = currentTier === 4

  return (
    <button
      onClick={() => router.push('/learning/stats')}
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

          {/* Videos — show total XP as context (no daily tracking available) */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)]">Videos</span>
            <span className="font-medium text-[var(--text-primary)]">
              +3 XP / 완료
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

      {/* Divider */}
      <div className="mx-5 h-px bg-[var(--border-card)]/60" />

      {/* Section 2: TIER STATUS */}
      <div className="px-5 pb-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${colors.bg} ${colors.text}`}
            >
              {tierName}
            </span>
            {discount > 0 && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {discount}% 할인
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            이번 달 {monthlyXp.toLocaleString()} XP
          </span>
        </div>

        {!isChampion && next !== null && (
          <div className="mt-2.5">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--border-card)]">
              <motion.div
                className={`h-full rounded-full ${colors.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
              다음 등급까지 {nextTierXp.toLocaleString()} XP
            </p>
          </div>
        )}

        {isChampion && (
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Champion -- 40% 할인 적용 중
          </p>
        )}
      </div>
    </button>
  )
}

/** @deprecated Use TodayDashboard instead */
export const DailyMissions = TodayDashboard
