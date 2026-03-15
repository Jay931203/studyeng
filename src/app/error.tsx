'use client'

import Link from 'next/link'
import { getPersistedLocale, ERROR_STRINGS } from '@/lib/i18n-error'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void error
  const locale = getPersistedLocale()
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {ERROR_STRINGS.title[locale]}
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8 text-center">
        {ERROR_STRINGS.description[locale]}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl text-sm font-medium"
        >
          {ERROR_STRINGS.retry[locale]}
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] rounded-xl text-sm font-medium"
        >
          {ERROR_STRINGS.home[locale]}
        </Link>
      </div>
    </div>
  )
}
