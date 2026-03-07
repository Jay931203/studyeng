'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useAdminStore } from '@/stores/useAdminStore'
import type { SubtitleEntry } from '@/data/seed-videos'

interface LyricsSubtitlesProps {
  subtitles: SubtitleEntry[]
  videoId?: string
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
}

export function LyricsSubtitles({ subtitles, videoId, onSavePhrase, onSeek }: LyricsSubtitlesProps) {
  const { subtitleMode, activeSubIndex } = usePlayerStore()
  const { isAdmin, toggleFlag, isFlagged } = useAdminStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = useRef<number>(-1)
  const scrollRafRef = useRef<number | null>(null)

  // Reset refs when subtitles change
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, subtitles.length)
  }, [subtitles])

  // Long-press state
  const longPressTimerRef = useRef<number | null>(null)
  const [savedIdx, setSavedIdx] = useState<number | null>(null)
  const savedFeedbackTimerRef = useRef<number | null>(null)

  // Auto-scroll to keep the active subtitle centered — smoothed with rAF
  useEffect(() => {
    if (activeSubIndex < 0 || !containerRef.current) return
    const line = lineRefs.current[activeSubIndex]
    if (!line) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()

    const targetTop = line.offsetTop - container.offsetTop - containerRect.height / 2 + lineRect.height / 2

    // For consecutive subtitles (distance=1), use animated scroll for fluidity
    const isConsecutive = prevActiveRef.current >= 0 && Math.abs(activeSubIndex - prevActiveRef.current) === 1
    prevActiveRef.current = activeSubIndex

    if (isConsecutive) {
      // Cancel any pending animation frame
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)

      const startTop = container.scrollTop
      const diff = targetTop - startTop
      const duration = 400 // ms
      let startTime: number | null = null

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      const animate = (time: number) => {
        if (!startTime) startTime = time
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        container.scrollTop = startTop + diff * easeOutCubic(progress)
        if (progress < 1) {
          scrollRafRef.current = requestAnimationFrame(animate)
        }
      }
      scrollRafRef.current = requestAnimationFrame(animate)
    } else {
      container.scrollTo({ top: targetTop, behavior: 'smooth' })
    }
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
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
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

            // 4-level gradation: active / distance=1 / distance=2 / rest
            const opacityClass = isSaved
              ? 'opacity-100'
              : isActive
              ? 'opacity-100'
              : distance === 1
              ? 'opacity-50'
              : distance === 2
              ? 'opacity-30'
              : 'opacity-15'

            const scaleValue = isSaved ? 1 : isActive ? 1 : distance === 1 ? 0.95 : distance === 2 ? 0.9 : 0.85

            return (
              <div
                key={idx}
                ref={(el) => { lineRefs.current[idx] = el }}
                className={`w-full flex items-center justify-center relative will-change-[transform,opacity] ${opacityClass}`}
                style={{
                  transform: `scale(${scaleValue})`,
                  transition: 'opacity 250ms ease-out, transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div className="relative max-w-[85%]">
                  <button
                    onClick={(e) => handleLineClick(sub, e)}
                    onPointerDown={() => handlePointerDown(sub, idx)}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onPointerLeave={handlePointerUp}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`text-center w-full select-none will-change-[font-size,color,background-color,padding] ${
                      isSaved
                        ? 'text-white text-sm font-semibold drop-shadow-lg bg-blue-500/40 backdrop-blur-md rounded-lg px-3 py-1.5 ring-2 ring-blue-400/60'
                        : isActive
                        ? `text-white font-semibold drop-shadow-lg bg-black/50 backdrop-blur-md rounded-lg ${showKo ? 'text-sm px-3 py-1.5' : 'text-base px-4 py-2'}`
                        : distance === 1
                        ? 'text-white/60 text-sm'
                        : distance === 2
                        ? 'text-white/35 text-xs'
                        : 'text-white/20 text-xs'
                    }`}
                    style={{
                      transition: 'font-size 300ms cubic-bezier(0.22, 1, 0.36, 1), color 200ms ease-out, background-color 350ms ease-out, padding 300ms ease-out, box-shadow 300ms ease-out',
                      ...(isSaved
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)', boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)' }
                        : isActive
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)' }
                        : {}),
                    }}
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

                  {/* + button for saving phrase - inside box, top-right corner */}
                  {isActive && onSavePhrase && !isSaved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSavePhrase(sub)
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded bg-white/10 text-white/40 flex items-center justify-center text-xs font-medium hover:text-white/70 hover:bg-white/20 active:scale-90 transition-all"
                    >
                      +
                    </button>
                  )}

                  {/* Admin flag button - top-left corner, only visible to admin */}
                  {isAdmin && videoId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFlag(videoId, idx, sub.en)
                      }}
                      className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded flex items-center justify-center transition-all active:scale-90 ${
                        isFlagged(videoId, idx)
                          ? 'bg-red-500/30 text-red-400'
                          : 'bg-white/10 text-white/20 hover:text-white/50 hover:bg-white/20'
                      }`}
                      title="Flag subtitle error"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                      </svg>
                    </button>
                  )}
                </div>
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
