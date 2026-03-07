'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { VideoFeed } from '@/components/VideoFeed'
import { seedVideos } from '@/data/seed-videos'
import { recommendVideos, seriesPlaylist } from '@/lib/recommend'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useLikeStore } from '@/stores/useLikeStore'

function FeedContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const seriesId = searchParams.get('series')
  const watchedEpisodes = useWatchHistoryStore((s) => s.watchedEpisodes)
  const likes = useLikeStore((s) => s.likes)

  const recommended = useMemo(() => {
    const options = { watchedEpisodes, likes }
    // Series mode: play series episodes in order, then recommended
    if (seriesId && videoId) {
      return seriesPlaylist(seriesId, videoId, options)
    }
    // Deep link to a specific video: that video first, then recommended
    if (videoId) {
      const target = seedVideos.find(v => v.id === videoId)
      if (target) {
        const rest = seedVideos.filter(v => v.id !== videoId)
        return [target, ...recommendVideos(rest, options)]
      }
    }
    // Default: pure recommendation
    return recommendVideos(seedVideos, options)
  }, [videoId, seriesId, watchedEpisodes, likes])

  return <VideoFeed videos={recommended} />
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="h-full bg-black" />}>
      <FeedContent />
    </Suspense>
  )
}
