import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncRecommendationSignal } from '@/lib/supabase/opsSync'
import { getCachedUserId } from '@/lib/supabase/sync'

export interface VideoBehaviorSignal {
  impressions: number
  completions: number
  skips: number
  totalCompletionRatio: number
  lastInteractedAt: number
}

interface RecommendationState {
  recentVideoIds: string[]
  videoSignals: Record<string, VideoBehaviorSignal>
  registerImpression: (videoId: string) => void
  recordCompletion: (videoId: string) => void
  recordSkip: (videoId: string, completionRatio: number) => void
  clearRecommendationSignals: () => void
}

const MAX_RECENT_VIDEO_IDS = 40

function clampCompletionRatio(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function pushRecentVideoIds(recentVideoIds: string[], videoId: string) {
  return [videoId, ...recentVideoIds.filter((id) => id !== videoId)].slice(0, MAX_RECENT_VIDEO_IDS)
}

function getVideoSignal(
  videoSignals: Record<string, VideoBehaviorSignal>,
  videoId: string,
): VideoBehaviorSignal {
  return (
    videoSignals[videoId] ?? {
      impressions: 0,
      completions: 0,
      skips: 0,
      totalCompletionRatio: 0,
      lastInteractedAt: 0,
    }
  )
}

export const useRecommendationStore = create<RecommendationState>()(
  persist(
    (set) => ({
      recentVideoIds: [],
      videoSignals: {},

      registerImpression: (videoId) =>
        set((state) => {
          const now = Date.now()
          const current = getVideoSignal(state.videoSignals, videoId)
          const nextSignal = {
            ...current,
            impressions: current.impressions + 1,
            lastInteractedAt: now,
          }
          const userId = getCachedUserId()

          if (userId) {
            syncRecommendationSignal(userId, videoId, nextSignal).catch(() => {})
          }

          return {
            recentVideoIds: pushRecentVideoIds(state.recentVideoIds, videoId),
            videoSignals: {
              ...state.videoSignals,
              [videoId]: nextSignal,
            },
          }
        }),

      recordCompletion: (videoId) =>
        set((state) => {
          const now = Date.now()
          const current = getVideoSignal(state.videoSignals, videoId)
          const nextSignal = {
            ...current,
            completions: current.completions + 1,
            totalCompletionRatio: current.totalCompletionRatio + 1,
            lastInteractedAt: now,
          }
          const userId = getCachedUserId()

          if (userId) {
            syncRecommendationSignal(userId, videoId, nextSignal).catch(() => {})
          }

          return {
            recentVideoIds: pushRecentVideoIds(state.recentVideoIds, videoId),
            videoSignals: {
              ...state.videoSignals,
              [videoId]: nextSignal,
            },
          }
        }),

      recordSkip: (videoId, completionRatio) =>
        set((state) => {
          const now = Date.now()
          const normalizedRatio = clampCompletionRatio(completionRatio)
          const current = getVideoSignal(state.videoSignals, videoId)
          const userId = getCachedUserId()

          if (normalizedRatio >= 0.9) {
            const nextSignal = {
              ...current,
              completions: current.completions + 1,
              totalCompletionRatio: current.totalCompletionRatio + normalizedRatio,
              lastInteractedAt: now,
            }

            if (userId) {
              syncRecommendationSignal(userId, videoId, nextSignal).catch(() => {})
            }

            return {
              recentVideoIds: pushRecentVideoIds(state.recentVideoIds, videoId),
              videoSignals: {
                ...state.videoSignals,
                [videoId]: nextSignal,
              },
            }
          }

          const nextSignal = {
            ...current,
            skips: current.skips + 1,
            totalCompletionRatio: current.totalCompletionRatio + normalizedRatio,
            lastInteractedAt: now,
          }

          if (userId) {
            syncRecommendationSignal(userId, videoId, nextSignal).catch(() => {})
          }

          return {
            recentVideoIds: pushRecentVideoIds(state.recentVideoIds, videoId),
            videoSignals: {
              ...state.videoSignals,
              [videoId]: nextSignal,
            },
          }
        }),

      clearRecommendationSignals: () =>
        set({
          recentVideoIds: [],
          videoSignals: {},
        }),
    }),
    {
      name: 'studyeng-recommendation-signals',
    },
  ),
)
