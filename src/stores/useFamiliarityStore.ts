import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FamiliarityEntry {
  count: number
  lastMarkedAt: number
}

interface FamiliarityState {
  entries: { [exprId: string]: FamiliarityEntry }
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
  markFamiliar: (exprId: string) => void
  getFamiliarCount: (exprId: string) => number
  isFamiliar: (exprId: string) => boolean
  resetFamiliarity: (exprId: string) => void
  resetState: () => void
}

export const useFamiliarityStore = create<FamiliarityState>()(
  persist(
    (set, get) => ({
      entries: {},
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      markFamiliar: (exprId) => {
        const current = get().entries[exprId]
        set({
          entries: {
            ...get().entries,
            [exprId]: {
              count: (current?.count ?? 0) + 1,
              lastMarkedAt: Date.now(),
            },
          },
        })
      },
      getFamiliarCount: (exprId) => {
        return get().entries[exprId]?.count ?? 0
      },
      isFamiliar: (exprId) => {
        return (get().entries[exprId]?.count ?? 0) >= 3
      },
      resetFamiliarity: (exprId) => {
        const nextEntries = { ...get().entries }
        delete nextEntries[exprId]
        set({ entries: nextEntries })
      },
      resetState: () =>
        set((state) => ({
          entries: {},
          hydrated: state.hydrated,
        })),
    }),
    {
      name: 'studyeng-familiarity',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
