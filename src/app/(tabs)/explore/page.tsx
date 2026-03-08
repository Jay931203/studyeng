'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  categories,
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

function getCategorySeriesCount(categoryId: CategoryId): number {
  return series.filter((item) => item.category === categoryId).length
}

function CategoryIcon({ id, className }: { id: CategoryId | 'all'; className?: string }) {
  const cls = className ?? 'w-4 h-4'

  switch (id) {
    case 'all':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
          <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
        </svg>
      )
    case 'drama':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
          <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
          <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
        </svg>
      )
    case 'movie':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
          <path fillRule="evenodd" d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 01-1.75 1.75h-1.5c-.078 0-.155-.005-.23-.015H4.48c-.075.01-.152.015-.23.015h-1.5A1.75 1.75 0 011 15.265V4.75zm16.5 7.385V11.01a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25v1.125c0 .138.112.25.25.25h1.5a.25.25 0 00.25-.25zm0-3.398v-1.11a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25v1.11c0 .139.112.25.25.25h1.5a.25.25 0 00.25-.25zm-15 1.13v1.11c0 .14.112.25.25.25h1.5a.25.25 0 00.25-.25v-1.11a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25zm0 2.267v1.126c0 .138.112.25.25.25h1.5a.25.25 0 00.25-.25v-1.126a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25zM2.5 7.626v1.11c0 .14.112.25.25.25h1.5a.25.25 0 00.25-.25v-1.11a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25zm0-2.99v1.11c0 .14.112.25.25.25h1.5a.25.25 0 00.25-.25v-1.11a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25zm15 1.11v-1.11a.25.25 0 00-.25-.25h-1.5a.25.25 0 00-.25.25v1.11c0 .14.112.25.25.25h1.5a.25.25 0 00.25-.25zM5.75 10h8.5a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-8.5a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75zm0-5.5h8.5a.75.75 0 01.75.75v2.5a.75.75 0 01-.75.75h-8.5A.75.75 0 015 7.75v-2.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
      )
    case 'entertainment':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
          <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zm0 14.5a2 2 0 01-1.95-1.557 33.54 33.54 0 003.9 0A2 2 0 0110 16.5z" clipRule="evenodd" />
        </svg>
      )
    case 'music':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
          <path fillRule="evenodd" d="M17.721 1.599a.75.75 0 01.279.584v11.29a2.5 2.5 0 01-1.534 2.307 2.503 2.503 0 01-2.726-.545 2.5 2.5 0 011.736-4.236h.282a.75.75 0 00.544-.236.749.749 0 00.206-.556V4.649l-9 2.076v9.108a2.5 2.5 0 01-1.534 2.307 2.503 2.503 0 01-2.726-.545A2.5 2.5 0 014.983 13.4h.282a.75.75 0 00.75-.75V4.403a.75.75 0 01.556-.722l10.5-2.42a.75.75 0 01.65.138z" clipRule="evenodd" />
        </svg>
      )
    case 'animation':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
          <path d="M3.196 12.87l-.825.483a.75.75 0 000 1.294l7.004 4.086A1.75 1.75 0 0011.125 18v-.857l-7.93-4.273z" />
          <path d="M10.625 15.65l7.005-4.085a.75.75 0 000-1.294L10.625 6.186A1.75 1.75 0 008.875 7.5v6.736a1.75 1.75 0 001.75.714z" />
          <path fillRule="evenodd" d="M2.375 5.108a.75.75 0 000 1.284l7.004 4.086A1.75 1.75 0 0011.125 9.5V2.236a1.75 1.75 0 00-1.746-.714L2.375 5.108z" clipRule="evenodd" />
        </svg>
      )
    default:
      return null
  }
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

  const selectedSeries = useMemo(
    () => (selectedSeriesId ? series.find((item) => item.id === selectedSeriesId) ?? null : null),
    [selectedSeriesId]
  )

  const buildExploreUrl = useCallback(
    (seriesId: string | null) => {
      const params = new URLSearchParams()

      if (seriesId) {
        params.set('series', seriesId)
      }

      if (cameFromVideo && returnVideoId) {
        params.set('source', 'shorts')
        params.set('returnVideoId', returnVideoId)
        if (returnSeriesId) {
          params.set('returnSeriesId', returnSeriesId)
        }
      }

      const query = params.toString()
      return query ? `/explore?${query}` : '/explore'
    },
    [cameFromVideo, returnSeriesId, returnVideoId]
  )

  const returnToVideo = useCallback(() => {
    if (!returnVideoId) {
      router.push('/shorts', { scroll: false })
      return
    }

    clearDeletedFlag(returnVideoId)
    router.push(buildShortsUrl(returnVideoId, returnSeriesId), { scroll: false })
  }, [clearDeletedFlag, returnSeriesId, returnVideoId, router])

  const setSelectedSeries = useCallback(
    (seriesItem: SeriesType | null) => {
      router.replace(buildExploreUrl(seriesItem?.id ?? null), { scroll: false })
    },
    [buildExploreUrl, router]
  )

  const filteredSeries = useMemo(
    () => (activeCategory === 'all' ? series : getSeriesByCategory(activeCategory)),
    [activeCategory]
  )

  const seriesEpisodes = selectedSeries ? getVideosBySeries(selectedSeries.id) : []
  const greetingName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.name?.split(' ')?.[0] ??
    '영어 루틴'

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent-text)]">
              StudyEng Home
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">홈</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)]">
              시리즈 {series.length}개 · 영상 {seedVideos.length}개
            </span>
            {cameFromVideo && (
              <button
                onClick={returnToVideo}
                className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                원래 영상으로
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[70%]">
              <p className="text-sm text-[var(--text-secondary)]">{greetingName}님, 오늘도 이어서 해볼까요?</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[var(--text-primary)]">
                짧은 쇼츠로 시작하고
                <br />
                취향대로 시리즈를 찾아보세요.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                최근 시청 기록과 할인 진행률을 한 번에 보고, 바로 랜덤 쇼츠나 시리즈 탐색으로 이어갈 수 있습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--accent-glow)] p-3 text-[var(--accent-text)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                <path d="M6.75 5.653c0-1.336 1.433-2.183 2.603-1.54l9.161 5.036c1.211.666 1.211 2.404 0 3.07l-9.16 5.036c-1.171.643-2.604-.204-2.604-1.54V5.653Z" />
              </svg>
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
              onClick={() => {
                setActiveCategory('all')
                if (selectedSeriesId) {
                  router.replace(buildExploreUrl(null), { scroll: false })
                }
              }}
              className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
            >
              시리즈 둘러보기
            </button>
            {watchedVideoIds.length > 0 && (
              <span className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                최근 본 영상 {watchedVideoIds.length}개
              </span>
            )}
          </div>
        </div>

        <DailyMissions />
        <WatchHistory />
        <SearchBar />

        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveCategory('all')
              if (selectedSeriesId) {
                router.push(buildExploreUrl(null), { scroll: false })
              }
            }}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            <CategoryIcon id="all" className="h-3.5 w-3.5" />
            <span>전체</span>
            <span className={`text-xs ${activeCategory === 'all' ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
              {series.length}
            </span>
          </motion.button>

          {categories.map((category) => {
            const seriesCount = getCategorySeriesCount(category.id)
            if (seriesCount === 0) return null

            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveCategory(category.id)
                  if (selectedSeriesId) {
                    router.replace(buildExploreUrl(null), { scroll: false })
                  }
                }}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <CategoryIcon id={category.id} className="h-3.5 w-3.5" />
                <span>{category.label}</span>
                <span className={`text-xs ${activeCategory === category.id ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                  {seriesCount}
                </span>
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {selectedSeries && (
            <motion.div
              key={`detail-${selectedSeries.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <button
                onClick={() => setSelectedSeries(null)}
                className="mb-4 flex items-center gap-1.5 text-sm text-[var(--accent-text)] transition-colors hover:text-[var(--accent-primary)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                목록으로
              </button>

              <div className="mb-5 overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
                {(() => {
                  const detailFirstVideo = getVideosBySeries(selectedSeries.id)[0]
                  if (!detailFirstVideo) return null

                  return (
                    <div className="relative aspect-video w-full">
                      <img
                        src={`https://img.youtube.com/vi/${detailFirstVideo.youtubeId}/mqdefault.jpg`}
                        alt={selectedSeries.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-xl font-bold text-white drop-shadow-lg">{selectedSeries.title}</h2>
                        <p className="mt-1 text-sm text-white/80">{selectedSeries.description}</p>
                      </div>
                    </div>
                  )
                })()}
                <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-400">
                    {categoryLabels[selectedSeries.category] ?? selectedSeries.category}
                  </span>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                    {selectedSeries.episodeCount}편
                  </span>
                  {(() => {
                    const progress = getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)
                    return progress > 0 ? (
                      <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-400">
                        {progress}% 완료
                      </span>
                    ) : null
                  })()}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {seriesEpisodes.map((video) => {
                  const watched = selectedSeries ? isWatched(selectedSeries.id, video.id) : false
                  const viewCount = getViewCount(video.id)

                  return (
                    <motion.button
                      key={video.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        clearDeletedFlag(video.id)
                        router.push(buildShortsUrl(video.id, selectedSeries.id), { scroll: false })
                      }}
                      className="group flex items-center gap-3.5 rounded-xl bg-[var(--bg-card)] p-3.5 text-left shadow-[var(--card-shadow)] transition-colors hover:bg-[var(--bg-secondary)]/60"
                    >
                      <div className="relative aspect-video w-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          alt={video.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                            <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                          </svg>
                        </div>
                        {watched && (
                          <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-2.5 w-2.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            watched ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {video.episodeNumber}
                          </span>
                          <p className={`truncate text-sm font-medium ${
                            watched ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
                          }`}>
                            {video.title}
                          </p>
                        </div>
                        <div className="ml-8 mt-1 flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)]">
                            난이도 {'★'.repeat(video.difficulty)}{'☆'.repeat(5 - video.difficulty)}
                          </span>
                          {viewCount > 0 && (
                            <span className="text-xs text-[var(--text-muted)]">{viewCount}회 시청</span>
                          )}
                        </div>
                      </div>

                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 flex-shrink-0 text-[var(--text-muted)]">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  )
                })}

                {(() => {
                  const allIds = seriesEpisodes.map((video) => video.id)
                  const progress = selectedSeries
                    ? getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)
                    : 0
                  const nextId = selectedSeries
                    ? getNextEpisode(selectedSeries.id, allIds)
                    : null
                  const hasProgress = progress > 0
                  const isComplete = progress >= 100

                  return (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const targetVideoId =
                          isComplete ? seriesEpisodes[0]?.id : nextId ?? seriesEpisodes[0]?.id

                        if (!targetVideoId || !selectedSeries) return

                        clearDeletedFlag(targetVideoId)
                        router.push(buildShortsUrl(targetVideoId, selectedSeries.id), { scroll: false })
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-3.5 font-semibold text-white"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                      </svg>
                      {isComplete ? '처음부터 다시 보기' : hasProgress ? '이어보기' : '첫 에피소드 보기'}
                    </motion.button>
                  )
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedSeries && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {activeCategory === 'all' ? '카테고리별 시리즈' : `${categoryLabels[activeCategory]} 시리즈`}
              </h2>
              <span className="text-sm text-[var(--text-muted)]">{filteredSeries.length}개</span>
            </div>

            {filteredSeries.length > 0 ? (
              <LayoutGroup>
                <motion.div className="grid grid-cols-2 gap-3" layout>
                  <AnimatePresence mode="popLayout">
                    {filteredSeries.map((seriesItem) => {
                      const progress = getSeriesProgress(seriesItem.id, seriesItem.episodeCount)
                      const firstVideo = getVideosBySeries(seriesItem.id)[0]
                      const catLabel = categoryLabels[seriesItem.category] ?? seriesItem.category

                      return (
                        <motion.button
                          key={seriesItem.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          transition={{
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.3, type: 'spring', bounce: 0.15 },
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedSeries(seriesItem)}
                          className="group flex flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
                        >
                          <div className="relative aspect-video w-full overflow-hidden">
                            {firstVideo ? (
                              <img
                                src={`https://img.youtube.com/vi/${firstVideo.youtubeId}/mqdefault.jpg`}
                                alt={seriesItem.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[var(--bg-secondary)]">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-[var(--text-muted)]">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                                <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                              </svg>
                              {seriesItem.episodeCount}편
                            </div>

                            {progress > 0 && progress < 100 && (
                              <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center">
                                <svg className="h-7 w-7 -rotate-90" viewBox="0 0 28 28">
                                  <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                                  <circle
                                    cx="14"
                                    cy="14"
                                    r="11"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(progress / 100) * 69.115} 69.115`}
                                  />
                                </svg>
                              </div>
                            )}

                            {progress >= 100 && (
                              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-3">
                            <p className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
                              {seriesItem.title}
                            </p>
                            <p className="mb-2.5 line-clamp-1 text-xs text-[var(--text-muted)]">
                              {seriesItem.description}
                            </p>
                            <div className="mt-auto">
                              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                                {catLabel}
                              </span>
                            </div>
                          </div>

                          <div className="h-1 bg-[var(--bg-secondary)]">
                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-secondary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-[var(--text-muted)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text-muted)]">이 카테고리에는 아직 시리즈가 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
