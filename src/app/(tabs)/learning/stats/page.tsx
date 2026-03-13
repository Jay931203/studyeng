'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { ViewingStats } from '@/components/ViewingStats'
import { computeLearningXpSummary } from '@/lib/xpSummary'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLevelStore, getLevelGaugeProgress } from '@/stores/useLevelStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useUserStore } from '@/stores/useUserStore'
import expressionEntriesData from '@/data/expression-entries-v2.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Level = 'beginner' | 'intermediate' | 'advanced'

const expressionEntries = expressionEntriesData as Record<
  string,
  { id: string; cefr: string; category: string; meaning_ko?: string }
>

const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const CEFR_COLORS: Record<string, string> = {
  A1: 'var(--accent-primary)',
  A2: 'var(--accent-primary)',
  B1: '#f59e0b',
  B2: '#f59e0b',
  C1: '#ef4444',
  C2: '#ef4444',
}

const CATEGORY_LABELS: Record<string, string> = {
  idiom: 'Idiom',
  phrasal_verb: 'Phrasal Verb',
  collocation: 'Collocation',
  fixed_expression: 'Fixed Expression',
  sentence_frame: 'Sentence Frame',
  discourse_marker: 'Discourse Marker',
  slang: 'Slang',
  interjection: 'Interjection',
  exclamation: 'Exclamation',
  filler: 'Filler',
}

export default function StatsPage() {
  const router = useRouter()
  const level = useOnboardingStore((s) => s.level)
  const setLevel = useOnboardingStore((s) => s.setLevel)
  const rawScore = useLevelStore((s) => s.rawScore)
  const videoXP = useLevelStore((s) => s.videoXP)
  const familiarEntries = useFamiliarityStore((s) => s.entries)
  const rewardLevel = useUserStore((s) => s.level)
  const rewardXp = useUserStore((s) => s.xp)
  const totalXpEarned = useUserStore((s) => s.totalXpEarned)

  const [showLevelPicker, setShowLevelPicker] = useState(false)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning')
  }

  const xpSummary = computeLearningXpSummary({
    familiarityEntries: familiarEntries,
    videoXp: videoXP,
    totalXpEarned,
    level: rewardLevel,
    xp: rewardXp,
  })
  const expressionXP = xpSummary.expressionXp
  const totalVideoXP = xpSummary.videoXp
  const gameRewardXP = xpSummary.rewardXp
  const totalXP = xpSummary.totalXp

  // CEFR breakdown
  const cefrCounts: Record<string, number> = {}
  for (const [exprId, entry] of Object.entries(familiarEntries)) {
    if (entry.count < 1) continue
    const data = expressionEntries[exprId]
    if (!data) continue
    const key = data.cefr?.toUpperCase() ?? 'A1'
    cefrCounts[key] = (cefrCounts[key] ?? 0) + 1
  }
  const maxCefrCount = Math.max(1, ...Object.values(cefrCounts))

  // Category breakdown
  const categoryCounts: Record<string, number> = {}
  for (const [exprId, entry] of Object.entries(familiarEntries)) {
    if (entry.count < 1) continue
    const data = expressionEntries[exprId]
    if (!data) continue
    categoryCounts[data.category] = (categoryCounts[data.category] ?? 0) + 1
  }
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  // Level gauge
  const gaugeProgress = getLevelGaugeProgress(rawScore, level)
  const nextLevelLabel =
    level === 'beginner' ? 'Intermediate' : level === 'intermediate' ? 'Advanced' : null
  const thresholdLabel =
    level === 'beginner' ? '150 XP' : level === 'intermediate' ? '400 XP' : null

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

        {/* MY LEVEL */}
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
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {LEVEL_LABELS[level]}
            </span>
            {nextLevelLabel && (
              <span className="text-xs text-[var(--text-muted)]">
                next: {nextLevelLabel}
              </span>
            )}
          </div>

          {/* Gauge */}
          {level !== 'advanced' && (
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-[11px] text-[var(--text-muted)]">
                <span>{Math.round(gaugeProgress * 100)}%</span>
                {thresholdLabel && <span>{thresholdLabel} to level up</span>}
              </div>
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--border-card)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-700"
                  style={{ width: `${gaugeProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </SurfaceCard>

        {/* XP BREAKDOWN */}
        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            XP BREAKDOWN
          </p>

          {/* Total + split */}
          <div className="mb-4 flex items-end gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Total XP</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{totalXP}</p>
            </div>
            <div className="mb-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span>Expressions {expressionXP}</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span>Videos {totalVideoXP}</span>
              {gameRewardXP > 0 && (
                <>
                  <span className="text-[var(--text-muted)]">/</span>
                  <span>Rewards {gameRewardXP}</span>
                </>
              )}
            </div>
          </div>

          {/* CEFR bar chart */}
          {CEFR_ORDER.some((c) => cefrCounts[c]) ? (
            <div className="mb-4 space-y-2">
              {CEFR_ORDER.filter((c) => cefrCounts[c]).map((cefr) => (
                <div key={cefr} className="flex items-center gap-2">
                  <span className="w-6 text-right text-[11px] font-semibold text-[var(--text-muted)]">
                    {cefr}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-[var(--border-card)]" style={{ height: '6px' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${((cefrCounts[cefr] ?? 0) / maxCefrCount) * 100}%`,
                        backgroundColor: CEFR_COLORS[cefr],
                      }}
                    />
                  </div>
                  <span className="w-6 text-[11px] text-[var(--text-muted)]">
                    {cefrCounts[cefr] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-[var(--text-muted)]">표현을 swipe하면 XP가 쌓여요.</p>
          )}

          {/* Category tags */}
          {sortedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sortedCategories.map(([cat, count]) => (
                <span
                  key={cat}
                  className="rounded-full border border-[var(--border-card)] px-2.5 py-0.5 text-[11px] text-[var(--text-secondary)]"
                >
                  {CATEGORY_LABELS[cat] ?? cat} {count}
                </span>
              ))}
            </div>
          )}
        </SurfaceCard>

        {/* HOW TO LEVEL UP */}
        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            HOW TO LEVEL UP
          </p>

          <p className="mb-5 text-sm text-[var(--text-secondary)]">
            영상을 보고 표현을 모으면 XP가 쌓여요.
          </p>

          <div className="space-y-5">
            {/* Expression XP */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                표현 XP
              </p>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                <li>표현 카드를 swipe할 때마다 XP 획득</li>
                <li>같은 표현 3번 swipe &rarr; &quot;Familiar!&quot; + 풀 XP</li>
                <li>어려운 표현(B2+)일수록 더 많은 XP</li>
              </ul>
            </div>

            {/* Video XP */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                영상 XP
              </p>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                <li>영상 시청 완료 시 +3 XP</li>
                <li>같은 영상은 최대 10회까지 XP 획득</li>
              </ul>
            </div>

            {/* Level thresholds */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                레벨업 조건
              </p>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                <li>Beginner &rarr; Intermediate: 150 XP</li>
                <li>Intermediate &rarr; Advanced: 400 XP</li>
              </ul>
            </div>
          </div>
        </SurfaceCard>

        {/* VIEWING STATS */}
        <ViewingStats />
      </div>
    </AppPage>
  )
}
