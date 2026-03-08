'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function joinClassNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

interface ModalShellProps {
  isOpen: boolean
  onClose: () => void
  position?: 'center' | 'bottom'
  maxWidthClassName?: string
  children: ReactNode
}

export function ModalShell({
  isOpen,
  onClose,
  position = 'center',
  maxWidthClassName = 'max-w-md',
  children,
}: ModalShellProps) {
  const center = position === 'center'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <div
            className={joinClassNames(
              'fixed inset-0 z-[210] flex px-4',
              center ? 'items-center justify-center' : 'items-end justify-center pb-0 sm:pb-6',
            )}
          >
            <motion.div
              initial={center ? { opacity: 0, scale: 0.96, y: 12 } : { opacity: 0, y: '100%' }}
              animate={center ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={center ? { opacity: 0, scale: 0.96, y: 12 } : { opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className={joinClassNames(
                'w-full border border-[var(--border-card)] bg-[var(--bg-card)] shadow-2xl',
                center
                  ? 'rounded-[32px] px-6 py-6'
                  : 'safe-area-bottom rounded-t-[32px] px-6 pb-10 pt-5 sm:rounded-[32px]',
                maxWidthClassName,
              )}
            >
              {!center && (
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--text-muted)] opacity-40" />
              )}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export function ModalHeader({
  eyebrow,
  title,
  description,
  onClose,
}: {
  eyebrow: string
  title: string
  description: string
  onClose: () => void
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      </div>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        aria-label="모달 닫기"
      >
        ×
      </button>
    </div>
  )
}

export function ModalFeatureList({
  items,
}: {
  items: string[]
}) {
  return (
    <div className="mb-5 grid gap-2 rounded-[24px] bg-[var(--bg-secondary)]/35 p-3 text-left">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl bg-black/15 px-4 py-3 text-sm text-[var(--text-primary)]"
        >
          {item}
        </div>
      ))}
    </div>
  )
}
