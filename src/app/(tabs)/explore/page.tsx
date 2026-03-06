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

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all')
  const [selectedSeries, setSelectedSeries] = useState<SeriesType | null>(null)
  const router = useRouter()

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
        <h1 className="text-white text-2xl font-bold mb-4">탐색</h1>

        <SearchBar />

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveCategory('all'); setSelectedSeries(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-400'
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
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Series section */}
        {!selectedSeries && filteredSeries.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-bold text-lg mb-3">시리즈 몰아보기</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {filteredSeries.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeries(s)}
                  className="flex-shrink-0 w-40 bg-white/5 border border-white/10 rounded-xl p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white font-bold text-lg mb-2">
                    {s.title.charAt(0)}
                  </div>
                  <p className="text-white font-medium text-sm line-clamp-2">{s.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{s.episodeCount}편</p>
                </button>
              ))}
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

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {selectedSeries.title.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{selectedSeries.title}</h2>
                    <p className="text-gray-400 text-sm mt-1">{selectedSeries.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        {categories.find(c => c.id === selectedSeries.category)?.label}
                      </span>
                      <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                        {selectedSeries.episodeCount}편
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Episode list */}
              <div className="flex flex-col gap-3">
                {seriesEpisodes.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => router.push(`/?v=${video.id}`)}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-left flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                      {video.episodeNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{video.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        난이도 {'★'.repeat(video.difficulty)}{'☆'.repeat(5 - video.difficulty)}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 flex-shrink-0">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}

                {/* Play all button */}
                <button
                  onClick={() => {
                    if (seriesEpisodes[0]) {
                      router.push(`/?v=${seriesEpisodes[0].id}`)
                    }
                  }}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium mt-2"
                >
                  처음부터 재생
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All videos grid (when no series selected) */}
        {!selectedSeries && (
          <>
            <h2 className="text-white font-bold text-lg mb-3">전체 영상</h2>
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
