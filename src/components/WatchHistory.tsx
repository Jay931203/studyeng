'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { seedVideos, categories } from '@/data/seed-videos'

function formatDateLabel(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function WatchHistory() {
  const router = useRouter()
  const { watchRecords, viewCounts, watchedVideoIds } = useWatchHistoryStore()
  const [showAll, setShowAll] = useState(false)

  // Group by date (descending), deduplicate per date
  const groupedByDate = useMemo(() => {
    const records = watchRecords.length > 0
      ? watchRecords
      : watchedVideoIds.map((id) => ({ videoId: id, watchedAt: 0 }))

    const groups: { label: string; key: string; videos: typeof seedVideos }[] = []
    const seen = new Map<string, Set<string>>()

    for (const record of records) {
      const video = seedVideos.find((v) => v.id === record.videoId)
      if (!video) continue

      const dateKey = record.watchedAt > 0 ? getDateKey(record.watchedAt) : 'unknown'
      if (!seen.has(dateKey)) {
        seen.set(dateKey, new Set())
        groups.push({
          label: record.watchedAt > 0 ? formatDateLabel(record.watchedAt) : '이전',
          key: dateKey,
          videos: [],
        })
      }
      const dateSet = seen.get(dateKey)!
      if (!dateSet.has(video.id)) {
        dateSet.add(video.id)
        const group = groups.find((g) => g.key === dateKey)!
        group.videos.push(video)
      }
    }

    return groups
  }, [watchRecords, watchedVideoIds])

  const totalWatched = groupedByDate.reduce((sum, g) => sum + g.videos.length, 0)
  if (totalWatched === 0) return null

  // Flatten for showAll/collapse logic
  const allItems = groupedByDate.flatMap((g) =>
    g.videos.map((v) => ({ ...v, dateLabel: g.label, dateKey: g.key }))
  )
  const displayItems = showAll ? allItems : allItems.slice(0, 3)

  // Group displayed items by date for rendering
  const displayGroups: { label: string; videos: typeof seedVideos }[] = []
  for (const item of displayItems) {
    const existing = displayGroups.find((g) => g.label === item.dateLabel)
    if (existing) {
      existing.videos.push(item)
    } else {
      displayGroups.push({ label: item.dateLabel, videos: [item] })
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[var(--text-primary)] font-semibold text-base">
            시청 기록
          </h2>
          <span className="text-[var(--text-muted)] text-xs">
            {totalWatched}개
          </span>
        </div>
        {totalWatched > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[var(--text-secondary)] text-xs"
          >
            {showAll ? '접기' : '전체보기'}
          </button>
        )}
      </div>

      {displayGroups.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          <p className="text-[var(--text-muted)] text-[11px] font-medium mb-2 tracking-wide uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-2">
            {group.videos.map((video) => {
              const count = viewCounts[video.id] ?? 0
              const categoryLabel =
                categories.find((c) => c.id === video.category)?.label ?? ''

              return (
                <motion.button
                  key={video.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/?v=${video.id}`)}
                  className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl p-3 text-left flex items-center gap-3 border border-white/[0.04]"
                >
                  <div className="w-20 h-12 flex-shrink-0 rounded-xl overflow-hidden relative">
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
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[var(--text-muted)] text-xs">
                        {categoryLabel}
                      </span>
                      <span className="text-[var(--text-muted)] text-[10px]">
                        {'·'}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs">
                        Lv.{video.difficulty}
                      </span>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
