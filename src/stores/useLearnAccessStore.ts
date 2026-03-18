import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface LearnAccessState {
  activeSessionDate: string | null
  activeClassId: string | null
  activateClassForToday: (classId: string) => void
  canAccessClassToday: (classId: string, isPremium: boolean) => boolean
  isClassActiveToday: (classId: string) => boolean
  hasFreeSessionRemaining: (isPremium: boolean) => boolean
  getActiveClassForToday: () => string | null
  resetState: () => void
}

export const useLearnAccessStore = create<LearnAccessState>()(
  persist(
    (set, get) => ({
      activeSessionDate: null,
      activeClassId: null,

      activateClassForToday: (classId) => {
        set({
          activeSessionDate: getTodayKey(),
          activeClassId: classId,
        })
      },

      canAccessClassToday: (classId, isPremium) => {
        if (isPremium) return true

        const state = get()
        const today = getTodayKey()

        if (state.activeSessionDate !== today || !state.activeClassId) {
          return true
        }

        return state.activeClassId === classId
      },

      isClassActiveToday: (classId) => {
        const state = get()
        return state.activeSessionDate === getTodayKey() && state.activeClassId === classId
      },

      hasFreeSessionRemaining: (isPremium) => {
        if (isPremium) return true

        const state = get()
        return state.activeSessionDate !== getTodayKey() || !state.activeClassId
      },

      getActiveClassForToday: () => {
        const state = get()
        if (state.activeSessionDate !== getTodayKey()) return null
        return state.activeClassId
      },

      resetState: () =>
        set({
          activeSessionDate: null,
          activeClassId: null,
        }),
    }),
    {
      name: 'studyeng-learn-access',
      version: 1,
    },
  ),
)
