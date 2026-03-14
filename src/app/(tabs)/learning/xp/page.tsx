'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useUserStore } from '@/stores/useUserStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useTierStore, TIER_NAMES, type TierLevel } from '@/stores/useTierStore'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'

const DAILY_VIDEO_XP_TARGET = 15

const TIER_COLORS: Record<TierLevel, { bg: string; text: string; bar: string }> = {
  0: { bg: 'bg-[var(--bg-secondary)]', text: 'text-[var(--text-secondary)]', bar: 'bg-[var(--text-muted)]' },
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  2: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
  3: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
  4: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
}

export default function XPPage() {
  const router = useRouter()
  const totalXP = useUserStore((state) => state.getTotalXP())
  const streakDays = useUserStore((state) => state.streakDays)
  const dailySessionXP = useGameProgressStore((state) => state.dailySessionXP)
  const dailySessionXPDate = useGameProgressStore((state) => state.dailySessionXPDate)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())
  const videoXPTotal = useLevelStore((state) => state.getVideoXPTotal())
  const achievedMilestones = useMilestoneStore((state) => state.achieved)

  const currentTier = useTierStore((state) => state.currentTier)
  const recalculateTier = useTierStore((state) => state.recalculateTier)
  const getTierProgress = useTierStore((state) => state.getTierProgress)
  const getNextTierXp = useTierStore((state) => state.getNextTierXp)
  const getCurrentMonthXp = useTierStore((state) => state.getCurrentMonthXp)
  const getCurrentDiscount = useTierStore((state) => state.getCurrentDiscount)

  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  const today = new Date().toISOString().slice(0, 10)
  const gameXpToday = dailySessionXPDate === today ? dailySessionXP : 0
  const streakBonusToday = streakBonusDate === today ? getStreakBonusXP(streakDays) : 0
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const milestoneXP = Object.values(achievedMilestones).reduce(
    (sum, entry) => sum + (entry.xpAwarded ?? 0),
    0,
  )

  const { progress, next } = getTierProgress()
  const nextTierXp = getNextTierXp()
  const monthlyXp = getCurrentMonthXp()
  const discount = getCurrentDiscount()
  const tierName = TIER_NAMES[currentTier]
  const colors = TIER_COLORS[currentTier]
  const isChampion = currentTier === 4

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning')
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
            XP
          </p>
        </div>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            TOTAL XP
          </p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalXP}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Games, videos, streak bonuses, and milestone rewards accumulate here.
          </p>
          <div className="mt-4 space-y-2.5">
            <InfoRow label="Video XP Total" value={`${videoXPTotal} XP`} />
            <InfoRow label="Milestones" value={`${milestoneXP} XP`} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            TODAY&apos;S BREAKDOWN
          </p>
          <div className="space-y-3.5">
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
              label="Streak Bonus"
              value={streakBonusToday > 0 ? `+${streakBonusToday} XP` : '0 XP'}
              accent={streakBonusToday > 0}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            TIER STATUS
          </p>

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
            <span className="text-[11px] text-[var(--text-muted)]">이번 달 {monthlyXp.toLocaleString()} XP</span>
          </div>

          {!isChampion && next !== null && (
            <div className="mt-3">
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
              Champion tier is active.
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            HOW XP WORKS
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
            <li>게임 세션 완료: +12~15 XP, 하루 최대 40 XP</li>
            <li>영상 시청 완료: +3 XP, 오늘 표시 타깃은 15 XP</li>
            <li>연속 학습 보너스: streak 조건 달성 시 추가 XP</li>
            <li>마일스톤 달성: 1회성 보너스 XP</li>
          </ul>
        </SurfaceCard>
      </div>
    </AppPage>
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
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
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
