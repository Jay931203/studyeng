'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { DailyMissions } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { WatchHistory } from '@/components/WatchHistory'
import { AppPage, MetricCard, SurfaceCard } from '@/components/ui/AppPage'
import { categories } from '@/data/seed-videos'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.id, category.label]),
) as Record<string, string>

export default function LearningPage() {
  const router = useRouter()
  const { phrases, removePhrase } = usePhraseStore()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const watchedVideoIds = useWatchHistoryStore((s) => s.watchedVideoIds)
  const viewCounts = useWatchHistoryStore((s) => s.viewCounts)
  const streakDays = useUserStore((s) => s.streakDays)
  const likedVideoIds = useLikeStore((s) => s.getLikedVideoIds())

  const totalWatched = watchedVideoIds.length
  const totalViews = useMemo(
    () => Object.values(viewCounts).reduce((sum, c) => sum + c, 0),
    [viewCounts],
  )

  const likedVideos = useMemo(
    () =>
      likedVideoIds
        .map((id) => getCatalogVideoById(id))
        .filter(Boolean) as NonNullable<ReturnType<typeof getCatalogVideoById>>[],
    [likedVideoIds],
  )

  return (
    <AppPage>
      <DailyMissions />
      <div className="mt-6 space-y-6">
        <WatchHistory />

        {/* Saved */}
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

        {/* Liked */}
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

        {/* Stats */}
        {totalWatched > 0 && (
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

            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="누적 시청" value={`${totalWatched}개`} className="text-center" />
              <MetricCard label="저장 표현" value={`${phrases.length}개`} className="text-center" />
              <MetricCard
                label="연속 루프"
                value={`${Math.max(streakDays, totalViews > 0 ? 1 : 0)}일`}
                className="text-center"
              />
            </div>
          </SurfaceCard>
        )}
      </div>
    </AppPage>
  )
}
