import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { debouncedSyncProfile } from '@/lib/supabase/sync'
import type { CefrLevel } from '@/types/level'
import { LEGACY_LEVEL_MIGRATION } from '@/types/level'

interface OnboardingState {
  hasOnboarded: boolean
  hasSeenWelcome: boolean
  hydrated: boolean
  interests: string[]
  level: CefrLevel
  dailyGoal: number
  completeOnboarding: () => void
  markWelcomeSeen: () => void
  setHydrated: (hydrated: boolean) => void
  setInterests: (interests: string[]) => void
  setLevel: (level: CefrLevel) => void
  setDailyGoal: (goal: number) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hasSeenWelcome: false,
      hydrated: false,
      interests: [],
      level: 'A1',
      dailyGoal: 5,
      completeOnboarding: () => {
        set({ hasOnboarded: true, hasSeenWelcome: true })
        debouncedSyncProfile()
      },
      markWelcomeSeen: () => set({ hasSeenWelcome: true }),
      setHydrated: (hydrated) => set({ hydrated }),
      setInterests: (interests) => {
        set({ interests })
        debouncedSyncProfile()
      },
      setLevel: (level) => {
        set({ level })
        debouncedSyncProfile()
      },
      setDailyGoal: (goal) => {
        set({ dailyGoal: goal })
        debouncedSyncProfile()
      },
    }),
    {
      name: 'studyeng-onboarding',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
      // Migrate old 3-level values to CEFR 6-level
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>
        if (state.level && typeof state.level === 'string' && state.level in LEGACY_LEVEL_MIGRATION) {
          state.level = LEGACY_LEVEL_MIGRATION[state.level]
        }
        return state as unknown as OnboardingState
      },
      version: 1,
    }
  )
)
