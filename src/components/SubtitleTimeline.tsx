'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'

interface SubtitleEntry {
  start: number
  end: number
  en: string
  ko: string
}

interface SubtitleTimelineProps {
  subtitles: SubtitleEntry[]
  onSavePhrase: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
}

export function SubtitleTimeline({ subtitles, onSavePhrase, onSeek }: SubtitleTimelineProps) {
  const { currentTime, setLoop, isLooping, loopStart, loopEnd } = usePlayerStore()

  return (
    <div className="absolute bottom-[152px] left-0 right-0 px-4 z-10 pointer-events-auto">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2">
        {subtitles.map((sub, idx) => {
          const isActive = currentTime >= sub.start && currentTime <= sub.end
          const isInLoop =
            isLooping &&
            loopStart !== null &&
            loopEnd !== null &&
            sub.start >= loopStart &&
            sub.end <= loopEnd

          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                onSeek?.(sub.start)
                setLoop(sub.start, sub.end)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onSavePhrase(sub)
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
                isActive
                  ? 'bg-blue-500 text-white scale-105'
                  : isInLoop
                  ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/50'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {sub.en.slice(0, 25)}{sub.en.length > 25 ? '...' : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
