'use client'

import { motion } from 'framer-motion'

interface GameResultProps {
  correct: boolean
  xpEarned: number
  onContinue: () => void
}

export function GameResult({ correct, xpEarned, onContinue }: GameResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onContinue}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="text-center"
      >
        {/* Clean icon instead of emoji */}
        <div className="mb-5">
          {correct ? (
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-white/40">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-white text-2xl font-bold mb-2">
          {correct ? '맞았어' : '틀렸어'}
        </p>
        {correct && xpEarned > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="text-yellow-400 font-bold text-lg"
          >
            +{xpEarned} XP
          </motion.p>
        )}
        <p className="text-gray-500 text-sm mt-6">탭해서 계속</p>
      </motion.div>
    </motion.div>
  )
}
