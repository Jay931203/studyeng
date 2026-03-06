'use client'

import { useId } from 'react'
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

  const currentSub = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  )

  const handleTap = () => {
    if (isPlaying) pause()
    else play()
  }

  return (
    <div className="relative w-full h-full bg-black" onClick={handleTap}>
      <div
        id={containerId}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {currentSub && subtitleMode !== 'none' && (
        <div
          className="absolute bottom-24 left-4 right-4 text-center"
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

      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleSubtitleMode()
        }}
        className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium z-10"
      >
        {subtitleMode === 'none' && 'CC Off'}
        {subtitleMode === 'en' && 'EN'}
        {subtitleMode === 'en-ko' && 'EN/KO'}
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
