'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { TodayDashboard } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { WatchHistory } from '@/components/WatchHistory'
import { GameLauncher } from '@/components/games/GameLauncher'
import { LevelChallengeGame } from '@/components/level/LevelChallengeGame'
import { AppPage, MetricCard, SurfaceCard } from '@/components/ui/AppPage'
import { categories } from '@/data/seed-videos'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { LEVEL_LABELS, CEFR_ORDER, displayLevelName } from '@/types/level'

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.id, category.label]),
) as Record<string, string>

export default function LearningPage() {
  const router = useRouter()
  const { phrases, removePhrase } = usePhraseStore()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const viewCounts = useWatchHistoryStore((state) => state.viewCounts)
  const streakDays = useUserStore((state) => state.streakDays)
  const totalXP = useUserStore((state) => state.getTotalXP())
  const likes = useLikeStore((state) => state.likes)
  const level = useOnboardingStore((s) => s.level)
  const canChallenge = useLevelChallengeStore((s) => s.canChallenge)
  const getTargetLevel = useLevelChallengeStore((s) => s.getTargetLevel)
  const getAttemptCount = useLevelChallengeStore((s) => s.getAttemptCount)

  const [showChallenge, setShowChallenge] = useState(false)

  const totalViews = useMemo(
    () => Object.values(viewCounts).reduce((sum, count) => sum + count, 0),
    [viewCounts],
  )
  const levelIdx = CEFR_ORDER.indexOf(level)
  const nextLevel = levelIdx < CEFR_ORDER.length - 1 ? CEFR_ORDER[levelIdx + 1] : null
  const nextLevelLabel = nextLevel ? LEVEL_LABELS[nextLevel] : null
  const likedVideos = useMemo(
    () =>
      Object.keys(likes)
        .map((id) => getCatalogVideoById(id))
        .filter(Boolean) as NonNullable<ReturnType<typeof getCatalogVideoById>>[],
    [likes],
  )

  return (
    <AppPage>
      <TodayDashboard />
      <div className="mt-6 space-y-6">
        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              STATS
            </p>
            <Link
              href="/learning/stats"
              className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
            >
              VIEW ALL
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="영어 레벨"
              value={LEVEL_LABELS[level]}
              detail={nextLevelLabel ? `Next ${nextLevelLabel}` : 'MAX'}
              tone="accent"
              className="text-center"
            />
            <MetricCard label="XP" value={totalXP} className="text-center" />
            <MetricCard label="저장 표현" value={`${phrases.length}개`} className="text-center" />
            <MetricCard
              label="연속 학습"
              value={`${Math.max(streakDays, totalViews > 0 ? 1 : 0)}일`}
              className="text-center"
            />
          </div>
        </SurfaceCard>

        {/* Level Challenge Card */}
        {canChallenge(level) && (() => {
          const target = getTargetLevel(level)
          if (!target) return null
          const attempts = getAttemptCount(target)
          const targetLabel = displayLevelName(target)
          return (
            <SurfaceCard className="p-5">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                LEVEL CHALLENGE
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {LEVEL_LABELS[level]} {'\u2192'} {targetLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    20장 중 16장 이상 알면 레벨업
                    {attempts > 0 ? ` \u00B7 ${attempts}회 도전` : ''}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowChallenge(true)}
                  className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    boxShadow: '0 2px 12px var(--accent-glow)',
                  }}
                >
                  도전
                </motion.button>
              </div>
            </SurfaceCard>
          )
        })()}

        <GameLauncher />

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              LIKED
            </p>
            {likedVideos.length > 0 && (
              <Link
                href="/learning/liked"
                className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
              >
                VIEW ALL
              </Link>
            )}
          </div>

          {likedVideos.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">No liked videos yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {likedVideos.slice(0, 5).map((video) => {
                const categoryLabel = categoryLabels[video.category] ?? ''
                const seriesTitle = video.seriesId
                  ? getCatalogSeriesById(video.seriesId)?.title
                  : null

                return (
                  <button
                    key={video.id}
                    onClick={() => {
                      clearDeletedFlag(video.id)
                      router.push(buildShortsUrl(video.id, video.seriesId))
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left shadow-[var(--card-shadow)]"
                  >
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {video.title}
                      </p>
                      {seriesTitle && (
                        <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                          {seriesTitle}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs text-[var(--text-muted)]">{categoryLabel}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">&middot;</span>
                        <span className="text-xs text-[var(--text-muted)]">Lv.{video.difficulty}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              SAVED
            </p>
            {phrases.length > 0 && (
              <Link
                href="/learning/saved"
                className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
              >
                VIEW ALL
              </Link>
            )}
          </div>

          {phrases.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">No saved items yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {phrases.slice(0, 3).map((phrase) => (
                  <SavedPhraseCard
                    key={phrase.id}
                    phrase={phrase}
                    onDelete={() => removePhrase(phrase.id)}
                    onPlay={() => {
                      clearDeletedFlag(phrase.videoId)
                      const seriesId = getCatalogVideoById(phrase.videoId)?.seriesId
                      const baseUrl = buildShortsUrl(phrase.videoId, seriesId)
                      const separator = baseUrl.includes('?') ? '&' : '?'
                      const url = `${baseUrl}${separator}t=${phrase.timestampStart}&phraseId=${phrase.id}`
                      router.push(url)
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </SurfaceCard>

        <WatchHistory />
      </div>

      {/* Level Challenge fullscreen overlay */}
      <AnimatePresence>
        {showChallenge && (() => {
          const target = getTargetLevel(level)
          if (!target) return null
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120]"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <button
                onClick={() => setShowChallenge(false)}
                className="absolute right-4 top-4 z-[130] flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                }}
              >
                {'\u2715'}
              </button>
              <LevelChallengeGame
                targetLevel={target}
                onClose={() => setShowChallenge(false)}
              />
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </AppPage>
  )
}
