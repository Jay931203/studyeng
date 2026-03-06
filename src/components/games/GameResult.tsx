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
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="text-6xl mb-4"
        >
          {correct ? '\uD83C\uDF89' : '\uD83D\uDCAA'}
        </motion.div>
        <p className="text-white text-2xl font-bold mb-2">
          {correct ? '정답!' : '아깝다!'}
        </p>
        {correct && xpEarned > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-yellow-400 font-bold text-lg"
          >
            +{xpEarned} XP
          </motion.p>
        )}
        <p className="text-gray-400 text-sm mt-4">탭해서 계속</p>
      </motion.div>
    </motion.div>
  )
}
