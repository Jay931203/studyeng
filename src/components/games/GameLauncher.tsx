'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FillBlankGame } from './FillBlankGame'
import { SentencePuzzleGame } from './SentencePuzzleGame'
import { SceneQuizGame } from './SceneQuizGame'
import type { SavedPhrase } from '@/stores/usePhraseStore'

type GameType = 'fill-blank' | 'sentence-puzzle' | 'scene-quiz'

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
      <div className="mb-6">
        {/* Scene Quiz - featured game */}
        <button
          onClick={() => setActiveGame('scene-quiz')}
          className="w-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-[var(--card-shadow)] rounded-xl p-4 text-left active:scale-95 transition-transform mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-400">
                <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
              </svg>
            </div>
            <div>
              <span className="text-[var(--text-primary)] font-bold text-sm">장면 퀴즈</span>
              <span className="text-[var(--text-secondary)] text-xs block mt-0.5">영상 장면을 보고 대사를 맞춰보세요</span>
            </div>
          </div>
        </button>

        {/* Other games */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveGame('fill-blank')}
            className="flex-1 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-3 text-left active:scale-95 transition-transform"
          >
            <span className="text-[var(--text-primary)] font-medium text-sm">빈칸 채우기</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-0.5">빠진 단어 맞추기</span>
          </button>
          <button
            onClick={() => setActiveGame('sentence-puzzle')}
            className="flex-1 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-3 text-left active:scale-95 transition-transform"
          >
            <span className="text-[var(--text-primary)] font-medium text-sm">문장 만들기</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-0.5">단어 조합하기</span>
          </button>
        </div>
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

            {activeGame === 'scene-quiz' && (
              <SceneQuizGame phrases={phrases} onComplete={handleComplete} />
            )}
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
