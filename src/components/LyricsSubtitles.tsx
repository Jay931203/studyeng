'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

interface LyricsSubtitlesProps {
  subtitles: SubtitleEntry[]
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
}

export function LyricsSubtitles({ subtitles, onSavePhrase, onSeek }: LyricsSubtitlesProps) {
  const { subtitleMode, activeSubIndex } = usePlayerStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // Reset refs when subtitles change
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, subtitles.length)
  }, [subtitles])

  // Long-press state
  const longPressTimerRef = useRef<number | null>(null)
  const [savedIdx, setSavedIdx] = useState<number | null>(null)
  const savedFeedbackTimerRef = useRef<number | null>(null)

  // Auto-scroll to keep the active subtitle centered
  useEffect(() => {
    if (activeSubIndex < 0 || !containerRef.current) return
    const line = lineRefs.current[activeSubIndex]
    if (!line) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()

    // Calculate the scroll position to center the active line
    const scrollTop = line.offsetTop - container.offsetTop - containerRect.height / 2 + lineRect.height / 2
    container.scrollTo({ top: scrollTop, behavior: 'smooth' })
  }, [activeSubIndex])

  const handleLineClick = useCallback(
    (sub: SubtitleEntry, e: React.MouseEvent) => {
      e.stopPropagation()
      onSeek?.(sub.start)
    },
    [onSeek],
  )

  // Long-press handlers for saving phrases
  const handlePointerDown = useCallback(
    (sub: SubtitleEntry, idx: number) => {
      if (!onSavePhrase) return

      // Clear any existing timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }

      longPressTimerRef.current = window.setTimeout(() => {
        // Long-press triggered - save phrase
        onSavePhrase(sub)

        // Show visual feedback
        setSavedIdx(idx)
        if (savedFeedbackTimerRef.current) {
          clearTimeout(savedFeedbackTimerRef.current)
        }
        savedFeedbackTimerRef.current = window.setTimeout(() => {
          setSavedIdx(null)
        }, 1200)

        longPressTimerRef.current = null
      }, 500)
    },
    [onSavePhrase],
  )

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current)
    }
  }, [])

  const showKo = subtitleMode === 'en-ko'

  if (subtitleMode === 'none' || subtitles.length === 0) return null

  return (
    <div
      className="absolute bottom-[90px] left-0 right-0 z-10 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={containerRef}
        className="max-h-[180px] overflow-y-auto no-scrollbar px-4 py-2"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Top spacer to allow first item to center */}
          <div className="h-[60px] flex-shrink-0" />

          {subtitles.map((sub, idx) => {
            const isActive = idx === activeSubIndex
            const distance = activeSubIndex >= 0 ? Math.abs(idx - activeSubIndex) : 999
            const isSaved = savedIdx === idx

            return (
              <div
                key={idx}
                ref={(el) => { lineRefs.current[idx] = el }}
                className="w-full flex items-center justify-center gap-2 transition-all duration-300 relative"
              >
                <button
                  onClick={(e) => handleLineClick(sub, e)}
                  onPointerDown={() => handlePointerDown(sub, idx)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  onPointerLeave={handlePointerUp}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`text-center transition-all duration-300 max-w-[85%] select-none ${
                    isSaved
                      ? 'text-white text-sm font-semibold drop-shadow-lg bg-blue-500/40 backdrop-blur-md rounded-lg px-3 py-1.5 ring-2 ring-blue-400/60'
                      : isActive
                      ? `text-white font-semibold drop-shadow-lg bg-black/50 backdrop-blur-md rounded-lg ${showKo ? 'text-sm px-3 py-1.5' : 'text-base px-4 py-2'}`
                      : distance <= 1
                      ? 'text-white/40 text-sm'
                      : 'text-white/20 text-xs'
                  }`}
                  style={
                    isSaved
                      ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)', boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)' }
                      : isActive
                      ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)' }
                      : undefined
                  }
                >
                  {isSaved ? (
                    <span className="text-blue-200 font-semibold text-sm">저장됨!</span>
                  ) : (
                    <>
                      <span className={isActive && showKo ? 'line-clamp-2' : undefined}>{sub.en}</span>
                      {isActive && showKo && sub.ko && (
                        <p className="text-blue-200/70 text-xs mt-0.5 line-clamp-1">{sub.ko}</p>
                      )}
                    </>
                  )}
                </button>

                {/* + button for saving phrase - only on active subtitle */}
                {isActive && onSavePhrase && !isSaved && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSavePhrase(sub)
                    }}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/80 text-white flex items-center justify-center text-sm font-bold active:scale-90 transition-transform"
                  >
                    +
                  </button>
                )}
              </div>
            )
          })}

          {/* Bottom spacer to allow last item to center */}
          <div className="h-[60px] flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}
