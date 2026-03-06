'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'

export function LevelUpModal() {
  const { level, showLevelUp, dismissLevelUp } = useUserStore()

  return (
    <AnimatePresence>
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissLevelUp}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="text-center"
          >
            <p className="text-6xl mb-4">{'\uD83C\uDF8A'}</p>
            <p className="text-white text-3xl font-bold mb-2">레벨 업!</p>
            <p className="text-yellow-400 text-5xl font-black">{level}</p>
            <p className="text-gray-400 text-sm mt-4">탭해서 계속</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
