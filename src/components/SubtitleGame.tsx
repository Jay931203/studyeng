'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SubtitleGameProps {
  choices: string[]
  correctIndex: number
  result: 'correct' | 'wrong' | null
  onAnswer: (choiceIndex: number) => void
  currentLine?: string | null
  className?: string
}

export function SubtitleGame({
  choices,
  correctIndex,
  result,
  onAnswer,
  currentLine,
  className,
}: SubtitleGameProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

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
        {currentLine && (
          <div
            className="mb-3 rounded-2xl border px-3 py-2 text-left"
            style={{
              backgroundColor: 'var(--player-panel)',
              borderColor: 'var(--player-control-border)',
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: 'var(--player-muted)' }}
            >
              Current Line
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: 'var(--player-text)' }}>
              {currentLine}
            </p>
          </div>
        )}

        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: 'var(--player-muted)' }}
        >
          Next Line
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
                }}
                whileTap={!answered ? { scale: 0.97 } : undefined}
                layout
              >
                <span className="line-clamp-2">{choice}</span>
              </motion.button>
            )
          })}
        </div>

        {result !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-[10px] font-semibold"
            style={{
              color: result === 'correct' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            }}
          >
            {result === 'correct' ? 'Correct!' : 'Wrong...'}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
