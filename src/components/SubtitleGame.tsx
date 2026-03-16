'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnswerBurst } from './games/AnswerBurst'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { getLocalizedSubtitle } from '@/lib/localeUtils'

const TRANSLATIONS: Record<SupportedLocale, { correct: string; wrong: string; correctAnswer: string; currentLine: string; nextLine: string }> = {
  ko: { correct: '정답!', wrong: '오답', correctAnswer: '정답:', currentLine: '현재 대사', nextLine: '다음 대사' },
  ja: { correct: '正解!', wrong: '不正解', correctAnswer: '正解:', currentLine: '現在のセリフ', nextLine: '次のセリフ' },
  'zh-TW': { correct: '正確!', wrong: '錯誤', correctAnswer: '正確答案:', currentLine: '目前台詞', nextLine: '下一句台詞' },
  vi: { correct: 'Đúng!', wrong: 'Sai', correctAnswer: 'Đáp án:', currentLine: 'Lời thoại hiện tại', nextLine: 'Lời thoại tiếp theo' },
}

interface SubtitleSegment {
  en: string
  ko?: string
  ja?: string
  zhTW?: string
  vi?: string
}

interface SubtitleGameProps {
  choices: string[]
  correctIndex: number
  result: 'correct' | 'wrong' | null
  xpAwarded?: number
  onAnswer: (choiceIndex: number) => void
  currentLine?: string | null
  currentLineSegment?: SubtitleSegment | null
  className?: string
}

export function SubtitleGame({
  choices,
  correctIndex,
  result,
  xpAwarded = 0,
  onAnswer,
  currentLine,
  currentLineSegment,
  className,
}: SubtitleGameProps) {
  const locale = useLocaleStore((s) => s.locale)
  const t = TRANSLATIONS[locale]
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showCurrentTranslation, setShowCurrentTranslation] = useState(false)

  const handleChoiceClick = useCallback(
    (idx: number) => {
      if (result !== null) return // Already answered
      setSelectedIndex(idx)
      onAnswer(idx)
    },
    [result, onAnswer],
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full max-w-sm rounded-[28px] border px-4 py-4 shadow-2xl backdrop-blur-xl ${
          className ?? ''
        }`}
        style={{
          backgroundColor: 'var(--player-control-bg)',
          borderColor: 'var(--player-control-border)',
        }}
      >
        <AnswerBurst burstKey={`${selectedIndex ?? 'idle'}-${result ?? 'pending'}`} show={result === 'correct'} />

        {currentLine && (
          <div
            className="mb-3 rounded-2xl border px-3 py-2 text-left cursor-pointer select-none"
            style={{
              backgroundColor: 'var(--player-panel)',
              borderColor: 'var(--player-control-border)',
            }}
            onClick={() => setShowCurrentTranslation((prev) => !prev)}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: 'var(--player-muted)' }}
            >
              {t.currentLine}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: 'var(--player-text)' }}>
              {currentLine}
            </p>
            {showCurrentTranslation && currentLineSegment && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-1 line-clamp-2 text-xs"
                style={{ color: 'var(--player-muted)' }}
              >
                {getLocalizedSubtitle(currentLineSegment, locale)}
              </motion.p>
            )}
          </div>
        )}

        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: 'var(--player-muted)' }}
        >
          {t.nextLine}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {choices.map((choice, idx) => {
            const isCorrect = idx === correctIndex
            const isSelected = idx === selectedIndex
            const answered = result !== null

            let bgColor = 'var(--player-panel)'
            let borderColor = 'var(--player-control-border)'
            let textColor = 'var(--player-text)'

            if (answered && isCorrect) {
              bgColor = 'rgba(34, 197, 94, 0.15)'
              borderColor = 'rgba(34, 197, 94, 0.5)'
              textColor = 'rgb(34, 197, 94)'
            } else if (answered && isSelected && !isCorrect) {
              bgColor = 'rgba(239, 68, 68, 0.15)'
              borderColor = 'rgba(239, 68, 68, 0.5)'
              textColor = 'rgb(239, 68, 68)'
            }

            return (
              <motion.button
                key={idx}
                onClick={() => handleChoiceClick(idx)}
                disabled={answered}
                className="w-full rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: bgColor,
                  borderColor: borderColor,
                  color: textColor,
                  boxShadow:
                    answered && isCorrect
                      ? '0 0 0 1px rgba(34, 197, 94, 0.3), 0 0 28px rgba(34, 197, 94, 0.22)'
                      : undefined,
                }}
                whileTap={!answered ? { scale: 0.97 } : undefined}
                animate={
                  answered && isCorrect
                    ? {
                        scale: [1, 1.02, 1],
                        borderColor: ['rgba(34, 197, 94, 0.5)', 'rgba(74, 222, 128, 0.9)', 'rgba(34, 197, 94, 0.5)'],
                      }
                    : undefined
                }
                transition={answered && isCorrect ? { duration: 0.45 } : undefined}
                layout
              >
                <span className="line-clamp-2">{choice}</span>
              </motion.button>
            )
          })}
        </div>

        {result !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-2xl border px-3 py-2"
            style={{
              color: result === 'correct' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
              borderColor: result === 'correct' ? 'rgba(34, 197, 94, 0.24)' : 'rgba(239, 68, 68, 0.24)',
              backgroundColor: result === 'correct' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <p className="text-[11px] font-semibold">
              {result === 'correct'
                ? xpAwarded > 0
                  ? `${t.correct} +${xpAwarded} XP`
                  : t.correct
                : t.wrong}
            </p>
            {result === 'wrong' && (
              <p className="mt-1 text-[10px] font-medium text-white/78">
                {t.correctAnswer} {choices[correctIndex]}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
