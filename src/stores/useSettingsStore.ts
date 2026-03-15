import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  hapticEnabled: boolean
  remoteEnabled: boolean
  primingEnabled: boolean
  primingAutoStartEnabled: boolean
  subtitleGuidesEnabled: boolean
  setHapticEnabled: (enabled: boolean) => void
  setRemoteEnabled: (enabled: boolean) => void
  setPrimingEnabled: (enabled: boolean) => void
  setPrimingAutoStartEnabled: (enabled: boolean) => void
  setSubtitleGuidesEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true,
      remoteEnabled: true,
      primingEnabled: true,
      primingAutoStartEnabled: true,
      subtitleGuidesEnabled: true,
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
      setRemoteEnabled: (remoteEnabled) => set({ remoteEnabled }),
      setPrimingEnabled: (primingEnabled) => set({ primingEnabled }),
      setPrimingAutoStartEnabled: (primingAutoStartEnabled) => set({ primingAutoStartEnabled }),
      setSubtitleGuidesEnabled: (subtitleGuidesEnabled) => set({ subtitleGuidesEnabled }),
    }),
    { name: 'studyeng-settings' },
  ),
)
