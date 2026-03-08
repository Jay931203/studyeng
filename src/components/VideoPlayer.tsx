'use client'

import { useId, useState, useRef, useCallback, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useTranscript } from '@/hooks/useTranscript'
import { usePlayerStore, seekToRef } from '@/stores/usePlayerStore'
import { LyricsSubtitles } from './LyricsSubtitles'
import type { SubtitleEntry } from '@/data/seed-videos'

interface VideoPlayerProps {
  youtubeId: string
  subtitles: SubtitleEntry[]
  clipStart?: number
  clipEnd?: number
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onClipComplete?: () => void
  isLandscape?: boolean
  children?: ReactNode
}

export function VideoPlayer({
  youtubeId,
  subtitles: propSubtitles,
  clipStart = 0,
  clipEnd = 0,
  onSavePhrase,
  onClipComplete,
  isLandscape = false,
  children,
}: VideoPlayerProps) {
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

  const { ready, playbackStarted, play, pause, seekTo, videoError, clearVideoError } = useYouTubePlayer(containerId, youtubeId, clipStart, clipEnd, subtitles, onClipComplete)
  const { isPlaying } = usePlayerStore()

  // Transition overlay: starts fully opaque, fades out after playback begins.
  // This hides the YouTube logo/branding that briefly flashes during video load.
  const [overlayVisible, setOverlayVisible] = useState(true)

  useEffect(() => {
    if (playbackStarted) {
      // Wait 300ms after first PLAYING state to ensure the video frame is
      // actually visible before starting the fade — prevents the YouTube
      // logo from flashing between overlay disappearing and video rendering.
      const timer = window.setTimeout(() => {
        setOverlayVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      // When playback hasn't started (new video loading), ensure overlay is
      // visible. Handles edge cases where React preserves component state.
      setOverlayVisible(true)
    }
  }, [playbackStarted])

  // Register seekTo in the shared ref so sibling components (e.g. ProgressBar) can seek
  useEffect(() => {
    seekToRef.current = seekTo
    return () => { seekToRef.current = null }
  }, [seekTo])
  const [showPauseIcon, setShowPauseIcon] = useState(false)
  const [pauseIconType, setPauseIconType] = useState<'play' | 'pause'>('pause')
  const iconTimerRef = useRef<number | null>(null)

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

  // Shared video area content (used in both orientations)
  const videoArea = (
    <div className={`relative ${isLandscape ? 'w-full h-full' : 'flex-1 min-h-0'}`} onClick={handleTap}>
      {/* YouTube player container */}
      <div
        id={containerId}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Play/Pause icon overlay — refined, smaller */}
      {showPauseIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/40 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center animate-fade-out">
            {pauseIconType === 'pause' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 opacity-90">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 opacity-90 ml-0.5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Video error overlay — clean, understated */}
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 gap-3 px-8">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-white/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-white/60 text-center text-sm">{videoError}</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearVideoError()
                window.location.reload()
              }}
              className="px-4 py-2 bg-white/8 text-white/70 rounded-lg text-xs font-medium hover:bg-white/12 transition-colors"
            >
              다시 시도
            </button>
            {onClipComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearVideoError()
                  onClipComplete()
                }}
                className="px-4 py-2 bg-white/12 text-white/90 rounded-lg text-xs font-medium hover:bg-white/18 transition-colors"
              >
                다음 영상
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video transition overlay — covers YouTube branding during load.
          Stays fully opaque until playback actually starts, then fades out. */}
      {!videoError && (
        <div
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black"
          style={{
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            // Remove from layout after fade completes to not block interactions
            ...(overlayVisible ? {} : { pointerEvents: 'none' } as CSSProperties),
          }}
        >
          {/* Spinner shown while loading */}
          {!ready && (
            <div className="relative">
              <div className="w-8 h-8 border-[1.5px] border-white/10 rounded-full" />
              <div className="absolute inset-0 w-8 h-8 border-[1.5px] border-transparent border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Transcript loading indicator */}
      {transcriptLoading && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 border border-white/20 border-t-white/50 rounded-full animate-spin" />
            <span className="text-white/40 text-[10px]">자막 로드 중</span>
          </div>
        </div>
      )}
      {children}
    </div>
  )

  const subtitleArea = (
    <LyricsSubtitles
      subtitles={subtitles}
      videoId={youtubeId}
      onSavePhrase={onSavePhrase}
      onSeek={(time) => seekTo(time)}
    />
  )

  if (isLandscape) {
    // Landscape: side-by-side — video left (60%), subtitles right (40%)
    return (
      <div className="flex flex-row w-full h-full bg-black">
        {/* Video area — left side */}
        <div className="relative h-full" style={{ width: '62%' }}>
          {videoArea}
        </div>

        {/* Vertical divider */}
        <div className="h-full w-px bg-gradient-to-b from-transparent via-white/8 to-transparent flex-shrink-0" />

        {/* Subtitles area — right side, full height */}
        <div className="flex-1 h-full bg-black min-w-0">
          {subtitleArea}
        </div>
      </div>
    )
  }

  // Portrait: stacked — video on top, subtitles at bottom
  return (
    <div className="flex flex-col w-full h-full bg-black">
      {videoArea}

      {/* Soft divider between video and subtitle areas */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent flex-shrink-0" />

      {/* Subtitles area — fixed height for 3 subtitle lines */}
      <div className="flex-shrink-0 h-[200px] bg-black">
        {subtitleArea}
      </div>
    </div>
  )
}
