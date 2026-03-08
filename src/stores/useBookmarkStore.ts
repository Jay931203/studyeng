import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCachedUserId, syncBookmark } from '@/lib/supabase/sync'

interface BookmarkState {
  bookmarks: string[]
  toggleBookmark: (videoId: string) => void
  isBookmarked: (videoId: string) => boolean
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      toggleBookmark: (videoId) => {
        const current = get().bookmarks
        const isCurrentlyBookmarked = current.includes(videoId)

        if (isCurrentlyBookmarked) {
          set({ bookmarks: current.filter((id) => id !== videoId) })
        } else {
          set({ bookmarks: [...current, videoId] })
        }

        // Fire-and-forget sync
        const userId = getCachedUserId()
        if (userId) {
          syncBookmark(userId, videoId, !isCurrentlyBookmarked).catch(() => {})
        }
      },
      isBookmarked: (videoId) => get().bookmarks.includes(videoId),
    }),
    { name: 'studyeng-bookmarks' }
  )
)
