'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useReplayStore, type ReplayClip } from '@/stores/useReplayStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api'

interface ReplayPlayerHandle {
  togglePlayback: () => void
  playWindow: (start: number, end: number) => void
}

interface LoadableYouTubePlayer extends YT.Player {
  loadVideoById?: (options: { videoId: string; startSeconds?: number }) => void
}

interface SubtitleContextLine {
  id: string
  en: string
  ko?: string
  start: number
  end: number
}

interface PlaybackSegment {
  start: number
  end: number
  lineId: string
}

interface PlaybackSequence {
  segments: PlaybackSegment[]
  totalDuration: number
}

interface SubtitleDisplaySlot {
  slotId: string
  line: SubtitleContextLine | null
}

function resolvePlaybackWindow(start: number, end: number) {
  const resolvedEnd = end > start ? end : start + 5
  return {
    start: Math.max(0, start),
    end: resolvedEnd,
  }
}

async function loadContextLinesForClip(clip: ReplayClip): Promise<SubtitleContextLine[]> {
  if (!clip.videoId) return []

  if (typeof clip.sentenceIdx !== 'number') {
    return clip.sentenceEn
      ? [
          {
            id: `${clip.videoId}-current`,
            en: clip.sentenceEn,
            ko: clip.sentenceKo,
            start: clip.start,
            end: clip.end,
          },
        ]
      : []
  }

  try {
    const response = await fetch(`/transcripts/${clip.videoId}.json`)
    if (!response.ok) throw new Error('Transcript missing')

    const subtitles = await response.json()
    if (!Array.isArray(subtitles)) return []

    const windowLines = [clip.sentenceIdx - 1, clip.sentenceIdx, clip.sentenceIdx + 1]
      .map((index) => {
        const subtitle = subtitles[index]
        if (!subtitle?.en) return null
        return {
          id: `${clip.videoId}:${index}`,
          en: subtitle.en,
          ko: subtitle.ko,
          start: subtitle.start ?? clip.start,
          end: subtitle.end ?? clip.end,
        }
      })
      .filter(Boolean) as SubtitleContextLine[]

    if (windowLines.length > 0) {
      return windowLines
    }
  } catch {
    // best effort only
  }

  return clip.sentenceEn
    ? [
        {
          id: `${clip.videoId}-fallback`,
          en: clip.sentenceEn,
          ko: clip.sentenceKo,
          start: clip.start,
          end: clip.end,
        },
      ]
    : []
}

function buildPlaybackSequence(
  lines: SubtitleContextLine[],
  focusLineId: string | null,
  repeatCount: 1 | 2 | 3,
): PlaybackSequence {
  const segments: PlaybackSegment[] = []

  for (const line of lines) {
    const window = resolvePlaybackWindow(line.start, line.end)
    const repetitions = line.id === focusLineId ? repeatCount : 1
    for (let count = 0; count < repetitions; count += 1) {
      segments.push({
        start: window.start,
        end: window.end,
        lineId: line.id,
      })
    }
  }

  if (segments.length === 0) {
    return { segments: [], totalDuration: 0 }
  }

  return {
    segments,
    totalDuration: segments.reduce((sum, segment) => sum + Math.max(0.01, segment.end - segment.start), 0),
  }
}

function resolveFocusLineId(
  clip: ReplayClip | null,
  lines: SubtitleContextLine[],
) {
  if (!clip || lines.length === 0) return null

  if (typeof clip.sentenceIdx === 'number') {
    const preferredId = `${clip.videoId}:${clip.sentenceIdx}`
    if (lines.some((line) => line.id === preferredId)) {
      return preferredId
    }
  }

  return lines[0]?.id ?? null
}

function buildDisplaySlots(
  lines: SubtitleContextLine[],
  focusLineId: string | null,
): SubtitleDisplaySlot[] {
  if (lines.length === 0) {
    return [
      { slotId: 'prev', line: null },
      { slotId: 'current', line: null },
      { slotId: 'next', line: null },
    ]
  }

  const focusIndex = Math.max(
    0,
    lines.findIndex((line) => line.id === focusLineId),
  )
  const currentLine = lines[focusIndex] ?? lines[0] ?? null

  return [
    {
      slotId: 'prev',
      line: focusIndex > 0 ? lines[focusIndex - 1] : null,
    },
    {
      slotId: 'current',
      line: currentLine,
    },
    {
      slotId: 'next',
      line: focusIndex < lines.length - 1 ? lines[focusIndex + 1] : null,
    },
  ]
}

function ensureYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject()
  if (window.YT?.Player) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${YOUTUBE_API_SRC}"]`,
    )

    if (existing && window.YT?.Player) {
      resolve()
      return
    }

    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }

    if (!existing) {
      const script = document.createElement('script')
      script.src = YOUTUBE_API_SRC
      script.async = true
      script.onerror = () => reject()
      document.head.appendChild(script)
    }

    window.setTimeout(() => reject(), 8000)
  })
}

const MiniPlayerInner = forwardRef<
  ReplayPlayerHandle,
  {
    visibleVideo?: boolean
    playbackSequence: PlaybackSequence
    coreRepeatCount: 1 | 2 | 3
    onActiveLineChange?: (lineId: string | null) => void
  }
>(function MiniPlayerInner(
  { visibleVideo = false, playbackSequence, coreRepeatCount, onActiveLineChange },
  ref,
) {
  const clip = useReplayStore((s) => s.clip)
  const stop = useReplayStore((s) => s.stop)
  const next = useReplayStore((s) => s.next)
  const setProgress = useReplayStore((s) => s.setProgress)
  const setIsPlaying = useReplayStore((s) => s.setIsPlaying)

  const playerRef = useRef<YT.Player | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<number | null>(null)
  const clipKeyRef = useRef<string | null>(null)
  const activeVideoIdRef = useRef<string | null>(null)
  const transitionLockRef = useRef<number | null>(null)
  const activeSequenceRef = useRef<PlaybackSequence>({ segments: [], totalDuration: 0 })
  const activeSegmentIndexRef = useRef(0)
  const sequenceFinishedRef = useRef(false)

  const clearMonitor = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    clearMonitor()
    if (transitionLockRef.current !== null) {
      window.clearTimeout(transitionLockRef.current)
      transitionLockRef.current = null
    }
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch {
        // ignore
      }
      playerRef.current = null
    }
    clipKeyRef.current = null
    activeVideoIdRef.current = null
    activeSequenceRef.current = { segments: [], totalDuration: 0 }
    activeSegmentIndexRef.current = 0
    sequenceFinishedRef.current = false
    onActiveLineChange?.(null)
  }, [clearMonitor, onActiveLineChange])

  const advanceQueue = useCallback(() => {
    if (transitionLockRef.current !== null) return

    transitionLockRef.current = window.setTimeout(() => {
      transitionLockRef.current = null
    }, 180)

    const { queue, queueIndex } = useReplayStore.getState()
    if (queueIndex < queue.length - 1) {
      next()
      return
    }
    stop()
  }, [next, stop])

  const pauseAtSegmentEnd = useCallback(
    (player: YT.Player, segment: PlaybackSegment) => {
      try {
        player.pauseVideo()
        player.seekTo(Math.max(0, segment.end - 0.02), true)
      } catch {
        // ignore
      }
      clearMonitor()
      setProgress(1)
      setIsPlaying(false)
      sequenceFinishedRef.current = true
    },
    [clearMonitor, setIsPlaying, setProgress],
  )

  const startSequenceFromIndex = useCallback(
    (player: YT.Player, sequence: PlaybackSequence, segmentIndex: number) => {
      const targetSegment = sequence.segments[segmentIndex]
      if (!targetSegment) return

      activeSequenceRef.current = sequence
      activeSegmentIndexRef.current = segmentIndex
      sequenceFinishedRef.current = false
      onActiveLineChange?.(targetSegment.lineId)

      clearMonitor()

      try {
        player.seekTo(targetSegment.start, true)
        player.playVideo()
        setIsPlaying(true)
      } catch {
        // ignore
      }

      intervalRef.current = window.setInterval(() => {
        if (!playerRef.current) return

        const activeSequence = activeSequenceRef.current
        const currentSegment = activeSequence.segments[activeSegmentIndexRef.current]
        if (!currentSegment) return

        try {
          const currentTime = player.getCurrentTime()
          const elapsedBefore = activeSequence.segments
            .slice(0, activeSegmentIndexRef.current)
            .reduce((sum, segment) => sum + Math.max(0.01, segment.end - segment.start), 0)
          const elapsedCurrent = Math.max(0, currentTime - currentSegment.start)
          const progress = Math.min(
            1,
            (elapsedBefore + elapsedCurrent) / Math.max(0.01, activeSequence.totalDuration),
          )
          setProgress(progress)

          if (player.getPlayerState() === 1 && currentTime >= currentSegment.end - 0.05) {
            const nextIndex = activeSegmentIndexRef.current + 1
            if (nextIndex < activeSequence.segments.length) {
              const nextSegment = activeSequence.segments[nextIndex]
              activeSegmentIndexRef.current = nextIndex
              onActiveLineChange?.(nextSegment.lineId)
              const gapToNext = nextSegment.start - currentSegment.end
              if (gapToNext < -0.02 || gapToNext > 0.35) {
                player.seekTo(nextSegment.start, true)
                player.playVideo()
              }
              return
            }

            pauseAtSegmentEnd(player, currentSegment)
          }
        } catch {
          // ignore transient iframe errors
        }
      }, 100)
    },
    [clearMonitor, onActiveLineChange, pauseAtSegmentEnd, setIsPlaying, setProgress],
  )

  useImperativeHandle(
    ref,
    () => ({
      togglePlayback() {
        const player = playerRef.current
        if (!player) return

        try {
          const currentState = player.getPlayerState()
          if (currentState === 1) {
            player.pauseVideo()
            setIsPlaying(false)
            return
          }

          const activeSequence = activeSequenceRef.current
          if (activeSequence.segments.length === 0) return

          if (sequenceFinishedRef.current) {
            startSequenceFromIndex(player, activeSequence, 0)
            return
          }

          player.playVideo()
          setIsPlaying(true)
        } catch {
          // ignore
        }
      },
      playWindow(start, end) {
        const player = playerRef.current
        if (!player) return

        const playbackWindow = resolvePlaybackWindow(start, end)
        startSequenceFromIndex(
          player,
          {
            segments: [
              {
                start: playbackWindow.start,
                end: playbackWindow.end,
                lineId: 'manual-replay',
              },
            ],
            totalDuration: Math.max(0.01, playbackWindow.end - playbackWindow.start),
          },
          0,
        )
      },
    }),
    [setIsPlaying, startSequenceFromIndex],
  )

  useEffect(() => {
    if (!clip) {
      cleanup()
      return
    }

      const sequenceFingerprint = playbackSequence.segments
        .map((segment) => `${segment.lineId}:${segment.start.toFixed(3)}:${segment.end.toFixed(3)}`)
        .join('|')
      const key = `${clip.videoId}:${clip.start}:${clip.end}:${clip.sentenceIdx ?? -1}:${coreRepeatCount}:${sequenceFingerprint}`
    if (clipKeyRef.current === key) return
    clipKeyRef.current = key

    let disposed = false

    const initPlayer = async () => {
      try {
        await ensureYouTubeAPI()
      } catch {
        if (!disposed) {
          clearMonitor()
          advanceQueue()
        }
        return
      }

      if (disposed || !containerRef.current) return

      const fallbackWindow = resolvePlaybackWindow(clip.start, clip.end)
      const effectiveSequence =
        playbackSequence.segments.length > 0
          ? playbackSequence
          : {
              segments: [
                {
                  start: fallbackWindow.start,
                  end: fallbackWindow.end,
                  lineId: `${clip.videoId}-fallback`,
                },
              ],
              totalDuration: Math.max(0.01, fallbackWindow.end - fallbackWindow.start),
            }
      const firstSegment = effectiveSequence.segments[0]
      if (!firstSegment) return

      if (playerRef.current) {
        if (activeVideoIdRef.current === clip.videoId) {
          startSequenceFromIndex(playerRef.current, effectiveSequence, 0)
          return
        }

        try {
          const reusablePlayer = playerRef.current as LoadableYouTubePlayer
          if (!reusablePlayer.loadVideoById) {
            throw new Error('loadVideoById unavailable')
          }
          reusablePlayer.loadVideoById?.({
            videoId: clip.videoId,
            startSeconds: firstSegment.start,
          })
          activeVideoIdRef.current = clip.videoId
          try {
            reusablePlayer.unMute?.()
            reusablePlayer.setVolume?.(100)
          } catch {
            // ignore
          }
          startSequenceFromIndex(reusablePlayer, effectiveSequence, 0)
          return
        } catch {
          try {
            playerRef.current.destroy()
          } catch {
            // ignore
          }
          playerRef.current = null
        }
      }

      const element = document.createElement('div')
      element.id = `mini-replay-yt-${Date.now()}`
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(element)

      activeVideoIdRef.current = null
      clearMonitor()

      playerRef.current = new window.YT.Player(element.id, {
        videoId: clip.videoId,
        width: '100%',
        height: visibleVideo ? '100%' : 1,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (disposed) return
            const player = event.target as YT.Player
            activeVideoIdRef.current = clip.videoId
            try {
              player.unMute?.()
              player.setVolume?.(100)
            } catch {
              // ignore
            }
            startSequenceFromIndex(player, effectiveSequence, 0)
          },
          onStateChange: (event) => {
            if (disposed) return

            if (event.data === 1) {
              setIsPlaying(true)
            } else if (event.data === 2 || event.data === 5) {
              setIsPlaying(false)
            } else if (event.data === 0) {
              const activeSequence = activeSequenceRef.current
              const segment = activeSequence.segments[activeSegmentIndexRef.current]
              if (segment) {
                pauseAtSegmentEnd(event.target as YT.Player, segment)
              } else {
                setIsPlaying(false)
              }
            }
          },
          onError: () => {
            if (!disposed) {
              clearMonitor()
              advanceQueue()
            }
          },
        },
      })
    }

    void initPlayer()

    return () => {
      disposed = true
    }
  }, [
    advanceQueue,
    cleanup,
    clearMonitor,
    clip,
    coreRepeatCount,
    pauseAtSegmentEnd,
    playbackSequence,
    setIsPlaying,
    startSequenceFromIndex,
    visibleVideo,
  ])

  useEffect(() => cleanup, [cleanup])

  return (
    <div
      ref={containerRef}
      className={visibleVideo ? 'relative aspect-video w-full overflow-hidden bg-black' : ''}
      style={
        visibleVideo
          ? undefined
          : {
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              opacity: 0,
              pointerEvents: 'none',
            }
      }
    />
  )
})

function ProgressBar() {
  const progress = useReplayStore((s) => s.progress)

  return (
    <div
      className="h-[3px] w-full overflow-hidden rounded-full"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: 'var(--accent-primary, #14b8a6)' }}
        initial={false}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </div>
  )
}

function LearnSubtitleContext({
  className,
  slots,
  activeLineId,
  subtitleMode,
  revealedLineId,
  onReplayLine,
}: {
  className?: string
  slots: SubtitleDisplaySlot[]
  activeLineId?: string | null
  subtitleMode: 'en' | 'bilingual' | 'locked'
  revealedLineId?: string | null
  onReplayLine: (line: SubtitleContextLine) => void
}) {
  if (!slots.some((slot) => slot.line)) return null

  const resolvedActiveLineId = activeLineId ?? slots[1]?.line?.id ?? slots[0]?.line?.id

  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="space-y-2">
          {slots.map((slot, slotIndex) => {
            if (!slot.line) {
              return (
                <div
                  key={slot.slotId}
                  className="min-h-[52px] rounded-xl border border-transparent px-3 py-2 opacity-0"
                  aria-hidden="true"
                >
                  <p className="text-sm leading-relaxed">placeholder</p>
                </div>
              )
            }

            const line = slot.line
            const isActive = resolvedActiveLineId === line.id
            const isCoreSlot = slotIndex === 1
            const showMeaning =
              subtitleMode === 'bilingual'
                ? Boolean(line.ko)
                : subtitleMode === 'locked'
                  ? revealedLineId === line.id && Boolean(line.ko)
                  : false

            return (
              <button
                type="button"
                key={line.id}
                onClick={() => onReplayLine(line)}
                className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${
                  isActive ? 'bg-white/10' : 'bg-transparent'
                }`}
              >
                <p
                  className={`text-sm leading-relaxed ${
                    isCoreSlot ? 'font-semibold text-white' : 'text-white/62'
                  } ${isActive ? 'text-white' : ''}`}
                >
                  {line.en}
                </p>
                {showMeaning ? (
                  <p className="mt-1 text-xs leading-relaxed text-white/72">{line.ko}</p>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function MiniReplayPlayer() {
  const pathname = usePathname()
  const clip = useReplayStore((s) => s.clip)
  const queue = useReplayStore((s) => s.queue)
  const queueIndex = useReplayStore((s) => s.queueIndex)
  const isPlaying = useReplayStore((s) => s.isPlaying)
  const stop = useReplayStore((s) => s.stop)
  const next = useReplayStore((s) => s.next)
  const prev = useReplayStore((s) => s.prev)
  const learnSubtitleMode = useSettingsStore((s) => s.learnSubtitleMode)
  const setLearnSubtitleMode = useSettingsStore((s) => s.setLearnSubtitleMode)
  const playerApiRef = useRef<ReplayPlayerHandle | null>(null)
  const [coreRepeatCount, setCoreRepeatCount] = useState<1 | 2 | 3>(1)
  const [loadedContext, setLoadedContext] = useState<{
    key: string
    lines: SubtitleContextLine[]
  } | null>(null)
  const [activePlaybackState, setActivePlaybackState] = useState<{
    clipKey: string
    lineId: string | null
  } | null>(null)
  const [revealedLineId, setRevealedLineId] = useState<string | null>(null)
  const [isLandscapeLearn, setIsLandscapeLearn] = useState(false)
  const [replayLineOverride, setReplayLineOverride] = useState<{
    clipKey: string
    lineId: string
  } | null>(null)

  const visible = clip !== null
  const isLearnPlayer = visible && pathname?.startsWith('/explore/learn')
  const hasPrev = queueIndex > 0
  const hasNext = queueIndex < queue.length - 1

  useEffect(() => {
    if (!isLearnPlayer) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isLearnPlayer])

  const clipKey = clip
    ? `${clip.videoId}:${clip.sentenceIdx ?? -1}:${clip.start}:${clip.end}`
    : null

  useEffect(() => {
    let cancelled = false

    if (!clip) {
      return
    }

    const nextClipKey = `${clip.videoId}:${clip.sentenceIdx ?? -1}:${clip.start}:${clip.end}`
    void loadContextLinesForClip(clip).then((lines) => {
      if (cancelled) return
      setLoadedContext({
        key: nextClipKey,
        lines,
      })
    })

    return () => {
      cancelled = true
    }
  }, [clip])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateLandscape = () => {
      setIsLandscapeLearn(window.innerWidth > window.innerHeight)
    }

    updateLandscape()
    window.addEventListener('resize', updateLandscape)
    window.addEventListener('orientationchange', updateLandscape)
    return () => {
      window.removeEventListener('resize', updateLandscape)
      window.removeEventListener('orientationchange', updateLandscape)
    }
  }, [])

  const contextLines = useMemo(
    () => (loadedContext?.key === clipKey ? loadedContext.lines : []),
    [clipKey, loadedContext],
  )

  const focusLineId = useMemo(
    () => resolveFocusLineId(clip, contextLines),
    [clip, contextLines],
  )

  const displaySlots = useMemo(
    () => buildDisplaySlots(contextLines, focusLineId),
    [contextLines, focusLineId],
  )

  const playbackSequence = useMemo(
    () =>
      buildPlaybackSequence(
        displaySlots
          .map((slot) => slot.line)
          .filter((line): line is SubtitleContextLine => Boolean(line)),
        focusLineId,
        coreRepeatCount,
      ),
    [coreRepeatCount, displaySlots, focusLineId],
  )

  const isContextReady = !clip || loadedContext?.key === clipKey

  const activeReplayLineId = useMemo(() => {
    if (!clip?.videoId) return null
    if (replayLineOverride && replayLineOverride.clipKey === clipKey) {
      return replayLineOverride.lineId
    }
    if (activePlaybackState?.clipKey === clipKey && activePlaybackState.lineId) {
      return activePlaybackState.lineId
    }
    return focusLineId
  }, [activePlaybackState, clip, clipKey, focusLineId, replayLineOverride])

  const handleReplayLine = useCallback((line: SubtitleContextLine) => {
    if (clipKey) {
      setReplayLineOverride({ clipKey, lineId: line.id })
      setActivePlaybackState({ clipKey, lineId: line.id })
    }
    if (learnSubtitleMode === 'locked') {
      setRevealedLineId(line.id)
    }
    playerApiRef.current?.playWindow(line.start, line.end)
  }, [clipKey, learnSubtitleMode])

  const handleTogglePlayback = useCallback(() => {
    setReplayLineOverride(null)
    if (learnSubtitleMode !== 'locked') {
      setRevealedLineId(null)
    }
    playerApiRef.current?.togglePlayback()
  }, [learnSubtitleMode])

  return (
    <>
      {visible && !isLearnPlayer && isContextReady ? (
        <MiniPlayerInner
          ref={playerApiRef}
          visibleVideo={false}
          playbackSequence={playbackSequence}
          coreRepeatCount={coreRepeatCount}
          onActiveLineChange={(lineId) => {
            if (!clipKey) return
            setActivePlaybackState({ clipKey, lineId })
          }}
        />
      ) : null}

      <AnimatePresence>
        {visible && !isLearnPlayer && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[100] overflow-hidden rounded-2xl border shadow-lg"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
              left: 16,
              right: 16,
              maxWidth: 420,
              marginInline: 'auto',
              backgroundColor: 'var(--bg-card, #1a1a2e)',
              borderColor: 'var(--border-card, rgba(255,255,255,0.08))',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <ProgressBar />
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isPlaying
                    ? 'rgba(var(--accent-primary-rgb, 20, 184, 166), 0.15)'
                    : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                {isPlaying ? (
                  <div className="flex items-end gap-[2px]">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full"
                        style={{ backgroundColor: 'var(--accent-text, #5eead4)' }}
                        animate={{ height: [6, 12, 6] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.12,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--text-muted, rgba(255,255,255,0.4))' }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p
                className="min-w-0 flex-1 truncate text-sm font-medium"
                style={{ color: 'var(--text-primary, #fff)' }}
              >
                {clip?.expressionText ?? 'Playing clip...'}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  stop()
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors active:scale-90"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))' }}
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && isLearnPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/92"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-[max(16px,env(safe-area-inset-top,0px)+12px)]">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                    Learn
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/90">
                    클립 {queueIndex + 1} / {queue.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={stop}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors active:scale-95"
                  aria-label="Close replay"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-1 items-center justify-center px-3 pb-[max(16px,env(safe-area-inset-bottom,0px)+12px)]">
                <div
                  className={`w-full overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${
                    isLandscapeLearn ? 'max-w-5xl' : 'max-w-md'
                  }`}
                >
                  <div className={isLandscapeLearn ? 'flex min-h-[320px]' : ''}>
                    <div className={`relative ${isLandscapeLearn ? 'w-[58%] shrink-0' : ''}`}>
                    {isContextReady ? (
                      <MiniPlayerInner
                        ref={playerApiRef}
                        visibleVideo
                        playbackSequence={playbackSequence}
                        coreRepeatCount={coreRepeatCount}
                        onActiveLineChange={(lineId) => {
                          if (!clipKey) return
                          setActivePlaybackState({ clipKey, lineId })
                        }}
                      />
                    ) : (
                      <div className="relative aspect-video w-full bg-black">
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/55">
                          Loading clip...
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleTogglePlayback}
                      className="absolute inset-0 z-10"
                      disabled={!isContextReady}
                      aria-label={isPlaying ? 'Pause learn clip' : 'Play learn clip'}
                    />
                    <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/85">
                      {isPlaying ? 'Pause' : 'Play'}
                    </div>
                    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/60 p-1">
                      {[1, 2, 3].map((count) => {
                        const active = coreRepeatCount === count
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setCoreRepeatCount(count as 1 | 2 | 3)
                            }}
                            disabled={!isContextReady}
                            className="rounded-full px-2 py-1 text-[11px] font-semibold transition-colors"
                            style={{
                              backgroundColor: active
                                ? 'var(--accent-primary)'
                                : 'transparent',
                              color: active ? '#fff' : 'rgba(255,255,255,0.74)',
                            }}
                          >
                            x{count}
                          </button>
                        )
                      })}
                    </div>
                    </div>

                    <div className={`px-4 py-3 ${isLandscapeLearn ? 'flex w-[42%] flex-col border-l border-white/10' : 'border-t border-white/10'}`}>
                      <ProgressBar />
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {clip?.expressionText ?? 'Expression'}
                          </p>
                          {clip?.videoTitle ? (
                            <p className="mt-0.5 truncate text-xs text-white/55">{clip.videoTitle}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 p-1">
                          {([
                            { id: 'en', label: 'EN' },
                            { id: 'bilingual', label: 'EN/KO' },
                            { id: 'locked', label: '🔒' },
                          ] as const).map((option) => {
                            const active = learnSubtitleMode === option.id
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setLearnSubtitleMode(option.id)
                                  if (option.id !== 'locked') {
                                    setRevealedLineId(null)
                                  }
                                }}
                                className="rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
                                style={{
                                  backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                                  color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                                }}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <LearnSubtitleContext
                        className="mt-3 flex-1"
                        slots={displaySlots}
                        activeLineId={activeReplayLineId}
                        subtitleMode={learnSubtitleMode}
                        revealedLineId={revealedLineId}
                        onReplayLine={handleReplayLine}
                      />

                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={prev}
                        disabled={!hasPrev}
                        className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition disabled:opacity-35"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={handleTogglePlayback}
                        className="rounded-full bg-[var(--accent-primary)] px-3 py-2 text-xs font-semibold text-white"
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        disabled={!hasNext}
                        className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition disabled:opacity-35"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
