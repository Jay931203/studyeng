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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4 cursor-pointer"
      onClick={onPlay}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] font-medium">{phrase.en}</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{phrase.ko}</p>
        </div>
        {onPlay && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay() }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"
            aria-label="영상 보기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[var(--text-muted)] text-xs">
          {phrase.videoTitle} &middot; {phrase.reviewCount}회 복습
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-red-400/60 text-xs hover:text-red-400"
        >
          삭제
        </button>
      </div>
    </motion.div>
  )
}
