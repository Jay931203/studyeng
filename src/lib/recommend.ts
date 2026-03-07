import type { VideoData, CategoryId } from '@/data/seed-videos'
import { getVideosBySeries, seedVideos } from '@/data/seed-videos'

interface RecommendOptions {
  /** Record of seriesId -> array of watched videoIds */
  watchedEpisodes?: Record<string, string[]>
  /** Record of videoId -> liked */
  likes?: Record<string, boolean>
  /** User's preferred categories from onboarding */
  interests?: string[]
  /** User's English proficiency level from onboarding */
  level?: 'beginner' | 'intermediate' | 'advanced'
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
 * Map user level to preferred difficulty ranges.
 * Returns [min, max] inclusive.
 */
function getDifficultyRange(level: 'beginner' | 'intermediate' | 'advanced'): [number, number] {
  switch (level) {
    case 'beginner': return [1, 2]
    case 'intermediate': return [2, 3]
    case 'advanced': return [3, 5]
  }
}

/**
 * Score a video's difficulty fit for the user's level.
 * Returns 0 (perfect fit) to higher values (worse fit).
 */
function difficultyScore(difficulty: number, level?: 'beginner' | 'intermediate' | 'advanced'): number {
  if (!level) return 0
  const [min, max] = getDifficultyRange(level)
  if (difficulty >= min && difficulty <= max) return 0
  // Distance from the preferred range
  return difficulty < min ? min - difficulty : difficulty - max
}

/**
 * Sort videos by difficulty fit, preserving relative order among equally-fit videos.
 */
function sortByDifficulty(videos: VideoData[], level?: 'beginner' | 'intermediate' | 'advanced'): VideoData[] {
  if (!level) return videos
  return [...videos].sort((a, b) => difficultyScore(a.difficulty, level) - difficultyScore(b.difficulty, level))
}

/**
 * Smart recommendation that considers watch history, likes, interests, and level.
 * - Prioritizes unwatched videos
 * - Strongly boosts onboarding interest categories (put them first)
 * - Boosts categories the user has liked
 * - Filters/sorts by difficulty based on user level
 * - Maintains category diversity via round-robin
 * - Falls back to simple diversity shuffle when no user data
 */
export function recommendVideos(
  videos: VideoData[],
  options: RecommendOptions = {}
): VideoData[] {
  const { watchedEpisodes = {}, likes = {}, interests = [], level } = options

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

  // Build set of interest categories from onboarding
  const interestSet = new Set<string>(interests)

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

  // When interests are set, strongly boost those categories (put them first)
  if (interestSet.size > 0) {
    const interestVideos: VideoData[] = []
    const otherVideos: VideoData[] = []
    for (const v of unwatched) {
      if (interestSet.has(v.category)) {
        interestVideos.push(v)
      } else {
        otherVideos.push(v)
      }
    }

    // Within each group, further boost liked categories
    const sortAndDiversify = (pool: VideoData[]): VideoData[] => {
      if (likedCategories.size > 0) {
        const boosted: VideoData[] = []
        const normal: VideoData[] = []
        for (const v of pool) {
          if (likedCategories.has(v.category)) {
            boosted.push(v)
          } else {
            normal.push(v)
          }
        }
        return [
          ...interleaveByCategory(sortByDifficulty(shuffle([...boosted]), level)),
          ...interleaveByCategory(sortByDifficulty(shuffle([...normal]), level)),
        ]
      }
      return interleaveByCategory(sortByDifficulty(shuffle([...pool]), level))
    }

    const diverseInterest = sortAndDiversify(interestVideos)
    const diverseOther = sortAndDiversify(otherVideos)
    const diverseWatched = interleaveByCategory(sortByDifficulty(shuffle([...watched]), level))
    return [...diverseInterest, ...diverseOther, ...diverseWatched]
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
    const diverseBoosted = interleaveByCategory(sortByDifficulty(shuffle([...boosted]), level))
    const diverseNormal = interleaveByCategory(sortByDifficulty(shuffle([...normal]), level))
    const diverseWatched = interleaveByCategory(sortByDifficulty(shuffle([...watched]), level))
    return [...diverseBoosted, ...diverseNormal, ...diverseWatched]
  }

  // No like data or interests: simple diversity shuffle with difficulty sort, unwatched first
  const diverseUnwatched = interleaveByCategory(sortByDifficulty(shuffle([...unwatched]), level))
  const diverseWatched = interleaveByCategory(sortByDifficulty(shuffle([...watched]), level))
  return [...diverseUnwatched, ...diverseWatched]
}

/**
 * Build a playlist starting from a specific episode in a series.
 * Episodes are ordered: clicked episode first, then remaining series episodes
 * in order, followed by recommended videos (excluding series episodes).
 */
export function seriesPlaylist(
  seriesId: string,
  startVideoId: string,
  options: RecommendOptions = {}
): VideoData[] {
  const episodes = getVideosBySeries(seriesId)
  const startIdx = episodes.findIndex(v => v.id === startVideoId)
  // Rotate episodes so startVideoId is first, rest follow in order
  const rotated = startIdx > 0
    ? [...episodes.slice(startIdx), ...episodes.slice(0, startIdx)]
    : episodes
  // Append recommended videos (excluding series episodes) after
  const seriesIds = new Set(episodes.map(v => v.id))
  const others = seedVideos.filter(v => !seriesIds.has(v.id))
  const recommended = recommendVideos(others, options)
  return [...rotated, ...recommended]
}

/**
 * Find video index by ID, for deep linking (?v=videoId).
 */
export function findVideoIndex(videos: VideoData[], videoId: string): number {
  const idx = videos.findIndex(v => v.id === videoId)
  return idx >= 0 ? idx : 0
}
