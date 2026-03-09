'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { usePlayerStore, pauseRef, playRef } from '@/stores/usePlayerStore'

interface FloatingRemoteProps {
  onPrevVideo?: () => void
  onNextVideo?: () => void
  onToggleFreeze?: () => void
}

const STORAGE_KEY = 'shortee-remote-intro-shown'
const POSITION_STORAGE_KEY = 'shortee-remote-position'
const EDGE_MARGIN = 12
const DRAG_THRESHOLD = 6

interface RemoteOffset {
  x: number
  y: number
}

interface DragState {
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

function readStoredOffset(): RemoteOffset {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  const stored = window.localStorage.getItem(POSITION_STORAGE_KEY)
  if (!stored) {
    return { x: 0, y: 0 }
  }

  try {
    const parsed = JSON.parse(stored) as Partial<RemoteOffset>
    return {
      x: Number.isFinite(parsed.x) ? parsed.x ?? 0 : 0,
      y: Number.isFinite(parsed.y) ? parsed.y ?? 0 : 0,
    }
  } catch {
    return { x: 0, y: 0 }
  }
}

function clampOffset(offset: RemoteOffset, width: number, height: number): RemoteOffset {
  if (typeof window === 'undefined') {
    return offset
  }

  const minX = Math.min(0, -(window.innerWidth - width - EDGE_MARGIN * 2))
  const minY = Math.min(0, -(window.innerHeight - height - EDGE_MARGIN * 2))

  return {
    x: Math.max(minX, Math.min(0, offset.x)),
    y: Math.max(minY, Math.min(0, offset.y)),
  }
}

export function FloatingRemote({
  onPrevVideo,
  onNextVideo,
  onToggleFreeze,
}: FloatingRemoteProps) {
  const remoteRef = useRef<HTMLDivElement | null>(null)
  const dragResetTimerRef = useRef<number | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return false

    const shown = localStorage.getItem(STORAGE_KEY)
    if (!shown) {
      localStorage.setItem(STORAGE_KEY, '1')
      return true
    }

    return false
  })
  const [dragBlocked, setDragBlocked] = useState(false)
  const [remoteOffset, setRemoteOffset] = useState<RemoteOffset>(() => readStoredOffset())
  const remoteEnabled = useSettingsStore((state) => state.remoteEnabled)

  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const activeSubIndex = usePlayerStore((state) => state.activeSubIndex)
  const freezeSubIndex = usePlayerStore((state) => state.freezeSubIndex)
  const isFrozen = freezeSubIndex !== null
  const canEnableFreeze = activeSubIndex >= 0

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(remoteOffset))
  }, [remoteOffset])

  useEffect(() => {
    const clampToViewport = () => {
      const rect = remoteRef.current?.getBoundingClientRect()
      if (!rect) return

      setRemoteOffset((current) => {
        const next = clampOffset(current, rect.width, rect.height)
        return next.x === current.x && next.y === current.y ? current : next
      })
    }

    const frame = window.requestAnimationFrame(clampToViewport)
    window.addEventListener('resize', clampToViewport)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', clampToViewport)
    }
  }, [expanded])

  useEffect(() => {
    return () => {
      if (dragResetTimerRef.current) {
        window.clearTimeout(dragResetTimerRef.current)
      }
    }
  }, [])

  const handleButtonClick = useCallback(
    (action: () => void) => {
      if (dragBlocked) return
      action()
    },
    [dragBlocked],
  )

  const handleExpand = useCallback(() => {
    if (dragBlocked) return
    setExpanded(true)
  }, [dragBlocked])

  const handleCollapse = useCallback(() => {
    if (dragBlocked) return
    setExpanded(false)
  }, [dragBlocked])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseRef.current?.()
      setIsPlaying(false)
    } else {
      playRef.current?.()
      setIsPlaying(true)
    }
  }, [isPlaying, setIsPlaying])

  const finishDragBlock = useCallback(() => {
    if (dragResetTimerRef.current) {
      window.clearTimeout(dragResetTimerRef.current)
    }

    dragResetTimerRef.current = window.setTimeout(() => {
      setDragBlocked(false)
      dragResetTimerRef.current = null
    }, 140)
  }, [])

  const endDrag = useCallback(() => {
    const dragState = dragStateRef.current
    dragStateRef.current = null

    if (!dragState?.moved) {
      return
    }

    finishDragBlock()
  }, [finishDragBlock])

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      const dragState = dragStateRef.current
      const rect = remoteRef.current?.getBoundingClientRect()
      if (!dragState || !rect) return

      const deltaX = clientX - dragState.startX
      const deltaY = clientY - dragState.startY
      const moved = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD

      if (moved && !dragState.moved) {
        dragState.moved = true
      }

      if (!dragState.moved) {
        return
      }

      setRemoteOffset(
        clampOffset(
          {
            x: dragState.originX + deltaX,
            y: dragState.originY + deltaY,
          },
          rect.width,
          rect.height,
        ),
      )
    }

    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX, event.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      event.preventDefault()
      handleMove(touch.clientX, touch.clientY)
    }

    const handleEnd = () => {
      endDrag()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('touchcancel', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('touchcancel', handleEnd)
    }
  }, [endDrag])

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    if (dragResetTimerRef.current) {
      window.clearTimeout(dragResetTimerRef.current)
      dragResetTimerRef.current = null
    }

    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      originX: remoteOffset.x,
      originY: remoteOffset.y,
      moved: false,
    }

    setDragBlocked(false)
  }, [remoteOffset.x, remoteOffset.y])

  const handleDragMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.stopPropagation()
      beginDrag(event.clientX, event.clientY)
    },
    [beginDrag],
  )

  const handleDragTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      const touch = event.touches[0]
      if (!touch) return
      event.stopPropagation()
      beginDrag(touch.clientX, touch.clientY)
    },
    [beginDrag],
  )

  const positionStyle = {
    right: 'max(12px, calc(env(safe-area-inset-right, 0px) + 8px))',
    bottom: 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px))',
  }

  if (!remoteEnabled) {
    return null
  }

  return (
    <motion.div
      ref={remoteRef}
      className="fixed z-30"
      style={{
        ...positionStyle,
        x: remoteOffset.x,
        y: remoteOffset.y,
        touchAction: 'none',
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
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
            onMouseDown={handleDragMouseDown}
            onTouchStart={handleDragTouchStart}
            className="flex h-12 w-12 cursor-grab items-center justify-center rounded-full border backdrop-blur-md active:cursor-grabbing"
            style={{
              backgroundColor: 'var(--player-control-bg)',
              borderColor: 'var(--player-control-border)',
              color: 'var(--player-text)',
            }}
            aria-label="Open remote"
          >
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
            <div
              onMouseDown={handleDragMouseDown}
              onTouchStart={handleDragTouchStart}
              className="flex h-8 w-full cursor-grab items-center justify-center active:cursor-grabbing"
              style={{ color: 'var(--player-muted)' }}
              aria-label="Move remote"
              role="button"
              tabIndex={-1}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              </div>
            </div>

            <div className="h-px w-7" style={{ backgroundColor: 'var(--player-divider)' }} />

            {onPrevVideo && (
              <>
                <button
                  onClick={() => handleButtonClick(onPrevVideo)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: 'var(--player-text)' }}
                  aria-label="Previous video"
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
                <div className="h-px w-7" style={{ backgroundColor: 'var(--player-divider)' }} />
              </>
            )}

            <button
              onClick={() => handleButtonClick(handlePlayPause)}
              className="flex h-11 w-11 items-center justify-center"
              style={{ color: 'var(--player-text)' }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
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

            <div className="h-px w-7" style={{ backgroundColor: 'var(--player-divider)' }} />

            {onToggleFreeze && (
              <>
                <button
                  onClick={() => handleButtonClick(onToggleFreeze)}
                  disabled={!isFrozen && !canEnableFreeze}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{
                    color: isFrozen
                      ? 'var(--accent-text)'
                      : canEnableFreeze
                        ? 'var(--text-muted)'
                        : 'var(--player-faint)',
                  }}
                  aria-label={isFrozen ? 'Disable freeze' : 'Enable freeze'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M12 2a.75.75 0 0 1 .75.75v2.69l1.72-1.72a.75.75 0 1 1 1.06 1.06L12.75 7.56V11h3.44l2.78-2.78a.75.75 0 1 1 1.06 1.06l-1.72 1.72h2.69a.75.75 0 0 1 0 1.5h-2.69l1.72 1.72a.75.75 0 1 1-1.06 1.06L16.19 12.5H12.75v3.44l2.78 2.78a.75.75 0 1 1-1.06 1.06l-1.72-1.72v2.69a.75.75 0 0 1-1.5 0v-2.69l-1.72 1.72a.75.75 0 0 1-1.06-1.06l2.78-2.78V12.5H7.81l-2.78 2.78a.75.75 0 0 1-1.06-1.06l1.72-1.72H3a.75.75 0 0 1 0-1.5h2.69L3.97 9.28a.75.75 0 0 1 1.06-1.06L7.81 11h3.44V7.56L8.47 4.78a.75.75 0 0 1 1.06-1.06l1.72 1.72V2.75A.75.75 0 0 1 12 2Z" />
                  </svg>
                </button>
                <div className="h-px w-7" style={{ backgroundColor: 'var(--player-divider)' }} />
              </>
            )}

            {onNextVideo && (
              <>
                <button
                  onClick={() => handleButtonClick(onNextVideo)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: 'var(--player-text)' }}
                  aria-label="Next video"
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
                <div className="h-px w-7" style={{ backgroundColor: 'var(--player-divider)' }} />
              </>
            )}

            {!onNextVideo && (
              <div className="h-px w-7" style={{ backgroundColor: 'var(--player-divider)' }} />
            )}

            <button
              onClick={handleCollapse}
              className="flex h-11 w-11 items-center justify-center"
              style={{ color: 'var(--player-muted)' }}
              aria-label="Close remote"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
