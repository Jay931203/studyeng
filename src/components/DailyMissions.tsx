'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isBillingEnabled } from '@/lib/billing'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useDiscountStore } from '@/stores/useDiscountStore'

interface PaceMilestone {
  label: string
  description: string
  targetRate: number
}

const PACE_MILESTONES: PaceMilestone[] = [
  { label: 'BASE', description: '70%', targetRate: 70 },
  { label: 'FOCUS', description: '90%', targetRate: 90 },
  { label: 'TOP', description: '3 months 90%', targetRate: 90 },
]

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
                      className={`h-full rounded-full ${
                        mission.completed ? 'bg-[var(--accent-primary)]' : 'bg-[var(--accent-primary)]'
                      }`}
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

      <LearningPaceCard />
    </div>
  )
}

function LearningPaceCard() {
  const billingEnabled = isBillingEnabled()
  const checkAndResetMonthly = useDiscountStore((state) => state.checkAndResetMonthly)
  const completedDays = useDiscountStore((state) => state.completedDays)
  const getCompletionRate = useDiscountStore((state) => state.getCompletionRate)
  const getDaysInCurrentMonth = useDiscountStore((state) => state.getDaysInCurrentMonth)
  const hasConsecutiveBonus = useDiscountStore((state) => state.hasConsecutiveBonus)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    checkAndResetMonthly()
  }, [checkAndResetMonthly])

  const completionRate = getCompletionRate()
  const totalDays = getDaysInCurrentMonth()
  const completedCount = completedDays.length
  const hasTopTier = hasConsecutiveBonus()
  const nextMilestone = PACE_MILESTONES.find((milestone, index) => {
    if (index === PACE_MILESTONES.length - 1) {
      return !hasTopTier
    }

    return completionRate < milestone.targetRate
  })

  const nextMilestoneText = hasTopTier
    ? 'TOP'
    : nextMilestone
      ? `${nextMilestone.label} ${Math.max(
          0,
          Math.ceil((nextMilestone.targetRate / 100) * totalDays) - completedCount,
        )}`
      : 'DONE'

  return (
    <>
      <div className="mx-4 mb-4">
        {!billingEnabled && (
          <div className="mb-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text-secondary)]">FREE</p>
          </div>
        )}

        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/40 px-3 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs font-medium text-[var(--text-secondary)]">
              MONTHLY PACE
            </span>
            <span className="shrink-0 text-[10px] text-[var(--text-muted)]">DETAIL</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="shrink-0 text-[var(--text-muted)]">
              {completedCount}/{totalDays} ({Math.round(completionRate)}%)
            </span>
            <span className="min-w-0 truncate font-medium text-[var(--accent-text)]">
              {nextMilestoneText}
            </span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-6 sm:items-center"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-text)]">
                      PACE
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                      MONTHLY PACE
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </div>

                <div className="rounded-2xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">RATE</p>
                      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                        {Math.round(completionRate)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">DAYS</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--accent-text)]">
                        {completedCount}/{totalDays}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {PACE_MILESTONES.map((milestone) => {
                    const reached =
                      milestone.label === 'TOP'
                        ? hasTopTier
                        : completionRate >= milestone.targetRate

                    return (
                      <div
                        key={milestone.label}
                        className="flex items-center justify-between rounded-2xl bg-[var(--bg-secondary)] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {milestone.label}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {milestone.description}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            reached ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {reached ? 'YES' : 'NO'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
