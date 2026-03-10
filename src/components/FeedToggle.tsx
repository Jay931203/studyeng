'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import type { FeedMode } from './ShortsFeedPage'

interface FeedToggleProps {
  mode: FeedMode
  onChange: (mode: FeedMode) => void
  bottomOffset?: string
}

export function FeedToggle({ mode, onChange, bottomOffset }: FeedToggleProps) {
  const handleShortsClick = useCallback(() => {
    if (mode !== 'shorts') onChange('shorts')
  }, [mode, onChange])

  const handleSeriesClick = useCallback(() => {
    if (mode !== 'clips') onChange('clips')
  }, [mode, onChange])

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-[18] flex justify-center px-4"
      style={{
        bottom: bottomOffset ?? 'max(88px, calc(env(safe-area-inset-bottom, 0px) + 78px))',
      }}
    >
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border p-1 shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--player-control-bg)',
          borderColor: 'var(--player-control-border)',
        }}
      >
        <TogglePill
          label="Shorts"
          active={mode === 'shorts'}
          onClick={handleShortsClick}
          layoutId="feed-toggle-indicator"
        />
        <TogglePill
          label="Series"
          active={mode === 'clips'}
          onClick={handleSeriesClick}
          layoutId="feed-toggle-indicator"
        />
      </div>
    </div>
  )
}

function TogglePill({
  label,
  active,
  onClick,
  layoutId,
}: {
  label: string
  active: boolean
  onClick: () => void
  layoutId: string
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="relative min-h-[36px] min-w-[84px] select-none rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
      style={{
        color: active ? '#ffffff' : 'var(--player-muted)',
      }}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: 'var(--accent-primary)',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative z-[1]">{label}</span>
    </button>
  )
}
