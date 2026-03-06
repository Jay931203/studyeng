'use client'

import { useRef, useEffect } from 'react'
import { usePlayerStore, currentTimeRef } from '@/stores/usePlayerStore'

/**
 * ProgressBar uses requestAnimationFrame to read from the shared
 * currentTimeRef and update the DOM directly -- bypassing React
 * re-renders entirely for smooth 60fps progress without state churn.
 */
export function ProgressBar() {
  const barRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  // Read clip bounds once (they rarely change); subscribe to re-render only
  // when clipStart/clipEnd/isPlaying change -- NOT on every currentTime tick.
  const clipStart = usePlayerStore((s) => s.clipStart)
  const clipEnd = usePlayerStore((s) => s.clipEnd)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useEffect(() => {
    const clipDuration = clipEnd > clipStart ? clipEnd - clipStart : 0

    function tick() {
      if (barRef.current && clipDuration > 0) {
        const progress = ((currentTimeRef.current - clipStart) / clipDuration) * 100
        barRef.current.style.width = `${Math.min(Math.max(progress, 0), 100)}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [clipStart, clipEnd, isPlaying])

  return (
    <div className="absolute bottom-[72px] left-0 right-0 z-20">
      <div className="h-[2px] bg-white/20 overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-white/80"
          style={{ width: '0%' }}
        />
      </div>
    </div>
  )
}
