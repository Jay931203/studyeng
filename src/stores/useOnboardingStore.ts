import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasOnboarded: boolean
  interests: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
  dailyGoal: number
  completeOnboarding: () => void
  setInterests: (interests: string[]) => void
  setLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void
  setDailyGoal: (goal: number) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      interests: [],
      level: 'beginner',
      dailyGoal: 5,
      completeOnboarding: () => set({ hasOnboarded: true }),
      setInterests: (interests) => set({ interests }),
      setLevel: (level) => set({ level }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
    }),
    { name: 'studyeng-onboarding' }
  )
)
