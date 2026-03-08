import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { debouncedSyncProfile } from '@/lib/supabase/sync'

interface OnboardingState {
  hasOnboarded: boolean
  hasSeenWelcome: boolean
  hydrated: boolean
  interests: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
  dailyGoal: number
  completeOnboarding: () => void
  markWelcomeSeen: () => void
  setHydrated: (hydrated: boolean) => void
  setInterests: (interests: string[]) => void
  setLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void
  setDailyGoal: (goal: number) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hasSeenWelcome: false,
      hydrated: false,
      interests: [],
      level: 'beginner',
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
    }
  )
)
