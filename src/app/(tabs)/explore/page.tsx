'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  seedVideos,
  series,
  categories,
  getVideosBySeries,
  getSeriesByCategory,
  type CategoryId,
  type Series as SeriesType,
} from '@/data/seed-videos'
import { SearchBar } from '@/components/SearchBar'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

// Category label map (no emojis)
const categoryLabels: Record<CategoryId, string> = {
  drama: '드라마',
  movie: '영화',
  daily: '일상',
  entertainment: '예능',
  music: '음악',
  animation: '애니',
}

function getCategorySeriesCount(categoryId: CategoryId): number {
  return series.filter((s) => s.category === categoryId).length
}

// SVG icons to replace emojis for category chips
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
  const { getSeriesProgress, getNextEpisode, isWatched, getViewCount } = useWatchHistoryStore()

  // Drive selected series from URL search params so browser back works
  const selectedSeriesId = searchParams.get('series')
  const selectedSeries = useMemo(
    () => (selectedSeriesId ? series.find((s) => s.id === selectedSeriesId) ?? null : null),
    [selectedSeriesId],
  )

  const setSelectedSeries = useCallback(
    (s: SeriesType | null) => {
      if (s) {
        router.push(`/explore?series=${s.id}`, { scroll: false })
      } else {
        router.back()
      }
    },
    [router],
  )

  const filteredSeries = useMemo(() => {
    return activeCategory === 'all' ? series : getSeriesByCategory(activeCategory as CategoryId)
  }, [activeCategory])

  const seriesEpisodes = selectedSeries ? getVideosBySeries(selectedSeries.id) : []

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[var(--text-primary)] text-2xl font-bold">탐색</h1>
          <div className="text-[var(--text-muted)] text-sm">
            {series.length}개 시리즈 / {seedVideos.length}개 영상
          </div>
        </div>

        {/* Search */}
        <SearchBar />

        {/* Category Filter Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveCategory('all')
              if (selectedSeriesId) router.push('/explore', { scroll: false })
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              activeCategory === 'all'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80'
            }`}
          >
            <CategoryIcon id="all" className="w-3.5 h-3.5" />
            <span>전체</span>
            <span className={`text-xs ${activeCategory === 'all' ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
              {series.length}
            </span>
          </motion.button>
          {categories.map((cat) => {
            const seriesCount = getCategorySeriesCount(cat.id)
            if (seriesCount === 0) return null
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveCategory(cat.id)
                  if (selectedSeriesId) router.push('/explore', { scroll: false })
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80'
                }`}
              >
                <CategoryIcon id={cat.id} className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-xs ${activeCategory === cat.id ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                  {seriesCount}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Series Detail View */}
        <AnimatePresence mode="wait">
          {selectedSeries && (
            <motion.div
              key={`detail-${selectedSeries.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Back button */}
              <button
                onClick={() => router.back()}
                className="text-blue-400 text-sm mb-4 flex items-center gap-1.5 hover:text-blue-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                목록으로
              </button>

              {/* Series hero card */}
              <div className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl overflow-hidden mb-5">
                {(() => {
                  const detailFirstVideo = getVideosBySeries(selectedSeries.id)[0]
                  return detailFirstVideo ? (
                    <div className="w-full aspect-video relative">
                      <img
                        src={`https://img.youtube.com/vi/${detailFirstVideo.youtubeId}/mqdefault.jpg`}
                        alt={selectedSeries.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-white font-bold text-xl drop-shadow-lg">{selectedSeries.title}</h2>
                        <p className="text-white/80 text-sm mt-1">{selectedSeries.description}</p>
                      </div>
                    </div>
                  ) : null
                })()}
                <div className="px-4 py-3 flex items-center gap-2 border-t border-white/5">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium">
                    {categoryLabels[selectedSeries.category] ?? selectedSeries.category}
                  </span>
                  <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full">
                    {selectedSeries.episodeCount}편
                  </span>
                  {(() => {
                    const progress = getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)
                    if (progress > 0) {
                      return (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                          {progress}% 완료
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              {/* Episode list */}
              <div className="flex flex-col gap-2.5">
                {seriesEpisodes.map((video) => {
                  const watched = selectedSeries ? isWatched(selectedSeries.id, video.id) : false
                  const viewCount = getViewCount(video.id)
                  return (
                    <motion.button
                      key={video.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/?v=${video.id}&series=${selectedSeries.id}`)}
                      className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-3.5 text-left flex items-center gap-3.5 group hover:bg-[var(--bg-secondary)]/50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                            <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                          </svg>
                        </div>
                        {watched && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-2.5 h-2.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            watched
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {video.episodeNumber}
                          </span>
                          <p className={`font-medium text-sm truncate ${
                            watched ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
                          }`}>
                            {video.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-8">
                          <span className="text-[var(--text-muted)] text-xs">
                            난이도 {'★'.repeat(video.difficulty)}{'☆'.repeat(5 - video.difficulty)}
                          </span>
                          {viewCount > 0 && (
                            <span className="text-[var(--text-muted)] text-xs">
                              {viewCount}회 시청
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  )
                })}

                {/* Play / Continue button */}
                {(() => {
                  const allIds = seriesEpisodes.map((v) => v.id)
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
                        if (isComplete) {
                          if (seriesEpisodes[0]) {
                            router.push(`/?v=${seriesEpisodes[0].id}&series=${selectedSeries.id}`)
                          }
                        } else if (nextId) {
                          router.push(`/?v=${nextId}&series=${selectedSeries.id}`)
                        } else if (seriesEpisodes[0]) {
                          router.push(`/?v=${seriesEpisodes[0].id}&series=${selectedSeries.id}`)
                        }
                      }}
                      className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold mt-3 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                      </svg>
                      {isComplete
                        ? '처음부터 다시보기'
                        : hasProgress
                          ? '이어보기'
                          : '처음부터 재생'}
                    </motion.button>
                  )
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Series Grid (when no series selected) */}
        {!selectedSeries && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">
                {activeCategory === 'all' ? '시리즈 모아보기' : `${categoryLabels[activeCategory as CategoryId] ?? ''} 시리즈`}
              </h2>
              <span className="text-[var(--text-muted)] text-sm">{filteredSeries.length}개</span>
            </div>

            {filteredSeries.length > 0 ? (
              <LayoutGroup>
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {filteredSeries.map((s) => {
                      const progress = getSeriesProgress(s.id, s.episodeCount)
                      const firstVideo = getVideosBySeries(s.id)[0]
                      const catLabel = categoryLabels[s.category] ?? s.category

                      return (
                        <motion.button
                          key={s.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.3, type: 'spring', bounce: 0.15 },
                          }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedSeries(s)}
                          className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl overflow-hidden text-left flex flex-col group"
                        >
                          {/* Thumbnail */}
                          <div className="w-full aspect-video relative overflow-hidden">
                            {firstVideo ? (
                              <img
                                src={`https://img.youtube.com/vi/${firstVideo.youtubeId}/mqdefault.jpg`}
                                alt={s.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-[var(--bg-secondary)] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--text-muted)]">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                              </div>
                            )}

                            {/* Gradient overlay at bottom */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                            {/* Episode count badge */}
                            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                              </svg>
                              {s.episodeCount}편
                            </div>

                            {/* Progress indicator if started */}
                            {progress > 0 && progress < 100 && (
                              <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center">
                                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                                  <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                                  <circle
                                    cx="14" cy="14" r="11" fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(progress / 100) * 69.115} 69.115`}
                                  />
                                </svg>
                              </div>
                            )}
                            {progress >= 100 && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Card content */}
                          <div className="p-3 flex flex-col flex-1">
                            <p className="text-[var(--text-primary)] font-semibold text-sm line-clamp-2 leading-snug mb-1.5">
                              {s.title}
                            </p>
                            <p className="text-[var(--text-muted)] text-xs line-clamp-1 mb-2.5">
                              {s.description}
                            </p>

                            {/* Category tag - pushed to bottom */}
                            <div className="mt-auto">
                              <span className="text-[10px] font-medium bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                                {catLabel}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar at very bottom */}
                          <div className="h-1 bg-[var(--bg-secondary)]">
                            <div
                              className="h-full bg-green-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--text-muted)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)] text-sm font-medium">
                  이 카테고리에는 시리즈가 없습니다
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
