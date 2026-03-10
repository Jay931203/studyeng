'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import {
  getCollectionById,
  getCollectionDetail,
  getCollectionGroups,
  type CollectionDetail as CollectionDetailType,
  type CollectionSentence,
} from '@/lib/collections'
import { getCatalogVideoById } from '@/lib/catalog'
import { createHiddenVideoIdSet } from '@/lib/videoVisibility'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore } from '@/stores/useAdminStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

interface CollectionDetailViewProps {
  collectionId: string
}

interface GroupedVideo {
  videoId: string
  youtubeId: string
  title: string
  sentences: CollectionSentence[]
}

export function CollectionDetailView({ collectionId }: CollectionDetailViewProps) {
  const router = useRouter()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])

  const [detail, setDetail] = useState<CollectionDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const summary = getCollectionById(collectionId)
  const groups = useMemo(() => getCollectionGroups(), [])

  useEffect(() => {
    let cancelled = false

    getCollectionDetail(collectionId).then((result) => {
      if (cancelled) return
      setDetail(result)
      setLoading(false)
      if (!result) setError(true)
    })

    return () => {
      cancelled = true
    }
  }, [collectionId])

  // Group sentences by video for display
  const groupedVideos = useMemo<GroupedVideo[]>(() => {
    if (!detail?.sentences) return []

    const videoMap = new Map<string, CollectionSentence[]>()
    for (const sentence of detail.sentences) {
      const current = videoMap.get(sentence.videoId) ?? []
      current.push(sentence)
      videoMap.set(sentence.videoId, current)
    }

    const result: GroupedVideo[] = []
    for (const [videoId, sentences] of videoMap) {
      if (hiddenVideoIdSet.has(videoId)) continue
      const catalogVideo = getCatalogVideoById(videoId)
      result.push({
        videoId,
        youtubeId: catalogVideo?.youtubeId ?? videoId,
        title: catalogVideo?.title ?? videoId,
        sentences,
      })
    }

    return result
  }, [detail, hiddenVideoIdSet])

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore', { scroll: false })
  }, [router])

  const handleSentenceClick = useCallback(
    (videoId: string, startTime: number) => {
      clearDeletedFlag(videoId)
      const url = buildShortsUrl(videoId)
      router.push(`${url}&t=${Math.floor(startTime)}`, { scroll: false })
    },
    [clearDeletedFlag, router],
  )

  const groupLabel = (() => {
    const groupId = detail?.group ?? summary?.group
    if (!groupId) return null
    return groups.find((g) => g.id === groupId)?.label ?? null
  })()

  const name = detail?.name ?? summary?.name ?? collectionId
  const description = detail?.description ?? summary?.description ?? ''
  const totalSentences = detail?.sentences.length ?? summary?.sentenceCount ?? 0
  const totalVideos = groupedVideos.length || summary?.videoCount || 0

  return (
    <AppPage>
      {/* Back button + eyebrow */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-[var(--text-secondary)] transition-transform active:scale-90"
          aria-label="뒤로"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {groupLabel && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            {groupLabel}
          </p>
        )}
      </div>

      {/* Header card */}
      <SurfaceCard className="mb-6 p-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{name}</h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        )}
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {totalSentences}문장 / {totalVideos}영상
        </p>
      </SurfaceCard>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-shimmer rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, var(--bg-card), var(--bg-secondary), var(--bg-card))',
              }}
            />
          ))}
        </div>
      )}

      {/* Error / empty state */}
      {!loading && error && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            컬렉션 데이터를 불러올 수 없습니다
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            아직 준비 중이거나 네트워크 문제일 수 있습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      )}

      {/* Video sections */}
      {!loading && groupedVideos.length > 0 && (
        <div className="space-y-3">
          {groupedVideos.map((video, videoIndex) => (
            <motion.div
              key={video.videoId}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: videoIndex * 0.06,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                },
              }}
              className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]"
            >
              {/* Video header */}
              <div className="flex items-center gap-3 border-b border-[var(--border-card)] p-3">
                <div className="relative h-[48px] w-[86px] shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    fill
                    sizes="86px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {video.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {video.sentences.length}문장
                  </p>
                </div>
              </div>

              {/* Sentences */}
              <div className="divide-y divide-[var(--border-card)]">
                {video.sentences.map((sentence, sentenceIndex) => (
                  <button
                    key={sentenceIndex}
                    onClick={() => handleSentenceClick(video.videoId, 0)}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]/40"
                  >
                    <p className="text-sm text-[var(--text-primary)]">
                      {sentence.en}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {sentence.ko}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Loaded but no videos */}
      {!loading && !error && groupedVideos.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            이 컬렉션에 아직 영상이 없습니다
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            곧 관련 영상이 추가될 예정입니다.
          </p>
        </div>
      )}
    </AppPage>
  )
}
