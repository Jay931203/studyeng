'use client'

import { useState, useEffect } from 'react'

/**
 * Detects device orientation using matchMedia.
 * Returns { isLandscape: boolean }.
 *
 * On SSR / initial render, defaults to portrait (false) to avoid
 * hydration mismatch since the server cannot know the orientation.
 */
export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')

    // Set initial value on mount (client-side only)
    setIsLandscape(mql.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches)
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return { isLandscape }
}
