'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { categories, type VideoData } from '@/data/seed-videos'

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

export default function WatchHistoryPage() {
  const router = useRouter()
  const { watchRecords, viewCounts, watchedVideoIds, removeRecord, clearAllHistory, clearDeletedFlag } =
    useWatchHistoryStore()
  const [confirmClear, setConfirmClear] = useState(false)

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

  const handleCloseConfirm = () => {
    setConfirmClear(false)
  }

  const handleClearAll = () => {
    clearAllHistory()
    handleCloseConfirm()
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/learning')
  }

  return (
    <div className="h-full overflow-y-auto pb-20 pt-12">
      <div className="px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-[var(--text-secondary)] transition-transform active:scale-90"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                HISTORY
              </p>
              <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">WATCH HISTORY</h1>
            </div>
          </div>

          {totalWatched > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs font-medium text-red-400 transition-transform active:scale-95"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {totalWatched === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-[var(--text-muted)]">No watch history yet.</p>
          </div>
        )}

        {groupedByDate.map((group) => (
          <div key={group.key} className="mb-5 last:mb-0">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {group.label}
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
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
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-[var(--bg-card)] p-3 shadow-[var(--card-shadow)]"
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:text-red-400 active:scale-90"
                        aria-label="Remove history item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
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
        ))}
      </div>

      <AnimatePresence>
        {confirmClear && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseConfirm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onClick={handleCloseConfirm}
            >
              <div
                className="w-full max-w-sm rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Clear watch history?
                </h2>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={handleCloseConfirm}
                    className="flex-1 rounded-xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearAll}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
                  >
                    Clear
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
