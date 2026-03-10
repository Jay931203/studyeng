'use client'

import { Suspense, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoFeed } from '@/components/VideoFeed'
import { catalogVideos } from '@/lib/catalog'
import { recommendVideos, seriesPlaylist } from '@/lib/recommend'
import { buildShortsUrl } from '@/lib/videoRoutes'
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

/** Shuffle an array using Fisher-Yates */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function ShortsFeedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const seriesId = searchParams.get('series')
  const seekTime = searchParams.get('t')
  const reviewPhraseId = searchParams.get('phraseId')
  const feedParam = searchParams.get('feed')
  const feedMode: FeedMode = feedParam === 'shorts' ? 'shorts' : 'clips'
  const setPlaybackOrderMode = usePlayerStore((state) => state.setPlaybackOrderMode)

  // Shorts mode always uses shuffle; clips uses sequence when entering via series link
  const entryPlaybackOrderMode =
    feedMode === 'shorts' ? 'shuffle' : seriesId && videoId ? 'sequence' : 'shuffle'

  const navigationKey =
    buildShortsUrl(videoId, seriesId) +
    (feedParam ? `&feed=${feedParam}` : '') +
    (seekTime ? `&t=${seekTime}` : '') +
    (reviewPhraseId ? `&phraseId=${reviewPhraseId}` : '')

  useEffect(() => {
    setPlaybackOrderMode(entryPlaybackOrderMode)
  }, [entryPlaybackOrderMode, setPlaybackOrderMode, seriesId, videoId, feedMode])

  // Filter catalog videos based on feed mode
  const feedVideos = useMemo(() => {
    if (feedMode === 'shorts') {
      return catalogVideos.filter((video) => video.format === 'shorts')
    }
    // Clips mode: everything that is NOT shorts
    return catalogVideos.filter((video) => video.format !== 'shorts')
  }, [feedMode])

  // Freeze the recommendation inputs for the current route so that
  // watch-history or like updates inside the player do not reshuffle
  // the active shorts feed mid-session.
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

    // Shorts mode: simple shuffle of all shorts videos
    if (feedMode === 'shorts') {
      if (videoId) {
        const target = feedVideos.find((video) => video.id === videoId)
        if (target) {
          const rest = feedVideos.filter((video) => video.id !== videoId)
          return [target, ...shuffleArray(rest)]
        }
      }
      return shuffleArray(feedVideos)
    }

    // Clips mode: use existing recommendation logic
    if (seriesId && videoId) {
      return seriesPlaylist(seriesId, videoId, options)
    }

    if (videoId) {
      const target = feedVideos.find((video) => video.id === videoId)
      if (target) {
        const rest = feedVideos.filter((video) => video.id !== videoId)
        return [
          target,
          ...recommendVideos(rest, {
            ...options,
            seedVideo: target,
          }),
        ]
      }
    }

    return recommendVideos(feedVideos, options)
  }, [videoId, seriesId, feedMode, feedVideos, recommendationSnapshot])

  const handleFeedModeChange = useCallback(
    (nextMode: FeedMode) => {
      if (nextMode === feedMode) return
      router.push(nextMode === 'shorts' ? '/shorts?feed=shorts' : '/shorts', {
        scroll: false,
      })
    },
    [feedMode, router],
  )

  return (
    <VideoFeed
      key={navigationKey}
      videos={recommended}
      initialVideoId={videoId ?? undefined}
      initialSeekTime={seekTime ? parseFloat(seekTime) : undefined}
      initialReviewPhraseId={reviewPhraseId ?? undefined}
      feedMode={feedMode}
      onFeedModeChange={handleFeedModeChange}
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
