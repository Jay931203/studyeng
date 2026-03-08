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
import { AppPage, MetricCard, PageHeader, SectionHeader, SurfaceCard } from '@/components/ui/AppPage'
import { useAuth } from '@/hooks/useAuth'
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

const levelLabels = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
} as const

interface ContinueSeriesCard {
  seriesItem: SeriesType
  nextVideo: VideoData
  lastVideo: VideoData | null
  progress: number
  watchedCount: number
  lastWatchedAt: number
}

function getSeriesSubtitle(seriesItem: SeriesType) {
  return `${categoryLabels[seriesItem.category]} · ${seriesItem.description}`
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
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
    isWatched,
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
    const sourceVideos = recommendVideos(catalogVideos, {
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

    return sourceVideos.slice(0, 8)
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
  const userName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.name?.split(' ')?.[0] ??
    null
  const likedCount = Object.values(likes).filter(Boolean).length

  if (!spotlightVideo) return null

  if (selectedSeries) {
    return (
      <AppPage>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                시리즈
              </p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                시리즈 상세
              </h1>
            </div>
            <button
              onClick={() => router.replace(buildExploreUrl(null), { scroll: false })}
              className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              목록으로
            </button>
          </div>

          <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <SurfaceCard className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                {categoryLabels[selectedSeries.category]}
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
                {selectedSeries.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {selectedSeries.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-[var(--text-secondary)]">
                  총 {selectedSeries.episodeCount}개 에피소드
                </span>
                <span className="rounded-full bg-[var(--accent-glow)] px-3 py-1.5 text-[var(--accent-text)]">
                  진행률 {getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)}%
                </span>
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
              {seriesEpisodes.map((video) => (
                <motion.button
                  key={video.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openShorts(video.id, selectedSeries.id)}
                  className="flex w-full items-center justify-between rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {video.episodeNumber}. {video.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Lv.{video.difficulty} · 시청 {getViewCount(video.id)}회
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isWatched(selectedSeries.id, video.id)
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-[var(--accent-glow)] text-[var(--accent-text)]'
                    }`}
                  >
                    {isWatched(selectedSeries.id, video.id) ? '완료' : '보기'}
                  </span>
                </motion.button>
              ))}
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
            <div className="grid min-h-[360px] lg:grid-cols-[1.02fr_0.98fr]">
              <div className="order-2 p-6 sm:p-8 lg:order-1 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                  {continueSeries.length > 0 ? '이어보기' : '오늘 추천'}
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--text-primary)]">
                  {continueSeries.length > 0
                    ? `${continueSeries[0].seriesItem.title} 이어서 보기`
                    : '오늘 먼저 볼 장면'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {continueSeries.length > 0
                    ? `${continueSeries[0].lastVideo?.title ?? '방금 보던 장면'} 다음 흐름부터 바로 붙습니다.`
                    : '취향과 최근 반응을 기준으로 지금 보기 좋은 클립을 먼저 올려뒀습니다.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => openShorts(spotlightVideo.id, spotlightVideo.seriesId)}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
                  >
                    바로 보기
                  </button>
                  <button
                    onClick={() => router.push('/shorts')}
                    className="rounded-full bg-[var(--bg-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)]"
                  >
                    피드 열기
                  </button>
                  <button
                    onClick={scrollToSeriesSection}
                    className="rounded-full border border-[var(--border-card)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
                  >
                    시리즈
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetricCard label="저장 표현" value={`${phrases.length}개`} />
                  <MetricCard label="반영 난이도" value={levelLabels[level]} />
                  <MetricCard label="좋아요" value={`${likedCount}개`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--accent-glow)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)]">
                    {interests.length > 0 ? `${interests.length}개 취향 반영` : '기본 추천'}
                  </span>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                    {continueSeries.length > 0 ? `${continueSeries.length}개 이어보기` : '새 큐'}
                  </span>
                </div>
              </div>

              <div className="order-1 relative min-h-[280px] overflow-hidden lg:order-2 lg:min-h-full">
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
                  <p className="mt-2 text-sm text-white/72">
                    짧게 보고 남겨두기 좋은 장면입니다.
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <div className="flex flex-col gap-4">
            <SearchBar />

            <SurfaceCard className="rounded-[28px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                오늘 메모
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                지금 상태
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                오늘 바로 이어볼 수 있는 것만 추려둡니다.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricCard label="이어볼 시리즈" value={`${continueSeries.length}개`} />
                <MetricCard label="추천 큐" value={`${recommended.length}개`} />
                <MetricCard label="최근 반응" value={`${recentVideoIds.length}개`} />
                <MetricCard label="좋아요" value={`${likedCount}개`} />
              </div>
            </SurfaceCard>
          </div>
        </section>

        <section className="mb-8">
          <SectionHeader
            eyebrow="이어보기"
            title="이어보기"
            description={
              continueSeries.length > 0
                ? '끊긴 지점에서 바로 다시 붙습니다.'
                : '아직 이어볼 흐름이 없습니다. 아래 추천에서 하나 고르면 여기 쌓입니다.'
            }
            action={
              continueSeries.length > 0 ? (
                <button
                  onClick={() => router.push('/learning')}
                  className="text-sm font-medium text-[var(--accent-text)]"
                >
                  복습 보기
                </button>
              ) : undefined
            }
          />

          {continueSeries.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {continueSeries.map((item) => (
                <motion.button
                  key={item.seriesItem.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openShorts(item.nextVideo.id, item.seriesItem.id)}
                  className="overflow-hidden rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
                >
                  <div className="relative aspect-[1.6] overflow-hidden">
                    <Image
                      src={`https://img.youtube.com/vi/${item.nextVideo.youtubeId}/hqdefault.jpg`}
                      alt={item.nextVideo.title}
                      fill
                      sizes="(min-width: 1024px) 42vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        {item.progress}% 완료
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm">
                        {item.watchedCount}개 시청
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                        {categoryLabels[item.seriesItem.category]}
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">{item.seriesItem.title}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-[var(--text-muted)]">다음 장면</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                      {item.nextVideo.title}
                    </p>
                    {item.lastVideo && (
                      <p className="mt-2 text-xs text-[var(--text-secondary)]">
                        마지막 시청: {item.lastVideo.title}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                시리즈를 하나 시작하면 다음 장면과 진행률이 이 영역에 자동으로 정리됩니다.
              </p>
            </div>
          )}
        </section>

        <section className="mb-8">
          <SectionHeader
            eyebrow="추천"
            title="지금 뜨는 장면"
            description={
              interests.length > 0
                ? '선택한 취향과 최근 반응을 기준으로 순서를 조정했습니다.'
                : '가볍게 시작하기 좋은 클립부터 올려뒀습니다.'
            }
          />
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
          <SectionHeader
            eyebrow="시리즈"
            title="시리즈"
            description="한 흐름으로 이어지는 장면만 따로 모았습니다."
          />

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
            {filteredSeries.map((seriesItem) => (
              <motion.button
                key={seriesItem.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.replace(buildExploreUrl(seriesItem.id), { scroll: false })}
                className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 text-left shadow-[var(--card-shadow)]"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-text)]">
                  {categoryLabels[seriesItem.category]}
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                  {seriesItem.title}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {getSeriesSubtitle(seriesItem)}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">
                    진행률 {getSeriesProgress(seriesItem.id, seriesItem.episodeCount)}%
                  </span>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[var(--text-secondary)]">
                    상세 보기
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
    </AppPage>
  )
}
