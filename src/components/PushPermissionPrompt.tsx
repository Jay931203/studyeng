'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { isNative } from '@/lib/platform'
import { usePushStore } from '@/stores/usePushStore'
import { useUserStore } from '@/stores/useUserStore'

/**
 * PushPermissionPrompt
 *
 * In-app card that slides up from the bottom of the screen to explain
 * push notifications before the browser prompt appears.
 *
 * Trigger: after the first video watch session ends (parent passes `visible` prop).
 * Never shows the browser prompt directly — user must tap "Allow" first.
 */
interface Props {
  /** Whether the parent deems this a good time to show the prompt */
  visible: boolean
  onClose?: () => void
}

export function PushPermissionPrompt({ visible, onClose }: Props) {
  const native = isNative()
  const { shouldShowPrompt, subscribe, dismiss, permission } = usePushStore()
  const streakDays = useUserStore((state) => state.streakDays)

  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (native) return

    if (visible && shouldShowPrompt()) {
      // Small delay so the prompt doesn't appear instantly on video end
      const t = window.setTimeout(() => setShow(true), 800)
      return () => window.clearTimeout(t)
    }

    const t = window.setTimeout(() => setShow(false), 0)
    return () => window.clearTimeout(t)
  }, [native, visible, shouldShowPrompt])

  // Auto-hide if permission already resolved
  useEffect(() => {
    if (permission === 'granted' || permission === 'denied') {
      const t = window.setTimeout(() => setShow(false), 0)
      return () => window.clearTimeout(t)
    }

    return undefined
  }, [permission])

  const handleAllow = async () => {
    setLoading(true)
    await subscribe()
    setLoading(false)
    setShow(false)
    onClose?.()
  }

  const handleDismiss = () => {
    dismiss()
    setShow(false)
    onClose?.()
  }

  if (native || !show) return null

  const streakLine =
    streakDays > 0
      ? `${streakDays}일 연속 중`
      : null

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Push notification permission"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ top: 'max(16px, env(safe-area-inset-top))' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-5 shadow-xl"
        style={{
          borderColor: 'var(--border-card)',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '0 14px 32px rgba(0, 0, 0, 0.34)',
        }}
      >
        {/* Icon row */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-[var(--accent-primary)]"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Keep your streak alive
            </p>
            {streakLine && (
              <p className="text-xs text-[var(--accent-primary)]">{streakLine}</p>
            )}
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          매일 알림을 받아 연속 기록을 이어가세요. 언제든 설정에서 끌 수 있어요.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-xl bg-[var(--bg-secondary)] py-2.5 text-xs font-medium text-[var(--text-secondary)]"
          >
            나중에
          </button>
          <button
            onClick={handleAllow}
            disabled={loading}
            className="flex-1 rounded-xl bg-[var(--accent-primary)] py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loading ? '...' : '알림 받기'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
