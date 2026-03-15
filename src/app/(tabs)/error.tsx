'use client'

import { getPersistedLocale, ERROR_STRINGS } from '@/lib/i18n-error'

export default function TabsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void error
  const locale = getPersistedLocale()
  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {ERROR_STRINGS.title[locale]}
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8 text-center">
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
