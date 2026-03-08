import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCachedUserId, syncLike } from '@/lib/supabase/sync'

interface LikeState {
  likes: Record<string, boolean> // videoId -> liked
  toggleLike: (videoId: string) => void
  isLiked: (videoId: string) => boolean
  getLikeCount: () => number // total liked videos
  getLikedVideoIds: () => string[]
}

export const useLikeStore = create<LikeState>()(
  persist(
    (set, get) => ({
      likes: {},

      toggleLike: (videoId) => {
        const current = get().likes
        const isCurrentlyLiked = !!current[videoId]
        if (isCurrentlyLiked) {
          const rest = { ...current }
          delete rest[videoId]
          set({ likes: rest })
        } else {
          set({ likes: { ...current, [videoId]: true } })
        }

        // Fire-and-forget sync
        const userId = getCachedUserId()
        if (userId) {
          syncLike(userId, videoId, !isCurrentlyLiked).catch(() => {})
        }
      },

      isLiked: (videoId) => !!get().likes[videoId],

      getLikeCount: () => Object.keys(get().likes).length,

      getLikedVideoIds: () => Object.keys(get().likes),
    }),
    { name: 'studyeng-likes' }
  )
)
