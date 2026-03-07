import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchHistoryState {
  watchedEpisodes: Record<string, string[]> // seriesId -> array of videoIds
  viewCounts: Record<string, number> // videoId -> total view count
  watchedVideoIds: string[] // ordered list of watched videoIds (most recent first)
  markWatched: (seriesId: string, videoId: string) => void
  incrementViewCount: (videoId: string) => void
  getViewCount: (videoId: string) => number
  getSeriesProgress: (seriesId: string, totalEpisodes: number) => number // returns 0-100
  getNextEpisode: (seriesId: string, allVideoIds: string[]) => string | null // returns next unwatched videoId
  isWatched: (seriesId: string, videoId: string) => boolean
  isVideoEverWatched: (videoId: string) => boolean
}

export const useWatchHistoryStore = create<WatchHistoryState>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {},
      viewCounts: {},
      watchedVideoIds: [],

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
        const watchedList = get().watchedVideoIds
        // Add to watched list (move to front if already exists)
        const filtered = watchedList.filter((id) => id !== videoId)
        set({
          viewCounts: {
            ...get().viewCounts,
            [videoId]: current + 1,
          },
          watchedVideoIds: [videoId, ...filtered],
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

      isVideoEverWatched: (videoId) => {
        return (get().viewCounts[videoId] ?? 0) > 0
      },
    }),
    { name: 'studyeng-watch-history' }
  )
)
