'use client'

import { useMemo } from 'react'
import { getCachedVideoComprehension, hasEnoughExpressions } from '@/lib/comprehension'
import { useSceneCompleteReward } from '@/hooks/useSceneComplete'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'

interface ComprehensionBadgeProps {
  videoId: string
  /** Compact mode uses smaller text, suitable for inline placement */
  compact?: boolean
  className?: string
}

/**
 * Mini progress arc + "known/total" badge showing how many expressions
 * in a video the user has learned.
 *
 * Only renders if the video has 3+ unique expressions.
 */
export function ComprehensionBadge({ videoId, compact = false, className = '' }: ComprehensionBadgeProps) {
  const entries = useFamiliarityStore((s) => s.entries)

  // Use entries key count as a cheap version signal for cache invalidation
  const familiarityVersion = Object.keys(entries).length

  const show = useMemo(() => hasEnoughExpressions(videoId), [videoId])

  const comprehension = useMemo(
    () => (show ? getCachedVideoComprehension(videoId, familiarityVersion) : null),
    [show, videoId, familiarityVersion],
  )

  if (!show || !comprehension || comprehension.total < 3) return null

  const { known, total, percentage } = comprehension
  const isComplete = percentage === 100

  // Color: green (>70%), yellow (40-70%), gray (<40%)
  let arcColor: string
  let textColor: string
  if (percentage > 70) {
    arcColor = '#22c55e' // green-500
    textColor = '#22c55e'
  } else if (percentage >= 40) {
    arcColor = '#eab308' // yellow-500
    textColor = '#eab308'
  } else {
    arcColor = '#9ca3af' // gray-400
    textColor = '#9ca3af'
  }

  if (isComplete) {
    arcColor = '#22c55e'
    textColor = '#22c55e'
  }

  // SVG mini progress arc
  const size = compact ? 18 : 22
  const strokeWidth = compact ? 2 : 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (percentage / 100) * circumference

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <span
        className={`font-semibold leading-none ${compact ? 'text-[9px]' : 'text-[10px]'}`}
        style={{ color: textColor }}
      >
        {isComplete ? 'CLEAR' : `${known}/${total}`}
      </span>
    </div>
  )
}

/**
 * "Scene Complete" badge shown when 100% expressions are known.
 * Awards bonus XP on first display.
 */
export function SceneCompleteBadge({ videoId, className = '' }: { videoId: string; className?: string }) {
  const entries = useFamiliarityStore((s) => s.entries)
  const familiarityVersion = Object.keys(entries).length

  const show = useMemo(() => hasEnoughExpressions(videoId), [videoId])
  const comprehension = useMemo(
    () => (show ? getCachedVideoComprehension(videoId, familiarityVersion) : null),
    [show, videoId, familiarityVersion],
  )

  // Award bonus XP when scene is first completed
  useSceneCompleteReward(videoId)

  if (!comprehension || comprehension.percentage < 100) return null

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${className}`}
      style={{
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[10px] font-semibold leading-none" style={{ color: '#22c55e' }}>
        SCENE COMPLETE
      </span>
    </div>
  )
}
