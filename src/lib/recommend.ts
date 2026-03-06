import type { VideoData } from '@/data/seed-videos'

/**
 * Simple recommendation shuffle that ensures category diversity.
 * Spreads categories evenly so users see variety in the feed.
 */
export function recommendVideos(videos: VideoData[]): VideoData[] {
  // Group by category
  const byCategory = new Map<string, VideoData[]>()
  for (const v of videos) {
    const list = byCategory.get(v.category) ?? []
    list.push(v)
    byCategory.set(v.category, list)
  }

  // Shuffle within each category
  for (const list of byCategory.values()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
  }

  // Round-robin pick from each category for diversity
  const result: VideoData[] = []
  const categoryQueues = [...byCategory.values()]
  let idx = 0
  while (result.length < videos.length) {
    const queue = categoryQueues[idx % categoryQueues.length]
    if (queue.length > 0) {
      result.push(queue.shift()!)
    }
    idx++
    // Remove empty queues
    if (idx % categoryQueues.length === 0) {
      for (let i = categoryQueues.length - 1; i >= 0; i--) {
        if (categoryQueues[i].length === 0) categoryQueues.splice(i, 1)
      }
      if (categoryQueues.length === 0) break
      idx = 0
    }
  }

  return result
}

/**
 * Find video index by ID, for deep linking (?v=videoId).
 */
export function findVideoIndex(videos: VideoData[], videoId: string): number {
  const idx = videos.indexOf(videos.find(v => v.id === videoId)!)
  return idx >= 0 ? idx : 0
}
