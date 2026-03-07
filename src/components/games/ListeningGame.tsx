'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GameResult } from './GameResult'
import { useUserStore } from '@/stores/useUserStore'

interface ListeningGameProps {
  subtitle: { en: string; ko: string }
  allSubtitles: { en: string; ko: string }[]
  onComplete: (correct: boolean) => void
}

// Fallback decoy sentences for when not enough subtitles are available
const FALLBACK_SENTENCES = [
  "I can't believe you just said that.",
  "That's what I'm talking about!",
  "Are you kidding me right now?",
  "I've been thinking about it all day.",
  "You have no idea what happened.",
  "This is the best day ever!",
  "I told you it was a bad idea.",
  "What are you doing here?",
  "Let me think about it for a second.",
  "That doesn't make any sense.",
  "We need to talk about this.",
  "I didn't see that coming at all.",
  "You're not gonna believe this.",
  "How did you know that?",
  "I wish I could help you.",
  "It's not what it looks like.",
  "Can we just move on already?",
  "I've never seen anything like it.",
  "That's exactly what I mean.",
  "You should have told me sooner.",
]

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateDecoys(
  correctEn: string,
  currentEn: string,
  allSubtitles: { en: string }[]
): string[] {
  // Gather candidates from other subtitles (exclude both the current and next sentence)
  const candidates = allSubtitles
    .map((s) => s.en)
    .filter((en) => en !== correctEn && en !== currentEn)

  // Add fallback sentences if not enough
  if (candidates.length < 3) {
    for (const sentence of FALLBACK_SENTENCES) {
      if (sentence !== correctEn && sentence !== currentEn && !candidates.includes(sentence)) {
        candidates.push(sentence)
      }
      if (candidates.length >= 15) break
    }
  }

  return shuffle(candidates).slice(0, 3)
}

export function ListeningGame({ subtitle, allSubtitles, onComplete }: ListeningGameProps) {
  // Find current subtitle index and determine the next subtitle (the answer)
  const { currentSentence, nextSubtitle, choices } = useMemo(() => {
    const currentIndex = allSubtitles.findIndex((s) => s.en === subtitle.en)

    // If current subtitle is the last one or not found, wrap around
    let nextIdx: number
    if (currentIndex === -1 || currentIndex >= allSubtitles.length - 1) {
      nextIdx = 0
    } else {
      nextIdx = currentIndex + 1
    }

    const next = allSubtitles[nextIdx]
    const decoys = generateDecoys(next.en, subtitle.en, allSubtitles)
    const shuffledChoices = shuffle([next.en, ...decoys])

    return {
      currentSentence: subtitle.en,
      nextSubtitle: next,
      choices: shuffledChoices,
    }
  }, [subtitle, allSubtitles])

  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const gainXp = useUserStore((s) => s.gainXp)

  const isCorrect = selected === nextSubtitle.en
  const xpEarned = isCorrect ? 10 : 0

  const handleSelect = (choice: string) => {
    if (selected) return
    setSelected(choice)
    if (choice === nextSubtitle.en) {
      gainXp(10)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
        다음에 올 문장은?
      </p>

      {/* Current sentence display */}
      <div className="w-full max-w-md mb-6">
        <div className="bg-white/10 rounded-xl px-5 py-4 border border-white/10">
          <p className="text-white text-base font-medium text-center leading-relaxed">
            {currentSentence}
          </p>
          <p className="text-gray-500 text-xs text-center mt-1.5">
            {subtitle.ko}
          </p>
        </div>
        <div className="flex justify-center mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5 text-gray-500"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </div>

      {/* Korean translation of the answer shown after selection */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-center"
        >
          <p className="text-green-400/80 text-sm font-medium">
            {nextSubtitle.en}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {nextSubtitle.ko}
          </p>
        </motion.div>
      )}

      {/* 4 sentence choices */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {choices.map((choice, i) => {
          let bg = 'bg-white/10'
          let borderClass = 'border-white/10'
          if (selected) {
            if (choice === nextSubtitle.en) {
              bg = 'bg-green-500/20'
              borderClass = 'border-green-400/60'
            } else if (choice === selected && !isCorrect) {
              bg = 'bg-red-500/20'
              borderClass = 'border-red-400/60'
            } else {
              bg = 'bg-white/5'
              borderClass = 'border-white/5'
            }
          }

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(choice)}
              disabled={!!selected}
              className={`w-full py-3.5 px-4 rounded-xl text-left text-white text-sm font-medium border transition-all ${bg} ${borderClass}`}
            >
              <span className="text-white/40 mr-2 text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              {choice}
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
