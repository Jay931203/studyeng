'use client'

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { usePlayerStore, currentTimeRef } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api'
const YOUTUBE_API_TIMEOUT_MS = 10000

let apiLoadPromise: Promise<void> | null = null

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('The YouTube player is only available in the browser.'))
  }

  if (window.YT?.Player) {
    return Promise.resolve()
  }

  if (apiLoadPromise) {
    return apiLoadPromise
  }

  apiLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${YOUTUBE_API_SRC}"]`)
    const script = existingScript ?? document.createElement('script')
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    let settled = false

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      script.removeEventListener('error', handleError)

      if (window.onYouTubeIframeAPIReady === handleReady) {
        window.onYouTubeIframeAPIReady = previousReadyHandler
      }

      if (error) {
        apiLoadPromise = null
        reject(error)
        return
      }

      resolve()
    }

    const handleReady = () => {
      previousReadyHandler?.()
      finish()
    }

    const handleError = () => {
      finish(new Error('Failed to load the YouTube iframe API.'))
    }

    const timeoutId = window.setTimeout(() => {
      finish(new Error('Timed out while loading the YouTube iframe API.'))
    }, YOUTUBE_API_TIMEOUT_MS)

    window.onYouTubeIframeAPIReady = handleReady
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.src = YOUTUBE_API_SRC
      script.async = true
      document.head.appendChild(script)
    }

    if (window.YT?.Player) {
      finish()
    }
  })

  return apiLoadPromise
}

function getVideoErrorMessage(code: number) {
  switch (code) {
    case 100:
      return 'This video is unavailable or has been removed.'
    case 101:
    case 150:
      return 'This video cannot be played inside the app.'
    case 5:
      return 'The video player hit an internal playback error.'
    default:
      return 'The video could not be loaded.'
  }
}

/**
 * Find the index of the subtitle that covers the given time.
 * When the current time falls in a gap between subtitle N and N+1,
 * subtitle N remains active until N+1 starts (no disappearing).
 */
function findActiveSubIndex(subtitles: SubtitleEntry[], time: number): number {
  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i]
    if (time >= subtitle.start && time < subtitle.end) {
      return i
    }

    if (
      time >= subtitle.end &&
      (i === subtitles.length - 1 || time < subtitles[i + 1].start)
    ) {
      return i
    }
  }

  return -1
}

function isYouTubePlayer(
  player: YT.Player | null | undefined,
): player is YT.Player & {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  getPlayerState: () => number
} {
  return Boolean(
    player &&
      typeof player.playVideo === 'function' &&
      typeof player.pauseVideo === 'function' &&
      typeof player.seekTo === 'function',
  )
}

export function useYouTubePlayer(
  containerId: string,
  videoId: string,
  clipStart = 0,
  clipEnd = 0,
  subtitles: SubtitleEntry[] = [],
  onClipComplete?: () => void,
  initialSeekTime?: number,
  onEmbedBlocked?: () => void,
) {
  const playerRef = useRef<YT.Player | null>(null)
  const intervalRef = useRef<number | null>(null)
  const wasPlayingBeforeHideRef = useRef(false)
  const prevSubIndexRef = useRef(-1)
  const lastProgressWriteRef = useRef(0)
  const clipBoundaryCooldownRef = useRef(false)
  const effectiveClipStartRef = useRef(clipStart)
  const effectiveClipEndRef = useRef(clipEnd)
  const playerSessionKey = `${containerId}:${videoId}:${clipStart}:${clipEnd}:${initialSeekTime ?? ''}`

  const [readySessionKey, setReadySessionKey] = useState<string | null>(null)
  const [playbackStartedSessionKey, setPlaybackStartedSessionKey] = useState<string | null>(null)
  const [videoErrorState, setVideoErrorState] = useState<{
    message: string
    sessionKey: string
  } | null>(null)
  const ready = readySessionKey === playerSessionKey
  const playbackStarted = playbackStartedSessionKey === playerSessionKey
  const videoError =
    videoErrorState?.sessionKey === playerSessionKey ? videoErrorState.message : null

  const playbackRate = usePlayerStore((state) => state.playbackRate)
  const isLooping = usePlayerStore((state) => state.isLooping)
  const loopStart = usePlayerStore((state) => state.loopStart)
  const loopEnd = usePlayerStore((state) => state.loopEnd)
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime)
  const setDuration = usePlayerStore((state) => state.setDuration)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const setClipBounds = usePlayerStore((state) => state.setClipBounds)
  const setActiveSubIndex = usePlayerStore((state) => state.setActiveSubIndex)

  const handleClipComplete = useEffectEvent(() => {
    onClipComplete?.()
  })

  const handleEmbedBlocked = useEffectEvent(() => {
    onEmbedBlocked?.()
  })

  const handlePlayerTick = useEffectEvent(() => {
    const player = playerRef.current
    if (!isYouTubePlayer(player)) return

    let time: number
    try {
      time = player.getCurrentTime()
    } catch {
      return
    }

    currentTimeRef.current = time

    if (isLooping && loopStart !== null && loopEnd !== null && time >= loopEnd) {
      player.seekTo(loopStart, true)
      return
    }

    if (freezeSubIndex !== null && subtitles[freezeSubIndex]) {
      const frozenSub = subtitles[freezeSubIndex]
      if (time >= frozenSub.end - 0.05 || time < frozenSub.start - 0.3) {
        player.seekTo(frozenSub.start, true)
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

    const effectiveClipEnd = effectiveClipEndRef.current
    const effectiveClipStart = effectiveClipStartRef.current
    const earlyTrigger = effectiveClipEnd - 1.5

    if (
      effectiveClipEnd > effectiveClipStart &&
      time >= earlyTrigger &&
      !clipBoundaryCooldownRef.current
    ) {
      clipBoundaryCooldownRef.current = true
      window.setTimeout(() => {
        clipBoundaryCooldownRef.current = false
      }, 1000)

      handleClipComplete()
      player.seekTo(effectiveClipStart, true)
    }
  })

  useEffect(() => {
    if (!ready) return

    const stopPolling = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const startPolling = () => {
      if (intervalRef.current !== null || document.hidden) return

      intervalRef.current = window.setInterval(() => {
        handlePlayerTick()
      }, 100)
    }

    startPolling()

    const handleVisibilityChange = () => {
      const player = playerRef.current
      if (!isYouTubePlayer(player)) return

      if (document.hidden) {
        try {
          wasPlayingBeforeHideRef.current = player.getPlayerState() === 1
        } catch {
          wasPlayingBeforeHideRef.current = false
        }

        player.pauseVideo()
        stopPolling()
        return
      }

      if (wasPlayingBeforeHideRef.current) {
        player.playVideo()
      }

      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopPolling()
    }
  }, [ready])

  useEffect(() => {
    if (!ready || !playerRef.current || typeof playerRef.current.setPlaybackRate !== 'function') return
    playerRef.current.setPlaybackRate(playbackRate)
  }, [playbackRate, ready])

  useEffect(() => {
    let disposed = false

    setIsPlaying(false)
    setCurrentTime(clipStart)
    setDuration(0)
    setClipBounds(clipStart, clipEnd)
    setActiveSubIndex(-1)
    prevSubIndexRef.current = -1
    lastProgressWriteRef.current = 0
    clipBoundaryCooldownRef.current = false
    effectiveClipStartRef.current = clipStart
    effectiveClipEndRef.current = clipEnd
    currentTimeRef.current = clipStart

    const createPlayer = async () => {
      try {
        await loadYouTubeAPI()
      } catch (error) {
        if (!disposed) {
          console.error('[youtube-player] failed to load iframe API:', error)
          setVideoErrorState({
            sessionKey: playerSessionKey,
            message: 'Unable to load the video player. Check your connection and try again.',
          })
        }
        return
      }

      if (disposed) return

      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
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
          ...(clipEnd > 0 ? { end: Math.floor(clipEnd) } : {}),
        },
        events: {
          onReady: (event) => {
            if (disposed) return

            try {
              const player = event.target as unknown as Record<string, (moduleName: string) => void>
              if (typeof player.unloadModule === 'function') {
                player.unloadModule('captions')
                player.unloadModule('cc')
              }
            } catch {
              // Ignore caption-module failures on unsupported players.
            }

            event.target.setPlaybackRate(usePlayerStore.getState().playbackRate)
            event.target.playVideo()

            const duration = event.target.getDuration()
            const maxEnd = Math.max(duration - 0.5, 1)
            const effectiveClipEnd = clipEnd > 0 ? Math.min(clipEnd, maxEnd) : maxEnd
            const effectiveClipStart = Math.min(clipStart, Math.max(effectiveClipEnd - 5, 0))

            effectiveClipStartRef.current = effectiveClipStart
            effectiveClipEndRef.current = effectiveClipEnd

            const clipDuration = effectiveClipEnd - effectiveClipStart
            if (clipDuration > 0) {
              setDuration(clipDuration)
            }

            setClipBounds(effectiveClipStart, effectiveClipEnd)

            if (
              initialSeekTime !== undefined &&
              initialSeekTime >= effectiveClipStart &&
              initialSeekTime < effectiveClipEnd
            ) {
              event.target.seekTo(initialSeekTime, true)
            }

            setReadySessionKey(playerSessionKey)
          },
          onStateChange: (event) => {
            if (disposed) return

            if (event.data === 0) {
              const effectiveClipStart = effectiveClipStartRef.current
              event.target.seekTo(effectiveClipStart, true)
              event.target.playVideo()
              handleClipComplete()
              return
            }

            const playing = event.data === 1
            setIsPlaying(playing)

            if (playing) {
              setPlaybackStartedSessionKey(playerSessionKey)
            }
          },
          onError: (event) => {
            if (disposed) return
            setVideoErrorState({
              sessionKey: playerSessionKey,
              message: getVideoErrorMessage(event.data),
            })

            if (event.data === 101 || event.data === 150) {
              handleEmbedBlocked()
            }
          },
        },
      })
    }

    void createPlayer()

    return () => {
      disposed = true
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      playerRef.current?.destroy()
      playerRef.current = null
      setIsPlaying(false)
    }
  }, [
    clipEnd,
    clipStart,
    containerId,
    initialSeekTime,
    onEmbedBlocked,
    playerSessionKey,
    setActiveSubIndex,
    setClipBounds,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    videoId,
  ])

  const play = useCallback(() => {
    const player = playerRef.current
    if (!isYouTubePlayer(player)) return
    player.playVideo()
  }, [])
  const pause = useCallback(() => {
    const player = playerRef.current
    if (!isYouTubePlayer(player)) return
    player.pauseVideo()
  }, [])
  const seekTo = useCallback((seconds: number) => {
    const player = playerRef.current
    if (!isYouTubePlayer(player)) return
    player.seekTo(seconds, true)
  }, [])
  const clearVideoError = useCallback(() => {
    setVideoErrorState((current) =>
      current?.sessionKey === playerSessionKey ? null : current,
    )
  }, [playerSessionKey])

  return {
    ready,
    playbackStarted,
    play,
    pause,
    seekTo,
    player: playerRef,
    videoError,
    clearVideoError,
  }
}
