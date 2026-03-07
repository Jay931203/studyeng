'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FillBlankGame } from './FillBlankGame'
import { SentencePuzzleGame } from './SentencePuzzleGame'
import type { SavedPhrase } from '@/stores/usePhraseStore'

type GameType = 'fill-blank' | 'sentence-puzzle'

interface GameLauncherProps {
  phrases: SavedPhrase[]
}

export function GameLauncher({ phrases }: GameLauncherProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0)

  if (phrases.length === 0) return null

  const currentPhrase = phrases[currentPhraseIdx % phrases.length]
  const subtitle = { en: currentPhrase.en, ko: currentPhrase.ko }

  const handleComplete = () => {
    setCurrentPhraseIdx((prev) => prev + 1)
    setActiveGame(null)
  }

  return (
    <>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveGame('fill-blank')}
          className="flex-1 bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-[var(--card-shadow)] rounded-xl p-4 text-left active:scale-95 transition-transform"
        >
          <span className="text-2xl mb-2 block">{'\uD83C\uDFAF'}</span>
          <span className="text-[var(--text-primary)] font-medium text-sm">빈칸 채우기</span>
          <span className="text-[var(--text-secondary)] text-xs block mt-1">빠진 단어를 맞춰보세요</span>
        </button>
        <button
          onClick={() => setActiveGame('sentence-puzzle')}
          className="flex-1 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-[var(--card-shadow)] rounded-xl p-4 text-left active:scale-95 transition-transform"
        >
          <span className="text-2xl mb-2 block">{'\uD83D\uDD00'}</span>
          <span className="text-[var(--text-primary)] font-medium text-sm">문장 만들기</span>
          <span className="text-[var(--text-secondary)] text-xs block mt-1">단어를 조합해보세요</span>
        </button>
      </div>

      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
          >
            <button
              onClick={() => setActiveGame(null)}
              className="absolute top-4 right-4 z-50 text-white/60 bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              {'\u2715'}
            </button>

            {activeGame === 'fill-blank' && (
              <FillBlankGame subtitle={subtitle} onComplete={handleComplete} />
            )}
            {activeGame === 'sentence-puzzle' && (
              <SentencePuzzleGame subtitle={subtitle} onComplete={handleComplete} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
