'use client'

import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

interface SubtitleTimelineProps {
  subtitles: SubtitleEntry[]
  onSavePhrase: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
}

export function SubtitleTimeline({ subtitles, onSavePhrase, onSeek }: SubtitleTimelineProps) {
  const { activeSubIndex, setActiveSubIndex, setLoop, clearLoop, isLooping, loopStart, loopEnd } = usePlayerStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<(HTMLDivElement | null)[]>([])

  // Auto-scroll to keep the active pill visible
  useEffect(() => {
    if (activeSubIndex < 0 || !containerRef.current) return
    const pill = pillRefs.current[activeSubIndex]
    if (!pill) return

    pill.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeSubIndex])

  const handlePillClick = useCallback(
    (sub: SubtitleEntry, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      // Clear any active loop so the seek isn't caught by loop boundary logic
      if (isLooping) {
        clearLoop()
      }
      // Update active subtitle index and seek the player
      setActiveSubIndex(idx)
      onSeek?.(sub.start)
    },
    [isLooping, clearLoop, setActiveSubIndex, onSeek],
  )

  const handlePillDoubleClick = useCallback(
    (sub: SubtitleEntry, e: React.MouseEvent) => {
      e.stopPropagation()
      // Double-click toggles A-B loop on this subtitle
      if (isLooping && loopStart === sub.start && loopEnd === sub.end) {
        clearLoop()
      } else {
        setLoop(sub.start, sub.end)
        onSeek?.(sub.start)
      }
    },
    [isLooping, loopStart, loopEnd, clearLoop, setLoop, onSeek],
  )

  return (
    <div className="absolute bottom-[90px] left-0 right-0 px-4 z-10 pointer-events-auto">
      <div ref={containerRef} className="flex gap-2 overflow-x-auto no-scrollbar py-2 scroll-smooth">
        {subtitles.map((sub, idx) => {
          const isActive = idx === activeSubIndex
          const isInLoop =
            isLooping &&
            loopStart !== null &&
            loopEnd !== null &&
            sub.start >= loopStart &&
            sub.end <= loopEnd

          return (
            <div
              key={idx}
              ref={(el) => { pillRefs.current[idx] = el }}
              className="flex-shrink-0 flex items-center gap-0.5"
            >
              <button
                onClick={(e) => handlePillClick(sub, idx, e)}
                onDoubleClick={(e) => handlePillDoubleClick(sub, e)}
                className={`px-3 py-1.5 rounded-l-full text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/30'
                    : isInLoop
                    ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-white/10 text-white/40 hover:bg-white/15 hover:text-white/60'
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
                    ? 'bg-blue-500 text-white/80 scale-105 shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-white/40 hover:bg-white/15'
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
