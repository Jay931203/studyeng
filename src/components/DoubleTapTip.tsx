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
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-blue-400 flex-shrink-0"
            >
              <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
            </svg>
            <span className="text-white/90 text-xs font-medium whitespace-nowrap">
              문장을 두 번 탭하면 저장!
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
