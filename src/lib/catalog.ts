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
const allVideoById = new Map(seedVideos.map((video) => [video.id, video]))
const allVideoByYoutubeId = new Map(seedVideos.map((video) => [video.youtubeId, video]))

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

  _catalogVideos = seedVideos.filter((video) => readyIds.has(video.id))
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
  return _catalogVideos ?? seedVideos
}

export function getCatalogShorts(): VideoData[] {
  return _catalogShorts ?? seedVideos.filter((v) => v.format === 'shorts')
}

export function getCatalogSeries(): Series[] {
  return _catalogSeries ?? series
}

// Keep backward-compatible named exports
export const catalogVideos = seedVideos // initial value; consumers should prefer getCatalogVideos()
export const catalogShorts = seedVideos.filter((v) => v.format === 'shorts')
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
  return seedVideos.filter((v) => v.seriesId === seriesId)
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
