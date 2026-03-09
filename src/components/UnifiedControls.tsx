'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { SaveToast } from './SaveToast'

const SPEEDS = [0.75, 1.0, 1.25, 1.5]
const REPEAT_OPTIONS = [
  { value: 'off', label: '1x' },
  { value: 'x2', label: '2x' },
  { value: 'x3', label: '3x' },
] as const
const PLAYBACK_ORDER_OPTIONS = [
  { value: 'sequence', label: '순차' },
  { value: 'shuffle', label: '랜덤' },
] as const

interface UnifiedControlsProps {
  videoId?: string
  videoTitle?: string
  className?: string
  compact?: boolean
}

export function UnifiedControls({
  videoId,
  videoTitle,
  className,
  compact = false,
}: UnifiedControlsProps) {
  const {
    subtitleMode,
    toggleSubtitleMode,
    playbackOrderMode,
    setPlaybackOrderMode,
    playbackRate,
    setPlaybackRate,
    repeatMode,
    setRepeatMode,
    isLooping,
    clearLoop,
  } = usePlayerStore()
  const { toggleLike, isLiked } = useLikeStore()

  const [showToast, setShowToast] = useState(false)
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false)
  const playbackOptionsRef = useRef<HTMLDivElement | null>(null)
  const liked = videoId ? isLiked(videoId) : false

  useEffect(() => {
    if (!showPlaybackOptions) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!playbackOptionsRef.current?.contains(event.target as Node)) {
        setShowPlaybackOptions(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPlaybackOptions(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showPlaybackOptions])

  const handleShare = useCallback(
    async (event: MouseEvent) => {
      event.stopPropagation()
      if (!videoId) return

      const shareUrl = `${window.location.origin}${buildShortsUrl(videoId)}`
      const shareText = videoTitle
        ? `${videoTitle} - Shortee에서 영상 다시 보기`
        : 'Shortee에서 영상 다시 보기'

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: videoTitle ?? 'Shortee',
            text: shareText,
            url: shareUrl,
          })
          return
        } catch {
          // Fall through to clipboard copy.
        }
      }

      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setShowToast(true)
      window.setTimeout(() => setShowToast(false), 2000)
    },
    [videoId, videoTitle],
  )

  const subtitleLabel = subtitleMode === 'none' ? 'Off' : subtitleMode === 'en' ? 'En' : 'En/Ko'
  const speedLabel = playbackRate === 1 ? '1x' : `${playbackRate}x`
  const speedActive = playbackRate !== 1
  const repeatLabel = repeatMode === 'off' ? '1x' : repeatMode === 'x2' ? '2x' : '3x'
  const playbackOrderLabel = playbackOrderMode === 'shuffle' ? '랜덤' : '순차'
  const playbackSummaryLabel = `${repeatLabel} · ${playbackOrderLabel}`
  const playbackOptionsActive = repeatMode !== 'off' || playbackOrderMode !== 'sequence'
  const controlClassName = compact
    ? 'flex h-7 min-w-[28px] items-center justify-center rounded-full text-[10px] transition-colors'
    : 'flex h-8 min-w-[32px] items-center justify-center rounded-full text-[11px] transition-colors'
  const iconButtonClassName = compact
    ? 'relative flex h-7 w-7 items-center justify-center rounded-full transition-colors'
    : 'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors'
  const dividerClassName = compact ? 'h-3.5 w-px shrink-0' : 'h-4 w-px shrink-0'
  const iconSizeClassName = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const repeatIconSizeClassName = compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const playbackTriggerClassName = compact
    ? 'flex h-7 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold transition-colors'
    : 'flex h-8 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold transition-colors'
  const playbackChipClassName = compact
    ? 'h-7 rounded-full px-2.5 text-[10px] font-semibold transition-colors'
    : 'h-8 rounded-full px-3 text-[11px] font-semibold transition-colors'

  return (
    <>
      <div ref={playbackOptionsRef} className="relative inline-flex min-w-0">
        <div
          className={
            className ??
            (compact
              ? 'inline-flex min-w-max items-center gap-0 rounded-full border px-1 py-0.5 backdrop-blur-md'
              : 'inline-flex min-w-max items-center gap-0.5 rounded-full border px-1.5 py-1 backdrop-blur-md')
          }
          style={{
            backgroundColor: 'var(--player-control-bg)',
            borderColor: 'var(--player-control-border)',
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleSubtitleMode()
            }}
            className={`${controlClassName} ${compact ? 'px-1.5 font-semibold' : 'px-2 font-semibold'}`}
            style={{ color: 'var(--player-text)' }}
            aria-label="자막 모드"
          >
            {subtitleLabel}
          </button>

          <div className={dividerClassName} style={{ backgroundColor: 'var(--player-divider)' }} />

          {videoId && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.75 }}
              onClick={(event) => {
                event.stopPropagation()
                toggleLike(videoId)
              }}
              className={iconButtonClassName}
              aria-label={liked ? '좋아요 취소' : '좋아요'}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={liked ? '#EF4444' : 'none'}
                stroke={liked ? '#EF4444' : 'var(--player-text)'}
                strokeWidth={2}
                className={iconSizeClassName}
                animate={liked ? { scale: [1, 1.35, 0.9, 1.1, 1] } : { scale: 1 }}
                transition={
                  liked
                    ? { duration: 0.5, ease: 'easeOut', times: [0, 0.2, 0.4, 0.6, 1] }
                    : { duration: 0.15 }
                }
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </motion.svg>

              <AnimatePresence>
                {liked &&
                  [0, 60, 120, 180, 240, 300].map((angle) => (
                    <motion.div
                      key={angle}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 1,
                        x: Math.cos((angle * Math.PI) / 180) * 14,
                        y: Math.sin((angle * Math.PI) / 180) * 14,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="absolute h-1 w-1 rounded-full bg-red-400"
                    />
                  ))}
              </AnimatePresence>
            </motion.button>
          )}

          <button
            type="button"
            onPointerUp={(event) => {
              event.stopPropagation()
              const index = SPEEDS.indexOf(playbackRate)
              setPlaybackRate(SPEEDS[(index + 1) % SPEEDS.length])
            }}
            className={`${controlClassName} ${compact ? 'px-1 font-bold' : 'px-1.5 font-bold'}`}
            style={{ color: speedActive ? 'var(--accent-text)' : 'var(--player-text)' }}
            aria-label="재생 속도"
          >
            {speedLabel}
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setShowPlaybackOptions((current) => !current)
            }}
            className={playbackTriggerClassName}
            style={{
              color: playbackOptionsActive ? 'var(--accent-text)' : 'var(--player-text)',
            }}
            aria-label="재생 옵션"
            aria-expanded={showPlaybackOptions}
            aria-haspopup="dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={repeatIconSizeClassName}
            >
              <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.903-1.903A9 9 0 003.306 9.67a.75.75 0 101.45.388zm14.49 3.882a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.903 1.903A9 9 0 0020.694 14.33a.75.75 0 10-1.45-.388z" />
            </svg>
            <span>{playbackSummaryLabel}</span>
          </button>

          {isLooping && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                clearLoop()
              }}
              className={iconButtonClassName}
              style={{ color: 'var(--accent-text)' }}
              aria-label="구간 반복 해제"
              title="구간 반복 해제"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={repeatIconSizeClassName}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className={dividerClassName} style={{ backgroundColor: 'var(--player-divider)' }} />

          {videoId && (
            <button
              type="button"
              onClick={handleShare}
              className={iconButtonClassName}
              style={{ color: 'var(--player-text)' }}
              aria-label="공유하기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={iconSizeClassName}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </button>
          )}
        </div>

        {showPlaybackOptions && (
          <div
            className="absolute right-0 top-[calc(100%+10px)] z-30 w-[min(240px,calc(100vw-32px))] rounded-3xl border p-3 shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--player-control-bg)',
              borderColor: 'var(--player-control-border)',
            }}
            role="dialog"
            aria-label="재생 옵션"
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--player-muted)' }}
            >
              Playback
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--player-text)' }}>
              {playbackSummaryLabel}
            </p>

            <div className="mt-3">
              <p className="text-[11px] font-semibold" style={{ color: 'var(--player-text)' }}>
                반복
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {REPEAT_OPTIONS.map((option) => {
                  const active = repeatMode === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setRepeatMode(option.value)
                      }}
                      className={playbackChipClassName}
                      style={{
                        backgroundColor: active ? 'var(--accent-glow)' : 'var(--player-panel)',
                        color: active ? 'var(--accent-text)' : 'var(--player-text)',
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold" style={{ color: 'var(--player-text)' }}>
                다음 재생
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {PLAYBACK_ORDER_OPTIONS.map((option) => {
                  const active = playbackOrderMode === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setPlaybackOrderMode(option.value)
                      }}
                      className={playbackChipClassName}
                      style={{
                        backgroundColor: active ? 'var(--accent-glow)' : 'var(--player-panel)',
                        color: active ? 'var(--accent-text)' : 'var(--player-text)',
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <SaveToast show={showToast} message="링크를 복사했어요" />
    </>
  )
}
