'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GameResult } from './GameResult'
import { useGameProgressStore } from '@/stores/useGameProgressStore'

interface SceneQuizGameProps {
  subtitle: { en: string; ko: string }
  onComplete: (correct: boolean) => void
}

const COMMON_DISTRACTORS = [
  'always', 'never', 'really', 'going', 'about', 'think', 'believe',
  'around', 'before', 'after', 'under', 'every', 'could', 'would',
  'should', 'might', 'doing', 'being', 'having', 'making', 'coming',
  'getting', 'saying', 'looking', 'trying', 'asking', 'using', 'working',
  'called', 'wanted', 'needed', 'people', 'place', 'world', 'still',
  'these', 'other', 'where', 'right', 'while', 'until', 'since',
  'those', 'their', 'which', 'there', 'thing', 'whole', 'again',
  'money', 'house', 'night', 'point', 'story', 'water', 'young',
]

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

interface BlankQuestion {
  displayParts: string[]  // The sentence split around blanks, e.g. ["I ", " believe ", " said that"]
  blankedWords: string[]  // The words that were blanked out
  options: string[]       // 4 choices per blank
  correctIndex: number    // Which blank to test (we test one at a time)
}

function generateBlankQuestion(sentence: string): BlankQuestion {
  const words = sentence.split(/\s+/).filter((w) => w.length > 0)

  // Find "key words" - words that are 3+ alpha chars, not super common articles
  const skipWords = new Set(['the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'to', 'of', 'in', 'on', 'at', 'by', 'and', 'but', 'or', 'so', 'do', 'did', 'be', 'no', 'not'])
  const candidates: number[] = []
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].replace(/[^a-zA-Z']/g, '').toLowerCase()
    if (clean.length >= 3 && !skipWords.has(clean)) {
      candidates.push(i)
    }
  }

  // Pick 2-3 words to blank out (or fewer if sentence is short)
  const blankCount = Math.min(
    candidates.length,
    words.length <= 5 ? 1 : words.length <= 8 ? 2 : 3
  )
  const blankedIndices = shuffle(candidates).slice(0, blankCount).sort((a, b) => a - b)

  // If no candidates found, just blank the longest word
  if (blankedIndices.length === 0) {
    let longest = 0
    for (let i = 1; i < words.length; i++) {
      if (words[i].length > words[longest].length) longest = i
    }
    blankedIndices.push(longest)
  }

  const blankedWords = blankedIndices.map((i) => words[i])

  // Build display parts: interleave text between blanks
  const displayParts: string[] = []
  let lastEnd = 0
  for (const idx of blankedIndices) {
    displayParts.push(words.slice(lastEnd, idx).join(' '))
    lastEnd = idx + 1
  }
  displayParts.push(words.slice(lastEnd).join(' '))

  // We test ONE blank - pick randomly from blanked words
  const correctIndex = Math.floor(Math.random() * blankedWords.length)
  const correctWord = blankedWords[correctIndex].replace(/[^a-zA-Z']/g, '').toLowerCase()

  // Generate 3 distractors with similar length
  const distractors: string[] = []
  const used = new Set([correctWord])
  const pool = shuffle(COMMON_DISTRACTORS).filter(
    (w) => Math.abs(w.length - correctWord.length) <= 3
  )
  for (const w of pool) {
    if (!used.has(w.toLowerCase())) {
      distractors.push(w)
      used.add(w.toLowerCase())
    }
    if (distractors.length >= 3) break
  }
  // Pad if needed
  while (distractors.length < 3) {
    distractors.push(`word${distractors.length + 1}`)
  }

  const options = shuffle([correctWord, ...distractors])

  return { displayParts, blankedWords, options, correctIndex }
}

export function SceneQuizGame({ subtitle, onComplete }: SceneQuizGameProps) {
  const question = useMemo(() => generateBlankQuestion(subtitle.en), [subtitle])
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const addGameXP = useGameProgressStore((s) => s.addGameXP)

  const correctWord = question.blankedWords[question.correctIndex]
    .replace(/[^a-zA-Z']/g, '')
    .toLowerCase()
  const isCorrect = selected === correctWord
  const xpEarned = isCorrect ? 10 : 0

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (option === correctWord) {
      addGameXP(10)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  // Build the sentence display with blanks
  const renderSentence = () => {
    const elements: React.ReactNode[] = []
    for (let i = 0; i < question.displayParts.length; i++) {
      if (question.displayParts[i]) {
        elements.push(
          <span key={`text-${i}`} className="text-[var(--text-primary)]">
            {question.displayParts[i]}
          </span>
        )
      }
      if (i < question.blankedWords.length) {
        const isTarget = i === question.correctIndex
        const word = question.blankedWords[i]
        const cleanWord = word.replace(/[^a-zA-Z']/g, '').toLowerCase()

        if (isTarget) {
          // This is the blank the user must fill
          elements.push(
            <span
              key={`blank-${i}`}
              className={`inline-block min-w-[60px] mx-1 px-2 py-0.5 rounded-md text-center font-bold ${
                selected
                  ? isCorrect
                    ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                    : 'bg-red-500/30 text-red-300 border border-red-400/50'
                  : 'border border-dashed'
              }`}
              style={
                !selected
                  ? {
                      backgroundColor: 'var(--accent-glow)',
                      borderColor: 'rgba(var(--accent-primary-rgb), 0.35)',
                      color: 'var(--accent-text)',
                    }
                  : undefined
              }
            >
              {selected ? cleanWord : '?'}
            </span>
          )
        } else {
          // Other blanked words shown as dimmed underlines
          elements.push(
            <span
              key={`blank-${i}`}
              className="inline-block min-w-[40px] mx-1 border-b text-center"
              style={{
                borderColor: 'var(--player-divider)',
                color: 'var(--text-muted)',
              }}
            >
              {cleanWord}
            </span>
          )
        }
        // Add space after blank if needed
        if (i < question.blankedWords.length - 1 || question.displayParts[i + 1]) {
          elements.push(<span key={`space-${i}`}> </span>)
        }
      }
    }
    return elements
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="mb-8 text-xs uppercase tracking-wider text-[var(--text-muted)]">
        빈칸에 들어갈 단어는?
      </p>

      {/* Sentence with blanks */}
      <div className="text-xl font-medium text-center leading-relaxed mb-6 flex flex-wrap items-center justify-center gap-y-2">
        {renderSentence()}
      </div>

      {/* Korean translation - only shown after answering */}
      {selected && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mb-8 text-center text-sm text-[var(--text-muted)]"
        >
          {subtitle.ko}
        </motion.p>
      )}

      {!selected && <div className="mb-8" />}

      {/* 4 choices */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {question.options.map((option) => {
          let backgroundColor = 'var(--bg-card)'
          let textColor = 'var(--text-primary)'
          if (selected) {
            if (option === correctWord) {
              backgroundColor = 'rgba(34, 197, 94, 0.8)'
              textColor = '#ffffff'
            } else if (option === selected) {
              backgroundColor = 'rgba(239, 68, 68, 0.8)'
              textColor = '#ffffff'
            } else {
              backgroundColor = 'var(--bg-secondary)'
              textColor = 'var(--text-secondary)'
            }
          }

          return (
            <motion.button
              key={option}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className="rounded-xl px-4 py-3 text-center font-medium transition-colors"
              style={{ backgroundColor, color: textColor }}
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
