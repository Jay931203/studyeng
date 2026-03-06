'use client'

import { useId, useState, useRef, useCallback } from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { SubtitleTimeline } from './SubtitleTimeline'

export interface SubtitleEntry {
  start: number
  end: number
  en: string
  ko: string
}

interface VideoPlayerProps {
  youtubeId: string
  subtitles: SubtitleEntry[]
  onSavePhrase?: (phrase: SubtitleEntry) => void
}

export function VideoPlayer({ youtubeId, subtitles, onSavePhrase }: VideoPlayerProps) {
  const containerId = `yt-player-${useId().replace(/:/g, '')}`
  const { ready, play, pause } = useYouTubePlayer(containerId, youtubeId)
  const { subtitleMode, currentTime, isPlaying, toggleSubtitleMode } = usePlayerStore()
  const [showPauseIcon, setShowPauseIcon] = useState(false)
  const [pauseIconType, setPauseIconType] = useState<'play' | 'pause'>('pause')
  const iconTimerRef = useRef<number | null>(null)

  const currentSub = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  )

  const handleTap = useCallback(() => {
    if (isPlaying) {
      pause()
      setPauseIconType('pause')
    } else {
      play()
      setPauseIconType('play')
    }

    setShowPauseIcon(true)
    if (iconTimerRef.current) clearTimeout(iconTimerRef.current)
    iconTimerRef.current = window.setTimeout(() => {
      setShowPauseIcon(false)
    }, 600)
  }, [isPlaying, play, pause])

  return (
    <div className="relative w-full h-full bg-black" onClick={handleTap}>
      {/* YouTube player container */}
      <div
        id={containerId}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Play/Pause icon overlay */}
      {showPauseIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/50 rounded-full w-16 h-16 flex items-center justify-center animate-fade-out">
            {pauseIconType === 'pause' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Subtitles - positioned just below the video area (landscape 16:9 video in portrait)
          A 16:9 video in a 9:16 portrait screen occupies roughly top ~30% of screen height.
          We position subtitles at approximately top-[35%] to sit just below the video. */}
      {currentSub && subtitleMode !== 'none' && (
        <div
          className="absolute top-[38%] left-4 right-4 text-center z-10"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault()
            if (onSavePhrase && currentSub) onSavePhrase(currentSub)
          }}
        >
          <p className="text-white text-lg font-semibold drop-shadow-lg bg-black/40 rounded-lg px-4 py-2 inline-block">
            {currentSub.en}
          </p>
          {subtitleMode === 'en-ko' && (
            <p className="text-gray-300 text-sm mt-1 drop-shadow-lg">
              {currentSub.ko}
            </p>
          )}
        </div>
      )}

      {/* Subtitle mode toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleSubtitleMode()
        }}
        className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium z-10"
      >
        {subtitleMode === 'none' && '자막 끔'}
        {subtitleMode === 'en' && '영어'}
        {subtitleMode === 'en-ko' && '영+한'}
      </button>

      <SubtitleTimeline
        subtitles={subtitles}
        onSavePhrase={(phrase) => onSavePhrase?.(phrase)}
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
