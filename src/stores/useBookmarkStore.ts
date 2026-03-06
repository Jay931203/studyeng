import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        if (current.includes(videoId)) {
          set({ bookmarks: current.filter((id) => id !== videoId) })
        } else {
          set({ bookmarks: [...current, videoId] })
        }
      },
      isBookmarked: (videoId) => get().bookmarks.includes(videoId),
    }),
    { name: 'studyeng-bookmarks' }
  )
)
