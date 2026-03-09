'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { SurfaceCard } from '@/components/ui/AppPage'
import { categories, type VideoData } from '@/data/seed-videos'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.id, category.label]),
) as Record<string, string>

function formatDateLabel(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'TODAY'
  if (diffDays === 1) return 'YESTERDAY'
  if (diffDays < 7) return `${diffDays} DAYS AGO`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getDateKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function WatchHistory() {
  const router = useRouter()
  const { watchRecords, viewCounts, watchedVideoIds, removeRecord, clearDeletedFlag } =
    useWatchHistoryStore()

  const groupedByDate = useMemo(() => {
    const records =
      watchRecords.length > 0
        ? watchRecords
        : watchedVideoIds.map((id) => ({ videoId: id, watchedAt: 0 }))

    const groups: { label: string; key: string; videos: VideoData[] }[] = []
    const seen = new Map<string, Set<string>>()

    for (const record of records) {
      const video = getCatalogVideoById(record.videoId)
      if (!video) continue

      const dateKey = record.watchedAt > 0 ? getDateKey(record.watchedAt) : 'unknown'
      if (!seen.has(dateKey)) {
        seen.set(dateKey, new Set())
        groups.push({
          label: record.watchedAt > 0 ? formatDateLabel(record.watchedAt) : 'EARLIER',
          key: dateKey,
          videos: [],
        })
      }

      const dateSet = seen.get(dateKey)
      if (!dateSet || dateSet.has(video.id)) continue

      dateSet.add(video.id)
      const group = groups.find((item) => item.key === dateKey)
      group?.videos.push(video)
    }

    return groups
  }, [watchRecords, watchedVideoIds])

  const totalWatched = groupedByDate.reduce((sum, group) => sum + group.videos.length, 0)
  const allItems = groupedByDate.flatMap((group) =>
    group.videos.map((video) => ({ ...video, dateLabel: group.label })),
  )
  const displayItems = allItems.slice(0, 5)

  const displayGroups: { label: string; videos: VideoData[] }[] = []
  for (const item of displayItems) {
    const existing = displayGroups.find((group) => group.label === item.dateLabel)
    if (existing) {
      existing.videos.push(item)
    } else {
      displayGroups.push({ label: item.dateLabel, videos: [item] })
    }
  }

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
          HISTORY
        </p>
        {totalWatched > 5 && (
          <Link
            href="/learning/history"
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            VIEW ALL
          </Link>
        )}
      </div>

      {totalWatched === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No watch history yet.</p>
        </div>
      ) : (
        displayGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {group.videos.map((video) => {
                  const count = viewCounts[video.id] ?? 0
                  const categoryLabel = categoryLabels[video.category] ?? ''
                  const seriesTitle = video.seriesId
                    ? getCatalogSeriesById(video.seriesId)?.title
                    : null

                  return (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 shadow-[var(--card-shadow)]"
                    >
                      <button
                        onClick={() => {
                          clearDeletedFlag(video.id)
                          router.push(buildShortsUrl(video.id, video.seriesId))
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                            alt={video.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                          {count > 1 && (
                            <div className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">
                              x{count > 99 ? '99+' : count}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {video.title}
                          </p>
                          {seriesTitle && (
                            <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                              {seriesTitle}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-xs text-[var(--text-muted)]">{categoryLabel}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">·</span>
                            <span className="text-xs text-[var(--text-muted)]">Lv.{video.difficulty}</span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => removeRecord(video.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:text-red-400 active:scale-90"
                        aria-label="Remove history item"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
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
    </SurfaceCard>
  )
}
