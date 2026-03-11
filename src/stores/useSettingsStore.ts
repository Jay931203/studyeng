import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  hapticEnabled: boolean
  remoteEnabled: boolean
  primingEnabled: boolean
  setHapticEnabled: (enabled: boolean) => void
  setRemoteEnabled: (enabled: boolean) => void
  setPrimingEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true,
      remoteEnabled: true,
      primingEnabled: true,
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
      setRemoteEnabled: (remoteEnabled) => set({ remoteEnabled }),
      setPrimingEnabled: (primingEnabled) => set({ primingEnabled }),
    }),
    { name: 'studyeng-settings' },
  ),
)
