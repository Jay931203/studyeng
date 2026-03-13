'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { ViewingStats } from '@/components/ViewingStats'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useUserStore } from '@/stores/useUserStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Level = 'beginner' | 'intermediate' | 'advanced'

const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export default function StatsPage() {
  const router = useRouter()
  const level = useOnboardingStore((s) => s.level)
  const setLevel = useOnboardingStore((s) => s.setLevel)
  const videoXPTotal = useLevelStore((s) => s.getVideoXPTotal())
  const totalXP = useUserStore((s) => s.getTotalXP())
  const streakDays = useUserStore((s) => s.streakDays)
  const totalSessions = useGameProgressStore((s) => s.getTotalSessions())
  const achievedMilestones = useMilestoneStore((s) => Object.keys(s.achieved).length)

  const [showLevelPicker, setShowLevelPicker] = useState(false)

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
            STATS
          </p>
        </div>

        {/* ENGLISH LEVEL */}
        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              ENGLISH LEVEL
            </p>
            <button
              onClick={() => setShowLevelPicker((v) => !v)}
              className="rounded-full border border-[var(--border-card)] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              CHANGE
            </button>
          </div>

          {/* Level picker */}
          {showLevelPicker && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLevel(l)
                    setShowLevelPicker(false)
                  }}
                  className={`rounded-xl border py-2.5 text-[12px] font-semibold transition-all ${
                    level === l
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                      : 'border-[var(--border-card)] text-[var(--text-secondary)]'
                  }`}
                >
                  {LEVEL_LABELS[l]}
                </button>
              ))}
            </div>
          )}

          {/* Current level display */}
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            {LEVEL_LABELS[level]}
          </span>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Level Challenge를 통과하면 레벨업
          </p>
        </SurfaceCard>

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
            <XPRow label="Game Sessions" value={`${totalSessions}회 완료`} />
            <XPRow label="Videos" value={`${videoXPTotal} XP`} />
            <XPRow label="Streak" value={`${streakDays}일 연속`} />
            <XPRow label="Milestones" value={`${achievedMilestones}개 달성`} />
          </div>
        </SurfaceCard>

        {/* HOW XP WORKS */}
        <SurfaceCard className="p-5">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            HOW XP WORKS
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
            <li>게임 한 판 완료: +12~15 XP</li>
            <li>영상 시청 완료: +3 XP</li>
            <li>연속 출석 보너스: +2~20 XP/일</li>
            <li>마일스톤 달성: 1회 보너스</li>
          </ul>
        </SurfaceCard>

        {/* VIEWING STATS */}
        <ViewingStats />
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
