'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'studyeng-seen-tips'

export function DoubleTapTip() {
  const [visible, setVisible] = useState(false)

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

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
          <div
            className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--player-chip-bg)',
              borderColor: 'var(--player-chip-border)',
            }}
          >
            <span
              className="whitespace-nowrap text-[11px] font-medium"
              style={{ color: 'var(--player-muted)' }}
            >
              두 번 탭해서 저장 또는 해제
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
