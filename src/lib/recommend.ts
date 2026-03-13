import recommendationManifestData from '@/data/recommendation-manifest.json'
import type { VideoData, CategoryId } from '@/data/seed-videos'
import { seedVideos } from '@/data/seed-videos'

function getVideosBySeries(seriesId: string): import('@/data/seed-videos').VideoData[] {
  return seedVideos.filter((video) => video.seriesId === seriesId)
}

interface WatchRecord {
  videoId: string
  watchedAt: number
}

interface SavedPhraseSignal {
  videoId: string
  videoTitle?: string
  en?: string
  savedAt?: number
  reviewCount?: number
}

interface VideoBehaviorSignal {
  impressions: number
  completions: number
  skips: number
  totalCompletionRatio: number
  lastInteractedAt: number
}

interface RecommendOptions {
  watchedEpisodes?: Record<string, string[]>
  likes?: Record<string, boolean>
  interests?: string[]
  level?: 'beginner' | 'intermediate' | 'advanced'
  seedVideo?: VideoData
  watchRecords?: WatchRecord[]
  viewCounts?: Record<string, number>
  completionCounts?: Record<string, number>
  savedPhrases?: SavedPhraseSignal[]
  phrases?: SavedPhraseSignal[]
  recentVideoIds?: string[]
  videoSignals?: Record<string, VideoBehaviorSignal>
}

interface RecommendationFeature {
  id: string
  youtubeId: string
  category: CategoryId
  seriesId?: string | null
  episodeNumber?: number | null
  difficulty: number
  clipDurationSec: number
  externalPlaybackStatus?: string
  qualityTier?: string
  recommendable?: boolean
  titleTokens?: string[]
  subtitleTokens?: string[]
  topicTokens?: string[]
  catalogIndex?: number
}

interface ScoreContext {
  behaviorCategoryWeights: Map<CategoryId, number>
  behaviorSeriesWeights: Map<string, number>
  behaviorTokenWeights: Map<string, number>
  completionCategoryWeights: Map<CategoryId, number>
  completionCounts: Record<string, number>
  completionSeriesWeights: Map<string, number>
  interestSet: Set<string>
  level?: 'beginner' | 'intermediate' | 'advanced'
  likedCategoryWeights: Map<CategoryId, number>
  likedSeriesWeights: Map<string, number>
  phraseCategoryWeights: Map<CategoryId, number>
  phraseSeriesWeights: Map<string, number>
  phraseTokenWeights: Map<string, number>
  recentCategoryWeights: Map<CategoryId, number>
  recentSeriesWeights: Map<string, number>
  recentVideoWeights: Map<string, number>
  skipCategoryWeights: Map<CategoryId, number>
  skipSeriesWeights: Map<string, number>
  seedFeature?: RecommendationFeature
  seedVideo?: VideoData
  viewCounts: Record<string, number>
  watchedIds: Set<string>
}

interface ScoredVideo {
  score: number
  video: VideoData
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'get',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'like',
  'me',
  'my',
  'not',
  'of',
  'on',
  'or',
  'our',
  'out',
  'she',
  'so',
  'than',
  'that',
  'the',
  'their',
  'them',
  'there',
  'they',
  'this',
  'to',
  'up',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'who',
  'why',
  'with',
  'would',
  'you',
  'your',
])

const recommendationManifest = recommendationManifestData as unknown as {
  videos?: Array<Partial<RecommendationFeature> & Pick<RecommendationFeature, 'id'>>
}

const manifestFeatureById = new Map(
  (recommendationManifest.videos ?? []).map((feature) => [feature.id, feature]),
)
const catalogIndexById = new Map(seedVideos.map((video, index) => [video.id, index]))
const catalogById = new Map(seedVideos.map((video) => [video.id, video]))

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function tokenizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token) && !/^\d+$/.test(token))
}

function rankTokens(tokens: string[], limit: number) {
  const counts = new Map<string, number>()
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token)
}

function buildFallbackFeature(video: VideoData): RecommendationFeature {
  const titleTokens = rankTokens(tokenizeText(video.title), 10)
  const subtitleTokens = rankTokens(
    tokenizeText(video.subtitles.map((entry) => entry.en).join(' ')),
    18,
  )

  return {
    id: video.id,
    youtubeId: video.youtubeId,
    category: video.category,
    seriesId: video.seriesId ?? null,
    episodeNumber: video.episodeNumber ?? null,
    difficulty: video.difficulty,
    clipDurationSec: Math.round((video.clipEnd - video.clipStart) * 100) / 100,
    catalogIndex: catalogIndexById.get(video.id),
    externalPlaybackStatus: 'unchecked',
    qualityTier: 'candidate',
    recommendable: true,
    titleTokens,
    subtitleTokens,
    topicTokens: [...new Set([...titleTokens, ...subtitleTokens])].slice(0, 24),
  }
}

function getFeature(video: VideoData) {
  const fallback = buildFallbackFeature(video)
  return {
    ...fallback,
    ...(manifestFeatureById.get(video.id) ?? {}),
  }
}

function isRecommendableFeature(feature: RecommendationFeature) {
  return (
    feature.qualityTier === 'ready' &&
    feature.recommendable !== false &&
    feature.externalPlaybackStatus !== 'blocked'
  )
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

function addWeight<T extends string>(map: Map<T, number>, key: T | undefined | null, weight: number) {
  if (!key || weight === 0) return
  map.set(key, (map.get(key) ?? 0) + weight)
}

function addVideoAffinity(
  video: VideoData,
  weight: number,
  categoryWeights: Map<CategoryId, number>,
  seriesWeights: Map<string, number>,
) {
  addWeight(categoryWeights, video.category, weight)
  addWeight(seriesWeights, video.seriesId ?? undefined, weight)
}

function buildScoreContext(options: RecommendOptions): ScoreContext {
  const watchedEpisodes = options.watchedEpisodes ?? {}
  const likes = options.likes ?? {}
  const watchRecords = [...(options.watchRecords ?? [])].sort(
    (left, right) => right.watchedAt - left.watchedAt,
  )
  const viewCounts = options.viewCounts ?? {}
  const completionCounts = options.completionCounts ?? {}
  const savedPhrases = options.savedPhrases ?? options.phrases ?? []
  const recentVideoIds = options.recentVideoIds ?? []
  const videoSignals = options.videoSignals ?? {}
  const watchedIds = buildWatchedIdSet(watchedEpisodes)

  const behaviorCategoryWeights = new Map<CategoryId, number>()
  const behaviorSeriesWeights = new Map<string, number>()
  const behaviorTokenWeights = new Map<string, number>()
  const likedCategoryWeights = new Map<CategoryId, number>()
  const likedSeriesWeights = new Map<string, number>()
  for (const [videoId, liked] of Object.entries(likes)) {
    if (!liked) continue
    const video = catalogById.get(videoId)
    if (!video) continue
    addVideoAffinity(video, 1.2, likedCategoryWeights, likedSeriesWeights)
  }

  const recentCategoryWeights = new Map<CategoryId, number>()
  const recentSeriesWeights = new Map<string, number>()
  const recentVideoWeights = new Map<string, number>()
  recentVideoIds.slice(0, 40).forEach((videoId, index) => {
    const weight = Math.max(0.16, 1.35 - index * 0.04)
    addWeight(recentVideoWeights, videoId, weight)
  })

  watchRecords.slice(0, 120).forEach((record, index) => {
    const video = catalogById.get(record.videoId)
    if (!video) return
    const weight = Math.max(0.08, Math.exp(-index / 18))
    addVideoAffinity(video, weight, recentCategoryWeights, recentSeriesWeights)
    addWeight(recentVideoWeights, record.videoId, weight)
  })

  const completionCategoryWeights = new Map<CategoryId, number>()
  const completionSeriesWeights = new Map<string, number>()
  for (const [videoId, count] of Object.entries(completionCounts)) {
    const video = catalogById.get(videoId)
    if (!video || count <= 0) continue
    addVideoAffinity(
      video,
      Math.min(count, 4) * 0.8,
      completionCategoryWeights,
      completionSeriesWeights,
    )
  }

  for (const [videoId, count] of Object.entries(viewCounts)) {
    const video = catalogById.get(videoId)
    if (!video || count <= 0) continue
    addVideoAffinity(
      video,
      Math.min(count, 5) * 0.28,
      recentCategoryWeights,
      recentSeriesWeights,
    )
  }

  const skipCategoryWeights = new Map<CategoryId, number>()
  const skipSeriesWeights = new Map<string, number>()
  for (const [videoId, signal] of Object.entries(videoSignals)) {
    const video = catalogById.get(videoId)
    if (!video) continue

    const feature = getFeature(video)
    const interactionCount = Math.max(1, signal.completions + signal.skips)
    const exposureCount = Math.max(signal.impressions, interactionCount)
    const averageCompletionRatio = signal.totalCompletionRatio / interactionCount
    const completionRate = signal.completions / exposureCount
    const skipRate = signal.skips / exposureCount
    const recentIndex = recentVideoIds.indexOf(videoId)
    const recencyWeight = recentIndex >= 0 ? Math.max(0.3, 1.4 - recentIndex * 0.05) : 0.5
    const positiveWeight =
      Math.max(0, averageCompletionRatio - 0.45) * 1.8 + completionRate * 1.5
    const negativeWeight =
      Math.max(0, 0.55 - averageCompletionRatio) * 1.2 + skipRate * 1.8

    if (positiveWeight > 0) {
      const weightedPositive = positiveWeight * recencyWeight
      addVideoAffinity(
        video,
        weightedPositive,
        behaviorCategoryWeights,
        behaviorSeriesWeights,
      )

      for (const token of feature.topicTokens ?? []) {
        behaviorTokenWeights.set(
          token,
          (behaviorTokenWeights.get(token) ?? 0) + weightedPositive,
        )
      }
    }

    if (negativeWeight > 0) {
      const weightedNegative = negativeWeight * recencyWeight
      addVideoAffinity(video, weightedNegative, skipCategoryWeights, skipSeriesWeights)
      addWeight(recentVideoWeights, videoId, weightedNegative * 1.8)
    }
  }

  const phraseCategoryWeights = new Map<CategoryId, number>()
  const phraseSeriesWeights = new Map<string, number>()
  const phraseTokenWeights = new Map<string, number>()
  const sortedPhrases = [...savedPhrases].sort(
    (left, right) => (right.savedAt ?? 0) - (left.savedAt ?? 0),
  )

  sortedPhrases.slice(0, 100).forEach((phrase, index) => {
    const video = catalogById.get(phrase.videoId)
    const weight = Math.max(0.12, Math.exp(-index / 16)) * (1 + (phrase.reviewCount ?? 0) * 0.12)
    if (video) {
      addVideoAffinity(video, weight, phraseCategoryWeights, phraseSeriesWeights)
    }

    const phraseTokens = tokenizeText(
      [phrase.videoTitle ?? '', phrase.en ?? ''].filter(Boolean).join(' '),
    )
    for (const token of phraseTokens) {
      phraseTokenWeights.set(token, (phraseTokenWeights.get(token) ?? 0) + weight)
    }
  })

  return {
    behaviorCategoryWeights,
    behaviorSeriesWeights,
    behaviorTokenWeights,
    completionCategoryWeights,
    completionCounts,
    completionSeriesWeights,
    interestSet: new Set(options.interests ?? []),
    level: options.level,
    likedCategoryWeights,
    likedSeriesWeights,
    phraseCategoryWeights,
    phraseSeriesWeights,
    phraseTokenWeights,
    recentCategoryWeights,
    recentSeriesWeights,
    recentVideoWeights,
    skipCategoryWeights,
    skipSeriesWeights,
    seedFeature: options.seedVideo ? getFeature(options.seedVideo) : undefined,
    seedVideo: options.seedVideo,
    viewCounts,
    watchedIds,
  }
}

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

function difficultyPenalty(
  difficulty: number,
  level?: 'beginner' | 'intermediate' | 'advanced',
) {
  if (!level) return 0
  const [min, max] = getDifficultyRange(level)
  if (difficulty >= min && difficulty <= max) return 0
  return difficulty < min ? min - difficulty : difficulty - max
}

function tokenOverlapScore(leftTokens: string[] = [], rightTokens: string[] = []) {
  if (leftTokens.length === 0 || rightTokens.length === 0) return 0
  const left = new Set(leftTokens)
  const right = new Set(rightTokens)
  let matches = 0
  for (const token of right) {
    if (left.has(token)) {
      matches += 1
    }
  }
  return matches / Math.max(left.size, right.size)
}

function weightedTokenOverlap(tokens: string[] = [], weights: Map<string, number>) {
  if (tokens.length === 0 || weights.size === 0) return 0
  let score = 0
  for (const token of tokens) {
    score += weights.get(token) ?? 0
  }
  return score
}

function isExternallyPlayable(feature: RecommendationFeature) {
  return isRecommendableFeature(feature)
}

function freshnessBonus(feature: RecommendationFeature) {
  const catalogSize = Math.max(seedVideos.length - 1, 1)
  const normalized = (feature.catalogIndex ?? 0) / catalogSize
  return normalized * 18
}

function scoreVideo(video: VideoData, context: ScoreContext) {
  const feature = getFeature(video)
  if (!isExternallyPlayable(feature)) {
    return Number.NEGATIVE_INFINITY
  }

  let score = 0
  const viewCount = context.viewCounts[video.id] ?? 0
  const completionCount = context.completionCounts[video.id] ?? 0

  if (!context.watchedIds.has(video.id)) {
    score += 360
  } else {
    score -= Math.min(220, viewCount * 34 + completionCount * 48)
  }

  score += Math.max(0, 40 - viewCount * 10)

  if (context.interestSet.has(video.category)) {
    score += 110
  }

  score += (context.likedCategoryWeights.get(video.category) ?? 0) * 55
  score += (context.recentCategoryWeights.get(video.category) ?? 0) * 52
  score += (context.behaviorCategoryWeights.get(video.category) ?? 0) * 70
  score += (context.completionCategoryWeights.get(video.category) ?? 0) * 62
  score += (context.phraseCategoryWeights.get(video.category) ?? 0) * 38
  score -= (context.skipCategoryWeights.get(video.category) ?? 0) * 58

  if (video.seriesId) {
    score += (context.likedSeriesWeights.get(video.seriesId) ?? 0) * 72
    score += (context.recentSeriesWeights.get(video.seriesId) ?? 0) * 66
    score += (context.behaviorSeriesWeights.get(video.seriesId) ?? 0) * 88
    score += (context.completionSeriesWeights.get(video.seriesId) ?? 0) * 82
    score += (context.phraseSeriesWeights.get(video.seriesId) ?? 0) * 54
    score -= (context.skipSeriesWeights.get(video.seriesId) ?? 0) * 70
  }

  score += Math.min(140, weightedTokenOverlap(feature.topicTokens, context.behaviorTokenWeights) * 16)
  score += Math.min(150, weightedTokenOverlap(feature.topicTokens, context.phraseTokenWeights) * 18)
  score += Math.min(90, weightedTokenOverlap(feature.subtitleTokens, context.phraseTokenWeights) * 12)

  score -= difficultyPenalty(video.difficulty, context.level) * 28
  score -= (context.recentVideoWeights.get(video.id) ?? 0) * 95

  if (feature.qualityTier === 'ready') {
    score += 18
  } else if (feature.qualityTier === 'blocked') {
    score -= 400
  }

  score += freshnessBonus(feature)

  if (context.seedVideo && context.seedFeature) {
    if (video.category === context.seedVideo.category) {
      score += 85
    }

    score += Math.max(0, 42 - Math.abs(video.difficulty - context.seedVideo.difficulty) * 14)
    score += tokenOverlapScore(context.seedFeature.topicTokens, feature.topicTokens) * 180
    score += tokenOverlapScore(context.seedFeature.subtitleTokens, feature.subtitleTokens) * 90

    if (video.seriesId && context.seedVideo.seriesId && video.seriesId === context.seedVideo.seriesId) {
      score += 240

      if (video.episodeNumber != null && context.seedVideo.episodeNumber != null) {
        const delta = video.episodeNumber - context.seedVideo.episodeNumber

        if (delta === 1) {
          score += 210
        } else if (delta > 1) {
          score += Math.max(50, 140 - delta * 18)
        } else if (delta < 0) {
          score -= Math.min(150, Math.abs(delta) * 22)
        }
      }
    }
  }

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
      adjustedScore -= recentCategoryMatches * 34

      if (candidate.video.seriesId) {
        const recentSeriesMatches = recentSeriesIds
          .slice(-2)
          .filter((seriesId) => seriesId === candidate.video.seriesId).length

        if (recentSeriesMatches > 0) {
          adjustedScore -=
            seedVideo?.seriesId === candidate.video.seriesId
              ? recentSeriesMatches * 8
              : recentSeriesMatches * 72
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

export function recommendVideos(videos: VideoData[], options: RecommendOptions = {}) {
  const context = buildScoreContext(options)
  const seedVideo = options.seedVideo

  const scoredVideos = videos
    .filter((video) => video.id !== seedVideo?.id)
    .filter((video) => isRecommendableFeature(getFeature(video)))
    .map((video) => ({
      score: scoreVideo(video, context),
      video,
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }
      return left.video.id.localeCompare(right.video.id)
    })

  return diversifyVideos(scoredVideos, seedVideo)
}

export function seriesPlaylist(
  seriesId: string,
  startVideoId: string,
  options: RecommendOptions = {},
) {
  const episodes = getVideosBySeries(seriesId).filter((video) =>
    isRecommendableFeature(getFeature(video)),
  )
  const startIdx = episodes.findIndex((video) => video.id === startVideoId)
  const rotated =
    startIdx > 0 ? [...episodes.slice(startIdx), ...episodes.slice(0, startIdx)] : episodes
  const seriesIds = new Set(episodes.map((video) => video.id))
  const others = seedVideos.filter(
    (video) => !seriesIds.has(video.id) && isRecommendableFeature(getFeature(video)),
  )

  return [
    ...rotated,
    ...recommendVideos(others, {
      ...options,
      seedVideo: rotated[0],
    }),
  ]
}

export function findVideoIndex(videos: VideoData[], videoId: string) {
  const idx = videos.findIndex((video) => video.id === videoId)
  return idx >= 0 ? idx : 0
}
