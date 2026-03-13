'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useUserStore } from '@/stores/useUserStore'
import { useTierStore, TIER_NAMES, TIER_DISCOUNTS, type TierLevel } from '@/stores/useTierStore'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'

// Tier color mapping (mirrors TierStatusCard)
const TIER_COLORS: Record<TierLevel, { bg: string; text: string; bar: string }> = {
  0: { bg: 'bg-[var(--bg-secondary)]', text: 'text-[var(--text-secondary)]', bar: 'bg-[var(--text-muted)]' },
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  2: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
  3: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
  4: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
}

export function DailyMissions() {
  const missions = useDailyMissionStore((state) => state.missions)
  const allCompleteBonus = useDailyMissionStore((state) => state.allCompleteBonus)
  const checkAndResetDaily = useDailyMissionStore((state) => state.checkAndResetDaily)
  const completedCount = missions.filter((mission) => mission.completed).length
  const completionRate = missions.length > 0 ? (completedCount / missions.length) * 100 : 0

  useEffect(() => {
    checkAndResetDaily()
  }, [checkAndResetDaily])

  return (
    <div className="mb-8 min-w-0 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
      <div className="border-b border-[var(--border-card)]/60 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              TODAY&apos;S ROUTINE
            </span>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              allCompleteBonus
                ? 'bg-[var(--accent-glow)] text-[var(--accent-text)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            }`}
          >
            {allCompleteBonus ? 'DONE' : `${completedCount}/${missions.length}`}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>PROGRESS</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(completionRate, 100)}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
            />
          </div>
        </div>
      </div>

      <div className="px-5 pb-2 pt-2">
        {missions.map((mission, index) => {
          const progress = mission.target > 0 ? (mission.current / mission.target) * 100 : 0
          return (
            <div key={mission.id} className="relative py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs font-bold text-[var(--accent-text)]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span
                      className={`text-sm ${
                        mission.completed
                          ? 'text-[var(--text-muted)] line-through'
                          : 'font-medium text-[var(--text-primary)]'
                      }`}
                    >
                      {mission.title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {mission.current}/{mission.target}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      className="h-full rounded-full bg-[var(--accent-primary)]"
                    />
                  </div>
                </div>
              </div>
              {index < missions.length - 1 && (
                <div className="absolute bottom-0 left-11 right-0 h-px bg-[var(--border-card)]" />
              )}
            </div>
          )
        })}
      </div>

      {allCompleteBonus && (
        <div className="px-5 pb-4">
          <p className="rounded-2xl bg-[var(--accent-glow)] px-4 py-3 text-center text-xs text-[var(--accent-text)]">
            DONE
          </p>
        </div>
      )}

      <TodayXpCard />
      <TierProgressSection />
    </div>
  )
}

function TierProgressSection() {
  const currentTier = useTierStore((s) => s.currentTier)
  const recalculateTier = useTierStore((s) => s.recalculateTier)
  const getTierProgress = useTierStore((s) => s.getTierProgress)
  const getNextTierXp = useTierStore((s) => s.getNextTierXp)
  const getCurrentMonthXp = useTierStore((s) => s.getCurrentMonthXp)
  const getCurrentDiscount = useTierStore((s) => s.getCurrentDiscount)

  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  const { progress, next } = getTierProgress()
  const nextTierXp = getNextTierXp()
  const monthlyXp = getCurrentMonthXp()
  const discount = getCurrentDiscount()
  const tierName = TIER_NAMES[currentTier]
  const colors = TIER_COLORS[currentTier]
  const isChampion = currentTier === 4

  return (
    <div className="mx-4 mb-4">
      <div className="border-t border-[var(--border-card)]/60 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${colors.bg} ${colors.text}`}>
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
    </div>
  )
}

function TodayXpCard() {
  const router = useRouter()
  const totalXP = useUserStore((s) => s.getTotalXP())
  const streakDays = useUserStore((s) => s.streakDays)

  const dailySessionXP = useGameProgressStore((s) => s.dailySessionXP)
  const dailySessionXPDate = useGameProgressStore((s) => s.dailySessionXPDate)
  const streakBonusDate = useGameProgressStore((s) => s.streakBonusDate)

  const today = new Date().toISOString().slice(0, 10)
  const gameXpToday = dailySessionXPDate === today ? dailySessionXP : 0
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)

  // Streak bonus earned today
  const streakBonusToday =
    streakBonusDate === today ? getStreakBonusXP(streakDays) : 0

  // We don't track daily video XP separately from the level store,
  // so derive today's total as: totalXP minus what we can attribute to other sources is imprecise.
  // Instead, show total XP prominently with per-source breakdown below.
  const todayTotal = gameXpToday + streakBonusToday

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={() => router.push('/learning/stats')}
        className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/40 px-3 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            TODAY&apos;S XP
          </span>
          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">DETAIL</span>
        </div>

        <p className="mb-3 text-2xl font-bold text-[var(--text-primary)]">
          +{todayTotal} <span className="text-sm font-medium text-[var(--text-muted)]">XP</span>
        </p>

        <div className="space-y-2.5">
          {/* Games */}
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
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
              />
            </div>
          </div>

          {/* Streak */}
          {streakBonusToday > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Streak</span>
              <span className="font-medium text-[var(--accent-text)]">
                +{streakBonusToday} XP
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 border-t border-[var(--border-card)]/40 pt-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-muted)]">TOTAL XP</span>
            <span className="font-semibold text-[var(--accent-text)]">{totalXP}</span>
          </div>
        </div>
      </button>
    </div>
  )
}
