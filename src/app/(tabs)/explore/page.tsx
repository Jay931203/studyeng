'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  seedVideos,
  series,
  categories,
  getVideosBySeries,
  getSeriesByCategory,
  type CategoryId,
  type Series as SeriesType,
} from '@/data/seed-videos'
import { VideoCard } from '@/components/VideoCard'
import { SearchBar } from '@/components/SearchBar'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all')
  const [selectedSeries, setSelectedSeries] = useState<SeriesType | null>(null)
  const router = useRouter()
  const { getSeriesProgress, getNextEpisode, isWatched } = useWatchHistoryStore()

  const filteredSeries =
    activeCategory === 'all'
      ? series
      : getSeriesByCategory(activeCategory as CategoryId)

  const filteredVideos =
    activeCategory === 'all'
      ? seedVideos
      : seedVideos.filter((v) => v.category === activeCategory)

  const seriesEpisodes = selectedSeries
    ? getVideosBySeries(selectedSeries.id)
    : []

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-4">탐색</h1>

        <SearchBar />

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveCategory('all'); setSelectedSeries(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelectedSeries(null) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Series section */}
        {!selectedSeries && filteredSeries.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-3">시리즈 몰아보기</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {filteredSeries.map((s) => {
                const progress = getSeriesProgress(s.id, s.episodeCount)
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeries(s)}
                    className="flex-shrink-0 w-40 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-4 pb-0 text-left overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-[var(--text-primary)] font-bold text-lg mb-2">
                      {s.title.charAt(0)}
                    </div>
                    <p className="text-[var(--text-primary)] font-medium text-sm line-clamp-2">{s.title}</p>
                    <p className="text-[var(--text-muted)] text-xs mt-1 mb-4">{s.episodeCount}편</p>
                    {/* Progress bar */}
                    <div className="h-1 -mx-4 bg-[var(--bg-secondary)]">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Series detail view */}
        <AnimatePresence mode="wait">
          {selectedSeries && (
            <motion.div
              key={selectedSeries.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                onClick={() => setSelectedSeries(null)}
                className="text-blue-400 text-sm mb-4 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                뒤로
              </button>

              <div className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-[var(--text-primary)] font-bold text-xl flex-shrink-0">
                    {selectedSeries.title.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-[var(--text-primary)] font-bold text-lg">{selectedSeries.title}</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{selectedSeries.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        {categories.find(c => c.id === selectedSeries.category)?.label}
                      </span>
                      <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                        {selectedSeries.episodeCount}편
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Episode list */}
              <div className="flex flex-col gap-3">
                {seriesEpisodes.map((video) => {
                  const watched = selectedSeries ? isWatched(selectedSeries.id, video.id) : false
                  return (
                    <button
                      key={video.id}
                      onClick={() => router.push(`/?v=${video.id}`)}
                      className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-4 text-left flex items-center gap-4"
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          watched
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {video.episodeNumber}
                        </div>
                        {watched && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          watched ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
                        }`}>{video.title}</p>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">
                          난이도 {'★'.repeat(video.difficulty)}{'☆'.repeat(5 - video.difficulty)}
                        </p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
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
                    <button
                      onClick={() => {
                        if (isComplete) {
                          // All watched - start from beginning
                          if (seriesEpisodes[0]) {
                            router.push(`/?v=${seriesEpisodes[0].id}`)
                          }
                        } else if (nextId) {
                          router.push(`/?v=${nextId}`)
                        } else if (seriesEpisodes[0]) {
                          router.push(`/?v=${seriesEpisodes[0].id}`)
                        }
                      }}
                      className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium mt-2"
                    >
                      {isComplete
                        ? '처음부터 다시보기'
                        : hasProgress
                          ? '이어보기'
                          : '처음부터 재생'}
                    </button>
                  )
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All videos grid (when no series selected) */}
        {!selectedSeries && (
          <>
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-3">전체 영상</h2>
            <div className="grid grid-cols-2 gap-3">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => router.push(`/?v=${video.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
