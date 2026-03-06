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
) {
  const playerRef = useRef<YT.Player | null>(null)
  const intervalRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)

  // Refs to track previous values and avoid unnecessary Zustand writes
  const prevSubIndexRef = useRef(-1)
  const lastProgressWriteRef = useRef(0)

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
          const clipDuration = clipEnd > clipStart ? clipEnd - clipStart : event.target.getDuration()
          if (clipDuration > 0) setDuration(clipDuration)
          setClipBounds(clipStart, clipEnd)
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
      const time = playerRef.current.getCurrentTime()

      // Always update the shared mutable ref (no React re-render cost)
      currentTimeRef.current = time

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

      // Clip boundary looping: seek back to clipStart when reaching clipEnd
      if (clipEnd > clipStart && time >= clipEnd) {
        playerRef.current.seekTo(clipStart, true)
      }

      // Subtitle loop (user-triggered A-B repeat) takes priority within clip
      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (time >= loopEnd) {
          playerRef.current.seekTo(loopStart, true)
        }
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [ready, isLooping, loopStart, loopEnd, clipStart, clipEnd, subtitles])

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
