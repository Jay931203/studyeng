'use client'

import Image from 'next/image'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  type CategoryId,
  type Series as SeriesType,
  type VideoData,
} from '@/data/seed-videos'
import { LogoFull } from '@/components/Logo'
import { SearchBar } from '@/components/SearchBar'
import { VideoCard } from '@/components/VideoCard'
import { AppPage, SectionHeader, SurfaceCard } from '@/components/ui/AppPage'
import {
  catalogSeries,
  catalogVideos,
  getCatalogSeriesByCategory,
  getCatalogVideosBySeries,
} from '@/lib/catalog'
import { recommendVideos } from '@/lib/recommend'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const categoryLabels: Record<CategoryId, string> = {
  drama: '드라마',
  movie: '영화',
  daily: '일상',
  entertainment: '예능',
  music: '음악',
  animation: '애니',
}

interface ContinueSeriesCard {
  seriesItem: SeriesType
  nextVideo: VideoData
  lastVideo: VideoData | null
  progress: number
  watchedCount: number
  lastWatchedAt: number
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all')
  const router = useRouter()
  const searchParams = useSearchParams()
  const seriesSectionRef = useRef<HTMLElement | null>(null)
  const likes = useLikeStore((state) => state.likes)
  const phrases = usePhraseStore((state) => state.phrases)
  const interests = useOnboardingStore((state) => state.interests)
  const level = useOnboardingStore((state) => state.level)
  const recentVideoIds = useRecommendationStore((state) => state.recentVideoIds)
  const videoSignals = useRecommendationStore((state) => state.videoSignals)
  const {
    watchedEpisodes,
    completionCounts,
    viewCounts,
    watchRecords,
    getSeriesProgress,
    getNextEpisode,
    getViewCount,
    clearDeletedFlag,
  } = useWatchHistoryStore()

  const selectedSeriesId = searchParams.get('series')
  const source = searchParams.get('source')
  const returnVideoId = searchParams.get('returnVideoId')
  const returnSeriesId = searchParams.get('returnSeriesId')
  const cameFromVideo = Boolean(returnVideoId) && (source === 'video' || source === 'shorts')
  const selectedSeries = selectedSeriesId
    ? catalogSeries.find((item) => item.id === selectedSeriesId) ?? null
    : null
  const seriesEpisodes = selectedSeries ? getCatalogVideosBySeries(selectedSeries.id) : []

  const filteredSeries = useMemo(
    () => (activeCategory === 'all' ? catalogSeries : getCatalogSeriesByCategory(activeCategory)),
    [activeCategory],
  )

  const buildExploreUrl = useCallback(
    (seriesId: string | null) => {
      const params = new URLSearchParams()
      if (seriesId) params.set('series', seriesId)
      if (cameFromVideo && returnVideoId) {
        params.set('source', source === 'shorts' ? 'shorts' : 'video')
        params.set('returnVideoId', returnVideoId)
        if (returnSeriesId) params.set('returnSeriesId', returnSeriesId)
      }
      const query = params.toString()
      return query ? `/explore?${query}` : '/explore'
    },
    [cameFromVideo, returnSeriesId, returnVideoId, source],
  )

  const openShorts = useCallback(
    (videoId?: string | null, seriesId?: string | null) => {
      if (!videoId) return
      clearDeletedFlag(videoId)
      router.push(buildShortsUrl(videoId, seriesId), { scroll: false })
    },
    [clearDeletedFlag, router],
  )

  const scrollToSeriesSection = useCallback(() => {
    seriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const continueSeries = useMemo<ContinueSeriesCard[]>(() => {
    const latestByVideo = new Map<string, number>()
    for (const record of watchRecords) {
      if (!latestByVideo.has(record.videoId)) {
        latestByVideo.set(record.videoId, record.watchedAt)
      }
    }

    return Object.entries(watchedEpisodes)
      .map(([seriesId, watchedIds]) => {
        const seriesItem = catalogSeries.find((item) => item.id === seriesId)
        if (!seriesItem || watchedIds.length === 0) return null

        const episodes = getCatalogVideosBySeries(seriesId)
        if (episodes.length === 0) return null

        const nextVideoId =
          getNextEpisode(
            seriesId,
            episodes.map((video) => video.id),
          ) ?? episodes[0]?.id
        const nextVideo = episodes.find((video) => video.id === nextVideoId)
        if (!nextVideo) return null

        const lastVideoId = [...watchedIds].sort(
          (left, right) => (latestByVideo.get(right) ?? 0) - (latestByVideo.get(left) ?? 0),
        )[0]
        const lastVideo = episodes.find((video) => video.id === lastVideoId) ?? null

        return {
          seriesItem,
          nextVideo,
          lastVideo,
          progress: getSeriesProgress(seriesId, seriesItem.episodeCount),
          watchedCount: watchedIds.length,
          lastWatchedAt: latestByVideo.get(lastVideoId) ?? 0,
        }
      })
      .filter((item): item is ContinueSeriesCard => item !== null)
      .sort((left, right) => right.lastWatchedAt - left.lastWatchedAt)
      .slice(0, 4)
  }, [getNextEpisode, getSeriesProgress, watchRecords, watchedEpisodes])

  const recommended = useMemo(() => {
    const ranked = recommendVideos(catalogVideos, {
      watchedEpisodes,
      completionCounts,
      watchRecords,
      viewCounts,
      likes,
      interests,
      level,
      phrases,
      recentVideoIds,
      videoSignals,
    })

    return ranked.slice(0, 8)
  }, [
    completionCounts,
    interests,
    level,
    likes,
    phrases,
    recentVideoIds,
    videoSignals,
    viewCounts,
    watchRecords,
    watchedEpisodes,
  ])

  const spotlightVideo = continueSeries[0]?.nextVideo ?? recommended[0] ?? catalogVideos[0]

  if (!spotlightVideo) return null

  if (selectedSeries) {
    const progressPct = getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference - (progressPct / 100) * circumference

    return (
      <AppPage>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
              시리즈
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">시리즈 상세</h1>
          </div>
          <button
            onClick={() => router.replace(buildExploreUrl(null), { scroll: false })}
            className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)]"
          >
            목록으로
          </button>
        </div>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <SurfaceCard className="p-6">
            <div className="flex items-start gap-5">
              <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--bg-secondary)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-primary)"
                  fontSize="18"
                  fontWeight="700"
                >
                  {progressPct}%
                </text>
              </svg>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                  {categoryLabels[selectedSeries.category]}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                  {selectedSeries.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {selectedSeries.description}
                </p>
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  총 {selectedSeries.episodeCount}개 에피소드
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const nextId =
                  getNextEpisode(
                    selectedSeries.id,
                    seriesEpisodes.map((video) => video.id),
                  ) ?? seriesEpisodes[0]?.id
                openShorts(nextId, selectedSeries.id)
              }}
              className="mt-6 w-full rounded-2xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white"
            >
              이어 보기
            </button>
          </SurfaceCard>

          <div className="space-y-3">
            {seriesEpisodes.map((video) => {
              const views = getViewCount(video.id)
              return (
                <motion.button
                  key={video.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openShorts(video.id, selectedSeries.id)}
                  className="flex w-full items-center gap-3 rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left shadow-[var(--card-shadow)]"
                >
                  <div className="relative h-[56px] w-[100px] shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {video.episodeNumber}. {video.title}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span>Lv.{video.difficulty}</span>
                      <span className="font-mono text-[var(--text-secondary)]">&times;{views}</span>
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </section>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <div className="mb-6 flex items-center justify-between">
        <LogoFull className="h-7 text-[var(--text-primary)]" />
        {cameFromVideo && returnVideoId && (
          <button
            onClick={() => openShorts(returnVideoId, returnSeriesId)}
            className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)]"
          >
            Back
          </button>
        )}
      </div>

      <section className="mb-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard className="overflow-hidden">
          <div className="grid min-h-[240px] lg:grid-cols-[1.02fr_0.98fr]">
            <div className="order-2 p-6 sm:p-8 lg:order-1 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                오늘의 추천
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--text-primary)]">
                지금 볼 영상
              </h2>
              {continueSeries.length > 0 && (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {continueSeries[0].seriesItem.title}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => openShorts(spotlightVideo.id, spotlightVideo.seriesId)}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
                >
                  바로 보기
                </button>
                <button
                  onClick={scrollToSeriesSection}
                  className="rounded-full border border-[var(--border-card)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
                >
                  시리즈
                </button>
              </div>
            </div>

            <div className="order-1 relative min-h-[180px] overflow-hidden lg:order-2 lg:min-h-full">
              <Image
                src={`https://img.youtube.com/vi/${spotlightVideo.youtubeId}/hqdefault.jpg`}
                alt={spotlightVideo.title}
                fill
                sizes="(min-width: 1280px) 34vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.24), transparent 55%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {categoryLabels[spotlightVideo.category]}
                </div>
                <p className="mt-3 line-clamp-2 text-xl font-semibold text-white">
                  {spotlightVideo.title}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="flex flex-col gap-4">
          <SearchBar />
        </div>
      </section>

      {continueSeries.length > 0 && (
        <section className="mb-8 overflow-hidden">
          <SectionHeader title="이어보는 시리즈" />

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {continueSeries.map((item) => (
              <motion.button
                key={item.seriesItem.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => openShorts(item.nextVideo.id, item.seriesItem.id)}
                className="w-[260px] shrink-0 overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
              >
                <div className="relative aspect-[2] overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${item.nextVideo.youtubeId}/hqdefault.jpg`}
                    alt={item.nextVideo.title}
                    fill
                    sizes="260px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-bold text-white">{item.seriesItem.title}</p>
                    <p className="mt-1 text-[11px] text-white/70">
                      {item.progress}% · {item.watchedCount}/{item.seriesItem.episodeCount}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                    다음: {item.nextVideo.title}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <SectionHeader title="추천" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {recommended.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => openShorts(video.id, video.seriesId)}
            />
          ))}
        </div>
      </section>

      <section ref={seriesSectionRef} className="mb-8">
        <SectionHeader title="시리즈" />

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-4 py-2 text-sm ${
              activeCategory === 'all'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            전체
          </button>
          {(Object.keys(categoryLabels) as CategoryId[]).map((categoryId) => (
            <button
              key={categoryId}
              onClick={() => setActiveCategory(categoryId)}
              className={`rounded-full px-4 py-2 text-sm ${
                activeCategory === categoryId
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {categoryLabels[categoryId]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSeries.map((seriesItem) => {
            const episodes = getCatalogVideosBySeries(seriesItem.id)
            const thumbVideo = episodes[0]

            return (
              <motion.button
                key={seriesItem.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push(buildExploreUrl(seriesItem.id), { scroll: false })}
                className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
              >
                {thumbVideo && (
                  <div className="relative aspect-[2.2] overflow-hidden">
                    <Image
                      src={`https://img.youtube.com/vi/${thumbVideo.youtubeId}/hqdefault.jpg`}
                      alt={seriesItem.title}
                      fill
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className="text-xs font-medium text-white/80">
                        {categoryLabels[seriesItem.category]}
                      </span>
                      <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm">
                        {seriesItem.episodeCount}개
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {seriesItem.title}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span>진행률 {getSeriesProgress(seriesItem.id, seriesItem.episodeCount)}%</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>
    </AppPage>
  )
}
