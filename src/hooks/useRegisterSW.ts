import { useEffect } from 'react'

/**
 * Registers /sw.js on mount (client-only).
 * Call this once from the root layout or a top-level client component.
 */
export function useRegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silently fail — push is a progressive enhancement
    })
  }, [])
}
