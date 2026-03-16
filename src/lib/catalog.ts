import recommendationManifestData from '@/data/recommendation-manifest.json'
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

const recommendationManifest = recommendationManifestData as {
  videos?: CatalogFeature[]
}

const readyVideoIds = new Set(
  (recommendationManifest.videos ?? [])
    .filter((feature) => feature.qualityTier === 'ready')
    .map((feature) => feature.id),
)

export const catalogVideos = seedVideos.filter((video) => readyVideoIds.has(video.id))

export const catalogShorts = catalogVideos.filter((video) => video.format === 'shorts')

const videosBySeriesId = new Map<string, VideoData[]>()
for (const video of catalogVideos) {
  if (!video.seriesId) continue

  const current = videosBySeriesId.get(video.seriesId) ?? []
  current.push(video)
  videosBySeriesId.set(video.seriesId, current)
}

for (const videos of videosBySeriesId.values()) {
  videos.sort((left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0))
}

export const catalogSeries: Series[] = series
  .map((seriesItem) => {
    const episodes = videosBySeriesId.get(seriesItem.id) ?? []
    if (episodes.length === 0) return null

    return {
      ...seriesItem,
      episodeCount: episodes.length,
    }
  })
  .filter((seriesItem): seriesItem is Series => seriesItem !== null)

const catalogVideoById = new Map(catalogVideos.map((video) => [video.id, video]))
const catalogVideoByYoutubeId = new Map(catalogVideos.map((video) => [video.youtubeId, video]))
const catalogSeriesById = new Map(catalogSeries.map((seriesItem) => [seriesItem.id, seriesItem]))

export function getCatalogVideoById(videoId: string) {
  return catalogVideoById.get(videoId)
}

export function getCatalogVideoByYoutubeId(youtubeId: string) {
  return catalogVideoByYoutubeId.get(youtubeId)
}

export function getCatalogSeriesById(seriesId: string) {
  return catalogSeriesById.get(seriesId)
}

export function getCatalogVideosBySeries(seriesId: string) {
  return [...(videosBySeriesId.get(seriesId) ?? [])]
}

export function getCatalogVideosByCategory(categoryId: CategoryId) {
  return catalogVideos.filter((video) => video.category === categoryId)
}

export function getCatalogSeriesByCategory(categoryId: CategoryId) {
  return catalogSeries.filter((seriesItem) => seriesItem.category === categoryId)
}

export function isCatalogVideo(videoId: string) {
  return catalogVideoById.has(videoId)
}
