import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchHistoryState {
  watchedEpisodes: Record<string, string[]> // seriesId -> array of videoIds
  viewCounts: Record<string, number> // videoId -> total view count
  markWatched: (seriesId: string, videoId: string) => void
  incrementViewCount: (videoId: string) => void
  getViewCount: (videoId: string) => number
  getSeriesProgress: (seriesId: string, totalEpisodes: number) => number // returns 0-100
  getNextEpisode: (seriesId: string, allVideoIds: string[]) => string | null // returns next unwatched videoId
  isWatched: (seriesId: string, videoId: string) => boolean
}

export const useWatchHistoryStore = create<WatchHistoryState>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {},
      viewCounts: {},

      markWatched: (seriesId, videoId) => {
        const current = get().watchedEpisodes[seriesId] ?? []
        if (current.includes(videoId)) return
        set({
          watchedEpisodes: {
            ...get().watchedEpisodes,
            [seriesId]: [...current, videoId],
          },
        })
      },

      incrementViewCount: (videoId) => {
        const current = get().viewCounts[videoId] ?? 0
        set({
          viewCounts: {
            ...get().viewCounts,
            [videoId]: current + 1,
          },
        })
      },

      getViewCount: (videoId) => {
        return get().viewCounts[videoId] ?? 0
      },

      getSeriesProgress: (seriesId, totalEpisodes) => {
        const watched = get().watchedEpisodes[seriesId] ?? []
        if (totalEpisodes === 0) return 0
        return Math.round((watched.length / totalEpisodes) * 100)
      },

      getNextEpisode: (seriesId, allVideoIds) => {
        const watched = get().watchedEpisodes[seriesId] ?? []
        return allVideoIds.find((id) => !watched.includes(id)) ?? null
      },

      isWatched: (seriesId, videoId) => {
        const watched = get().watchedEpisodes[seriesId] ?? []
        return watched.includes(videoId)
      },
    }),
    { name: 'studyeng-watch-history' }
  )
)
