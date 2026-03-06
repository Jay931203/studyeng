import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  level: number
  xp: number
  streakDays: number
  showLevelUp: boolean

  setUser: (data: { level: number; xp: number; streakDays: number }) => void
  gainXp: (amount: number) => void
  dismissLevelUp: () => void
}

export const useUserStore = create<UserState>()(persist((set, get) => ({
  level: 1,
  xp: 0,
  streakDays: 0,
  showLevelUp: false,

  setUser: (data) => set(data),

  gainXp: (amount) => {
    const { level, xp } = get()
    const xpForLevel = level * 100
    const newXp = xp + amount

    if (newXp >= xpForLevel) {
      set({
        level: level + 1,
        xp: newXp - xpForLevel,
        showLevelUp: true,
      })
    } else {
      set({ xp: newXp })
    }
  },

  dismissLevelUp: () => set({ showLevelUp: false }),
}), { name: 'studyeng-user' }))
