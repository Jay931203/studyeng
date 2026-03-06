'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'

const SPEEDS = [0.75, 1.0, 1.25, 1.5]

export function SpeedSlider() {
  const { playbackRate, setPlaybackRate } = usePlayerStore()

  const handleTap = (e: React.PointerEvent) => {
    e.stopPropagation()
    const idx = SPEEDS.indexOf(playbackRate)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setPlaybackRate(next)
  }

  const isModified = playbackRate !== 1.0

  return (
    <button
      onPointerUp={handleTap}
      className={`backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        isModified ? 'bg-blue-500 text-white' : 'bg-black/50 text-white'
      }`}
    >
      {playbackRate === 1 ? '1x' : `${playbackRate}x`}
    </button>
  )
}
