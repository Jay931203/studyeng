'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'
import { getPersistedLocale, ERROR_STRINGS } from '@/lib/i18n-error'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const locale = getPersistedLocale()

  return (
    <html lang={locale === 'zh-TW' ? 'zh-Hant' : locale}>
      <body>
        <div className="h-dvh flex flex-col items-center justify-center bg-black px-8">
          <h2 className="text-xl font-bold text-white mb-2">
            {ERROR_STRINGS.title[locale]}
          </h2>
          <p className="text-gray-400 text-sm mb-8 text-center">
            {ERROR_STRINGS.description[locale]}
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-medium"
            >
              {ERROR_STRINGS.retry[locale]}
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white/10 border border-white/20 text-gray-400 rounded-xl text-sm font-medium"
            >
              {ERROR_STRINGS.home[locale]}
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
