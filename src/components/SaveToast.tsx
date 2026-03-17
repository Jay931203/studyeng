'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface SaveToastProps {
  show: boolean
  message: string
  placement?: 'fixed' | 'inline'
  tone?: 'default' | 'freeze' | 'muted' | 'accent' | 'saved' | 'learning'
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
          color: 'var(--accent-text)',
          glow: 'rgba(0, 0, 0, 0.28)',
        }
      : tone === 'saved'
        ? {
            backgroundColor: 'rgba(var(--accent-primary-rgb), 0.18)',
            borderColor: 'rgba(var(--accent-primary-rgb), 0.48)',
            color: 'var(--accent-text)',
            glow: 'rgba(var(--accent-primary-rgb), 0.24)',
          }
      : tone === 'accent'
        ? {
            backgroundColor: 'var(--accent-glow)',
            borderColor: 'rgba(var(--accent-primary-rgb), 0.36)',
            color: 'var(--accent-text)',
            glow: 'rgba(var(--accent-primary-rgb), 0.2)',
          }
      : tone === 'learning'
        ? {
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            borderColor: 'rgba(var(--accent-primary-rgb), 0.28)',
            color: 'var(--text-primary)',
            glow: 'rgba(var(--accent-primary-rgb), 0.18)',
          }
      : tone === 'muted'
        ? {
            backgroundColor: 'var(--player-chip-bg)',
            borderColor: 'var(--player-chip-border)',
            color: 'var(--player-muted)',
            glow: 'rgba(0, 0, 0, 0.18)',
          }
      : {
          backgroundColor: 'var(--player-chip-bg)',
          borderColor: 'var(--player-chip-border)',
          color: 'var(--player-text)',
          glow: 'rgba(0, 0, 0, 0.16)',
        }

  const showIndicator = tone !== 'default'
  const indicatorColor =
    tone === 'freeze'
      ? 'var(--accent-text)'
      : tone === 'muted'
        ? 'var(--player-muted)'
        : 'var(--accent-text)'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }}
          className={`inline-flex min-w-[176px] items-center justify-center gap-2 rounded-full border px-4 py-2 text-center text-xs font-semibold backdrop-blur-md ${
            placement === 'fixed'
              ? 'fixed left-1/2 top-12 z-50 -translate-x-1/2'
              : 'z-20'
          }`}
          style={{
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            color: palette.color,
            boxShadow: `0 10px 28px ${palette.glow}`,
          }}
        >
          {showIndicator && (
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: indicatorColor }}
            />
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
