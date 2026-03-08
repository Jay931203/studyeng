'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  getSeriesByCategory,
  getVideosBySeries,
  seedVideos,
  series,
  type CategoryId,
  type Series as SeriesType,
  type VideoData,
} from '@/data/seed-videos'
import { SearchBar } from '@/components/SearchBar'
import { VideoCard } from '@/components/VideoCard'
import { useAuth } from '@/hooks/useAuth'
import { recommendVideos } from '@/lib/recommend'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
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
  const interests = useOnboardingStore((state) => state.interests)
  const level = useOnboardingStore((state) => state.level)
  const {
    watchedEpisodes,
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
    ? series.find((item) => item.id === selectedSeriesId) ?? null
    : null
  const seriesEpisodes = selectedSeries ? getVideosBySeries(selectedSeries.id) : []
  const filteredSeries = useMemo(
    () => (activeCategory === 'all' ? series : getSeriesByCategory(activeCategory)),
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
        const seriesItem = series.find((item) => item.id === seriesId)
        if (!seriesItem || watchedIds.length === 0) return null

        const episodes = getVideosBySeries(seriesId)
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
    const sourceVideos = recommendVideos(seedVideos, {
      watchedEpisodes,
      likes,
      interests,
      level,
    })

    return sourceVideos.slice(0, 4)
  }, [interests, level, likes, watchedEpisodes])

  const spotlightVideo = continueSeries[0]?.nextVideo ?? recommended[0] ?? seedVideos[0]
  const userName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.name?.split(' ')?.[0] ??
    null

  if (!spotlightVideo) return null

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-[var(--text-primary)]">
              StudyEng
            </p>
          </div>
          {cameFromVideo && returnVideoId && (
            <button
              onClick={() => openShorts(returnVideoId, returnSeriesId)}
              className="rounded-full bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]"
            >
              지금 보던 영상
            </button>
          )}
        </div>

        {!selectedSeries && (
          <>
            <section className="mb-6 overflow-hidden rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
              <div className="relative aspect-[1.2] w-full overflow-hidden sm:aspect-[1.8]">
                <img
                  src={`https://img.youtube.com/vi/${spotlightVideo.youtubeId}/hqdefault.jpg`}
                  alt={spotlightVideo.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.18), transparent 55%)',
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    {continueSeries.length > 0 ? '계속 보고 있는 것' : '오늘 시작해볼 것'}
                  </p>
                  <h1 className="mt-2 max-w-[18rem] text-2xl font-black leading-tight text-white">
                    {userName ? `${userName}님, 오늘 볼 장면을 골라보세요.` : '오늘 볼 장면을 골라보세요.'}
                  </h1>
                  <p className="mt-2 max-w-[22rem] text-sm text-white/72">
                    {continueSeries.length > 0
                      ? `${continueSeries[0].seriesItem.title} 다음 장면부터 바로 이어볼 수 있어요.`
                      : '취향과 난이도에 맞춰 바로 보고 싶어질 영상부터 추천합니다.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openShorts(spotlightVideo.id, spotlightVideo.seriesId)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                    >
                      바로 보기
                    </button>
                    <button
                      onClick={scrollToSeriesSection}
                      className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
                    >
                      시리즈 보기
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <SearchBar />

            <section className="mb-8">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">지금 보고 있는 것</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {continueSeries.length > 0
                      ? '멈춘 지점에서 바로 이어서 볼 수 있어요.'
                      : '아직 시작한 시리즈가 없어요. 아래 추천에서 바로 골라보세요.'}
                  </p>
                </div>
                {continueSeries.length > 0 && (
                  <button
                    onClick={() => router.push('/learning')}
                    className="text-xs font-medium text-[var(--accent-text)]"
                  >
                    시청 기록 보기
                  </button>
                )}
              </div>

              {continueSeries.length > 0 ? (
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                  {continueSeries.map((item) => (
                    <motion.button
                      key={item.seriesItem.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openShorts(item.nextVideo.id, item.seriesItem.id)}
                      className="w-[270px] flex-shrink-0 overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
                    >
                      <div className="relative aspect-[1.35] overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${item.nextVideo.youtubeId}/hqdefault.jpg`}
                          alt={item.nextVideo.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
                          <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            {item.progress}% 완료
                          </span>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm">
                            {item.watchedCount}개 봄
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                            {categoryLabels[item.seriesItem.category]}
                          </p>
                          <p className="mt-2 line-clamp-2 text-lg font-bold text-white">
                            {item.seriesItem.title}
                          </p>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-medium text-[var(--text-muted)]">다음으로 볼 장면</p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                          {item.nextVideo.title}
                        </p>
                        {item.lastVideo && (
                          <p className="mt-2 text-xs text-[var(--text-secondary)]">
                            마지막으로 본 장면: {item.lastVideo.title}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
                  <p className="text-sm text-[var(--text-secondary)]">
                    시리즈를 하나 시작하면 여기에 다음 장면과 진행률이 바로 보입니다.
                  </p>
                </div>
              )}
            </section>

            <section className="mb-8">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">지금 보고 싶어질 추천</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {interests.length > 0
                      ? '선택한 취향과 현재 레벨을 반영했어요.'
                      : '가볍게 시작하기 좋은 영상부터 보여드려요.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {recommended.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => openShorts(video.id, video.seriesId)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {selectedSeries ? (
          <section className="mb-8">
            <button
              onClick={() => router.replace(buildExploreUrl(null), { scroll: false })}
              className="mb-4 text-sm text-[var(--accent-text)]"
            >
              목록으로
            </button>
            <div className="mb-4 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-text)]">
                {categoryLabels[selectedSeries.category]}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                {selectedSeries.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{selectedSeries.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[var(--text-secondary)]">
                  {selectedSeries.episodeCount}개 장면
                </span>
                <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-[var(--accent-text)]">
                  {getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)}% 진행
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {seriesEpisodes.map((video) => (
                <motion.button
                  key={video.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openShorts(video.id, selectedSeries.id)}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {video.episodeNumber}. {video.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Lv.{video.difficulty} · {getViewCount(video.id)}회 시청
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      isWatched(selectedSeries.id, video.id)
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-[var(--accent-glow)] text-[var(--accent-text)]'
                    }`}
                  >
                    {isWatched(selectedSeries.id, video.id) ? '완료' : '보기'}
                  </span>
                </motion.button>
              ))}

              <button
                onClick={() => {
                  const nextId =
                    getNextEpisode(
                      selectedSeries.id,
                      seriesEpisodes.map((video) => video.id),
                    ) ?? seriesEpisodes[0]?.id
                  openShorts(nextId, selectedSeries.id)
                }}
                className="mt-2 rounded-2xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white"
              >
                이어서 보기
              </button>
            </div>
          </section>
        ) : (
          <section ref={seriesSectionRef} className="mb-8">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">더 보고 싶은 시리즈</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                취향에 맞는 시리즈를 골라서 장면 중심으로 이어보세요.
              </p>
            </div>

            <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 py-1 no-scrollbar">
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

            <div className="grid grid-cols-2 gap-3">
              {filteredSeries.map((seriesItem) => (
                <motion.button
                  key={seriesItem.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.replace(buildExploreUrl(seriesItem.id), { scroll: false })}
                  className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-text)]">
                    {categoryLabels[seriesItem.category]}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                    {seriesItem.title}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">
                    {getSeriesSubtitle(seriesItem)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      {getSeriesProgress(seriesItem.id, seriesItem.episodeCount)}% 진행
                    </span>
                    <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-1 text-[var(--text-secondary)]">
                      살펴보기
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
