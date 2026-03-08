'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'

/**
 * Watches for XP changes and shows a brief celebratory overlay.
 * Renders itself, so mount it once in the layout.
 */
export function XpGainToast() {
  const [xpDelta, setXpDelta] = useState<number | null>(null)

  useEffect(() => {
    let previous = {
      xp: useUserStore.getState().xp,
      level: useUserStore.getState().level,
    }

    return useUserStore.subscribe((state) => {
      const delta = state.level > previous.level ? state.xp : state.xp - previous.xp
      previous = { xp: state.xp, level: state.level }

      if (delta > 0) {
        setXpDelta(delta)
      }
    })
  }, [])

  useEffect(() => {
    if (xpDelta === null) return

    const timer = window.setTimeout(() => setXpDelta(null), 1800)
    return () => clearTimeout(timer)
  }, [xpDelta])

  return (
    <AnimatePresence>
      {xpDelta !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-20 left-1/2 z-[90] -translate-x-1/2 pointer-events-none"
        >
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent-primary)]/90 to-[var(--accent-secondary)]/90 px-5 py-2.5 text-white shadow-lg shadow-[var(--accent-primary)]/30 backdrop-blur-sm">
            <motion.span
              initial={{ rotate: -20, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white/80">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
              </svg>
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-bold"
            >
              +{xpDelta} XP
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
