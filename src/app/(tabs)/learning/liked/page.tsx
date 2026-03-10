'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LearningFeedFilter,
  type LearningFeedFilterValue,
} from '@/components/LearningFeedFilter'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { categories } from '@/data/seed-videos'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { createHiddenVideoIdSet, filterHiddenVideos } from '@/lib/videoVisibility'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore } from '@/stores/useAdminStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.id, category.label]),
) as Record<string, string>

export default function LikedPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<LearningFeedFilterValue>('all')
  const likes = useLikeStore((s) => s.likes)
  const toggleLike = useLikeStore((s) => s.toggleLike)
  const clearDeletedFlag = useWatchHistoryStore((s) => s.clearDeletedFlag)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])

  const likedVideos = useMemo(
    () =>
      filterHiddenVideos(
        Object.keys(likes)
          .map((id) => getCatalogVideoById(id))
          .filter(Boolean) as NonNullable<ReturnType<typeof getCatalogVideoById>>[],
        hiddenVideoIdSet,
      ),
    [hiddenVideoIdSet, likes],
  )
  const filteredVideos = useMemo(
    () =>
      likedVideos.filter((video) => {
        if (filter === 'all') return true
        if (filter === 'shorts') return video.format === 'shorts'
        return video.format !== 'shorts'
      }),
    [filter, likedVideos],
  )

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/learning')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
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
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            LIKED
          </p>
        </div>

        <SurfaceCard className="p-5">
          {likedVideos.length > 0 && <LearningFeedFilter value={filter} onChange={setFilter} />}

          {filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-[var(--text-muted)]">
                {likedVideos.length === 0 ? 'No liked videos yet.' : `No ${filter} likes yet.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {filteredVideos.map((video) => {
                  const categoryLabel = categoryLabels[video.category] ?? ''
                  const seriesTitle = video.seriesId
                    ? getCatalogSeriesById(video.seriesId)?.title
                    : null

                  return (
                    <motion.div
                      key={video.id}
                      layout
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
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
                            <span className="text-[10px] text-[var(--text-muted)]">&middot;</span>
                            <span className="text-xs text-[var(--text-muted)]">Lv.{video.difficulty}</span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => toggleLike(video.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition-all active:scale-90"
                        aria-label="Unlike"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
                        </svg>
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
