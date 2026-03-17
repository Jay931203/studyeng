'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useReplayStore } from '@/stores/useReplayStore'

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api'

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

    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    if (!existing) {
      const script = document.createElement('script')
      script.src = YOUTUBE_API_SRC
      script.async = true
      script.onerror = () => reject()
      document.head.appendChild(script)
    }

    setTimeout(() => reject(), 8000)
  })
}

function MiniPlayerInner({
  visibleVideo = false,
}: {
  visibleVideo?: boolean
}) {
  const clip = useReplayStore((s) => s.clip)
  const stop = useReplayStore((s) => s.stop)
  const next = useReplayStore((s) => s.next)
  const setProgress = useReplayStore((s) => s.setProgress)
  const setIsPlaying = useReplayStore((s) => s.setIsPlaying)
  const updateCurrentClip = useReplayStore((s) => s.updateCurrentClip)

  const playerRef = useRef<YT.Player | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<number | null>(null)
  const endTimerRef = useRef<number | null>(null)
  const clipKeyRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (endTimerRef.current !== null) {
      window.clearTimeout(endTimerRef.current)
      endTimerRef.current = null
    }
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch { /* ignore */ }
      playerRef.current = null
    }
    clipKeyRef.current = null
  }, [])

  useEffect(() => {
    if (!clip) {
      cleanup()
      return
    }

    const key = `${clip.videoId}:${clip.start}:${clip.end}:${clip.sentenceIdx ?? -1}`
    if (clipKeyRef.current === key) return
    clipKeyRef.current = key

    cleanup()

    let disposed = false

    const initPlayer = async () => {
      try {
        await ensureYouTubeAPI()
      } catch {
        if (!disposed) stop()
        return
      }

      if (disposed || !containerRef.current) return

      // Create a fresh div for the player
      const el = document.createElement('div')
      el.id = 'mini-replay-yt-' + Date.now()
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(el)

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
          // Fallback below.
        }
      }

      const resolvedStart = resolvedClip.start
      const resolvedEnd =
        resolvedClip.end > resolvedClip.start ? resolvedClip.end : resolvedClip.start + 5

      playerRef.current = new window.YT.Player(el.id, {
        videoId: clip.videoId,
        width: '100%',
        height: visibleVideo ? '100%' : 1,
        playerVars: {
          autoplay: 1,
          controls: visibleVideo ? 1 : 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          start: Math.floor(resolvedStart),
        },
        events: {
          onReady: (event) => {
            if (disposed) return
            const p = event.target as YT.Player
            try {
              p.unMute?.()
              p.setVolume?.(100)
            } catch { /* ignore */ }
            p.seekTo(resolvedStart, true)
            p.playVideo()

            const duration = (resolvedEnd - resolvedStart) * 1000 + 300

            // Progress polling
            intervalRef.current = window.setInterval(() => {
              if (!playerRef.current) return
              try {
                const t = playerRef.current.getCurrentTime()
                const elapsed = t - resolvedStart
                const total = resolvedEnd - resolvedStart
                const pct = Math.min(1, Math.max(0, elapsed / total))
                setProgress(pct)
              } catch { /* ignore */ }
            }, 50)

            // Auto-stop after clip ends
            endTimerRef.current = window.setTimeout(() => {
              if (!disposed) {
                const { queue, queueIndex } = useReplayStore.getState()
                if (queueIndex < queue.length - 1) {
                  next()
                } else {
                  stop()
                }
              }
            }, duration)
          },
          onStateChange: (event) => {
            if (disposed) return
            if (event.data === 1) {
              setIsPlaying(true)
            }
            // If playback ended before our timer
            if (event.data === 0 && !disposed) {
              const { queue, queueIndex } = useReplayStore.getState()
              if (queueIndex < queue.length - 1) {
                next()
              } else {
                stop()
              }
            }
          },
          onError: () => {
            if (!disposed) stop()
          },
        },
      })
    }

    void initPlayer()

    return () => {
      disposed = true
      cleanup()
    }
  }, [clip, cleanup, next, stop, setProgress, setIsPlaying, updateCurrentClip, visibleVideo])

  // Cleanup on unmount
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
}

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

export function MiniReplayPlayer() {
  const pathname = usePathname()
  const clip = useReplayStore((s) => s.clip)
  const queue = useReplayStore((s) => s.queue)
  const queueIndex = useReplayStore((s) => s.queueIndex)
  const isPlaying = useReplayStore((s) => s.isPlaying)
  const stop = useReplayStore((s) => s.stop)
  const next = useReplayStore((s) => s.next)
  const prev = useReplayStore((s) => s.prev)

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

  return (
    <>
      {visible && <MiniPlayerInner visibleVideo={isLearnPlayer} />}

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
              {/* Playing indicator */}
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
                        animate={{
                          height: [6, 12, 6],
                        }}
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

              {/* Expression text */}
              <p
                className="min-w-0 flex-1 truncate text-sm font-medium"
                style={{ color: 'var(--text-primary, #fff)' }}
              >
                {clip?.expressionText ?? 'Playing clip...'}
              </p>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
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
            className="fixed inset-0 z-[120] bg-black/86 backdrop-blur-sm"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-[max(16px,env(safe-area-inset-top,0px)+12px)]">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                    Learn
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/90">
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
                    <MiniPlayerInner visibleVideo />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-4 pb-4 pt-10">
                      <p className="text-base font-semibold leading-snug text-white">
                        {clip?.sentenceEn ?? clip?.expressionText ?? 'Learning clip'}
                      </p>
                      {clip?.sentenceKo && (
                        <p className="mt-1 text-sm leading-relaxed text-white/78">
                          {clip.sentenceKo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-4 py-3">
                    <ProgressBar />
                    <div className="mt-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {clip?.expressionText ?? 'Expression'}
                        </p>
                        {clip?.videoTitle && (
                          <p className="mt-0.5 truncate text-xs text-white/55">
                            {clip.videoTitle}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={prev}
                        disabled={!hasPrev}
                        className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition disabled:opacity-35"
                      >
                        이전
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        disabled={!hasNext}
                        className="rounded-full bg-[var(--accent-primary)] px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-35"
                      >
                        다음
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
