'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { ViewingStats } from '@/components/ViewingStats'
import { LevelChallengeGame } from '@/components/level/LevelChallengeGame'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useUserStore } from '@/stores/useUserStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { LEVEL_LABELS, CEFR_ORDER } from '@/types/level'
import type { CefrLevel, ChallengeTransition } from '@/types/level'

export default function StatsPage() {
  const router = useRouter()
  const level = useOnboardingStore((s) => s.level)
  const setLevel = useOnboardingStore((s) => s.setLevel)
  const streakDays = useUserStore((s) => s.streakDays)
  const totalSessions = useGameProgressStore((s) => s.getTotalSessions())
  const achievedMilestones = useMilestoneStore((s) => Object.keys(s.achieved).length)
  const viewCounts = useWatchHistoryStore((s) => s.viewCounts)
  const watchedVideoIds = useWatchHistoryStore((s) => s.watchedVideoIds)
  const rawScore = useLevelStore((s) => s.rawScore)
  const addManualLevelChange = useLevelStore((s) => s.addManualLevelChange)

  const [showLevelPicker, setShowLevelPicker] = useState(false)
  const [challengeTarget, setChallengeTarget] = useState<ChallengeTransition | null>(null)

  const totalWatched = watchedVideoIds.length
  const totalViews = Object.values(viewCounts).reduce((sum, c) => sum + c, 0)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning')
  }

  const handleLevelSelect = (selectedLevel: CefrLevel) => {
    const currentIdx = CEFR_ORDER.indexOf(level)
    const selectedIdx = CEFR_ORDER.indexOf(selectedLevel)

    if (selectedLevel === level) {
      // Same level, just close
      setShowLevelPicker(false)
      return
    }

    if (selectedIdx < currentIdx) {
      // Downgrade: instant, no challenge needed
      addManualLevelChange(level, selectedLevel, rawScore, 0)
      setLevel(selectedLevel)
      setShowLevelPicker(false)
    } else {
      // Upgrade: trigger Level Challenge
      setShowLevelPicker(false)
      setChallengeTarget(selectedLevel as ChallengeTransition)
    }
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
            STATS
          </p>
        </div>

        {/* ENGLISH LEVEL — clickable to open picker */}
        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            ENGLISH LEVEL
          </p>

          <button
            onClick={() => setShowLevelPicker(true)}
            className="flex items-center gap-2 rounded-xl px-0 py-0 transition-opacity active:opacity-70"
          >
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {LEVEL_LABELS[level]}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-[var(--text-muted)]"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            탭하여 레벨 변경
          </p>
        </SurfaceCard>

        {/* MY SUMMARY */}
        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            MY SUMMARY
          </p>

          <div className="space-y-2.5">
            <SummaryRow label="연속 학습" value={`${Math.max(streakDays, totalViews > 0 ? 1 : 0)}일`} />
            <SummaryRow label="게임 플레이" value={`${totalSessions}회`} />
            <SummaryRow label="마일스톤 달성" value={`${achievedMilestones}개`} />
            <SummaryRow label="누적 시청" value={`${totalWatched}개`} />
            <SummaryRow label="총 조회수" value={`${totalViews}회`} />
          </div>
        </SurfaceCard>

        {/* VIEWING STATS */}
        <ViewingStats />
      </div>

      {/* Level Picker Modal */}
      <AnimatePresence>
        {showLevelPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowLevelPicker(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md rounded-t-3xl border border-[var(--border-card)] p-6 sm:rounded-3xl"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                레벨 선택
              </p>

              <div className="space-y-1.5">
                {CEFR_ORDER.map((cefrLevel) => {
                  const isCurrent = cefrLevel === level
                  const cefrIdx = CEFR_ORDER.indexOf(cefrLevel)
                  const currentIdx = CEFR_ORDER.indexOf(level)
                  const isHigher = cefrIdx > currentIdx

                  return (
                    <button
                      key={cefrLevel}
                      onClick={() => handleLevelSelect(cefrLevel)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                        isCurrent
                          ? 'border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10'
                          : 'border border-transparent hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {LEVEL_LABELS[cefrLevel]}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {isCurrent ? '현재' : isHigher ? 'Challenge' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowLevelPicker(false)}
                className="mt-5 w-full rounded-xl py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Challenge fullscreen overlay */}
      <AnimatePresence>
        {challengeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120]"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <button
              onClick={() => setChallengeTarget(null)}
              className="absolute right-4 top-4 z-[130] flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              {'\u2715'}
            </button>
            <LevelChallengeGame
              targetLevel={challengeTarget}
              onClose={() => setChallengeTarget(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AppPage>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
