import {
  seedVideos,
  series,
  type CategoryId,
  type Series,
  type VideoData,
} from '@/data/seed-videos'

interface CatalogFeature {
  id: string
  qualityTier?: string
}

const EDUCATIONAL_SHORT_TITLE_PATTERNS = [
  /\blearn english\b/i,
  /\benglish is crazy\b/i,
  /\b(?:understand|speak)\s+fast english\b/i,
  /\benglish (?:at|for |phrases?|conversation|expressions?|mistakes?|test|quiz|accent|articles|antonyms?|slang|skills|learning)\b/i,
  /\b(?:easy|spoken|business|real|academic|british|american|daily use)\s+english\b/i,
  /\b(?:\d+\s+)?(?:important\s+)?(?:phrases|expressions)\b/i,
  /\b(?:advanced phrase|tricky words?\s+in\s+english|short schwa sound|tongue twister)\b/i,
  /\b(?:confusing words?|conditional sentences?|grammar|clauses?)\b/i,
  /\b(?:don'?t|do not)\s+say\b.*\bin\s+english\b/i,
  /\b(?:how to say|can you say|if you can finish these phrases)\b/i,
  /\b(?:linkers for conversations|phrases you need for video calls|shortening your words)\b/i,
  /\b(?:what'?s the difference|you are fluent|english in a snap|@instantenglishuk)\b/i,
]

const SUPPRESSED_CATALOG_VIDEO_IDS = new Set([
  // Manually blocked after product review.
  'shorts-fumc4cvm3Wg',
  // Exclude manifest entries that still need clip/visual review from every sync catalog path.
  'fresh-prince-ep11',
  'sherlock-ep25',
  'pulp-fiction-ep9',
  'the-intern-ep15',
  'devil-wears-prada-ep9',
  'home-alone-ep4',
  'princess-bride-ep13',
  'award-shows-ep15',
  'award-shows-ep22',
  'finding-nemo-dory-ep11',
  'despicable-me-minions-ep3',
  'despicable-me-minions-ep11',
  'despicable-me-minions-ep15',
  'pixar-moments-ep8',
  'pixar-moments-ep9',
  'inside-out-ep3',
  'inside-out-ep6',
  'inside-out-ep7',
  'inside-out-ep15',
  'up-ep17',
  'how-to-train-your-dragon-ep3',
  'madagascar-ep7',
  'spider-verse-ep4',
  'spider-verse-ep12',
  'puss-in-boots-2-ep10',
  'moana-ep10',
  'coco-ep11',
  'coco-ep12',
])

function isSuppressedCatalogVideo(video: VideoData) {
  if (SUPPRESSED_CATALOG_VIDEO_IDS.has(video.id)) return true
  if (video.inactive) return true
  if (video.format !== 'shorts' || video.category !== 'daily') return false
  return EDUCATIONAL_SHORT_TITLE_PATTERNS.some((pattern) => pattern.test(video.title))
}

// ---------------------------------------------------------------------------
// Lazy-loaded recommendation manifest (3.4MB)
// ---------------------------------------------------------------------------

let _readyVideoIds: Set<string> | null = null
let _manifestPromise: Promise<Set<string>> | null = null

async function loadReadyVideoIds(): Promise<Set<string>> {
  if (_readyVideoIds) return _readyVideoIds
  if (!_manifestPromise) {
    _manifestPromise = import('@/data/recommendation-manifest.json').then((m) => {
      const manifest = m.default as { videos?: CatalogFeature[] }
      _readyVideoIds = new Set(
        (manifest.videos ?? [])
          .filter((feature) => feature.qualityTier === 'ready')
          .map((feature) => feature.id),
      )
      return _readyVideoIds
    })
  }
  return _manifestPromise
}

// ---------------------------------------------------------------------------
// Eagerly computed catalog (uses all seed videos as fallback until manifest loads)
// ---------------------------------------------------------------------------

// For initial render before manifest loads, use all videos.
// Once getFilteredCatalog() is called (async), it filters properly.
const activeSeedVideos = seedVideos.filter((video) => !isSuppressedCatalogVideo(video))
const allVideoById = new Map(activeSeedVideos.map((video) => [video.id, video]))
const allVideoByYoutubeId = new Map(activeSeedVideos.map((video) => [video.youtubeId, video]))

// Lazy catalog (filtered by manifest)
let _catalogVideos: VideoData[] | null = null
let _catalogShorts: VideoData[] | null = null
let _catalogSeries: Series[] | null = null
let _catalogVideoById: Map<string, VideoData> | null = null
let _catalogVideoByYoutubeId: Map<string, VideoData> | null = null
let _catalogSeriesById: Map<string, Series> | null = null
let _videosBySeriesId: Map<string, VideoData[]> | null = null

async function ensureCatalog() {
  if (_catalogVideos) return
  const readyIds = await loadReadyVideoIds()

  _catalogVideos = activeSeedVideos.filter((video) => readyIds.has(video.id))
  _catalogShorts = _catalogVideos.filter((video) => video.format === 'shorts')

  _videosBySeriesId = new Map<string, VideoData[]>()
  for (const video of _catalogVideos) {
    if (!video.seriesId) continue
    const current = _videosBySeriesId.get(video.seriesId) ?? []
    current.push(video)
    _videosBySeriesId.set(video.seriesId, current)
  }
  for (const videos of _videosBySeriesId.values()) {
    videos.sort((left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0))
  }

  _catalogSeries = series
    .map((seriesItem) => {
      const episodes = _videosBySeriesId!.get(seriesItem.id) ?? []
      if (episodes.length === 0) return null
      return { ...seriesItem, episodeCount: episodes.length }
    })
    .filter((seriesItem): seriesItem is Series => seriesItem !== null)

  _catalogVideoById = new Map(_catalogVideos.map((video) => [video.id, video]))
  _catalogVideoByYoutubeId = new Map(_catalogVideos.map((video) => [video.youtubeId, video]))
  _catalogSeriesById = new Map(_catalogSeries.map((s) => [s.id, s]))
}

// ---------------------------------------------------------------------------
// Sync exports (return all seed videos until manifest is loaded)
// These work immediately but may include non-ready videos before first async call.
// ---------------------------------------------------------------------------

// Kick off loading immediately (non-blocking)
if (typeof window !== 'undefined') {
  ensureCatalog()
}

export function getCatalogVideos(): VideoData[] {
  return _catalogVideos ?? activeSeedVideos
}

export function getCatalogShorts(): VideoData[] {
  return _catalogShorts ?? activeSeedVideos.filter((video) => video.format === 'shorts')
}

export function getCatalogSeries(): Series[] {
  return _catalogSeries ?? series
}

// Keep backward-compatible named exports
export const catalogVideos = activeSeedVideos // initial value; consumers should prefer getCatalogVideos()
export const catalogShorts = activeSeedVideos.filter((video) => video.format === 'shorts')
export const catalogSeries = series

export function getCatalogVideoById(videoId: string) {
  return (_catalogVideoById ?? allVideoById).get(videoId)
}

export function getCatalogVideoByYoutubeId(youtubeId: string) {
  return (_catalogVideoByYoutubeId ?? allVideoByYoutubeId).get(youtubeId)
}

export function getCatalogSeriesById(seriesId: string) {
  return _catalogSeriesById?.get(seriesId) ?? series.find((s) => s.id === seriesId)
}

export function getCatalogVideosBySeries(seriesId: string) {
  if (_videosBySeriesId) return [...(_videosBySeriesId.get(seriesId) ?? [])]
  return activeSeedVideos.filter((video) => video.seriesId === seriesId)
}

export function getCatalogVideosByCategory(categoryId: CategoryId) {
  return getCatalogVideos().filter((video) => video.category === categoryId)
}

export function getCatalogSeriesByCategory(categoryId: CategoryId) {
  return getCatalogSeries().filter((seriesItem) => seriesItem.category === categoryId)
}

export function isCatalogVideo(videoId: string) {
  return (_catalogVideoById ?? allVideoById).has(videoId)
}

/** Async version that ensures manifest is loaded first. */
export async function ensureCatalogReady(): Promise<void> {
  await ensureCatalog()
}
