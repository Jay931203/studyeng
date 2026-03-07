'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { usePlayerStore, currentTimeRef, seekToRef } from '@/stores/usePlayerStore'

/**
 * ProgressBar uses requestAnimationFrame to read from the shared
 * currentTimeRef and update the DOM directly -- bypassing React
 * re-renders entirely for smooth 60fps progress without state churn.
 *
 * Supports tap-to-seek and drag-to-seek via pointer events.
 */
export function ProgressBar() {
  const barRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const clipStart = usePlayerStore((s) => s.clipStart)
  const clipEnd = usePlayerStore((s) => s.clipEnd)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  const clipDuration = clipEnd > clipStart ? clipEnd - clipStart : 0

  /** Convert a pointer clientX to a clamped percentage [0, 1] */
  const clientXToPercent = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0
    const rect = containerRef.current.getBoundingClientRect()
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }, [])

  /** Convert percentage to time and seek */
  const seekToPercent = useCallback(
    (pct: number) => {
      if (clipDuration <= 0) return
      const time = clipStart + pct * clipDuration
      seekToRef.current?.(time)
      // Also update the shared ref so the bar stays in sync immediately
      currentTimeRef.current = time
    },
    [clipStart, clipDuration],
  )

  /** Update bar + knob visuals directly (no React re-render) */
  const updateBarVisuals = useCallback((pct: number) => {
    const percent = Math.min(Math.max(pct * 100, 0), 100)
    if (barRef.current) barRef.current.style.width = `${percent}%`
    if (knobRef.current) knobRef.current.style.left = `${percent}%`
  }, [])

  // --- Pointer event handlers ---

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      // Capture pointer so pointermove/pointerup fire even outside the element
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      isDraggingRef.current = true
      setIsDragging(true)

      const pct = clientXToPercent(e.clientX)
      updateBarVisuals(pct)
      seekToPercent(pct)
    },
    [clientXToPercent, updateBarVisuals, seekToPercent],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return
      e.stopPropagation()
      e.preventDefault()
      const pct = clientXToPercent(e.clientX)
      updateBarVisuals(pct)
      seekToPercent(pct)
    },
    [clientXToPercent, updateBarVisuals, seekToPercent],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return
      e.stopPropagation()
      isDraggingRef.current = false
      setIsDragging(false)
    },
    [],
  )

  // --- RAF loop: auto-update bar when NOT dragging ---
  useEffect(() => {
    function tick() {
      if (!isDraggingRef.current && barRef.current && clipDuration > 0) {
        const pct = (currentTimeRef.current - clipStart) / clipDuration
        const percent = Math.min(Math.max(pct * 100, 0), 100)
        barRef.current.style.width = `${percent}%`
        if (knobRef.current) knobRef.current.style.left = `${percent}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [clipStart, clipDuration, isPlaying])

  return (
    <div className="absolute bottom-[72px] left-0 right-0 z-20">
      {/* Touch target: tall (24px) transparent area for easy tapping/dragging */}
      <div
        ref={containerRef}
        className="relative flex items-end cursor-pointer touch-none"
        style={{ height: '24px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Visual track */}
        <div
          className="w-full bg-white/20 overflow-visible transition-[height] duration-150"
          style={{ height: isDragging ? '4px' : '2px' }}
        >
          {/* Filled portion */}
          <div
            ref={barRef}
            className="h-full bg-white/80 relative"
            style={{ width: '0%' }}
          />
        </div>

        {/* Draggable knob - visible only during drag */}
        <div
          ref={knobRef}
          className="absolute transition-opacity duration-150 pointer-events-none"
          style={{
            left: '0%',
            bottom: '0px',
            opacity: isDragging ? 1 : 0,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="rounded-full bg-white shadow-md"
            style={{ width: '12px', height: '12px' }}
          />
        </div>
      </div>
    </div>
  )
}
