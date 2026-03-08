'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { DoubleTapTip } from './DoubleTapTip'
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
  const phrases = usePhraseStore((s) => s.phrases)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = useRef<number>(-1)
  const scrollRafRef = useRef<number | null>(null)

  // Reset refs when subtitles change
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, subtitles.length)
  }, [subtitles])

  // Double-tap detection
  const lastTapRef = useRef<{ idx: number; time: number }>({ idx: -1, time: 0 })
  // Temporary "saved!" feedback
  const [justSavedIdx, setJustSavedIdx] = useState<number | null>(null)
  const savedFeedbackTimerRef = useRef<number | null>(null)

  // Check if a subtitle is already saved
  const isSavedPhrase = useCallback(
    (sub: SubtitleEntry) => phrases.some((p) => p.en === sub.en),
    [phrases],
  )

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
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)

      const startTop = container.scrollTop
      const diff = targetTop - startTop
      const duration = 400
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
    (sub: SubtitleEntry, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const now = Date.now()
      const last = lastTapRef.current

      if (last.idx === idx && now - last.time < 400) {
        // Double tap → save phrase
        if (onSavePhrase && !isSavedPhrase(sub)) {
          onSavePhrase(sub)
          setJustSavedIdx(idx)
          if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current)
          savedFeedbackTimerRef.current = window.setTimeout(() => setJustSavedIdx(null), 1200)
        }
        lastTapRef.current = { idx: -1, time: 0 }
      } else {
        // Single tap → seek
        onSeek?.(sub.start)
        lastTapRef.current = { idx, time: now }
      }
    },
    [onSeek, onSavePhrase, isSavedPhrase],
  )

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current)
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
    }
  }, [])

  const showKo = subtitleMode === 'en-ko'

  if (subtitleMode === 'none' || subtitles.length === 0) return null

  return (
    <div
      className="w-full h-full z-10 pointer-events-auto relative"
      onClick={(e) => e.stopPropagation()}
    >
      <DoubleTapTip />
      <div
        ref={containerRef}
        className="h-full overflow-y-auto no-scrollbar px-4 py-2"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Top spacer to allow first item to center */}
          <div className="h-[60px] flex-shrink-0" />

          {subtitles.map((sub, idx) => {
            const isActive = idx === activeSubIndex
            const distance = activeSubIndex >= 0 ? Math.abs(idx - activeSubIndex) : 999
            const isJustSaved = justSavedIdx === idx
            const saved = isSavedPhrase(sub)

            // 4-level gradation: active / distance=1 / distance=2 / rest
            const opacityClass = isJustSaved || isActive
              ? 'opacity-100'
              : distance === 1
              ? 'opacity-50'
              : distance === 2
              ? 'opacity-30'
              : 'opacity-15'

            const scaleValue = isJustSaved || isActive ? 1 : distance === 1 ? 0.95 : distance === 2 ? 0.9 : 0.85

            const flagged = isAdmin && videoId ? isFlagged(videoId, idx) : false

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
                <div className="flex items-center gap-1.5 max-w-[85%]">
                  {/* Admin flag — inline left of text */}
                  {isAdmin && videoId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFlag(videoId, idx, sub.en)
                      }}
                      className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all active:scale-90 ${
                        flagged
                          ? 'bg-red-500/30 text-red-400'
                          : 'bg-white/5 text-white/15 hover:text-white/40'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={(e) => handleLineClick(sub, idx, e)}
                    className={`text-center w-full text-sm select-none px-3 py-1.5 ${
                      isJustSaved
                        ? 'text-white font-semibold drop-shadow-lg bg-blue-500/40 backdrop-blur-md rounded-lg ring-2 ring-blue-400/60'
                        : isActive
                        ? `text-white font-semibold drop-shadow-lg backdrop-blur-md rounded-lg ${
                            saved
                              ? 'bg-blue-500/20 ring-1 ring-blue-400/40'
                              : 'bg-black/50'
                          }`
                        : saved && distance <= 2
                        ? `text-white/60 rounded-lg ring-1 ring-blue-400/25`
                        : distance === 1
                        ? 'text-white/60'
                        : distance === 2
                        ? 'text-white/35'
                        : 'text-white/20'
                    }`}
                    style={{
                      transition: 'color 200ms ease-out, background-color 350ms ease-out, box-shadow 300ms ease-out',
                      ...(isJustSaved
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)', boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)' }
                        : isActive
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)' }
                        : {}),
                    }}
                  >
                    {isJustSaved ? (
                      <span className="text-blue-200 font-semibold text-sm">Saved!</span>
                    ) : (
                      <>
                        <span className={isActive && showKo ? 'line-clamp-2' : undefined}>{sub.en}</span>
                        {isActive && showKo && sub.ko && (
                          <p className="text-blue-200/70 text-xs mt-0.5 line-clamp-1">{sub.ko}</p>
                        )}
                      </>
                    )}
                  </button>
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
