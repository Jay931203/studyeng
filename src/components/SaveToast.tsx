'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface SaveToastProps {
  show: boolean
  message: string
  placement?: 'fixed' | 'inline'
  tone?: 'default' | 'freeze' | 'muted'
}

export function SaveToast({
  show,
  message,
  placement = 'fixed',
  tone = 'default',
}: SaveToastProps) {
  const palette =
    tone === 'freeze'
      ? {
          backgroundColor: 'var(--freeze-bg)',
          borderColor: 'var(--freeze-border)',
          color: 'var(--freeze-text)',
        }
      : tone === 'muted'
        ? {
            backgroundColor: 'var(--player-chip-bg)',
            borderColor: 'var(--player-chip-border)',
            color: 'var(--player-muted)',
          }
        : {
            backgroundColor: 'var(--player-chip-bg)',
            borderColor: 'var(--player-chip-border)',
            color: 'var(--player-text)',
          }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md ${
            placement === 'fixed'
              ? 'fixed left-1/2 top-12 z-50 -translate-x-1/2'
              : 'z-20'
          }`}
          style={palette}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
