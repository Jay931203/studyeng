import { VideoFeed } from '@/components/VideoFeed'
import { seedVideos } from '@/data/seed-videos'

export default function FeedPage() {
  return <VideoFeed videos={seedVideos} />
}
