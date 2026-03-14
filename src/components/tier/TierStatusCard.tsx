'use client'

import { motion } from 'framer-motion'
import { SurfaceCard } from '@/components/ui/AppPage'
import {
  useTierStore,
  TIER_NAMES,
  TIER_DISCOUNTS,
  type TierLevel,
} from '@/stores/useTierStore'
import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Tier color mapping (CSS-variable friendly, no emojis)
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<TierLevel, { bg: string; text: string; bar: string }> = {
  0: {
    bg: 'bg-[var(--bg-secondary)]',
    text: 'text-[var(--text-secondary)]',
    bar: 'bg-[var(--text-muted)]',
  },
  1: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  2: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    bar: 'bg-sky-500',
  },
  3: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    bar: 'bg-violet-500',
  },
  4: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  5: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    bar: 'bg-rose-500',
  },
}

export function TierStatusCard() {
  const currentTier = useTierStore((s) => s.currentTier)
  const championLegacy = useTierStore((s) => s.championLegacy)
  const recalculateTier = useTierStore((s) => s.recalculateTier)
  const getTierProgress = useTierStore((s) => s.getTierProgress)
  const getNextTierXp = useTierStore((s) => s.getNextTierXp)
  const getCurrentMonthXp = useTierStore((s) => s.getCurrentMonthXp)
  const getCurrentDiscount = useTierStore((s) => s.getCurrentDiscount)

  // Recalculate tier on mount
  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  const { progress, next } = getTierProgress()
  const nextTierXp = getNextTierXp()
  const monthlyXp = getCurrentMonthXp()
  const discount = getCurrentDiscount()
  const tierName = TIER_NAMES[currentTier]
  const colors = TIER_COLORS[currentTier]

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
          XP TIER
        </p>
        {discount > 0 && (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Current Tier */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
          <span className={`text-lg font-bold ${colors.text}`}>{currentTier}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-base font-bold ${colors.text}`}>{tierName}</p>
            {championLegacy && currentTier === 5 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                Legacy
              </span>
            )}
          </div>
          {discount > 0 ? (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              구독 {discount}% 할인 적용 중
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              XP를 쌓아 할인 혜택을 받으세요
            </p>
          )}
        </div>
      </div>

      {/* Progress bar to next tier */}
      {next !== null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
            <span>{TIER_NAMES[currentTier]} → {TIER_NAMES[next]}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-[4px] w-full overflow-hidden rounded-full bg-[var(--border-card)]">
            <motion.div
              className={`h-full rounded-full ${colors.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
            다음 등급까지 {nextTierXp.toLocaleString()} XP
          </p>
        </div>
      )}

      {/* At max tier */}
      {next === null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
            <span>MAX TIER</span>
            <span>100%</span>
          </div>
          <div className="h-[4px] w-full overflow-hidden rounded-full bg-[var(--border-card)]">
            <motion.div
              className={`h-full rounded-full ${colors.bar}`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Monthly XP */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--bg-primary)] px-3 py-2.5">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">이번 달 XP</span>
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {monthlyXp.toLocaleString()} XP
        </span>
      </div>

      {/* Tier ladder preview */}
      <div className="mt-4 grid grid-cols-5 gap-1">
        {TIER_NAMES.map((name, i) => {
          const tierColors = TIER_COLORS[i as TierLevel]
          const isActive = i <= currentTier
          return (
            <div
              key={name}
              className={`rounded-lg px-1 py-1.5 text-center ${
                isActive ? tierColors.bg : 'bg-[var(--bg-primary)]'
              }`}
            >
              <p
                className={`text-[9px] font-semibold ${
                  isActive ? tierColors.text : 'text-[var(--text-muted)]'
                }`}
              >
                {name}
              </p>
              <p
                className={`text-[9px] ${
                  isActive ? tierColors.text : 'text-[var(--text-muted)] opacity-50'
                }`}
              >
                {TIER_DISCOUNTS[i as TierLevel]}%
              </p>
            </div>
          )
        })}
      </div>
    </SurfaceCard>
  )
}
