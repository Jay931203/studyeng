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
import { useReplayStore } from '@/stores/useReplayStore'

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api'

interface ReplayPlayerHandle {
  togglePlayback: () => void
}

interface SubtitleContextLine {
  id: string
  en: string
  ko?: string
  active: boolean
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

const MiniPlayerInner = forwardRef<ReplayPlayerHandle, { visibleVideo?: boolean }>(
  function MiniPlayerInner({ visibleVideo = false }, ref) {
    const clip = useReplayStore((s) => s.clip)
    const stop = useReplayStore((s) => s.stop)
    const next = useReplayStore((s) => s.next)
    const setProgress = useReplayStore((s) => s.setProgress)
    const setIsPlaying = useReplayStore((s) => s.setIsPlaying)
    const updateCurrentClip = useReplayStore((s) => s.updateCurrentClip)

    const playerRef = useRef<YT.Player | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const intervalRef = useRef<number | null>(null)
    const clipKeyRef = useRef<string | null>(null)
    const activeVideoIdRef = useRef<string | null>(null)
    const transitionLockRef = useRef<number | null>(null)

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
    }, [clearMonitor])

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

    const monitorPlaybackWindow = useCallback(
      (player: YT.Player, start: number, end: number) => {
        clearMonitor()
        setProgress(0)

        intervalRef.current = window.setInterval(() => {
          if (!playerRef.current) return

          try {
            const currentTime = player.getCurrentTime()
            const total = Math.max(0.01, end - start)
            const elapsed = Math.max(0, currentTime - start)
            const progress = Math.min(1, elapsed / total)
            setProgress(progress)

            if (player.getPlayerState() === 1 && currentTime >= end - 0.05) {
              clearMonitor()
              advanceQueue()
            }
          } catch {
            // ignore transient iframe errors
          }
        }, 100)
      },
      [advanceQueue, clearMonitor, setProgress],
    )

    const startPlaybackWindow = useCallback(
      (player: YT.Player, start: number, end: number) => {
        try {
          player.seekTo(start, true)
          player.playVideo()
          setIsPlaying(true)
          monitorPlaybackWindow(player, start, end)
        } catch {
          // ignore
        }
      },
      [monitorPlaybackWindow, setIsPlaying],
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

            player.playVideo()
            setIsPlaying(true)

            const currentClip = useReplayStore.getState().clip
            if (currentClip) {
              const end =
                currentClip.end > currentClip.start
                  ? currentClip.end
                  : currentClip.start + 5
              monitorPlaybackWindow(player, currentClip.start, end)
            }
          } catch {
            // ignore
          }
        },
      }),
      [monitorPlaybackWindow, setIsPlaying],
    )

    useEffect(() => {
      if (!clip) {
        cleanup()
        return
      }

      const key = `${clip.videoId}:${clip.start}:${clip.end}:${clip.sentenceIdx ?? -1}`
      if (clipKeyRef.current === key) return
      clipKeyRef.current = key

      let disposed = false

      const initPlayer = async () => {
        try {
          await ensureYouTubeAPI()
        } catch {
          if (!disposed) stop()
          return
        }

        if (disposed || !containerRef.current) return

        let resolvedClip = clip
        if (
          (resolvedClip.start <= 0 || resolvedClip.end <= resolvedClip.start) &&
          typeof resolvedClip.sentenceIdx === 'number'
        ) {
          try {
            const response = await fetch(`/transcripts/${resolvedClip.videoId}.json`)
            if (response.ok) {
              const subtitles = await response.json()
              const matchedSubtitle = subtitles[resolvedClip.sentenceIdx]
              if (matchedSubtitle) {
                resolvedClip = {
                  ...resolvedClip,
                  start: matchedSubtitle.start,
                  end: matchedSubtitle.end,
                }
                updateCurrentClip({
                  start: matchedSubtitle.start,
                  end: matchedSubtitle.end,
                })
              }
            }
          } catch {
            // best effort only
          }
        }

        const resolvedStart = resolvedClip.start
        const resolvedEnd =
          resolvedClip.end > resolvedClip.start ? resolvedClip.end : resolvedClip.start + 5

        if (playerRef.current && activeVideoIdRef.current === resolvedClip.videoId) {
          startPlaybackWindow(playerRef.current, resolvedStart, resolvedEnd)
          return
        }

        const element = document.createElement('div')
        element.id = `mini-replay-yt-${Date.now()}`
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(element)

        if (playerRef.current) {
          try {
            playerRef.current.destroy()
          } catch {
            // ignore
          }
          playerRef.current = null
        }

        activeVideoIdRef.current = null
        clearMonitor()

        playerRef.current = new window.YT.Player(element.id, {
          videoId: clip.videoId,
          width: '100%',
          height: visibleVideo ? '100%' : 1,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            start: Math.floor(resolvedStart),
          },
          events: {
            onReady: (event) => {
              if (disposed) return
              const player = event.target as YT.Player
              activeVideoIdRef.current = resolvedClip.videoId
              try {
                player.unMute?.()
                player.setVolume?.(100)
              } catch {
                // ignore
              }
              startPlaybackWindow(player, resolvedStart, resolvedEnd)
            },
            onStateChange: (event) => {
              if (disposed) return

              if (event.data === 1) {
                setIsPlaying(true)
              } else if (event.data === 2 || event.data === 5) {
                setIsPlaying(false)
              } else if (event.data === 0) {
                clearMonitor()
                advanceQueue()
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
      clearMonitor,
      cleanup,
      clip,
      monitorPlaybackWindow,
      setIsPlaying,
      startPlaybackWindow,
      stop,
      updateCurrentClip,
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
  },
)

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

function LearnSubtitleContext({ className }: { className?: string }) {
  const clip = useReplayStore((s) => s.clip)
  const [lines, setLines] = useState<SubtitleContextLine[]>([])

  useEffect(() => {
    let cancelled = false

    if (!clip?.videoId) {
      setLines([])
      return
    }

    if (typeof clip.sentenceIdx !== 'number') {
      setLines(
        clip.sentenceEn
          ? [
              {
                id: `${clip.videoId}-current`,
                en: clip.sentenceEn,
                ko: clip.sentenceKo,
                active: true,
              },
            ]
          : [],
      )
      return
    }

    const loadTranscript = async () => {
      try {
        const response = await fetch(`/transcripts/${clip.videoId}.json`)
        if (!response.ok) throw new Error('Transcript missing')

        const subtitles = await response.json()
        if (!Array.isArray(subtitles) || cancelled) return
        const sentenceIndex = clip.sentenceIdx
        if (typeof sentenceIndex !== 'number') return

        const windowLines = [sentenceIndex - 1, sentenceIndex, sentenceIndex + 1]
          .map((index) => {
            const subtitle = subtitles[index]
            if (!subtitle?.en) return null
            return {
              id: `${clip.videoId}:${index}`,
              en: subtitle.en,
              ko: subtitle.ko,
              active: index === sentenceIndex,
            }
          })
          .filter(Boolean) as SubtitleContextLine[]

        if (!cancelled) {
          setLines(windowLines)
        }
      } catch {
        if (!cancelled && clip.sentenceEn) {
          setLines([
            {
              id: `${clip.videoId}-fallback`,
              en: clip.sentenceEn,
              ko: clip.sentenceKo,
              active: true,
            },
          ])
        }
      }
    }

    void loadTranscript()
    return () => {
      cancelled = true
    }
  }, [clip])

    if (lines.length === 0) return null

  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="space-y-2">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`rounded-xl px-3 py-2 transition-colors ${
                line.active ? 'bg-white/10' : 'bg-transparent'
              }`}
            >
              <p
                className={`text-sm leading-relaxed ${
                  line.active ? 'font-semibold text-white' : 'text-white/58'
                }`}
              >
                {line.en}
              </p>
              {line.active && line.ko ? (
                <p className="mt-1 text-xs leading-relaxed text-white/72">{line.ko}</p>
              ) : null}
            </div>
          ))}
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
  const playerApiRef = useRef<ReplayPlayerHandle | null>(null)

  const visible = clip !== null
  const isLearnPlayer = visible && pathname?.startsWith('/explore/learn')
  const hasPrev = queueIndex > 0
  const hasNext = queueIndex < queue.length - 1
  const uniqueVideoIds = useMemo(
    () => [...new Set(queue.map((queueClip) => queueClip.videoId))],
    [queue],
  )
  const currentVideoIndex = clip ? uniqueVideoIds.indexOf(clip.videoId) : -1

  useEffect(() => {
    if (!isLearnPlayer) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isLearnPlayer])

  return (
    <>
      {visible && !isLearnPlayer ? <MiniPlayerInner ref={playerApiRef} visibleVideo={false} /> : null}

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
                    영상 {Math.max(1, currentVideoIndex + 1)} / {Math.max(1, uniqueVideoIds.length)} · 클립{' '}
                    {queueIndex + 1} / {queue.length}
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
                <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  <div className="relative">
                    <MiniPlayerInner ref={playerApiRef} visibleVideo />
                    <button
                      type="button"
                      onClick={() => playerApiRef.current?.togglePlayback()}
                      className="absolute inset-0 z-10"
                      aria-label={isPlaying ? 'Pause learn clip' : 'Play learn clip'}
                    />
                    <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/85">
                      {isPlaying ? 'Pause' : 'Play'}
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-4 py-3">
                    <ProgressBar />
                    <div className="mt-3">
                      <p className="truncate text-sm font-semibold text-white">
                        {clip?.expressionText ?? 'Expression'}
                      </p>
                      {clip?.videoTitle ? (
                        <p className="mt-0.5 truncate text-xs text-white/55">{clip.videoTitle}</p>
                      ) : null}
                    </div>

                    <LearnSubtitleContext className="mt-3" />

                    <div className="mt-3 flex items-center gap-2">
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
                        onClick={() => playerApiRef.current?.togglePlayback()}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
