'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import {
  buildMilestoneMissions,
  getMilestoneSummary,
  MILESTONE_EXPLAINER,
} from '@/lib/learningDashboard'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useTierStore } from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

export default function MilestonesPage() {
  const router = useRouter()
  const streakDays = useUserStore((state) => state.streakDays)
  const totalGameSessions = useGameProgressStore((state) => state.getTotalSessions())
  const challengeAttempts = useLevelChallengeStore((state) => state.challengeAttempts)
  const completionCounts = useWatchHistoryStore((state) => state.completionCounts)
  const achieved = useMilestoneStore((state) => state.achieved)
  const claimMilestone = useMilestoneStore((state) => state.claimMilestone)
  const currentTier = useTierStore((state) => state.currentTier)
  const recalculateTier = useTierStore((state) => state.recalculateTier)

  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  const completedVideos = Object.values(completionCounts).filter((count) => count > 0).length

  const missions = useMemo(
    () =>
      buildMilestoneMissions(
        {
          completedVideos,
          totalGameSessions,
          streakDays,
          passedLevelChallenge: challengeAttempts.some((attempt) => attempt.passed),
          currentTier,
        },
        achieved,
      ),
    [achieved, challengeAttempts, completedVideos, currentTier, streakDays, totalGameSessions],
  )

  const summary = getMilestoneSummary(missions)
  const ready = missions.filter((mission) => mission.ready)
  const inProgress = missions.filter((mission) => !mission.ready && !mission.claimed)
  const claimed = missions.filter((mission) => mission.claimed)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning/xp')
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
            마일스톤
          </p>
        </div>

        <SurfaceCard className="p-5">
          <p className="text-sm text-[var(--text-secondary)]">{MILESTONE_EXPLAINER}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryStat label="바로 수령 가능" value={summary.readyCount} />
            <SummaryStat label="수령 완료" value={summary.claimedCount} />
            <SummaryStat label="누적 수령 XP" value={`${summary.claimedXp} XP`} />
          </div>
        </SurfaceCard>

        <MilestoneSection
          title="지금 받을 수 있음"
          description="조건을 채워 바로 받을 수 있는 보상입니다."
          missions={ready}
          actionLabel="XP 받기"
          onAction={(missionId, readyToClaim) => {
            claimMilestone(missionId, readyToClaim)
          }}
        />

        <MilestoneSection
          title="진행 중"
          description="조금만 더 진행하면 열리는 보상입니다."
          missions={inProgress}
        />

        <MilestoneSection
          title="수령 완료"
          description="이미 총 XP에 반영된 보상입니다."
          missions={claimed}
        />
      </div>
    </AppPage>
  )
}

function SummaryStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function MilestoneSection({
  title,
  description,
  missions,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  missions: ReturnType<typeof buildMilestoneMissions>
  actionLabel?: string
  onAction?: (missionId: string, ready: boolean) => void
}) {
  return (
    <SurfaceCard className="p-5">
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        {title}
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>

      {missions.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">아직 해당 항목이 없습니다.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{mission.label}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{mission.description}</p>
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">{mission.statusLabel}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--accent-text)]">+{mission.xp} XP</p>
                  {actionLabel && onAction ? (
                    <button
                      type="button"
                      onClick={() => onAction(mission.id, mission.ready)}
                      disabled={!mission.ready}
                      className="mt-3 rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      {actionLabel}
                    </button>
                  ) : (
                    <span className="mt-3 inline-block text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      {mission.claimed ? '수령 완료' : '진행 중'}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-card)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                  style={{ width: `${Math.max(mission.progress, 0) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  )
}
