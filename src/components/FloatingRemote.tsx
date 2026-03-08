'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore, playRef, pauseRef } from '@/stores/usePlayerStore'

interface FloatingRemoteProps {
  onPrevVideo?: () => void
  onNextVideo?: () => void
  onToggleFreeze?: () => void
  isLandscape?: boolean
}

const COLLAPSE_DELAY = 5000
const INTRO_DELAY = 3000
const STORAGE_KEY = 'shortee-remote-intro-shown'

export function FloatingRemote({
  onPrevVideo,
  onNextVideo,
  onToggleFreeze,
  isLandscape,
}: FloatingRemoteProps) {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return false

    const shown = localStorage.getItem(STORAGE_KEY)
    if (!shown) {
      localStorage.setItem(STORAGE_KEY, '1')
      return true
    }

    return false
  })
  const collapseTimerRef = useRef<number | null>(null)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const isFrozen = freezeSubIndex !== null

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
  }, [])

  const startCollapseTimer = useCallback(
    (delay = COLLAPSE_DELAY) => {
      clearCollapseTimer()
      collapseTimerRef.current = window.setTimeout(() => {
        setExpanded(false)
      }, delay)
    },
    [clearCollapseTimer],
  )

  // Auto-collapse when expanded
  useEffect(() => {
    if (expanded) {
      startCollapseTimer(INTRO_DELAY)
    } else {
      clearCollapseTimer()
    }
    return clearCollapseTimer
  }, [expanded, startCollapseTimer, clearCollapseTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [])

  const handleButtonClick = useCallback(
    (action: () => void) => {
      action()
      startCollapseTimer()
    },
    [startCollapseTimer],
  )

  const handleExpand = useCallback(() => {
    setExpanded(true)
  }, [])

  const handleCollapse = useCallback(() => {
    clearCollapseTimer()
    setExpanded(false)
  }, [clearCollapseTimer])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseRef.current?.()
    } else {
      playRef.current?.()
    }
  }, [isPlaying])

  const positionStyle = isLandscape
    ? {
        right: 'max(12px, env(safe-area-inset-right, 0px))',
        bottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
      }
    : { right: '12px', bottom: '12px' }

  return (
    <div
      className="absolute z-20"
      style={positionStyle}
      onPointerDownCapture={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleExpand}
            className="flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--player-control-bg)',
              borderColor: 'var(--player-control-border)',
              color: 'var(--player-text)',
            }}
            aria-label="리모컨 열기"
          >
            {/* 2x2 grid dots icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <circle cx="7" cy="7" r="1.8" />
              <circle cx="13" cy="7" r="1.8" />
              <circle cx="7" cy="13" r="1.8" />
              <circle cx="13" cy="13" r="1.8" />
            </svg>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-[52px] flex-col items-center overflow-hidden rounded-[26px] border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--player-control-bg)',
              borderColor: 'var(--player-control-border)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleCollapse}
              className="flex h-9 w-full items-center justify-center"
              style={{ color: 'var(--player-muted)' }}
              aria-label="리모컨 닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>

            <div
              className="h-px w-7"
              style={{ backgroundColor: 'var(--player-divider)' }}
            />

            {/* Previous video */}
            {onPrevVideo && (
              <>
                <button
                  onClick={() => handleButtonClick(onPrevVideo)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: 'var(--player-text)' }}
                  aria-label="이전 영상"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  className="h-px w-7"
                  style={{ backgroundColor: 'var(--player-divider)' }}
                />
              </>
            )}

            {/* Play/Pause */}
            <button
              onClick={() => handleButtonClick(handlePlayPause)}
              className="flex h-11 w-11 items-center justify-center"
              style={{ color: 'var(--player-text)' }}
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                /* Pause icon: two vertical bars */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                /* Play icon: triangle pointing right */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-0.5 h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <div
              className="h-px w-7"
              style={{ backgroundColor: 'var(--player-divider)' }}
            />

            {/* Freeze toggle */}
            {onToggleFreeze && (
              <>
                <button
                  onClick={() => handleButtonClick(onToggleFreeze)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{
                    color: isFrozen
                      ? 'var(--freeze-text, var(--accent-primary))'
                      : 'var(--player-text)',
                  }}
                  aria-label={isFrozen ? '프리즈 해제' : '프리즈'}
                >
                  {isFrozen ? (
                    /* Filled snowflake */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M12 2a.75.75 0 0 1 .75.75v2.69l1.72-1.72a.75.75 0 1 1 1.06 1.06L12.75 7.56V11h3.44l2.78-2.78a.75.75 0 1 1 1.06 1.06l-1.72 1.72h2.69a.75.75 0 0 1 0 1.5h-2.69l1.72 1.72a.75.75 0 1 1-1.06 1.06L16.19 12.5H12.75v3.44l2.78 2.78a.75.75 0 1 1-1.06 1.06l-1.72-1.72v2.69a.75.75 0 0 1-1.5 0v-2.69l-1.72 1.72a.75.75 0 0 1-1.06-1.06l2.78-2.78V12.5H7.81l-2.78 2.78a.75.75 0 0 1-1.06-1.06l1.72-1.72H3a.75.75 0 0 1 0-1.5h2.69L3.97 9.28a.75.75 0 0 1 1.06-1.06L7.81 11h3.44V7.56L8.47 4.78a.75.75 0 0 1 1.06-1.06l1.72 1.72V2.75A.75.75 0 0 1 12 2Z" />
                    </svg>
                  ) : (
                    /* Outline snowflake */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2.75v18.5M12 2.75l-2.5 2.5M12 2.75l2.5 2.5M12 21.25l-2.5-2.5M12 21.25l2.5-2.5M2.75 12h18.5M2.75 12l2.5-2.5M2.75 12l2.5 2.5M21.25 12l-2.5-2.5M21.25 12l-2.5 2.5"
                      />
                    </svg>
                  )}
                </button>
                <div
                  className="h-px w-7"
                  style={{ backgroundColor: 'var(--player-divider)' }}
                />
              </>
            )}

            {/* Next video */}
            {onNextVideo && (
              <button
                onClick={() => handleButtonClick(onNextVideo)}
                className="flex h-11 w-11 items-center justify-center"
                style={{ color: 'var(--player-text)' }}
                aria-label="다음 영상"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.53 13.53a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 1.06-1.06L10 11.94l3.72-3.72a.75.75 0 0 1 1.06 1.06l-4.25 4.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}

            {/* Bottom padding when no next button */}
            {!onNextVideo && <div className="h-1" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
