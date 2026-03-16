'use client'

import { motion } from 'framer-motion'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getLocalizedSubtitle } from '@/lib/localeUtils'
import { ExpressionReplayButton } from './ExpressionReplayButton'
import type { SavedPhrase } from '@/stores/usePhraseStore'

interface SavedPhraseCardProps {
  phrase: SavedPhrase
  onDelete: () => void
  onPlay?: () => void
}

export function SavedPhraseCard({ phrase, onDelete, onPlay }: SavedPhraseCardProps) {
  const locale = useLocaleStore((s) => s.locale)
  const seriesId = getCatalogVideoById(phrase.videoId)?.seriesId
  const seriesTitle = seriesId ? getCatalogSeriesById(seriesId)?.title : null

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
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-relaxed text-[var(--text-primary)]">{phrase.en}</p>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">{getLocalizedSubtitle(phrase, locale)}</p>
        </div>
        <ExpressionReplayButton
          videoId={phrase.videoId}
          start={phrase.timestampStart}
          end={phrase.timestampEnd}
          expressionText={phrase.en}
          size="md"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border-card)] pt-3">
        <div className="min-w-0">
          {seriesTitle && (
            <p className="truncate text-xs text-[var(--text-secondary)]">{seriesTitle}</p>
          )}
          <p className="truncate text-xs text-[var(--text-muted)]">
            {phrase.videoTitle} · {phrase.reviewCount} reviews
          </p>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:text-red-400 active:scale-90"
          aria-label="Remove saved item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
