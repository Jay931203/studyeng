import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getCachedUserId,
  syncWatchHistoryItem,
  removeWatchHistoryItem,
  clearWatchHistoryServer,
} from '@/lib/supabase/sync'

interface WatchRecord {
  videoId: string
  watchedAt: number // timestamp
}

interface WatchHistoryState {
  watchedEpisodes: Record<string, string[]> // seriesId -> array of videoIds
  viewCounts: Record<string, number> // videoId -> total view count
  completionCounts: Record<string, number> // videoId -> completed play count
  watchedVideoIds: string[] // ordered list of watched videoIds (most recent first)
  watchRecords: WatchRecord[] // ordered by date (most recent first)
  deletedVideoIds: string[] // videoIds explicitly deleted by user (prevents auto-re-add from feed)
  markWatched: (seriesId: string, videoId: string) => void
  incrementViewCount: (videoId: string) => void
  recordCompletion: (videoId: string) => void
  getViewCount: (videoId: string) => number
  getSeriesProgress: (seriesId: string, totalEpisodes: number) => number
  getNextEpisode: (seriesId: string, allVideoIds: string[]) => string | null
  isWatched: (seriesId: string, videoId: string) => boolean
  isVideoEverWatched: (videoId: string) => boolean
  removeRecord: (videoId: string) => void
  clearDeletedFlag: (videoId: string) => void
  clearAllHistory: () => void
}

export const useWatchHistoryStore = create<WatchHistoryState>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {},
      viewCounts: {},
      completionCounts: {},
      watchedVideoIds: [],
      watchRecords: [],
      deletedVideoIds: [],

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
        // Skip if user explicitly deleted this video from history
        if (get().deletedVideoIds.includes(videoId)) return

        const current = get().viewCounts[videoId] ?? 0
        const newCount = current + 1
        const watchedList = get().watchedVideoIds
        const filtered = watchedList.filter((id) => id !== videoId)
        const records = get().watchRecords
        set({
          viewCounts: {
            ...get().viewCounts,
            [videoId]: newCount,
          },
          watchedVideoIds: [videoId, ...filtered],
          watchRecords: [{ videoId, watchedAt: Date.now() }, ...records].slice(0, 200),
        })

        // Fire-and-forget sync
        const userId = getCachedUserId()
        if (userId) {
          const completionCount = get().completionCounts[videoId] ?? 0
          syncWatchHistoryItem(userId, videoId, newCount, completionCount).catch(() => {})
        }
      },

      recordCompletion: (videoId) => {
        if (get().deletedVideoIds.includes(videoId)) return

        const current = get().completionCounts[videoId] ?? 0
        const nextCount = current + 1
        set({
          completionCounts: {
            ...get().completionCounts,
            [videoId]: nextCount,
          },
        })

        const userId = getCachedUserId()
        if (userId) {
          const viewCount = get().viewCounts[videoId] ?? 0
          syncWatchHistoryItem(userId, videoId, viewCount, nextCount).catch(() => {})
        }
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
        const {
          completionCounts,
          viewCounts,
          watchedVideoIds,
          watchRecords,
          watchedEpisodes,
          deletedVideoIds,
        } = get()
        const newCounts = { ...viewCounts }
        const newCompletionCounts = { ...completionCounts }
        delete newCounts[videoId]
        delete newCompletionCounts[videoId]
        const newEpisodes = { ...watchedEpisodes }
        for (const seriesId of Object.keys(newEpisodes)) {
          newEpisodes[seriesId] = newEpisodes[seriesId].filter((id) => id !== videoId)
        }
        set({
          completionCounts: newCompletionCounts,
          viewCounts: newCounts,
          watchedVideoIds: watchedVideoIds.filter((id) => id !== videoId),
          watchRecords: watchRecords.filter((r) => r.videoId !== videoId),
          watchedEpisodes: newEpisodes,
          deletedVideoIds: deletedVideoIds.includes(videoId)
            ? deletedVideoIds
            : [...deletedVideoIds, videoId],
        })

        // Fire-and-forget sync
        const userId = getCachedUserId()
        if (userId) {
          removeWatchHistoryItem(userId, videoId).catch(() => {})
        }
      },

      // Call when user explicitly taps to watch a video (e.g., from Explore page)
      // to allow it to re-appear in history
      clearDeletedFlag: (videoId) => {
        set({
          deletedVideoIds: get().deletedVideoIds.filter((id) => id !== videoId),
        })
      },

      clearAllHistory: () => {
        const allWatchedIds = get().watchedVideoIds
        set({
          completionCounts: {},
          viewCounts: {},
          watchedVideoIds: [],
          watchRecords: [],
          watchedEpisodes: {},
          deletedVideoIds: [...new Set([...get().deletedVideoIds, ...allWatchedIds])],
        })

        // Fire-and-forget sync
        const userId = getCachedUserId()
        if (userId) {
          clearWatchHistoryServer(userId).catch(() => {})
        }
      },
    }),
    { name: 'studyeng-watch-history' }
  )
)
