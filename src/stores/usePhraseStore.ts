import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getCachedUserId,
  syncSavedPhrase,
  removeSavedPhraseServer,
  debouncedSyncPhraseReview,
} from '@/lib/supabase/sync'

export interface SavedPhrase {
  id: string
  videoId: string
  videoTitle: string
  en: string
  ko: string
  timestampStart: number
  timestampEnd: number
  savedAt: number
  reviewCount: number
}

interface PhraseState {
  phrases: SavedPhrase[]
  savePhrase: (phrase: Omit<SavedPhrase, 'id' | 'savedAt' | 'reviewCount'>) => void
  removePhrase: (id: string) => void
  incrementReview: (id: string) => void
}

export const usePhraseStore = create<PhraseState>()(
  persist(
    (set) => ({
      phrases: [],

      savePhrase: (phrase) =>
        set((state) => {
          // Prevent duplicate: same video + same English text
          const exists = state.phrases.some(
            (p) => p.videoId === phrase.videoId && p.en === phrase.en
          )
          if (exists) return state

          const newPhrase: SavedPhrase = {
            ...phrase,
            id: crypto.randomUUID(),
            savedAt: Date.now(),
            reviewCount: 0,
          }

          // Fire-and-forget sync
          const userId = getCachedUserId()
          if (userId) {
            syncSavedPhrase(userId, newPhrase).catch(() => {})
          }

          return {
            phrases: [newPhrase, ...state.phrases],
          }
        }),

      removePhrase: (id) => {
        // Fire-and-forget sync
        const userId = getCachedUserId()
        if (userId) {
          removeSavedPhraseServer(userId, id).catch(() => {})
        }

        set((state) => ({
          phrases: state.phrases.filter((p) => p.id !== id),
        }))
      },

      incrementReview: (id) =>
        set((state) => {
          const updated = state.phrases.map((p) =>
            p.id === id ? { ...p, reviewCount: p.reviewCount + 1 } : p
          )
          const phrase = updated.find((p) => p.id === id)
          if (phrase) {
            debouncedSyncPhraseReview(id, phrase.reviewCount)
          }
          return { phrases: updated }
        }),
    }),
    { name: 'studyeng-phrases' }
  )
)
