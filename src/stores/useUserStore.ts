import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shouldUpdateStreak } from '@/lib/gamification'

interface UserState {
  level: number
  xp: number
  streakDays: number
  lastActivityDate: string | null // ISO string, persisted
  showLevelUp: boolean

  setUser: (data: { level: number; xp: number; streakDays: number }) => void
  gainXp: (amount: number) => void
  checkAndUpdateStreak: () => void
  dismissLevelUp: () => void
}

export const useUserStore = create<UserState>()(persist((set, get) => ({
  level: 1,
  xp: 0,
  streakDays: 0,
  lastActivityDate: null,
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

  checkAndUpdateStreak: () => {
    const { lastActivityDate, streakDays } = get()
    const now = new Date()
    const lastDate = lastActivityDate ? new Date(lastActivityDate) : null
    const result = shouldUpdateStreak(lastDate, now)

    if (result === true) {
      // New day (consecutive) or first activity ever: increment streak
      set({
        streakDays: streakDays + 1,
        lastActivityDate: now.toISOString(),
      })
    } else if (result === 'reset') {
      // Missed a day or more: reset streak to 1 (today counts)
      set({
        streakDays: 1,
        lastActivityDate: now.toISOString(),
      })
    }
    // result === false means same day, no update needed
  },

  dismissLevelUp: () => set({ showLevelUp: false }),
}), { name: 'studyeng-user' }))
