'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBadgeStore } from '@/stores/useBadgeStore'

/**
 * Shows a brief celebration overlay when a new badge is earned.
 * Mount once in the tabs layout. Auto-dismisses after 2.5 seconds.
 */
export function BadgeUnlock() {
  const newlyEarned = useBadgeStore((s) => s.newlyEarned)
  const dismissNewBadge = useBadgeStore((s) => s.dismissNewBadge)

  const currentBadge = newlyEarned[0] ?? null

  useEffect(() => {
    if (!currentBadge) return
    const timer = setTimeout(() => {
      dismissNewBadge()
    }, 2500)
    return () => clearTimeout(timer)
  }, [currentBadge, dismissNewBadge])

  return (
    <AnimatePresence>
      {currentBadge && (
        <motion.div
          key={currentBadge.id}
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-28 left-1/2 -translate-x-1/2 z-[95]"
          onClick={dismissNewBadge}
        >
          <div className="relative flex items-center gap-3 bg-gradient-to-r from-amber-500/95 to-yellow-500/95 backdrop-blur-sm text-white pl-4 pr-5 py-3 rounded-2xl shadow-lg shadow-amber-500/30 min-w-[240px]">
            {/* Shine effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl pointer-events-none"
            />

            {/* Badge icon with spring animation */}
            <motion.div
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
              className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white"
              >
                <path fillRule="evenodd" d={currentBadge.icon} clipRule="evenodd" />
              </svg>
            </motion.div>

            {/* Text */}
            <div>
              <motion.p
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-white/80 text-[10px] font-medium tracking-wider uppercase"
              >
                배지 획득!
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="font-bold text-sm leading-tight"
              >
                {currentBadge.name}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/70 text-xs"
              >
                {currentBadge.description}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
