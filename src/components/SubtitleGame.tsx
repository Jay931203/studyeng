'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SubtitleGameProps {
  choices: string[]
  correctIndex: number
  result: 'correct' | 'wrong' | null
  onAnswer: (choiceIndex: number) => void
  onContinue: () => void
}

export function SubtitleGame({
  choices,
  correctIndex,
  result,
  onAnswer,
  onContinue,
}: SubtitleGameProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const continueTimerRef = useRef<number | null>(null)

  const handleChoiceClick = useCallback(
    (idx: number) => {
      if (result !== null) return // Already answered
      setSelectedIndex(idx)
      onAnswer(idx)
    },
    [result, onAnswer],
  )

  // Auto-continue after answering
  useEffect(() => {
    if (result === null) return

    continueTimerRef.current = window.setTimeout(() => {
      onContinue()
    }, 1500)

    return () => {
      if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
    }
  }, [result, onContinue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-1.5 px-4 py-1"
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: 'var(--player-muted)' }}
        >
          Next Line
        </p>

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
              className="w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all active:scale-[0.98]"
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

        {result !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-semibold"
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
