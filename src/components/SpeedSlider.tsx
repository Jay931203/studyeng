'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/stores/usePlayerStore'

const SNAP_VALUES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
const MIN_SPEED = 0.5
const MAX_SPEED = 2.0
const STEP = 0.05

export function SpeedSlider() {
  const { playbackRate, setPlaybackRate } = usePlayerStore()
  const [showSlider, setShowSlider] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      setShowSlider(true)
    }, 500)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!showSlider) {
      // Quick tap - cycle speeds
      const speeds = [0.5, 0.75, 1, 1.25, 1.5]
      const currentIdx = speeds.indexOf(playbackRate)
      const nextIdx = currentIdx === -1 ? 2 : (currentIdx + 1) % speeds.length
      setPlaybackRate(speeds[nextIdx])
    }
  }

  const handleSliderChange = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const ratio = 1 - Math.max(0, Math.min(1, y / rect.height))
    let value = MIN_SPEED + ratio * (MAX_SPEED - MIN_SPEED)

    // Snap to common values
    const closest = SNAP_VALUES.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    )
    if (Math.abs(closest - value) < 0.03) {
      value = closest
    } else {
      value = Math.round(value / STEP) * STEP
    }

    setPlaybackRate(parseFloat(value.toFixed(2)))
  }, [setPlaybackRate])

  const percentage = ((playbackRate - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100

  return (
    <>
      <button
        onPointerDown={(e) => {
          e.stopPropagation()
          handlePointerDown()
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          handlePointerUp()
        }}
        onPointerLeave={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
        }}
        className="bg-black/50 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
      >
        {playbackRate === 1 ? '1x' : `${playbackRate}x`}
      </button>

      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setShowSlider(false)}
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-lg rounded-2xl p-4 flex flex-col items-center gap-2"
            >
              <span className="text-white text-lg font-bold mb-2">
                {playbackRate.toFixed(2)}x
              </span>

              <div
                ref={sliderRef}
                className="relative w-8 h-48 bg-white/10 rounded-full cursor-pointer touch-none"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  handleSliderChange(e)
                }}
                onPointerMove={(e) => {
                  if (e.buttons > 0) handleSliderChange(e)
                }}
              >
                {/* Track fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full transition-all"
                  style={{ height: `${percentage}%` }}
                />

                {/* Snap markers */}
                {SNAP_VALUES.map((val) => {
                  const pos = ((val - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100
                  return (
                    <div
                      key={val}
                      className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/30"
                      style={{ bottom: `${pos}%` }}
                    />
                  )
                })}

                {/* Thumb */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all"
                  style={{ bottom: `calc(${percentage}% - 12px)` }}
                />
              </div>

              {/* Labels */}
              <div className="flex flex-col items-center gap-0 text-[10px] text-gray-400 mt-1">
                <span>느리게</span>
                <span>빠르게</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
