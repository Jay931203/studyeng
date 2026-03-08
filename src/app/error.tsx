'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void error
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        문제가 발생했어요
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8 text-center">
        일시적인 오류가 발생했습니다
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl text-sm font-medium"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] rounded-xl text-sm font-medium"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
