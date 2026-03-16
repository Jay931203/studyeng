'use client'

import { useCallback } from 'react'
import { useReplayStore } from '@/stores/useReplayStore'

interface ExpressionReplayButtonProps {
  videoId: string
  start: number
  end: number
  expressionText?: string
  size?: 'sm' | 'md'
  className?: string
}

export function ExpressionReplayButton({
  videoId,
  start,
  end,
  expressionText,
  size = 'sm',
  className = '',
}: ExpressionReplayButtonProps) {
  const currentClip = useReplayStore((s) => s.clip)
  const isPlaying = useReplayStore((s) => s.isPlaying)
  const play = useReplayStore((s) => s.play)
  const stop = useReplayStore((s) => s.stop)

  const isThisPlaying =
    isPlaying &&
    currentClip?.videoId === videoId &&
    currentClip?.start === start &&
    currentClip?.end === end

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isThisPlaying) {
        stop()
      } else {
        play({ videoId, start, end, expressionText })
      }
    },
    [isThisPlaying, play, stop, videoId, start, end, expressionText],
  )

  const sizeClasses = size === 'md'
    ? 'h-9 w-9'
    : 'h-7 w-7'

  const iconSize = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center justify-center rounded-full transition-all active:scale-90 ${sizeClasses} ${className}`}
      style={{
        backgroundColor: isThisPlaying
          ? 'rgba(var(--accent-primary-rgb), 0.2)'
          : 'var(--bg-elevated, rgba(255, 255, 255, 0.08))',
      }}
      aria-label={isThisPlaying ? 'Stop replay' : 'Play clip'}
    >
      {isThisPlaying ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconSize}
          style={{ color: 'var(--accent-text, #5eead4)' }}
        >
          <path
            fillRule="evenodd"
            d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconSize}
          style={{ color: 'var(--text-secondary, rgba(255,255,255,0.7))' }}
        >
          <path
            fillRule="evenodd"
            d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}
