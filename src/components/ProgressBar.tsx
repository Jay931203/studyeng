'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ProgressBar() {
  const { currentTime, duration } = usePlayerStore()
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="absolute bottom-[68px] left-0 right-0 z-20 px-4">
      {/* Time display */}
      <div className="flex justify-between text-[10px] text-white/40 mb-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      {/* Bar */}
      <div className="h-[3px] bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/80 rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
