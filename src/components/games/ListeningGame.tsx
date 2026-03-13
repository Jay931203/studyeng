'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GameResult } from './GameResult'
import { useGameProgressStore } from '@/stores/useGameProgressStore'

interface ListeningGameProps {
  currentSubtitle: { en: string; ko: string }
  nextSubtitle: { en: string; ko: string }
  choicePool: { en: string; ko: string }[]
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

export function ListeningGame({
  currentSubtitle,
  nextSubtitle,
  choicePool,
  onComplete,
}: ListeningGameProps) {
  const { currentSentence, choices } = useMemo(() => {
    const decoys = generateDecoys(nextSubtitle.en, currentSubtitle.en, choicePool)
    const shuffledChoices = shuffle([nextSubtitle.en, ...decoys])

    return {
      currentSentence: currentSubtitle.en,
      choices: shuffledChoices,
    }
  }, [choicePool, currentSubtitle.en, nextSubtitle.en])

  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const addGameXP = useGameProgressStore((s) => s.addGameXP)

  const isCorrect = selected === nextSubtitle.en
  const xpEarned = isCorrect ? 10 : 0

  const handleSelect = (choice: string) => {
    if (selected) return
    setSelected(choice)
    if (choice === nextSubtitle.en) {
      addGameXP(10)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="mb-3 text-xs uppercase tracking-wider text-[var(--text-muted)]">
        다음에 올 대사는?
      </p>

      {/* Current sentence display */}
      <div className="w-full max-w-md mb-6">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-4 shadow-[var(--card-shadow)]">
          <p className="text-center text-base font-medium leading-relaxed text-[var(--text-primary)]">
            {currentSentence}
          </p>
          <p className="mt-1.5 text-center text-xs text-[var(--text-muted)]">
            {currentSubtitle.ko}
          </p>
        </div>
        <div className="flex justify-center mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4 text-[var(--accent-text)]"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </div>

      {/* Korean translation of the answer shown after selection */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mb-4 text-center"
        >
          <p className="text-green-400/80 text-sm font-medium">
            {nextSubtitle.en}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {nextSubtitle.ko}
          </p>
        </motion.div>
      )}

      {/* 4 sentence choices */}
      <div className="flex flex-col gap-2.5 w-full max-w-md">
        {choices.map((choice, i) => {
          let backgroundColor = 'var(--bg-card)'
          let borderColor = 'var(--border-card)'
          let textColor = 'var(--text-primary)'
          if (selected) {
            if (choice === nextSubtitle.en) {
              backgroundColor = 'rgba(34, 197, 94, 0.15)'
              borderColor = 'rgba(74, 222, 128, 0.4)'
              textColor = '#ffffff'
            } else if (choice === selected && !isCorrect) {
              backgroundColor = 'rgba(239, 68, 68, 0.15)'
              borderColor = 'rgba(248, 113, 113, 0.4)'
              textColor = '#ffffff'
            } else {
              backgroundColor = 'var(--bg-secondary)'
              borderColor = 'var(--border-card)'
              textColor = 'var(--text-secondary)'
            }
          }

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2, ease: 'easeOut' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(choice)}
              disabled={!!selected}
              className="w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all"
              style={{ backgroundColor, borderColor, color: textColor }}
            >
              <span className="mr-2 text-xs font-bold text-[var(--text-muted)]">
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
