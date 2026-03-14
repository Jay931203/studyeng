'use client'

import { useMemo, useState } from 'react'
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
import { LEVEL_LABELS, CEFR_ORDER } from '@/types/level'
import type { CefrLevel, ChallengeTransition } from '@/types/level'

export default function StatsPage() {
  const router = useRouter()
  const level = useOnboardingStore((state) => state.level)
  const setLevel = useOnboardingStore((state) => state.setLevel)
  const streakDays = useUserStore((state) => state.streakDays)
  const totalSessions = useGameProgressStore((state) => state.getTotalSessions())
  const achievedMilestones = useMilestoneStore((state) => Object.keys(state.achieved).length)
  const viewCounts = useWatchHistoryStore((state) => state.viewCounts)
  const watchedVideoIds = useWatchHistoryStore((state) => state.watchedVideoIds)
  const rawScore = useLevelStore((state) => state.rawScore)
  const addManualLevelChange = useLevelStore((state) => state.addManualLevelChange)

  const [showLevelPicker, setShowLevelPicker] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(level)
  const [challengeTarget, setChallengeTarget] = useState<ChallengeTransition | null>(null)

  const totalWatched = watchedVideoIds.length
  const totalViews = Object.values(viewCounts).reduce((sum, count) => sum + count, 0)

  const currentIdx = CEFR_ORDER.indexOf(level)
  const selectedIdx = CEFR_ORDER.indexOf(selectedLevel)
  const selectionIsCurrent = selectedLevel === level
  const selectionIsHigher = selectedIdx > currentIdx

  const pickerHelperText = useMemo(() => {
    if (selectionIsCurrent) return '현재 레벨입니다.'
    if (selectionIsHigher) return '선택 후 하단 Challenge 버튼으로 도전합니다.'
    return '낮은 레벨로는 바로 변경됩니다.'
  }, [selectionIsCurrent, selectionIsHigher])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning')
  }

  const openLevelPicker = () => {
    setSelectedLevel(level)
    setShowLevelPicker(true)
  }

  const handleLevelAction = () => {
    if (selectionIsCurrent) {
      setShowLevelPicker(false)
      return
    }

    if (selectionIsHigher) {
      setShowLevelPicker(false)
      setChallengeTarget(selectedLevel as ChallengeTransition)
      return
    }

    addManualLevelChange(level, selectedLevel, rawScore, 0)
    setLevel(selectedLevel)
    setShowLevelPicker(false)
  }

  const actionLabel = selectionIsCurrent ? 'CURRENT LEVEL' : selectionIsHigher ? 'CHALLENGE' : 'APPLY LEVEL'

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
            STATS
          </p>
        </div>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            ENGLISH LEVEL
          </p>

          <button
            onClick={openLevelPicker}
            className="flex items-center gap-2 rounded-xl px-0 py-0 text-left transition-opacity active:opacity-70"
          >
            <span className="text-2xl font-bold text-[var(--text-primary)]">{LEVEL_LABELS[level]}</span>
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
            레벨을 선택한 뒤 적용하거나 도전할 수 있습니다.
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            MY SUMMARY
          </p>

          <div className="space-y-2.5">
            <SummaryRow label="연속 학습" value={`${Math.max(streakDays, totalViews > 0 ? 1 : 0)}일`} />
            <SummaryRow label="게임 플레이" value={`${totalSessions}회`} />
            <SummaryRow label="마일스톤 달성" value={`${achievedMilestones}개`} />
            <SummaryRow label="시청한 영상" value={`${totalWatched}개`} />
            <SummaryRow label="총 조회수" value={`${totalViews}회`} />
          </div>
        </SurfaceCard>

        <ViewingStats />
      </div>

      <AnimatePresence>
        {showLevelPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              onClick={() => setShowLevelPicker(false)}
            />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md rounded-t-3xl border border-[var(--border-card)] p-6 shadow-[var(--card-shadow)] sm:rounded-3xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                LEVEL SELECTOR
              </p>

              <div className="space-y-1.5">
                {CEFR_ORDER.map((cefrLevel) => {
                  const isSelected = cefrLevel === selectedLevel
                  const isCurrent = cefrLevel === level
                  const isHigher = CEFR_ORDER.indexOf(cefrLevel) > currentIdx

                  return (
                    <button
                      key={cefrLevel}
                      type="button"
                      onClick={() => setSelectedLevel(cefrLevel)}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors"
                      style={{
                        borderColor: isSelected ? 'rgba(var(--accent-primary-rgb), 0.28)' : 'var(--border-card)',
                        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}
                      >
                        {LEVEL_LABELS[cefrLevel]}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {isCurrent ? 'Current' : isHigher ? 'Challenge' : 'Switch'}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="mt-4 text-xs text-[var(--text-muted)]">{pickerHelperText}</p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLevelPicker(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-medium text-[var(--text-secondary)]"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  onClick={handleLevelAction}
                  disabled={selectionIsCurrent}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {actionLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
