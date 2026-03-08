'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore, currentTimeRef } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

let apiLoaded = false
let apiLoading = false
const apiCallbacks: (() => void)[] = []

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve()

  return new Promise((resolve) => {
    if (apiLoading) {
      apiCallbacks.push(resolve)
      return
    }
    apiLoading = true

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true
      apiLoading = false
      resolve()
      apiCallbacks.forEach((cb) => cb())
      apiCallbacks.length = 0
    }
  })
}

/**
 * Find the index of the subtitle that covers the given time.
 * When the current time falls in a gap between subtitle N and N+1,
 * subtitle N remains active until N+1 starts (no disappearing).
 */
function findActiveSubIndex(subtitles: SubtitleEntry[], time: number): number {
  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i]
    // Currently within this subtitle's time range
    if (time >= sub.start && time < sub.end) {
      return i
    }
    // In the gap after this subtitle, before the next one starts (or after the last subtitle)
    if (time >= sub.end && (i === subtitles.length - 1 || time < subtitles[i + 1].start)) {
      return i
    }
  }
  return -1
}

export function useYouTubePlayer(
  containerId: string,
  videoId: string,
  clipStart = 0,
  clipEnd = 0,
  subtitles: SubtitleEntry[] = [],
  onClipComplete?: () => void,
) {
  const playerRef = useRef<YT.Player | null>(null)
  const intervalRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)
  // True once the video has actually started playing (first PLAYING state)
  const [playbackStarted, setPlaybackStarted] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Track whether the tab/page is currently visible
  const visibleRef = useRef(true)
  // Remember if the player was playing when the tab became hidden
  const wasPlayingBeforeHideRef = useRef(false)

  // Refs to track previous values and avoid unnecessary Zustand writes
  const prevSubIndexRef = useRef(-1)
  const lastProgressWriteRef = useRef(0)

  // Keep onClipComplete in a ref so the polling interval always sees the latest callback
  const onClipCompleteRef = useRef(onClipComplete)
  onClipCompleteRef.current = onClipComplete

  // Guard against rapid-fire clip boundary triggers
  const clipBoundaryCooldownRef = useRef(false)

  // Effective clip bounds, capped to actual video duration
  const effectiveClipStartRef = useRef(clipStart)
  const effectiveClipEndRef = useRef(clipEnd)

  const {
    playbackRate,
    isLooping,
    loopStart,
    loopEnd,
    freezeSubIndex,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setClipBounds,
    setActiveSubIndex,
  } = usePlayerStore()

  const initPlayer = useCallback(async () => {
    await loadYouTubeAPI()

    if (playerRef.current) {
      playerRef.current.destroy()
    }

    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        start: clipStart,
        // Prevent YouTube endscreen by stopping playback before video's true end
        ...(clipEnd > 0 ? { end: Math.floor(clipEnd) } : {}),
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackRate(playbackRate)
          event.target.playVideo()
          const dur = event.target.getDuration()
          // Cap clipEnd to actual video duration minus a small buffer so we
          // never try to seek past the real end of the video.  When clipEnd
          // is 0 (unset) or exceeds the video length, fall back to the
          // actual duration.
          const maxEnd = Math.max(dur - 0.5, 1)
          const effEnd = clipEnd > 0 ? Math.min(clipEnd, maxEnd) : maxEnd
          const effStart = Math.min(clipStart, Math.max(effEnd - 5, 0))
          effectiveClipStartRef.current = effStart
          effectiveClipEndRef.current = effEnd
          const clipDuration = effEnd - effStart
          if (clipDuration > 0) setDuration(clipDuration)
          setClipBounds(effStart, effEnd)
          setReady(true)
        },
        onStateChange: (event) => {
          // Intercept ENDED state to prevent YouTube endscreen overlay
          if (event.data === 0) {
            const effStart = effectiveClipStartRef.current
            event.target.seekTo(effStart, true)
            event.target.playVideo()
            if (onClipCompleteRef.current) {
              onClipCompleteRef.current()
            }
            return
          }
          const isPlaying = event.data === 1
          setIsPlaying(isPlaying)
          // Signal that the video has actually started rendering frames
          if (isPlaying) {
            setPlaybackStarted(true)
          }
        },
        onError: (event) => {
          // YouTube IFrame API error codes:
          // 2 = invalid parameter, 5 = HTML5 player error,
          // 100 = not found / removed, 101/150 = embedding disallowed
          const code = event.data
          if (code === 100) {
            setVideoError('삭제되었거나 존재하지 않는 영상이에요')
          } else if (code === 101 || code === 150) {
            setVideoError('이 영상은 외부 재생이 제한되어 있어요')
          } else if (code === 5) {
            setVideoError('영상 재생 중 오류가 발생했어요')
          } else {
            setVideoError('영상을 불러올 수 없습니다')
          }
        },
      },
    })
  }, [containerId, videoId, clipStart, clipEnd])

  useEffect(() => {
    if (!ready) return

    intervalRef.current = window.setInterval(() => {
      if (!playerRef.current) return

      let time: number
      try {
        time = playerRef.current.getCurrentTime()
      } catch {
        return // Player not ready
      }

      // Always update the shared mutable ref (no React re-render cost)
      currentTimeRef.current = time

      // --- Subtitle loop (user-triggered A-B repeat) takes highest priority ---
      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (time >= loopEnd) {
          playerRef.current.seekTo(loopStart, true)
          return // Don't process clip boundary when in subtitle loop
        }
      }

      // --- Freeze mode: loop a single subtitle's segment ---
      if (freezeSubIndex !== null && subtitles[freezeSubIndex]) {
        const frozenSub = subtitles[freezeSubIndex]
        if (time >= frozenSub.end - 0.05 || time < frozenSub.start - 0.3) {
          playerRef.current.seekTo(frozenSub.start, true)
          return
        }
      }

      // --- Active subtitle detection (updates only when subtitle changes ~every 3s) ---
      const newSubIndex = findActiveSubIndex(subtitles, time)
      if (newSubIndex !== prevSubIndexRef.current) {
        prevSubIndexRef.current = newSubIndex
        setActiveSubIndex(newSubIndex)
      }

      // --- Throttled Zustand currentTime for ProgressBar (every 500ms max) ---
      const now = performance.now()
      if (now - lastProgressWriteRef.current >= 500) {
        lastProgressWriteRef.current = now
        setCurrentTime(time)
      }

      // --- Clip boundary looping (use effective refs capped to real duration) ---
      // Trigger 1.5s early to preempt YouTube endscreen
      const effEnd = effectiveClipEndRef.current
      const effStart = effectiveClipStartRef.current
      const earlyTrigger = effEnd - 1.5
      if (effEnd > effStart && time >= earlyTrigger && !clipBoundaryCooldownRef.current) {
        // Set cooldown to prevent rapid-fire triggers while seek is in progress
        clipBoundaryCooldownRef.current = true
        setTimeout(() => { clipBoundaryCooldownRef.current = false }, 1000)

        if (onClipCompleteRef.current) {
          onClipCompleteRef.current()
        }
        playerRef.current.seekTo(effStart, true)
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [ready, isLooping, loopStart, loopEnd, freezeSubIndex, subtitles])

  // Pause player and stop polling when the browser tab becomes hidden,
  // resume when it becomes visible again.
  useEffect(() => {
    if (!ready) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibleRef.current = false

        // Remember whether the player was playing so we can resume later
        try {
          const state = playerRef.current?.getPlayerState()
          wasPlayingBeforeHideRef.current = state === 1 // YT.PlayerState.PLAYING
        } catch {
          wasPlayingBeforeHideRef.current = false
        }

        // Pause the player
        playerRef.current?.pauseVideo()

        // Stop the polling interval to save CPU/battery
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        visibleRef.current = true

        // Resume playback if it was playing before the tab was hidden
        if (wasPlayingBeforeHideRef.current) {
          playerRef.current?.playVideo()
        }

        // The polling interval will be restarted by the polling useEffect
        // because this visibility change does not trigger that effect directly.
        // We need to manually restart it here.
        if (!intervalRef.current) {
          intervalRef.current = window.setInterval(() => {
            if (!playerRef.current) return

            let time: number
            try {
              time = playerRef.current.getCurrentTime()
            } catch {
              return
            }

            currentTimeRef.current = time

            if (isLooping && loopStart !== null && loopEnd !== null) {
              if (time >= loopEnd) {
                playerRef.current.seekTo(loopStart, true)
                return
              }
            }

            // Freeze mode loop (visibility handler copy)
            if (freezeSubIndex !== null && subtitles[freezeSubIndex]) {
              const frozenSub = subtitles[freezeSubIndex]
              if (time >= frozenSub.end - 0.05 || time < frozenSub.start - 0.3) {
                playerRef.current.seekTo(frozenSub.start, true)
                return
              }
            }

            const newSubIndex = findActiveSubIndex(subtitles, time)
            if (newSubIndex !== prevSubIndexRef.current) {
              prevSubIndexRef.current = newSubIndex
              setActiveSubIndex(newSubIndex)
            }

            const now = performance.now()
            if (now - lastProgressWriteRef.current >= 500) {
              lastProgressWriteRef.current = now
              setCurrentTime(time)
            }

            const effEnd = effectiveClipEndRef.current
            const effStart = effectiveClipStartRef.current
            const earlyTrigger = effEnd - 1.5
            if (effEnd > effStart && time >= earlyTrigger && !clipBoundaryCooldownRef.current) {
              clipBoundaryCooldownRef.current = true
              setTimeout(() => { clipBoundaryCooldownRef.current = false }, 1000)
              if (onClipCompleteRef.current) {
                onClipCompleteRef.current()
              }
              playerRef.current.seekTo(effStart, true)
            }
          }, 100)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ready, isLooping, loopStart, loopEnd, freezeSubIndex, subtitles, setActiveSubIndex, setCurrentTime])

  useEffect(() => {
    if (playerRef.current && ready) {
      playerRef.current.setPlaybackRate(playbackRate)
    }
  }, [playbackRate, ready])

  useEffect(() => {
    initPlayer()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
    }
  }, [initPlayer])

  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const seekTo = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), [])
  const clearVideoError = useCallback(() => setVideoError(null), [])

  return { ready, playbackStarted, play, pause, seekTo, player: playerRef, videoError, clearVideoError }
}
