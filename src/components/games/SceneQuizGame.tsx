'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SavedPhrase } from '@/stores/usePhraseStore'
import { seedVideos } from '@/data/seed-videos'

interface SceneQuizGameProps {
  phrases: SavedPhrase[]
  onComplete: () => void
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Fallback decoy pool for when user has few saved phrases
const FALLBACK_PHRASES = [
  "I can't believe you just said that",
  "That's what I'm talking about",
  "Are you kidding me right now?",
  "I've been thinking about it",
  "You have no idea what happened",
  "This is the best day ever",
  "I told you it was a bad idea",
  "What are you doing here?",
  "I'm so sorry about that",
  "Let me think about it",
  "That doesn't make any sense",
  "We need to talk about this",
  "I didn't see that coming",
  "You're not gonna believe this",
  "How did you know that?",
  "I wish I could help you",
  "It's not what it looks like",
  "Can we just move on?",
  "I've never seen anything like it",
  "That's exactly what I mean",
]

/** Generate 3 wrong choices from other phrases or fallback pool */
function generateDecoys(correctEn: string, allPhrases: SavedPhrase[]): string[] {
  const candidates = allPhrases
    .map((p) => p.en)
    .filter((en) => en !== correctEn)

  // Fill with fallback phrases if not enough
  if (candidates.length < 3) {
    for (const phrase of FALLBACK_PHRASES) {
      if (phrase !== correctEn && !candidates.includes(phrase)) {
        candidates.push(phrase)
      }
      if (candidates.length >= 10) break
    }
  }

  return shuffleArray(candidates).slice(0, 3)
}

export function SceneQuizGame({ phrases, onComplete }: SceneQuizGameProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showGameResult, setShowGameResult] = useState(false)

  const totalRounds = Math.min(phrases.length, 5)

  // Pre-generate quiz data for all rounds
  const quizData = useMemo(() => {
    const shuffled = shuffleArray(phrases).slice(0, totalRounds)
    return shuffled.map((phrase) => {
      const video = seedVideos.find((v) => v.id === phrase.videoId)
      const decoys = generateDecoys(phrase.en, phrases)
      const choices = shuffleArray([phrase.en, ...decoys])
      return { phrase, video, choices }
    })
  }, [phrases, totalRounds])

  const current = quizData[round]
  if (!current) return null

  const isCorrect = selected === current.phrase.en

  const handleSelect = useCallback(
    (choice: string) => {
      if (selected) return // Already answered
      setSelected(choice)
      if (choice === current.phrase.en) {
        setScore((s) => s + 1)
      }
      setShowResult(true)

      // Auto-advance after brief delay
      setTimeout(() => {
        if (round + 1 >= totalRounds) {
          setShowGameResult(true)
        } else {
          setRound((r) => r + 1)
          setSelected(null)
          setShowResult(false)
        }
      }, 1500)
    },
    [selected, current, round, totalRounds]
  )

  if (showGameResult) {
    const pct = Math.round((score / totalRounds) * 100)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-6xl mb-4"
        >
          {pct >= 80 ? '\uD83C\uDF89' : pct >= 50 ? '\uD83D\uDC4D' : '\uD83D\uDCAA'}
        </motion.div>
        <p className="text-white text-2xl font-bold mb-2">
          {score} / {totalRounds}
        </p>
        <p className="text-white/60 text-sm mb-8">
          {pct >= 80 ? '대단해! 거의 다 맞혔어' : pct >= 50 ? '잘했어! 계속 해보자' : '다시 도전해볼까?'}
        </p>
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium"
        >
          완료
        </button>
      </div>
    )
  }

  const youtubeId = current.video?.youtubeId

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Scene freeze-frame */}
      <div className="relative w-full aspect-video flex-shrink-0">
        {youtubeId ? (
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt="Scene"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-white/40 text-sm">No scene available</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

        {/* Round indicator */}
        <div className="absolute top-4 left-4">
          <span className="text-white/60 text-sm font-medium">
            {round + 1} / {totalRounds}
          </span>
        </div>

        {/* Score */}
        <div className="absolute top-4 right-4">
          <span className="text-white/60 text-sm font-medium">
            {score}점
          </span>
        </div>

        {/* Question overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-white/80 text-sm mb-1">이 장면에서 뭐라고 했을까?</p>
          {current.phrase.ko && (
            <p className="text-blue-300 text-xs">
              힌트: {current.phrase.ko}
            </p>
          )}
        </div>
      </div>

      {/* Choices */}
      <div className="flex-1 flex flex-col justify-center px-4 gap-3 pb-8">
        <AnimatePresence mode="wait">
          {current.choices.map((choice, i) => {
            let bgClass = 'bg-white/10'
            if (showResult) {
              if (choice === current.phrase.en) {
                bgClass = 'bg-green-500/30 border-green-400'
              } else if (choice === selected && !isCorrect) {
                bgClass = 'bg-red-500/30 border-red-400'
              } else {
                bgClass = 'bg-white/5'
              }
            }

            return (
              <motion.button
                key={`${round}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => handleSelect(choice)}
                disabled={!!selected}
                className={`w-full py-3.5 px-4 rounded-xl text-left text-white text-sm font-medium border border-white/10 transition-all active:scale-[0.98] ${bgClass}`}
              >
                <span className="text-white/40 mr-2">{String.fromCharCode(65 + i)}</span>
                {choice}
              </motion.button>
            )
          })}
        </AnimatePresence>

        {/* Feedback */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-2"
          >
            <p className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? '정답!' : '아쉽!'}
            </p>
            {!isCorrect && (
              <p className="text-white/60 text-xs mt-1">
                정답: {current.phrase.en}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
