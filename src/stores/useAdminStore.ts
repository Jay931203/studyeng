import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SubtitleFlag {
  videoId: string
  entryIndex: number
  en: string
  flaggedAt: string
}

interface AdminState {
  isAdmin: boolean
  setAdmin: (val: boolean) => void
  flaggedSubtitles: SubtitleFlag[]
  toggleFlag: (videoId: string, entryIndex: number, en: string) => void
  isFlagged: (videoId: string, entryIndex: number) => boolean
  clearFlags: () => void
  exportFlags: () => string
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAdmin: false,

      setAdmin: (val) => set({ isAdmin: val }),

      flaggedSubtitles: [],

      toggleFlag: (videoId, entryIndex, en) =>
        set((state) => {
          const exists = state.flaggedSubtitles.some(
            (f) => f.videoId === videoId && f.entryIndex === entryIndex
          )
          if (exists) {
            return {
              flaggedSubtitles: state.flaggedSubtitles.filter(
                (f) => !(f.videoId === videoId && f.entryIndex === entryIndex)
              ),
            }
          }
          return {
            flaggedSubtitles: [
              ...state.flaggedSubtitles,
              {
                videoId,
                entryIndex,
                en,
                flaggedAt: new Date().toISOString(),
              },
            ],
          }
        }),

      isFlagged: (videoId, entryIndex) =>
        get().flaggedSubtitles.some(
          (f) => f.videoId === videoId && f.entryIndex === entryIndex
        ),

      clearFlags: () => set({ flaggedSubtitles: [] }),

      exportFlags: () => JSON.stringify(get().flaggedSubtitles, null, 2),
    }),
    { name: 'admin-store' }
  )
)
