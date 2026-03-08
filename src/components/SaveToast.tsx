'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface SaveToastProps {
  show: boolean
  message: string
}

export function SaveToast({ show, message }: SaveToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-1/2 top-12 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md"
          style={{
            backgroundColor: 'var(--player-chip-bg)',
            borderColor: 'var(--player-chip-border)',
            color: 'var(--player-text)',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
