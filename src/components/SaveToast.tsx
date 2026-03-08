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
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md text-white/80 px-4 py-2 rounded-full text-xs font-medium border border-white/10"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
