import Link from 'next/link'

export default function BillingCancelPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">결제가 취소되었습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          다시 살펴본 뒤 원할 때 언제든 구독을 시작할 수 있습니다.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/profile"
            className="rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            프로필
          </Link>
          <Link
            href="/shorts"
            className="rounded-2xl bg-[var(--bg-secondary)] px-5 py-3 text-sm font-medium text-[var(--text-primary)]"
          >
            계속 보기
          </Link>
        </div>
      </div>
    </div>
  )
}
