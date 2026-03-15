'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoFeed } from '@/components/VideoFeed'
import { catalogVideos } from '@/lib/catalog'
import { getLevelAwareCandidateVideos, recommendVideos, seriesPlaylist } from '@/lib/recommend'
import { createHiddenVideoIdSet, filterHiddenVideos } from '@/lib/videoVisibility'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore } from '@/stores/useAdminStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

export type FeedMode = 'clips' | 'shorts'

function cloneWatchedEpisodes(watchedEpisodes: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(watchedEpisodes).map(([seriesId, videoIds]) => [seriesId, [...videoIds]]),
  )
}

function cloneVideoSignals(
  videoSignals: ReturnType<typeof useRecommendationStore.getState>['videoSignals'],
) {
  return Object.fromEntries(
    Object.entries(videoSignals).map(([videoId, signal]) => [videoId, { ...signal }]),
  )
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function ShortsFeedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])
  const videoId = searchParams.get('v')
  const seriesId = searchParams.get('series')
  const playlistMode = searchParams.get('playlist') === 'series'
  const seekTime = searchParams.get('t')
  const reviewPhraseId = searchParams.get('phraseId')
  const feedParam = searchParams.get('feed')
  const feedMode: FeedMode = feedParam === 'shorts' ? 'shorts' : 'clips'
  const setPlaybackOrderMode = usePlayerStore((state) => state.setPlaybackOrderMode)

  const entryPlaybackOrderMode =
    feedMode === 'shorts' ? 'shuffle' : playlistMode && seriesId && videoId ? 'sequence' : 'shuffle'

  const navigationKey =
    buildShortsUrl(videoId, seriesId, { seriesPlayback: playlistMode }) +
    (feedParam ? `&feed=${feedParam}` : '') +
    (seekTime ? `&t=${seekTime}` : '') +
    (reviewPhraseId ? `&phraseId=${reviewPhraseId}` : '')

  useEffect(() => {
    setPlaybackOrderMode(entryPlaybackOrderMode)
  }, [entryPlaybackOrderMode, feedMode, playlistMode, seriesId, setPlaybackOrderMode, videoId])

  const feedVideos = useMemo(() => {
    const baseVideos =
      feedMode === 'shorts'
        ? catalogVideos.filter((video) => video.format === 'shorts')
        : catalogVideos.filter((video) => video.format !== 'shorts')

    return filterHiddenVideos(baseVideos, hiddenVideoIdSet)
  }, [feedMode, hiddenVideoIdSet])

  const recommendationSnapshot = useMemo(() => {
    void navigationKey
    const { watchedEpisodes, watchRecords, viewCounts, completionCounts } =
      useWatchHistoryStore.getState()
    const { likes } = useLikeStore.getState()
    const { interests, level } = useOnboardingStore.getState()
    const { phrases } = usePhraseStore.getState()
    const { recentVideoIds, videoSignals } = useRecommendationStore.getState()

    return {
      watchedEpisodes: cloneWatchedEpisodes(watchedEpisodes),
      watchRecords: watchRecords.map((record) => ({ ...record })),
      viewCounts: { ...viewCounts },
      completionCounts: { ...completionCounts },
      likes: { ...likes },
      interests: [...interests],
      level,
      phrases: phrases.map((phrase) => ({
        videoId: phrase.videoId,
        videoTitle: phrase.videoTitle,
        en: phrase.en,
        savedAt: phrase.savedAt,
        reviewCount: phrase.reviewCount,
      })),
      recentVideoIds: [...recentVideoIds],
      videoSignals: cloneVideoSignals(videoSignals),
    }
  }, [navigationKey])

  const recommended = useMemo(() => {
    const options = recommendationSnapshot
    const levelAwareFeedVideos = getLevelAwareCandidateVideos(feedVideos, options.level, {
      minimumPoolSize: feedMode === 'shorts' ? 24 : 30,
      nearbyPoolRatio: 0.2,
      minimumNearbyCount: feedMode === 'shorts' ? 5 : 6,
    })

    if (feedMode === 'shorts') {
      if (videoId && !hiddenVideoIdSet.has(videoId)) {
        const target = feedVideos.find((video) => video.id === videoId)
        if (target) {
          const rest = levelAwareFeedVideos.filter((video) => video.id !== videoId)
          return [target, ...shuffleArray(rest)]
        }
      }

      return shuffleArray(levelAwareFeedVideos)
    }

    if (playlistMode && seriesId && videoId) {
      return filterHiddenVideos(seriesPlaylist(seriesId, videoId, options), hiddenVideoIdSet)
    }

    if (videoId && !hiddenVideoIdSet.has(videoId)) {
      const target = feedVideos.find((video) => video.id === videoId)
      if (target) {
        const rest = levelAwareFeedVideos.filter((video) => video.id !== videoId)
        return filterHiddenVideos(
          [
            target,
            ...recommendVideos(rest, {
              ...options,
              seedVideo: target,
            }),
          ],
          hiddenVideoIdSet,
        )
      }
    }

    return filterHiddenVideos(recommendVideos(levelAwareFeedVideos, options), hiddenVideoIdSet)
  }, [feedMode, feedVideos, hiddenVideoIdSet, playlistMode, recommendationSnapshot, seriesId, videoId])

  useEffect(() => {
    if (!videoId || !hiddenVideoIdSet.has(videoId)) return

    const fallback = recommended[0]
    const baseUrl = buildShortsUrl(fallback?.id, fallback?.seriesId, {
      seriesPlayback: playlistMode,
    })
    const nextUrl =
      feedMode === 'shorts'
        ? baseUrl.includes('?')
          ? `${baseUrl}&feed=shorts`
          : `${baseUrl}?feed=shorts`
        : baseUrl

    router.replace(nextUrl, { scroll: false })
  }, [feedMode, hiddenVideoIdSet, playlistMode, recommended, router, videoId])

  return (
    <VideoFeed
      key={navigationKey}
      videos={recommended}
      initialVideoId={videoId ?? undefined}
      initialSeekTime={seekTime ? parseFloat(seekTime) : undefined}
      initialReviewPhraseId={reviewPhraseId ?? undefined}
      feedMode={feedMode}
    />
  )
}

export function ShortsFeedPage() {
  return (
    <Suspense fallback={<div className="h-full bg-[var(--player-surface)]" />}>
      <ShortsFeedContent />
    </Suspense>
  )
}
