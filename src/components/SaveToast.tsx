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
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
