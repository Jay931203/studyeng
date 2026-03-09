import { describe, expect, it } from 'vitest'
import { seedVideos } from '@/data/seed-videos'
import { catalogVideos, catalogSeries, getCatalogVideosBySeries } from '@/lib/catalog'
import { recommendVideos } from './recommend'

describe('recommendVideos', () => {
  it('keeps next episodes near the top for the active series', () => {
    const seriesItem = catalogSeries.find((series) => series.episodeCount >= 2)
    const episodes = seriesItem ? getCatalogVideosBySeries(seriesItem.id) : []
    const seedVideo = episodes[0]
    const candidateNext = episodes[1]
    const otherVideo = catalogVideos.find(
      (video) => video.seriesId !== seriesItem?.id && video.category !== seedVideo.category,
    )

    expect(seriesItem).toBeDefined()
    expect(seedVideo).toBeDefined()
    expect(candidateNext).toBeDefined()
    expect(otherVideo).toBeDefined()

    const ranked = recommendVideos([candidateNext!, otherVideo!], { seedVideo })
    expect(ranked[0]?.id).toBe(candidateNext!.id)
  })

  it('uses saved phrase affinity to boost related categories', () => {
    const source = catalogVideos.find((video) => video.category === 'music')
    const sameCategory = catalogVideos.find(
      (video) => video.category === 'music' && video.id !== source?.id,
    )
    const differentCategory = catalogVideos.find(
      (video) => video.category === 'drama' && video.id !== source?.id,
    )

    expect(source).toBeDefined()
    expect(sameCategory).toBeDefined()
    expect(differentCategory).toBeDefined()

    const ranked = recommendVideos([sameCategory!, differentCategory!], {
      phrases: [
        {
          videoId: source!.id,
          videoTitle: source!.title,
          savedAt: Date.now(),
          reviewCount: 3,
        },
      ],
    })

    expect(ranked[0]?.id).toBe(sameCategory!.id)
  })

  it('uses completion-heavy behavior signals to favor similar clips', () => {
    const source = catalogVideos.find((video) => video.category === 'daily')
    const sameCategory = catalogVideos.find(
      (video) => video.category === 'daily' && video.id !== source?.id,
    )
    const differentCategory = catalogVideos.find(
      (video) => video.category === 'movie' && video.id !== source?.id,
    )

    expect(source).toBeDefined()
    expect(sameCategory).toBeDefined()
    expect(differentCategory).toBeDefined()

    const ranked = recommendVideos([sameCategory!, differentCategory!], {
      recentVideoIds: [source!.id],
      videoSignals: {
        [source!.id]: {
          impressions: 3,
          completions: 3,
          skips: 0,
          totalCompletionRatio: 3,
          lastInteractedAt: 300,
        },
      },
    })

    expect(ranked[0]?.id).toBe(sameCategory!.id)
  })

  it('returns a deterministic order for the same inputs', () => {
    const sample = seedVideos.slice(0, 25)
    const options = {
      interests: ['drama', 'music'],
      watchRecords: [
        {
          videoId: sample[0].id,
          watchedAt: 100,
        },
      ],
      phrases: [
        {
          videoId: sample[1].id,
          videoTitle: sample[1].title,
          savedAt: 200,
          reviewCount: 1,
        },
      ],
    }

    const first = recommendVideos(sample, options).map((video) => video.id)
    const second = recommendVideos(sample, options).map((video) => video.id)

    expect(second).toEqual(first)
  })

  it('filters out blocked clips even when they are passed explicitly', () => {
    const blocked = seedVideos.find((video) => !catalogVideos.some((catalogVideo) => catalogVideo.id === video.id))
    const available = catalogVideos[0]

    expect(blocked).toBeDefined()
    expect(available).toBeDefined()

    const ranked = recommendVideos([blocked!, available!])

    expect(ranked.map((video) => video.id)).toEqual([available!.id])
  })
})
