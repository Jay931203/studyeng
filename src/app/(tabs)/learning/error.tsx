'use client'

import { useEffect } from 'react'
import { getPersistedLocale, ERROR_STRINGS } from '@/lib/i18n-error'

export default function LearningError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[learning] error boundary caught:', error)
  }, [error])

  const locale = getPersistedLocale()
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-8">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        {ERROR_STRINGS.title[locale]}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] text-center">
        {ERROR_STRINGS.description[locale]}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl text-sm font-medium"
      >
        {ERROR_STRINGS.retry[locale]}
      </button>
    </div>
  )
}
