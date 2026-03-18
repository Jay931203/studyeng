import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  hapticEnabled: boolean
  remoteEnabled: boolean
  primingEnabled: boolean
  primingAutoStartEnabled: boolean
  subtitleGuidesEnabled: boolean
  smartSubtitlesEnabled: boolean
  learnSubtitleMode: 'en' | 'bilingual' | 'locked'
  setHapticEnabled: (enabled: boolean) => void
  setRemoteEnabled: (enabled: boolean) => void
  setPrimingEnabled: (enabled: boolean) => void
  setPrimingAutoStartEnabled: (enabled: boolean) => void
  setSubtitleGuidesEnabled: (enabled: boolean) => void
  setSmartSubtitlesEnabled: (enabled: boolean) => void
  setLearnSubtitleMode: (mode: 'en' | 'bilingual' | 'locked') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true,
      remoteEnabled: true,
      primingEnabled: true,
      primingAutoStartEnabled: true,
      subtitleGuidesEnabled: true,
      smartSubtitlesEnabled: false,
      learnSubtitleMode: 'en',
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
      setRemoteEnabled: (remoteEnabled) => set({ remoteEnabled }),
      setPrimingEnabled: (primingEnabled) => set({ primingEnabled }),
      setPrimingAutoStartEnabled: (primingAutoStartEnabled) => set({ primingAutoStartEnabled }),
      setSubtitleGuidesEnabled: (subtitleGuidesEnabled) => set({ subtitleGuidesEnabled }),
      setSmartSubtitlesEnabled: (smartSubtitlesEnabled) => set({ smartSubtitlesEnabled }),
      setLearnSubtitleMode: (learnSubtitleMode) => set({ learnSubtitleMode }),
    }),
    { name: 'studyeng-settings' },
  ),
)
