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
  allSubtitles: { en: string }[]
): string[] {
  // Gather candidates from other subtitles
  const candidates = allSubtitles
    .map((s) => s.en)
    .filter((en) => en !== correctEn)

  // Add fallback sentences if not enough
  if (candidates.length < 3) {
    for (const sentence of FALLBACK_SENTENCES) {
      if (sentence !== correctEn && !candidates.includes(sentence)) {
        candidates.push(sentence)
      }
      if (candidates.length >= 15) break
    }
  }

  return shuffle(candidates).slice(0, 3)
}

export function ListeningGame({ subtitle, allSubtitles, onComplete }: ListeningGameProps) {
  const choices = useMemo(() => {
    const decoys = generateDecoys(subtitle.en, allSubtitles)
    return shuffle([subtitle.en, ...decoys])
  }, [subtitle, allSubtitles])

  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const gainXp = useUserStore((s) => s.gainXp)

  const isCorrect = selected === subtitle.en
  const xpEarned = isCorrect ? 10 : 0

  const handleSelect = (choice: string) => {
    if (selected) return
    setSelected(choice)
    if (choice === subtitle.en) {
      gainXp(10)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
        영상에서 들었던 문장은?
      </p>

      {/* Ear icon */}
      <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-8 h-8 text-blue-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
          />
        </svg>
      </div>

      {/* Korean translation shown after answer */}
      {selected && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-500 text-sm mb-6 text-center"
        >
          {subtitle.ko}
        </motion.p>
      )}

      {/* 4 sentence choices */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {choices.map((choice, i) => {
          let bg = 'bg-white/10'
          let borderClass = 'border-white/10'
          if (selected) {
            if (choice === subtitle.en) {
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
