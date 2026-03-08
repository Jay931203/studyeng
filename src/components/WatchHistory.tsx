'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  const { watchRecords, viewCounts, watchedVideoIds, removeRecord, clearDeletedFlag } = useWatchHistoryStore()

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

  // Show only first 3 items in compact view
  const allItems = groupedByDate.flatMap((g) =>
    g.videos.map((v) => ({ ...v, dateLabel: g.label, dateKey: g.key }))
  )
  const displayItems = allItems.slice(0, 5)

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
          {totalWatched > 0 && (
            <span className="text-[var(--text-muted)] text-xs">
              {totalWatched}개
            </span>
          )}
        </div>
        {totalWatched > 5 && (
          <Link
            href="/learning/history"
            className="text-[var(--text-secondary)] text-xs"
          >
            전체보기
          </Link>
        )}
      </div>

      {totalWatched === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">시청 기록이 없습니다</p>
        </div>
      ) : (
        displayGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="text-[var(--text-muted)] text-[11px] font-medium mb-2 tracking-wide uppercase">
              {group.label}
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {group.videos.map((video) => {
                  const count = viewCounts[video.id] ?? 0
                  const categoryLabel =
                    categories.find((c) => c.id === video.category)?.label ?? ''

                  return (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.25 }}
                      className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl p-3 flex items-center gap-3 border border-[var(--border-card)]"
                    >
                      <button
                        onClick={() => { clearDeletedFlag(video.id); router.push(`/shorts?v=${video.id}`) }}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
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
                            <span className="text-[var(--text-muted)] text-xs">{categoryLabel}</span>
                            <span className="text-[var(--text-muted)] text-[10px]">·</span>
                            <span className="text-[var(--text-muted)] text-xs">Lv.{video.difficulty}</span>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => removeRecord(video.id)}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 active:scale-90 transition-all rounded-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
