import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  hapticEnabled: boolean
  setHapticEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true,
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
    }),
    { name: 'studyeng-settings' },
  ),
)
