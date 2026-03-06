'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { VideoFeed } from '@/components/VideoFeed'
import { seedVideos } from '@/data/seed-videos'
import { recommendVideos } from '@/lib/recommend'

function FeedContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')

  const recommended = useMemo(() => {
    if (videoId) {
      const target = seedVideos.find(v => v.id === videoId)
      if (target) {
        const rest = seedVideos.filter(v => v.id !== videoId)
        return [target, ...recommendVideos(rest)]
      }
    }
    return recommendVideos(seedVideos)
  }, [videoId])

  return <VideoFeed videos={recommended} />
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="h-full bg-black" />}>
      <FeedContent />
    </Suspense>
  )
}
