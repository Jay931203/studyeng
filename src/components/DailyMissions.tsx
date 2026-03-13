'use client'

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { computeLearningXpSummary } from '@/lib/xpSummary'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLevelStore, getLevelGaugeProgress } from '@/stores/useLevelStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useUserStore } from '@/stores/useUserStore'

const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const

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

      <LearningXpCard />
    </div>
  )
}

function LearningXpCard() {
  const router = useRouter()
  const level = useOnboardingStore((state) => state.level)
  const rawScore = useLevelStore((state) => state.rawScore)
  const videoXp = useLevelStore((state) => state.videoXP)
  const familiarityEntries = useFamiliarityStore((state) => state.entries)
  const rewardLevel = useUserStore((state) => state.level)
  const rewardXp = useUserStore((state) => state.xp)
  const totalXpEarned = useUserStore((state) => state.totalXpEarned)

  const xpSummary = useMemo(
    () =>
      computeLearningXpSummary({
        familiarityEntries,
        videoXp,
        totalXpEarned,
        level: rewardLevel,
        xp: rewardXp,
      }),
    [familiarityEntries, rewardLevel, rewardXp, totalXpEarned, videoXp],
  )

  const progress = getLevelGaugeProgress(rawScore, level)
  const nextLevelLabel =
    level === 'beginner'
      ? LEVEL_LABELS.intermediate
      : level === 'intermediate'
        ? LEVEL_LABELS.advanced
        : 'MAX'

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={() => router.push('/learning/stats')}
        className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/40 px-3 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-xs font-medium text-[var(--text-secondary)]">
            XP STATUS
          </span>
          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">DETAIL</span>
        </div>

        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-[var(--text-muted)]">CURRENT LEVEL</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {LEVEL_LABELS[level]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--text-muted)]">TOTAL XP</p>
            <p className="mt-1 text-lg font-semibold text-[var(--accent-text)]">
              {xpSummary.totalXp}
            </p>
          </div>
        </div>

        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
            style={{ width: `${Math.max(progress * 100, 4)}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-[10px]">
          <span className="shrink-0 text-[var(--text-muted)]">
            Expressions {xpSummary.expressionXp} / Videos {xpSummary.videoXp}
          </span>
          <span className="min-w-0 truncate font-medium text-[var(--accent-text)]">
            {nextLevelLabel === 'MAX' ? 'MAX LEVEL' : `Next ${nextLevelLabel}`}
          </span>
        </div>
      </button>
    </div>
  )
}
