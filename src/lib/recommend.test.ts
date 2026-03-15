import { describe, expect, it } from 'vitest'
import { seedVideos } from '@/data/seed-videos'
import { catalogVideos } from '@/lib/catalog'
import { getLevelAwareCandidateVideos, recommendVideos } from './recommend'

describe('recommendVideos', () => {
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

  it('prefers in-range videos when there are enough level-matched candidates', () => {
    const primary = catalogVideos.filter((video) => video.difficulty >= 2 && video.difficulty <= 4).slice(0, 26)
    const stretch = catalogVideos.filter((video) => video.difficulty === 5).slice(0, 8)
    const far = catalogVideos.filter((video) => video.difficulty === 6).slice(0, 4)

    const pool = getLevelAwareCandidateVideos([...primary, ...stretch, ...far], 'B1', {
      minimumPoolSize: 20,
      nearbyPoolRatio: 0.2,
      minimumNearbyCount: 3,
    })

    expect(pool.every((video) => video.difficulty <= 5)).toBe(true)
    expect(pool.some((video) => video.difficulty === 5)).toBe(true)
    expect(pool.some((video) => video.difficulty === 6)).toBe(false)
  })

  it('falls back to wider difficulty candidates when in-range pool is too small', () => {
    const primary = catalogVideos.filter((video) => video.difficulty >= 5 && video.difficulty <= 6).slice(0, 6)
    const nearby = catalogVideos.filter((video) => video.difficulty === 4).slice(0, 3)
    const far = catalogVideos.filter((video) => video.difficulty <= 3).slice(0, 2)

    const pool = getLevelAwareCandidateVideos([...primary, ...nearby, ...far], 'C2', {
      minimumPoolSize: 20,
    })

    expect(pool.length).toBe(11)
    expect(pool.some((video) => video.difficulty <= 3)).toBe(true)
  })
})
