import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  hapticEnabled: boolean
  remoteEnabled: boolean
  setHapticEnabled: (enabled: boolean) => void
  setRemoteEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true,
      remoteEnabled: true,
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
      setRemoteEnabled: (remoteEnabled) => set({ remoteEnabled }),
    }),
    { name: 'studyeng-settings' },
  ),
)
