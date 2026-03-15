'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getLocalizedMeaning } from '@/lib/localeUtils'
import { triggerHaptic } from '@/lib/haptic'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

interface Expression {
  canonical: string
  meaning_ko: string
  meaning_ja?: string
  category: string
  cefr: string
  sentenceEn: string
  sentenceKo: string
  sentenceJa?: string
  start?: number
  end?: number
  exprId?: string
}

interface WordItem {
  wordId: string
  canonical: string
  meaning_ko: string
  meaning_ja?: string
  pos: string
  cefr: string
  sentenceEn: string
  sentenceKo: string
  sentenceJa?: string
  surfaceForm?: string
  start?: number
  end?: number
}

interface PrimingCardProps {
  expressions: Expression[]
  words?: WordItem[]
  onDismiss: () => void
  onPlaySegment?: (start: number, end: number) => void
  videoTitle?: string
  onMarkFamiliar?: (exprId: string) => void
  familiarCounts?: Record<string, number>
}

const AUTO_START_COUNTDOWN_MS = 5000
const SWIPE_THRESHOLD = 56

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  ko: {
    phrasal_verb: '구동사',
    idiom: '관용구',
    collocation: '연어',
    fixed_expression: '표현',
    discourse_marker: '담화',
    slang: '슬랭',
    hedging: '완곡',
    exclamation: '감탄',
    filler: '필러',
  },
  ja: {
    phrasal_verb: '句動詞',
    idiom: '慣用句',
    collocation: '連語',
    fixed_expression: '表現',
    discourse_marker: '談話',
    slang: 'スラング',
    hedging: '婉曲',
    exclamation: '感嘆',
    filler: 'フィラー',
  },
}

function getCefrColor(cefr: string): { bg: string; text: string } {
  const level = cefr.toUpperCase()
  if (level === 'A1' || level === 'A2') {
    return { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' }
  }
  if (level === 'B1' || level === 'B2') {
    return { bg: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa' }
  }
  if (level === 'C1' || level === 'C2') {
    return { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc' }
  }
  return { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(255, 255, 255, 0.6)' }
}

function ExpressionCard({
  expr,
  index,
  onInteract,
  onPlaySegment,
  onSwipeDismiss,
  familiarCount,
}: {
  expr: Expression
  index: number
  onInteract?: () => void
  onPlaySegment?: (start: number, end: number) => void
  onSwipeDismiss?: () => void
  familiarCount?: number
}) {
  const locale = useLocaleStore((s) => s.locale)
  const langKey = locale === 'ja' ? 'ja' : 'ko'
  const [flipped, setFlipped] = useState(false)
  const [playing, setPlaying] = useState(false)
  const didDragRef = useRef(false)
  const cefrColor = getCefrColor(expr.cefr)
  const categoryLabel = CATEGORY_LABELS[langKey]?.[expr.category] ?? expr.category

  const count = familiarCount ?? 0

  // Swipe gesture — purely horizontal, no rotation
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2], [0.3, 1, 0.3])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > 420) {
      onSwipeDismiss?.()
    }
  }

  return (
    <motion.div
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0, height: 0, marginBottom: 0 }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 30 },
        delay: 0.1 + index * 0.08,
        type: 'spring',
        stiffness: 360,
        damping: 30,
      }}
    >
      <motion.div
        className="cursor-pointer"
        style={{
          perspective: 800,
          x,
          opacity,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        drag="x"
        dragDirectionLock
        dragPropagation={false}
        dragSnapToOrigin
        dragElastic={0.6}
        dragMomentum={false}
        onDragStart={() => {
          didDragRef.current = true
          onInteract?.()
        }}
        onDragEnd={(_, info) => {
          handleDragEnd(_, info)
          window.setTimeout(() => {
            didDragRef.current = false
          }, 0)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
        onMouseDownCapture={(event) => event.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          if (didDragRef.current) {
            didDragRef.current = false
            return
          }
          onInteract?.()
          setFlipped((current) => !current)
        }}
      >
        <motion.div
          className="relative min-h-[120px]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          {/* Front face */}
          <div
            className="relative rounded-2xl border px-5 py-4"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Familiarity gauge — top right */}
            <div className="absolute right-4 top-4 flex items-center gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-[5px] w-[5px] rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: i < count
                      ? 'var(--accent-text, #5eead4)'
                      : 'rgba(255, 255, 255, 0.25)',
                  }}
                />
              ))}
            </div>
            <p className="pr-12 text-[17px] font-bold leading-snug text-white">
              {expr.canonical}
            </p>
            <p
              className="mt-1 text-[13px] leading-snug"
              style={{ color: 'rgba(255, 255, 255, 0.55)' }}
            >
              {getLocalizedMeaning(expr, locale)}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span
                className="rounded-full px-2 py-[3px] text-[10px] font-semibold leading-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {categoryLabel}
              </span>
              <span
                className="rounded-full px-2 py-[3px] text-[10px] font-bold leading-none uppercase"
                style={{
                  backgroundColor: cefrColor.bg,
                  color: cefrColor.text,
                }}
              >
                {expr.cefr.toUpperCase()}
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                tap
              </span>
            </div>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 overflow-y-auto rounded-2xl border px-5 py-4"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
            }}
          >
            <p className="line-clamp-3 pr-10 text-[15px] font-semibold leading-snug text-white">
              {expr.sentenceEn}
            </p>
            <p
              className="mt-1.5 line-clamp-2 text-[13px] leading-snug"
              style={{ color: 'rgba(255, 255, 255, 0.55)' }}
            >
              {(locale === 'ja' && expr.sentenceJa) ? expr.sentenceJa : expr.sentenceKo}
            </p>
            <button
              type="button"
              disabled={!onPlaySegment || expr.start == null || expr.end == null}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                backgroundColor: playing
                  ? 'rgba(var(--accent-primary-rgb), 0.25)'
                  : 'rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (!onPlaySegment || expr.start == null || expr.end == null) return
                onInteract?.()
                setPlaying(true)
                onPlaySegment(expr.start, expr.end)
                const duration = ((expr.end - expr.start) * 1000) + 300
                setTimeout(() => setPlaying(false), duration)
              }}
              aria-label="Play preview"
              title={!onPlaySegment || expr.start == null || expr.end == null ? 'Preview unavailable' : 'Play preview'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5"
                style={{
                  color: playing
                    ? 'var(--accent-text, #5eead4)'
                    : 'rgba(255,255,255,0.7)',
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span
              className="absolute bottom-3 right-4 text-[10px]"
              style={{ color: 'rgba(255, 255, 255, 0.25)' }}
            >
              already know? swipe
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const POS_LABELS: Record<string, Record<string, string>> = {
  ko: {
    noun: '명사',
    verb: '동사',
    adj: '형용사',
    adv: '부사',
    prep: '전치사',
    conj: 'conj',
    det: 'det',
    pron: '대명사',
    intj: 'intj',
    adjective: '형용사',
    adverb: '부사',
    preposition: '전치사',
    pronoun: '대명사',
  },
  ja: {
    noun: '名詞',
    verb: '動詞',
    adj: '形容詞',
    adv: '副詞',
    prep: '前置詞',
    conj: 'conj',
    det: 'det',
    pron: '代名詞',
    intj: 'intj',
    adjective: '形容詞',
    adverb: '副詞',
    preposition: '前置詞',
    pronoun: '代名詞',
  },
}

function WordCard({
  word,
  index,
  onInteract,
  onPlaySegment,
  onSwipeDismiss,
  familiarCount,
}: {
  word: WordItem
  index: number
  onInteract?: () => void
  onPlaySegment?: (start: number, end: number) => void
  onSwipeDismiss?: () => void
  familiarCount?: number
}) {
  const locale = useLocaleStore((s) => s.locale)
  const langKey = locale === 'ja' ? 'ja' : 'ko'
  const [flipped, setFlipped] = useState(false)
  const [playing, setPlaying] = useState(false)
  const didDragRef = useRef(false)
  const cefrColor = getCefrColor(word.cefr)
  const posLabel = POS_LABELS[langKey]?.[word.pos] ?? word.pos
  const count = familiarCount ?? 0

  const x = useMotionValue(0)
  const opacity = useTransform(x, [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2], [0.3, 1, 0.3])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > 420) {
      onSwipeDismiss?.()
    }
  }

  return (
    <motion.div
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0, height: 0, marginBottom: 0 }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 30 },
        delay: 0.1 + index * 0.08,
        type: 'spring',
        stiffness: 360,
        damping: 30,
      }}
    >
      <motion.div
        className="cursor-pointer"
        style={{
          perspective: 800,
          x,
          opacity,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        drag="x"
        dragDirectionLock
        dragPropagation={false}
        dragSnapToOrigin
        dragElastic={0.6}
        dragMomentum={false}
        onDragStart={() => {
          didDragRef.current = true
          onInteract?.()
        }}
        onDragEnd={(_, info) => {
          handleDragEnd(_, info)
          window.setTimeout(() => {
            didDragRef.current = false
          }, 0)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
        onMouseDownCapture={(event) => event.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          if (didDragRef.current) {
            didDragRef.current = false
            return
          }
          onInteract?.()
          setFlipped((current) => !current)
        }}
      >
        <motion.div
          className="relative min-h-[96px]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          {/* Front face */}
          <div
            className="relative rounded-2xl border px-5 py-3.5"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.07)',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Familiarity gauge */}
            <div className="absolute right-4 top-3.5 flex items-center gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-[5px] w-[5px] rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: i < count
                      ? 'var(--accent-text, #5eead4)'
                      : 'rgba(255, 255, 255, 0.25)',
                  }}
                />
              ))}
            </div>
            <p className="pr-12 text-[16px] font-bold leading-snug text-white">
              {word.canonical}
            </p>
            <p
              className="mt-0.5 text-[13px] leading-snug"
              style={{ color: 'rgba(255, 255, 255, 0.55)' }}
            >
              {getLocalizedMeaning(word, locale)}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className="rounded-full px-2 py-[3px] text-[10px] font-semibold leading-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {posLabel}
              </span>
              <span
                className="rounded-full px-2 py-[3px] text-[10px] font-bold leading-none uppercase"
                style={{
                  backgroundColor: cefrColor.bg,
                  color: cefrColor.text,
                }}
              >
                {word.cefr.toUpperCase()}
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                tap
              </span>
            </div>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 overflow-y-auto rounded-2xl border px-5 py-3.5"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
            }}
          >
            <p className="line-clamp-3 pr-10 text-[15px] font-semibold leading-snug text-white">
              {word.sentenceEn}
            </p>
            <p
              className="mt-1.5 line-clamp-2 text-[13px] leading-snug"
              style={{ color: 'rgba(255, 255, 255, 0.55)' }}
            >
              {(locale === 'ja' && word.sentenceJa) ? word.sentenceJa : word.sentenceKo}
            </p>
            <button
              type="button"
              disabled={!onPlaySegment || word.start == null || word.end == null}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                backgroundColor: playing
                  ? 'rgba(var(--accent-primary-rgb), 0.25)'
                  : 'rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (!onPlaySegment || word.start == null || word.end == null) return
                onInteract?.()
                setPlaying(true)
                onPlaySegment(word.start, word.end)
                const duration = ((word.end - word.start) * 1000) + 300
                setTimeout(() => setPlaying(false), duration)
              }}
              aria-label="Play preview"
              title={!onPlaySegment || word.start == null || word.end == null ? 'Preview unavailable' : 'Play preview'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5"
                style={{
                  color: playing
                    ? 'var(--accent-text, #5eead4)'
                    : 'rgba(255,255,255,0.7)',
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span
              className="absolute bottom-3 right-4 text-[10px]"
              style={{ color: 'rgba(255, 255, 255, 0.25)' }}
            >
              already know? swipe
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

type MixedItem =
  | { type: 'expression'; data: Expression }
  | { type: 'word'; data: WordItem }

function buildMixedItems(expressions: Expression[], words: WordItem[], max: number): MixedItem[] {
  const items: MixedItem[] = []
  let ei = 0
  let wi = 0
  // Interleave: expression first, then alternate
  while (items.length < max && (ei < expressions.length || wi < words.length)) {
    if (ei < expressions.length && (items.length % 2 === 0 || wi >= words.length)) {
      items.push({ type: 'expression', data: expressions[ei++] })
    } else if (wi < words.length) {
      items.push({ type: 'word', data: words[wi++] })
    }
  }
  return items
}

export function PrimingCard({
  expressions,
  words,
  onDismiss,
  onPlaySegment,
  videoTitle,
  onMarkFamiliar,
  familiarCounts,
}: PrimingCardProps) {
  const locale = useLocaleStore((s) => s.locale)
  const guideHintsEnabled = useSettingsStore((state) => state.subtitleGuidesEnabled)
  const mixedItems = buildMixedItems(expressions, words ?? [], 3)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const visibleItems = mixedItems.filter((item) => {
    const id = item.type === 'expression'
      ? (item.data as Expression).exprId || (item.data as Expression).canonical
      : (item.data as WordItem).wordId
    return !dismissedIds.has(id)
  })
  const visible = visibleItems.length > 0

  const storedAutoStartEnabled = useSettingsStore((state) => state.primingAutoStartEnabled)
  const setStoredAutoStartEnabled = useSettingsStore((state) => state.setPrimingAutoStartEnabled)
  const [autoStartEnabled, setAutoStartEnabled] = useState(storedAutoStartEnabled)
  const [remainingMs, setRemainingMs] = useState(AUTO_START_COUNTDOWN_MS)
  const countdownSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  // Auto-dismiss when all cards are swiped
  useEffect(() => {
    if (dismissedIds.size > 0 && visibleItems.length === 0) {
      const timer = setTimeout(() => handleDismiss(), 300)
      return () => clearTimeout(timer)
    }
  }, [dismissedIds.size, visibleItems.length, handleDismiss])

  const pauseAutoStart = useCallback(() => {
    setAutoStartEnabled(false)
  }, [])

  const toggleAutoStart = useCallback(() => {
    setAutoStartEnabled((enabled) => {
      const nextEnabled = !enabled
      setStoredAutoStartEnabled(nextEnabled)
      if (nextEnabled) setRemainingMs(AUTO_START_COUNTDOWN_MS)
      return nextEnabled
    })
  }, [setStoredAutoStartEnabled])

  useEffect(() => {
    if (!visible || !autoStartEnabled) return
    if (remainingMs <= 0) {
      handleDismiss()
      return
    }

    const timer = window.setInterval(() => {
      setRemainingMs((current) => Math.max(0, current - 100))
    }, 100)

    return () => window.clearInterval(timer)
  }, [autoStartEnabled, handleDismiss, remainingMs, visible])

  const handlePreviewSegment = useCallback(
    (start: number, end: number) => {
      onPlaySegment?.(start, end)
    },
    [onPlaySegment],
  )

  const handleSwipeDismiss = useCallback(
    (expr: Expression) => {
      const exprId = expr.exprId || expr.canonical
      triggerHaptic([30, 20, 40])
      setDismissedIds((prev) => new Set([...prev, exprId]))
      onMarkFamiliar?.(exprId)
      trackEvent(AnalyticsEvents.EXPRESSION_FAMILIAR, { expression: expr.canonical })
      // Pause auto start when user interacts
      setAutoStartEnabled(false)
    },
    [onMarkFamiliar],
  )

  const handleWordSwipeDismiss = useCallback(
    (word: WordItem) => {
      triggerHaptic([30, 20, 40])
      setDismissedIds((prev) => new Set([...prev, word.wordId]))
      onMarkFamiliar?.(word.wordId)
      trackEvent(AnalyticsEvents.EXPRESSION_FAMILIAR, { expression: word.canonical })
      setAutoStartEnabled(false)
    },
    [onMarkFamiliar],
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[35] grid place-items-center overflow-y-auto px-6"
          style={{
            paddingTop: 'max(24px, calc(env(safe-area-inset-top, 0px) + 16px))',
            paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
          role="dialog"
          aria-label="Key expressions preview"
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            className="relative z-[1] w-full max-w-[360px]"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 28,
              mass: 0.8,
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onPointerCancel={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0 text-left">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: 'var(--accent-text, #5eead4)' }}
                >
                  Key Picks
                </p>
                {videoTitle && (
                  <p
                    className="mt-1.5 truncate text-[13px] font-medium"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {videoTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleAutoStart()
                }}
                className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors"
                style={{
                  borderColor: autoStartEnabled
                    ? 'rgba(var(--accent-primary-rgb), 0.36)'
                    : 'rgba(255, 255, 255, 0.12)',
                  backgroundColor: autoStartEnabled
                    ? 'var(--accent-glow)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: autoStartEnabled
                    ? 'var(--accent-text)'
                    : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {autoStartEnabled ? 'AUTO ON' : 'AUTO OFF'}
              </button>
            </div>

            <div
              className="flex flex-col gap-3 overflow-visible pr-1"
              style={{ maxHeight: 'min(60vh, 480px)' }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onPointerCancel={(event) => event.stopPropagation()}
            >
              <AnimatePresence mode="popLayout">
                {visibleItems.map((item, index) => {
                  if (item.type === 'expression') {
                    const expr = item.data as Expression
                    const id = expr.exprId || expr.canonical
                    return (
                      <ExpressionCard
                        key={id}
                        expr={expr}
                        index={index}
                      onInteract={pauseAutoStart}
                      onPlaySegment={handlePreviewSegment}
                      onSwipeDismiss={() => handleSwipeDismiss(expr)}
                      familiarCount={(familiarCounts?.[id] ?? 0) + (dismissedIds.has(id) ? 1 : 0)}
                    />
                  )
                }
                  const word = item.data as WordItem
                  return (
                    <WordCard
                      key={word.wordId}
                      word={word}
                      index={index}
                      onInteract={pauseAutoStart}
                      onPlaySegment={handlePreviewSegment}
                      onSwipeDismiss={() => handleWordSwipeDismiss(word)}
                      familiarCount={(familiarCounts?.[word.wordId] ?? 0) + (dismissedIds.has(word.wordId) ? 1 : 0)}
                    />
                  )
                })}
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              onClick={handleDismiss}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--accent-primary)] py-3.5 text-white shadow-lg shadow-[var(--accent-glow)] transition-colors"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[14px] font-semibold">
                {visibleItems.length < mixedItems.length
                  ? `${visibleItems.length}/${mixedItems.length} remaining`
                  : locale === 'ja' ? 'タップして見る' : '탭해서 보기'}
              </span>
              {autoStartEnabled && (
                <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                  <span className="relative inline-flex h-5 w-5 items-center justify-center text-[10px] leading-none">
                    <span className="absolute inset-0 rounded-full border border-white/20" />
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/95 border-r-white/55"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="relative">{countdownSeconds}</span>
                  </span>
                </span>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
