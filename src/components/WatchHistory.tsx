'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { seedVideos, categories } from '@/data/seed-videos'

export function WatchHistory() {
  const router = useRouter()
  const { watchedVideoIds, viewCounts } = useWatchHistoryStore()
  const [showAll, setShowAll] = useState(false)

  // Get watched videos in order, matched to seed data
  const watchedVideos = watchedVideoIds
    .map((id) => seedVideos.find((v) => v.id === id))
    .filter(Boolean)

  if (watchedVideos.length === 0) return null

  const displayVideos = showAll ? watchedVideos : watchedVideos.slice(0, 6)

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[var(--text-primary)] font-bold text-lg">
          시청 기록
          <span className="text-[var(--text-muted)] text-sm font-normal ml-2">
            {watchedVideos.length}개
          </span>
        </h2>
        {watchedVideos.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-400 text-sm"
          >
            {showAll ? '접기' : '전체보기'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {displayVideos.map((video) => {
          if (!video) return null
          const count = viewCounts[video.id] ?? 0
          const categoryLabel =
            categories.find((c) => c.id === video.category)?.label ?? ''

          return (
            <button
              key={video.id}
              onClick={() => router.push(`/?v=${video.id}`)}
              className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-3 text-left flex items-center gap-3"
            >
              <div className="w-20 h-12 flex-shrink-0 rounded-lg overflow-hidden relative">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {count > 1 && (
                  <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-bold">
                    x{count > 99 ? '99+' : count}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] font-medium text-sm truncate">
                  {video.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[var(--text-muted)] text-xs">
                    {categoryLabel}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs">
                    {'★'.repeat(video.difficulty)}
                  </span>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-blue-400 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
