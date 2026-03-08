import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchRecord {
  videoId: string
  watchedAt: number // timestamp
}

interface WatchHistoryState {
  watchedEpisodes: Record<string, string[]> // seriesId -> array of videoIds
  viewCounts: Record<string, number> // videoId -> total view count
  watchedVideoIds: string[] // ordered list of watched videoIds (most recent first)
  watchRecords: WatchRecord[] // ordered by date (most recent first)
  markWatched: (seriesId: string, videoId: string) => void
  incrementViewCount: (videoId: string) => void
  getViewCount: (videoId: string) => number
  getSeriesProgress: (seriesId: string, totalEpisodes: number) => number
  getNextEpisode: (seriesId: string, allVideoIds: string[]) => string | null
  isWatched: (seriesId: string, videoId: string) => boolean
  isVideoEverWatched: (videoId: string) => boolean
  removeRecord: (videoId: string) => void
  clearAllHistory: () => void
}

export const useWatchHistoryStore = create<WatchHistoryState>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {},
      viewCounts: {},
      watchedVideoIds: [],
      watchRecords: [],

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
        const filtered = watchedList.filter((id) => id !== videoId)
        const records = get().watchRecords
        set({
          viewCounts: {
            ...get().viewCounts,
            [videoId]: current + 1,
          },
          watchedVideoIds: [videoId, ...filtered],
          watchRecords: [{ videoId, watchedAt: Date.now() }, ...records].slice(0, 200),
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

      removeRecord: (videoId) => {
        const { viewCounts, watchedVideoIds, watchRecords, watchedEpisodes } = get()
        const newCounts = { ...viewCounts }
        delete newCounts[videoId]
        const newEpisodes = { ...watchedEpisodes }
        for (const seriesId of Object.keys(newEpisodes)) {
          newEpisodes[seriesId] = newEpisodes[seriesId].filter((id) => id !== videoId)
        }
        set({
          viewCounts: newCounts,
          watchedVideoIds: watchedVideoIds.filter((id) => id !== videoId),
          watchRecords: watchRecords.filter((r) => r.videoId !== videoId),
          watchedEpisodes: newEpisodes,
        })
      },

      clearAllHistory: () => {
        set({
          viewCounts: {},
          watchedVideoIds: [],
          watchRecords: [],
          watchedEpisodes: {},
        })
      },
    }),
    { name: 'studyeng-watch-history' }
  )
)
