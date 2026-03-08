'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  getSeriesByCategory,
  getVideosBySeries,
  seedVideos,
  series,
  type CategoryId,
  type Series as SeriesType,
} from '@/data/seed-videos'
import { DailyMissions } from '@/components/DailyMissions'
import { SearchBar } from '@/components/SearchBar'
import { WatchHistory } from '@/components/WatchHistory'
import { useAuth } from '@/hooks/useAuth'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const categoryLabels: Record<CategoryId, string> = {
  drama: '드라마',
  movie: '영화',
  daily: '일상',
  entertainment: '예능',
  music: '음악',
  animation: '애니',
}

function describeSeries(seriesItem: SeriesType) {
  return `${categoryLabels[seriesItem.category]} · ${seriesItem.episodeCount}개 클립`
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const {
    watchedVideoIds,
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
  const greetingName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.name?.split(' ')?.[0] ??
    '영어 루틴'

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

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent-text)]">
              StudyEng Home
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {greetingName}님, 오늘은 무엇을 볼까요?
            </h1>
          </div>
          {cameFromVideo && returnVideoId && (
            <button
              onClick={() => openShorts(returnVideoId, returnSeriesId)}
              className="rounded-full bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]"
            >
              영상으로 돌아가기
            </button>
          )}
        </div>

        <div className="mb-6 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <p className="text-sm text-[var(--text-secondary)]">
            최근 기록, 검색, 시리즈 탐색을 홈에서 바로 이어서 볼 수 있습니다.
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[var(--text-primary)]">
            홈에서 찾고
            <br />
            두 번째 탭에서 랜덤 쇼츠로 넘기세요.
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[var(--bg-secondary)] px-3 py-3">
              <p className="text-xs text-[var(--text-muted)]">시리즈</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{series.length}</p>
            </div>
            <div className="rounded-2xl bg-[var(--bg-secondary)] px-3 py-3">
              <p className="text-xs text-[var(--text-muted)]">클립</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{seedVideos.length}</p>
            </div>
            <div className="rounded-2xl bg-[var(--bg-secondary)] px-3 py-3">
              <p className="text-xs text-[var(--text-muted)]">최근 시청</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{watchedVideoIds.length}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/shorts', { scroll: false })}
              className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              랜덤 쇼츠 보기
            </button>
            <button
              onClick={() => router.replace(buildExploreUrl(null), { scroll: false })}
              className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              시리즈 둘러보기
            </button>
          </div>
        </div>

        <DailyMissions />
        <WatchHistory />
        <SearchBar />

        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 py-1 no-scrollbar">
          <button
            onClick={() => {
              setActiveCategory('all')
              if (selectedSeriesId) router.replace(buildExploreUrl(null), { scroll: false })
            }}
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
              onClick={() => {
                setActiveCategory(categoryId)
                if (selectedSeriesId) router.replace(buildExploreUrl(null), { scroll: false })
              }}
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

        {selectedSeries ? (
          <section>
            <button
              onClick={() => router.replace(buildExploreUrl(null), { scroll: false })}
              className="mb-4 text-sm text-[var(--accent-text)]"
            >
              목록으로
            </button>
            <div className="mb-4 rounded-2xl bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedSeries.title}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{describeSeries(selectedSeries)}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[var(--text-secondary)]">
                  {selectedSeries.episodeCount}개
                </span>
                <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-green-400">
                  {getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)}% 완료
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {seriesEpisodes.map((video) => (
                <motion.button
                  key={video.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openShorts(video.id, selectedSeries.id)}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg-card)] p-3 text-left shadow-[var(--card-shadow)]"
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
                        : 'bg-blue-500/15 text-blue-400'
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
                className="mt-2 rounded-xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white"
              >
                이어서 보기
              </button>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {activeCategory === 'all' ? '취향별 시리즈' : `${categoryLabels[activeCategory]} 시리즈`}
              </h2>
              <span className="text-sm text-[var(--text-muted)]">{filteredSeries.length}개</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredSeries.map((seriesItem) => (
                <motion.button
                  key={seriesItem.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.replace(buildExploreUrl(seriesItem.id), { scroll: false })}
                  className="rounded-2xl bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                    {seriesItem.title}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{describeSeries(seriesItem)}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-400">
                      {categoryLabels[seriesItem.category]}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {getSeriesProgress(seriesItem.id, seriesItem.episodeCount)}%
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
