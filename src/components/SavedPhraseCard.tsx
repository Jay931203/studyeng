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
      className="bg-[var(--bg-card)] rounded-xl shadow-[var(--card-shadow)] p-4 cursor-pointer"
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
            className="flex-shrink-0 text-blue-400"
            aria-label="영상 보기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
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
