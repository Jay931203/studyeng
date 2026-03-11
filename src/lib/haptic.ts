import { useSettingsStore } from '@/stores/useSettingsStore'

export function triggerHaptic(pattern: number | number[] = 40) {
  if (!useSettingsStore.getState().hapticEnabled) return
  try {
    navigator?.vibrate?.(pattern)
  } catch {
    // Vibration API not available
  }
}
