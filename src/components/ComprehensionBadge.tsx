'use client'

import { useMemo } from 'react'
import { getCachedVideoComprehension, hasEnoughExpressions } from '@/lib/comprehension'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'

interface ComprehensionBadgeProps {
  videoId: string
  /** Compact mode uses smaller text, suitable for inline placement */
  compact?: boolean
  className?: string
}

/**
 * Thin 2px progress arc that wraps the bottom of a thumbnail,
 * indicating how many expressions in a video the user has learned.
 *
 * Colors: green (>70%), amber/yellow (40-70%), default border color (<40%)
 * No text, no numbers — just the arc fill.
 * Only renders if the video has 3+ unique expressions.
 */
export function ComprehensionBadge({ videoId, className = '' }: ComprehensionBadgeProps) {
  const entries = useFamiliarityStore((s) => s.entries)

  // Use entries key count as a cheap version signal for cache invalidation
  const familiarityVersion = Object.keys(entries).length

  const show = useMemo(() => hasEnoughExpressions(videoId), [videoId])

  const comprehension = useMemo(
    () => (show ? getCachedVideoComprehension(videoId, familiarityVersion) : null),
    [show, videoId, familiarityVersion],
  )

  if (!show || !comprehension || comprehension.total < 3) return null

  const { percentage } = comprehension

  // Don't show arc if 0%
  if (percentage === 0) return null

  // Color: green (>70%), amber/yellow (40-70%), default muted (<40%)
  let arcColor: string
  if (percentage > 70) {
    arcColor = '#22c55e' // green-500
  } else if (percentage >= 40) {
    arcColor = '#eab308' // yellow-500
  } else {
    arcColor = 'rgba(255, 255, 255, 0.25)'
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden ${className}`}
      style={{ borderRadius: '0 0 inherit inherit' }}
    >
      {/* Background track */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
      />
      {/* Progress fill */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${percentage}%`,
          backgroundColor: arcColor,
          transition: 'width 0.4s ease, background-color 0.3s ease',
        }}
      />
    </div>
  )
}
