'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function WatchHistoryPage() {
  const router = useRouter()
  const { watchRecords, viewCounts, watchedVideoIds, removeRecord, clearAllHistory, clearDeletedFlag } = useWatchHistoryStore()
  const [confirmClear, setConfirmClear] = useState(false)

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

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-[var(--text-secondary)] active:scale-90 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-[var(--text-primary)] text-xl font-bold">시청 기록</h1>
              <p className="text-[var(--text-muted)] text-xs">{totalWatched}개 영상</p>
            </div>
          </div>
          {totalWatched > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-red-400/70 text-xs active:scale-95 transition-transform"
            >
              전체 삭제
            </button>
          )}
        </div>

        {/* Clear confirmation */}
        <AnimatePresence>
          {confirmClear && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4"
            >
              <p className="text-[var(--text-primary)] text-sm mb-3">시청 기록을 전부 삭제할까?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearAllHistory()
                    setConfirmClear(false)
                  }}
                  className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                >
                  삭제
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-sm font-medium active:scale-95 transition-transform"
                >
                  취소
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {totalWatched === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[var(--text-muted)] text-sm">시청 기록 없음</p>
          </div>
        )}

        {/* History list */}
        {groupedByDate.map((group) => (
          <div key={group.key} className="mb-5 last:mb-0">
            <p className="text-[var(--text-muted)] text-[11px] font-medium mb-2 tracking-wide uppercase">
              {group.label}
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {group.videos.map((video) => {
                  const count = viewCounts[video.id] ?? 0
                  const categoryLabel = categories.find((c) => c.id === video.category)?.label ?? ''

                  return (
                    <motion.div
                      key={video.id}
                      layout
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                      className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl p-3 flex items-center gap-3 border border-white/[0.04]"
                    >
                      <button
                        onClick={() => { clearDeletedFlag(video.id); router.push(`/?v=${video.id}`) }}
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

                      {/* Delete button */}
                      <button
                        onClick={() => removeRecord(video.id)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 active:scale-90 transition-all rounded-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
    </div>
  )
}
