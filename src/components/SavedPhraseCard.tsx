'use client'

import { motion } from 'framer-motion'
import type { SavedPhrase } from '@/stores/usePhraseStore'

interface SavedPhraseCardProps {
  phrase: SavedPhrase
  onDelete: () => void
  onPlay?: () => void
}

export function SavedPhraseCard({ phrase, onDelete, onPlay }: SavedPhraseCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="cursor-pointer rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]"
      onClick={onPlay}
    >
      <div className="min-w-0">
        <p className="font-medium leading-relaxed text-[var(--text-primary)]">{phrase.en}</p>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">{phrase.ko}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-card)] pt-3">
        <span className="text-xs text-[var(--text-muted)]">
          {phrase.videoTitle} · {phrase.reviewCount} reviews
        </span>
        <button
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="text-xs text-[var(--text-muted)] transition-colors hover:text-red-400"
        >
          DELETE
        </button>
      </div>
    </motion.div>
  )
}
