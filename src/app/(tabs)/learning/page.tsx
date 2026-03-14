'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { TodayDashboard } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { WatchHistory } from '@/components/WatchHistory'
import { GameLauncher } from '@/components/games/GameLauncher'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { categories } from '@/data/seed-videos'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { CEFR_ORDER, LEVEL_LABELS } from '@/types/level'

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.id, category.label]),
) as Record<string, string>

export default function LearningPage() {
  const router = useRouter()
  const { phrases, removePhrase } = usePhraseStore()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const viewCounts = useWatchHistoryStore((state) => state.viewCounts)
  const watchedVideoIds = useWatchHistoryStore((state) => state.watchedVideoIds)
  const likes = useLikeStore((state) => state.likes)
  const level = useOnboardingStore((state) => state.level)

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
              개요
            </p>
            <Link
              href="/learning/stats"
              className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
            >
              VIEW ALL
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewStatCard
              label="레벨"
              value={LEVEL_LABELS[level]}
              detail={nextLevelLabel ? `다음 단계 ${nextLevelLabel}` : '현재 최고 레벨'}
              accent
            />

            <OverviewStatCard
              label="저장 표현"
              value={phrases.length}
              detail={`좋아요한 영상 ${likedVideos.length}개`}
            />

            <OverviewStatCard
              label="완료한 영상"
              value={watchedVideoIds.length}
              detail={`전체 재생 ${totalViews}회`}
            />
          </div>
        </SurfaceCard>

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
              <p className="text-sm text-[var(--text-secondary)]">아직 좋아요한 영상이 없습니다.</p>
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
              <p className="text-sm text-[var(--text-secondary)]">아직 저장한 표현이 없습니다.</p>
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
    </AppPage>
  )
}

function OverviewStatCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string
  value: string | number
  detail: string
  accent?: boolean
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        borderColor: accent ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'var(--border-card)',
        backgroundColor: accent ? 'var(--accent-glow)' : 'var(--bg-secondary)',
      }}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{detail}</p>
    </div>
  )
}
