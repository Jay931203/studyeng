'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore, type IssueType } from '@/stores/useAdminStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { SaveToast } from './SaveToast'

const LOCALE_ABBREV: Record<SupportedLocale, string> = {
  ko: 'Ko', ja: 'Jp', 'zh-TW': 'Ch', vi: 'Vi',
}

const TRANSLATIONS: Record<SupportedLocale, {
  sequential: string
  shuffle: string
  shareText: string
  shareTextWithTitle: (title: string) => string
  sharedSheet: string
  linkCopied: string
  reportSubmitted: string
  repeat: string
  nextPlay: string
  share: string
  reportIssue: string
  reportTitle: string
  closeReport: string
  close: string
  submitting: string
  submit: string
  placeholder: string
  subtitleLabel: string
  videoLabel: string
  otherLabel: string
  subtitleMode: string
  playbackSpeed: string
  playbackOptions: string
  loopOff: string
  gameModeOn: string
  gameModeOff: string
  moreMenu: string
  likeOn: string
  likeOff: string
}> = {
  ko: {
    sequential: '\uC21C\uCC28',
    shuffle: '\uB79C\uB364',
    shareText: 'Shortee\uC5D0\uC11C \uC601\uC0C1 \uB2E4\uC2DC \uBCF4\uAE30',
    shareTextWithTitle: (t) => `${t} - Shortee\uC5D0\uC11C \uC601\uC0C1 \uB2E4\uC2DC \uBCF4\uAE30`,
    sharedSheet: '\uACF5\uC720 \uC2DC\uD2B8\uB97C \uC5F4\uC5C8\uC5B4\uC694',
    linkCopied: '\uB9C1\uD06C\uB97C \uBCF5\uC0AC\uD588\uC5B4\uC694',
    reportSubmitted: '\uC2E0\uACE0\uAC00 \uC811\uC218\uB410\uC5B4\uC694',
    repeat: '\uBC18\uBCF5',
    nextPlay: '\uB2E4\uC74C \uC7AC\uC0DD',
    share: '\uACF5\uC720\uD558\uAE30',
    reportIssue: '\uC774\uC0C1 \uC2E0\uACE0',
    reportTitle: '\uD604\uC7AC \uC601\uC0C1 \uBB38\uC81C \uC2E0\uACE0',
    closeReport: '\uC2E0\uACE0 \uB2EB\uAE30',
    close: '\uB2EB\uAE30',
    submitting: '\uC811\uC218 \uC911...',
    submit: '\uC2E0\uACE0\uD558\uAE30',
    placeholder: '\uBB38\uC81C\uB97C \uAC04\uB2E8\uD788 \uC801\uC5B4\uC8FC\uC138\uC694',
    subtitleLabel: '\uC790\uB9C9',
    videoLabel: '\uC601\uC0C1',
    otherLabel: '\uAE30\uD0C0',
    subtitleMode: '\uC790\uB9C9 \uBAA8\uB4DC',
    playbackSpeed: '\uC7AC\uC0DD \uC18D\uB3C4',
    playbackOptions: '\uC7AC\uC0DD \uC635\uC158',
    loopOff: '\uAD6C\uAC04 \uBC18\uBCF5 \uD574\uC81C',
    gameModeOn: '\uAC8C\uC784 \uBAA8\uB4DC \uB044\uAE30',
    gameModeOff: '\uAC8C\uC784 \uBAA8\uB4DC \uCF1C\uAE30',
    moreMenu: '\uB354\uBCF4\uAE30 \uBA54\uB274',
    likeOn: '\uC88B\uC544\uC694 \uCDE8\uC18C',
    likeOff: '\uC88B\uC544\uC694',
  },
  ja: {
    sequential: '\u9806\u756A',
    shuffle: '\u30E9\u30F3\u30C0\u30E0',
    shareText: 'Shortee\u3067\u52D5\u753B\u3092\u898B\u308B',
    shareTextWithTitle: (t) => `${t} - Shortee\u3067\u52D5\u753B\u3092\u898B\u308B`,
    sharedSheet: '\u5171\u6709\u30B7\u30FC\u30C8\u3092\u958B\u304D\u307E\u3057\u305F',
    linkCopied: '\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F',
    reportSubmitted: '\u5831\u544A\u3092\u53D7\u3051\u4ED8\u3051\u307E\u3057\u305F',
    repeat: '\u30EA\u30D4\u30FC\u30C8',
    nextPlay: '\u6B21\u306E\u518D\u751F',
    share: '\u5171\u6709',
    reportIssue: '\u554F\u984C\u3092\u5831\u544A',
    reportTitle: '\u3053\u306E\u52D5\u753B\u306E\u554F\u984C\u3092\u5831\u544A',
    closeReport: '\u5831\u544A\u3092\u9589\u3058\u308B',
    close: '\u9589\u3058\u308B',
    submitting: '\u9001\u4FE1\u4E2D...',
    submit: '\u5831\u544A\u3059\u308B',
    placeholder: '\u554F\u984C\u3092\u7C21\u5358\u306B\u8A18\u8FF0\u3057\u3066\u304F\u3060\u3055\u3044',
    subtitleLabel: '\u5B57\u5E55',
    videoLabel: '\u52D5\u753B',
    otherLabel: '\u305D\u306E\u4ED6',
    subtitleMode: '\u5B57\u5E55\u30E2\u30FC\u30C9',
    playbackSpeed: '\u518D\u751F\u901F\u5EA6',
    playbackOptions: '\u518D\u751F\u30AA\u30D7\u30B7\u30E7\u30F3',
    loopOff: '\u30EB\u30FC\u30D7\u89E3\u9664',
    gameModeOn: '\u30B2\u30FC\u30E0\u30E2\u30FC\u30C9OFF',
    gameModeOff: '\u30B2\u30FC\u30E0\u30E2\u30FC\u30C9ON',
    moreMenu: '\u30E1\u30CB\u30E5\u30FC',
    likeOn: '\u3044\u3044\u306D\u53D6\u6D88',
    likeOff: '\u3044\u3044\u306D',
  },
  'zh-TW': {
    sequential: '\u9806\u5E8F',
    shuffle: '\u96A8\u6A5F',
    shareText: '\u5728Shortee\u89C0\u770B\u5F71\u7247',
    shareTextWithTitle: (t) => `${t} - \u5728Shortee\u89C0\u770B\u5F71\u7247`,
    sharedSheet: '\u5DF2\u958B\u555F\u5206\u4EAB',
    linkCopied: '\u5DF2\u8907\u88FD\u9023\u7D50',
    reportSubmitted: '\u5DF2\u63D0\u4EA4\u6AA2\u8209',
    repeat: '\u91CD\u8907',
    nextPlay: '\u4E0B\u4E00\u500B\u64AD\u653E',
    share: '\u5206\u4EAB',
    reportIssue: '\u6AA2\u8209\u554F\u984C',
    reportTitle: '\u6AA2\u8209\u9019\u500B\u5F71\u7247\u7684\u554F\u984C',
    closeReport: '\u95DC\u9589\u6AA2\u8209',
    close: '\u95DC\u9589',
    submitting: '\u63D0\u4EA4\u4E2D...',
    submit: '\u6AA2\u8209',
    placeholder: '\u8ACB\u7C21\u8981\u63CF\u8FF0\u554F\u984C',
    subtitleLabel: '\u5B57\u5E55',
    videoLabel: '\u5F71\u7247',
    otherLabel: '\u5176\u4ED6',
    subtitleMode: '\u5B57\u5E55\u6A21\u5F0F',
    playbackSpeed: '\u64AD\u653E\u901F\u5EA6',
    playbackOptions: '\u64AD\u653E\u9078\u9805',
    loopOff: '\u53D6\u6D88\u5FAA\u74B0',
    gameModeOn: '\u95DC\u9589\u904A\u6232\u6A21\u5F0F',
    gameModeOff: '\u958B\u555F\u904A\u6232\u6A21\u5F0F',
    moreMenu: '\u66F4\u591A',
    likeOn: '\u53D6\u6D88\u559C\u6B61',
    likeOff: '\u559C\u6B61',
  },
  vi: {
    sequential: 'Tu\u1EA7n t\u1EF1',
    shuffle: 'Ng\u1EABu nhi\u00EAn',
    shareText: 'Xem video tr\u00EAn Shortee',
    shareTextWithTitle: (t) => `${t} - Xem video tr\u00EAn Shortee`,
    sharedSheet: '\u0110\u00E3 m\u1EDF chia s\u1EBB',
    linkCopied: '\u0110\u00E3 sao ch\u00E9p li\u00EAn k\u1EBFt',
    reportSubmitted: '\u0110\u00E3 g\u1EEDi b\u00E1o c\u00E1o',
    repeat: 'L\u1EB7p l\u1EA1i',
    nextPlay: 'Ph\u00E1t ti\u1EBFp',
    share: 'Chia s\u1EBB',
    reportIssue: 'B\u00E1o c\u00E1o',
    reportTitle: 'B\u00E1o c\u00E1o v\u1EA5n \u0111\u1EC1 video n\u00E0y',
    closeReport: '\u0110\u00F3ng b\u00E1o c\u00E1o',
    close: '\u0110\u00F3ng',
    submitting: '\u0110ang g\u1EEDi...',
    submit: 'G\u1EEDi b\u00E1o c\u00E1o',
    placeholder: 'M\u00F4 t\u1EA3 ng\u1EAFn g\u1ECDn v\u1EA5n \u0111\u1EC1',
    subtitleLabel: 'Ph\u1EE5 \u0111\u1EC1',
    videoLabel: 'Video',
    otherLabel: 'Kh\u00E1c',
    subtitleMode: 'Ch\u1EBF \u0111\u1ED9 ph\u1EE5 \u0111\u1EC1',
    playbackSpeed: 'T\u1ED1c \u0111\u1ED9 ph\u00E1t',
    playbackOptions: 'T\u00F9y ch\u1ECDn ph\u00E1t',
    loopOff: 'T\u1EAFt l\u1EB7p',
    gameModeOn: 'T\u1EAFt game',
    gameModeOff: 'B\u1EADt game',
    moreMenu: 'Th\u00EAm',
    likeOn: 'B\u1ECF th\u00EDch',
    likeOff: 'Th\u00EDch',
  },
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5]
const REPEAT_OPTIONS = [
  { value: 'off', label: '1x' },
  { value: 'x2', label: '2x' },
  { value: 'x3', label: '3x' },
] as const
const PLAYBACK_ORDER_OPTIONS = [
  { value: 'sequence' },
  { value: 'shuffle' },
] as const

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
  const locale = useLocaleStore((s) => s.locale)
  const t = TRANSLATIONS[locale]
  const isRainbowTheme = useThemeStore((state) => state.colorTheme === 'rainbow')
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
  const gameGradientId = `${useId().replace(/:/g, '')}-game`

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPlaybackOptions(false)
        setShowMenu(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMenu, showPlaybackOptions])

  const handleShare = useCallback(
    async (event?: MouseEvent) => {
      event?.stopPropagation()
      if (!videoId) return

      const shareUrl = `${window.location.origin}${buildShortsUrl(videoId)}`
      const shareText = videoTitle
        ? t.shareTextWithTitle(videoTitle)
        : t.shareText

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: videoTitle ?? 'Shortee',
            text: shareText,
            url: shareUrl,
          })
          showToast(t.sharedSheet)
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

      showToast(t.linkCopied)
    },
    [showToast, t, videoId, videoTitle],
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
    showToast(t.reportSubmitted)
  }, [
    addIssue,
    reportDescription,
    reportSubmitting,
    reportType,
    setAdminSyncError,
    showToast,
    t,
    videoId,
    youtubeId,
  ])

  const subtitleLabel = subtitleMode === 'none' ? 'Off' : subtitleMode === 'en' ? 'En' : `En/${LOCALE_ABBREV[locale]}`
  const speedLabel = playbackRate === 1 ? '1x' : `${playbackRate}x`
  const speedActive = playbackRate !== 1
  const repeatLabel = repeatMode === 'off' ? '1x' : repeatMode === 'x2' ? '2x' : '3x'
  const playbackOrderLabel = playbackOrderMode === 'shuffle' ? t.shuffle : t.sequential
  const playbackSummaryLabel = `${repeatLabel} · ${playbackOrderLabel}`
  const playbackOptionsActive = repeatMode !== 'off' || playbackOrderMode !== 'sequence'
  const playbackOrderBadgeLabel = playbackOrderMode === 'shuffle' ? 'R' : 'S'
  const playbackBadgeSummaryLabel = `${repeatLabel}/${playbackOrderBadgeLabel}`
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
  const gameModeIconSizeClassName = compact ? 'h-[18px] w-[18px]' : 'h-5 w-5'
  const repeatIconSizeClassName = compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const playbackTriggerClassName = compact
    ? 'relative flex h-7 w-7 items-center justify-center rounded-full transition-colors'
    : 'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors'
  const playbackChipClassName = compact
    ? 'h-7 rounded-full px-2.5 text-[10px] font-semibold transition-colors'
    : 'h-8 rounded-full px-3 text-[11px] font-semibold transition-colors'

  const popoverBackdrop =
    (showPlaybackOptions || showMenu) && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-transparent"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setShowPlaybackOptions(false)
                setShowMenu(false)
              }}
            />
          </AnimatePresence>,
          document.body,
        )
      : null

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
              aria-label={t.playbackOptions}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--player-muted)' }}
              >
                Playback
              </p>
              <div className="mt-3">
                <p className="text-[11px] font-semibold" style={{ color: 'var(--player-text)' }}>
                  {t.repeat}
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
                  {t.nextPlay}
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
                        {option.value === 'sequence' ? 'Series' : 'Random'}
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
              aria-label={t.moreMenu}
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
                <span>{t.share}</span>
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
                <span>{t.reportIssue}</span>
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
                      {t.reportTitle}
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
                    aria-label={t.closeReport}
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
                  {([
                    { value: 'subtitle' as IssueType, label: t.subtitleLabel },
                    { value: 'video' as IssueType, label: t.videoLabel },
                    { value: 'other' as IssueType, label: t.otherLabel },
                  ]).map((option) => {
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
                  placeholder={t.placeholder}
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
                    {t.close}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmitReport()}
                    disabled={!canSubmitReport}
                    className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {reportSubmitting ? t.submitting : t.submit}
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
              ? 'inline-flex min-w-max items-center gap-0 rounded-full px-1 py-0.5'
              : 'inline-flex min-w-max items-center gap-0.5 rounded-full px-1.5 py-1')
          }
          style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleSubtitleMode()
            }}
            className={`${controlClassName} ${compact ? 'px-1.5 font-semibold' : 'px-2 font-semibold'}`}
            style={{ color: 'var(--player-text)' }}
            aria-label={t.subtitleMode}
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
              aria-label={liked ? t.likeOn : t.likeOff}
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
            aria-label={t.playbackSpeed}
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
            aria-label={t.playbackOptions}
            aria-expanded={showPlaybackOptions}
            aria-haspopup="dialog"
            title={playbackBadgeSummaryLabel}
            data-playback-summary={playbackSummaryLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={repeatIconSizeClassName}
            >
              <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.903-1.903A9 9 0 003.306 9.67a.75.75 0 101.45.388zm14.49 3.882a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.903 1.903A9 9 0 0020.694 14.33a.75.75 0 10-1.45-.388z" />
            </svg>
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
              aria-label={t.loopOff}
              title={t.loopOff}
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
            style={{ color: gameModeEnabled ? 'var(--freeze-icon)' : 'var(--player-text)' }}
            aria-label={gameModeEnabled ? t.gameModeOn : t.gameModeOff}
            title={gameModeEnabled ? 'Game ON' : 'Game OFF'}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isRainbowTheme && gameModeEnabled ? `url(#${gameGradientId})` : 'currentColor'}
              strokeWidth={1.9}
              className={gameModeIconSizeClassName}
              animate={gameModeEnabled ? { scale: [1, 1.35, 0.9, 1.1, 1] } : { scale: 1 }}
              transition={
                gameModeEnabled
                  ? { duration: 0.5, ease: 'easeOut', times: [0, 0.2, 0.4, 0.6, 1] }
                  : { duration: 0.15 }
              }
            >
              {isRainbowTheme && gameModeEnabled && (
                <defs>
                  <linearGradient id={gameGradientId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ff5ac8" />
                    <stop offset="24%" stopColor="#ff9538" />
                    <stop offset="50%" stopColor="#ffd84a" />
                    <stop offset="76%" stopColor="#53d7ff" />
                    <stop offset="100%" stopColor="#7c4dff" />
                  </linearGradient>
                </defs>
              )}
              <rect x="5.25" y="5.25" width="13.5" height="13.5" rx="3.2" />
              <circle
                cx="9.15"
                cy="9.15"
                r="1.1"
                fill={isRainbowTheme && gameModeEnabled ? `url(#${gameGradientId})` : 'currentColor'}
                stroke="none"
              />
              <circle
                cx="14.85"
                cy="9.15"
                r="1.1"
                fill={isRainbowTheme && gameModeEnabled ? `url(#${gameGradientId})` : 'currentColor'}
                stroke="none"
              />
              <circle
                cx="12"
                cy="12"
                r="1.1"
                fill={isRainbowTheme && gameModeEnabled ? `url(#${gameGradientId})` : 'currentColor'}
                stroke="none"
              />
              <circle
                cx="9.15"
                cy="14.85"
                r="1.1"
                fill={isRainbowTheme && gameModeEnabled ? `url(#${gameGradientId})` : 'currentColor'}
                stroke="none"
              />
              <circle
                cx="14.85"
                cy="14.85"
                r="1.1"
                fill={isRainbowTheme && gameModeEnabled ? `url(#${gameGradientId})` : 'currentColor'}
                stroke="none"
              />
            </motion.svg>

            <AnimatePresence>
              {gameModeEnabled &&
                [0, 60, 120, 180, 240, 300].map((angle, index) => (
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
                    style={{
                      backgroundColor: isRainbowTheme
                        ? ['#ff5ac8', '#ff9538', '#ffd84a', '#53d7ff', '#7c4dff', '#ff5ac8'][index]
                        : 'var(--freeze-icon)',
                    }}
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
            aria-label={t.moreMenu}
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

      {popoverBackdrop}
      {playbackPopover}
      {moreMenuPopover}
      {reportDialog}
      <SaveToast show={Boolean(toastMessage)} message={toastMessage ?? ''} />
    </>
  )
}
