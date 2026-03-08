'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore, currentTimeRef } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api'
const PLAYER_READY_TIMEOUT_MS = 6000

let apiLoaded = false
let apiLoading = false
const apiCallbacks: Array<() => void> = []

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('The YouTube player is only available in the browser.'))
  }

  if (window.YT?.Player || apiLoaded) {
    apiLoaded = true
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    if (apiLoading) {
      apiCallbacks.push(resolve)
      return
    }

    apiLoading = true

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${YOUTUBE_API_SRC}"]`)
    const tag = existingScript ?? document.createElement('script')
    let settled = false

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)

      if (error) {
        apiLoading = false
        reject(error)
        return
      }

      apiLoaded = true
      apiLoading = false
      resolve()
      apiCallbacks.splice(0).forEach((callback) => callback())
    }

    const previousReadyHandler = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.()
      finish()
    }

    const timeoutId = window.setTimeout(() => {
      finish(new Error('Timed out while loading the YouTube iframe API.'))
    }, 10000)

    tag.addEventListener(
      'error',
      () => finish(new Error('Failed to load the YouTube iframe API.')),
      { once: true },
    )

    if (!existingScript) {
      tag.src = YOUTUBE_API_SRC
      tag.async = true
      document.head.appendChild(tag)
    }

    if (window.YT?.Player) {
      finish()
    }
  })
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
  const readyTimeoutRef = useRef<number | null>(null)
  const wasPlayingBeforeHideRef = useRef(false)
  const prevSubIndexRef = useRef(-1)
  const lastProgressWriteRef = useRef(0)
  const clipBoundaryCooldownRef = useRef(false)
  const effectiveClipStartRef = useRef(clipStart)
  const effectiveClipEndRef = useRef(clipEnd)
  const onClipCompleteRef = useRef(onClipComplete)
  const onEmbedBlockedRef = useRef(onEmbedBlocked)

  const [ready, setReady] = useState(false)
  const [playbackStarted, setPlaybackStarted] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  useEffect(() => {
    onClipCompleteRef.current = onClipComplete
    onEmbedBlockedRef.current = onEmbedBlocked
  }, [onClipComplete, onEmbedBlocked])

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

  const clearReadyTimeout = useCallback(() => {
    if (readyTimeoutRef.current !== null) {
      window.clearTimeout(readyTimeoutRef.current)
      readyTimeoutRef.current = null
    }
  }, [])

  const flagEmbedBlocked = useCallback(
    (message: string) => {
      setVideoError(message)
      onEmbedBlockedRef.current?.()
    },
    [],
  )

  const initPlayer = useCallback(async () => {
    setReady(false)
    setPlaybackStarted(false)
    setVideoError(null)
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

    try {
      await loadYouTubeAPI()
    } catch (error) {
      console.error('[youtube-player] failed to load iframe API:', error)
      setVideoError('Unable to load the video player. Check your connection and try again.')
      return
    }

    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    // Use Record cast to pass `origin` and `host` which are valid YouTube params
    // but missing from the @types/youtube type definitions
    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        rel: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        start: clipStart,
        ...(clipEnd > 0 ? { end: Math.floor(clipEnd) } : {}),
      } as YT.PlayerVars,
      events: {
        onReady: (event: YT.PlayerEvent) => {
          clearReadyTimeout()

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

          setReady(true)
        },
        onStateChange: (event) => {
          if (event.data === 0) {
            const effectiveClipStart = effectiveClipStartRef.current
            event.target.seekTo(effectiveClipStart, true)
            event.target.playVideo()
            onClipCompleteRef.current?.()
            return
          }

          const playing = event.data === 1
          setIsPlaying(playing)

          if (playing) {
            clearReadyTimeout()
            setPlaybackStarted(true)
          }
        },
        onError: (event) => {
          clearReadyTimeout()
          const message = getVideoErrorMessage(event.data)

          if (event.data === 101 || event.data === 150) {
            flagEmbedBlocked(message)
            return
          }

          setVideoError(message)
        },
      },
    })

    readyTimeoutRef.current = window.setTimeout(() => {
      // Timeout should NOT permanently block – just show a transient error
      setVideoError('This video is temporarily unavailable inside the app.')
    }, PLAYER_READY_TIMEOUT_MS)
  }, [
    clearReadyTimeout,
    clipEnd,
    clipStart,
    containerId,
    flagEmbedBlocked,
    initialSeekTime,
    setActiveSubIndex,
    setClipBounds,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    videoId,
  ])

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
        const player = playerRef.current
        if (!player) return

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

          onClipCompleteRef.current?.()
          player.seekTo(effectiveClipStart, true)
        }
      }, 100)
    }

    startPolling()

    const handleVisibilityChange = () => {
      const player = playerRef.current
      if (!player) return

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
  }, [freezeSubIndex, isLooping, loopEnd, loopStart, ready, setActiveSubIndex, setCurrentTime, subtitles])

  useEffect(() => {
    if (playerRef.current && ready) {
      playerRef.current.setPlaybackRate(playbackRate)
    }
  }, [playbackRate, ready])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void initPlayer()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      clearReadyTimeout()
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      playerRef.current?.destroy()
      playerRef.current = null
      setIsPlaying(false)
    }
  }, [clearReadyTimeout, initPlayer, setIsPlaying])

  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const seekTo = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), [])
  const clearVideoError = useCallback(() => setVideoError(null), [])

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
