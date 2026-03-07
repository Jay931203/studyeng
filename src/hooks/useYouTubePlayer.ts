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
 * Returns -1 if no subtitle is active.
 */
function findActiveSubIndex(subtitles: SubtitleEntry[], time: number): number {
  for (let i = 0; i < subtitles.length; i++) {
    if (time >= subtitles[i].start && time <= subtitles[i].end) return i
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
          setIsPlaying(event.data === 1)
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
      const effEnd = effectiveClipEndRef.current
      const effStart = effectiveClipStartRef.current
      if (effEnd > effStart && time >= effEnd && !clipBoundaryCooldownRef.current) {
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
  }, [ready, isLooping, loopStart, loopEnd, subtitles])

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

  const play = () => playerRef.current?.playVideo()
  const pause = () => playerRef.current?.pauseVideo()
  const seekTo = (seconds: number) => playerRef.current?.seekTo(seconds, true)

  return { ready, play, pause, seekTo, player: playerRef }
}
