'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateFillBlank } from '@/lib/games/fill-blank'
import { GameResult } from './GameResult'
import { useUserStore } from '@/stores/useUserStore'

interface FillBlankGameProps {
  subtitle: { en: string; ko: string }
  onComplete: (correct: boolean) => void
}

export function FillBlankGame({ subtitle, onComplete }: FillBlankGameProps) {
  const question = useMemo(() => generateFillBlank(subtitle), [subtitle])
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const gainXp = useUserStore((s) => s.gainXp)

  const isCorrect = selected === question.correctAnswer
  const xpEarned = isCorrect ? 10 : 0

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (option === question.correctAnswer) {
      gainXp(10)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-8">
        빈칸을 채워보세요
      </p>

      <p className="text-white text-xl font-medium text-center leading-relaxed mb-4">
        {question.sentence}
      </p>

      <p className="text-gray-500 text-sm mb-10">{question.koreanHint}</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {question.options.map((option) => {
          let bg = 'bg-white/10'
          if (selected) {
            if (option === question.correctAnswer) bg = 'bg-green-500/80'
            else if (option === selected) bg = 'bg-red-500/80'
          }

          return (
            <motion.button
              key={option}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`${bg} text-white py-3 px-4 rounded-xl text-center font-medium transition-colors`}
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      {showResult && (
        <GameResult
          correct={isCorrect}
          xpEarned={xpEarned}
          onContinue={() => onComplete(isCorrect)}
        />
      )}
    </div>
  )
}
