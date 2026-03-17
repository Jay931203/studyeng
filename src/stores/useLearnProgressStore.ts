'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LearnClassProgress {
  lastIndex: number
  total: number
  updatedAt: string
}

interface LearnProgressState {
  classProgress: Record<string, LearnClassProgress>
  saveClassProgress: (classId: string, lastIndex: number, total: number) => void
  clearClassProgress: (classId: string) => void
}

export const useLearnProgressStore = create<LearnProgressState>()(
  persist(
    (set) => ({
      classProgress: {},
      saveClassProgress: (classId, lastIndex, total) =>
        set((state) => ({
          classProgress: {
            ...state.classProgress,
            [classId]: {
              lastIndex,
              total,
              updatedAt: new Date().toISOString(),
            },
          },
        })),
      clearClassProgress: (classId) =>
        set((state) => {
          const next = { ...state.classProgress }
          delete next[classId]
          return { classProgress: next }
        }),
    }),
    {
      name: 'studyeng-learn-progress',
      version: 1,
    },
  ),
)
