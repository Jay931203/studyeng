'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

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

  return (
    <html lang="ko">
      <body>
        <div className="h-dvh flex flex-col items-center justify-center bg-black px-8">
          <h2 className="text-xl font-bold text-white mb-2">
            문제가 발생했어요
          </h2>
          <p className="text-gray-400 text-sm mb-8 text-center">
            일시적인 오류가 발생했습니다
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-medium"
            >
              다시 시도
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white/10 border border-white/20 text-gray-400 rounded-xl text-sm font-medium"
            >
              홈으로
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
