import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        로그인에 실패했어요
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8 text-center">
        인증 과정에서 문제가 발생했습니다
      </p>
      <Link
        href="/login"
        className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl text-sm font-medium"
      >
        다시 시도
      </Link>
    </div>
  )
}
