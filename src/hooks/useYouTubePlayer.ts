'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'

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

export function useYouTubePlayer(containerId: string, videoId: string) {
  const playerRef = useRef<YT.Player | null>(null)
  const intervalRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)

  const {
    playbackRate,
    isLooping,
    loopStart,
    loopEnd,
    setCurrentTime,
    setIsPlaying,
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
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackRate(playbackRate)
          setReady(true)
        },
        onStateChange: (event) => {
          setIsPlaying(event.data === 1)
        },
      },
    })
  }, [containerId, videoId])

  useEffect(() => {
    if (!ready) return

    intervalRef.current = window.setInterval(() => {
      if (!playerRef.current) return
      const time = playerRef.current.getCurrentTime()
      setCurrentTime(time)

      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (time >= loopEnd) {
          playerRef.current.seekTo(loopStart, true)
        }
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [ready, isLooping, loopStart, loopEnd])

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
