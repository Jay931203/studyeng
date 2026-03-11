'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Expression {
  canonical: string
  meaning_ko: string
  category: string
  cefr: string
  sentenceEn: string
  sentenceKo: string
  start?: number
  end?: number
}

interface PrimingCardProps {
  expressions: Expression[]
  onDismiss: () => void
  onPlaySegment?: (start: number, end: number) => void
  videoTitle?: string
}

const AUTO_START_COUNTDOWN_MS = 5000

const CATEGORY_LABELS: Record<string, string> = {
  phrasal_verb: '구동사',
  idiom: '관용구',
  collocation: '연어',
  fixed_expression: '표현',
  discourse_marker: '담화',
  slang: '슬랭',
  hedging: '완곡',
  exclamation: '감탄',
  filler: '필러',
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
}: {
  expr: Expression
  index: number
  onInteract?: () => void
  onPlaySegment?: (start: number, end: number) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [played, setPlayed] = useState(false)
  const cefrColor = getCefrColor(expr.cefr)
  const categoryLabel = CATEGORY_LABELS[expr.category] ?? expr.category

  return (
    <motion.div
      key={`${expr.canonical}-${index}`}
      className="cursor-pointer"
      style={{ perspective: 800 }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay: 0.1 + index * 0.08,
        type: 'spring',
        stiffness: 360,
        damping: 30,
      }}
      onClick={(e) => {
        e.stopPropagation()
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
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backfaceVisibility: 'hidden',
          }}
        >
          <p className="text-[17px] font-bold leading-snug text-white">
            {expr.canonical}
          </p>
          <p
            className="mt-1 text-[13px] leading-snug"
            style={{ color: 'rgba(255, 255, 255, 0.55)' }}
          >
            {expr.meaning_ko}
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

        <div
          className="absolute inset-0 overflow-y-auto rounded-2xl border px-5 py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.09)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--accent-text, #5eead4)' }}
          >
            Example
          </p>
          <p className="mt-2 line-clamp-3 text-[15px] font-semibold leading-snug text-white">
            {expr.sentenceEn}
          </p>
          <p
            className="mt-1.5 line-clamp-2 text-[13px] leading-snug"
            style={{ color: 'rgba(255, 255, 255, 0.55)' }}
          >
            {expr.sentenceKo}
          </p>
          {onPlaySegment && expr.start != null && expr.end != null && (
            <button
              type="button"
              className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-opacity"
              style={{
                backgroundColor: played
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
                opacity: played ? 0.5 : 1,
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (played) return
                onInteract?.()
                setPlayed(true)
                onPlaySegment(expr.start!, expr.end!)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
                style={{
                  color: played
                    ? 'rgba(255,255,255,0.4)'
                    : 'var(--accent-text, #5eead4)',
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
              <span
                className="text-[11px] font-medium"
                style={{
                  color: played
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(255,255,255,0.7)',
                }}
              >
                {played ? '재생됨' : '들어보기'}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PrimingCard({
  expressions,
  onDismiss,
  onPlaySegment,
  videoTitle,
}: PrimingCardProps) {
  const visible = expressions.length > 0
  const displayExpressions = expressions.slice(0, 3)
  const [autoStartEnabled, setAutoStartEnabled] = useState(true)
  const [remainingMs, setRemainingMs] = useState(AUTO_START_COUNTDOWN_MS)
  const countdownSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  const pauseAutoStart = useCallback(() => {
    setAutoStartEnabled(false)
  }, [])

  const toggleAutoStart = useCallback(() => {
    setAutoStartEnabled((enabled) => {
      const nextEnabled = !enabled
      if (nextEnabled) setRemainingMs(AUTO_START_COUNTDOWN_MS)
      return nextEnabled
    })
  }, [])

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[35] flex flex-col items-center justify-center"
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
            className="relative z-[1] mx-6 w-full max-w-[360px]"
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
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0 text-left">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: 'var(--accent-text, #5eead4)' }}
                >
                  Key Expressions
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
                {autoStartEnabled ? `Auto ${countdownSeconds}s` : 'Auto Off'}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {displayExpressions.map((expr, index) => (
                <ExpressionCard
                  key={`${expr.canonical}-${index}`}
                  expr={expr}
                  index={index}
                  onInteract={pauseAutoStart}
                  onPlaySegment={onPlaySegment}
                />
              ))}
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
              <span className="text-[14px] font-semibold">탭해서 보기</span>
              {autoStartEnabled && (
                <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                  <motion.span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-[10px] leading-none"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    {countdownSeconds}
                  </motion.span>
                </span>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
