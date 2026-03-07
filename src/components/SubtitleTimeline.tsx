'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

interface SubtitleTimelineProps {
  subtitles: SubtitleEntry[]
  onSavePhrase: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
}

export function SubtitleTimeline({ subtitles, onSavePhrase, onSeek }: SubtitleTimelineProps) {
  const { activeSubIndex, setLoop, clearLoop, isLooping, loopStart, loopEnd } = usePlayerStore()

  return (
    <div className="absolute bottom-[160px] left-0 right-0 px-4 z-10 pointer-events-auto">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2">
        {subtitles.map((sub, idx) => {
          const isActive = idx === activeSubIndex
          const isInLoop =
            isLooping &&
            loopStart !== null &&
            loopEnd !== null &&
            sub.start >= loopStart &&
            sub.end <= loopEnd

          return (
            <div key={idx} className="flex-shrink-0 flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // If already looping on this exact pill, clear the loop
                  if (isLooping && loopStart === sub.start && loopEnd === sub.end) {
                    clearLoop()
                  } else {
                    onSeek?.(sub.start)
                    setLoop(sub.start, sub.end)
                  }
                }}
                className={`px-3 py-1.5 rounded-l-full text-xs transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isInLoop
                    ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {sub.en.slice(0, 22)}{sub.en.length > 22 ? '...' : ''}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSavePhrase(sub)
                }}
                className={`py-1.5 px-1.5 rounded-r-full text-[10px] transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white/80'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                +
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
