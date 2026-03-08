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

/** Threshold in px — if the pointer moves more than this, it's a scroll, not a long-press */
const LONG_PRESS_MOVE_THRESHOLD = 10
/** Duration in ms to trigger long-press */
const LONG_PRESS_DURATION = 500

export function LyricsSubtitles({ subtitles, videoId, onSavePhrase, onSeek }: LyricsSubtitlesProps) {
  const { subtitleMode, activeSubIndex, freezeSubIndex, setFreezeSubIndex } = usePlayerStore()
  const { isAdminActive, toggleFlag, isFlagged } = useAdminStore()
  const phrases = usePhraseStore((s) => s.phrases)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = useRef<number>(-1)
  const scrollRafRef = useRef<number | null>(null)

  // User-scroll detection: distinguish manual scroll from programmatic scroll
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const isProgrammaticScrollRef = useRef(false)
  const userScrollTimerRef = useRef<number | null>(null)

  // Reset refs when subtitles change
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, subtitles.length)
  }, [subtitles])

  // Double-tap detection
  const lastTapRef = useRef<{ idx: number; time: number }>({ idx: -1, time: 0 })
  // Temporary "saved!" feedback
  const [justSavedIdx, setJustSavedIdx] = useState<number | null>(null)
  const savedFeedbackTimerRef = useRef<number | null>(null)

  // Long-press detection refs
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  // Freeze mode indicator (shows briefly then fades)
  const [showFreezeIndicator, setShowFreezeIndicator] = useState(false)
  const [freezeIndicatorText, setFreezeIndicatorText] = useState('프리즈 모드')
  const freezeIndicatorTimerRef = useRef<number | null>(null)
  const prevFreezeSubIndexRef = useRef<number | null>(null)

  // First-time tooltip
  const [showFreezeTip, setShowFreezeTip] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('studyeng-freeze-tip-shown')) {
      setShowFreezeTip(true)
      const timer = window.setTimeout(() => {
        setShowFreezeTip(false)
        localStorage.setItem('studyeng-freeze-tip-shown', '1')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Detect user-initiated scroll via touch events + onScroll
  const handleTouchStart = useCallback(() => {
    // User is touching the scroll area — any scroll events during touch are user-initiated
    isProgrammaticScrollRef.current = false
  }, [])

  // Desktop: mouse wheel also counts as user-initiated scroll
  const handleWheel = useCallback(() => {
    isProgrammaticScrollRef.current = false
    setIsUserScrolling(true)
    if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current)
    userScrollTimerRef.current = window.setTimeout(() => {
      setIsUserScrolling(false)
    }, 2500)
  }, [])

  const handleScroll = useCallback(() => {
    // If the scroll was triggered programmatically (auto-scroll), ignore it
    if (isProgrammaticScrollRef.current) return

    // User is manually scrolling — reveal all subtitles
    setIsUserScrolling(true)

    // Reset the timer on every scroll event
    if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current)
    userScrollTimerRef.current = window.setTimeout(() => {
      setIsUserScrolling(false)
    }, 2500)
  }, [])

  // Check if a subtitle is already saved
  const isSavedPhrase = useCallback(
    (sub: SubtitleEntry) => phrases.some((p) => p.en === sub.en),
    [phrases],
  )

  // Auto-scroll to keep the active subtitle centered — smoothed with rAF
  // Skip auto-scroll while user is manually scrolling to avoid fighting with their input
  useEffect(() => {
    if (activeSubIndex < 0 || !containerRef.current) return
    if (isUserScrolling) return
    const line = lineRefs.current[activeSubIndex]
    if (!line) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()

    const targetTop = line.offsetTop - container.offsetTop - containerRect.height / 2 + lineRect.height / 2

    // For consecutive subtitles (distance=1), use animated scroll for fluidity
    const isConsecutive = prevActiveRef.current >= 0 && Math.abs(activeSubIndex - prevActiveRef.current) === 1
    prevActiveRef.current = activeSubIndex

    // Mark as programmatic scroll so onScroll handler ignores it
    isProgrammaticScrollRef.current = true

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
        } else {
          // Reset programmatic flag after animation completes
          isProgrammaticScrollRef.current = false
        }
      }
      scrollRafRef.current = requestAnimationFrame(animate)
    } else {
      container.scrollTo({ top: targetTop, behavior: 'smooth' })
      // Reset programmatic flag after smooth scroll settles
      window.setTimeout(() => { isProgrammaticScrollRef.current = false }, 500)
    }
  }, [activeSubIndex, isUserScrolling])

  // Show freeze indicator only on freeze state transitions (enter/exit), not on subtitle changes
  useEffect(() => {
    const wasFrozen = prevFreezeSubIndexRef.current !== null
    const isFrozenNow = freezeSubIndex !== null
    prevFreezeSubIndexRef.current = freezeSubIndex

    if (!wasFrozen && isFrozenNow) {
      // Entered freeze mode (null → number)
      setFreezeIndicatorText('프리즈 모드')
      setShowFreezeIndicator(true)
      if (freezeIndicatorTimerRef.current) clearTimeout(freezeIndicatorTimerRef.current)
      freezeIndicatorTimerRef.current = window.setTimeout(() => setShowFreezeIndicator(false), 2500)
    } else if (wasFrozen && !isFrozenNow) {
      // Exited freeze mode (number → null)
      setFreezeIndicatorText('프리즈 해제')
      setShowFreezeIndicator(true)
      if (freezeIndicatorTimerRef.current) clearTimeout(freezeIndicatorTimerRef.current)
      freezeIndicatorTimerRef.current = window.setTimeout(() => setShowFreezeIndicator(false), 1500)
    }
    // If both were frozen (number → different number), do nothing — no indicator re-show
  }, [freezeSubIndex])

  // Enter or move freeze mode to the given subtitle
  const enterFreeze = useCallback(
    (sub: SubtitleEntry, idx: number) => {
      setFreezeSubIndex(idx)
      onSeek?.(sub.start)
    },
    [setFreezeSubIndex, onSeek],
  )

  // Exit freeze mode
  const exitFreeze = useCallback(() => {
    setFreezeSubIndex(null)
  }, [setFreezeSubIndex])

  const handleLineClick = useCallback(
    (sub: SubtitleEntry, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()

      // If long-press just fired, don't process the click
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false
        return
      }

      const now = Date.now()
      const last = lastTapRef.current

      if (last.idx === idx && now - last.time < 400) {
        // Double tap → save phrase (unchanged)
        if (onSavePhrase && !isSavedPhrase(sub)) {
          onSavePhrase(sub)
          setJustSavedIdx(idx)
          if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current)
          savedFeedbackTimerRef.current = window.setTimeout(() => setJustSavedIdx(null), 1200)
        }
        lastTapRef.current = { idx: -1, time: 0 }
      } else if (freezeSubIndex !== null) {
        // Freeze mode is active
        if (freezeSubIndex === idx) {
          // Tap frozen subtitle → exit freeze
          exitFreeze()
        } else {
          // Tap different subtitle → move freeze to it
          enterFreeze(sub, idx)
        }
        lastTapRef.current = { idx, time: now }
      } else {
        // Normal single tap → seek
        onSeek?.(sub.start)
        lastTapRef.current = { idx, time: now }
      }
    },
    [onSeek, onSavePhrase, isSavedPhrase, freezeSubIndex, enterFreeze, exitFreeze],
  )

  // Long-press: pointerdown starts timer, pointerup/move cancels
  const handlePointerDown = useCallback(
    (sub: SubtitleEntry, idx: number, e: React.PointerEvent) => {
      longPressFiredRef.current = false
      pointerStartRef.current = { x: e.clientX, y: e.clientY }

      longPressTimerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true
        if (freezeSubIndex === idx) {
          // Long-press on already-frozen subtitle → exit freeze
          exitFreeze()
        } else {
          // Long-press → enter freeze on this subtitle
          enterFreeze(sub, idx)
        }
      }, LONG_PRESS_DURATION)
    },
    [freezeSubIndex, enterFreeze, exitFreeze],
  )

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStartRef.current) return
      const dx = e.clientX - pointerStartRef.current.x
      const dy = e.clientY - pointerStartRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_THRESHOLD) {
        cancelLongPress()
      }
    },
    [cancelLongPress],
  )

  const handlePointerUp = useCallback(() => {
    cancelLongPress()
    pointerStartRef.current = null
  }, [cancelLongPress])

  // Clear freeze when subtitles change (e.g. navigating to different video)
  useEffect(() => {
    setFreezeSubIndex(null)
  }, [subtitles, setFreezeSubIndex])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current)
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (freezeIndicatorTimerRef.current) clearTimeout(freezeIndicatorTimerRef.current)
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current)
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

      {/* Freeze mode indicator */}
      {showFreezeIndicator && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-purple-500/30 backdrop-blur-sm text-purple-200 text-xs font-medium"
          style={{
            animation: 'freezeFadeIn 300ms ease-out',
          }}
        >
          {freezeIndicatorText}
        </div>
      )}

      {/* First-time long-press tooltip */}
      {showFreezeTip && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-xs"
          style={{
            animation: 'freezeFadeIn 500ms ease-out',
          }}
        >
          길게 눌러서 반복
        </div>
      )}

      <style>{`
        @keyframes freezeFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes freezePulse {
          0%, 100% { box-shadow: 0 0 8px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 0 16px rgba(168, 85, 247, 0.5); }
        }
      `}</style>

      <div
        ref={containerRef}
        className="h-full overflow-y-auto no-scrollbar px-4 py-2"
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        onScroll={handleScroll}
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
            const isFrozen = freezeSubIndex === idx
            const distance = activeSubIndex >= 0 ? Math.abs(idx - activeSubIndex) : 999
            const isJustSaved = justSavedIdx === idx
            const saved = isSavedPhrase(sub)

            // Show only active + 1 before/after (frozen subtitle always visible)
            // When user is manually scrolling, reveal all subtitles
            // IMPORTANT: Never use pointer-events-none on individual items —
            // it blocks touch events and prevents scroll initiation.
            const opacityClass = isUserScrolling
              ? (isJustSaved || isActive || isFrozen
                ? 'opacity-100'
                : distance === 1
                ? 'opacity-70'
                : 'opacity-50')
              : isJustSaved || isActive || isFrozen
              ? 'opacity-100'
              : distance === 1
              ? 'opacity-40'
              : 'opacity-0'

            // Whether this subtitle is fully hidden (not visible, not interactable)
            // Wrapper div stays pointer-events-auto for scroll, but inner button is disabled
            const isHidden = !isUserScrolling && !isJustSaved && !isActive && !isFrozen && distance > 1

            const scaleValue = isUserScrolling
              ? (isJustSaved || isActive || isFrozen ? 1 : 0.95)
              : isJustSaved || isActive || isFrozen ? 1 : distance === 1 ? 0.92 : 0.85

            const adminActive = isAdminActive()
            const flagged = adminActive && videoId ? isFlagged(videoId, idx) : false

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
                <div className="relative flex items-center gap-1.5 max-w-[92%]">
                  {/* Admin flag — inline left of text */}
                  {adminActive && videoId && (
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

                  {/* Freeze repeat icon — absolutely positioned so it never shifts subtitle text */}
                  {isFrozen && (
                    <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-purple-400 select-none pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.647a.75.75 0 0 0-.75.75v3.585a.75.75 0 0 0 1.5 0v-2.19l.238.238a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.035-.1zm-2.623-7.26a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.035.1 5.5 5.5 0 0 1 9.201-2.466l.312.311H9.092a.75.75 0 0 0 0 1.5h3.585a.75.75 0 0 0 .75-.75V2.412a.75.75 0 0 0-1.5 0v2.19l-.238-.238z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}

                  {/* Saved phrase bookmark icon — absolutely positioned on the right, symmetrical with freeze icon */}
                  {(saved || isJustSaved) && (
                    <span className={`absolute -right-6 top-1/2 -translate-y-1/2 select-none pointer-events-none ${isJustSaved ? 'text-blue-300' : 'text-blue-400/60'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}

                  <button
                    onClick={(e) => { if (!isHidden) handleLineClick(sub, idx, e) }}
                    onPointerDown={(e) => { if (!isHidden) handlePointerDown(sub, idx, e) }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`text-center w-full ${isJustSaved || isActive || isFrozen ? 'text-base' : 'text-sm'} select-none px-3 py-1.5 touch-manipulation ${
                      isFrozen
                        ? 'text-white font-semibold drop-shadow-lg bg-purple-500/20 backdrop-blur-md rounded-lg ring-2 ring-purple-400/60'
                        : isJustSaved
                        ? 'text-white font-semibold drop-shadow-lg'
                        : isActive
                        ? 'text-white font-semibold drop-shadow-lg backdrop-blur-md rounded-lg bg-black/50'
                        : distance === 1 || isUserScrolling
                        ? 'text-white/50'
                        : 'text-white/20'
                    }`}
                    /* NOTE: saved subtitles get NO box/ring — only the right-side icon */
                    style={{
                      transition: 'color 200ms ease-out, background-color 350ms ease-out, box-shadow 300ms ease-out',
                      ...(isFrozen
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)', animation: 'freezePulse 2s ease-in-out infinite' }
                        : isJustSaved
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)' }
                        : isActive
                        ? { textShadow: '0 1px 4px rgba(0,0,0,0.8)' }
                        : {}),
                    }}
                  >
                    <>
                      <span>{sub.en}</span>
                      {(isActive || isFrozen) && showKo && sub.ko && (
                        <p className={`${isFrozen ? 'text-purple-200/70' : 'text-purple-200/70'} text-xs mt-0.5`}>{sub.ko}</p>
                      )}
                    </>
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
