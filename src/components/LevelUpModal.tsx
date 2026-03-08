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
          transition={{ duration: 0.2 }}
          onClick={dismissLevelUp}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Clean level badge instead of emoji */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-yellow-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
            <p className="text-white text-2xl font-bold mb-3">레벨 업</p>
            <p className="text-yellow-400 text-5xl font-black">{level}</p>
            <p className="text-gray-500 text-sm mt-6">탭해서 계속</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
