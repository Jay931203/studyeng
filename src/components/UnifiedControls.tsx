'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore, type IssueType } from '@/stores/useAdminStore'
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
const REPORT_TYPE_OPTIONS: Array<{ value: IssueType; label: string }> = [
  { value: 'subtitle', label: '자막' },
  { value: 'video', label: '영상' },
  { value: 'other', label: '기타' },
]

const VIEWPORT_MARGIN = 16
const POPUP_GAP = 10
const PLAYBACK_POPOVER_WIDTH = 240
const MENU_POPOVER_WIDTH = 196

interface PopoverPosition {
  top: number
  left: number
  width: number
}

interface UnifiedControlsProps {
  videoId?: string
  youtubeId?: string
  videoTitle?: string
  className?: string
  compact?: boolean
}

function getPopoverPosition(trigger: HTMLElement | null, width: number): PopoverPosition | null {
  if (!trigger || typeof window === 'undefined') return null

  const rect = trigger.getBoundingClientRect()
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.right - width, window.innerWidth - VIEWPORT_MARGIN - width),
  )

  return {
    top: rect.bottom + POPUP_GAP,
    left,
    width,
  }
}

export function UnifiedControls({
  videoId,
  youtubeId,
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
    gameModeEnabled,
    setGameModeEnabled,
  } = usePlayerStore()
  const { toggleLike, isLiked } = useLikeStore()
  const addIssue = useAdminStore((state) => state.addIssue)
  const adminSyncError = useAdminStore((state) => state.adminSyncError)
  const setAdminSyncError = useAdminStore((state) => state.setAdminSyncError)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportType, setReportType] = useState<IssueType>('subtitle')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState<PopoverPosition | null>(null)
  const [menuPosition, setMenuPosition] = useState<PopoverPosition | null>(null)

  const liked = videoId ? isLiked(videoId) : false
  const playbackTriggerRef = useRef<HTMLButtonElement | null>(null)
  const playbackPanelRef = useRef<HTMLDivElement | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const menuPanelRef = useRef<HTMLDivElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 2000)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!showPlaybackOptions) return

    const updatePosition = () => {
      setPlaybackPosition(getPopoverPosition(playbackTriggerRef.current, PLAYBACK_POPOVER_WIDTH))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showPlaybackOptions])

  useEffect(() => {
    if (!showMenu) return

    const updatePosition = () => {
      setMenuPosition(getPopoverPosition(menuTriggerRef.current, MENU_POPOVER_WIDTH))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showMenu])

  useEffect(() => {
    if (!showPlaybackOptions && !showMenu) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node

      const insidePlayback =
        playbackTriggerRef.current?.contains(target) ||
        playbackPanelRef.current?.contains(target)
      const insideMenu = menuTriggerRef.current?.contains(target) || menuPanelRef.current?.contains(target)

      if (!insidePlayback) {
        setShowPlaybackOptions(false)
      }

      if (!insideMenu) {
        setShowMenu(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPlaybackOptions(false)
        setShowMenu(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMenu, showPlaybackOptions])

  const handleShare = useCallback(
    async (event?: MouseEvent) => {
      event?.stopPropagation()
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
          showToast('공유 시트를 열었어요')
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

      showToast('링크를 복사했어요')
    },
    [showToast, videoId, videoTitle],
  )

  const handleSubmitReport = useCallback(async () => {
    if (!videoId || !youtubeId) return

    const trimmed = reportDescription.trim()
    if (!trimmed || reportSubmitting) return

    setReportSubmitting(true)
    setAdminSyncError(null)

    const success = await addIssue(videoId, youtubeId, reportType, trimmed)
    setReportSubmitting(false)

    if (!success) {
      return
    }

    setReportDescription('')
    setReportType('subtitle')
    setShowReportDialog(false)
    showToast('신고가 접수됐어요')
  }, [
    addIssue,
    reportDescription,
    reportSubmitting,
    reportType,
    setAdminSyncError,
    showToast,
    videoId,
    youtubeId,
  ])

  const subtitleLabel = subtitleMode === 'none' ? 'Off' : subtitleMode === 'en' ? 'En' : 'En/Ko'
  const speedLabel = playbackRate === 1 ? '1x' : `${playbackRate}x`
  const speedActive = playbackRate !== 1
  const repeatLabel = repeatMode === 'off' ? '1x' : repeatMode === 'x2' ? '2x' : '3x'
  const playbackOrderLabel = playbackOrderMode === 'shuffle' ? '랜덤' : '순차'
  const playbackSummaryLabel = `${repeatLabel} · ${playbackOrderLabel}`
  const playbackOptionsActive = repeatMode !== 'off' || playbackOrderMode !== 'sequence'
  const canSubmitReport =
    Boolean(videoId && youtubeId) && reportDescription.trim().length > 0 && !reportSubmitting

  const controlClassName = compact
    ? 'flex h-7 min-w-[28px] items-center justify-center rounded-full text-[10px] transition-colors'
    : 'flex h-8 min-w-[32px] items-center justify-center rounded-full text-[11px] transition-colors'
  const iconButtonClassName = compact
    ? 'relative flex h-7 w-7 items-center justify-center rounded-full transition-colors'
    : 'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors'
  const dividerClassName = compact ? 'h-3.5 w-px shrink-0' : 'h-4 w-px shrink-0'
  const iconSizeClassName = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const gameModeIconSizeClassName = compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'
  const repeatIconSizeClassName = compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const playbackTriggerClassName = compact
    ? 'flex h-7 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold transition-colors'
    : 'flex h-8 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold transition-colors'
  const playbackChipClassName = compact
    ? 'h-7 rounded-full px-2.5 text-[10px] font-semibold transition-colors'
    : 'h-8 rounded-full px-3 text-[11px] font-semibold transition-colors'

  const playbackPopover =
    showPlaybackOptions && playbackPosition && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            <motion.div
              ref={playbackPanelRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="fixed z-[130] rounded-3xl border p-3 shadow-2xl backdrop-blur-xl"
              style={{
                top: playbackPosition.top,
                left: playbackPosition.left,
                width: playbackPosition.width,
                backgroundColor: 'var(--player-control-bg)',
                borderColor: 'var(--player-control-border)',
              }}
              onPointerDownCapture={(event) => event.stopPropagation()}
              role="dialog"
              aria-label="재생 옵션"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--player-muted)' }}
              >
                Playback
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
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null

  const moreMenuPopover =
    showMenu && menuPosition && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuPanelRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="fixed z-[130] rounded-3xl border p-2 shadow-2xl backdrop-blur-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                backgroundColor: 'var(--player-control-bg)',
                borderColor: 'var(--player-control-border)',
              }}
              onPointerDownCapture={(event) => event.stopPropagation()}
              role="dialog"
              aria-label="더보기 메뉴"
            >
              <button
                type="button"
                onClick={async (event) => {
                  event.stopPropagation()
                  setShowMenu(false)
                  await handleShare(event)
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors"
                style={{ color: 'var(--player-text)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>공유하기</span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setAdminSyncError(null)
                  setShowMenu(false)
                  setShowReportDialog(true)
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors"
                style={{ color: 'var(--player-text)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                </svg>
                <span>이상 신고</span>
              </button>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null

  const reportDialog =
    showReportDialog && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  if (reportSubmitting) return
                  setShowReportDialog(false)
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="fixed inset-x-4 bottom-4 z-[150] mx-auto w-auto max-w-md rounded-3xl border p-5 shadow-2xl"
                style={{
                  backgroundColor: 'var(--player-control-bg)',
                  borderColor: 'var(--player-control-border)',
                }}
                onClick={(event) => event.stopPropagation()}
                onPointerDownCapture={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--player-muted)' }}
                    >
                      Report
                    </p>
                    <h3 className="mt-2 text-base font-semibold" style={{ color: 'var(--player-text)' }}>
                      현재 영상 문제 신고
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (reportSubmitting) return
                      setShowReportDialog(false)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--player-panel)', color: 'var(--player-muted)' }}
                    aria-label="신고 닫기"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>

                <div
                  className="mb-3 rounded-2xl px-3 py-2 text-[11px]"
                  style={{ backgroundColor: 'var(--player-panel)', color: 'var(--player-muted)' }}
                >
                  Video ID <span style={{ color: 'var(--player-text)' }}>{videoId ?? '-'}</span>
                </div>

                <div className="mb-3 flex gap-2">
                  {REPORT_TYPE_OPTIONS.map((option) => {
                    const active = reportType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setReportType(option.value)}
                        className="flex-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: active ? 'var(--accent-glow)' : 'var(--player-panel)',
                          color: active ? 'var(--accent-text)' : 'var(--player-muted)',
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                <textarea
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  placeholder="문제를 간단히 적어주세요"
                  rows={4}
                  className="w-full resize-none rounded-2xl border p-3 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--player-panel)',
                    borderColor: 'var(--player-control-border)',
                    color: 'var(--player-text)',
                  }}
                />

                {adminSyncError && (
                  <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {adminSyncError}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (reportSubmitting) return
                      setShowReportDialog(false)
                    }}
                    className="flex-1 rounded-2xl py-3 text-sm font-medium"
                    style={{ backgroundColor: 'var(--player-panel)', color: 'var(--player-muted)' }}
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmitReport()}
                    disabled={!canSubmitReport}
                    className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {reportSubmitting ? '접수 중...' : '신고하기'}
                  </button>
                </div>
              </motion.div>
            </>
          </AnimatePresence>,
          document.body,
        )
      : null

  return (
    <>
      <div
        className="relative inline-flex min-w-0"
        onPointerDownCapture={(event) => event.stopPropagation()}
      >
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
                const nextLiked = !liked
                toggleLike(videoId)
                if (nextLiked) {
                  showToast('Liked')
                }
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
            ref={playbackTriggerRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setShowMenu(false)
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

          <motion.button
            type="button"
            whileTap={{ scale: 0.75 }}
            onClick={(event) => {
              event.stopPropagation()
              const nextGameModeEnabled = !gameModeEnabled
              setGameModeEnabled(nextGameModeEnabled)
              showToast(nextGameModeEnabled ? 'Game On' : 'Game Off')
            }}
            className={iconButtonClassName}
            style={{ color: gameModeEnabled ? 'var(--accent-primary)' : 'var(--player-text)' }}
            aria-label={gameModeEnabled ? '게임 모드 끄기' : '게임 모드 켜기'}
            title={gameModeEnabled ? '게임 모드 ON' : '게임 모드 OFF'}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              className={gameModeIconSizeClassName}
              animate={gameModeEnabled ? { scale: [1, 1.35, 0.9, 1.1, 1] } : { scale: 1 }}
              transition={
                gameModeEnabled
                  ? { duration: 0.5, ease: 'easeOut', times: [0, 0.2, 0.4, 0.6, 1] }
                  : { duration: 0.15 }
              }
            >
              <rect x="5.25" y="5.25" width="13.5" height="13.5" rx="3.2" />
              <circle cx="9.15" cy="9.15" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="14.85" cy="9.15" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="9.15" cy="14.85" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="14.85" cy="14.85" r="1.1" fill="currentColor" stroke="none" />
            </motion.svg>

            <AnimatePresence>
              {gameModeEnabled &&
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
                    className="absolute h-1 w-1 rounded-full"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                ))}
            </AnimatePresence>
          </motion.button>

          <div className={dividerClassName} style={{ backgroundColor: 'var(--player-divider)' }} />

          <button
            ref={menuTriggerRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setShowPlaybackOptions(false)
              setShowMenu((current) => !current)
            }}
            className={iconButtonClassName}
            style={{ color: 'var(--player-text)' }}
            aria-label="더보기 메뉴"
            aria-expanded={showMenu}
            aria-haspopup="dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={iconSizeClassName}
            >
              <path d="M12 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
          </button>
        </div>
      </div>

      {playbackPopover}
      {moreMenuPopover}
      {reportDialog}
      <SaveToast show={Boolean(toastMessage)} message={toastMessage ?? ''} />
    </>
  )
}
