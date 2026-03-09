'use client'

import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { usePlayerStore, playRef } from '@/stores/usePlayerStore'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUserStore } from '@/stores/useUserStore'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { DoubleTapTip } from './DoubleTapTip'
import { SaveToast } from './SaveToast'
import { SubtitleGame } from './SubtitleGame'
import type { SubtitleEntry } from '@/data/seed-videos'

interface LyricsSubtitlesProps {
  subtitles: SubtitleEntry[]
  videoId?: string
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
  visibleLineCount?: number
}

/** Threshold in px ??if the pointer moves more than this, it's a scroll, not a long-press */
const LONG_PRESS_MOVE_THRESHOLD = 10
/** Duration in ms to trigger long-press */
const LONG_PRESS_DURATION = 500
/** Window in ms for double-tap detection */
const DOUBLE_TAP_WINDOW = 550

// Stopwords to exclude from key-token matching (common words with no learning value)
const STOPWORDS = new Set([
  'i', 'me', 'my', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
  'we', 'us', 'our', 'they', 'them', 'their', 'the', 'a', 'an', 'and', 'but', 'or',
  'so', 'if', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
  'shall', 'must', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up',
  'out', 'off', 'no', 'not', 'nor', 'as', 'than', 'too', 'very', 'just', 'about',
  'this', 'that', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
  "it's", "he's", "she's", "i'm", "we're", "they're", "you're", "that's", "there's",
  "what's", "here's", "let's", "who's", "how's", "where's", "when's",
  'then', 'now', 'here', 'there', 'all', 'some', 'any', 'each', 'every',
  'oh', 'yeah', 'yes', 'no', 'okay', 'ok', 'well', 'like', 'right',
])

/** Tokenize text into meaningful words for matching */
function extractKeyTokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

/** Trigger a short haptic vibration when supported and enabled */
function haptic(ms = 10) {
  if (!useSettingsStore.getState().hapticEnabled) return
  try { navigator.vibrate?.(ms) } catch { /* unsupported */ }
}

export function LyricsSubtitles({
  subtitles,
  videoId,
  onSavePhrase,
  onSeek,
  visibleLineCount = 3,
}: LyricsSubtitlesProps) {
  const subtitleMode = usePlayerStore((state) => state.subtitleMode)
  const activeSubIndex = usePlayerStore((state) => state.activeSubIndex)
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const setFreezeSubIndex = usePlayerStore((state) => state.setFreezeSubIndex)
  const gameActive = usePlayerStore((state) => state.gameActive)
  const gameSentenceIndex = usePlayerStore((state) => state.gameSentenceIndex)
  const gameChoices = usePlayerStore((state) => state.gameChoices)
  const gameCorrectIndex = usePlayerStore((state) => state.gameCorrectIndex)
  const gameResult = usePlayerStore((state) => state.gameResult)
  const answerGame = usePlayerStore((state) => state.answerGame)
  const clearGame = usePlayerStore((state) => state.clearGame)
  const adminActive = useAdminStore((state) => state.isAdmin && state.adminEnabled)
  const toggleFlag = useAdminStore((state) => state.toggleFlag)
  const flaggedSubtitles = useAdminStore((state) => state.flaggedSubtitles)
  const phrases = usePhraseStore((state) => state.phrases)
  const removePhrase = usePhraseStore((state) => state.removePhrase)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = useRef<number>(-1)
  const previousVideoIdRef = useRef(videoId)
  const scrollRafRef = useRef<number | null>(null)
  const savedPhraseMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const phrase of phrases) {
      map.set(`${phrase.videoId}::${phrase.en}`, phrase.id)
    }
    return map
  }, [phrases])

  // Key token inverted index for similar-phrase vibration
  const keyTokenIndex = useMemo(() => {
    const index = new Map<string, string>() // token → phraseId (first match is enough)
    for (const phrase of phrases) {
      for (const token of extractKeyTokens(phrase.en)) {
        if (!index.has(token)) index.set(token, phrase.id)
      }
    }
    return index
  }, [phrases])

  // Similar-phrase vibration on subtitle change
  const lastSimilarVibrateRef = useRef<{ token: string; time: number }>({ token: '', time: 0 })

  useEffect(() => {
    if (activeSubIndex < 0 || keyTokenIndex.size === 0) return
    const sub = subtitles[activeSubIndex]
    if (!sub) return

    // Skip if this exact subtitle is already saved (no need to vibrate)
    if (videoId && savedPhraseMap.has(`${videoId}::${sub.en}`)) return

    const words = sub.en.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/)
    for (const word of words) {
      if (keyTokenIndex.has(word)) {
        const now = Date.now()
        const last = lastSimilarVibrateRef.current
        // 10s cooldown per matched token to avoid spamming
        if (last.token === word && now - last.time < 10_000) break
        lastSimilarVibrateRef.current = { token: word, time: now }
        haptic(50)
        break
      }
    }
  }, [activeSubIndex, keyTokenIndex, savedPhraseMap, subtitles, videoId])

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
  const [freezeIndicatorText, setFreezeIndicatorText] = useState('FREEZE ON')
  const freezeIndicatorTimerRef = useRef<number | null>(null)

  // First-time tooltip
  const [showFreezeTip, setShowFreezeTip] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('studyeng-freeze-tip-shown')
  })
  useEffect(() => {
    if (!showFreezeTip) return

    const timer = window.setTimeout(() => {
      setShowFreezeTip(false)
      localStorage.setItem('studyeng-freeze-tip-shown', '1')
    }, 4000)

    return () => clearTimeout(timer)
  }, [showFreezeTip])

  const showFreezeNotice = useCallback((text: string, duration: number) => {
    setFreezeIndicatorText(text)
    setShowFreezeIndicator(true)
    if (freezeIndicatorTimerRef.current) clearTimeout(freezeIndicatorTimerRef.current)
    freezeIndicatorTimerRef.current = window.setTimeout(() => setShowFreezeIndicator(false), duration)
  }, [])

  // Detect user-initiated scroll via touch events + onScroll
  const handleTouchStart = useCallback(() => {
    // User is touching the scroll area ??any scroll events during touch are user-initiated
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

    // User is manually scrolling ??reveal all subtitles
    setIsUserScrolling(true)

    // Reset the timer on every scroll event
    if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current)
    userScrollTimerRef.current = window.setTimeout(() => {
      setIsUserScrolling(false)
    }, 2500)
  }, [])

  const getSavedPhraseId = useCallback(
    (sub: SubtitleEntry) => {
      if (videoId) {
        const exactMatch = savedPhraseMap.get(`${videoId}::${sub.en}`)
        if (exactMatch) return exactMatch
      }

      return phrases.find((phrase) => phrase.en === sub.en)?.id ?? null
    },
    [phrases, savedPhraseMap, videoId],
  )

  // Check if a subtitle is already saved
  const isSavedPhrase = useCallback(
    (sub: SubtitleEntry) => getSavedPhraseId(sub) !== null,
    [getSavedPhraseId],
  )

  // Auto-scroll to keep the active subtitle centered ??smoothed with rAF
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

  // Enter or move freeze mode to the given subtitle
  const enterFreeze = useCallback(
    (sub: SubtitleEntry, idx: number) => {
      setFreezeSubIndex(idx)
      showFreezeNotice('FREEZE ON', 2500)
      haptic(15)
      onSeek?.(sub.start)
    },
    [onSeek, setFreezeSubIndex, showFreezeNotice],
  )

  // Exit freeze mode
  const exitFreeze = useCallback(() => {
    setFreezeSubIndex(null)
    showFreezeNotice('FREEZE OFF', 1500)
    haptic(10)
  }, [setFreezeSubIndex, showFreezeNotice])

  // Game answer handler
  const handleGameAnswer = useCallback(
    (choiceIndex: number) => {
      answerGame(choiceIndex)
      const isCorrect = choiceIndex === gameCorrectIndex
      if (isCorrect) {
        useUserStore.getState().gainXp(10)
      }
      useDailyMissionStore.getState().incrementMission('play-game')
    },
    [answerGame, gameCorrectIndex],
  )

  // Game continue handler: play the answer sentence then resume
  const gameContinueTimerRef = useRef<number | null>(null)
  const handleGameContinue = useCallback(() => {
    if (gameSentenceIndex === null) return

    // Move freeze to the answer sentence so the user can hear it
    setFreezeSubIndex(gameSentenceIndex)
    playRef.current?.()

    // After 3 seconds, clear freeze and game, resume normal playback
    gameContinueTimerRef.current = window.setTimeout(() => {
      setFreezeSubIndex(null)
      clearGame()
      playRef.current?.()
    }, 3000)
  }, [gameSentenceIndex, setFreezeSubIndex, clearGame])

  // Clean up game continue timer
  useEffect(() => {
    return () => {
      if (gameContinueTimerRef.current) clearTimeout(gameContinueTimerRef.current)
    }
  }, [])

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

      if (last.idx === idx && now - last.time < DOUBLE_TAP_WINDOW) {
        const savedPhraseId = getSavedPhraseId(sub)

        if (savedPhraseId) {
          removePhrase(savedPhraseId)
          setJustSavedIdx(null)
          haptic(8)
        } else if (onSavePhrase) {
          onSavePhrase(sub)
          haptic(12)
          setShowFreezeIndicator(false)
          setShowFreezeTip(false)
          setJustSavedIdx(idx)
          if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current)
          savedFeedbackTimerRef.current = window.setTimeout(() => setJustSavedIdx(null), 1200)
        }
        lastTapRef.current = { idx: -1, time: 0 }
      } else if (freezeSubIndex !== null) {
        // Freeze mode is active
        if (freezeSubIndex === idx) {
          // Keep freeze active on single tap. Long-press handles freeze off.
          onSeek?.(sub.start)
        } else {
          // Tap different subtitle ??move freeze to it
          enterFreeze(sub, idx)
        }
        lastTapRef.current = { idx, time: now }
      } else {
        // Normal single tap ??seek
        onSeek?.(sub.start)
        lastTapRef.current = { idx, time: now }
      }
    },
    [
      enterFreeze,
      freezeSubIndex,
      getSavedPhraseId,
      onSavePhrase,
      onSeek,
      removePhrase,
    ],
  )

  // Long-press: pointerdown starts timer, pointerup/move cancels
  const handlePointerDown = useCallback(
    (sub: SubtitleEntry, idx: number, e: React.PointerEvent) => {
      longPressFiredRef.current = false
      pointerStartRef.current = { x: e.clientX, y: e.clientY }

      longPressTimerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true
        if (freezeSubIndex === idx) {
          // Long-press on already-frozen subtitle ??exit freeze
          exitFreeze()
        } else {
          // Long-press ??enter freeze on this subtitle
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

  // Clear freeze only when the actual video changes.
  useEffect(() => {
    if (previousVideoIdRef.current === videoId) {
      return
    }

    previousVideoIdRef.current = videoId
    setFreezeSubIndex(null)
  }, [setFreezeSubIndex, videoId])

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
  const visibilityRadius = Math.max(1, Math.floor(visibleLineCount / 2))
  const activeNotice =
    justSavedIdx !== null
      ? { message: 'SAVED', tone: 'accent' as const }
      : showFreezeIndicator
        ? { message: freezeIndicatorText, tone: 'freeze' as const }
        : showFreezeTip
          ? { message: 'HOLD TO FREEZE', tone: 'muted' as const }
          : null

  if (subtitleMode === 'none' || subtitles.length === 0) return null

  return (
    <div
      className="w-full h-full z-10 pointer-events-auto relative"
      onClick={(e) => e.stopPropagation()}
    >
      <DoubleTapTip />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
        <SaveToast
          show={Boolean(activeNotice)}
          message={activeNotice?.message ?? ''}
          placement="inline"
          tone={activeNotice?.tone ?? 'default'}
        />
      </div>

      <style>{`
        @keyframes freezeFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes freezePulse {
          0%, 100% { box-shadow: 0 0 8px var(--freeze-shadow); }
          50% { box-shadow: 0 0 16px var(--freeze-shadow); }
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
            // When game is active, hide all subtitles after the frozen one
            // (the game UI will be shown instead)
            if (gameActive && gameSentenceIndex !== null && idx > freezeSubIndex!) {
              return null
            }

            const isActive = idx === activeSubIndex
            const isFrozen = freezeSubIndex === idx
            const distance = activeSubIndex >= 0 ? Math.abs(idx - activeSubIndex) : 999
            const isJustSaved = justSavedIdx === idx
            const saved = isSavedPhrase(sub)

            // Show active + nearby subtitles with gradual fade (lyrics-view feel)
            // When user is manually scrolling, reveal all subtitles
            // IMPORTANT: Never use pointer-events-none on individual items —
            // it blocks touch events and prevents scroll initiation.
            const opacityValue = (() => {
              if (isJustSaved || isActive || isFrozen) return 1

              if (isUserScrolling) {
                if (distance === 1) return 0.75
                if (distance === 2) return 0.6
                if (distance === 3) return 0.5
                return 0.45
              }

              if (distance > visibilityRadius) return 0
              if (visibilityRadius >= 3) {
                if (distance === 1) return 0.78
                if (distance === 2) return 0.52
                if (distance === 3) return 0.28
              }
              if (distance === 1) return 0.45
              if (distance === 2) return 0.22
              return 0.1
            })()

            // Whether this subtitle is fully hidden (not visible, not interactable)
            // Wrapper div stays pointer-events-auto for scroll, but inner button is disabled
            const isHidden =
              !isUserScrolling &&
              !isJustSaved &&
              !isActive &&
              !isFrozen &&
              distance > visibilityRadius

            const scaleValue = isUserScrolling
              ? (isJustSaved || isActive || isFrozen
                  ? 1
                  : distance === 1
                    ? 0.95
                    : distance === 2
                      ? 0.93
                      : distance === 3
                        ? 0.91
                        : 0.89)
              : isJustSaved || isActive || isFrozen
                ? 1
                : visibilityRadius >= 3
                  ? distance === 1
                    ? 0.96
                    : distance === 2
                      ? 0.93
                      : distance === 3
                        ? 0.9
                        : 0.87
                  : distance === 1
                    ? 0.94
                    : distance === 2
                      ? 0.9
                      : 0.85

            const flagged = adminActive && videoId
              ? flaggedSubtitles.some(
                  (flag) => flag.videoId === videoId && flag.entryIndex === idx,
                )
              : false

            return (
              <div
                key={idx}
                ref={(el) => { lineRefs.current[idx] = el }}
                className="relative flex w-full items-center justify-center will-change-[transform,opacity]"
                style={{
                  opacity: opacityValue,
                  transform: `scale(${scaleValue})`,
                  transition: 'opacity 250ms ease-out, transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div className="relative flex items-center gap-1.5 max-w-[92%]">
                  {/* Admin flag ??inline left of text */}
                  {adminActive && videoId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFlag(videoId, idx, sub.en)
                      }}
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-all active:scale-90 ${
                        flagged ? 'bg-red-500/30 text-red-400' : ''
                      }`}
                      style={
                        flagged
                          ? undefined
                          : {
                              backgroundColor: 'var(--player-panel)',
                              color: 'var(--player-faint)',
                            }
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                      </svg>
                    </button>
                  )}

                  {/* Freeze repeat icon ??absolutely positioned so it never shifts subtitle text */}
                  {isFrozen && (
                    <span
                      className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 select-none"
                      style={{ color: 'var(--freeze-icon)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.647a.75.75 0 0 0-.75.75v3.585a.75.75 0 0 0 1.5 0v-2.19l.238.238a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.035-.1zm-2.623-7.26a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.035.1 5.5 5.5 0 0 1 9.201-2.466l.312.311H9.092a.75.75 0 0 0 0 1.5h3.585a.75.75 0 0 0 .75-.75V2.412a.75.75 0 0 0-1.5 0v2.19l-.238-.238z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}

                  {/* Saved phrase bookmark icon ??absolutely positioned on the right, symmetrical with freeze icon */}
                  {(saved || isJustSaved) && (
                    <span
                      className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none"
                      style={{ color: isJustSaved ? 'var(--accent-text)' : 'var(--accent-primary)' }}
                    >
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
                    className={`w-full select-none px-3 py-1.5 text-center touch-manipulation ${
                      isJustSaved || isActive || isFrozen ? 'text-base font-semibold' : 'text-sm'
                    } ${isFrozen || isActive ? 'rounded-lg backdrop-blur-md' : ''}`}
                    style={{
                      transition: 'color 200ms ease-out, background-color 350ms ease-out, box-shadow 300ms ease-out',
                      color: isFrozen
                        ? 'var(--freeze-text)'
                        : isJustSaved || isActive
                          ? 'var(--player-text)'
                          : distance === 1 || isUserScrolling
                            ? 'var(--player-muted)'
                            : 'var(--player-faint)',
                      backgroundColor: isFrozen
                        ? 'var(--freeze-bg)'
                        : isActive
                          ? 'var(--player-active-subtitle-bg)'
                          : 'transparent',
                      boxShadow: isFrozen ? '0 0 0 2px var(--freeze-border)' : undefined,
                      ...(isFrozen
                        ? { textShadow: 'var(--player-shadow)', animation: 'freezePulse 2s ease-in-out infinite' }
                        : isJustSaved
                        ? { textShadow: 'var(--player-shadow)' }
                        : isActive
                        ? { textShadow: 'var(--player-shadow)' }
                        : {}),
                    }}
                  >
                    <>
                      <span>{sub.en}</span>
                      {(isActive || isFrozen) && showKo && sub.ko && (
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: isFrozen ? 'var(--freeze-icon)' : 'var(--accent-text)' }}
                        >
                          {sub.ko}
                        </p>
                      )}
                    </>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Game quiz UI — shown inline after the frozen subtitle */}
          {gameActive && gameChoices.length > 0 && (
            <SubtitleGame
              choices={gameChoices}
              correctIndex={gameCorrectIndex}
              result={gameResult}
              onAnswer={handleGameAnswer}
              onContinue={handleGameContinue}
            />
          )}

          {/* Bottom spacer to allow last item to center */}
          <div className="h-[60px] flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}
