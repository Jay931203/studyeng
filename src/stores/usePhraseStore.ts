import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
          return {
            phrases: [
              {
                ...phrase,
                id: crypto.randomUUID(),
                savedAt: Date.now(),
                reviewCount: 0,
              },
              ...state.phrases,
            ],
          }
        }),

      removePhrase: (id) =>
        set((state) => ({
          phrases: state.phrases.filter((p) => p.id !== id),
        })),

      incrementReview: (id) =>
        set((state) => ({
          phrases: state.phrases.map((p) =>
            p.id === id ? { ...p, reviewCount: p.reviewCount + 1 } : p
          ),
        })),
    }),
    { name: 'studyeng-phrases' }
  )
)
