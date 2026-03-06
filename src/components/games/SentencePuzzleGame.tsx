'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateSentencePuzzle } from '@/lib/games/sentence-puzzle'
import { GameResult } from './GameResult'
import { useUserStore } from '@/stores/useUserStore'

interface SentencePuzzleGameProps {
  subtitle: { en: string; ko: string }
  onComplete: (correct: boolean) => void
}

export function SentencePuzzleGame({ subtitle, onComplete }: SentencePuzzleGameProps) {
  const puzzle = useMemo(() => generateSentencePuzzle(subtitle.en), [subtitle])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [availableWords, setAvailableWords] = useState(puzzle.shuffledWords)
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const gainXp = useUserStore((s) => s.gainXp)

  const isCorrect = submitted ? puzzle.checkAnswer(selectedWords) : false
  const xpEarned = isCorrect ? 15 : 0

  const handleSelectWord = (word: string, index: number) => {
    if (submitted) return
    setSelectedWords([...selectedWords, word])
    setAvailableWords(availableWords.filter((_, i) => i !== index))
  }

  const handleDeselectWord = (word: string, index: number) => {
    if (submitted) return
    setAvailableWords([...availableWords, word])
    setSelectedWords(selectedWords.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (selectedWords.length !== puzzle.correctOrder.length) return
    setSubmitted(true)
    if (puzzle.checkAnswer(selectedWords)) {
      gainXp(15)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-8">
        단어를 순서대로 배열하세요
      </p>

      <p className="text-gray-500 text-sm mb-6">{subtitle.ko}</p>

      {/* Selected words area */}
      <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[48px] border-b border-white/10 pb-4 w-full max-w-sm">
        {selectedWords.map((word, i) => (
          <motion.button
            key={`selected-${i}`}
            layout
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDeselectWord(word, i)}
            className={`px-4 py-2 rounded-lg font-medium ${
              submitted
                ? isCorrect
                  ? 'bg-green-500/80 text-white'
                  : 'bg-red-500/80 text-white'
                : 'bg-blue-500/80 text-white'
            }`}
          >
            {word}
          </motion.button>
        ))}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center mb-10 min-h-[48px] w-full max-w-sm">
        {availableWords.map((word, i) => (
          <motion.button
            key={`available-${i}`}
            layout
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectWord(word, i)}
            className="px-4 py-2 rounded-lg font-medium bg-white/10 text-white"
          >
            {word}
          </motion.button>
        ))}
      </div>

      {!submitted && selectedWords.length === puzzle.correctOrder.length && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-8 py-3 rounded-full font-medium"
        >
          확인
        </motion.button>
      )}

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
