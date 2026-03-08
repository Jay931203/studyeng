'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore, currentTimeRef } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

let apiLoaded = false
let apiLoading = false
const apiCallbacks: Array<() => void> = []

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('The YouTube player is only available in the browser.'))
  }

  if (apiLoaded || window.YT?.Player) return Promise.resolve()

  return new Promise((resolve) => {
    if (apiLoading) {
      apiCallbacks.push(resolve)
      return
    }

    apiLoading = true

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    const tag = existing ?? document.createElement('script')
    if (!existing) {
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true
      apiLoading = false
      resolve()
      apiCallbacks.splice(0).forEach((callback) => callback())
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

  onClipCompleteRef.current = onClipComplete
  onEmbedBlockedRef.current = onEmbedBlocked

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
      playerRef.current = null
    }

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
          try {
            const player = event.target as unknown as Record<string, (moduleName: string) => void>
            if (typeof player.unloadModule === 'function') {
              player.unloadModule('captions')
              player.unloadModule('cc')
            }
          } catch {
            // Ignore unsupported caption module unloads.
          }

          event.target.setPlaybackRate(playbackRate)

          const duration = event.target.getDuration()
          const maxEnd = Math.max(duration - 0.5, 1)
          const effectiveClipEnd = clipEnd > 0 ? Math.min(clipEnd, maxEnd) : maxEnd
          const effectiveClipStart = Math.min(clipStart, Math.max(effectiveClipEnd - 5, 0))
          effectiveClipStartRef.current = effectiveClipStart
          effectiveClipEndRef.current = effectiveClipEnd

          const clipDuration = effectiveClipEnd - effectiveClipStart
          if (clipDuration > 0) setDuration(clipDuration)
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
            setPlaybackStarted(true)
          }
        },
        onError: (event) => {
          const message = getVideoErrorMessage(event.data)
          setVideoError(message)

          if (event.data === 101 || event.data === 150) {
            onEmbedBlockedRef.current?.()
          }
        },
      },
    })
  }, [clipStart, clipEnd, containerId, initialSeekTime, playbackRate, setActiveSubIndex, setClipBounds, setCurrentTime, setDuration, setIsPlaying, videoId])

  useEffect(() => {
    if (!ready) return

    const player = playerRef.current
    if (!player || typeof player.playVideo !== 'function') return

    const rafId = window.requestAnimationFrame(() => {
      try {
        player.playVideo()
      } catch {
        // Ignore autoplay failures.
      }
    })

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [ready])

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
        if (!player || typeof player.getCurrentTime !== 'function') return

        let time: number
        try {
          time = player.getCurrentTime()
        } catch {
          return
        }

        currentTimeRef.current = time

        if (isLooping && loopStart !== null && loopEnd !== null) {
          if (time >= loopEnd) {
            player.seekTo(loopStart, true)
            return
          }
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
        if (effectiveClipEnd > effectiveClipStart && time >= earlyTrigger && !clipBoundaryCooldownRef.current) {
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
      } else {
        if (wasPlayingBeforeHideRef.current) {
          player.playVideo()
        }
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopPolling()
    }
  }, [ready, isLooping, loopStart, loopEnd, freezeSubIndex, subtitles, setActiveSubIndex, setCurrentTime])

  useEffect(() => {
    if (playerRef.current && ready) {
      playerRef.current.setPlaybackRate(playbackRate)
    }
  }, [playbackRate, ready])

  useEffect(() => {
    void initPlayer()
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
      setIsPlaying(false)
    }
  }, [initPlayer, setIsPlaying])

  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const seekTo = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), [])
  const clearVideoError = useCallback(() => setVideoError(null), [])

  return { ready, playbackStarted, play, pause, seekTo, player: playerRef, videoError, clearVideoError }
}
