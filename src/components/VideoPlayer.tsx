'use client'

import { useId, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useTranscript } from '@/hooks/useTranscript'
import { usePlayerStore, seekToRef } from '@/stores/usePlayerStore'
import { LyricsSubtitles } from './LyricsSubtitles'
import { PremiumModal } from './PremiumModal'
import type { SubtitleEntry } from '@/data/seed-videos'

interface VideoPlayerProps {
  youtubeId: string
  subtitles: SubtitleEntry[]
  clipStart?: number
  clipEnd?: number
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onClipComplete?: () => void
}

export function VideoPlayer({ youtubeId, subtitles: propSubtitles, clipStart = 0, clipEnd = 0, onSavePhrase, onClipComplete }: VideoPlayerProps) {
  const containerId = `yt-player-${useId().replace(/:/g, '')}`

  // Fetch real transcript from YouTube
  const { subtitles: fetchedSubtitles, loading: transcriptLoading } = useTranscript(youtubeId)

  // Use fetched subtitles if available, fall back to prop subtitles.
  // Filter to clip range when clipStart/clipEnd are set so that only
  // relevant subtitles appear in the timeline and subtitle overlay.
  const subtitles = useMemo(() => {
    const raw = fetchedSubtitles.length > 0 ? fetchedSubtitles : propSubtitles
    if (clipEnd > clipStart) {
      return raw.filter((s) => s.end > clipStart && s.start < clipEnd)
    }
    return raw
  }, [fetchedSubtitles, propSubtitles, clipStart, clipEnd])

  const { ready, play, pause, seekTo } = useYouTubePlayer(containerId, youtubeId, clipStart, clipEnd, subtitles, onClipComplete)
  const { isPlaying, subtitleGateBlocked, clearSubtitleGateBlocked } = usePlayerStore()

  // Register seekTo in the shared ref so sibling components (e.g. ProgressBar) can seek
  useEffect(() => {
    seekToRef.current = seekTo
    return () => { seekToRef.current = null }
  }, [seekTo])
  const [showPauseIcon, setShowPauseIcon] = useState(false)
  const [pauseIconType, setPauseIconType] = useState<'play' | 'pause'>('pause')
  const [showSubtitleGate, setShowSubtitleGate] = useState(false)
  const iconTimerRef = useRef<number | null>(null)

  // Show premium modal when subtitle gate is triggered
  useEffect(() => {
    if (subtitleGateBlocked) {
      setShowSubtitleGate(true)
      clearSubtitleGateBlocked()
    }
  }, [subtitleGateBlocked, clearSubtitleGateBlocked])

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

      {/* Transparent overlay to block YouTube's own UI elements (share, title, etc.)
          while still allowing our own tap-to-play/pause via the parent onClick */}
      <div className="absolute inset-0 w-full h-full z-[1]" />

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

      {/* Scrollable lyrics-style subtitles */}
      <LyricsSubtitles
        subtitles={subtitles}
        onSavePhrase={onSavePhrase}
        onSeek={(time) => seekTo(time)}
      />

      {/* Transcript loading indicator */}
      {transcriptLoading && (
        <div className="absolute bottom-[160px] left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/60 text-xs">Loading subtitles...</span>
          </div>
        </div>
      )}


      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <PremiumModal
        isOpen={showSubtitleGate}
        onClose={() => setShowSubtitleGate(false)}
        trigger="subtitle"
      />
    </div>
  )
}
