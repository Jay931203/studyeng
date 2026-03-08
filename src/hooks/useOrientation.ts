'use client'

import { useSyncExternalStore } from 'react'

const ORIENTATION_QUERY = '(orientation: landscape)'

function subscribe(listener: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const mediaQuery = window.matchMedia(ORIENTATION_QUERY)
  const handleChange = () => listener()

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }

  mediaQuery.addListener(handleChange)
  return () => mediaQuery.removeListener(handleChange)
}

function getSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  const matches = window.matchMedia(ORIENTATION_QUERY).matches
  const compactViewport = window.innerWidth <= 1180 || window.innerHeight <= 900

  return matches && compactViewport
}

/**
 * Detects device orientation using matchMedia.
 * Returns { isLandscape: boolean }.
 *
 * On SSR, defaults to portrait because the server cannot know
 * the client's current orientation.
 */
export function useOrientation() {
  const isLandscape = useSyncExternalStore(subscribe, getSnapshot, () => false)

  return { isLandscape }
}
