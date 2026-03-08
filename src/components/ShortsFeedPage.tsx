'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { VideoFeed } from '@/components/VideoFeed'
import { seedVideos } from '@/data/seed-videos'
import { recommendVideos, seriesPlaylist } from '@/lib/recommend'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

function cloneWatchedEpisodes(watchedEpisodes: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(watchedEpisodes).map(([seriesId, videoIds]) => [seriesId, [...videoIds]]),
  )
}

function ShortsFeedContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const seriesId = searchParams.get('series')
  const navigationKey = buildShortsUrl(videoId, seriesId)

  // Freeze the recommendation inputs for the current route so that
  // watch-history or like updates inside the player do not reshuffle
  // the active shorts feed mid-session.
  const recommendationSnapshot = useMemo(() => {
    void navigationKey
    const { watchedEpisodes } = useWatchHistoryStore.getState()
    const { likes } = useLikeStore.getState()
    const { interests, level } = useOnboardingStore.getState()

    return {
      watchedEpisodes: cloneWatchedEpisodes(watchedEpisodes),
      likes: { ...likes },
      interests: [...interests],
      level,
    }
  }, [navigationKey])

  const recommended = useMemo(() => {
    const options = recommendationSnapshot

    if (seriesId && videoId) {
      return seriesPlaylist(seriesId, videoId, options)
    }

    if (videoId) {
      const target = seedVideos.find((video) => video.id === videoId)
      if (target) {
        const rest = seedVideos.filter((video) => video.id !== videoId)
        return [
          target,
          ...recommendVideos(rest, {
            ...options,
            seedVideo: target,
          }),
        ]
      }
    }

    return recommendVideos(seedVideos, options)
  }, [videoId, seriesId, recommendationSnapshot])

  return (
    <VideoFeed
      key={navigationKey}
      videos={recommended}
      initialVideoId={videoId ?? undefined}
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
