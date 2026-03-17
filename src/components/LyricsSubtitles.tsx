'use client'

import { useRef, useEffect, useCallback, useId, useMemo, useState, type SyntheticEvent } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { getLocalizedSubtitle, getLocalizedMeaning } from '@/lib/localeUtils'
import { SaveToast } from './SaveToast'
import type { SubtitleEntry } from '@/data/seed-videos'
import expressionIndexData from '@/data/expression-index-v3.json'
import expressionEntriesData from '@/data/expression-entries-v2.json'
import { CEFR_ORDER } from '@/types/level'
import type { CefrLevel } from '@/types/level'

const expressionIndex = expressionIndexData as Record<string, Array<{
  exprId: string
  sentenceIdx: number
  en: string
  ko: string
  surfaceForm: string
}>>

const expressionEntries = expressionEntriesData as Record<string, {
  canonical: string
  meaning_ko: string
  category: string
  cefr: string
  [key: string]: unknown
}>

/** Check if an expression's CEFR level matches the user's level (within 1 step) */
function isAtUserLevel(exprCefr: string, userLevel: CefrLevel): boolean {
  const exprIdx = CEFR_ORDER.indexOf(exprCefr as CefrLevel)
  const userIdx = CEFR_ORDER.indexOf(userLevel)
  if (exprIdx < 0 || userIdx < 0) return false
  return Math.abs(exprIdx - userIdx) <= 1
}

interface ExpressionMatch {
  exprId: string
  surfaceForm: string
  meaning: string
  cefr: string
  isFamiliar: boolean
  isAtLevel: boolean
}

/** Find expression matches within a subtitle line for the given video */
function findExpressionMatches(
  text: string,
  videoId: string | undefined,
  sentenceIdx: number,
  familiarCheck: (id: string) => boolean,
  userLevel: CefrLevel,
  locale: string = 'ko',
): ExpressionMatch[] {
  if (!videoId) return []
  const videoExprs = expressionIndex[videoId]
  if (!videoExprs) return []

  const matches: ExpressionMatch[] = []
  const textLower = text.toLowerCase()

  for (const entry of videoExprs) {
    // Match by sentence index for precision
    if (entry.sentenceIdx !== sentenceIdx) continue

    const surfaceLower = entry.surfaceForm.toLowerCase()
    if (!textLower.includes(surfaceLower)) continue

    const dictEntry = expressionEntries[entry.exprId]
    const cefr = dictEntry?.cefr ?? 'B1'
    const meaning = dictEntry
      ? getLocalizedMeaning(dictEntry as { meaning_ko?: string; meaning_ja?: string; meaning_zhTW?: string; meaning_vi?: string }, locale as 'ko' | 'ja' | 'zh-TW' | 'vi')
      : entry.ko ?? ''

    matches.push({
      exprId: entry.exprId,
      surfaceForm: entry.surfaceForm,
      meaning,
      cefr,
      isFamiliar: familiarCheck(entry.exprId),
      isAtLevel: isAtUserLevel(cefr, userLevel),
    })
  }

  return matches
}

/** Render subtitle text with expression underlines */
function AnnotatedSubtitleText({
  text,
  matches,
  onExpressionTap,
}: {
  text: string
  matches: ExpressionMatch[]
  onExpressionTap: (match: ExpressionMatch, rect: DOMRect) => void
}) {
  if (matches.length === 0) return <>{text}</>

  // Sort matches by position in text (first occurrence), longest first for overlapping
  const sortedMatches = [...matches]
    .map((m) => {
      const idx = text.toLowerCase().indexOf(m.surfaceForm.toLowerCase())
      return { ...m, startIdx: idx, endIdx: idx + m.surfaceForm.length }
    })
    .filter((m) => m.startIdx >= 0)
    .sort((a, b) => a.startIdx - b.startIdx || b.surfaceForm.length - a.surfaceForm.length)

  // Remove overlapping matches (keep the first/longest)
  const nonOverlapping: typeof sortedMatches = []
  let lastEnd = 0
  for (const m of sortedMatches) {
    if (m.startIdx >= lastEnd) {
      nonOverlapping.push(m)
      lastEnd = m.endIdx
    }
  }

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const m of nonOverlapping) {
    // Text before this match
    if (m.startIdx > cursor) {
      parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, m.startIdx)}</span>)
    }

    const matchedText = text.slice(m.startIdx, m.endIdx)

    if (m.isFamiliar) {
      // Familiar: small green dot below text
      parts.push(
        <span
          key={`e-${m.startIdx}`}
          className="relative inline-block"
        >
          {matchedText}
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: '-4px',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
            }}
          />
        </span>,
      )
    } else if (m.isAtLevel) {
      // At user's level but not familiar: small blue dot below text, tappable
      parts.push(
        <span
          key={`e-${m.startIdx}`}
          role="button"
          tabIndex={-1}
          className="relative inline-block"
          onClick={(e) => {
            e.stopPropagation()
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            onExpressionTap(m, rect)
          }}
          style={{ cursor: 'pointer' }}
        >
          {matchedText}
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: '-4px',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              backgroundColor: '#60a5fa',
            }}
          />
        </span>,
      )
    } else {
      parts.push(<span key={`e-${m.startIdx}`}>{matchedText}</span>)
    }

    cursor = m.endIdx
  }

  // Remaining text
  if (cursor < text.length) {
    parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>)
  }

  return <>{parts}</>
}

interface LyricsSubtitlesProps {
  subtitles: SubtitleEntry[]
  videoId?: string
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
  onPause?: () => void
  onResume?: () => void
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
  onPause,
  onResume,
  visibleLineCount = 3,
}: LyricsSubtitlesProps) {
  const locale = useLocaleStore((s) => s.locale)
  const isRainbowTheme = useThemeStore((state) => state.colorTheme === 'rainbow')
  const subtitleMode = usePlayerStore((state) => state.subtitleMode)
  const activeSubIndex = usePlayerStore((state) => state.activeSubIndex)
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const setFreezeSubIndex = usePlayerStore((state) => state.setFreezeSubIndex)
  const gameActive = usePlayerStore((state) => state.gameActive)
  const gameSentenceIndex = usePlayerStore((state) => state.gameSentenceIndex)
  const adminActive = useAdminStore((state) => state.isAdmin && state.adminEnabled)
  const toggleFlag = useAdminStore((state) => state.toggleFlag)
  const flaggedSubtitles = useAdminStore((state) => state.flaggedSubtitles)
  const phrases = usePhraseStore((state) => state.phrases)
  const removePhrase = usePhraseStore((state) => state.removePhrase)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = useRef<number>(-1)
  const previousVideoIdRef = useRef(videoId)
  const iconGradientBaseId = useId().replace(/:/g, '')
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

  // Dismiss expression popup on subtitle change
  useEffect(() => {
    setExprPopup(null)
  }, [activeSubIndex])

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
  const replayTimerRef = useRef<number | null>(null)

  // Long-press detection refs
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  // Freeze mode indicator (shows briefly then fades)
  const [showFreezeIndicator, setShowFreezeIndicator] = useState(false)
  const [freezeIndicatorText, setFreezeIndicatorText] = useState('FREEZE ON')
  const freezeIndicatorTimerRef = useRef<number | null>(null)
  const [edgeSpacerHeight, setEdgeSpacerHeight] = useState(60)

  // Smart subtitle expression matching
  const smartSubtitlesEnabled = useSettingsStore((state) => state.smartSubtitlesEnabled)
  const familiarityIsFamiliar = useFamiliarityStore((s) => s.isFamiliar)
  const userCefrLevel = useOnboardingStore((s) => s.level)

  // Expression popup state
  const [exprPopup, setExprPopup] = useState<{
    match: ExpressionMatch
    x: number
    y: number
  } | null>(null)
  const exprPopupTimerRef = useRef<number | null>(null)

  const handleExpressionTap = useCallback((match: ExpressionMatch, rect: DOMRect) => {
    // Position popup above the tapped word
    setExprPopup({
      match,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
    // Auto-dismiss after 3 seconds
    if (exprPopupTimerRef.current) clearTimeout(exprPopupTimerRef.current)
    exprPopupTimerRef.current = window.setTimeout(() => setExprPopup(null), 3000)
  }, [])

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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSpacerHeight = () => {
      setEdgeSpacerHeight(Math.max(Math.round(container.clientHeight / 2 - 44), 60))
    }

    updateSpacerHeight()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSpacerHeight)
      return () => window.removeEventListener('resize', updateSpacerHeight)
    }

    const observer = new ResizeObserver(updateSpacerHeight)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

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

  const stopGesturePropagation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation()
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
          savedFeedbackTimerRef.current = window.setTimeout(() => {
            setJustSavedIdx(null)
          }, 1500)
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
      onResume,
      onSavePhrase,
      onSeek,
      removePhrase,
    ],
  )

  const handleSavedIconClick = useCallback(
    (phraseId: string, idx: number, event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      removePhrase(phraseId)
      if (justSavedIdx === idx) {
        setJustSavedIdx(null)
      }
      haptic(8)
      lastTapRef.current = { idx: -1, time: 0 }
    },
    [justSavedIdx, removePhrase],
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
      if (exprPopupTimerRef.current) clearTimeout(exprPopupTimerRef.current)
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current)
    }
  }, [])

  const showTranslation = subtitleMode === 'en-ko'
  const visibilityRadius = Math.max(1, Math.floor(visibleLineCount / 2))
  const activeNotice =
    justSavedIdx !== null
      ? { message: 'SAVED', tone: 'saved' as const }
      : showFreezeIndicator
        ? { message: freezeIndicatorText, tone: 'freeze' as const }
        : showFreezeTip
          ? { message: 'HOLD TO FREEZE', tone: 'muted' as const }
          : null

  if (subtitleMode === 'none' || subtitles.length === 0) return null

  return (
    <div
      className="w-full h-full z-10 pointer-events-auto relative"
      data-no-feed-drag="true"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
        <div className="pointer-events-auto inline-flex items-center gap-1.5">
          <SaveToast
            show={Boolean(activeNotice)}
            message={activeNotice?.message ?? ''}
            placement="inline"
            tone={activeNotice?.tone ?? 'default'}
          />
        </div>
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
        onPointerDown={stopGesturePropagation}
        onPointerMove={stopGesturePropagation}
        onPointerUp={stopGesturePropagation}
        onTouchStart={handleTouchStart}
        onTouchMove={stopGesturePropagation}
        onWheel={handleWheel}
        onWheelCapture={stopGesturePropagation}
        onScroll={handleScroll}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Top spacer to allow first item to center */}
          <div className="flex-shrink-0" style={{ height: `${edgeSpacerHeight}px` }} />

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
            const savedPhraseId = getSavedPhraseId(sub)
            const saved = savedPhraseId !== null

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
            const freezeGradientId = `${iconGradientBaseId}-freeze-${idx}`
            const savedGradientId = `${iconGradientBaseId}-saved-${idx}`

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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill={isRainbowTheme ? `url(#${freezeGradientId})` : 'currentColor'}
                        className="w-4 h-4"
                      >
                        {isRainbowTheme && (
                          <defs>
                            <linearGradient
                              id={freezeGradientId}
                              x1="2"
                              y1="2"
                              x2="18"
                              y2="18"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop offset="0%" stopColor="#ff5ac8" />
                              <stop offset="24%" stopColor="#ff9538" />
                              <stop offset="50%" stopColor="#ffd84a" />
                              <stop offset="76%" stopColor="#53d7ff" />
                              <stop offset="100%" stopColor="#7c4dff" />
                            </linearGradient>
                          </defs>
                        )}
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.647a.75.75 0 0 0-.75.75v3.585a.75.75 0 0 0 1.5 0v-2.19l.238.238a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.035-.1zm-2.623-7.26a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.035.1 5.5 5.5 0 0 1 9.201-2.466l.312.311H9.092a.75.75 0 0 0 0 1.5h3.585a.75.75 0 0 0 .75-.75V2.412a.75.75 0 0 0-1.5 0v2.19l-.238-.238z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}

                  {/* Saved phrase bookmark icon ??absolutely positioned on the right, symmetrical with freeze icon */}
                  {(saved || isJustSaved) &&
                    (savedPhraseId ? (
                      <button
                        type="button"
                        onClick={(event) => handleSavedIconClick(savedPhraseId, idx, event)}
                        className="absolute -right-6 top-1/2 z-[1] -translate-y-1/2 select-none rounded-full p-0.5 transition-transform active:scale-90"
                        style={{ color: 'var(--accent-primary)' }}
                        aria-label="Unsave"
                        title="Unsave"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={isRainbowTheme ? `url(#${savedGradientId})` : 'currentColor'}
                          className="h-4 w-4"
                        >
                          {isRainbowTheme && (
                            <defs>
                              <linearGradient
                                id={savedGradientId}
                                x1="3"
                                y1="3"
                                x2="21"
                                y2="21"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop offset="0%" stopColor="#ff5ac8" />
                                <stop offset="24%" stopColor="#ff9538" />
                                <stop offset="50%" stopColor="#ffd84a" />
                                <stop offset="76%" stopColor="#53d7ff" />
                                <stop offset="100%" stopColor="#7c4dff" />
                              </linearGradient>
                            </defs>
                          )}
                          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      <span
                        className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={isRainbowTheme ? `url(#${savedGradientId})` : 'currentColor'}
                          className="h-4 w-4"
                        >
                          {isRainbowTheme && (
                            <defs>
                              <linearGradient
                                id={savedGradientId}
                                x1="3"
                                y1="3"
                                x2="21"
                                y2="21"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop offset="0%" stopColor="#ff5ac8" />
                                <stop offset="24%" stopColor="#ff9538" />
                                <stop offset="50%" stopColor="#ffd84a" />
                                <stop offset="76%" stopColor="#53d7ff" />
                                <stop offset="100%" stopColor="#7c4dff" />
                              </linearGradient>
                            </defs>
                          )}
                          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                        </svg>
                      </span>
                    ))}

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
                      <span>
                        {(smartSubtitlesEnabled && isFrozen) ? (
                          <AnnotatedSubtitleText
                            text={sub.en}
                            matches={findExpressionMatches(sub.en, videoId, idx, familiarityIsFamiliar, userCefrLevel, locale)}
                            onExpressionTap={handleExpressionTap}
                          />
                        ) : (
                          sub.en
                        )}
                      </span>
                      {(isActive || isFrozen) && showTranslation && getLocalizedSubtitle(sub, locale) && (
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: isFrozen ? 'var(--freeze-icon)' : 'var(--accent-text)' }}
                        >
                          {getLocalizedSubtitle(sub, locale)}
                        </p>
                      )}
                    </>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Game quiz UI — shown inline after the frozen subtitle */}
          {/* Bottom spacer to allow last item to center */}
          <div className="flex-shrink-0" style={{ height: `${edgeSpacerHeight}px` }} />
        </div>
      </div>

      {/* Expression meaning popup */}
      {exprPopup && (
        <div
          className="pointer-events-auto fixed z-[100]"
          style={{
            left: `${exprPopup.x}px`,
            top: `${exprPopup.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={(e) => {
            e.stopPropagation()
            setExprPopup(null)
          }}
        >
          <div
            className="rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: 'var(--player-panel)',
              borderColor: 'var(--player-chip-border)',
              maxWidth: '220px',
            }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--player-text)' }}>
              {exprPopup.match.surfaceForm}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--player-muted)' }}>
              {exprPopup.match.meaning}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(96, 165, 250, 0.7)' }}>
              {exprPopup.match.cefr}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
