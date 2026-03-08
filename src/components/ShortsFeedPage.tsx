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

function ShortsFeedContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const seriesId = searchParams.get('series')
  const watchedEpisodes = useWatchHistoryStore((state) => state.watchedEpisodes)
  const likes = useLikeStore((state) => state.likes)
  const interests = useOnboardingStore((state) => state.interests)
  const level = useOnboardingStore((state) => state.level)

  const recommended = useMemo(() => {
    const options = { watchedEpisodes, likes, interests, level }

    if (seriesId && videoId) {
      return seriesPlaylist(seriesId, videoId, options)
    }

    if (videoId) {
      const target = seedVideos.find((video) => video.id === videoId)
      if (target) {
        const rest = seedVideos.filter((video) => video.id !== videoId)
        return [target, ...recommendVideos(rest, options)]
      }
    }

    return recommendVideos(seedVideos, options)
  }, [videoId, seriesId, watchedEpisodes, likes, interests, level])

  return (
    <VideoFeed
      videos={recommended}
      initialVideoId={videoId ?? undefined}
      navigationKey={buildShortsUrl(videoId, seriesId)}
    />
  )
}

export function ShortsFeedPage() {
  return (
    <Suspense fallback={<div className="h-full bg-black" />}>
      <ShortsFeedContent />
    </Suspense>
  )
}
