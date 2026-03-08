'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'studyeng-seen-tips'

export function DoubleTapTip() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (seen) return

      // Small delay so it doesn't flash immediately on mount
      const showTimer = setTimeout(() => setVisible(true), 1500)

      return () => clearTimeout(showTimer)
    } catch {
      // localStorage not available
    }
  }, [])

  useEffect(() => {
    if (!visible) return

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      dismiss()
    }, 5000)

    return () => clearTimeout(dismissTimer)
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={dismiss}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto cursor-pointer"
        >
          <div className="bg-white/8 backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5 border border-white/6">
            <span className="text-white/50 text-[11px] font-medium whitespace-nowrap">
              두 번 탭해서 문장 저장
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
