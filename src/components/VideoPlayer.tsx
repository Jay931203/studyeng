'use client'

import { useId, useState, useRef, useCallback, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useTranscript } from '@/hooks/useTranscript'
import { usePlayerStore, seekToRef } from '@/stores/usePlayerStore'
import { LyricsSubtitles } from './LyricsSubtitles'
import { ProgressBar } from './ProgressBar'
import type { SubtitleEntry } from '@/data/seed-videos'

interface VideoPlayerProps {
  videoId?: string
  youtubeId: string
  subtitles: SubtitleEntry[]
  clipStart?: number
  clipEnd?: number
  onSavePhrase?: (phrase: SubtitleEntry) => void
  onClipComplete?: () => void
  isLandscape?: boolean
  initialSeekTime?: number
  children?: ReactNode
}

export function VideoPlayer({
  videoId,
  youtubeId,
  subtitles: propSubtitles,
  clipStart = 0,
  clipEnd = 0,
  onSavePhrase,
  onClipComplete,
  isLandscape = false,
  initialSeekTime,
  children,
}: VideoPlayerProps) {
  const containerId = `yt-player-${useId().replace(/:/g, '')}`

  const { subtitles: fetchedSubtitles, loading: transcriptLoading } = useTranscript(youtubeId)

  const subtitles = useMemo(() => {
    const raw = fetchedSubtitles.length > 0 ? fetchedSubtitles : propSubtitles
    if (clipEnd > clipStart) {
      return raw.filter((subtitle) => subtitle.end > clipStart && subtitle.start < clipEnd)
    }
    return raw
  }, [clipEnd, clipStart, fetchedSubtitles, propSubtitles])

  const { ready, playbackStarted, play, pause, seekTo, videoError, clearVideoError } =
    useYouTubePlayer(containerId, youtubeId, clipStart, clipEnd, subtitles, onClipComplete, initialSeekTime)
  const isPlaying = usePlayerStore((state) => state.isPlaying)

  const [overlayVisible, setOverlayVisible] = useState(true)
  const [showPauseIcon, setShowPauseIcon] = useState(false)
  const [pauseIconType, setPauseIconType] = useState<'play' | 'pause'>('pause')
  const iconTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (playbackStarted) {
      const timer = window.setTimeout(() => {
        setOverlayVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [playbackStarted])

  useEffect(() => {
    seekToRef.current = seekTo
    return () => {
      seekToRef.current = null
    }
  }, [seekTo])

  useEffect(() => {
    return () => {
      if (iconTimerRef.current) {
        clearTimeout(iconTimerRef.current)
      }
    }
  }, [])

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
  }, [isPlaying, pause, play])

  const subtitleArea = (
    <LyricsSubtitles
      subtitles={subtitles}
      videoId={videoId ?? youtubeId}
      onSavePhrase={onSavePhrase}
      onSeek={(time) => seekTo(time)}
    />
  )

  const progressArea = (
    <div
      className="flex-shrink-0 px-4 pb-3 pt-2"
      style={{ borderTop: `1px solid var(--player-divider)` }}
    >
      <ProgressBar />
    </div>
  )

  const videoArea = (
    <div
      className={`relative ${isLandscape ? 'h-full w-full' : 'flex-1 min-h-0'}`}
      onClick={handleTap}
      style={{ backgroundColor: 'var(--player-surface)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        dangerouslySetInnerHTML={{
          __html: `<div id="${containerId}" class="h-full w-full"></div>`,
        }}
      />

      {showPauseIcon && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full animate-fade-out backdrop-blur-sm"
            style={{ backgroundColor: 'var(--player-chip-bg)', color: 'var(--player-text)' }}
          >
            {pauseIconType === 'pause' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 opacity-90">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      {videoError && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-8"
          style={{ backgroundColor: 'var(--player-surface)' }}
        >
          <div
            className="mb-1 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--player-panel)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" style={{ color: 'var(--player-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-center text-sm" style={{ color: 'var(--player-muted)' }}>
            {videoError}
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={(event) => {
                event.stopPropagation()
                clearVideoError()
                window.location.reload()
              }}
              className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--player-control-bg)',
                color: 'var(--player-muted)',
              }}
            >
              다시 시도
            </button>
            {onClipComplete && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  clearVideoError()
                  onClipComplete()
                }}
                className="rounded-lg px-4 py-2 text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                다음 영상
              </button>
            )}
          </div>
        </div>
      )}

      {!videoError && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          style={{
            backgroundColor: 'var(--player-surface)',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            ...(overlayVisible ? {} : ({ pointerEvents: 'none' } as CSSProperties)),
          }}
        >
          {!ready && (
            <div className="relative">
              <div
                className="h-8 w-8 rounded-full border-[1.5px]"
                style={{ borderColor: 'var(--player-divider)' }}
              />
              <div
                className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-[1.5px] border-transparent"
                style={{ borderTopColor: 'var(--accent-primary)' }}
              />
            </div>
          )}
        </div>
      )}

      {transcriptLoading && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 backdrop-blur-sm"
            style={{
              backgroundColor: 'var(--player-chip-bg)',
              border: `1px solid var(--player-chip-border)`,
            }}
          >
            <div
              className="h-2.5 w-2.5 animate-spin rounded-full border"
              style={{
                borderColor: 'var(--player-divider)',
                borderTopColor: 'var(--accent-primary)',
              }}
            />
            <span className="text-[10px]" style={{ color: 'var(--player-muted)' }}>
              자막 로드 중
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  )

  if (isLandscape) {
    return (
      <div className="flex h-full w-full flex-row" style={{ backgroundColor: 'var(--player-surface)' }}>
        <div className="relative h-full" style={{ width: '62%' }}>
          {videoArea}
        </div>

        <div className="h-full w-px flex-shrink-0" style={{ backgroundColor: 'var(--player-divider)' }} />

        <div className="flex min-w-0 flex-1 flex-col" style={{ backgroundColor: 'var(--player-surface)' }}>
          <div className="min-h-0 flex-1">{subtitleArea}</div>
          {progressArea}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: 'var(--player-surface)' }}>
      {videoArea}
      <div className="h-px w-full flex-shrink-0" style={{ backgroundColor: 'var(--player-divider)' }} />
      <div className="h-[176px] flex-shrink-0" style={{ backgroundColor: 'var(--player-surface)' }}>
        {subtitleArea}
      </div>
      {progressArea}
    </div>
  )
}
