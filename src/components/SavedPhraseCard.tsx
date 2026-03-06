'use client'

import { motion } from 'framer-motion'
import type { SavedPhrase } from '@/stores/usePhraseStore'

interface SavedPhraseCardProps {
  phrase: SavedPhrase
  onDelete: () => void
}

export function SavedPhraseCard({ phrase, onDelete }: SavedPhraseCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4"
    >
      <p className="text-white font-medium">{phrase.en}</p>
      <p className="text-gray-400 text-sm mt-1">{phrase.ko}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-gray-500 text-xs">
          {phrase.videoTitle} &middot; reviewed {phrase.reviewCount}x
        </span>
        <button
          onClick={onDelete}
          className="text-red-400/60 text-xs hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </motion.div>
  )
}
