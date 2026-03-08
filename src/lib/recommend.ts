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
  /** The video the user is currently watching, if any */
  seedVideo?: VideoData
}

interface ScoreContext {
  interestSet: Set<string>
  likedCategoryCounts: Map<CategoryId, number>
  likedSeriesCounts: Map<string, number>
  watchedCategoryCounts: Map<CategoryId, number>
  watchedSeriesCounts: Map<string, number>
  watchedIds: Set<string>
  level?: 'beginner' | 'intermediate' | 'advanced'
  seedVideo?: VideoData
}

interface ScoredVideo {
  score: number
  video: VideoData
}

const catalogById = new Map(seedVideos.map((video) => [video.id, video]))

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function tokenizeTitle(title: string) {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2)
}

function titleOverlapScore(leftTitle: string, rightTitle: string) {
  const leftTokens = new Set(tokenizeTitle(leftTitle))
  const rightTokens = [...new Set(tokenizeTitle(rightTitle))]

  if (leftTokens.size === 0 || rightTokens.length === 0) {
    return 0
  }

  let matches = 0
  for (const token of rightTokens) {
    if (leftTokens.has(token)) {
      matches += 1
    }
  }

  return matches / Math.max(leftTokens.size, rightTokens.length)
}

function buildWatchedIdSet(watchedEpisodes: Record<string, string[]>) {
  const watchedIds = new Set<string>()
  for (const ids of Object.values(watchedEpisodes)) {
    for (const id of ids) {
      watchedIds.add(id)
    }
  }
  return watchedIds
}

function accumulatePreferenceCounts(videoIds: Iterable<string>) {
  const categoryCounts = new Map<CategoryId, number>()
  const seriesCounts = new Map<string, number>()

  for (const videoId of videoIds) {
    const video = catalogById.get(videoId)
    if (!video) continue

    categoryCounts.set(video.category, (categoryCounts.get(video.category) ?? 0) + 1)

    if (video.seriesId) {
      seriesCounts.set(video.seriesId, (seriesCounts.get(video.seriesId) ?? 0) + 1)
    }
  }

  return { categoryCounts, seriesCounts }
}

/**
 * Round user level to preferred difficulty ranges.
 * Returns [min, max] inclusive.
 */
function getDifficultyRange(level: 'beginner' | 'intermediate' | 'advanced'): [number, number] {
  switch (level) {
    case 'beginner':
      return [1, 2]
    case 'intermediate':
      return [2, 3]
    case 'advanced':
      return [3, 5]
  }
}

function difficultyScore(
  difficulty: number,
  level?: 'beginner' | 'intermediate' | 'advanced',
) {
  if (!level) return 0
  const [min, max] = getDifficultyRange(level)
  if (difficulty >= min && difficulty <= max) return 0
  return difficulty < min ? min - difficulty : difficulty - max
}

function buildScoreContext(options: RecommendOptions): ScoreContext {
  const watchedEpisodes = options.watchedEpisodes ?? {}
  const likes = options.likes ?? {}
  const likedIds = Object.keys(likes).filter((videoId) => likes[videoId])
  const watchedIds = buildWatchedIdSet(watchedEpisodes)

  const likedCounts = accumulatePreferenceCounts(likedIds)
  const watchedCounts = accumulatePreferenceCounts(watchedIds)

  return {
    interestSet: new Set(options.interests ?? []),
    likedCategoryCounts: likedCounts.categoryCounts,
    likedSeriesCounts: likedCounts.seriesCounts,
    watchedCategoryCounts: watchedCounts.categoryCounts,
    watchedSeriesCounts: watchedCounts.seriesCounts,
    watchedIds,
    level: options.level,
    seedVideo: options.seedVideo,
  }
}

function scoreVideo(video: VideoData, context: ScoreContext) {
  let score = 0
  const {
    interestSet,
    likedCategoryCounts,
    likedSeriesCounts,
    watchedCategoryCounts,
    watchedSeriesCounts,
    watchedIds,
    level,
    seedVideo,
  } = context

  if (!watchedIds.has(video.id)) {
    score += 420
  } else {
    score -= 140
  }

  if (interestSet.has(video.category)) {
    score += 120
  }

  score += (likedCategoryCounts.get(video.category) ?? 0) * 55
  score += Math.min(watchedCategoryCounts.get(video.category) ?? 0, 4) * 18

  if (video.seriesId) {
    score += (likedSeriesCounts.get(video.seriesId) ?? 0) * 75
    score += Math.min(watchedSeriesCounts.get(video.seriesId) ?? 0, 3) * 24
  }

  score -= difficultyScore(video.difficulty, level) * 28

  if (seedVideo) {
    if (video.category === seedVideo.category) {
      score += 90
    }

    score += Math.max(0, 48 - Math.abs(video.difficulty - seedVideo.difficulty) * 16)
    score += titleOverlapScore(video.title, seedVideo.title) * 90

    if (video.seriesId && seedVideo.seriesId && video.seriesId === seedVideo.seriesId) {
      score += 240

      if (video.episodeNumber != null && seedVideo.episodeNumber != null) {
        const delta = video.episodeNumber - seedVideo.episodeNumber

        if (delta === 1) {
          score += 200
        } else if (delta > 1) {
          score += Math.max(60, 140 - delta * 18)
        } else if (delta < 0) {
          score -= Math.min(150, Math.abs(delta) * 20)
        }
      }
    }
  }

  // Deterministic tie-breaker so equal scores do not reshuffle across renders.
  score += (stableHash(video.id) % 1000) / 100000

  return score
}

function diversifyVideos(scoredVideos: ScoredVideo[], seedVideo?: VideoData) {
  const remaining = [...scoredVideos]
  const result: VideoData[] = []
  const recentCategories = seedVideo ? [seedVideo.category] : []
  const recentSeriesIds = seedVideo?.seriesId ? [seedVideo.seriesId] : []

  while (remaining.length > 0) {
    const lookahead = Math.min(remaining.length, 24)
    let bestIndex = 0
    let bestAdjustedScore = Number.NEGATIVE_INFINITY

    for (let index = 0; index < lookahead; index += 1) {
      const candidate = remaining[index]
      let adjustedScore = candidate.score

      const recentCategoryMatches = recentCategories
        .slice(-2)
        .filter((category) => category === candidate.video.category).length
      adjustedScore -= recentCategoryMatches * 35

      if (candidate.video.seriesId) {
        const recentSeriesMatches = recentSeriesIds
          .slice(-2)
          .filter((seriesId) => seriesId === candidate.video.seriesId).length

        if (recentSeriesMatches > 0) {
          adjustedScore -=
            seedVideo?.seriesId === candidate.video.seriesId
              ? recentSeriesMatches * 10
              : recentSeriesMatches * 70
        }
      }

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore
        bestIndex = index
      }
    }

    const [picked] = remaining.splice(bestIndex, 1)
    result.push(picked.video)
    recentCategories.push(picked.video.category)
    if (picked.video.seriesId) {
      recentSeriesIds.push(picked.video.seriesId)
    }
  }

  return result
}

/**
 * Stable recommendation that considers watch history, likes, interests, level,
 * and the currently playing video context when present.
 */
export function recommendVideos(videos: VideoData[], options: RecommendOptions = {}) {
  const context = buildScoreContext(options)
  const seedVideo = options.seedVideo

  const scoredVideos = videos
    .filter((video) => video.id !== seedVideo?.id)
    .map((video) => ({
      score: scoreVideo(video, context),
      video,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.video.id.localeCompare(right.video.id)
    })

  return diversifyVideos(scoredVideos, seedVideo)
}

/**
 * Build a playlist starting from a specific episode in a series.
 * Episodes are ordered: clicked episode first, then remaining series episodes
 * in order, followed by recommended videos (excluding series episodes).
 */
export function seriesPlaylist(
  seriesId: string,
  startVideoId: string,
  options: RecommendOptions = {},
) {
  const episodes = getVideosBySeries(seriesId)
  const startIdx = episodes.findIndex((video) => video.id === startVideoId)
  const rotated =
    startIdx > 0 ? [...episodes.slice(startIdx), ...episodes.slice(0, startIdx)] : episodes
  const seriesIds = new Set(episodes.map((video) => video.id))
  const others = seedVideos.filter((video) => !seriesIds.has(video.id))
  const recommended = recommendVideos(others, {
    ...options,
    seedVideo: rotated[0],
  })

  return [...rotated, ...recommended]
}

/**
 * Find video index by ID, for deep linking (?v=videoId).
 */
export function findVideoIndex(videos: VideoData[], videoId: string) {
  const idx = videos.findIndex((video) => video.id === videoId)
  return idx >= 0 ? idx : 0
}
