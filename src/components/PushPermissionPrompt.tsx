'use client'

import { useEffect, useState } from 'react'
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
  const { shouldShowPrompt, subscribe, dismiss, permission } = usePushStore()
  const streakDays = useUserStore((state) => state.streakDays)

  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && shouldShowPrompt()) {
      // Small delay so the prompt doesn't appear instantly on video end
      const t = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(t)
    }
    setShow(false)
  }, [visible, shouldShowPrompt])

  // Auto-hide if permission already resolved
  useEffect(() => {
    if (permission === 'granted' || permission === 'denied') {
      setShow(false)
    }
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

  if (!show) return null

  const streakLine =
    streakDays > 0
      ? `${streakDays}일 연속 중`
      : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Push notification permission"
      className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xl">
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
    </div>
  )
}
