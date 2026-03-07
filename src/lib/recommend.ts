import type { VideoData, CategoryId } from '@/data/seed-videos'

interface RecommendOptions {
  /** Record of seriesId -> array of watched videoIds */
  watchedEpisodes?: Record<string, string[]>
  /** Record of videoId -> liked */
  likes?: Record<string, boolean>
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Round-robin interleave from category queues for diversity.
 */
function interleaveByCategory(videos: VideoData[]): VideoData[] {
  const byCategory = new Map<string, VideoData[]>()
  for (const v of videos) {
    const list = byCategory.get(v.category) ?? []
    list.push(v)
    byCategory.set(v.category, list)
  }

  const result: VideoData[] = []
  const categoryQueues = [...byCategory.values()]
  let idx = 0
  while (result.length < videos.length) {
    const queue = categoryQueues[idx % categoryQueues.length]
    if (queue.length > 0) {
      result.push(queue.shift()!)
    }
    idx++
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
 * Smart recommendation that considers watch history and likes.
 * - Prioritizes unwatched videos
 * - Boosts categories the user has liked
 * - Maintains category diversity via round-robin
 * - Falls back to simple diversity shuffle when no user data
 */
export function recommendVideos(
  videos: VideoData[],
  options: RecommendOptions = {}
): VideoData[] {
  const { watchedEpisodes = {}, likes = {} } = options

  // Build a set of all watched video IDs across all series
  const watchedIds = new Set<string>()
  for (const ids of Object.values(watchedEpisodes)) {
    for (const id of ids) {
      watchedIds.add(id)
    }
  }

  // Determine liked categories for boosting
  const likedVideoIds = new Set(Object.keys(likes))
  const likedCategories = new Map<CategoryId, number>()
  for (const v of videos) {
    if (likedVideoIds.has(v.id)) {
      likedCategories.set(
        v.category,
        (likedCategories.get(v.category) ?? 0) + 1
      )
    }
  }

  // Split into unwatched and watched
  const unwatched: VideoData[] = []
  const watched: VideoData[] = []
  for (const v of videos) {
    if (watchedIds.has(v.id)) {
      watched.push(v)
    } else {
      unwatched.push(v)
    }
  }

  // Sort unwatched: boost liked categories to the front
  if (likedCategories.size > 0) {
    // Separate into boosted (from liked categories) and normal
    const boosted: VideoData[] = []
    const normal: VideoData[] = []
    for (const v of unwatched) {
      if (likedCategories.has(v.category)) {
        boosted.push(v)
      } else {
        normal.push(v)
      }
    }
    // Interleave each group with category diversity, then combine
    const diverseBoosted = interleaveByCategory(shuffle([...boosted]))
    const diverseNormal = interleaveByCategory(shuffle([...normal]))
    const diverseWatched = interleaveByCategory(shuffle([...watched]))
    return [...diverseBoosted, ...diverseNormal, ...diverseWatched]
  }

  // No like data: simple diversity shuffle, unwatched first
  const diverseUnwatched = interleaveByCategory(shuffle([...unwatched]))
  const diverseWatched = interleaveByCategory(shuffle([...watched]))
  return [...diverseUnwatched, ...diverseWatched]
}

/**
 * Find video index by ID, for deep linking (?v=videoId).
 */
export function findVideoIndex(videos: VideoData[], videoId: string): number {
  const idx = videos.indexOf(videos.find(v => v.id === videoId)!)
  return idx >= 0 ? idx : 0
}
