'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'

export function ProgressBar() {
  const { currentTime, duration } = usePlayerStore()
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="absolute bottom-[72px] left-0 right-0 z-20">
      <div className="h-[2px] bg-white/20 overflow-hidden">
        <div
          className="h-full bg-white/80 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
