'use client'

export default function TabsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        문제가 발생했어요
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8 text-center">
        일시적인 오류가 발생했습니다
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl text-sm font-medium"
      >
        다시 시도
      </button>
    </div>
  )
}
