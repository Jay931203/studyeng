import Link from 'next/link'

const SUPPORT_EMAIL = 'support@shortee.app'

export default function SupportPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border-card)] bg-[var(--bg-primary)] px-4 py-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)]"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">지원</h1>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6 pb-20 text-sm leading-relaxed text-[var(--text-secondary)]">
        <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
            Support
          </p>
          <p className="mt-3 text-base font-semibold text-[var(--text-primary)]">
            앱 사용, 결제, 계정 문제를 여기서 안내합니다.
          </p>
          <p className="mt-2">
            문의 메일: <a className="text-[var(--accent-text)] underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-bold text-[var(--text-primary)]">빠른 도움</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>로그인이 안 되면 앱을 완전히 종료한 뒤 다시 열고 다시 시도해 주세요.</li>
            <li>구독 복원은 프로필의 멤버십 상세 페이지에서 다시 실행할 수 있습니다.</li>
            <li>계정 삭제는 프로필 페이지 하단에서 직접 진행할 수 있습니다.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-bold text-[var(--text-primary)]">정책</h2>
          <div className="mt-3 flex flex-col gap-3">
            <Link
              href="/terms"
              className="rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)]"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)]"
            >
              개인정보처리방침
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
