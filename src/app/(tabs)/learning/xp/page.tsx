'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useUserStore } from '@/stores/useUserStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useTierStore, TIER_NAMES, TIER_DISCOUNTS, type TierLevel } from '@/stores/useTierStore'

// Tier color mapping
const TIER_COLORS: Record<TierLevel, { bg: string; text: string; bar: string }> = {
  0: { bg: 'bg-[var(--bg-secondary)]', text: 'text-[var(--text-secondary)]', bar: 'bg-[var(--text-muted)]' },
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  2: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
  3: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
  4: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
}

export default function XPPage() {
  const router = useRouter()
  const totalXP = useUserStore((s) => s.getTotalXP())
  const streakDays = useUserStore((s) => s.streakDays)
  const totalSessions = useGameProgressStore((s) => s.getTotalSessions())
  const videoXPTotal = useLevelStore((s) => s.getVideoXPTotal())
  const achievedMilestones = useMilestoneStore((s) => s.achieved)

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

  const { progress, next } = getTierProgress()
  const nextTierXp = getNextTierXp()
  const monthlyXp = getCurrentMonthXp()
  const discount = getCurrentDiscount()
  const tierName = TIER_NAMES[currentTier]
  const colors = TIER_COLORS[currentTier]
  const isChampion = currentTier === 4

  // Calculate milestone XP
  const milestoneXP = Object.values(achievedMilestones).reduce(
    (sum, entry) => sum + (entry.xpAwarded ?? 0),
    0,
  )

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
        {/* Header */}
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

        {/* XP OVERVIEW */}
        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            XP OVERVIEW
          </p>

          {/* Total XP */}
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Total XP</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{totalXP}</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2.5">
            <XPRow label="Games" value={`${totalSessions}회 완료`} />
            <XPRow label="Videos" value={`${videoXPTotal} XP`} />
            <XPRow label="Streak" value={`${streakDays}일 연속`} />
            <XPRow label="Milestones" value={`${milestoneXP} XP`} />
          </div>
        </SurfaceCard>

        {/* TIER STATUS */}
        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            TIER STATUS
          </p>

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
              Champion -- 40% 할인 적용 중
            </p>
          )}
        </SurfaceCard>

        {/* HOW XP WORKS */}
        <SurfaceCard className="p-5">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            HOW XP WORKS
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
            <li>게임 한 판 완료: +12~15 XP (일일 최대 40 XP)</li>
            <li>영상 시청 완료: +3 XP (영상당 최대 10회)</li>
            <li>연속 출석 보너스: 영상/게임 완주 시 +2~20 XP</li>
            <li>데일리 미션 완료: 미션별 XP 보상</li>
            <li>마일스톤 달성: 1회 보너스 XP</li>
          </ul>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function XPRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
