'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { VideoFeed } from '@/components/VideoFeed'
import { catalogVideos } from '@/lib/catalog'
import { recommendVideos, seriesPlaylist } from '@/lib/recommend'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

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

function ShortsFeedContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const seriesId = searchParams.get('series')
  const seekTime = searchParams.get('t')
  const reviewPhraseId = searchParams.get('phraseId')
  const navigationKey =
    buildShortsUrl(videoId, seriesId) +
    (seekTime ? `&t=${seekTime}` : '') +
    (reviewPhraseId ? `&phraseId=${reviewPhraseId}` : '')

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

    if (seriesId && videoId) {
      return seriesPlaylist(seriesId, videoId, options)
    }

    if (videoId) {
      const target = catalogVideos.find((video) => video.id === videoId)
      if (target) {
        const rest = catalogVideos.filter((video) => video.id !== videoId)
        return [
          target,
          ...recommendVideos(rest, {
            ...options,
            seedVideo: target,
          }),
        ]
      }
    }

    return recommendVideos(catalogVideos, options)
  }, [videoId, seriesId, recommendationSnapshot])

  return (
    <VideoFeed
      key={navigationKey}
      videos={recommended}
      initialVideoId={videoId ?? undefined}
      initialSeekTime={seekTime ? parseFloat(seekTime) : undefined}
      initialReviewPhraseId={reviewPhraseId ?? undefined}
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
