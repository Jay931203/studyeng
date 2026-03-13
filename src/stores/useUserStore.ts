import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shouldUpdateStreak } from '@/lib/gamification'
import { debouncedSyncProfile } from '@/lib/supabase/sync'

interface UserState {
  level: number
  xp: number
  streakDays: number
  lastActivityDate: string | null // ISO string, persisted
  showLevelUp: boolean
  totalXpEarned: number // lifetime reward XP earned (never resets on level-up)

  setUser: (data: { level: number; xp: number; streakDays: number }) => void
  gainXp: (amount: number) => void
  checkAndUpdateStreak: () => void
  dismissLevelUp: () => void
  getTotalXP: () => number
}

export const useUserStore = create<UserState>()(persist((set, get) => ({
  level: 1,
  xp: 0,
  streakDays: 0,
  lastActivityDate: null,
  showLevelUp: false,
  totalXpEarned: 0,

  setUser: (data) => {
    set(data)
    debouncedSyncProfile()
  },

  gainXp: (amount) => {
    if (amount <= 0) return
    const { level, xp, totalXpEarned } = get()
    const xpForLevel = level * 100
    const newXp = xp + amount
    const newTotal = totalXpEarned + amount

    if (newXp >= xpForLevel) {
      set({
        level: level + 1,
        xp: newXp - xpForLevel,
        showLevelUp: true,
        totalXpEarned: newTotal,
      })
    } else {
      set({ xp: newXp, totalXpEarned: newTotal })
    }
    debouncedSyncProfile()
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
      debouncedSyncProfile()
    } else if (result === 'reset') {
      // Missed a day or more: reset streak to 1 (today counts)
      set({
        streakDays: 1,
        lastActivityDate: now.toISOString(),
      })
      debouncedSyncProfile()
    }
    // result === false means same day, no update needed
  },

  dismissLevelUp: () => set({ showLevelUp: false }),

  /**
   * Returns total lifetime reward XP earned across all sources.
   * This is the cumulative sum, not affected by level-up resets.
   */
  getTotalXP: () => {
    const { totalXpEarned, level, xp } = get()
    // If totalXpEarned is 0 but user has level/xp, compute from those (migration)
    if (totalXpEarned === 0 && (level > 1 || xp > 0)) {
      // Sum of XP required for all previous levels + current xp
      let sum = 0
      for (let i = 1; i < level; i++) {
        sum += i * 100
      }
      return sum + xp
    }
    return totalXpEarned
  },
}), { name: 'studyeng-user' }))
