'use client'

import {
  memo,
  useId,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useTranscript } from '@/hooks/useTranscript'
import { useGameTrigger } from '@/hooks/useGameTrigger'
import { usePlayerStore, seekToRef, playRef, pauseRef } from '@/stores/usePlayerStore'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { getSmartPrimingExpressions } from '@/lib/expressionLookup'
import { getSmartPrimingWords } from '@/lib/wordLookup'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { triggerHaptic } from '@/lib/haptic'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import { LyricsSubtitles } from './LyricsSubtitles'
import { PrimingCard } from './PrimingCard'
import { ProgressBar } from './ProgressBar'
import { SaveToast } from './SaveToast'
import { SubtitleGame } from './SubtitleGame'
import type { SubtitleEntry } from '@/data/seed-videos'

interface VideoPlayerProps {
  videoId?: string
  youtubeId: string
  subtitles: SubtitleEntry[]
  clipStart?: number
  clipEnd?: number
  format?: 'shorts' | 'clip'
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onClipComplete?: () => void
  onVideoErrorSkip?: () => boolean | void
  onEmbedBlocked?: () => void
  onPlaybackStarted?: () => void
  isLandscapeViewport?: boolean
  useLandscapeSplitLayout?: boolean
  useLandscapeOverlaySubtitles?: boolean
  landscapeVideoPaneWidth?: string
  landscapeBottomSubtitleHeight?: number
  initialSeekTime?: number
  children?: ReactNode
}

const SIMILAR_CUE_STOPWORDS = new Set([
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

function extractSimilarCueTokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/)
    .filter((word) => word.length > 2 && !SIMILAR_CUE_STOPWORDS.has(word))
}

function normalizeSubtitleText(text: string) {
  return text.toLowerCase().replace(/[^\w\s']/g, '').replace(/\s+/g, ' ').trim()
}

function findPrimingSubtitle(
  subtitles: SubtitleEntry[],
  sentenceEn: string,
  keyword?: string,
) {
  const normalizedSentence = normalizeSubtitleText(sentenceEn)
  const normalizedKeyword = keyword ? normalizeSubtitleText(keyword) : ''

  return subtitles.find((subtitle) => {
    const normalizedSubtitle = normalizeSubtitleText(subtitle.en)
    return (
      normalizedSubtitle === normalizedSentence ||
      (normalizedKeyword.length > 0 &&
        (normalizedSubtitle.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedSubtitle)))
    )
  })
}

const PlayerMount = memo(function PlayerMount({ containerId }: { containerId: string }) {
  return <div id={containerId} className="h-full w-full" />
})

export function VideoPlayer({
  videoId,
  youtubeId,
  subtitles: propSubtitles,
  clipStart = 0,
  clipEnd = 0,
  format,
  onSavePhrase,
  onClipComplete,
  onVideoErrorSkip,
  onEmbedBlocked,
  onPlaybackStarted,
  isLandscapeViewport = false,
  useLandscapeSplitLayout = false,
  useLandscapeOverlaySubtitles = false,
  landscapeVideoPaneWidth = '62%',
  landscapeBottomSubtitleHeight = 184,
  initialSeekTime,
  children,
}: VideoPlayerProps) {
  const isShortsFormat = format === 'shorts'
  const containerId = `yt-player-${useId().replace(/:/g, '')}`

  const { subtitles: fetchedSubtitles, loading: transcriptLoading } = useTranscript(youtubeId)

  const subtitles = useMemo(() => {
    const raw =
      transcriptLoading && fetchedSubtitles.length === 0 ? propSubtitles : fetchedSubtitles
    if (clipEnd > clipStart) {
      return raw.filter((subtitle) => subtitle.end > clipStart && subtitle.start < clipEnd)
    }
    return raw
  }, [clipEnd, clipStart, fetchedSubtitles, propSubtitles, transcriptLoading])

  const { ready, playbackStarted, play, pause, seekTo, player, videoError, clearVideoError } =
    useYouTubePlayer(
      containerId,
      youtubeId,
      clipStart,
      clipEnd,
      subtitles,
      onClipComplete,
      initialSeekTime,
      onEmbedBlocked,
    )
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const subtitleMode = usePlayerStore((state) => state.subtitleMode)
  const landscapeSubtitleLayout = usePlayerStore((state) => state.landscapeSubtitleLayout)
  const cycleLandscapeSubtitleLayout = usePlayerStore(
    (state) => state.cycleLandscapeSubtitleLayout,
  )
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const setFreezeSubIndex = usePlayerStore((state) => state.setFreezeSubIndex)
  const setFeedSwipeLocked = usePlayerStore((state) => state.setFeedSwipeLocked)
  const gameActive = usePlayerStore((state) => state.gameActive)
  const gameSentenceIndex = usePlayerStore((state) => state.gameSentenceIndex)
  const gameChoices = usePlayerStore((state) => state.gameChoices)
  const gameCorrectIndex = usePlayerStore((state) => state.gameCorrectIndex)
  const gameResult = usePlayerStore((state) => state.gameResult)
  const answerGame = usePlayerStore((state) => state.answerGame)
  const clearGame = usePlayerStore((state) => state.clearGame)

  // Game trigger: watches subtitles and triggers "next line" quiz
  useGameTrigger(youtubeId, subtitles)

  // --- Priming card: show key expressions before video plays ---
  const primingEnabled = useSettingsStore((state) => state.primingEnabled)
  const userLevel = useOnboardingStore((state) => state.level)
  const familiarExprs = useFamiliarityStore((state) => state.entries)
  const markFamiliar = useFamiliarityStore((state) => state.markFamiliar)
  const primingExpressions = useMemo(() => {
    if (!primingEnabled || !youtubeId) return []
    return getSmartPrimingExpressions(youtubeId, userLevel, familiarExprs, 3)
  }, [primingEnabled, youtubeId, userLevel, familiarExprs])

  const primingWords = useMemo(() => {
    if (!primingEnabled || !youtubeId) return []
    return getSmartPrimingWords(youtubeId, userLevel, familiarExprs, 3)
  }, [primingEnabled, youtubeId, userLevel, familiarExprs])

  const videoSessionKey = `${videoId ?? 'video'}:${youtubeId}`
  const [dismissedPrimingKey, setDismissedPrimingKey] = useState<string | null>(null)
  const showPriming = (primingExpressions.length > 0 || primingWords.length > 0) && dismissedPrimingKey !== videoSessionKey
  const primingResetTime = initialSeekTime ?? clipStart
  const primingPreviewTimerRef = useRef<number | null>(null)
  const autoSkipTimerRef = useRef<number | null>(null)
  const autoSkipAttemptKeyRef = useRef<string | null>(null)

  const clearPrimingPreview = useCallback(
    (resume: 'pause' | 'play' = 'pause') => {
      if (primingPreviewTimerRef.current) {
        window.clearTimeout(primingPreviewTimerRef.current)
        primingPreviewTimerRef.current = null
      }

      seekTo(primingResetTime)
      if (resume === 'play') {
        play()
      } else {
        pause()
      }
    },
    [pause, play, primingResetTime, seekTo],
  )

  const handlePrimingDismiss = useCallback(() => {
    setDismissedPrimingKey(videoSessionKey)
    clearPrimingPreview('play')
  }, [clearPrimingPreview, videoSessionKey])

  useEffect(() => {
    setFreezeSubIndex(null)
  }, [setFreezeSubIndex, videoId, youtubeId])

  useEffect(() => {
    if (showPriming && playbackStarted) pause()
  }, [showPriming, playbackStarted, pause])

  const vibratedRef = useRef(new Set<number>())
  useEffect(() => { vibratedRef.current = new Set() }, [youtubeId, videoId])

  const activeSubForHaptic = usePlayerStore((state) => state.activeSubIndex)
  const phrases = usePhraseStore((state) => state.phrases)
  const [cueNotice, setCueNotice] = useState<{
    message: string
    tone: 'accent' | 'learning' | 'saved'
  } | null>(null)
  const cueNoticeTimerRef = useRef<number | null>(null)
  const lastSimilarCueRef = useRef<{ token: string; time: number }>({ token: '', time: 0 })
  const lastSavedCueRef = useRef<{ subtitleKey: string; time: number }>({
    subtitleKey: '',
    time: 0,
  })

  const showCueNotice = useCallback(
    (message: string, tone: 'accent' | 'learning' | 'saved', duration = 1350) => {
      setCueNotice({ message, tone })
      if (cueNoticeTimerRef.current) {
        window.clearTimeout(cueNoticeTimerRef.current)
      }
      cueNoticeTimerRef.current = window.setTimeout(() => {
        setCueNotice(null)
        cueNoticeTimerRef.current = null
      }, duration)
    },
    [],
  )

  const savedPhraseMap = useMemo(() => {
    const entries = new Set<string>()
    for (const phrase of phrases) {
      entries.add(`${phrase.videoId}::${phrase.en}`)
    }
    return entries
  }, [phrases])

  const similarPhraseTokenSet = useMemo(() => {
    const tokens = new Set<string>()
    for (const phrase of phrases) {
      for (const token of extractSimilarCueTokens(phrase.en)) {
        tokens.add(token)
      }
    }
    return tokens
  }, [phrases])

  const primingCueBySubtitleIndex = useMemo(() => {
    const map = new Map<number, string>()
    for (const ve of primingExpressions) {
      const matchedSubtitle = findPrimingSubtitle(
        subtitles,
        ve.sentence.en,
        ve.expression.canonical,
      )
      const idx = matchedSubtitle ? subtitles.indexOf(matchedSubtitle) : -1
      if (idx >= 0 && !map.has(idx)) {
        map.set(idx, ve.expression.canonical)
      }
    }
    return map
  }, [primingExpressions, subtitles])

  useEffect(() => {
    return () => {
      if (cueNoticeTimerRef.current) {
        window.clearTimeout(cueNoticeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (
      activeSubForHaptic >= 0 &&
      primingCueBySubtitleIndex.has(activeSubForHaptic) &&
      !vibratedRef.current.has(activeSubForHaptic) &&
      !showPriming
    ) {
      vibratedRef.current.add(activeSubForHaptic)
      triggerHaptic([40, 30, 60])
      const phrase = primingCueBySubtitleIndex.get(activeSubForHaptic)
      if (phrase) {
        const timer = window.setTimeout(() => {
          showCueNotice(`KEY | ${phrase.toUpperCase()}`, 'accent', 1500)
        }, 0)
        return () => window.clearTimeout(timer)
      }
    }
  }, [activeSubForHaptic, primingCueBySubtitleIndex, showCueNotice, showPriming])

  useEffect(() => {
    if (activeSubForHaptic < 0 || showPriming) return

    const subtitle = subtitles[activeSubForHaptic]
    if (!subtitle) return
    if (primingCueBySubtitleIndex.has(activeSubForHaptic)) return
    const subtitleKey = `${videoId ?? youtubeId}::${subtitle.en}`

    if (savedPhraseMap.has(subtitleKey)) {
      const now = Date.now()
      const lastCue = lastSavedCueRef.current
      if (lastCue.subtitleKey === subtitleKey && now - lastCue.time < 10_000) {
        return
      }

      lastSavedCueRef.current = { subtitleKey, time: now }
      const timer = window.setTimeout(() => {
        showCueNotice(`SAVED | ${subtitle.en.slice(0, 28).toUpperCase()}`, 'saved', 1600)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    for (const token of extractSimilarCueTokens(subtitle.en)) {
      if (!similarPhraseTokenSet.has(token)) continue

      const now = Date.now()
      const lastCue = lastSimilarCueRef.current
      if (lastCue.token === token && now - lastCue.time < 10_000) {
        break
      }

      lastSimilarCueRef.current = { token, time: now }
      const timer = window.setTimeout(() => {
        showCueNotice(`SIMILAR | ${token.toUpperCase()}`, 'learning', 1300)
      }, 0)
      return () => window.clearTimeout(timer)
      break
    }
  }, [
    activeSubForHaptic,
    primingCueBySubtitleIndex,
    savedPhraseMap,
    showCueNotice,
    showPriming,
    similarPhraseTokenSet,
    subtitles,
    videoId,
    youtubeId,
  ])

  const [overlayVisible, setOverlayVisible] = useState(true)
  const [showPauseIcon, setShowPauseIcon] = useState(false)
  const [pauseIconType, setPauseIconType] = useState<'play' | 'pause'>('pause')
  const iconTimerRef = useRef<number | null>(null)
  const gameContinueTimerRef = useRef<number | null>(null)
  const playbackStartedNotifiedRef = useRef(false)
  const suppressTapUntilRef = useRef(0)

  const suppressVideoTap = useCallback(() => {
    suppressTapUntilRef.current = performance.now() + 450
  }, [])

  useEffect(() => {
    if (playbackStarted) {
      const timer = window.setTimeout(() => {
        setOverlayVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [playbackStarted])

  useEffect(() => {
    if (!playbackStarted || playbackStartedNotifiedRef.current) return
    playbackStartedNotifiedRef.current = true
    trackEvent(AnalyticsEvents.VIDEO_WATCH_COMPLETE, { video_id: youtubeId })
    onPlaybackStarted?.()
  }, [onPlaybackStarted, playbackStarted, youtubeId])

  useEffect(() => {
    playbackStartedNotifiedRef.current = false
    autoSkipAttemptKeyRef.current = null
    if (autoSkipTimerRef.current) {
      window.clearTimeout(autoSkipTimerRef.current)
      autoSkipTimerRef.current = null
    }
    if (primingPreviewTimerRef.current) {
      window.clearTimeout(primingPreviewTimerRef.current)
      primingPreviewTimerRef.current = null
    }
  }, [videoId, youtubeId, initialSeekTime])

  useEffect(() => {
    if (!videoError || !onVideoErrorSkip) return
    if (autoSkipAttemptKeyRef.current === videoSessionKey) return

    autoSkipAttemptKeyRef.current = videoSessionKey
    autoSkipTimerRef.current = window.setTimeout(() => {
      const skipped = onVideoErrorSkip()
      if (skipped !== false) {
        clearVideoError()
      } else {
        autoSkipAttemptKeyRef.current = null
      }
      autoSkipTimerRef.current = null
    }, 900)

    return () => {
      if (autoSkipTimerRef.current) {
        window.clearTimeout(autoSkipTimerRef.current)
        autoSkipTimerRef.current = null
      }
    }
  }, [clearVideoError, onVideoErrorSkip, videoError, videoSessionKey])

  useEffect(() => {
    seekToRef.current = seekTo
    return () => {
      seekToRef.current = null
    }
  }, [seekTo])

  useEffect(() => {
    playRef.current = play
    pauseRef.current = pause
    return () => {
      playRef.current = null
      pauseRef.current = null
    }
  }, [play, pause])

  useEffect(() => {
    return () => {
      if (iconTimerRef.current) {
        clearTimeout(iconTimerRef.current)
      }
      if (gameContinueTimerRef.current) {
        clearTimeout(gameContinueTimerRef.current)
      }
      if (primingPreviewTimerRef.current) {
        clearTimeout(primingPreviewTimerRef.current)
      }
      if (autoSkipTimerRef.current) {
        clearTimeout(autoSkipTimerRef.current)
      }
    }
  }, [])

  const handleTap = () => {
    if (performance.now() < suppressTapUntilRef.current) {
      return
    }

    if (gameActive) return

    const ytPlayer = player.current as
      | (YT.Player & { isMuted?: () => boolean; unMute?: () => void })
      | null
    if (ytPlayer && typeof ytPlayer.isMuted === 'function' && ytPlayer.isMuted()) {
      try {
        ytPlayer.unMute?.()
        ytPlayer.playVideo()
      } catch {
        // Ignore unmute failures and fall through to the regular toggle.
      }
      setPauseIconType('play')
      setShowPauseIcon(true)
      if (iconTimerRef.current) clearTimeout(iconTimerRef.current)
      iconTimerRef.current = window.setTimeout(() => {
        setShowPauseIcon(false)
      }, 600)
      return
    }

    if (isPlaying) {
      pause()
      setPauseIconType('pause')
    } else {
      play()
      setPauseIconType('play')
    }

    setShowPauseIcon(true)
    if (iconTimerRef.current) clearTimeout(iconTimerRef.current)
    iconTimerRef.current = window.setTimeout(() => {
      setShowPauseIcon(false)
    }, 600)
  }

  const handleGameAnswer = (choiceIndex: number) => {
    answerGame(choiceIndex)
    const isCorrect = choiceIndex === gameCorrectIndex
    if (isCorrect) {
      useGameProgressStore.getState().addGameXP(5)
    }
    useDailyMissionStore.getState().incrementMission('play-game')
  }

  const gamePromptLine =
    freezeSubIndex !== null && subtitles[freezeSubIndex]
      ? subtitles[freezeSubIndex].en
      : gameSentenceIndex !== null && subtitles[gameSentenceIndex - 1]
        ? subtitles[gameSentenceIndex - 1].en
        : null
  const showGameOverlay = !videoError && gameActive && gameChoices.length > 0
  const gameOverlayInsetBottom = isShortsFormat
    ? 'max(88px, calc(env(safe-area-inset-bottom, 0px) + 72px))'
    : '16px'
  const cueNoticeInsetBottom = isShortsFormat
    ? 'max(132px, calc(env(safe-area-inset-bottom, 0px) + 124px))'
    : '18px'

  useEffect(() => {
    const shouldLockFeedSwipe = showPriming || showGameOverlay
    setFeedSwipeLocked(shouldLockFeedSwipe)

    return () => {
      setFeedSwipeLocked(false)
    }
  }, [setFeedSwipeLocked, showGameOverlay, showPriming])

  useEffect(() => {
    if (gameResult === null) return

    if (gameContinueTimerRef.current) {
      clearTimeout(gameContinueTimerRef.current)
    }

    const resumeDelay = gameResult === 'wrong' ? 1900 : 1500
    gameContinueTimerRef.current = window.setTimeout(() => {
      setFreezeSubIndex(null)
      clearGame()
      playRef.current?.()
      gameContinueTimerRef.current = null
    }, resumeDelay)

    return () => {
      if (gameContinueTimerRef.current) {
        clearTimeout(gameContinueTimerRef.current)
        gameContinueTimerRef.current = null
      }
    }
  }, [clearGame, gameResult, setFreezeSubIndex])

  const subtitleArea = (
    <LyricsSubtitles
      subtitles={subtitles}
      videoId={videoId ?? youtubeId}
      onSavePhrase={onSavePhrase}
      onSeek={(time) => seekTo(time)}
      visibleLineCount={useLandscapeSplitLayout ? 7 : 3}
    />
  )

  const landscapeSubtitleLayoutLabel =
    landscapeSubtitleLayout === 'side'
      ? '우측'
      : landscapeSubtitleLayout === 'bottom'
        ? '하단'
        : landscapeSubtitleLayout === 'overlay'
          ? '오버레이'
          : '자동'
  const showLandscapeSubtitleLayoutToggle =
    isLandscapeViewport && subtitleMode !== 'none' && subtitles.length > 0
  const subtitleToggleInsetTop = isLandscapeViewport
    ? 'max(12px, calc(env(safe-area-inset-top, 0px) + 8px))'
    : '12px'
  const subtitleToggleInsetRight = isLandscapeViewport
    ? 'max(12px, calc(env(safe-area-inset-right, 0px) + 8px))'
    : '12px'

  const subtitleLayoutToggleButton = showLandscapeSubtitleLayoutToggle ? (
    <button
      type="button"
      onPointerDown={(event) => {
        suppressVideoTap()
        event.stopPropagation()
      }}
      onPointerUp={(event) => {
        suppressVideoTap()
        event.stopPropagation()
      }}
      onClick={(event) => {
        suppressVideoTap()
        event.stopPropagation()
        cycleLandscapeSubtitleLayout()
      }}
      className="flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold backdrop-blur-md transition-colors sm:h-8 sm:text-[11px]"
      style={{
        backgroundColor: 'var(--player-control-bg)',
        borderColor: 'var(--player-control-border)',
        color: 'var(--player-text)',
      }}
      aria-label={`Landscape subtitle layout: ${landscapeSubtitleLayoutLabel}`}
      title={`Landscape subtitle layout: ${landscapeSubtitleLayoutLabel}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
      >
        {landscapeSubtitleLayout === 'side' ? (
          <>
            <rect x="3.5" y="5" width="11" height="14" rx="2" />
            <rect x="16.5" y="5" width="4" height="14" rx="1.5" />
          </>
        ) : landscapeSubtitleLayout === 'bottom' ? (
          <>
            <rect x="3.5" y="5" width="17" height="10" rx="2" />
            <rect x="3.5" y="17" width="17" height="2.5" rx="1.25" />
          </>
        ) : landscapeSubtitleLayout === 'overlay' ? (
          <>
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <path d="M6.5 13.5h11" />
            <path d="M8 16.5h8" />
          </>
        ) : (
          <>
            <path d="M3.5 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7Z" />
            <path d="M3.5 17.5h10" />
            <path d="M18 5h2.5a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H18" />
            <path d="M15.5 17.5h5.5" />
          </>
        )}
      </svg>
      <span>{landscapeSubtitleLayoutLabel}</span>
    </button>
  ) : null

  const subtitlePanel = (
    <div className="relative h-full">
      {!useLandscapeOverlaySubtitles && subtitleLayoutToggleButton && (
        <div
          className="absolute z-30"
          style={{ right: subtitleToggleInsetRight, top: subtitleToggleInsetTop }}
        >
          {subtitleLayoutToggleButton}
        </div>
      )}
      {subtitleArea}
    </div>
  )

  const progressArea = (
    <div className="flex-shrink-0 px-4 pb-3 pt-2">
      <ProgressBar />
    </div>
  )

  const primingOverlay = showPriming ? (
    <PrimingCard
      key={videoSessionKey}
      expressions={primingExpressions.map((ve) => {
        const sub = findPrimingSubtitle(subtitles, ve.sentence.en, ve.expression.canonical)
        return {
          exprId: ve.expression.id,
          canonical: ve.expression.canonical,
          meaning_ko: ve.expression.meaning_ko,
          category: ve.expression.category,
          cefr: ve.expression.cefr,
          sentenceEn: ve.sentence.en,
          sentenceKo: ve.sentence.ko,
          start: sub?.start,
          end: sub?.end,
        }
      })}
      words={primingWords.map((vw) => {
        const sub = findPrimingSubtitle(subtitles, vw.sentence.en, vw.word.canonical)
        return {
          wordId: `word:${vw.word.id}`,
          canonical: vw.word.canonical,
          meaning_ko: vw.word.meaning_ko,
          pos: vw.word.pos,
          cefr: vw.word.cefr,
          sentenceEn: vw.sentence.en,
          sentenceKo: vw.sentence.ko,
          surfaceForm: vw.surfaceForm,
          start: sub?.start,
          end: sub?.end,
        }
      })}
      onDismiss={handlePrimingDismiss}
      onMarkFamiliar={markFamiliar}
      familiarCounts={Object.fromEntries(
        Object.entries(familiarExprs).map(([k, v]) => [k, v.count])
      )}
      onPlaySegment={(start, end) => {
        if (primingPreviewTimerRef.current) {
          window.clearTimeout(primingPreviewTimerRef.current)
          primingPreviewTimerRef.current = null
        }
        seekTo(start)
        play()
        const duration = (end - start) * 1000 + 200
        primingPreviewTimerRef.current = window.setTimeout(() => {
          pause()
          seekTo(primingResetTime)
          primingPreviewTimerRef.current = null
        }, duration)
      }}
    />
  ) : null

  const videoArea = (
    <div
      className="relative h-full w-full"
      onClick={handleTap}
      style={{ backgroundColor: 'var(--player-surface)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <PlayerMount containerId={containerId} />
      </div>

      {showPauseIcon && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full animate-fade-out backdrop-blur-sm"
            style={{ backgroundColor: 'var(--player-chip-bg)', color: 'var(--player-text)' }}
          >
            {pauseIconType === 'pause' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 opacity-90">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 z-[22] flex justify-center px-4"
        style={{ bottom: cueNoticeInsetBottom }}
      >
        <SaveToast
          show={Boolean(cueNotice)}
          message={cueNotice?.message ?? ''}
          placement="inline"
          tone={cueNotice?.tone ?? 'default'}
        />
      </div>

      {videoError && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-8"
          style={{ backgroundColor: 'var(--player-surface)' }}
        >
          <div
            className="mb-1 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--player-panel)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" style={{ color: 'var(--player-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-center text-sm" style={{ color: 'var(--player-muted)' }}>
            {videoError}
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={(event) => {
                event.stopPropagation()
                clearVideoError()
                window.location.reload()
              }}
              className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--player-control-bg)',
                color: 'var(--player-muted)',
              }}
            >
              다시 시도
            </button>
            {onVideoErrorSkip && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  const skipped = onVideoErrorSkip()
                  if (skipped !== false) {
                    clearVideoError()
                  }
                }}
                className="rounded-lg px-4 py-2 text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                다음 영상
              </button>
            )}
          </div>
        </div>
      )}

      {!videoError && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          style={{
            backgroundColor: 'var(--player-surface)',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            ...(overlayVisible ? {} : ({ pointerEvents: 'none' } as CSSProperties)),
          }}
        >
          {!ready && (
            <div className="relative">
              <div
                className="h-8 w-8 rounded-full border-[1.5px]"
                style={{ borderColor: 'var(--player-divider)' }}
              />
              <div
                className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-[1.5px] border-transparent"
                style={{ borderTopColor: 'var(--accent-primary)' }}
              />
            </div>
          )}
        </div>
      )}

      {transcriptLoading && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 backdrop-blur-sm"
            style={{
              backgroundColor: 'var(--player-chip-bg)',
              border: `1px solid var(--player-chip-border)`,
            }}
          >
            <div
              className="h-2.5 w-2.5 animate-spin rounded-full border"
              style={{
                borderColor: 'var(--player-divider)',
                borderTopColor: 'var(--accent-primary)',
              }}
            />
            <span className="text-[10px]" style={{ color: 'var(--player-muted)' }}>
              자막 로드 중
            </span>
          </div>
        </div>
      )}

      {showGameOverlay && (
        <div
          className="absolute inset-x-0 z-[25] flex justify-center px-4"
          style={{ bottom: gameOverlayInsetBottom }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          <SubtitleGame
            currentLine={gamePromptLine}
            choices={gameChoices}
            correctIndex={gameCorrectIndex}
            result={gameResult}
            onAnswer={handleGameAnswer}
          />
        </div>
      )}

      {children}

      {useLandscapeOverlaySubtitles && subtitleLayoutToggleButton && (
        <div
          className="absolute z-[26]"
          style={{ right: subtitleToggleInsetRight, top: subtitleToggleInsetTop }}
          onPointerDown={(event) => {
            suppressVideoTap()
            event.stopPropagation()
          }}
          onPointerUp={(event) => {
            suppressVideoTap()
            event.stopPropagation()
          }}
          onClick={(event) => {
            suppressVideoTap()
            event.stopPropagation()
          }}
        >
          {subtitleLayoutToggleButton}
        </div>
      )}
    </div>
  )

  // Shorts format: full-height video with overlay subtitles and progress bar
  if (isShortsFormat) {
    return (
      <div
        className="relative h-full w-full"
        style={{ backgroundColor: 'var(--player-surface)' }}
      >
        {videoArea}

        {/* Overlay subtitles at the bottom of the video */}
        {subtitleMode !== 'none' && subtitles.length > 0 && (
          <ShortsSubtitleOverlay
            subtitles={subtitles}
            videoId={videoId ?? youtubeId}
            showKo={subtitleMode === 'en-ko'}
            onSavePhrase={onSavePhrase}
            onSeek={(time) => seekTo(time)}
          />
        )}

        {/* Progress bar overlaid at the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-[15]">
          <ProgressBar />
        </div>

        {primingOverlay}
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full"
      style={{ backgroundColor: 'var(--player-surface)' }}
    >
      <div
        className={`flex h-full w-full ${useLandscapeSplitLayout ? 'flex-row' : 'flex-col'}`}
        style={{ backgroundColor: 'var(--player-surface)' }}
      >
        <div
          className={`relative ${useLandscapeSplitLayout ? 'h-full flex-shrink-0' : 'flex-1 min-h-0'}`}
          style={useLandscapeSplitLayout ? { width: landscapeVideoPaneWidth } : undefined}
        >
          {videoArea}

          {useLandscapeOverlaySubtitles && subtitleMode !== 'none' && subtitles.length > 0 && (
            <ShortsSubtitleOverlay
              subtitles={subtitles}
              videoId={videoId ?? youtubeId}
              showKo={subtitleMode === 'en-ko'}
              onSavePhrase={onSavePhrase}
              onSeek={(time) => seekTo(time)}
              bottomOffset="24px"
            />
          )}

          {useLandscapeOverlaySubtitles && (
            <div className="absolute bottom-0 left-0 right-0 z-[15]">
              <ProgressBar />
            </div>
          )}
        </div>

        {useLandscapeSplitLayout && !useLandscapeOverlaySubtitles && (
          <div
            className="h-full w-px flex-shrink-0"
            style={{ backgroundColor: 'var(--player-divider)' }}
          />
        )}

        {!useLandscapeOverlaySubtitles && (
          <>
            <div
              className={
                useLandscapeSplitLayout
                  ? 'relative flex min-w-0 flex-1 flex-col'
                  : 'relative flex-shrink-0'
              }
              style={{
                backgroundColor: 'var(--player-surface)',
                height: isLandscapeViewport ? `${landscapeBottomSubtitleHeight}px` : '176px',
              }}
            >
              {useLandscapeSplitLayout ? (
                <>
                  <div className="min-h-0 flex-1">{subtitlePanel}</div>
                  {progressArea}
                </>
              ) : (
                subtitlePanel
              )}
            </div>

            {!useLandscapeSplitLayout && progressArea}
          </>
        )}
      </div>

      {primingOverlay}
    </div>
  )
}

/**
 * Overlay subtitle display for Shorts format.
 * Shows the active subtitle as a semi-transparent overlay at the bottom of the video.
 * Pointer events pass through to the video (tap-to-pause).
 */
function ShortsSubtitleOverlay({
  subtitles,
  videoId,
  showKo,
  onSavePhrase,
  onSeek,
  bottomOffset = '48px',
}: {
  subtitles: SubtitleEntry[]
  videoId: string
  showKo: boolean
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onSeek?: (time: number) => void
  bottomOffset?: string
}) {
  const activeSubIndex = usePlayerStore((state) => state.activeSubIndex)
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const setFreezeSubIndex = usePlayerStore((state) => state.setFreezeSubIndex)
  const subtitleGuidesEnabled = useSettingsStore((state) => state.subtitleGuidesEnabled)
  const phrases = usePhraseStore((state) => state.phrases)
  const removePhrase = usePhraseStore((state) => state.removePhrase)
  const activeSub = activeSubIndex >= 0 ? subtitles[activeSubIndex] : null
  const [notice, setNotice] = useState<{
    message: string
    tone: 'saved' | 'freeze'
  } | null>(null)
  const noticeTimerRef = useRef<number | null>(null)
  const lastTapRef = useRef(0)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  const savedPhraseId = useMemo(() => {
    if (!activeSub) return null
    return (
      phrases.find((phrase) => phrase.videoId === videoId && phrase.en === activeSub.en)?.id ??
      phrases.find((phrase) => phrase.en === activeSub.en)?.id ??
      null
    )
  }, [activeSub, phrases, videoId])

  const showNotice = useCallback(
    (message: string, tone: 'saved' | 'freeze', duration = 1500) => {
      setNotice({ message, tone })
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current)
      }
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice(null)
        noticeTimerRef.current = null
      }, duration)
    },
    [],
  )

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current)
      }
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  if (!activeSub) return null

  return (
    <div
      className="absolute left-0 right-0 z-[12] flex justify-center px-4"
      style={{ bottom: bottomOffset }}
    >
      <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2">
        <SaveToast
          show={Boolean(notice)}
          message={notice?.message ?? ''}
          placement="inline"
          tone={notice?.tone ?? 'default'}
        />
      </div>
      <div
        className="pointer-events-auto max-w-[92%] rounded-t-xl rounded-b-lg border px-5 py-3 text-center backdrop-blur-sm transition-transform active:scale-[0.985]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderColor:
            freezeSubIndex === activeSubIndex
              ? 'rgba(var(--accent-primary-rgb), 0.5)'
              : 'rgba(255, 255, 255, 0.08)',
        }}
        onClick={(event) => {
          event.stopPropagation()

          if (longPressFiredRef.current) {
            longPressFiredRef.current = false
            return
          }

          const now = Date.now()
          if (now - lastTapRef.current < 550) {
            if (savedPhraseId) {
              removePhrase(savedPhraseId)
              showNotice('REMOVED', 'saved')
            } else if (onSavePhrase) {
              onSavePhrase(activeSub)
              showNotice('SAVED', 'saved')
            }
            lastTapRef.current = 0
            return
          }

          lastTapRef.current = now

          if (freezeSubIndex === activeSubIndex) {
            onSeek?.(activeSub.start)
          }
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          longPressFiredRef.current = false
          pointerStartRef.current = { x: event.clientX, y: event.clientY }
          clearLongPress()
          longPressTimerRef.current = window.setTimeout(() => {
            longPressFiredRef.current = true
            if (freezeSubIndex === activeSubIndex) {
              setFreezeSubIndex(null)
              showNotice('FREEZE OFF', 'freeze', 1200)
            } else {
              setFreezeSubIndex(activeSubIndex)
              onSeek?.(activeSub.start)
              showNotice('FREEZE ON', 'freeze', 1800)
            }
          }, 500)
        }}
        onPointerMove={(event) => {
          event.stopPropagation()
          if (!pointerStartRef.current) return
          const dx = event.clientX - pointerStartRef.current.x
          const dy = event.clientY - pointerStartRef.current.y
          if (Math.hypot(dx, dy) > 10) {
            clearLongPress()
          }
        }}
        onPointerUp={(event) => {
          event.stopPropagation()
          pointerStartRef.current = null
          clearLongPress()
        }}
        onPointerCancel={(event) => {
          event.stopPropagation()
          pointerStartRef.current = null
          clearLongPress()
        }}
      >
        <p
          className="text-[15px] font-semibold leading-snug"
          style={{ color: '#ffffff' }}
        >
          {activeSub.en}
        </p>
        {showKo && activeSub.ko && (
          <p
            className="mt-1 text-[13px] leading-snug"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {activeSub.ko}
          </p>
        )}
        {subtitleGuidesEnabled && (
          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            <span>{savedPhraseId ? 'Saved' : 'Double Tap Save'}</span>
            <span className="text-white/25">|</span>
            <span>{freezeSubIndex === activeSubIndex ? 'Hold Unfreeze' : 'Hold Freeze'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
